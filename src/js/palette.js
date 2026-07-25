// Palette de commandes (Ctrl/⌘ K) — le pont entre les deux vues.
//
// Elle indexe trois choses : les sections de la page, les fichiers du système
// virtuel, et les commandes du shell. Choisir un fichier l'ouvre dans la page
// quand il a une route, et sinon l'affiche au terminal (`cat`). Choisir une
// commande la joue. Une seule zone de saisie pour tout le site.

import { walk } from '../data/fs.js';
import { COMMANDS } from './commands.js';
import { projects, identity } from '../data/profile.js';
import { t, tx } from './i18n.js';
import { esc } from './render.js';

// Correspondance approximative : les caractères de la requête doivent
// apparaître dans l'ordre. Les suites contiguës valent plus cher — taper
// « proj » doit remonter « projects/ » avant « p…r…o…j ».
export function fuzzy(query, text) {
  if (!query) return 1;
  const q = query.toLowerCase();
  const s = text.toLowerCase();
  let qi = 0, score = 0, last = -2;
  for (let i = 0; i < s.length && qi < q.length; i++) {
    if (s[i] !== q[qi]) continue;
    score += i - last === 1 ? 6 : 1;
    if (i === 0) score += 4;
    last = i;
    qi++;
  }
  return qi === q.length ? score : 0;
}

export function initPalette(hooks) {
  const overlay = document.createElement('div');
  overlay.className = 'palette-overlay';
  overlay.innerHTML = `
    <div class="palette" role="dialog" aria-modal="true" aria-label="${esc(t('aria.palette'))}">
      <div class="palette-input-row">
        <span class="palette-icon" aria-hidden="true">⌕</span>
        <input class="palette-input" type="text" autocomplete="off" spellcheck="false" />
      </div>
      <div class="palette-results" role="listbox"></div>
      <div class="palette-foot">
        <span class="pf-nav"></span><span class="pf-open"></span><span class="pf-close"></span>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('.palette-input');
  const results = overlay.querySelector('.palette-results');
  let entries = [];
  let filtered = [];
  let selected = 0;
  let isOpen = false;

  const SECTIONS = [
    { id: 'home', label: 'README.md' },
    { id: 'about', label: 'about.md' },
    { id: 'experience', label: 'experience/' },
    { id: 'projects', label: 'projects/' },
    { id: 'stack', label: 'stack/' },
    { id: 'contact', label: 'contact.md' }
  ];

  function buildIndex() {
    entries = [];

    SECTIONS.forEach((s) => entries.push({
      kind: 'section', icon: '◆', title: s.label, desc: t(`nav.${s.id}`, ''),
      run: () => hooks.navigate({ section: s.id })
    }));

    projects.forEach((p) => entries.push({
      kind: 'section', icon: '▸', title: `projects/${p.slug}`, desc: tx(p.tagline),
      run: () => hooks.navigate({ section: 'projects', slug: p.slug })
    }));

    walk(hooks.fs()).forEach(({ node, path }) => {
      if (node.type !== 'file' || node.name.startsWith('.')) return;
      const full = path.join('/');
      entries.push({
        kind: 'file', icon: '·', title: full, desc: '',
        run: () => (node.route ? hooks.navigate(node.route) : hooks.exec(`cat /${full}`))
      });
    });

    Object.entries(COMMANDS).forEach(([name, cmd]) => {
      if (cmd.hidden) return;
      entries.push({
        kind: 'cmd', icon: '›', title: name, desc: tx(cmd.usage),
        run: () => hooks.exec(name)
      });
    });

    identity.links.forEach((l) => entries.push({
      kind: 'link', icon: '↗', title: l.label, desc: l.handle,
      run: () => window.open(l.url, l.url.startsWith('mailto:') ? '_self' : '_blank', 'noopener')
    }));
  }

  function render() {
    if (!filtered.length) {
      results.innerHTML = `<p class="palette-empty">${esc(t('palette.empty'))}</p>`;
      return;
    }
    results.innerHTML = filtered.map((e, i) => `
      <button class="palette-item${i === selected ? ' is-active' : ''}" data-idx="${i}" role="option" aria-selected="${i === selected}">
        <span class="palette-item-icon" aria-hidden="true">${e.icon}</span>
        <span>
          <span class="palette-item-title">${esc(e.title)}</span>
          ${e.desc ? `<span class="palette-item-desc">${esc(e.desc)}</span>` : ''}
        </span>
        <span class="palette-item-kind">${esc(t(`palette.kind.${e.kind}`))}</span>
      </button>`).join('');
    results.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
  }

  function filter(query) {
    filtered = entries
      .map((e) => ({ e, score: Math.max(fuzzy(query, e.title), fuzzy(query, e.desc) * 0.4) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((r) => r.e);
    selected = 0;
  }

  function open() {
    buildIndex();
    input.placeholder = t('palette.placeholder');
    overlay.querySelector('.pf-nav').textContent = t('palette.nav');
    overlay.querySelector('.pf-open').textContent = t('palette.open');
    overlay.querySelector('.pf-close').textContent = t('palette.close');
    overlay.classList.add('is-open');
    isOpen = true;
    input.value = '';
    filter('');
    render();
    setTimeout(() => input.focus(), 10);
  }

  function close() {
    overlay.classList.remove('is-open');
    isOpen = false;
    input.blur();
  }

  function choose(i) {
    const entry = filtered[i];
    if (!entry) return;
    close();
    entry.run();
  }

  input.addEventListener('input', () => { filter(input.value); render(); });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); selected = Math.min(filtered.length - 1, selected + 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selected = Math.max(0, selected - 1); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(selected); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  });

  results.addEventListener('click', (e) => {
    const btn = e.target.closest('.palette-item');
    if (btn) choose(Number(btn.dataset.idx));
  });

  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });

  return { open, close, toggle: () => (isOpen ? close() : open()), isOpen: () => isOpen };
}
