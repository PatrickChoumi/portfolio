// Récupère et auto-héberge la police.
//
// Une seule famille, deux fontes : romain et italique. La hiérarchie vient de
// la taille et du blanc, pas du gras. Sous-ensemble latin uniquement — le site
// est en français et en anglais, charger le vietnamien serait payer pour rien.
//
// Auto-hébergée parce qu'un lien vers un CDN de polices est une requête vers
// un tiers à chaque visite : deux résolutions DNS, deux poignées de main TLS,
// et une adresse IP qui part ailleurs. Ce site ne contacte personne.
//
// Newsreader — SIL Open Font License 1.1 (voir public/fonts/LICENSE.txt).
//
//   node scripts/fetch-fonts.mjs
//
// À relancer seulement pour changer de police. Les .woff2 sont versionnés :
// le build n'a jamais besoin du réseau.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('public/fonts');
const CSS_OUT = path.resolve('src/fonts.css');
const QUERY = 'Newsreader:ital,wght@0,400;1,400';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const res = await fetch(`https://fonts.googleapis.com/css2?family=${QUERY}&display=swap`, {
  headers: { 'user-agent': UA }
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const css = await res.text();

// Le CSS de Google est une suite de blocs `/* sous-ensemble */ @font-face {…}`.
const blocks = [];
const re = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
let m;
while ((m = re.exec(css))) {
  const [, subset, body] = m;
  if (subset !== 'latin') continue;
  blocks.push({
    style: body.match(/font-style:\s*(\w+)/)?.[1] ?? 'normal',
    weight: body.match(/font-weight:\s*(\d+)/)?.[1],
    url: body.match(/url\((https:[^)]+\.woff2)\)/)?.[1],
    range: body.match(/unicode-range:\s*([^;]+);/)?.[1]?.trim()
  });
}
if (!blocks.length) throw new Error('aucun sous-ensemble latin trouvé');

await mkdir(OUT_DIR, { recursive: true });
const faces = [];

for (const b of blocks) {
  const file = `newsreader-${b.weight}${b.style === 'italic' ? '-italic' : ''}.woff2`;
  const bin = await fetch(b.url, { headers: { 'user-agent': UA } });
  if (!bin.ok) throw new Error(`${file} : HTTP ${bin.status}`);
  const bytes = Buffer.from(await bin.arrayBuffer());
  await writeFile(path.join(OUT_DIR, file), bytes);
  console.log(`  ${file}  ${(bytes.length / 1024).toFixed(1)} Ko`);

  faces.push([
    '@font-face {',
    "  font-family: 'Newsreader';",
    `  font-style: ${b.style};`,
    `  font-weight: ${b.weight};`,
    // swap : le texte s'affiche tout de suite dans la police système et
    // bascule à l'arrivée du fichier. Jamais de page blanche.
    '  font-display: swap;',
    `  src: url('/fonts/${file}') format('woff2');`,
    ...(b.range ? [`  unicode-range: ${b.range};`] : []),
    '}'
  ].join('\n'));
}

const header = [
  '/* Généré par scripts/fetch-fonts.mjs — ne pas éditer à la main.',
  '   Newsreader, sous-ensemble latin. SIL Open Font License 1.1. */',
  ''
].join('\n');
await writeFile(CSS_OUT, `${header}${faces.join('\n\n')}\n`);
console.log(`\n${faces.length} @font-face écrits dans ${path.relative(process.cwd(), CSS_OUT)}`);
