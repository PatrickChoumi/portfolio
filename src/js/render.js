// ═══════════════════════════════════════════════════════════════════════
//  LE RENDU DE LA PLANCHE
//
//  Rien de ce qui suit n'est écrit en dur dans index.html : le HTML n'est
//  qu'une charpente de conteneurs vides. Changer profile.js change la
//  coupe, les fiches, le terminal, la palette et le CV imprimé d'un coup.
//
//  Une règle traverse ce fichier : TOUT CE QUI EST LISTÉ EST TRIÉ PAR
//  PROFONDEUR. La coupe de l'accueil, le rail, la liste des projets — même
//  ordre, même groupement. Une liste triée par date raconterait une autre
//  histoire que l'accueil, et le visiteur paierait la différence.
// ═══════════════════════════════════════════════════════════════════════

import { identity, hero, about, experience, projects, stack, principles, contact, layers } from '../data/profile.js';
import { buildFs, shortHash } from '../data/fs.js';
import { t, tx, getLang } from './i18n.js';

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

const STATUS_LABEL = {
  live: { fr: 'en ligne', en: 'live' },
  wip: { fr: 'en cours', en: 'in progress' },
  planned: { fr: 'à venir', en: 'planned' },
  archived: { fr: 'archivé', en: 'archived' }
};

const periodOf = (job) => `${job.start} → ${job.end || (getLang() === 'en' ? 'now' : 'aujourd’hui')}`;

// La cote d'une couche, sur deux chiffres : « 00 », « 03 ». Tabulaire, donc
// alignée d'une ligne à l'autre — c'est une graduation, pas un numéro.
const cote = (n) => String(n).padStart(2, '0');

// Les couches, de la surface vers le fond, avec leurs projets. L'ordre vient
// de `depth` et non de l'ordre de déclaration : déplacer une couche dans le
// fichier de données ne doit pas retourner la coupe.
export function strata() {
  return [...layers]
    .sort((a, b) => a.depth - b.depth)
    .map((layer) => ({ ...layer, items: projects.filter((p) => p.layer === layer.slug) }));
}

// La profondeur d'un projet, pour le cartouche et le rail.
const depthOf = (slug) => layers.find((l) => l.slug === projects.find((p) => p.slug === slug)?.layer)?.depth ?? 0;

// ─── Le rail de profondeur ────────────────────────────────────────────
// Les sections de lecture d'abord, puis les couches cotées. Ce n'est plus
// un explorateur de fichiers : c'est l'échelle de la coupe.
const SECTIONS = [
  { label: { fr: 'Accueil', en: 'Home' }, section: 'home' },
  { label: { fr: 'À propos', en: 'About' }, section: 'about' },
  { label: { fr: 'Parcours', en: 'Career' }, section: 'experience' },
  { label: { fr: 'Projets', en: 'Projects' }, section: 'projects' },
  { label: { fr: 'Stack', en: 'Stack' }, section: 'stack' },
  { label: { fr: 'Contact', en: 'Contact' }, section: 'contact' }
];

function railItem({ depth, name, count, active, route }) {
  const attrs = [
    `data-nav="${esc(route.section)}"`,
    route.slug ? `data-slug="${esc(route.slug)}"` : '',
    active ? ' aria-current="page"' : ''
  ].filter(Boolean).join(' ');
  return `<button class="rail-item${active ? ' is-active' : ''}" ${attrs}>` +
    `<span class="rail-depth" aria-hidden="true">${esc(depth)}</span>` +
    `<span class="rail-name">${esc(name)}</span>` +
    (count != null ? `<span class="rail-count">${count}</span>` : '') +
    '</button>';
}

export function renderRail(route) {
  const el = $('#rail-nav');
  if (!el) return;

  const sections = SECTIONS.map((s) => railItem({
    depth: '··',
    name: tx(s.label),
    active: route.section === s.section && !route.slug,
    route: { section: s.section }
  })).join('');

  // Les couches mènent à la liste des projets, ancrée sur leur groupe.
  const couches = strata().map((layer) => railItem({
    depth: cote(layer.depth),
    name: tx(layer.name),
    count: layer.items.length,
    active: route.slug ? projects.find((p) => p.slug === route.slug)?.layer === layer.slug : false,
    route: { section: 'projects' }
  })).join('');

  el.innerHTML =
    `<div class="rail-group">${sections}</div>` +
    `<div class="rail-group"><p class="rail-label label">${esc(t('rail.layers'))}</p>${couches}</div>`;
}

// ─── Le cartouche ─────────────────────────────────────────────────────
// Le bandeau d'une planche : quelle feuille, à quelle profondeur, quelle
// révision. La révision est l'année — un portfolio n'a pas d'indice de
// modification, et en inventer un serait du décor.
export function renderCartouche(route) {
  const sheet = route.slug
    ? `${route.section}/${route.slug}`
    : (SECTIONS.find((s) => s.section === route.section) ? route.section : 'home');
  const depth = route.slug ? cote(depthOf(route.slug)) : '··';
  const setText = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
  setText('cart-sheet', sheet);
  setText('cart-depth', depth);
  setText('cart-rev', String(new Date().getFullYear()));
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
  // définie dans notre propre fichier de données, jamais une saisie utilisateur.
  $('#hero-title').innerHTML = tx(hero.title);
  $('#hero-lede').innerHTML = tx(hero.lede);

  $('#hero-identity').innerHTML = [
    `<strong>${esc(identity.name)}</strong>`,
    '<span class="sep">·</span>',
    esc(tx(identity.role)),
    '<span class="sep">·</span>',
    esc(tx(identity.location))
  ].join(' ');

  renderStrata();

  $('#principles').innerHTML = principles.map((p, i) => `
    <li class="principle">
      <span class="principle-num" aria-hidden="true">${cote(i + 1)}</span>
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

// La coupe. Une strate par couche, dans l'ordre de la profondeur, et les
// projets posés dedans. `data-depth` pilote la densité des hachures en CSS.
function renderStrata() {
  const el = $('#strata');
  if (!el) return;
  el.innerHTML = strata().map((layer) => `
    <li class="stratum" data-depth="${layer.depth}">
      <span class="stratum-depth" aria-hidden="true">${cote(layer.depth)}</span>
      <div>
        <h3 class="stratum-name">${esc(tx(layer.name))}</h3>
        <p class="stratum-note">${esc(tx(layer.note))}</p>
        <ul class="stratum-blocks">
          ${layer.items.map((p) => `
            <li>
              <button class="part" data-nav="projects" data-slug="${esc(p.slug)}">
                <span class="part-name">${esc(p.name)}</span>
                <span class="part-tag">${esc(tx(p.tagline))}</span>
                <span class="part-foot">
                  <span class="status" data-status="${esc(p.status)}">${esc(tx(STATUS_LABEL[p.status]))}</span>
                  <span>${esc(p.year)}</span>
                </span>
              </button>
            </li>`).join('')}
        </ul>
      </div>
    </li>`).join('');
}

// ─── À propos ─────────────────────────────────────────────────────────
function renderAbout() {
  $('#about-title').textContent = tx(about.title);
  $('#about-body').innerHTML = tx(about.body).map((p) => `<p>${inline(p)}</p>`).join('');
}

// ─── Parcours ─────────────────────────────────────────────────────────
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
      <ul class="techs">${job.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    </article>`).join('');
}

// ─── Projets ──────────────────────────────────────────────────────────
// Groupés par couche, dans l'ordre de la coupe.
function projectListHtml() {
  return `
    <div class="sheet-head">
      <p class="sheet-kicker">00 · projects</p>
      <h1 class="sheet-title">${esc(t('projects.title'))}</h1>
      <p class="sheet-lede">${esc(t('projects.lede'))}</p>
    </div>
    ${strata().filter((l) => l.items.length).map((layer) => `
      <section class="layer-group" id="layer-${esc(layer.slug)}">
        <div class="layer-head">
          <span class="layer-depth" aria-hidden="true">${cote(layer.depth)}</span>
          <h2 class="layer-name">${esc(tx(layer.name))}</h2>
          <p class="layer-note">${esc(tx(layer.note))}</p>
        </div>
        ${layer.items.map((p) => `
          <button class="project-row" data-nav="projects" data-slug="${esc(p.slug)}">
            <span class="project-year">${esc(p.year)}</span>
            <span>
              <span class="project-name">${esc(p.name)}</span>
              <span class="project-tagline">${esc(tx(p.tagline))}</span>
              <span class="project-meta">
                <span class="status" data-status="${esc(p.status)}">${esc(tx(STATUS_LABEL[p.status]))}</span>
                <span class="techs">${p.stack.slice(0, 4).map((s) => `<span>${esc(s)}</span>`).join(' · ')}</span>
              </span>
            </span>
            <span class="project-go" aria-hidden="true">→</span>
          </button>`).join('')}
      </section>`).join('')}`;
}

function projectDetailHtml(p) {
  const layer = layers.find((l) => l.slug === p.layer);
  return `
    <div class="project-detail">
      <button class="project-back" data-nav="projects">
        <span aria-hidden="true">←</span> ${esc(t('projects.back'))}
      </button>
      <div class="sheet-head">
        <p class="sheet-kicker">${layer ? `${cote(layer.depth)} · ${esc(tx(layer.name))}` : ''} · ${esc(p.slug)}</p>
        <h1 class="sheet-title">${esc(p.name)}</h1>
        <p class="sheet-lede">${esc(tx(p.tagline))}</p>
      </div>

      <p class="project-meta">
        <span class="status" data-status="${esc(p.status)}">${esc(tx(STATUS_LABEL[p.status]))}</span>
        <span class="project-year">${esc(p.year)}</span>
      </p>

      <div class="prose" style="margin-top: var(--space-8)"><p>${inline(tx(p.summary))}</p></div>

      ${p.metrics?.length ? `<div class="metrics">${p.metrics.map((m) => `
        <div class="metric">
          <div class="metric-value">${esc(m.value)}</div>
          <div class="metric-rule" aria-hidden="true"></div>
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
        <ul class="techs">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        ${p.links.length ? `<div class="links-row">${p.links.map((l) => `
          <a class="cta" href="${esc(l.url)}" target="_blank" rel="noopener">
            ${esc(tx(l.label))} <span class="cta-arrow" aria-hidden="true">↗</span>
          </a>`).join('')}</div>`
        : `<p class="note" style="margin-top: var(--space-5)">${esc(t('projects.private'))}</p>`}
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
          <span class="skill-name">${esc(tx(i.name))}</span>
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

// ─── Orchestration ────────────────────────────────────────────────────
export function renderAll(route) {
  renderHome();
  renderAbout();
  renderExperience();
  renderProjects(route);
  renderStack();
  renderContact();
  renderRail(route);
  renderCartouche(route);
}

// Seules les parties dépendantes de la route.
export function renderRoute(route) {
  renderProjects(route);
  renderRail(route);
  renderCartouche(route);
}

// Le shell a besoin de l'arborescence dans la langue courante.
export const currentFs = () => buildFs(getLang());
