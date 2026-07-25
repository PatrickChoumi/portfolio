// ═══════════════════════════════════════════════════════════════════════
//  LE SYSTÈME DE FICHIERS VIRTUEL
//
//  L'idée centrale du site : le contenu de profile.js est projeté en une
//  arborescence explorable. La page lisible et le shell ne sont que deux
//  rendus de cette même matière — aucun texte n'est écrit deux fois.
//
//    /
//    ├── about.md
//    ├── principles.md
//    ├── resume.md
//    ├── contact.md
//    ├── experience/
//    │   ├── README.md          ← le git log du parcours
//    │   └── <slug>.md
//    ├── projects/
//    │   ├── README.md
//    │   └── <slug>/
//    │       ├── README.md
//    │       ├── stack.txt
//    │       └── links.txt
//    └── stack/
//        └── <groupe>.txt
//
//  Chaque nœud peut porter une `route` : c'est le pont entre le shell et
//  la page. `open <chemin>` navigue vers cette route ; inversement, changer
//  de section met à jour le répertoire courant du shell.
//
//  Module pur (aucun accès au DOM) → testable directement avec node:test.
// ═══════════════════════════════════════════════════════════════════════

import { pick, slugify } from './lang.js';
import { identity, about, experience, projects, stack, principles, contact, host } from './profile.js';

// ─── Fabriques de nœuds ───────────────────────────────────────────────
const file = (name, content, route = null, extra = {}) => ({ type: 'file', name, content, route, ...extra });
const dir = (name, children, route = null) => ({ type: 'dir', name, children, route });

// ─── Petits utilitaires de mise en page texte ─────────────────────────
const rule = (n = 62) => '─'.repeat(n);

function bullets(list, marker = '·') {
  return list.map((l) => `  ${marker} ${l}`).join('\n');
}

function period(job, lang) {
  const end = job.end || (lang === 'en' ? 'now' : 'aujourd’hui');
  return `${job.start} → ${end}`;
}

const STATUS_LABEL = {
  live: { fr: 'en ligne', en: 'live' },
  wip: { fr: 'en cours', en: 'in progress' },
  archived: { fr: 'archivé', en: 'archived' }
};

// ─── Générateurs de contenu ───────────────────────────────────────────
function aboutFile(lang) {
  const lines = [
    `# ${pick(about.title, lang)}`,
    '',
    ...pick(about.body, lang).flatMap((p) => [p, '']),
    rule(),
    ...about.facts.map((f) => `${pick(f.label, lang).padEnd(10)} ${pick(f.value, lang)}`)
  ];
  return lines.join('\n');
}

function principlesFile(lang) {
  const out = [`# ${lang === 'en' ? 'Principles' : 'Convictions'}`, ''];
  principles.forEach((p, i) => {
    out.push(`${String(i + 1).padStart(2, '0')}. ${pick(p.name, lang)}`, `    ${pick(p.desc, lang)}`, '');
  });
  return out.join('\n');
}

function contactFile(lang) {
  return [
    `# ${pick(contact.title, lang)}`,
    '',
    pick(contact.lede, lang),
    '',
    ...identity.links.map((l) => `${l.label.padEnd(9)} ${l.url}`),
    '',
    rule(),
    pick(contact.note, lang)
  ].join('\n');
}

function jobFile(job, lang) {
  return [
    `# ${pick(job.company, lang)} — ${pick(job.role, lang)}`,
    `${period(job, lang)} · ${pick(job.place, lang)}`,
    '',
    pick(job.summary, lang),
    '',
    `${lang === 'en' ? 'Highlights' : 'Faits marquants'} :`,
    bullets(pick(job.highlights, lang)),
    '',
    `${lang === 'en' ? 'Stack' : 'Stack'} : ${job.stack.join(', ')}`
  ].join('\n');
}

// Le README du parcours EST un `git log --graph`. C'est la même donnée que
// la vue page — la métaphore n'est pas décorative, elle est le rendu.
function experienceReadme(lang) {
  const out = [`# ${lang === 'en' ? 'Career' : 'Parcours'}`, '', '$ git log --graph --oneline', ''];
  experience.forEach((job, i) => {
    const hash = shortHash(job.slug);
    const isHead = i === 0;
    out.push(`* ${hash}  (${period(job, lang)})${isHead ? '  ← HEAD' : ''}`);
    out.push(`|   ${pick(job.role, lang)} @ ${pick(job.company, lang)}`);
    out.push(`|   ${pick(job.summary, lang)}`);
    out.push(i === experience.length - 1 ? '' : '|');
  });
  out.push(`${lang === 'en' ? 'Detail' : 'Détail'} : cat experience/<${lang === 'en' ? 'name' : 'nom'}>.md`);
  return out.join('\n');
}

// Hash déterministe et stable — pas d'aléatoire, sinon le contenu changerait
// à chaque rendu et les tests deviendraient instables.
export function shortHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0').slice(0, 7);
}

function projectReadme(p, lang) {
  return [
    `# ${p.name}`,
    `${pick(p.tagline, lang)}`,
    `${p.year} · ${pick(STATUS_LABEL[p.status], lang)}`,
    '',
    pick(p.summary, lang),
    '',
    `${lang === 'en' ? 'Highlights' : 'Faits marquants'} :`,
    bullets(pick(p.highlights, lang)),
    '',
    ...(p.metrics?.length ? [p.metrics.map((m) => `${m.value} ${pick(m.label, lang)}`).join('  ·  '), ''] : []),
    `${lang === 'en' ? 'See also' : 'Voir aussi'} : stack.txt, links.txt`
  ].join('\n');
}

function projectsReadme(lang) {
  const out = [`# ${lang === 'en' ? 'Projects' : 'Projets'}`, ''];
  projects.forEach((p) => {
    out.push(`${p.slug.padEnd(12)} ${p.year}  ${pick(p.tagline, lang)}`);
  });
  out.push('', `${lang === 'en' ? 'Enter one' : 'Entrer dans un projet'} : cd projects/<${lang === 'en' ? 'name' : 'nom'}>`);
  return out.join('\n');
}

// Un glossaire, pas un palmarès : le nom, puis la phrase qui dit ce qu'on en
// sait vraiment. Les jauges ont été retirées — « quatre sur cinq » ne veut
// rien dire pour celui qui lit, et beaucoup trop pour celui qui écrit.
function stackFile(group, lang) {
  const names = group.items.map((i) => pick(i.name, lang));
  const width = Math.max(...names.map((n) => n.length));
  return [
    `# ${pick(group.group, lang)}`,
    '',
    ...group.items.map((i, k) => `${names[k].padEnd(width)}  ${pick(i.note, lang)}`)
  ].join('\n');
}

// CV condensé — c'est aussi ce que `cv` imprime et ce que la page envoie à
// l'impression. Une seule composition, trois usages.
function resumeFile(lang) {
  const out = [
    `${identity.name} — ${pick(identity.role, lang)}`,
    `${pick(identity.location, lang)} · ${identity.email}`,
    rule(),
    '',
    `## ${lang === 'en' ? 'Career' : 'Parcours'}`,
    ''
  ];
  experience.forEach((job) => {
    out.push(`${period(job, lang)}  ${pick(job.role, lang)} — ${pick(job.company, lang)}`);
    out.push(bullets(pick(job.highlights, lang).slice(0, 2)), '');
  });
  out.push(`## ${lang === 'en' ? 'Selected projects' : 'Projets choisis'}`, '');
  projects.forEach((p) => out.push(`${p.name.padEnd(12)} ${p.year}  ${pick(p.tagline, lang)}`));
  out.push('', `## Stack`, '');
  stack.forEach((g) => out.push(`${pick(g.group, lang)} : ${g.items.map((i) => pick(i.name, lang)).join(', ')}`));
  out.push('', rule(), identity.links.map((l) => l.url).join('  ·  '));
  return out.join('\n');
}

// ─── Construction de l'arbre ──────────────────────────────────────────
export function buildFs(lang = 'fr') {
  const root = dir('/', [
    file('about.md', aboutFile(lang), { section: 'about' }),
    file('principles.md', principlesFile(lang), { section: 'about' }),
    file('resume.md', resumeFile(lang), { section: 'home' }),
    file('contact.md', contactFile(lang), { section: 'contact' }),

    dir('experience', [
      file('README.md', experienceReadme(lang), { section: 'experience' }),
      ...experience.map((job) =>
        file(`${job.slug}.md`, jobFile(job, lang), { section: 'experience', anchor: `job-${job.slug}` })
      )
    ], { section: 'experience' }),

    dir('projects', [
      file('README.md', projectsReadme(lang), { section: 'projects' }),
      ...projects.map((p) =>
        dir(p.slug, [
          file('README.md', projectReadme(p, lang), { section: 'projects', slug: p.slug }),
          file('stack.txt', p.stack.join('\n'), { section: 'projects', slug: p.slug }),
          file('links.txt',
            p.links.length
              ? p.links.map((l) => `${pick(l.label, lang)} — ${l.url}`).join('\n')
              : (lang === 'en' ? '(private repository)' : '(dépôt privé)'),
            { section: 'projects', slug: p.slug })
        ], { section: 'projects', slug: p.slug })
      )
    ], { section: 'projects' }),

    dir('stack', stack.map((g) =>
      file(`${slugify(pick(g.group, 'fr'))}.txt`, stackFile(g, lang), { section: 'stack' })
    ), { section: 'stack' }),

    // Fichier caché — visible seulement avec `ls -a`. Le genre de détail
    // que personne n'a demandé et que quelqu'un finira par trouver.
    file('.secret', [
      lang === 'en' ? 'You went looking. That says something.' : 'Tu es allé chercher. C’est déjà un signe.',
      '',
      lang === 'en'
        ? 'Try: sudo hire-me · matrix · coffee · uname -a'
        : 'Essaie : sudo hire-me · matrix · coffee · uname -a'
    ].join('\n'))
  ]);
  return root;
}

// ─── Navigation dans l'arbre ──────────────────────────────────────────

// Découpe un chemin en segments, en résolvant `.` et `..` par rapport au
// répertoire courant. Renvoie un tableau de segments absolus.
export function resolvePath(cwd, input) {
  const startsAbsolute = input.startsWith('/');
  const base = startsAbsolute ? [] : [...cwd];
  for (const seg of input.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') base.pop();
    else base.push(seg);
  }
  return base;
}

// Descend l'arbre le long des segments. Renvoie le nœud ou null.
export function lookup(root, segments) {
  let node = root;
  for (const seg of segments) {
    if (node.type !== 'dir') return null;
    const next = node.children.find((c) => c.name === seg);
    if (!next) return null;
    node = next;
  }
  return node;
}

export const formatPath = (segments) => '/' + segments.join('/');

// Chemin du nœud correspondant à une route de la page — l'autre sens du
// pont : la navigation GUI repositionne le shell.
export function pathForRoute(route) {
  if (!route) return [];
  if (route.section === 'projects') return route.slug ? ['projects', route.slug] : ['projects'];
  if (route.section === 'experience') return ['experience'];
  if (route.section === 'stack') return ['stack'];
  return [];
}

// Tous les chemins de fichiers, à plat — sert à `find`, `grep` et à la
// complétion de la palette de commandes.
export function walk(node, prefix = []) {
  const out = [];
  for (const child of node.children || []) {
    const path = [...prefix, child.name];
    out.push({ node: child, path });
    if (child.type === 'dir') out.push(...walk(child, path));
  }
  return out;
}

export { host, identity };
