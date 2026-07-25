// Séquence de démarrage.
//
// Un portfolio qui s'ouvre sur un log de boot annonce la couleur en trois
// secondes : ici, on est chez quelqu'un qui aime les machines. Trois garde-fous
// pour que ça ne devienne pas une nuisance :
//   • une seule fois par session (sessionStorage) ;
//   • jamais en `prefers-reduced-motion`, jamais sur un deep-link (arriver
//     sur /projets/theory depuis un lien partagé doit montrer la fiche, pas
//     un écran de chargement) ;
//   • n'importe quelle touche, ou un clic, coupe court immédiatement.

import { identity } from '../data/profile.js';
import { t, getLang } from './i18n.js';

const SESSION_KEY = 'portfolio_booted';

const LINES = {
  fr: [
    ['boot', 'init système de fichiers virtuel'],
    ['ok', 'profil monté sur /'],
    ['ok', 'thème détecté'],
    ['ok', 'shell prêt — 20 commandes'],
    ['ok', '0 dépendance à l’exécution'],
    ['ok', '0 traceur, 0 cookie'],
    ['accent', `bienvenue, invité. ${identity.handle} est là.`]
  ],
  en: [
    ['boot', 'init virtual filesystem'],
    ['ok', 'profile mounted on /'],
    ['ok', 'theme detected'],
    ['ok', 'shell ready — 20 commands'],
    ['ok', '0 runtime dependencies'],
    ['ok', '0 trackers, 0 cookies'],
    ['accent', `welcome, guest. ${identity.handle} is in.`]
  ]
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function runBoot({ deepLink }) {
  const el = document.getElementById('boot');
  if (!el) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || deepLink || sessionStorage.getItem(SESSION_KEY)) {
    el.remove();
    return;
  }
  sessionStorage.setItem(SESSION_KEY, '1');

  const lines = LINES[getLang()] || LINES.fr;
  el.classList.remove('hidden');
  el.innerHTML = `<div class="boot-log"></div><p class="boot-skip">${t('boot.skip')}</p>`;
  const log = el.querySelector('.boot-log');

  let finished = false;
  const finish = async () => {
    if (finished) return;
    finished = true;
    el.classList.add('is-done');
    await wait(360);
    el.remove();
  };

  window.addEventListener('keydown', finish, { once: true });
  el.addEventListener('click', finish, { once: true });

  for (const [kind, text] of lines) {
    if (finished) return;
    const div = document.createElement('div');
    const mark = kind === 'ok' ? '<span class="boot-ok">[ ok ]</span> ' : kind === 'accent' ? '' : '<span>[ .. ]</span> ';
    div.innerHTML = `${mark}<span class="${kind === 'accent' ? 'boot-accent' : ''}">${text}</span>`;
    log.appendChild(div);
    await wait(kind === 'accent' ? 480 : 130 + Math.random() * 110);
  }
  await wait(420);
  finish();
}
