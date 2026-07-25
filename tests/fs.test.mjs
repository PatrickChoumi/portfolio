// Le système de fichiers virtuel est le cœur du site : si l'arborescence
// dérive de profile.js, tout le reste dérive avec elle. Ces tests figent le
// contrat — structure, résolution de chemins, cohérence des routes.

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFs, resolvePath, lookup, formatPath, walk, pathForRoute, shortHash } from '../src/data/fs.js';
import { projects, experience, stack } from '../src/data/profile.js';

test('l’arbre expose les entrées attendues à la racine', () => {
  const root = buildFs('fr');
  const names = root.children.map((c) => c.name);
  for (const expected of ['about.md', 'resume.md', 'contact.md', 'experience', 'projects', 'stack']) {
    assert.ok(names.includes(expected), `racine sans ${expected}`);
  }
});

test('chaque projet a son dossier avec README, stack et links', () => {
  const root = buildFs('fr');
  for (const p of projects) {
    const node = lookup(root, ['projects', p.slug]);
    assert.ok(node, `projects/${p.slug} absent`);
    assert.equal(node.type, 'dir');
    const files = node.children.map((c) => c.name).sort();
    assert.deepEqual(files, ['README.md', 'links.txt', 'stack.txt']);
  }
});

test('chaque poste a son fichier dans experience/', () => {
  const root = buildFs('fr');
  for (const job of experience) {
    assert.ok(lookup(root, ['experience', `${job.slug}.md`]), `experience/${job.slug}.md absent`);
  }
});

test('stack/ contient un fichier par groupe', () => {
  const root = buildFs('fr');
  const dir = lookup(root, ['stack']);
  assert.equal(dir.children.length, stack.length);
});

test('resolvePath gère le relatif, l’absolu, « . » et « .. »', () => {
  assert.deepEqual(resolvePath([], 'projects'), ['projects']);
  assert.deepEqual(resolvePath(['projects'], 'theory'), ['projects', 'theory']);
  assert.deepEqual(resolvePath(['projects', 'theory'], '..'), ['projects']);
  assert.deepEqual(resolvePath(['projects', 'theory'], '../../about.md'), ['about.md']);
  assert.deepEqual(resolvePath(['projects'], '/stack'), ['stack']);
  assert.deepEqual(resolvePath(['projects'], './'), ['projects']);
  // Remonter au-delà de la racine ne doit pas produire de segments négatifs.
  assert.deepEqual(resolvePath([], '../../..'), []);
});

test('lookup renvoie null hors de l’arbre plutôt que de lever', () => {
  const root = buildFs('fr');
  assert.equal(lookup(root, ['nope']), null);
  assert.equal(lookup(root, ['about.md', 'encore']), null, 'un fichier n’est pas traversable');
});

test('formatPath produit un chemin absolu lisible', () => {
  assert.equal(formatPath([]), '/');
  assert.equal(formatPath(['projects', 'theory']), '/projects/theory');
});

test('tous les fichiers ont un contenu non vide', () => {
  const root = buildFs('fr');
  for (const { node, path } of walk(root)) {
    if (node.type !== 'file') continue;
    assert.ok(node.content && node.content.trim().length > 0, `/${path.join('/')} est vide`);
  }
});

test('toute route de nœud pointe vers une section connue', () => {
  const sections = new Set(['home', 'about', 'experience', 'projects', 'stack', 'contact']);
  for (const { node, path } of walk(buildFs('fr'))) {
    if (!node.route) continue;
    assert.ok(sections.has(node.route.section), `/${path.join('/')} → section inconnue`);
    if (node.route.slug) {
      assert.ok(projects.some((p) => p.slug === node.route.slug), `slug inconnu sur /${path.join('/')}`);
    }
  }
});

test('pathForRoute est l’inverse de la navigation pour les routes connues', () => {
  assert.deepEqual(pathForRoute({ section: 'home' }), []);
  assert.deepEqual(pathForRoute({ section: 'projects' }), ['projects']);
  assert.deepEqual(pathForRoute({ section: 'projects', slug: 'theory' }), ['projects', 'theory']);
  assert.deepEqual(pathForRoute({ section: 'stack' }), ['stack']);
  // …et le chemin obtenu existe réellement dans l'arbre.
  const root = buildFs('fr');
  assert.ok(lookup(root, pathForRoute({ section: 'projects', slug: projects[0].slug })));
});

test('shortHash est déterministe et court', () => {
  assert.equal(shortHash('independant'), shortHash('independant'));
  assert.equal(shortHash('independant').length, 7);
  assert.notEqual(shortHash('a'), shortHash('b'));
});

test('l’arbre anglais a exactement la même forme que le français', () => {
  const shape = (node) => node.type === 'dir'
    ? { name: node.name, children: node.children.map(shape) }
    : { name: node.name };
  assert.deepEqual(shape(buildFs('en')), shape(buildFs('fr')));
});
