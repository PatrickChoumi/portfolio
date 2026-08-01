// Génère public/sitemap.xml et la ligne Sitemap de public/robots.txt.
//
// Le site a onze URL réelles, mais un seul fichier HTML : rien, dans le
// `dist/`, ne dit à un moteur de recherche que /projets/kairus existe. Un
// sitemap est la seule liste que Google lit sans avoir à découvrir les liens.
//
// Il est CALCULÉ à partir du routeur et de profile.js, pas écrit à la main :
// ajouter un projet ajoute son URL, en retirer un la retire. Une liste tenue
// à la main dérive à la première modification et pointe vers des 404.
//
//   node scripts/build-sitemap.mjs        (lancé par `npm run build`)

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SECTION_TO_URL } from '../src/js/router.js';
import { projects } from '../src/data/profile.js';

// L'adresse déclarée dans la Search Console. C'est le seul endroit à changer
// le jour d'un nom de domaine personnel.
export const SITE = 'https://patrickchoumi.vercel.app';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function urls(site = SITE) {
  const base = site.replace(/\/$/, '');
  const out = [{ loc: `${base}/`, priority: '1.0' }];

  for (const [section, seg] of Object.entries(SECTION_TO_URL)) {
    if (!seg) continue; // l'accueil est déjà posé, avec sa priorité pleine
    out.push({ loc: `${base}/${seg}`, priority: section === 'projects' ? '0.9' : '0.8' });
  }
  for (const p of projects) out.push({ loc: `${base}/projets/${p.slug}`, priority: '0.7' });

  return out;
}

export function sitemapXml(site = SITE, today = new Date().toISOString().slice(0, 10)) {
  const body = urls(site).map(({ loc, priority }) =>
    `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function robotsTxt(site = SITE) {
  return [
    '# Tout est public, et tout mérite d’être lu.',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${site.replace(/\/$/, '')}/sitemap.xml`,
    ''
  ].join('\n');
}

// Exécuté directement (et non importé par un test) : on écrit les fichiers.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await writeFile(path.join(ROOT, 'public/sitemap.xml'), sitemapXml());
  await writeFile(path.join(ROOT, 'public/robots.txt'), robotsTxt());
  console.log(`sitemap : ${urls().length} URL sur ${SITE}`);
}
