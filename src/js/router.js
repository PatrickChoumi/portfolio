// Routage par chemin (History API) — des URL réelles, partageables.
//
// Un portfolio dont on ne peut pas envoyer « regarde ce projet » par message
// rate la moitié de son travail. Chaque section et chaque projet a donc son
// chemin :
//
//   /                     accueil
//   /about                à propos
//   /parcours             expérience
//   /projets              liste des projets
//   /projets/<slug>       une fiche projet
//   /stack                compétences
//   /contact              contact
//
// Les fonctions d'analyse sont pures (elles prennent un pathname en
// argument) : elles se testent sans navigateur — voir tests/router.test.mjs.

import { projects } from '../data/profile.js';

export const SECTION_TO_URL = {
  home: '',
  about: 'about',
  experience: 'parcours',
  projects: 'projets',
  stack: 'stack',
  contact: 'contact'
};

export const URL_TO_SECTION = Object.fromEntries(
  Object.entries(SECTION_TO_URL).filter(([, url]) => url).map(([section, url]) => [url, section])
);

// Base de déploiement (Vite : '/' par défaut). `import.meta.env` n'existe pas
// hors bundler — d'où le repli, qui rend le module importable en Node.
const BASE = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '');

export function routePath(route, base = BASE) {
  if (!route || !SECTION_TO_URL[route.section] && route.section !== 'home') return `${base}/`;
  if (route.section === 'projects' && route.slug) return `${base}/projets/${route.slug}`;
  const seg = SECTION_TO_URL[route.section];
  return seg ? `${base}/${seg}` : `${base}/`;
}

export function parsePath(pathname, base = BASE) {
  let p = pathname || '/';
  if (base && p.startsWith(base)) p = p.slice(base.length);
  const parts = p.split('/').filter(Boolean);
  if (!parts.length) return { section: 'home' };

  const [head, ...rest] = parts;
  const section = URL_TO_SECTION[head];
  if (!section) return { section: 'home', unknown: parts.join('/') };

  if (section === 'projects' && rest.length) {
    const slug = rest[0];
    return projects.some((p2) => p2.slug === slug)
      ? { section: 'projects', slug }
      : { section: 'projects', unknown: rest.join('/') };
  }
  return { section };
}

// initRouter(apply) → { set, start }
//   apply(route)  applique une route à l'interface (clic, back/forward, deep-link)
//   set(route)    reflète l'interface dans l'URL (empile une entrée d'historique)
//   start()       lit l'URL courante et l'applique
export function initRouter(apply) {
  let last = null;

  window.addEventListener('popstate', () => {
    const route = parsePath(location.pathname);
    last = routePath(route);
    apply(route, { fromHistory: true });
  });

  return {
    set(route) {
      const path = routePath(route);
      if (path === last) return;
      last = path;
      if (location.pathname !== path) history.pushState(null, '', path + location.search);
    },
    start() {
      const route = parsePath(location.pathname);
      last = routePath(route);
      apply(route, { initial: true });
      return route;
    }
  };
}
