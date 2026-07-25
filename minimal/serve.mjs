// Serveur de développement — quarante lignes, aucune dépendance.
//
// Il reconstruit à chaque requête de page. Le build prend quelques
// millisecondes : inutile d'installer un système de rechargement à chaud,
// F5 suffit et ne ment jamais sur ce qui sera réellement publié.
//
//   node serve.mjs        → http://localhost:4321

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { build } from './build.mjs';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4321;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};

await build({ quiet: true });

createServer(async (req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url.endsWith('/')) url += 'index.html';

  // Reconstruire seulement pour une page : servir une police ne doit pas
  // relancer le build à chaque octet.
  if (url.endsWith('.html')) {
    try {
      await build({ quiet: true });
    } catch (e) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end(`Erreur de build :\n\n${e.stack}`);
    }
  }

  try {
    const body = await readFile(path.join(DIST, url));
    res.writeHead(200, { 'content-type': MIME[path.extname(url)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404');
  }
}).listen(PORT, () => console.log(`  http://localhost:${PORT}`));
