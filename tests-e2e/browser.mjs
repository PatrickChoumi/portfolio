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

  // ─── Responsive ─────────────────────────────────────────────────────
  // Ce qui suit ne se voit pas en redimensionnant la fenêtre à la main : on
  // parcourt toutes les routes à huit largeurs, du plus petit téléphone
  // encore en circulation au grand écran. Trois de ces vérifications ont
  // attrapé de vrais défauts, dont un qui rendait le terminal inutilisable
  // sur un téléphone — il faut donc qu'elles restent.
  const VIEWPORTS = [[320, 568], [360, 640], [390, 844], [414, 896], [768, 1024], [1024, 768], [1280, 800], [1920, 1080]];
  const ROUTES = ['/', '/about', '/parcours', '/projets', '/projets/kairus', '/stack', '/contact'];

  await check('aucune page ne défile horizontalement, à aucune largeur', async () => {
    const bad = [];
    for (const [w, h] of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const p = await ctx.newPage();
      await p.addInitScript(() => sessionStorage.setItem('portfolio_booted', '1'));
      for (const route of ROUTES) {
        await p.goto(base + route, { waitUntil: 'networkidle' });
        await p.waitForTimeout(180);
        const over = await p.evaluate(() =>
          document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (over > 1) bad.push(`${route} @${w} déborde de ${over}px`);
      }
      await ctx.close();
    }
    assert(bad.length === 0, bad.slice(0, 5).join(' | '));
  });

  await check('les cibles tactiles font au moins 24 px (WCAG 2.2, 2.5.8)', async () => {
    const bad = [];
    for (const [w, h] of VIEWPORTS.filter(([w]) => w <= 768)) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const p = await ctx.newPage();
      await p.addInitScript(() => sessionStorage.setItem('portfolio_booted', '1'));
      for (const route of ROUTES) {
        await p.goto(base + route, { waitUntil: 'networkidle' });
        await p.waitForTimeout(180);
        const small = await p.evaluate(() => {
          const out = [];
          for (const el of document.querySelectorAll('a, button, input, [role="button"], [role="tab"]')) {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) continue;
            if (r.width < 24 || r.height < 24) out.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} ${Math.round(r.width)}×${Math.round(r.height)}`);
          }
          return [...new Set(out)];
        });
        for (const s of small) bad.push(`${route} @${w} : ${s}`);
      }
      await ctx.close();
    }
    assert(bad.length === 0, [...new Set(bad)].slice(0, 5).join(' | '));
  });

  await check('le terminal reste utilisable sur un téléphone de 320 px', async () => {
    // Le défaut d'origine : l'invite `patrickchoumi@portfolio:~/projects/kairus$`
    // ne rétrécit pas, et le champ de saisie tombait à ZÉRO pixel de large.
    // On ne pouvait plus taper une seule commande depuis un mobile.
    const ctx = await browser.newContext({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.addInitScript(() => sessionStorage.setItem('portfolio_booted', '1'));
    await p.goto(base, { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    await p.tap('#status-term');
    await p.waitForTimeout(400);
    assert(await p.isVisible('#term.is-open'), 'terminal non ouvert');

    // Une fois dans le dossier au nom le plus long, le champ doit tenir.
    await p.fill('#term-input', 'cd projects/kairus');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(300);
    await p.fill('#term-input', 'ls');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(300);
    assert((await p.textContent('#term-screen')).includes('README.md'), 'le shell ne répond pas');

    const box = await p.locator('#term-input').boundingBox();
    assert(box && box.width >= 60, `champ de saisie réduit à ${Math.round(box?.width ?? 0)}px`);
    await ctx.close();
  });

  await check('la barre latérale escamotée sort du parcours clavier', async () => {
    // Hors de l'écran mais toujours tabulable, elle fait traverser six liens
    // invisibles avant le contenu, et un lecteur d'écran les annonce.
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    await p.addInitScript(() => sessionStorage.setItem('portfolio_booted', '1'));
    await p.goto(base, { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    assert(!(await p.isVisible('.sidebar')), 'la barre latérale fermée reste exposée');
    // Ouverte, elle redevient atteignable — sinon le remède tuerait le menu.
    await p.click('#nav-toggle');
    await p.waitForTimeout(400);
    assert(await p.isVisible('.sidebar .tree-item'), 'la barre latérale ouverte n’est pas atteignable');
    await ctx.close();
  });

  await check('tous les textes tiennent le contraste AA, dans les deux thèmes', async () => {
    const bad = [];
    for (const theme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: theme });
      const p = await ctx.newPage();
      await p.addInitScript(() => sessionStorage.setItem('portfolio_booted', '1'));
      for (const route of ROUTES) {
        await p.goto(base + route, { waitUntil: 'networkidle' });
        await p.waitForTimeout(180);
        const low = await p.evaluate(() => {
          const lum = (c) => {
            const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          // Un fond semi-transparent doit être COMPOSÉ sur ce qu'il y a
          // derrière : lu comme opaque, le lavis bleu à 9 % de la ligne active
          // se mesure comme un bleu plein, et invente un défaut inexistant.
          const bgOf = (el) => {
            const stack = [];
            for (let n = el; n; n = n.parentElement) {
              const v = (getComputedStyle(n).backgroundColor.match(/[\d.]+/g) || []).map(Number);
              if (v.length < 3) continue;
              const a = v.length > 3 ? v[3] : 1;
              if (a === 0) continue;
              stack.push([v.slice(0, 3), a]);
              if (a === 1) break;
            }
            stack.push([[255, 255, 255], 1]);
            let out = stack[stack.length - 1][0];
            for (let i = stack.length - 2; i >= 0; i--) {
              const [c, a] = stack[i];
              out = out.map((x, k) => c[k] * a + x * (1 - a));
            }
            return out;
          };
          const out = [];
          for (const el of document.querySelectorAll('p, span, a, button, h1, h2, h3, li, div, label, input')) {
            if (!el.textContent?.trim() || el.children.length) continue;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || !el.getClientRects().length) continue;
            const fg = (cs.color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
            const [l1, l2] = [lum(fg), lum(bgOf(el))].sort((a, b) => b - a);
            const ratio = (l1 + 0.05) / (l2 + 0.05);
            const size = parseFloat(cs.fontSize);
            const need = (size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700)) ? 3 : 4.5;
            if (ratio < need) out.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} ${ratio.toFixed(2)}:1 < ${need}`);
          }
          return [...new Set(out)];
        });
        for (const l of low) bad.push(`${theme} ${route} : ${l}`);
      }
      await ctx.close();
    }
    assert(bad.length === 0, [...new Set(bad)].slice(0, 5).join(' | '));
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
