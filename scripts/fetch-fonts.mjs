// Récupère et auto-héberge les polices.
//
// Pourquoi ne pas simplement pointer vers Google Fonts ? Parce que la page
// contact affirme que le site n'envoie rien nulle part. Un <link> vers un
// CDN tiers ferait mentir cette phrase : chaque visite y révélerait une IP et
// un user-agent. Auto-héberger règle la question, supprime deux connexions
// et deux allers-retours DNS/TLS, et rend le site utilisable hors-ligne.
//
// Les deux familles sont sous SIL Open Font License 1.1 — la redistribution
// est explicitement permise (voir public/fonts/LICENSE.txt).
//
//   node scripts/fetch-fonts.mjs
//
// À relancer seulement pour changer de police ou de graisses ; les fichiers
// produits sont versionnés, le build n'a donc jamais besoin du réseau.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('public/fonts');
const CSS_OUT = path.resolve('src/styles/fonts.css');

// On ne garde que le latin : le site est en français et en anglais. Charger
// le cyrillique et le grec coûterait des kilo-octets que personne ne lit.
const KEEP_SUBSETS = new Set(['latin', 'latin-ext']);

const FAMILIES = [
  { name: 'JetBrains Mono', query: 'JetBrains+Mono:wght@400;500;600', slug: 'jetbrains-mono' },
  { name: 'Inter', query: 'Inter:wght@400;500;600', slug: 'inter' }
];

// Sans user-agent de navigateur moderne, Google renvoie du TTF au lieu du woff2.
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function fetchCss(query) {
  const res = await fetch(`https://fonts.googleapis.com/css2?family=${query}&display=swap`, {
    headers: { 'user-agent': UA }
  });
  if (!res.ok) throw new Error(`CSS ${query} : HTTP ${res.status}`);
  return res.text();
}

// Le CSS de Google est une suite de blocs `/* subset */ @font-face {...}`.
function parseBlocks(css) {
  const blocks = [];
  const re = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const [, subset, body] = m;
    const weight = body.match(/font-weight:\s*(\d+)/)?.[1];
    const url = body.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    const range = body.match(/unicode-range:\s*([^;]+);/)?.[1]?.trim();
    if (subset && weight && url) blocks.push({ subset, weight, url, range });
  }
  return blocks;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const faces = [];

  for (const family of FAMILIES) {
    const css = await fetchCss(family.query);
    const blocks = parseBlocks(css).filter((b) => KEEP_SUBSETS.has(b.subset));
    if (!blocks.length) throw new Error(`aucun sous-ensemble latin trouvé pour ${family.name}`);

    for (const block of blocks) {
      const file = `${family.slug}-${block.weight}-${block.subset}.woff2`;
      const res = await fetch(block.url, { headers: { 'user-agent': UA } });
      if (!res.ok) throw new Error(`${file} : HTTP ${res.status}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      await writeFile(path.join(OUT_DIR, file), bytes);
      console.log(`  ${file}  ${(bytes.length / 1024).toFixed(1)} Ko`);

      faces.push([
        '@font-face {',
        `  font-family: '${family.name}';`,
        '  font-style: normal;',
        `  font-weight: ${block.weight};`,
        // swap : le texte s'affiche immédiatement dans la police système et
        // bascule à l'arrivée du fichier. Jamais de page blanche.
        '  font-display: swap;',
        `  src: url('/fonts/${file}') format('woff2');`,
        ...(block.range ? [`  unicode-range: ${block.range};`] : []),
        '}'
      ].join('\n'));
    }
  }

  const header = [
    '/* Généré par scripts/fetch-fonts.mjs — ne pas éditer à la main.',
    '   Polices auto-hébergées : aucune requête vers un tiers au chargement.',
    '   JetBrains Mono et Inter — SIL Open Font License 1.1. */',
    ''
  ].join('\n');
  await writeFile(CSS_OUT, `${header}${faces.join('\n\n')}\n`);
  console.log(`\n${faces.length} @font-face écrits dans ${path.relative(process.cwd(), CSS_OUT)}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
