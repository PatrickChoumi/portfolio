// ═══════════════════════════════════════════════════════════════════════
//  LA TÊTE DU DOCUMENT SUIT LA ROUTE
//
//  Le site a onze URL réelles, mais un seul fichier HTML. Sans ce module,
//  les onze partagent le même `<title>` et la même description : pour un
//  moteur de recherche, ce sont onze fois la même page. Google exécute bien
//  le JavaScript, mais il indexe ce qu'il trouve dans la tête APRÈS
//  exécution — encore faut-il que quelque chose l'ait mise à jour.
//
//  C'est ce que fait `applyHead()`, branché sur `navigate()`, c'est-à-dire
//  sur le point de passage unique de toute navigation. Rien à synchroniser :
//  clic dans l'explorateur, `cd` au terminal, bouton Précédent ou lien
//  partagé passent tous par là.
//
//  Le canonique est déduit de `location.origin` plutôt que d'un domaine écrit
//  en dur : il est juste en préproduction comme en production, et il n'y a
//  rien à reconfigurer le jour d'un changement d'hébergeur. Un canonique faux
//  est pire que pas de canonique — il désigne une page qui n'existe pas.
// ═══════════════════════════════════════════════════════════════════════

import { identity, about, contact, hero, projects } from '../data/profile.js';
import { t, tx, getLang } from './i18n.js';
import { routePath } from './router.js';

// Les données portent un peu de balisage (`<em>`, `<br>`) pour la page. Une
// description de résultat de recherche est du texte nu, et Google coupe
// autour de 160 caractères : au-delà, la phrase est tronquée en plein milieu.
function plain(str, max = 158) {
  const text = String(str)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(', '), cut.lastIndexOf(' '));
  return `${cut.slice(0, stop > max * 0.6 ? stop : max).trim()}…`;
}

// Titre et description de chaque route. Tout vient de profile.js et de
// i18n.js : aucune phrase n'est écrite ici, sinon il faudrait la traduire une
// seconde fois et elle dériverait.
export function headFor(route) {
  const me = identity.name;
  const role = tx(identity.role);
  const place = tx(identity.location);

  if (route.section === 'projects' && route.slug) {
    const p = projects.find((x) => x.slug === route.slug);
    if (p) return { title: `${p.name} — ${me}`, desc: plain(tx(p.summary)) };
  }

  switch (route.section) {
    case 'about':
      return { title: `${tx(about.title)} — ${me}`, desc: plain(tx(about.body)[0]) };
    case 'experience':
      return { title: `${t('exp.title')} — ${me}`, desc: plain(t('exp.lede')) };
    case 'projects':
      return { title: `${t('projects.title')} — ${me}`, desc: plain(t('projects.lede')) };
    case 'stack':
      return { title: `${t('stack.title')} — ${me}`, desc: plain(t('stack.lede')) };
    case 'contact':
      return { title: `${tx(contact.title)} — ${me}`, desc: plain(tx(contact.lede)) };
    default:
      // L'accueil porte le titre le plus utile en résultat de recherche :
      // qui, quoi, où. C'est la requête « patrick choumi » qui doit tomber
      // dessus, pas sur la fiche d'un projet.
      return { title: `${me} — ${role}, ${place}`, desc: plain(tx(hero.lede)) };
  }
}

// Crée la balise si elle manque, la met à jour sinon.
function meta(selector, attr, value, create) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function applyHead(route) {
  const { title, desc } = headFor(route);
  const url = location.origin + routePath(route);

  document.title = title;
  document.documentElement.lang = getLang();

  meta('meta[name="description"]', 'content', desc, () => {
    const el = document.createElement('meta');
    el.setAttribute('name', 'description');
    return el;
  });
  meta('link[rel="canonical"]', 'href', url, () => {
    const el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    return el;
  });

  for (const [prop, value] of [['og:title', title], ['og:description', desc], ['og:url', url]]) {
    meta(`meta[property="${prop}"]`, 'content', value, () => {
      const el = document.createElement('meta');
      el.setAttribute('property', prop);
      return el;
    });
  }
}
