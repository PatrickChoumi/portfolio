// Le shell est la moitié « surprenante » du site : s'il ment (mauvais
// chemin, commande fantôme, complétion incohérente), l'effet s'effondre.
// Les commandes sont écrites pour être exécutables sans navigateur : un
// contexte factice suffit.

import test from 'node:test';
import assert from 'node:assert/strict';

import { tokenize, parseLine, COMMANDS, nearestCommand, colorize } from '../src/js/commands.js';
import { buildFs } from '../src/data/fs.js';
import { pick } from '../src/data/lang.js';

// Contexte minimal — enregistre les effets au lieu de les produire.
function makeCtx(cwd = []) {
  const effects = { cwd, navigated: null, cleared: false, theme: 'light', lang: 'fr' };
  return {
    effects,
    root: buildFs('fr'),
    get cwd() { return effects.cwd; },
    lang: 'fr',
    t: (k) => k,
    tx: (v) => pick(v, 'fr'),
    setCwd(segs) { effects.cwd = segs; },
    navigate(route) { effects.navigated = route; },
    setTheme(v) { effects.theme = v || (effects.theme === 'dark' ? 'light' : 'dark'); return effects.theme; },
    setLang(v) { effects.lang = v || 'en'; return effects.lang; },
    print() { effects.printed = true; },
    openUrl(u) { effects.url = u; },
    matrix() { effects.matrix = true; },
    close() { effects.closed = true; },
    clear() { effects.cleared = true; },
    history: () => ['ls', 'cat about.md'],
    theme: () => effects.theme,
    uptime: () => '3s',
    columns: () => 40,
    // Aucune photo dans un contexte de test : les commandes qui en dépendent
    // doivent se rabattre proprement. Le rendu réel d'une image se vérifie
    // dans le navigateur (tests-e2e/browser.mjs).
    ascii: async () => null
  };
}

const text = (lines) => lines.map((l) => (l.html != null ? l.html.replace(/<[^>]*>/g, '') : l.text)).join('\n');

test('tokenize respecte les guillemets', () => {
  assert.deepEqual(tokenize('ls -la projects'), ['ls', '-la', 'projects']);
  assert.deepEqual(tokenize('grep "deux mots"'), ['grep', 'deux mots']);
  assert.deepEqual(tokenize("echo 'un seul'"), ['echo', 'un seul']);
  assert.deepEqual(tokenize('   '), []);
});

test('parseLine sépare la commande, les arguments et le pipe', () => {
  assert.deepEqual(parseLine('ls'), { name: 'ls', args: [], pipe: null });
  assert.deepEqual(parseLine('cat about.md | grep clarté'), {
    name: 'cat', args: ['about.md'], pipe: ['grep', 'clarté']
  });
  assert.equal(parseLine('').name, '');
});

test('ls liste la racine et masque les fichiers cachés sans -a', () => {
  const ctx = makeCtx();
  const out = text(COMMANDS.ls.run([], ctx));
  assert.match(out, /about\.md/);
  assert.match(out, /projects\//);
  assert.doesNotMatch(out, /\.secret/);
  assert.match(text(COMMANDS.ls.run(['-a'], ctx)), /\.secret/);
});

test('cd descend, remonte, et refuse un fichier', () => {
  const ctx = makeCtx();
  COMMANDS.cd.run(['projects'], ctx);
  assert.deepEqual(ctx.effects.cwd, ['projects']);

  COMMANDS.cd.run(['..'], ctx);
  assert.deepEqual(ctx.effects.cwd, []);

  const out = COMMANDS.cd.run(['about.md'], ctx);
  assert.equal(out[0].cls, 'is-err');
  assert.deepEqual(ctx.effects.cwd, [], 'un échec ne doit pas déplacer le cwd');
});

test('cd vers un dossier routé fait suivre la page', () => {
  const ctx = makeCtx();
  COMMANDS.cd.run(['projects'], ctx);
  assert.deepEqual(ctx.effects.navigated, { section: 'projects' });
});

test('cat affiche un fichier et refuse un dossier', () => {
  const ctx = makeCtx();
  assert.match(text(COMMANDS.cat.run(['about.md'], ctx)), /\S/);
  assert.equal(COMMANDS.cat.run(['projects'], ctx)[0].cls, 'is-err');
  assert.equal(COMMANDS.cat.run([], ctx)[0].cls, 'is-err');
  assert.equal(COMMANDS.cat.run(['nope.md'], ctx)[0].cls, 'is-err');
});

test('cat résout un chemin relatif depuis le cwd', () => {
  const ctx = makeCtx(['projects', 'theory']);
  const out = text(COMMANDS.cat.run(['README.md'], ctx));
  assert.match(out, /Theory/);
});

test('open navigue quand le nœud porte une route', () => {
  const ctx = makeCtx();
  COMMANDS.open.run(['projects/theory'], ctx);
  assert.deepEqual(ctx.effects.navigated, { section: 'projects', slug: 'theory' });
});

test('grep trouve un motif et signale l’absence', () => {
  const ctx = makeCtx();
  assert.match(text(COMMANDS.grep.run(['Theory'], ctx)), /projects\/theory/);
  assert.equal(COMMANDS.grep.run(['zzzzintrouvable'], ctx)[0].cls, 'is-dim');
});

test('tree dessine des branches et se termine par └──', () => {
  const out = text(COMMANDS.tree.run(['projects'], makeCtx()));
  assert.match(out, /├──/);
  assert.match(out, /└──/);
});

test('les commandes à effet passent bien par le contexte', () => {
  const ctx = makeCtx();
  COMMANDS.clear.run([], ctx);
  assert.equal(ctx.effects.cleared, true);
  COMMANDS.exit.run([], ctx);
  assert.equal(ctx.effects.closed, true);
  COMMANDS.matrix.run([], ctx);
  assert.equal(ctx.effects.matrix, true);
  COMMANDS.theme.run(['dark'], ctx);
  assert.equal(ctx.effects.theme, 'dark');
});

test('help documente toutes les commandes visibles', () => {
  const ctx = makeCtx();
  const out = text(COMMANDS.help.run([], ctx));
  for (const [name, cmd] of Object.entries(COMMANDS)) {
    if (cmd.hidden) continue;
    assert.match(out, new RegExp(`\\b${name}\\b`), `help n’annonce pas ${name}`);
  }
});

test('chaque commande déclare un usage bilingue', () => {
  for (const [name, cmd] of Object.entries(COMMANDS)) {
    assert.equal(typeof cmd.run, 'function', `${name} n’a pas de run`);
    assert.ok(cmd.usage.fr && cmd.usage.en, `${name} n’a pas d’usage bilingue`);
  }
});

test('nearestCommand suggère la commande la plus proche', () => {
  assert.equal(nearestCommand('sl'), 'ls');
  assert.equal(nearestCommand('opne'), 'open');
  assert.equal(nearestCommand('xyzzy'), null);
});

test('colorize n’émet jamais de HTML non échappé', () => {
  // Contrat : une ligne est soit `{ text }` — posée avec textContent, donc
  // inerte — soit `{ html }`, et dans ce cas tout ce qui vient du contenu
  // doit être passé par escapeHtml. On teste les deux chemins, dont les
  // lignes « spéciales » (titre, puce, lien) qui, elles, produisent du HTML.
  const attack = '<script>alert(1)</script>';
  const samples = [
    attack,
    `# ${attack}`,
    `  · ${attack}`,
    `$ ${attack}`,
    `1. ${attack}`,
    `https://exemple.test/?x=${attack}`
  ];
  for (const sample of samples) {
    for (const l of colorize(sample)) {
      if (l.html == null) continue; // rendu en textContent : rien à échapper
      assert.doesNotMatch(l.html, /<script/i, `HTML brut laissé passer pour : ${sample}`);
      assert.match(l.html, /&lt;script/i, `contenu non échappé pour : ${sample}`);
    }
  }
});

test('neofetch se rabat sur sa vignette quand aucune photo n’est déposée', async () => {
  const out = text(await COMMANDS.neofetch.run([], makeCtx()));
  assert.match(out, /patrickchoumi@portfolio/);
  assert.match(out, /▄▄▄/, 'vignette de secours absente');
});

test('portrait explique quoi faire quand il n’y a pas d’image', async () => {
  const out = await COMMANDS.portrait.run([], makeCtx());
  assert.equal(out[0].cls, 'is-dim');
  assert.match(text(out), /avatar\.png/);
});

test('les easter eggs répondent sans casser', () => {
  const ctx = makeCtx();
  assert.match(text(COMMANDS.sudo.run(['hire-me'], ctx)), /@/);
  assert.equal(COMMANDS.sudo.run([], ctx)[0].cls, 'is-err');
  assert.equal(COMMANDS.rm.run(['-rf', '/'], ctx)[0].cls, 'is-err');
});
