// ═══════════════════════════════════════════════════════════════════════
//  LE TERMINAL
//
//  Un tiroir en bas de l'écran, comme dans un éditeur. Il n'imite pas un
//  shell pour la décoration : il exécute réellement des commandes sur le
//  système de fichiers virtuel (src/data/fs.js) et pilote la page.
//
//  Ce que ça implique, et qui n'est pas gratuit :
//    • historique persistant, rappelé aux flèches ↑↓ ;
//    • complétion par Tab sur les commandes ET les chemins ;
//    • un pipe unique vers `grep`, le seul enchaînement réellement utile ;
//    • une suggestion quand la commande est mal tapée.
//
//  Accessibilité : l'écran est un `role="log"` en `aria-live="polite"`, la
//  saisie est un vrai `<input>` étiqueté, tout se fait au clavier, et rien
//  ici n'est indispensable pour lire le portfolio — la page reste complète
//  sans jamais ouvrir le terminal.
// ═══════════════════════════════════════════════════════════════════════

import { COMMANDS, parseLine, nearestCommand, escapeHtml } from './commands.js';
import { resolvePath, lookup, formatPath } from '../data/fs.js';
import { identity, host } from '../data/profile.js';
import { imageToAscii, asciiToPng } from './ascii.js';
import { t, tx, getLang } from './i18n.js';

const HISTORY_KEY = 'portfolio_history';
const MAX_HISTORY = 60;
const MAX_LINES = 500;

export function initShell(hooks) {
  const el = {
    term: document.getElementById('term'),
    screen: document.getElementById('term-screen'),
    input: document.getElementById('term-input'),
    prompt: document.getElementById('term-prompt'),
    close: document.getElementById('term-close'),
    hint: document.getElementById('term-hint'),
    barPath: document.getElementById('term-bar-path'),
    statusPath: document.getElementById('status-path'),
    statusMode: document.getElementById('status-mode')
  };
  if (!el.term) return null;

  let cwd = [];
  let history = loadHistory();
  let histIdx = history.length;
  let draft = '';
  const started = Date.now();

  // ─── Contexte passé aux commandes ───────────────────────────────────
  const ctx = {
    get root() { return hooks.fs(); },
    get cwd() { return cwd; },
    get lang() { return getLang(); },
    t,
    tx,
    setCwd(segs) { cwd = segs; refreshPrompt(); },
    navigate: (route, opts) => hooks.navigate(route, opts),
    setTheme: (v) => hooks.setTheme(v),
    setLang: (v) => hooks.setLang(v),
    print: () => window.print(),
    openUrl: (url) => { window.location.href = url; },
    matrix: () => hooks.matrix(),
    close: () => setOpen(false),
    clear: () => { el.screen.innerHTML = ''; },
    history: () => history.slice(),
    theme: () => document.documentElement.getAttribute('data-theme') || 'light',

    // Largeur utile de l'écran, en caractères.
    columns: () => {
      const { charWidth } = metrics();
      return Math.max(20, Math.floor((el.screen.clientWidth - 40) / charWidth));
    },

    // Le portrait en caractères. Renvoie null si aucune image n'est déposée :
    // l'appelant retombe alors sur son rendu de secours.
    ascii: async (cols, opts = {}) => {
      if (!identity.avatar) return null;
      try {
        return await imageToAscii(identity.avatar, cols, { charRatio: metrics().charRatio, ...opts });
      } catch {
        return null;
      }
    },

    // Dimensions de l'écran, pour un fond d'écran à la bonne taille.
    screen: () => ({
      width: Math.round(window.screen?.width * (window.devicePixelRatio || 1)) || 2560,
      height: Math.round(window.screen?.height * (window.devicePixelRatio || 1)) || 1440
    }),

    // Composition du dessin en image, aux couleurs du thème courant.
    png: (lines, opts) => {
      const css = getComputedStyle(document.documentElement);
      return asciiToPng(lines, {
        bg: css.getPropertyValue('--bg').trim() || '#101215',
        fg: css.getPropertyValue('--accent').trim() || '#7aa2f7',
        ...opts
      });
    },

    download: (dataUrl, filename) => {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },

    uptime: () => {
      const s = Math.floor((Date.now() - started) / 1000);
      return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
    }
  };

  // Mesure d'une vraie ligne de dessin : largeur d'un caractère et hauteur de
  // ligne. Deviner ces valeurs déforme le portrait — un caractère n'est pas
  // exactement deux fois plus haut que large, et l'interligne serré des lignes
  // de dessin change encore le rapport. On mesure donc dans les conditions
  // exactes du rendu, avec la même classe CSS.
  function metrics() {
    const probe = document.createElement('div');
    probe.className = 'term-line';
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    probe.innerHTML = `<span class="art">${'0'.repeat(50)}</span>`;
    el.screen.appendChild(probe);
    const charWidth = probe.querySelector('.art').getBoundingClientRect().width / 50;
    const lineHeight = probe.getBoundingClientRect().height;
    probe.remove();
    return {
      charWidth: charWidth || 8.4,
      lineHeight: lineHeight || 15,
      charRatio: charWidth ? lineHeight / charWidth : 2
    };
  }

  // ─── Sortie ─────────────────────────────────────────────────────────
  function push(lineObj) {
    const div = document.createElement('div');
    div.className = 'term-line' + (lineObj.cls ? ` ${lineObj.cls}` : '');
    if (lineObj.html != null) div.innerHTML = lineObj.html;
    else div.textContent = lineObj.text ?? '';
    el.screen.appendChild(div);
    // L'écran ne grandit pas indéfiniment : au-delà de MAX_LINES on jette
    // le plus ancien, sinon une session longue finit par ramer.
    while (el.screen.childElementCount > MAX_LINES) el.screen.firstElementChild.remove();
  }

  // Une sortie plus haute que l'écran est cadrée sur son DÉBUT, pas sur sa
  // fin : un portrait de cinquante lignes dont on ne verrait que le menton
  // n'apprend rien. Les sorties courtes gardent le comportement d'un shell —
  // on suit le bas.
  function write(lines) {
    const first = el.screen.lastElementChild;
    lines.forEach(push);
    const added = first ? first.nextElementSibling : el.screen.firstElementChild;
    if (added && el.screen.scrollHeight - added.offsetTop > el.screen.clientHeight) {
      el.screen.scrollTop = added.offsetTop - el.screen.offsetTop;
    } else {
      scrollDown();
    }
  }
  const scrollDown = () => { el.screen.scrollTop = el.screen.scrollHeight; };

  function promptHtml() {
    return `<span class="host">${escapeHtml(identity.handle)}@${escapeHtml(host)}</span>:<span>${escapeHtml(pathLabel())}</span>$&nbsp;`;
  }
  const pathLabel = () => (cwd.length ? `~/${cwd.join('/')}` : '~');

  function refreshPrompt() {
    el.prompt.innerHTML = promptHtml();
    // Le chemin s'affiche à deux endroits : dans la barre du tiroir, et dans
    // la barre de statut — qui reste visible même terminal fermé, et rappelle
    // que la page et le shell regardent le même dossier.
    if (el.barPath) el.barPath.textContent = pathLabel();
    if (el.statusPath) el.statusPath.textContent = pathLabel();
  }

  // ─── Exécution ──────────────────────────────────────────────────────
  function run(raw) {
    const trimmed = raw.trim();
    push({ html: `${promptHtml()}<span>${escapeHtml(trimmed)}</span>`, cls: 'is-cmd' });
    if (!trimmed) { scrollDown(); return; }

    remember(trimmed);

    const { name, args, pipe } = parseLine(trimmed);
    const cmd = COMMANDS[name];
    if (!cmd) {
      const guess = nearestCommand(name);
      write([
        { text: `${name}: ${t('shell.notfound')}`, cls: 'is-err' },
        ...(guess ? [{ text: `${t('shell.didyoumean')} ${guess}`, cls: 'is-dim' }] : [])
      ]);
      return;
    }

    let out = [];
    try {
      out = cmd.run(args, ctx) || [];
    } catch (e) {
      out = [{ text: `${name}: ${e.message}`, cls: 'is-err' }];
    }

    // Une commande peut renvoyer une promesse — `portrait` et `neofetch`
    // attendent le décodage d'une image. On finit le rendu quand elle résout,
    // sans bloquer la saisie entre-temps.
    if (out && typeof out.then === 'function') {
      out.then(finish).catch((e) => finish([{ text: `${name}: ${e.message}`, cls: 'is-err' }]));
      return;
    }
    finish(out);

    function finish(lines) {
      write(applyPipe(lines || [], pipe));
    }
  }

  // Pipe : seul `grep` est accepté à droite. Le reste serait du décor.
  function applyPipe(out, pipe) {
    if (pipe && pipe[0]) {
      if (pipe[0] !== 'grep') {
        out = [{ text: `${pipe[0]}: ${t('shell.notfound')} (| grep)`, cls: 'is-err' }];
      } else {
        const needle = (pipe[1] || '').toLowerCase();
        out = out.filter((l) => plainOf(l).toLowerCase().includes(needle));
        if (!out.length) out = [{ text: t('shell.matchesNone'), cls: 'is-dim' }];
      }
    }
    return out;
  }

  const plainOf = (l) => (l.html != null ? l.html.replace(/<[^>]*>/g, '') : (l.text || ''));

  // ─── Historique ─────────────────────────────────────────────────────
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
  }
  function remember(cmd) {
    if (history[history.length - 1] !== cmd) history.push(cmd);
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
    histIdx = history.length;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { /* quota : tant pis */ }
  }

  // ─── Complétion ─────────────────────────────────────────────────────
  // Premier mot → nom de commande. Sinon → chemin, relatif au cwd, avec
  // préfixe commun le plus long (comportement attendu d'un vrai shell).
  function complete(value) {
    const endsWithSpace = /\s$/.test(value);
    const tokens = value.split(/\s+/).filter(Boolean);
    const isFirst = tokens.length === 0 || (tokens.length === 1 && !endsWithSpace);

    if (isFirst) {
      const prefix = tokens[0] || '';
      const hits = Object.keys(COMMANDS).filter((c) => !COMMANDS[c].hidden && c.startsWith(prefix));
      return finish(hits, prefix, value, '');
    }

    const partial = endsWithSpace ? '' : tokens[tokens.length - 1];
    const head = endsWithSpace ? value : value.slice(0, value.length - partial.length);
    const slash = partial.lastIndexOf('/');
    const dirPart = slash >= 0 ? partial.slice(0, slash + 1) : '';
    const namePart = slash >= 0 ? partial.slice(slash + 1) : partial;
    const dirNode = lookup(ctx.root, resolvePath(cwd, dirPart || '.'));
    if (!dirNode || dirNode.type !== 'dir') return { value, hits: [] };

    const hits = dirNode.children
      .filter((c) => c.name.startsWith(namePart) && (namePart.startsWith('.') || !c.name.startsWith('.')))
      .map((c) => c.name + (c.type === 'dir' ? '/' : ''));
    return finish(hits, namePart, head + dirPart, '');
  }

  function finish(hits, prefix, head) {
    if (!hits.length) return { value: head + prefix, hits: [] };
    if (hits.length === 1) return { value: head + hits[0] + (hits[0].endsWith('/') ? '' : ' '), hits: [] };
    return { value: head + commonPrefix(hits), hits };
  }

  function commonPrefix(list) {
    let p = list[0];
    for (const s of list) { while (!s.startsWith(p)) p = p.slice(0, -1); }
    return p;
  }

  // ─── Clavier ────────────────────────────────────────────────────────
  el.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const value = el.input.value;
      el.input.value = '';
      draft = '';
      run(value);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const { value, hits } = complete(el.input.value);
      el.input.value = value;
      if (hits.length) {
        push({ html: `${promptHtml()}<span>${escapeHtml(el.input.value)}</span>`, cls: 'is-cmd' });
        push({ html: hits.map((h) => `<span class="${h.endsWith('/') ? 'dir' : 'file'}">${escapeHtml(h)}</span>`).join('   ') });
        scrollDown();
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx === history.length) draft = el.input.value;
      histIdx = Math.max(0, histIdx - 1);
      el.input.value = history[histIdx] ?? draft;
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      histIdx = Math.min(history.length, histIdx + 1);
      el.input.value = histIdx === history.length ? draft : history[histIdx];
      return;
    }
    if (e.key === 'l' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ctx.clear(); return; }
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      push({ html: `${promptHtml()}<span>${escapeHtml(el.input.value)}</span>^C`, cls: 'is-cmd' });
      el.input.value = '';
      scrollDown();
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  });

  // ─── Ouverture / fermeture ──────────────────────────────────────────
  let open = false;
  let greeted = false;

  function setOpen(next) {
    open = next;
    el.term.classList.toggle('is-open', open);
    el.term.setAttribute('aria-hidden', String(!open));
    refreshChrome();
    if (open) {
      if (!greeted) { greet(); greeted = true; }
      el.input.focus();
      scrollDown();
    } else {
      el.input.blur();
    }
    hooks.onToggle?.(open);
  }

  function greet() {
    write([
      { html: `<span class="h1">${escapeHtml(identity.name)}</span> — ${escapeHtml(tx(identity.role))}` },
      { text: t('shell.welcome'), cls: 'is-dim' },
      { text: t('shell.hint'), cls: 'is-dim' },
      { text: '' }
    ]);
  }

  el.close.addEventListener('click', () => setOpen(false));
  // Cliquer n'importe où dans le tiroir redonne le focus à la saisie —
  // sauf sur un lien, qu'on veut pouvoir suivre.
  el.term.addEventListener('mousedown', (e) => {
    if (e.target.closest('a, button')) return;
    if (open) setTimeout(() => el.input.focus(), 0);
  });

  // L'invite et l'indice sont rendus ici, pas dans le HTML : sinon ils
  // resteraient en français sur une page basculée en anglais avant la
  // première ouverture du terminal.
  function refreshChrome() {
    refreshPrompt();
    if (el.hint) el.hint.textContent = t('term.hint');
    if (el.statusMode) el.statusMode.textContent = open ? 'SHELL' : t('status.read');
  }
  refreshChrome();

  return {
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!open),
    isOpen: () => open,
    // La page pilote le shell dans l'autre sens : changer de section
    // repositionne le répertoire courant.
    syncCwd(segments) { cwd = segments; refreshPrompt(); },
    exec(cmdLine) { if (!open) setOpen(true); run(cmdLine); },
    refresh: refreshChrome,
    path: () => formatPath(cwd)
  };
}
