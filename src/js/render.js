// Rendu de la page à partir des données.
//
// Rien n'est écrit en dur dans index.html : le HTML n'est qu'une charpente de
// conteneurs vides. Changer profile.js change la page, le terminal, la palette
// et le CV imprimé d'un coup.
//
// Discipline de rendu, la même partout : des rangées séparées par un filet,
// jamais de carte ; du texte, jamais d'étiquette encadrée ; l'accent
// uniquement sur ce qui est actif ou chiffré.

import { identity, hero, about, experience, projects, stack, principles, contact } from '../data/profile.js';
import { buildFs, shortHash, lookup } from '../data/fs.js';
import { pick, slugify } from '../data/lang.js';
import { t, tx, getLang } from './i18n.js';

const $ = (sel) => document.querySelector(sel);

export function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Balisage inline minimal accepté dans les données : **appuyé**, *italique*,
// `code`. Volontairement pas de moteur Markdown — trois règles suffisent, et
// l'échappement passe AVANT, donc rien d'injectable ne survit.
export function inline(str) {
  return esc(str)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*(.+?)\*/g, '$1<em>$2</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

const STATUS_LABEL = {
  live: { fr: 'en ligne', en: 'live' },
  wip: { fr: 'en cours', en: 'in progress' },
  // « À venir » évite d'avoir à mentir : un projet qui n'a pas commencé
  // n'est ni en ligne ni en cours, et sa description est une intention.
  planned: { fr: 'à venir', en: 'planned' },
  archived: { fr: 'archivé', en: 'archived' }
};

const periodOf = (job) => `${job.start} — ${job.end || (getLang() === 'en' ? 'now' : 'aujourd’hui')}`;

// ─── Sommaire ─────────────────────────────────────────────────────────
// L'arborescence est dérivée du système de fichiers virtuel, pas d'une liste
// écrite à côté : les entrées affichées sont exactement les nœuds que le
// terminal explore. Un dossier porte un chevron et se déplie quand on est
// dedans — c'est ce qui fait de la colonne un explorateur plutôt qu'un menu.
const TREE = [
  { label: 'README.md', section: 'home' },
  { label: 'about.md', section: 'about' },
  { label: 'experience/', section: 'experience', dir: 'experience' },
  { label: 'projects/', section: 'projects', dir: 'projects' },
  { label: 'stack/', section: 'stack', dir: 'stack' },
  { label: 'contact.md', section: 'contact' }
];

// Les enfants réels d'un dossier du VFS, et la route de chacun. On ne garde
// que les fichiers qui mènent quelque part : `README.md` doublonnerait avec
// le dossier lui-même.
function treeChildren(dirName) {
  const node = lookup(currentFs(), [dirName]);
  if (!node || node.type !== 'dir') return [];
  return node.children
    .filter((c) => !c.name.startsWith('.') && c.name !== 'README.md')
    .map((c) => ({
      label: c.name + (c.type === 'dir' ? '/' : ''),
      route: c.route || { section: dirName }
    }));
}

function treeRow({ label, active, depth, route, caret }) {
  const attrs = [
    `data-nav="${esc(route.section)}"`,
    route.slug ? `data-slug="${esc(route.slug)}"` : '',
    route.anchor ? `data-anchor="${esc(route.anchor)}"` : '',
    `data-depth="${depth}"`,
    active ? ' aria-current="page"' : ''
  ].filter(Boolean).join(' ');
  return `<button class="tree-item${active ? ' is-active' : ''}" ${attrs}>` +
    `<span class="tree-caret" aria-hidden="true">${caret}</span>${esc(label)}</button>`;
}

export function renderTree(route) {
  const el = $('#tree');
  if (!el) return;

  el.innerHTML = TREE.map((item) => {
    const inside = route.section === item.section;
    const row = treeRow({
      label: item.label,
      active: inside && !route.slug,
      depth: 0,
      route: { section: item.section },
      caret: item.dir ? (inside ? '▾' : '▸') : ' '
    });
    if (!item.dir || !inside) return row;

    // Déplié : les enfants réels du dossier, dans l'ordre du VFS.
    return row + treeChildren(item.dir).map((child) => treeRow({
      label: child.label,
      active: !!(route.slug && child.route.slug === route.slug),
      depth: 1,
      route: child.route,
      caret: ' '
    })).join('');
  }).join('');
}

// ─── Accueil ──────────────────────────────────────────────────────────
function renderHome() {
  $('#brand-name').textContent = identity.handle;
  $('#brand-role').textContent = tx(identity.role);

  const av = $('#availability');
  av.dataset.state = identity.availability;
  av.textContent = tx(identity.availabilityLabel[identity.availability]);

  $('#hero-kicker').textContent = tx(hero.kicker);
  // Seule exception à l'échappement : le titre et la lede portent volontairement
  // du balisage (<br>, <em>, <span class="emphasis">). C'est de la mise en page
  // définie dans notre propre fichier de données, jamais une saisie utilisateur —
  // partout ailleurs, `esc()`/`inline()` échappent avant tout.
  $('#hero-title').innerHTML = tx(hero.title);
  $('#hero-lede').innerHTML = tx(hero.lede);

  // Chaque fragment est un <span> : deux nœuds de texte encadrant un
  // séparateur masqué fusionneraient en un seul élément flex, et la ligne
  // refuserait de s'empiler sur mobile.
  $('#hero-identity').innerHTML = [
    `<span>${esc(identity.name)}</span>`,
    '<span class="sep">—</span>',
    `<span>${esc(tx(identity.location))}</span>`
  ].join('');

  $('#principles').innerHTML = principles.map((p, i) => `
    <li class="principle">
      <span class="principle-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <span>
        <span class="principle-name">${esc(tx(p.name))}</span>
        <span class="principle-desc">${inline(tx(p.desc))}</span>
      </span>
    </li>`).join('');

  $('#facts').innerHTML = about.facts.map((f) => `
    <dt>${esc(tx(f.label))}</dt>
    <dd>${esc(tx(f.value))}</dd>`).join('');
}

// ─── À propos ─────────────────────────────────────────────────────────
function renderAbout() {
  $('#about-title').textContent = tx(about.title);
  $('#about-body').innerHTML = tx(about.body).map((p) => `<p>${inline(p)}</p>`).join('');

  const note = $('#portrait-note');
  if (note) note.innerHTML = `${esc(tx(identity.avatarNote))} ${esc(t('portrait.flip'))}`;
}

// ─── Parcours ─────────────────────────────────────────────────────────
function renderExperience() {
  $('#gitlog').innerHTML = experience.map((job, i) => `
    <article class="commit${i === 0 ? ' is-head' : ''}" id="job-${esc(job.slug)}">
      <p class="commit-meta">
        <span class="commit-hash">${shortHash(job.slug)}</span>
        <span>${esc(periodOf(job))}</span>
        <span>${esc(tx(job.place))}</span>
      </p>
      <h2 class="commit-title">${esc(tx(job.role))} <span class="commit-company">@ ${esc(tx(job.company))}</span></h2>
      <p class="commit-summary">${inline(tx(job.summary))}</p>
      <ul class="diff">
        ${tx(job.highlights).map((h) => `<li><span class="diff-plus" aria-hidden="true">+</span><span>${inline(h)}</span></li>`).join('')}
      </ul>
      <p class="tags">${esc(job.stack.join(' · '))}</p>
    </article>`).join('');
}

// ─── Projets ──────────────────────────────────────────────────────────
function projectListHtml() {
  return `
    <div class="section-head">
      <p class="kicker">projects/</p>
      <h1 class="section-title">${esc(t('projects.title'))}</h1>
      <p class="section-lede">${esc(t('projects.lede'))}</p>
    </div>
    <div class="project-list">
      ${projects.map((p) => `
        <button class="project-row" data-nav="projects" data-slug="${esc(p.slug)}">
          <span class="project-year">${esc(p.year)}</span>
          <span class="project-name">${esc(p.name)}</span>
          <span class="project-go" aria-hidden="true">→</span>
          <span class="project-line">${esc(tx(p.tagline))}</span>
          <span class="project-meta">${esc(tx(STATUS_LABEL[p.status]))} · ${esc(p.stack.join(' · '))}</span>
        </button>`).join('')}
    </div>`;
}

function projectDetailHtml(p) {
  return `
    <div class="project-detail">
      <button class="back" data-nav="projects">
        <span aria-hidden="true">←</span> ${esc(t('projects.back'))}
      </button>
      <div class="section-head">
        <p class="kicker">projects/${esc(p.slug)}</p>
        <h1 class="section-title">${esc(p.name)}</h1>
        <p class="section-lede">${esc(tx(p.tagline))}</p>
      </div>

      <p class="tags">${esc(p.year)} · <span class="status" data-status="${esc(p.status)}">${esc(tx(STATUS_LABEL[p.status]))}</span></p>

      <div class="prose" style="margin-top: var(--space-6)"><p>${inline(tx(p.summary))}</p></div>

      ${p.metrics?.length ? `<p class="metrics">${p.metrics.map((m) =>
        `<b>${esc(m.value)}</b> ${esc(tx(m.label))}`).join('<span class="sep">·</span>')}</p>` : ''}

      <section class="block">
        <h2 class="block-title">${esc(t('highlights.title'))}</h2>
        <ul class="diff">
          ${tx(p.highlights).map((h) => `<li><span class="diff-plus" aria-hidden="true">+</span><span>${inline(h)}</span></li>`).join('')}
        </ul>
        <p class="tags">${esc(p.stack.join(' · '))}</p>
        ${p.links.length ? `<div class="links-row">${p.links.map((l) => `
          <a class="cta" href="${esc(l.url)}" target="_blank" rel="noopener">
            ${esc(tx(l.label))} <span class="cta-arrow" aria-hidden="true">↗</span>
          </a>`).join('')}</div>` : ''}
      </section>
    </div>`;
}

function renderProjects(route) {
  const project = route.slug ? projects.find((p) => p.slug === route.slug) : null;
  $('#projects-body').innerHTML = project ? projectDetailHtml(project) : projectListHtml();
}

// ─── Stack ────────────────────────────────────────────────────────────
// Un glossaire, pas un palmarès : chaque entrée porte une phrase qui dit ce
// que l'auteur en sait vraiment. C'est plus honnête qu'une jauge, et plus
// informatif — « quatre sur cinq » ne veut rien dire pour celui qui lit.
function renderStack() {
  $('#stack-body').innerHTML = `<div class="stack-list">${stack.map((g) => `
    <div class="stack-group" id="stack-${esc(slugify(pick(g.group, 'en')))}">
      <span class="stack-label">${esc(tx(g.group))}</span>
      <div class="stack-items">
        ${g.items.map((i) => `<p class="stack-item">
          <span class="stack-item-name">${esc(tx(i.name))}</span>
          <span class="stack-item-note">${esc(tx(i.note))}</span>
        </p>`).join('')}
      </div>
    </div>`).join('')}</div>`;
}

// ─── Contact ──────────────────────────────────────────────────────────
function renderContact() {
  $('#contact-title').textContent = tx(contact.title);
  $('#contact-lede').textContent = tx(contact.lede);
  $('#contact-links').innerHTML = identity.links.map((l) => `
    <a class="contact-link" href="${esc(l.url)}"${l.url.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener"'}>
      <span class="contact-label">${esc(l.label)}</span>
      <span class="contact-handle">${esc(l.handle)}</span>
      <span class="contact-go" aria-hidden="true">↗</span>
    </a>`).join('');
  $('#contact-note').textContent = tx(contact.note);
  $('#foot-left').textContent = t('foot.built');
  $('#foot-right').textContent = `© ${new Date().getFullYear()} ${identity.name}`;
}

// ─── Orchestration ────────────────────────────────────────────────────
export function renderAll(route) {
  renderHome();
  renderAbout();
  renderExperience();
  renderProjects(route);
  renderStack();
  renderContact();
  renderTree(route);
}

// Seules les parties dépendantes de la route.
export function renderRoute(route) {
  renderProjects(route);
  renderTree(route);
}

// Le shell a besoin de l'arborescence dans la langue courante.
export const currentFs = () => buildFs(getLang());
