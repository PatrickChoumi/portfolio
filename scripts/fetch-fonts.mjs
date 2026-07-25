// Récupère et auto-héberge les polices.
//
// Deux voix, quatre fontes, et pas une de plus :
//
//   JetBrains Mono 400/500  l'ossature — titres, navigation, terminal,
//                           chiffres, tout ce qui structure ;
//   Inter 400/500            la prose — tout ce qui se lit en paragraphes.
//
// Deux voix de la même famille d'esprit : l'une tape, l'autre explique. Un
// serif éditorial a été essayé ici, et retiré — il donnait au site l'air d'une
// revue, alors que le sujet est un poste de travail.
//
// Sous-ensemble latin uniquement, sans latin-ext : le français y est
// entièrement couvert (accents, œ, guillemets), et cela divise le poids par
// cinq. Aucune graisse 600, aucun faux gras : deux graisses suffisent.
//
// Pourquoi ne pas simplement pointer vers Google Fonts ? Parce que la page
// contact affirme que le site n'envoie rien nulle part. Un <link> vers un CDN
// ferait mentir cette phrase : chaque visite y révélerait une adresse IP et un
// user-agent. Auto-héberger règle la question, supprime deux connexions et
// deux allers-retours DNS/TLS, et rend le site utilisable hors-ligne.
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

const FAMILIES = [
  { name: 'JetBrains Mono', query: 'JetBrains+Mono:wght@400;500', slug: 'jetbrains-mono' },
  { name: 'Inter', query: 'Inter:wght@400;500', slug: 'inter' }
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

// Le CSS de Google est une suite de blocs `/* sous-ensemble */ @font-face {…}`.
function parseBlocks(css) {
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
  return blocks;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const faces = [];
  let total = 0;

  for (const family of FAMILIES) {
    const blocks = parseBlocks(await fetchCss(family.query));
    if (!blocks.length) throw new Error(`aucun sous-ensemble latin pour ${family.name}`);

    for (const block of blocks) {
      const file = `${family.slug}-${block.weight}${block.style === 'italic' ? '-italic' : ''}.woff2`;
      const res = await fetch(block.url, { headers: { 'user-agent': UA } });
      if (!res.ok) throw new Error(`${file} : HTTP ${res.status}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      await writeFile(path.join(OUT_DIR, file), bytes);
      total += bytes.length;
      console.log(`  ${file.padEnd(32)} ${(bytes.length / 1024).toFixed(1)} Ko`);

      faces.push([
        '@font-face {',
        `  font-family: '${family.name}';`,
        `  font-style: ${block.style};`,
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
  console.log(`\n  ${faces.length} fontes, ${(total / 1024).toFixed(0)} Ko au total.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
