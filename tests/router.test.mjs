// Les URL sont une promesse : un lien envoyé aujourd'hui doit encore ouvrir
// la même chose demain. Ces tests verrouillent le vocabulaire des chemins et
// l'aller-retour route ↔ URL.

import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePath, routePath, SECTION_TO_URL, URL_TO_SECTION } from '../src/js/router.js';
import { projects } from '../src/data/profile.js';

test('la racine mène à l’accueil', () => {
  assert.deepEqual(parsePath('/'), { section: 'home' });
  assert.deepEqual(parsePath(''), { section: 'home' });
});

test('chaque section a son chemin, et réciproquement', () => {
  for (const [section, url] of Object.entries(SECTION_TO_URL)) {
    const path = routePath({ section }, '');
    assert.equal(path, url ? `/${url}` : '/');
    assert.equal(parsePath(path, '').section, section);
  }
});

test('une fiche projet a une URL propre et partageable', () => {
  const slug = projects[0].slug;
  assert.equal(routePath({ section: 'projects', slug }, ''), `/projets/${slug}`);
  assert.deepEqual(parsePath(`/projets/${slug}`, ''), { section: 'projects', slug });
});

test('un slug inconnu retombe sur la liste des projets, pas sur une page morte', () => {
  const route = parsePath('/projets/nexistepas', '');
  assert.equal(route.section, 'projects');
  assert.equal(route.slug, undefined);
});

test('un chemin inconnu retombe sur l’accueil en signalant l’inconnu', () => {
  const route = parsePath('/nawak', '');
  assert.equal(route.section, 'home');
  assert.equal(route.unknown, 'nawak');
});

test('les slashs superflus ne changent rien', () => {
  assert.equal(parsePath('/parcours/', '').section, 'experience');
  assert.equal(parsePath('//stack//', '').section, 'stack');
});

test('une base de déploiement est retirée avant analyse', () => {
  assert.equal(parsePath('/sous-dossier/stack', '/sous-dossier').section, 'stack');
  assert.equal(routePath({ section: 'stack' }, '/sous-dossier'), '/sous-dossier/stack');
});

test('la table inverse est cohérente', () => {
  for (const [url, section] of Object.entries(URL_TO_SECTION)) {
    assert.equal(SECTION_TO_URL[section], url);
  }
});
