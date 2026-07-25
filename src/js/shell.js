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
    barPath: document.getElementById('term-bar-path')
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
    uptime: () => {
      const s = Math.floor((Date.now() - started) / 1000);
      return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
    }
  };

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

  const write = (lines) => { lines.forEach(push); scrollDown(); };
  const scrollDown = () => { el.screen.scrollTop = el.screen.scrollHeight; };

  function promptHtml() {
    return `<span class="host">${escapeHtml(identity.handle)}@${escapeHtml(host)}</span>:<span>${escapeHtml(pathLabel())}</span>$&nbsp;`;
  }
  const pathLabel = () => (cwd.length ? `~/${cwd.join('/')}` : '~');

  function refreshPrompt() {
    el.prompt.innerHTML = promptHtml();
    if (el.barPath) el.barPath.textContent = pathLabel();
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

    // Pipe : seul `grep` est accepté à droite. Le reste serait du décor.
    if (pipe && pipe[0]) {
      if (pipe[0] !== 'grep') {
        out = [{ text: `${pipe[0]}: ${t('shell.notfound')} (| grep)`, cls: 'is-err' }];
      } else {
        const needle = (pipe[1] || '').toLowerCase();
        out = out.filter((l) => plainOf(l).toLowerCase().includes(needle));
        if (!out.length) out = [{ text: t('shell.matchesNone'), cls: 'is-dim' }];
      }
    }
    write(out);
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
