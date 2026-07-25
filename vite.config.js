import { defineConfig } from 'vite';

// Le site est une SPA à routes réelles (History API, voir src/js/router.js) :
// /parcours, /projets/<slug>, /contact… Les hébergeurs statiques usuels
// (Netlify, Vercel, Cloudflare Pages, nginx try_files) renvoient index.html
// pour ces chemins ; en dev et en preview, on aligne le comportement pour que
// F5 sur une route profonde ne casse pas.
function spaFallback() {
  return {
    name: 'spa-fallback',
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url.split('?')[0];
        if (req.method === 'GET' && !url.includes('.') && url !== '/') req.url = '/';
        next();
      });
    }
  };
}

export default defineConfig({
  root: '.',
  plugins: [spaFallback()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // es2022 : le projet assume les navigateurs modernes (color-mix, :has,
    // modules natifs). Pas de transpilation défensive.
    target: 'es2022'
  },
  server: { port: 5173 }
});
