// Harnais navigateur — ce que les tests unitaires ne peuvent pas voir.
//
// Les tests Node valident la logique pure (arborescence, commandes, routes).
// Ici on vérifie ce qui n'existe que dans un vrai navigateur : le rendu se
// fait, le terminal exécute, la page et le shell restent synchronisés, les
// URL profondes fonctionnent, et le thème sombre tient.
//
//   npm run build && node tests-e2e/browser.mjs
//   node tests-e2e/browser.mjs --shots   (écrit aussi des captures)

import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const SHOTS = process.argv.includes('--shots');
const SHOT_DIR = process.env.SHOT_DIR || path.resolve('.shots');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain'
};

// Serveur statique minimal avec repli SPA — l'équivalent de ce que fait
// n'importe quel hébergeur, sans dépendance supplémentaire.
function serve() {
  const server = createServer(async (req, res) => {
    const url = req.url.split('?')[0];
    let file = path.join(DIST, url === '/' ? 'index.html' : url);
    if (!path.extname(file) || !existsSync(file)) file = path.join(DIST, 'index.html');
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, port: server.address().port })));
}

let failures = 0;
const results = [];

async function check(label, fn) {
  try {
    await fn();
    results.push(`  ✓ ${label}`);
  } catch (e) {
    failures++;
    results.push(`  ✗ ${label}\n      ${e.message}`);
  }
}

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

async function main() {
  if (!existsSync(DIST)) {
    console.error('dist/ absent — lance `npm run build` d’abord.');
    process.exit(1);
  }
  const { server, port } = await serve();
  const base = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({
    // Chromium fourni par l'environnement quand il existe ; sinon celui que
    // Playwright a téléchargé (`npx playwright install chromium`).
    executablePath: process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined),
    args: ['--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });

  // On distingue les vraies erreurs de script du bruit réseau : une machine
  // de CI hors ligne peut échouer à charger une ressource externe sans que
  // le site soit en cause. Le site n'en charge aucune — mais ce filtre évite
  // un test qui ment sur la raison de son échec.
  const scriptErrors = [];
  page.on('pageerror', (e) => scriptErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (/Failed to load resource/i.test(m.text())) return;
    scriptErrors.push(m.text());
  });

  // Aucune requête ne doit sortir vers un autre hôte que le nôtre.
  const external = new Set();
  page.on('request', (r) => {
    const host = new URL(r.url()).host;
    if (host && host !== `127.0.0.1:${port}`) external.add(host);
  });

  await page.goto(base, { waitUntil: 'networkidle' });
  // La séquence de démarrage se coupe à la première touche.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  await check('l’accueil rend le titre et l’identité', async () => {
    assert((await page.textContent('.hero-title')).trim().length > 5, 'titre vide');
    assert((await page.textContent('#hero-identity')).includes('Patrick'), 'identité absente');
    assert((await page.$$('.principle')).length === 3, 'convictions manquantes');
  });

  await check('l’explorateur et les onglets sont peuplés', async () => {
    assert((await page.$$('.tree-item')).length >= 6, 'arbre incomplet');
    assert((await page.$$('.buffer-tab')).length === 6, 'onglets incomplets');
  });

  await check('naviguer vers les projets change l’URL et la section', async () => {
    await page.click('.tree-item[data-nav="projects"]');
    await page.waitForTimeout(250);
    assert(new URL(page.url()).pathname === '/projets', `URL inattendue : ${page.url()}`);
    assert(await page.isVisible('#projects.is-active'), 'section projets non affichée');
    assert((await page.$$('.project-card')).length >= 3, 'cartes projet manquantes');
  });

  await check('ouvrir une fiche projet donne une URL partageable', async () => {
    await page.click('.project-card[data-slug="theory"]');
    await page.waitForTimeout(250);
    assert(new URL(page.url()).pathname === '/projets/theory', 'URL de fiche incorrecte');
    assert((await page.textContent('#projects .section-title')).includes('Theory'), 'fiche non rendue');
    assert((await page.$$('#projects .metric')).length >= 2, 'métriques absentes');
  });

  await check('un lien profond ouvre directement la fiche', async () => {
    await page.goto(`${base}/projets/atlas`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    assert(await page.isVisible('#projects.is-active'), 'deep-link : mauvaise section');
    assert((await page.textContent('#projects .section-title')).includes('Atlas'), 'deep-link cassé');
  });

  await check('le bouton Précédent revient à la page précédente', async () => {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.click('.tree-item[data-nav="stack"]');
    await page.waitForTimeout(200);
    await page.goBack();
    await page.waitForTimeout(250);
    assert(new URL(page.url()).pathname === '/', 'historique non respecté');
    assert(await page.isVisible('#home.is-active'), 'retour sur la mauvaise section');
  });

  await check('la touche ` ouvre le terminal', async () => {
    await page.keyboard.press('`');
    await page.waitForTimeout(350);
    assert(await page.isVisible('#term.is-open'), 'terminal fermé');
    assert((await page.textContent('#status-mode')).includes('SHELL'), 'mode non mis à jour');
  });

  await check('`ls` liste la racine du système de fichiers', async () => {
    await page.fill('#term-input', 'ls');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const screen = await page.textContent('#term-screen');
    assert(screen.includes('about.md') && screen.includes('projects/'), 'ls incomplet');
  });

  await check('`cd projects` déplace le shell ET la page', async () => {
    await page.fill('#term-input', 'cd projects');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    assert((await page.textContent('#status-path')).includes('projects'), 'chemin non mis à jour');
    assert(await page.isVisible('#projects.is-active'), 'la page n’a pas suivi le shell');
  });

  await check('`cat` affiche un fichier depuis le dossier courant', async () => {
    await page.fill('#term-input', 'cat theory/README.md');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    assert((await page.textContent('#term-screen')).includes('Theory'), 'cat relatif cassé');
  });

  await check('Tab complète un chemin', async () => {
    await page.fill('#term-input', 'cd the');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(120);
    const value = await page.inputValue('#term-input');
    assert(value.startsWith('cd theory'), `complétion inattendue : ${value}`);
    await page.fill('#term-input', '');
  });

  await check('une commande inconnue suggère la plus proche', async () => {
    await page.fill('#term-input', 'sl');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    assert((await page.textContent('#term-screen')).includes('ls'), 'pas de suggestion');
  });

  await check('`open` ramène à la page lisible', async () => {
    await page.fill('#term-input', 'open /stack');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    assert(await page.isVisible('#stack.is-active'), 'open n’a pas navigué');
    assert((await page.$$('.skill')).length >= 6, 'stack non rendue');
  });

  await check('la palette s’ouvre et navigue', async () => {
    await page.keyboard.press('Escape'); // ferme le terminal
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(200);
    assert(await page.isVisible('.palette-overlay.is-open'), 'palette fermée');
    await page.fill('.palette-input', 'contact');
    await page.waitForTimeout(150);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    assert(await page.isVisible('#contact.is-active'), 'la palette n’a pas navigué');
  });

  await check('le thème sombre s’applique et persiste au rechargement', async () => {
    await page.click('#btn-theme');
    await page.waitForTimeout(200);
    assert(await page.getAttribute('html', 'data-theme') === 'dark', 'thème non basculé');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    assert(await page.getAttribute('html', 'data-theme') === 'dark', 'thème non persistant');
  });

  await check('la bascule de langue traduit toute la page', async () => {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    // La langue de départ suit celle du navigateur : on n'en présume rien,
    // on vérifie que la bascule change bien d'état et retraduit le contenu.
    const before = await page.getAttribute('html', 'lang');
    const heroBefore = await page.textContent('.hero-lede');
    await page.click('#btn-lang');
    await page.waitForTimeout(400);
    const after = await page.getAttribute('html', 'lang');
    assert(['fr', 'en'].includes(after) && after !== before, `langue non basculée (${before} → ${after})`);
    assert((await page.textContent('.hero-lede')) !== heroBefore, 'la lede n’a pas été retraduite');
    // Le contenu dérivé des données doit suivre, pas seulement le chrome.
    await page.click('.tree-item[data-nav="experience"]');
    await page.waitForTimeout(300);
    const summary = await page.textContent('#gitlog .commit-summary');
    assert(summary.trim().length > 20, 'parcours vide après changement de langue');
  });

  // ─── La séquence de démarrage ───────────────────────────────────────
  // Elle a trois garde-fous, et chacun peut se casser sans rien casser
  // d'autre — donc chacun se vérifie ici. Un contexte neuf par cas : le
  // sessionStorage est ce qui décide si elle joue.
  await check('le démarrage joue son log, puis s’efface à la première touche', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const p = await ctx.newPage();
    await p.goto(base);
    await p.waitForSelector('.boot-log div', { timeout: 3000 });
    assert((await p.textContent('.boot-log')).trim().length > 0, 'log de démarrage vide');
    await p.keyboard.press('Escape');
    await p.waitForSelector('#boot', { state: 'detached', timeout: 3000 });
    assert(await p.isVisible('#home.is-active'), 'la page n’est pas rendue derrière');
    await ctx.close();
  });

  await check('le démarrage ne joue qu’une fois par session', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const p = await ctx.newPage();
    await p.goto(base);
    await p.waitForSelector('.boot-log div', { timeout: 3000 });
    await p.keyboard.press('Escape');
    await p.waitForSelector('#boot', { state: 'detached', timeout: 3000 });
    // Rechargement dans le même onglet : plus de log, on va droit au contenu.
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    assert((await p.$('#boot')) === null, 'le log rejoue à chaque rechargement');
    await ctx.close();
  });

  await check('un lien profond n’ouvre jamais sur un écran de chargement', async () => {
    // Arriver sur /projets/theory depuis un lien partagé doit montrer la
    // fiche, pas une animation qu'on n'a pas demandée.
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const p = await ctx.newPage();
    await p.goto(`${base}/projets/theory`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    assert((await p.$('#boot')) === null, 'le log de démarrage s’affiche sur un deep-link');
    assert((await p.textContent('#projects .section-title')).includes('Theory'), 'fiche non rendue');
    await ctx.close();
  });

  await check('aucune requête ne sort vers un hôte tiers', () => {
    assert(external.size === 0, `hôtes contactés : ${[...external].join(', ')}`);
  });

  await check('aucune erreur de script', () => {
    assert(scriptErrors.length === 0, scriptErrors.join(' | '));
  });

  if (SHOTS) {
    await mkdir(SHOT_DIR, { recursive: true });
    // Contexte neuf : les tests précédents ont écrit un thème et un
    // historique dans localStorage, la capture « claire » serait sombre.
    await page.context().clearCookies();
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(SHOT_DIR, '01-accueil-clair.png') });
    await page.click('#btn-theme');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOT_DIR, '02-accueil-sombre.png') });
    await page.keyboard.press('`');
    await page.waitForTimeout(400);
    await page.fill('#term-input', 'neofetch');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.fill('#term-input', 'tree projects');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOT_DIR, '03-terminal.png') });
    await page.keyboard.press('Escape');
    await page.click('.tree-item[data-nav="experience"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOT_DIR, '04-parcours.png') });
    await page.click('.tree-item[data-nav="projects"]');
    await page.waitForTimeout(400);
    await page.click('.project-card[data-slug="theory"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOT_DIR, '05-projet.png') });
    await page.setViewportSize({ width: 400, height: 780 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOT_DIR, '06-mobile.png') });
  }

  await browser.close();
  server.close();

  console.log(results.join('\n'));
  console.log(failures ? `\n${failures} échec(s).` : '\nTout est vert.');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
