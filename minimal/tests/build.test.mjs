// Audit du document produit.
//
// Le colophon fait des promesses au lecteur : deux pages statiques, aucune
// dépendance, aucun octet de JavaScript, rien envoyé nulle part. Ces tests
// sont ce qui empêche ces phrases de devenir des mensonges au fil des
// commits — c'est leur seule raison d'être.

import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { page, esc } from '../src/page.mjs';
import { work, path as career, site, colophon } from '../content.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// Les tests rendent les pages en mémoire : ils ne dépendent pas d'un build
// préalable, et ne peuvent donc pas valider un dist/ périmé.
const fr = page('fr');
const en = page('en');

// Le CSS réel, tel que le build l'injectera.
async function fullPage(html) {
  const sheet = await readFile(path.join(ROOT, 'src/styles.css'), 'utf8');
  const fonts = await readFile(path.join(ROOT, 'src/fonts.css'), 'utf8');
  return html.replace('__CSS__', sheet.replace(/@import\s+'\.\/fonts\.css';/, fonts));
}

test('les deux pages sont du HTML complet et déclarent leur langue', () => {
  for (const [lang, html] of [['fr', fr], ['en', en]]) {
    assert.match(html, /^<!DOCTYPE html>/);
    assert.match(html, new RegExp(`<html lang="${lang}">`));
    assert.match(html, /<meta charset="utf-8">/);
    assert.match(html, /<meta name="viewport"/);
    assert.match(html, /<\/html>\s*$/);
  }
});

test('aucun octet de JavaScript — la promesse du colophon', () => {
  for (const html of [fr, en]) {
    assert.doesNotMatch(html, /<script/i, 'une balise script est apparue');
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i, 'un gestionnaire d’événement inline est apparu');
    assert.doesNotMatch(html, /javascript:/i);
  }
  // Et le colophon continue de l'affirmer dans les deux langues.
  assert.match(colophon.fr, /aucun octet de JavaScript/i);
  assert.match(colophon.en, /not one byte of JavaScript/i);
});

test('aucune ressource n’est chargée depuis un tiers', async () => {
  const html = await fullPage(fr);
  // Toutes les sources de ressources (polices, styles, images) doivent être
  // relatives. Les liens du contenu, eux, ont parfaitement le droit de
  // pointer vers l'extérieur : ce sont des liens, pas des chargements.
  const resources = [...html.matchAll(/(?:src|href)="([^"]+)"(?=[^>]*(?:rel="(?:preload|stylesheet|icon)"|as="font"))/g)]
    .map((m) => m[1]);
  for (const url of resources) {
    assert.doesNotMatch(url, /^https?:\/\//, `ressource externe : ${url}`);
  }
  assert.doesNotMatch(html, /@import\s+url\(\s*['"]?https?:/i, 'un @import distant subsiste dans le CSS');
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/, 'référence à Google Fonts');
});

test('les polices sont bien auto-hébergées et préchargées', async () => {
  const html = await fullPage(fr);
  assert.match(html, /rel="preload"[^>]*\/fonts\/newsreader-400\.woff2/);
  assert.match(html, /src: url\('\/fonts\/newsreader-400\.woff2'\)/);
});

test('chaque projet et chaque poste a sa rangée dépliable', () => {
  for (const item of [...work, ...career]) {
    assert.match(fr, new RegExp(`<details class="row" id="${item.id}">`), `rangée manquante : ${item.id}`);
  }
  const details = (fr.match(/<details/g) || []).length;
  assert.equal(details, work.length + career.length);
  // Un <summary> par <details> : sans lui, le bloc n'est ni cliquable ni
  // annoncé aux lecteurs d'écran.
  assert.equal((fr.match(/<summary>/g) || []).length, details);
});

test('les deux pages se renvoient l’une à l’autre', () => {
  assert.match(fr, /<a class="lang" href="\/en\/" hreflang="en">/);
  assert.match(en, /<a class="lang" href="\/" hreflang="fr">/);
  assert.match(fr, /<link rel="alternate" hreflang="en" href="\/en\/">/);
  assert.match(en, /<link rel="alternate" hreflang="fr" href="\/">/);
});

test('la structure d’accessibilité est en place', () => {
  for (const html of [fr, en]) {
    assert.match(html, /<a class="skip" href="#main">/, 'lien d’évitement absent');
    assert.match(html, /id="main"/, 'cible du lien d’évitement absente');
    assert.equal((html.match(/<h1/g) || []).length, 1, 'il faut exactement un h1');
    // Chaque section porte un titre relié par aria-labelledby.
    const labelled = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(labelled.length >= 4, 'sections non étiquetées');
    for (const id of labelled) {
      assert.match(html, new RegExp(`id="${id}"`), `aria-labelledby pointe dans le vide : ${id}`);
    }
  }
});

test('le contenu est échappé', () => {
  assert.equal(esc('<script>&"\''), '&lt;script&gt;&amp;&quot;&#39;');
  // Les guillemets typographiques et les apostrophes du contenu ne doivent
  // pas casser un attribut : le titre en contient.
  assert.match(fr, /<title>Patrick Choumi — Développeur logiciel<\/title>/);
  assert.doesNotMatch(fr, /<title>[^<]*"[^<]*<\/title>/);
});

test('l’adresse email figure sur les deux pages, en mailto', () => {
  for (const html of [fr, en]) {
    assert.match(html, new RegExp(`href="mailto:${site.email.replace('.', '\\.')}"`));
  }
});

test('le poids reste dans le budget annoncé', async () => {
  for (const [lang, html] of [['fr', fr], ['en', en]]) {
    const full = await fullPage(html);
    const gzip = gzipSync(full).length;
    // Le colophon parle d'un document, pas d'une application. Ce plafond
    // est là pour que ça reste vrai — police non comprise, la page tient
    // largement sous les 10 Ko compressés.
    assert.ok(gzip < 10 * 1024, `page ${lang} : ${(gzip / 1024).toFixed(1)} Ko gzip, budget dépassé`);
  }
});

test('le gabarit ne laisse aucun marqueur non remplacé', async () => {
  const html = await fullPage(fr);
  assert.doesNotMatch(html, /__CSS__/);
  assert.doesNotMatch(html, /undefined|\[object Object\]/, 'une valeur manquante s’est glissée dans la page');
});
