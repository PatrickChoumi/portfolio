// Le build.
//
// Il n'y a pas de bundler. Il n'y en a pas besoin : le site est deux pages
// HTML et deux fichiers de police. Un bundler apporterait une configuration,
// un cache, un arbre de dépendances et des mises à jour à suivre — pour
// concaténer un fichier CSS.
//
// Ce que fait ce script, dans l'ordre :
//   1. lit la feuille de style et y insère les @font-face à la place de
//      l'@import (un @import dans un <style> déclencherait une requête) ;
//   2. rend une page par langue et y injecte le CSS ;
//   3. recopie public/ (les polices, robots.txt) ;
//   4. affiche le poids obtenu — un chiffre qu'on ne peut pas ignorer.
//
//   node build.mjs

import { mkdir, readFile, writeFile, cp, rm, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

import { page } from './src/page.mjs';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DIST = path.join(ROOT, 'dist');

// Les pages produites. Le français est à la racine, l'anglais dans /en/ :
// deux documents réels, pas une bascule côté client.
const PAGES = [
  { lang: 'fr', file: 'index.html' },
  { lang: 'en', file: 'en/index.html' }
];

async function css() {
  const sheet = await readFile(path.join(ROOT, 'src/styles.css'), 'utf8');
  const fonts = await readFile(path.join(ROOT, 'src/fonts.css'), 'utf8');
  if (!/@import\s+'\.\/fonts\.css';/.test(sheet)) {
    throw new Error('styles.css n’importe plus fonts.css — le build doit être mis à jour');
  }
  // Le CSS n'est pas minifié, et c'est volontaire : la page se lit aussi en
  // « afficher la source ». Compressé, l'écart avec une version minifiée se
  // compte en centaines d'octets.
  return sheet.replace(/@import\s+'\.\/fonts\.css';/, fonts.trim());
}

async function dirSize(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? await dirSize(full) : (await stat(full)).size;
  }
  return total;
}

export async function build({ quiet = false } = {}) {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  const style = await css();
  const written = [];

  for (const { lang, file } of PAGES) {
    const html = page(lang).replace('__CSS__', style);
    const out = path.join(DIST, file);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, html);
    written.push({ file, bytes: Buffer.byteLength(html), gzip: gzipSync(html).length });
  }

  await cp(path.join(ROOT, 'public'), DIST, { recursive: true });

  if (!quiet) {
    for (const w of written) {
      console.log(`  ${w.file.padEnd(16)} ${(w.bytes / 1024).toFixed(1)} Ko   gzip ${(w.gzip / 1024).toFixed(1)} Ko`);
    }
    const total = await dirSize(DIST);
    console.log(`\n  dist/ ${(total / 1024).toFixed(0)} Ko au total, polices comprises.`);
    console.log('  0 octet de JavaScript.');
  }

  return written;
}

// Exécuté directement (et non importé par les tests) → on construit.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  build().catch((e) => { console.error(e); process.exit(1); });
}
