// ═══════════════════════════════════════════════════════════════════════
//  LA CONFIGURATION DE DÉPLOIEMENT
//
//  Ces tests existent à cause d'une vraie panne, et ils valent d'être lus
//  pour elle. `vercel.json` portait une clé « comment » dans sa règle de
//  réécriture — JSON n'a pas de commentaires, et le schéma de Vercel refuse
//  toute propriété qu'il ne connaît pas. Résultat : **chaque déploiement
//  échouait à la validation**, en silence du point de vue du dépôt. Le site
//  en ligne restait figé sur une version ancienne, la preuve de propriété
//  Google n'y était pas, et la cause était invisible depuis le code.
//
//  Une configuration de déploiement casse là où rien ne la regarde : elle
//  n'est ni compilée, ni exécutée, ni rendue. D'où ce fichier.
//
//  POURQUOI CETTE RÈGLE DE RÉÉCRITURE. Le site a des URL réelles
//  (/projets/ankh) mais un seul fichier HTML : sans repli, Vercel répond 404
//  et Google n'indexe rien. Mais le repli ne doit PAS avaler les fichiers
//  servis tels quels — la preuve de propriété Google, sitemap.xml,
//  robots.txt, les polices, les assets. D'où la négation sur l'extension.
//  C'était le texte de la clé illégale ; il vit ici, où les commentaires
//  sont légaux.
// ═══════════════════════════════════════════════════════════════════════

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

// Le schéma de Vercel est fermé : une propriété inconnue fait échouer le
// déploiement entier, pas seulement la règle qui la porte.
const TOP_LEVEL = new Set(['$schema', 'rewrites', 'redirects', 'headers', 'cleanUrls', 'trailingSlash', 'buildCommand', 'outputDirectory', 'framework', 'installCommand', 'devCommand', 'regions', 'functions', 'crons', 'images', 'git']);
const REWRITE_KEYS = new Set(['source', 'destination', 'has', 'missing']);

test('vercel.json ne porte que des propriétés que Vercel accepte', () => {
  for (const key of Object.keys(config)) {
    assert.ok(TOP_LEVEL.has(key), `propriété de premier niveau inconnue : « ${key} »`);
  }
  for (const [i, rule] of (config.rewrites || []).entries()) {
    for (const key of Object.keys(rule)) {
      // Le piège exact qui a cassé les déploiements : une clé de commentaire.
      assert.ok(REWRITE_KEYS.has(key),
        `rewrites[${i}] porte « ${key} » — le schéma de Vercel le refuse et tout le déploiement échoue`);
    }
    assert.ok(rule.source && rule.destination, `rewrites[${i}] incomplet`);
  }
});

test('le repli SPA attrape les routes et épargne les fichiers', () => {
  const rule = config.rewrites[0];
  // Vercel ancre la source aux deux bouts : on reproduit ce comportement
  // pour éprouver la règle ici plutôt qu'en production.
  const re = new RegExp(`^${rule.source}$`);

  // Les routes réelles du site : elles doivent retomber sur index.html.
  for (const route of ['/', '/about', '/parcours', '/projets', '/projets/ankh', '/stack', '/contact']) {
    assert.ok(re.test(route), `${route} n’est pas réécrit : Vercel répondrait 404`);
  }

  // Les fichiers servis tels quels : le repli ne doit pas les toucher.
  for (const file of [
    '/google7589f0063f878c18.html',   // la preuve de propriété Google
    '/sitemap.xml',
    '/robots.txt',
    '/manifest.json',
    '/icon.svg',
    '/assets/index-abc123.js',
    '/assets/index-abc123.css',
    '/fonts/inter-400.woff2'
  ]) {
    assert.ok(!re.test(file), `${file} serait remplacé par index.html`);
  }
});
