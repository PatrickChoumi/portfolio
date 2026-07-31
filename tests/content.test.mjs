// Audit du contenu. Un portfolio se dégrade par petites négligences : une
// traduction oubliée, un slug dupliqué, un lien mort de syntaxe, une accroche
// qui déborde de sa rangée. La CI refuse ces dérives — c'est ce qui distingue
// une garantie d'une bonne intention.

import test from 'node:test';
import assert from 'node:assert/strict';

import { identity, hero, about, experience, projects, stack, principles, contact } from '../src/data/profile.js';
import { pick, slugify } from '../src/data/lang.js';

const LANGS = ['fr', 'en'];

// Un champ traduisible doit porter les deux langues, non vides.
function assertBilingual(value, label) {
  assert.equal(typeof value, 'object', `${label} n’est pas un objet { fr, en }`);
  for (const lang of LANGS) {
    const v = value[lang];
    assert.ok(v != null, `${label}.${lang} manquant`);
    if (Array.isArray(v)) assert.ok(v.length > 0, `${label}.${lang} est vide`);
    else assert.ok(String(v).trim().length > 0, `${label}.${lang} est vide`);
  }
}

test('l’identité est complète et l’email est plausible', () => {
  assert.ok(identity.name.trim().length > 0);
  // Le nom complet ne sert que sur le CV. S'il divergeait du nom affiché,
  // deux personnes différentes signeraient la même page.
  assert.ok(identity.fullName.includes(identity.name.split(' ').pop()),
    'le nom complet doit contenir le nom affiché');
  assert.match(identity.email, /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
  assertBilingual(identity.role, 'identity.role');
  assertBilingual(identity.location, 'identity.location');
  assert.ok(['open', 'listening', 'closed'].includes(identity.availability));
  assertBilingual(identity.availabilityLabel[identity.availability], 'availabilityLabel');
});

test('tous les liens sont absolus ou mailto', () => {
  for (const l of identity.links) {
    assert.match(l.url, /^(https?:\/\/|mailto:)/, `lien douteux : ${l.url}`);
    assert.ok(l.label && l.handle, 'un lien sans libellé');
  }
});

test('le hero est bilingue, REPL compris', () => {
  assertBilingual(hero.kicker, 'hero.kicker');
  assertBilingual(hero.title, 'hero.title');
  assertBilingual(hero.lede, 'hero.lede');
  for (const lang of LANGS) {
    assert.ok(hero.repl[lang].length >= 2, `hero.repl.${lang} : au moins deux paires`);
    hero.repl[lang].forEach((p, i) => {
      assert.ok(p.q?.trim() && p.a?.trim(), `hero.repl.${lang}[${i}] incomplet`);
      assert.ok(p.a.length < 160, `hero.repl.${lang}[${i}] : réponse trop longue pour le REPL`);
    });
  }
});

test('les deux langues du corps « à propos » ont le même nombre de paragraphes', () => {
  assert.equal(pick(about.body, 'fr').length, pick(about.body, 'en').length);
  about.facts.forEach((f, i) => {
    assertBilingual(f.label, `about.facts[${i}].label`);
    assertBilingual(f.value, `about.facts[${i}].value`);
  });
});

test('le parcours est cohérent, ordonné et bilingue', () => {
  const slugs = experience.map((j) => j.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'slugs de postes dupliqués');

  experience.forEach((job, i) => {
    assert.equal(slugify(job.slug), job.slug, `${job.slug} n’est pas un slug propre`);
    assertBilingual(job.company, `${job.slug}.company`);
    assertBilingual(job.role, `${job.slug}.role`);
    assertBilingual(job.summary, `${job.slug}.summary`);
    assertBilingual(job.highlights, `${job.slug}.highlights`);
    assert.equal(pick(job.highlights, 'fr').length, pick(job.highlights, 'en').length,
      `${job.slug} : nombre de faits marquants différent selon la langue`);
    assert.match(job.start, /^\d{4}$/, `${job.slug} : année de début invalide`);
    if (job.end !== null) assert.match(job.end, /^\d{4}$/, `${job.slug} : année de fin invalide`);
    if (job.end) assert.ok(Number(job.end) >= Number(job.start), `${job.slug} : fin avant début`);
    assert.ok(job.stack.length > 0, `${job.slug} : stack vide`);
    // Le plus récent en premier : c'est la lecture attendue d'un git log.
    if (i > 0) {
      const prev = experience[i - 1];
      assert.ok(Number(prev.start) >= Number(job.start), 'le parcours n’est pas antéchronologique');
    }
  });
  assert.equal(experience.filter((j) => j.end === null).length <= 1, true, 'plus d’un poste « en cours »');
});

test('les projets sont uniques, datés et bilingues', () => {
  const slugs = projects.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'slugs de projets dupliqués');

  for (const p of projects) {
    assert.equal(slugify(p.slug), p.slug, `${p.slug} n’est pas un slug propre`);
    assert.ok(['live', 'wip', 'planned', 'archived'].includes(p.status), `${p.slug} : statut inconnu`);
    assert.match(p.year, /^\d{4}$/, `${p.slug} : année invalide`);
    assertBilingual(p.tagline, `${p.slug}.tagline`);
    assertBilingual(p.summary, `${p.slug}.summary`);
    assertBilingual(p.highlights, `${p.slug}.highlights`);
    assert.equal(pick(p.highlights, 'fr').length, pick(p.highlights, 'en').length,
      `${p.slug} : nombre de faits marquants différent selon la langue`);
    assert.ok(p.stack.length > 0, `${p.slug} : stack vide`);
    for (const m of p.metrics || []) {
      assertBilingual(m.label, `${p.slug}.metric`);
      assert.ok(String(m.value).trim(), `${p.slug} : métrique sans valeur`);
    }
    for (const l of p.links) {
      assert.match(l.url, /^https?:\/\//, `${p.slug} : lien relatif`);
      assertBilingual(l.label, `${p.slug}.link.label`);
    }
    // Une accroche qui déborde casse la mise en page des cartes.
    for (const lang of LANGS) assert.ok(pick(p.tagline, lang).length <= 90, `${p.slug} : accroche trop longue (${lang})`);
  }
});

test('chaque entrée de la stack porte une phrase, pas une note chiffrée', () => {
  for (const group of stack) {
    assertBilingual(group.group, 'stack.group');
    assert.ok(group.items.length > 0, 'groupe de stack vide');
    for (const item of group.items) {
      const name = pick(item.name, 'fr');
      assert.ok(name?.trim(), 'entrée de stack sans nom');

      // Un nom laissé en chaîne nue s'affiche tel quel dans les deux langues.
      // C'est voulu pour « Node » ou « PostgreSQL », mais un accent trahit du
      // français qui se retrouverait dans la page anglaise. Le garde-fou est
      // imparfait — il ne voit pas un mot français sans accent — mais il
      // attrape le cas de loin le plus fréquent.
      if (typeof item.name === 'string') {
        assert.doesNotMatch(item.name, /[à-öø-ÿÀ-ÖØ-Þ]/,
          `${name} : nom accentué laissé en chaîne nue, écris-le { fr, en }`);
      } else {
        assertBilingual(item.name, 'stack.item.name');
      }
      assertBilingual(item.note, `${name}.note`);
      // La page affiche cette phrase sous le nom : au-delà, la rangée passe
      // sur trois lignes et la liste cesse d'être scannable.
      for (const lang of LANGS) {
        assert.ok(pick(item.note, lang).length <= 80, `${name} : note trop longue (${lang})`);
      }
      // Les jauges ont été retirées : un niveau chiffré qui traînerait dans
      // les données ne serait plus affiché nulle part.
      assert.equal(item.level, undefined, `${name} : « level » n’est plus utilisé, retire-le`);
    }
  }
});

test('les convictions et le contact sont bilingues', () => {
  assert.equal(principles.length, 3, 'trois convictions, pas plus : c’est le format');
  principles.forEach((p, i) => {
    assertBilingual(p.name, `principles[${i}].name`);
    assertBilingual(p.desc, `principles[${i}].desc`);
  });
  assertBilingual(contact.title, 'contact.title');
  assertBilingual(contact.lede, 'contact.lede');
  assertBilingual(contact.note, 'contact.note');
});

test('slugify normalise accents, espaces et ponctuation', () => {
  assert.equal(slugify('Langages'), 'langages');
  assert.equal(slugify('Interface & Réseau'), 'interface-reseau');
  assert.equal(slugify('  Plateforme  '), 'plateforme');
});

test('pick retombe sur une autre langue plutôt que sur du vide', () => {
  assert.equal(pick({ fr: 'oui', en: 'yes' }, 'en'), 'yes');
  assert.equal(pick({ fr: 'oui' }, 'en'), 'oui');
  assert.equal(pick('brut', 'en'), 'brut');
  assert.equal(pick(null, 'fr'), '');
});
