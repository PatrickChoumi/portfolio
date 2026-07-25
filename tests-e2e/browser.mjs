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

import { testAvatar } from './make-png.mjs';

const DIST = path.resolve('dist');
const SHOTS = process.argv.includes('--shots');
const SHOT_DIR = process.env.SHOT_DIR || path.resolve('.shots');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain'
};

// Serveur statique minimal avec repli SPA — l'équivalent de ce que fait
// n'importe quel hébergeur, sans dépendance supplémentaire.
const TEST_AVATAR = testAvatar(128);

function serve() {
  const server = createServer(async (req, res) => {
    const url = req.url.split('?')[0];
    // Si aucune photo n'est déposée dans public/, on en sert une de synthèse :
    // la conversion en caractères doit être vérifiée dans les deux cas.
    if (url === '/avatar.png' && !existsSync(path.join(DIST, 'avatar.png'))) {
      res.writeHead(200, { 'content-type': 'image/png' });
      return res.end(TEST_AVATAR);
    }
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
  await page.waitForTimeout(400);

  await check('l’accueil rend le titre et l’identité', async () => {
    assert((await page.textContent('.hero-title')).trim().length > 5, 'titre vide');
    assert((await page.textContent('#hero-identity')).includes('Patrick'), 'identité absente');
    assert((await page.$$('.principle')).length === 3, 'convictions manquantes');
  });

  await check('le sommaire est peuplé', async () => {
    assert((await page.$$('.tree-item')).length >= 6, 'sommaire incomplet');
  });

  // Ces éléments-là ont été retirés pour de bon : s'ils réapparaissent, c'est
  // que le chrome regagne du terrain sur la lecture.
  await check('le chrome retiré n’est pas revenu', async () => {
    for (const sel of ['.buffer-tabs', '.gutter', '#boot']) {
      assert((await page.$$(sel)).length === 0, `${sel} est de retour`);
    }
    assert(!(await page.isVisible('#term.is-open')), 'le terminal est ouvert au chargement');
  });

  await check('la barre de statut affiche le mode et le chemin', async () => {
    assert(await page.isVisible('.statusbar'), 'barre de statut absente');
    assert((await page.textContent('#status-mode')).trim().length > 0, 'mode vide');
    assert((await page.textContent('#status-path')).includes('~'), 'chemin absent');
  });

  await check('le portrait apparaît dans le sommaire quand l’image existe', async () => {
    assert(await page.isVisible('#avatar'), 'portrait masqué alors que l’image est servie');
    const src = await page.getAttribute('#avatar-img', 'src');
    assert(src && src.includes('avatar'), `source inattendue : ${src}`);
  });

  await check('naviguer vers les projets change l’URL et la section', async () => {
    await page.click('.tree-item[data-nav="projects"]');
    await page.waitForTimeout(250);
    assert(new URL(page.url()).pathname === '/projets', `URL inattendue : ${page.url()}`);
    assert(await page.isVisible('#projects.is-active'), 'section projets non affichée');
    assert((await page.$$('.project-row')).length >= 3, 'rangées de projets manquantes');
  });

  await check('ouvrir une fiche projet donne une URL partageable', async () => {
    await page.click('.project-row[data-slug="theory"]');
    await page.waitForTimeout(250);
    assert(new URL(page.url()).pathname === '/projets/theory', 'URL de fiche incorrecte');
    assert((await page.textContent('#projects .section-title')).includes('Theory'), 'fiche non rendue');
    assert((await page.textContent('#projects .metrics')).includes('modules'), 'chiffres absents');
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
    assert((await page.textContent('#term-bar-path')).includes('projects'), 'chemin non mis à jour');
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
    assert((await page.$$('.stack-item')).length >= 6, 'stack non rendue');
  });

  await check('`portrait` convertit l’image en caractères', async () => {
    await page.fill('#term-input', 'portrait 30');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const lines = await page.$$eval('#term-screen .art', (els) => els.map((e) => e.textContent));
    assert(lines.length >= 8, `trop peu de lignes : ${lines.length}`);
    assert(lines.every((l) => l.length === 30), 'largeur demandée non respectée');
    // Une mire produit forcément plusieurs niveaux : un dessin uniforme
    // signifierait que l'échantillonnage ne lit rien.
    const distinct = new Set(lines.join('').split(''));
    assert(distinct.size >= 4, `dessin trop uniforme : ${[...distinct].join('')}`);
  });

  await check('`neofetch` place le portrait à côté de la fiche', async () => {
    await page.fill('#term-input', 'neofetch');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const screen = await page.textContent('#term-screen');
    assert(screen.includes('patrickchoumi@portfolio'), 'fiche absente');
    assert((await page.$$('#term-screen .art')).length > 0, 'portrait absent du neofetch');
  });

  await check('cliquer le portrait ouvre le terminal dessus', async () => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    await page.click('#avatar');
    await page.waitForTimeout(500);
    assert(await page.isVisible('#term.is-open'), 'terminal fermé');
    assert((await page.textContent('#term-screen')).includes('portrait'), 'commande non jouée');
  });

  await check('la palette s’ouvre et navigue', async () => {
    await page.keyboard.press('Escape'); // ferme le terminal
    await page.waitForTimeout(250);
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
    await page.fill('#term-input', 'portrait 26');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    await page.fill('#term-input', 'tree projects');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOT_DIR, '03-terminal.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.click('.tree-item[data-nav="experience"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOT_DIR, '04-parcours.png') });
    await page.click('.tree-item[data-nav="projects"]');
    await page.waitForTimeout(400);
    await page.click('.project-row[data-slug="theory"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOT_DIR, '05-projet.png') });
    await page.click('.tree-item[data-nav="stack"]');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOT_DIR, '06-stack.png') });
    await page.click('.tree-item[data-nav="about"]');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOT_DIR, '07-about.png') });
    await page.setViewportSize({ width: 400, height: 780 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOT_DIR, '08-mobile.png') });
  }

  await browser.close();
  server.close();

  console.log(results.join('\n'));
  console.log(failures ? `\n${failures} échec(s).` : '\nTout est vert.');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
