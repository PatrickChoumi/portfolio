// ═══════════════════════════════════════════════════════════════════════
//  ORCHESTRATION
//
//  Le fil conducteur du site tient en une phrase : une route, deux vues.
//  `navigate()` est le seul point de passage — il met à jour la section
//  affichée, l'URL, l'explorateur, les onglets, et le répertoire courant du
//  terminal. Quelle que soit l'origine du mouvement (clic, palette, commande
//  `cd`, bouton Précédent du navigateur), tout converge ici.
// ═══════════════════════════════════════════════════════════════════════

import { initTheme, toggleTheme, setTheme } from './theme.js';
import { initI18n, setLang, toggleLang, getLang, t, onLangChange } from './i18n.js';
import { initRouter } from './router.js';
import { renderAll, renderRoute, paintGutters, currentFs } from './render.js';
import { initRepl } from './repl.js';
import { initShell } from './shell.js';
import { initPalette } from './palette.js';
import { initReveal, matrixRain } from './effects.js';
import { runBoot } from './boot.js';
import { pathForRoute } from '../data/fs.js';

// L'arborescence dépend de la langue : on la reconstruit à chaque bascule
// plutôt que de la recalculer à chaque commande.
let fs = null;
const refreshFs = () => { fs = currentFs(); return fs; };

let route = { section: 'home' };
let shell = null;
let palette = null;
let router = null;

// ─── Navigation ───────────────────────────────────────────────────────
function showSection(next) {
  document.querySelectorAll('main .section').forEach((s) => {
    s.classList.toggle('is-active', s.id === next.section);
  });
}

function navigate(next, opts = {}) {
  if (!next?.section) return;
  route = { section: next.section, slug: next.slug };

  showSection(route);
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
  requestAnimationFrame(paintGutters);
}

// ─── Barre latérale mobile ────────────────────────────────────────────
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

  // Le routeur est branché tout de suite, mais `start()` n'est appelé
  // qu'une fois le DOM peuplé : appliquer une route à des conteneurs vides
  // ne mènerait nulle part.
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

  // Deep-link : on applique l'URL courante maintenant que tout est prêt.
  const startRoute = router.start();
  runBoot({ deepLink: startRoute.section !== 'home' });

  wireEvents();
  requestAnimationFrame(paintGutters);
}

// ─── Événements ───────────────────────────────────────────────────────
function wireEvents() {
  // Toute navigation passe par un `data-nav` — un seul écouteur pour
  // l'explorateur, les onglets, les cartes projet et les liens du hero.
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-nav]');
    if (!target) return;
    e.preventDefault();
    navigate({ section: target.dataset.nav, slug: target.dataset.slug });
  });

  document.getElementById('btn-lang')?.addEventListener('click', () => toggleLang());
  document.getElementById('btn-search')?.addEventListener('click', () => palette?.open());
  document.getElementById('status-term')?.addEventListener('click', () => shell?.toggle());
  document.getElementById('cta-term')?.addEventListener('click', () => shell?.open());
  document.getElementById('nav-toggle')?.addEventListener('click', () => {
    sidebar().classList.contains('is-open') ? closeSidebar() : openSidebar();
  });
  scrim()?.addEventListener('click', closeSidebar);

  // Le changement de langue reconstruit tout ce qui porte du texte : page,
  // arborescence virtuelle, REPL, invite du shell.
  onLangChange(() => {
    refreshFs();
    renderAll(route);
    initRepl();
    initReveal();
    shell?.refresh();
    requestAnimationFrame(paintGutters);
  });

  window.addEventListener('resize', debounce(paintGutters, 150));

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

function debounce(fn, ms) {
  let id;
  return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); };
}

// Le hint de la barre de statut dépend de la plateforme : afficher « ⌘K »
// à quelqu'un sous Linux est une petite trahison.
function platformHint() {
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  return t('status.hint').replace('⌘K', mac ? '⌘K' : 'Ctrl K');
}

document.addEventListener('DOMContentLoaded', () => {
  boot();
  const hint = document.getElementById('status-hint');
  if (hint) {
    hint.textContent = platformHint();
    onLangChange(() => { hint.textContent = platformHint(); });
  }
  // Les polices arrivent après le premier rendu : la hauteur du texte change
  // au `load`, donc la gouttière doit être repeinte à ce moment-là.
  window.addEventListener('load', () => requestAnimationFrame(paintGutters));
});
