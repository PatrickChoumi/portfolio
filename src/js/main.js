// ═══════════════════════════════════════════════════════════════════════
//  ORCHESTRATION
//
//  Le fil conducteur du site tient en une phrase : une route, deux vues.
//  `navigate()` est le seul point de passage — il met à jour la section
//  affichée, l'URL, le sommaire, et le répertoire courant du terminal. Quelle
//  que soit l'origine du mouvement (clic, palette, commande `cd`, bouton
//  Précédent du navigateur), tout converge ici.
//
//  Le terminal reste un bonus : rien n'oblige à l'ouvrir pour lire le site.
//  Il s'annonce en une ligne sous l'accroche, un bouton dans le sommaire, et
//  le rappel de la barre de statut — jamais par une modale ou une étape
//  obligée.
// ═══════════════════════════════════════════════════════════════════════

import { initTheme, toggleTheme, setTheme } from './theme.js';
import { initI18n, setLang, toggleLang, getLang, onLangChange, t } from './i18n.js';
import { initRouter } from './router.js';
import { renderAll, renderRoute, currentFs } from './render.js';
import { initRepl } from './repl.js';
import { initShell } from './shell.js';
import { initPalette } from './palette.js';
import { initReveal, matrixRain } from './effects.js';
import { loadImage, imageToAscii } from './ascii.js';
import { PORTRAIT_COLS } from './commands.js';
import { pathForRoute } from '../data/fs.js';
import { identity } from '../data/profile.js';

// L'arborescence dépend de la langue : on la reconstruit à chaque bascule
// plutôt que de la recalculer à chaque commande.
let fs = null;
const refreshFs = () => { fs = currentFs(); return fs; };

let route = { section: 'home' };
let shell = null;
let palette = null;
let router = null;

// ─── Navigation ───────────────────────────────────────────────────────
function navigate(next, opts = {}) {
  if (!next?.section) return;
  route = { section: next.section, slug: next.slug };

  document.querySelectorAll('main .section').forEach((s) => {
    s.classList.toggle('is-active', s.id === route.section);
  });

  renderRoute(route);
  if (!opts.fromHistory) router?.set(route);

  // Le terminal suit la page (et réciproquement, via la commande `cd`).
  if (!opts.silent) shell?.syncCwd(pathForRoute(route));

  closeSidebar();

  // Un lien profond doit atterrir sur le contenu, pas en haut d'une page
  // qu'il faut ensuite parcourir.
  if (next.anchor) {
    document.getElementById(next.anchor)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  } else if (!opts.initial) {
    window.scrollTo({ top: 0, behavior: opts.fromHistory ? 'auto' : 'smooth' });
  }

  initReveal();
}

// ─── Sommaire mobile ──────────────────────────────────────────────────
const sidebar = () => document.getElementById('sidebar');
const scrim = () => document.getElementById('nav-scrim');

function openSidebar() {
  sidebar().classList.add('is-open');
  scrim().classList.remove('hidden');
  document.getElementById('nav-toggle')?.setAttribute('aria-expanded', 'true');
}
function closeSidebar() {
  sidebar()?.classList.remove('is-open');
  scrim()?.classList.add('hidden');
  document.getElementById('nav-toggle')?.setAttribute('aria-expanded', 'false');
}

// ─── Démarrage ────────────────────────────────────────────────────────
function boot() {
  initTheme();
  initI18n();
  refreshFs();

  // Le routeur est branché tout de suite, mais `start()` n'est appelé qu'une
  // fois le DOM peuplé : appliquer une route à des conteneurs vides ne
  // mènerait nulle part.
  router = initRouter((r, opts) => navigate(r, opts));

  renderAll(route);
  initRepl();
  initReveal();

  shell = initShell({
    fs: () => fs,
    navigate: (r, opts) => navigate(r, opts),
    setTheme: (v) => (v === 'dark' || v === 'light' ? setTheme(v) : toggleTheme()),
    setLang: (v) => { setLang(v === 'en' || v === 'fr' ? v : (getLang() === 'fr' ? 'en' : 'fr')); return getLang(); },
    matrix: () => matrixRain(),
    onToggle: (open) => { if (open) closeSidebar(); }
  });

  palette = initPalette({
    fs: () => fs,
    navigate: (r) => navigate(r),
    exec: (cmd) => shell?.exec(cmd)
  });

  router.start();
  wireEvents();
  revealAvatar();
}

// Le portrait n'apparaît — dans le sommaire comme sur la page « à propos » —
// que si le fichier existe vraiment : pas d'image cassée tant que rien n'a
// été déposé dans public/.
async function revealAvatar() {
  if (!identity.avatar) return;
  try {
    await loadImage(identity.avatar);
  } catch {
    return; // aucune photo : le monogramme « ~/ » de la marque suffit.
  }

  const medallion = document.getElementById('avatar');
  const medallionImg = document.getElementById('avatar-img');
  if (medallion && medallionImg) {
    medallionImg.src = identity.avatar;
    medallion.hidden = false;
  }

  const figure = document.getElementById('portrait');
  const img = document.getElementById('portrait-img');
  if (figure && img) {
    img.src = identity.avatar;
    figure.hidden = false;
  }
}

// La bascule image ↔ caractères, sur la page « à propos ». Le dessin n'est
// calculé qu'au premier retournement : tant que personne ne clique, on ne
// décode rien.
function wirePortraitFlip() {
  const flip = document.getElementById('portrait-flip');
  const pre = document.getElementById('portrait-ascii');
  if (!flip || !pre) return;

  flip.addEventListener('click', async () => {
    const open = !flip.classList.contains('is-flipped');
    if (open && !pre.textContent) {
      try {
        // Même largeur qu'au terminal — c'est le rendu qui a été calibré, et
        // le seul qui tienne dans 190 px sans être rogné. Le rapport de
        // caractère passé ici est celui du CSS (interligne 1,05 sur une chasse
        // de 0,6) : sans lui, le dessin sortirait étiré en hauteur.
        pre.textContent = (await imageToAscii(identity.avatar, PORTRAIT_COLS, { charRatio: 1.05 / 0.6 })).join('\n');
      } catch {
        return;
      }
    }
    flip.classList.toggle('is-flipped', open);
    flip.setAttribute('aria-pressed', String(open));
  });
}

// ─── Événements ───────────────────────────────────────────────────────
function wireEvents() {
  // Toute navigation passe par un `data-nav` — un seul écouteur pour le
  // sommaire, les rangées de projets et les liens du hero.
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-nav]');
    if (!target) return;
    e.preventDefault();
    navigate({ section: target.dataset.nav, slug: target.dataset.slug, anchor: target.dataset.anchor });
  });

  document.getElementById('btn-lang')?.addEventListener('click', () => toggleLang());
  document.getElementById('btn-search')?.addEventListener('click', () => palette?.open());
  document.getElementById('btn-term')?.addEventListener('click', () => shell?.toggle());
  document.getElementById('status-term')?.addEventListener('click', () => shell?.toggle());
  // Cliquer le portrait l'ouvre en caractères : le pont entre les deux vues,
  // appliqué au visage.
  document.getElementById('avatar')?.addEventListener('click', () => shell?.exec('portrait'));
  document.getElementById('hint-term')?.addEventListener('click', () => shell?.open());
  document.getElementById('nav-toggle')?.addEventListener('click', () => {
    sidebar().classList.contains('is-open') ? closeSidebar() : openSidebar();
  });
  scrim()?.addEventListener('click', closeSidebar);
  wirePortraitFlip();

  // Le changement de langue reconstruit tout ce qui porte du texte : page,
  // arborescence virtuelle, REPL, invite du shell.
  onLangChange(() => {
    refreshFs();
    renderAll(route);
    initRepl();
    initReveal();
    shell?.refresh();
    paintStatusHint();
  });

  document.addEventListener('keydown', (e) => {
    const typing = e.target.matches('input, textarea, [contenteditable]');

    // Palette : Ctrl/⌘ + K, même en cours de saisie (c'est un raccourci
    // global attendu, comme dans un éditeur).
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette?.toggle();
      return;
    }

    if (typing) return;

    // Ouvrir le terminal : ` (QWERTY) ou ² (AZERTY) — la touche est au même
    // endroit physique sur les deux dispositions.
    if (e.key === '`' || e.key === '²') { e.preventDefault(); shell?.toggle(); return; }

    // « ? » : l'aide, là où on la cherche.
    if (e.key === '?') { e.preventDefault(); shell?.exec('help'); return; }

    if (e.key === 'Escape') { closeSidebar(); shell?.close(); }
  });
}

// Le rappel de raccourcis dépend de la plateforme : afficher « ⌘K » à
// quelqu'un sous Linux est une petite trahison.
function paintStatusHint() {
  const el = document.getElementById('status-hint');
  if (!el) return;
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  el.textContent = t('status.hint').replace('⌘K', mac ? '⌘K' : 'Ctrl K');
}

document.addEventListener('DOMContentLoaded', () => {
  boot();
  paintStatusHint();
});
