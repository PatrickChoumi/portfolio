// Audit du contenu.
//
// Une mise en page qui repose sur le blanc n'a aucune marge d'erreur : une
// accroche deux fois trop longue ne « déborde » pas, elle défait la
// composition. Les limites ci-dessous ne sont donc pas du zèle, ce sont les
// contraintes du format — et elles doivent échouer bruyamment.

import test from 'node:test';
import assert from 'node:assert/strict';

import { site, lede, intro, work, path as career, tools, contact, colophon, ui } from '../content.js';

const LANGS = ['fr', 'en'];

function bilingual(value, label) {
  assert.equal(typeof value, 'object', `${label} n’est pas un objet { fr, en }`);
  for (const lang of LANGS) {
    const v = value[lang];
    assert.ok(v != null, `${label}.${lang} manquant`);
    if (Array.isArray(v)) assert.ok(v.length > 0, `${label}.${lang} est vide`);
    else assert.ok(String(v).trim().length > 0, `${label}.${lang} est vide`);
  }
}

const len = (value, lang) => String(value[lang]).length;

test('l’identité est complète', () => {
  assert.ok(site.name.trim());
  assert.match(site.email, /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
  bilingual(site.role, 'site.role');
  bilingual(site.location, 'site.location');
  bilingual(site.availability, 'site.availability');
  for (const l of site.links) assert.match(l.url, /^https?:\/\//, `lien douteux : ${l.url}`);
});

test('la ligne de disponibilité tient sur une ligne', () => {
  for (const lang of LANGS) {
    assert.ok(len(site.availability, lang) <= 60, `availability trop longue (${lang})`);
  }
});

test('l’accroche est courte — c’est la seule chose que certains liront', () => {
  bilingual(lede, 'lede');
  for (const lang of LANGS) {
    const n = len(lede, lang);
    assert.ok(n >= 60, `accroche trop courte (${lang}, ${n})`);
    assert.ok(n <= 260, `accroche trop longue (${lang}, ${n}) — deux phrases maximum`);
  }
});

test('l’introduction fait deux ou trois paragraphes, autant dans les deux langues', () => {
  bilingual(intro, 'intro');
  assert.equal(intro.fr.length, intro.en.length, 'nombre de paragraphes différent selon la langue');
  assert.ok(intro.fr.length >= 2 && intro.fr.length <= 3, 'entre deux et trois paragraphes');
  for (const lang of LANGS) {
    for (const p of intro[lang]) assert.ok(p.length <= 420, `paragraphe trop long (${lang})`);
  }
});

test('les projets sont uniques, datés, et tiennent dans le format', () => {
  const ids = work.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants de projets dupliqués');

  for (const p of work) {
    assert.match(p.id, /^[a-z0-9-]+$/, `${p.id} : identifiant non conforme`);
    assert.match(p.year, /^\d{4}$/, `${p.id} : année invalide`);
    assert.ok(p.name.trim(), `${p.id} : nom vide`);
    bilingual(p.line, `${p.id}.line`);
    bilingual(p.detail, `${p.id}.detail`);
    assert.equal(p.detail.fr.length, p.detail.en.length, `${p.id} : détail de longueur différente selon la langue`);
    assert.ok(p.stack.length > 0, `${p.id} : stack vide`);
    if (p.url) assert.match(p.url, /^https?:\/\//, `${p.id} : lien relatif`);

    for (const lang of LANGS) {
      // Une ligne, vraiment : au-delà, elle passe sur trois lignes à
      // l'écran et la rangée cesse d'être scannable.
      assert.ok(len(p.line, lang) <= 80, `${p.id} : accroche trop longue (${lang}, ${len(p.line, lang)})`);
      assert.ok(p.detail[lang].length <= 4, `${p.id} : plus de quatre paragraphes de détail (${lang})`);
    }
  }
});

test('les projets sont antéchronologiques', () => {
  for (let i = 1; i < work.length; i++) {
    assert.ok(Number(work[i - 1].year) >= Number(work[i].year), 'les projets ne sont pas du plus récent au plus ancien');
  }
});

test('le parcours est cohérent et antéchronologique', () => {
  const ids = career.map((j) => j.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants de postes dupliqués');

  const starts = [];
  for (const job of career) {
    assert.match(job.years, /^\d{4}(\s+—(\s+\d{4})?)?$/, `${job.id} : période mal formée (« 2019 — 2022 » ou « 2022 — »)`);
    bilingual(job.role, `${job.id}.role`);
    bilingual(job.place, `${job.id}.place`);
    bilingual(job.line, `${job.id}.line`);
    bilingual(job.detail, `${job.id}.detail`);
    assert.equal(job.detail.fr.length, job.detail.en.length, `${job.id} : détail de longueur différente selon la langue`);
    for (const lang of LANGS) {
      assert.ok(len(job.line, lang) <= 100, `${job.id} : ligne trop longue (${lang})`);
    }
    starts.push(Number(job.years.slice(0, 4)));
  }
  for (let i = 1; i < starts.length; i++) {
    assert.ok(starts[i - 1] >= starts[i], 'le parcours n’est pas du plus récent au plus ancien');
  }
  const ongoing = career.filter((j) => /—\s*$/.test(j.years));
  assert.ok(ongoing.length <= 1, 'plus d’un poste « en cours »');
});

test('les outils sont trois groupes courts, sans jauge ni note', () => {
  for (const lang of LANGS) {
    const groups = tools[lang];
    assert.ok(Array.isArray(groups), `tools.${lang} manquant`);
    assert.equal(groups.length, 3, `tools.${lang} : trois groupes, pas plus`);
    for (const g of groups) {
      assert.ok(g.label.trim(), 'groupe sans libellé');
      assert.ok(g.items.length >= 3 && g.items.length <= 6, `${g.label} : entre trois et six entrées`);
      assert.ok(g.items.join(', ').length <= 70, `${g.label} : la ligne déborde`);
    }
    assert.equal(tools.fr.length, tools.en.length);
  }
});

test('contact et colophon sont bilingues et brefs', () => {
  bilingual(contact, 'contact');
  bilingual(colophon, 'colophon');
  for (const lang of LANGS) {
    assert.ok(len(contact, lang) <= 220, `contact trop long (${lang})`);
    assert.ok(len(colophon, lang) <= 330, `colophon trop long (${lang})`);
  }
});

test('tous les libellés d’interface existent dans les deux langues', () => {
  for (const [key, value] of Object.entries(ui)) bilingual(value, `ui.${key}`);
});
