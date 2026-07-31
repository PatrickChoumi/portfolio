// Rendu de la page à partir des données.
//
// Rien de ce qui suit n'est écrit en dur dans index.html : le HTML n'est
// qu'une charpente de conteneurs vides. Changer profile.js change la page,
// le terminal, la palette et le CV imprimé d'un coup.

import { identity, hero, about, experience, projects, stack, principles, contact } from '../data/profile.js';
import { buildFs, shortHash } from '../data/fs.js';
import { t, tx, getLang } from './i18n.js';

// ─── Utilitaires ──────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);

export function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Balisage inline minimal accepté dans les données : **gras**, *italique*,
// `code`. Volontairement pas de moteur Markdown — trois règles suffisent, et
// l'échappement passe AVANT, donc rien d'injectable ne survit.
export function inline(str) {
  return esc(str)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*(.+?)\*/g, '$1<em>$2</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

// « planned » n'est pas un statut de confort : un projet qui n'a pas commencé
// n'est ni en ligne ni en cours, et l'annoncer autrement serait un mensonge
// que la page afficherait en gras.
const STATUS_LABEL = {
  live: { fr: 'en ligne', en: 'live' },
  wip: { fr: 'en cours', en: 'in progress' },
  planned: { fr: 'à venir', en: 'planned' },
  archived: { fr: 'archivé', en: 'archived' }
};

const periodOf = (job) => `${job.start} → ${job.end || (getLang() === 'en' ? 'now' : 'aujourd’hui')}`;

// ─── Barre latérale : l'arborescence ──────────────────────────────────
// L'explorateur reprend la structure du système de fichiers virtuel, pour
// que la page et le shell parlent exactement du même objet.
const TREE_ITEMS = [
  { icon: '◆', label: 'README.md', section: 'home', depth: 0 },
  { icon: '·', label: 'about.md', section: 'about', depth: 0 },
  { icon: '▸', label: 'experience/', section: 'experience', depth: 0, count: () => experience.length },
  { icon: '▸', label: 'projects/', section: 'projects', depth: 0, count: () => projects.length },
  { icon: '▸', label: 'stack/', section: 'stack', depth: 0, count: () => stack.length },
  { icon: '·', label: 'contact.md', section: 'contact', depth: 0 }
];

export function renderTree(route) {
  const el = $('#tree');
  if (!el) return;
  const rows = TREE_ITEMS.map((item) => {
    const active = route.section === item.section;
    const count = item.count ? `<span class="tree-count">${item.count()}</span>` : '';
    return `<button class="tree-item${active ? ' is-active' : ''}" data-nav="${item.section}" data-depth="${item.depth}"${active ? ' aria-current="page"' : ''}>
      <span class="tree-icon" aria-hidden="true">${item.icon}</span><span>${esc(item.label)}</span>${count}
    </button>`;
  }).join('');

  // Sous-niveau : les projets se déplient quand on est dans la section.
  const subProjects = route.section === 'projects'
    ? projects.map((p) => `<button class="tree-item${route.slug === p.slug ? ' is-active' : ''}" data-nav="projects" data-slug="${p.slug}" data-depth="1">
        <span class="tree-icon" aria-hidden="true">·</span><span>${esc(p.slug)}/</span>
      </button>`).join('')
    : '';

  el.innerHTML = `<p class="tree-label">${esc(t('tree.title'))}</p>` + rows +
    (subProjects ? `<div id="tree-projects">${subProjects}</div>` : '');

  // Les sous-projets doivent apparaître SOUS projects/ et non en fin de liste.
  const sub = $('#tree-projects');
  const parent = el.querySelector('.tree-item[data-nav="projects"]:not([data-slug])');
  if (sub && parent) parent.after(sub);
}

// ─── Onglets de buffer ────────────────────────────────────────────────
export function renderTabs(route) {
  const el = $('#tabs');
  if (!el) return;
  const sections = [...document.querySelectorAll('main .section')];
  el.innerHTML = sections.map((s) => {
    const active = s.id === route.section;
    return `<button class="buffer-tab${active ? ' is-active' : ''}" role="tab" aria-selected="${active}" data-nav="${s.id}">
      <span class="buffer-tab-dot" aria-hidden="true"></span>${esc(s.dataset.file)}
    </button>`;
  }).join('');
  el.querySelector('.buffer-tab.is-active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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

  $('#hero-identity').innerHTML = [
    `<strong>${esc(identity.name)}</strong>`,
    `<span class="sep">·</span>`,
    esc(tx(identity.role)),
    `<span class="sep">·</span>`,
    esc(tx(identity.location))
  ].join(' ');

  $('#principles').innerHTML = principles.map((p, i) => `
    <li class="principle">
      <span class="principle-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <span>
        <span class="principle-name">${esc(tx(p.name))}</span>
        <span class="principle-desc">${inline(tx(p.desc))}</span>
      </span>
    </li>`).join('');

  $('#facts').innerHTML = about.facts.map((f) => `
    <div class="fact">
      <span class="fact-key">${esc(tx(f.label))}</span>
      <span class="fact-val">${esc(tx(f.value))}</span>
    </div>`).join('');
}

// ─── À propos ─────────────────────────────────────────────────────────
function renderAbout() {
  $('#about-title').textContent = tx(about.title);
  $('#about-body').innerHTML = tx(about.body).map((p) => `<p>${inline(p)}</p>`).join('');
}

// ─── Parcours — le git log ────────────────────────────────────────────
function renderExperience() {
  $('#gitlog').innerHTML = experience.map((job, i) => `
    <article class="commit${i === 0 ? ' is-head' : ''}" id="job-${esc(job.slug)}">
      <div class="commit-head">
        <span class="commit-hash">${shortHash(job.slug)}</span>
        <span class="commit-period">${esc(periodOf(job))}</span>
        ${i === 0 ? '<span class="commit-ref">HEAD</span>' : ''}
      </div>
      <h2 class="commit-title">${esc(tx(job.role))} <span class="commit-company">@ ${esc(tx(job.company))}</span></h2>
      <p class="commit-place">${esc(tx(job.place))}</p>
      <p class="commit-summary">${inline(tx(job.summary))}</p>
      <ul class="diff">
        ${tx(job.highlights).map((h) => `<li><span class="diff-plus" aria-hidden="true">+</span><span>${inline(h)}</span></li>`).join('')}
      </ul>
      <ul class="chips">${job.stack.map((s) => `<li class="chip">${esc(s)}</li>`).join('')}</ul>
    </article>`).join('');
}

// ─── Projets ──────────────────────────────────────────────────────────
function projectListHtml() {
  return `
    <div class="section-head">
      <p class="section-kicker">projects/</p>
      <h1 class="section-title">${esc(t('projects.title'))}</h1>
      <p class="section-lede">${esc(t('projects.lede'))}</p>
    </div>
    <div class="project-list">
      ${projects.map((p) => `
        <button class="project-card" data-nav="projects" data-slug="${esc(p.slug)}">
          <span class="project-top">
            <span class="project-name">${esc(p.name)}</span>
            <span class="project-year">${esc(p.year)}</span>
            <span class="project-go" aria-hidden="true">→</span>
          </span>
          <span class="project-tagline">${esc(tx(p.tagline))}</span>
          <span class="project-top">
            <span class="status" data-status="${esc(p.status)}">${esc(tx(STATUS_LABEL[p.status]))}</span>
            <span class="chips">${p.stack.slice(0, 4).map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</span>
          </span>
        </button>`).join('')}
    </div>`;
}

function projectDetailHtml(p) {
  return `
    <div class="project-detail">
      <button class="project-back" data-nav="projects">
        <span aria-hidden="true">←</span> ${esc(t('projects.back'))}
      </button>
      <div class="section-head">
        <p class="section-kicker">projects/${esc(p.slug)}/README.md</p>
        <h1 class="section-title">${esc(p.name)}</h1>
        <p class="section-lede">${esc(tx(p.tagline))}</p>
      </div>

      <p class="project-top" style="margin-bottom: var(--space-6)">
        <span class="status" data-status="${esc(p.status)}">${esc(tx(STATUS_LABEL[p.status]))}</span>
        <span class="project-year">${esc(p.year)}</span>
      </p>

      <div class="prose"><p>${inline(tx(p.summary))}</p></div>

      ${p.metrics?.length ? `<div class="metrics">${p.metrics.map((m) => `
        <div class="metric">
          <div class="metric-value">${esc(m.value)}</div>
          <div class="metric-label">${esc(tx(m.label))}</div>
        </div>`).join('')}</div>` : ''}

      <section class="block">
        <h2 class="block-title">${esc(t('highlights.title'))}</h2>
        <ul class="diff">
          ${tx(p.highlights).map((h) => `<li><span class="diff-plus" aria-hidden="true">+</span><span>${inline(h)}</span></li>`).join('')}
        </ul>
      </section>

      <section class="block">
        <h2 class="block-title">Stack</h2>
        <ul class="chips">${p.stack.map((s) => `<li class="chip">${esc(s)}</li>`).join('')}</ul>
        ${p.links.length ? `<div class="links-row">${p.links.map((l) => `
          <a class="cta" href="${esc(l.url)}" target="_blank" rel="noopener">
            ${esc(tx(l.label))} <span class="cta-arrow" aria-hidden="true">↗</span>
          </a>`).join('')}</div>` : ''}
      </section>
    </div>`;
}

function renderProjects(route) {
  const el = $('#projects-body');
  const project = route.slug ? projects.find((p) => p.slug === route.slug) : null;
  el.innerHTML = project ? projectDetailHtml(project) : projectListHtml();
}

// ─── Stack ────────────────────────────────────────────────────────────
function renderStack() {
  $('#stack-body').innerHTML = stack.map((g) => `
    <section class="stack-group">
      <h2 class="stack-group-title">${esc(tx(g.group))}</h2>
      ${g.items.map((i) => `
        <div class="skill">
          <div class="skill-top">
            <span class="skill-name">${esc(tx(i.name))}</span>
          </div>
          <p class="skill-note">${esc(tx(i.note))}</p>
        </div>`).join('')}
    </section>`).join('');
}

// ─── Contact ──────────────────────────────────────────────────────────
function renderContact() {
  $('#contact-title').textContent = tx(contact.title);
  $('#contact-lede').textContent = tx(contact.lede);
  $('#contact-links').innerHTML = identity.links.map((l) => `
    <a class="contact-link" href="${esc(l.url)}"${l.url.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener"'}>
      <span class="contact-link-label">${esc(l.label)}</span>
      <span class="contact-link-handle">${esc(l.handle)}</span>
      <span class="contact-link-go" aria-hidden="true">↗</span>
    </a>`).join('');
  $('#contact-note').textContent = tx(contact.note);
  $('#foot-left').textContent = t('foot.built');
  $('#foot-right').textContent = `© ${new Date().getFullYear()} ${identity.name}`;
}

// ─── Gouttière de numéros de ligne ────────────────────────────────────
// Purement décorative (aria-hidden) : on remplit chaque gouttière d'assez de
// numéros pour couvrir la hauteur réelle de son buffer, le débordement est
// masqué en CSS. Recalculée au redimensionnement et après chaque rendu.
export function paintGutters() {
  document.querySelectorAll('.section.is-active .buffer').forEach((buffer) => {
    const gutter = buffer.querySelector('.gutter');
    const body = buffer.querySelector('.buffer-body');
    if (!gutter || !body) return;
    const lh = parseFloat(getComputedStyle(gutter).lineHeight) || 22;
    const count = Math.max(12, Math.ceil(body.getBoundingClientRect().height / lh));
    gutter.textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');
  });
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
  renderTabs(route);
}

// Seules les parties dépendantes de la route (projets, arbre, onglets).
export function renderRoute(route) {
  renderProjects(route);
  renderTree(route);
  renderTabs(route);
}

// Le shell a besoin de l'arborescence dans la langue courante.
export const currentFs = () => buildFs(getLang());
