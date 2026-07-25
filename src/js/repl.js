// Le REPL de l'accueil.
//
// Même parti pris que le hero de Theory : plutôt que de PROMETTRE une façon
// de travailler, on la MONTRE — le terminal tape de vraies questions et de
// vraies réponses. Le contenu vient de profile.js (hero.repl), donc il se
// modifie sans toucher au code.
//
// Se met en pause quand l'onglet est masqué, s'arrête proprement au
// changement de langue, et affiche une paire fixe en `prefers-reduced-motion`.

import { hero } from '../data/profile.js';
import { getLang } from './i18n.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let generation = 0;

async function typeInto(el, text, speed, gen) {
  el.textContent = '';
  for (const ch of text) {
    if (gen !== generation) return false;
    el.textContent += ch;
    await wait(speed + Math.random() * speed * 0.7);
  }
  return true;
}

export function initRepl() {
  const qEl = document.getElementById('repl-q');
  const aEl = document.getElementById('repl-a');
  if (!qEl || !aEl) return;

  const pairs = hero.repl[getLang()] || hero.repl.fr;
  const gen = ++generation; // invalide la boucle précédente

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    qEl.textContent = pairs[0].q;
    aEl.textContent = pairs[0].a;
    return;
  }

  (async () => {
    let i = 0;
    await wait(600);
    for (;;) {
      if (gen !== generation) return;
      if (document.hidden) { await wait(500); continue; }
      const { q, a } = pairs[i];
      aEl.textContent = '';
      if (!await typeInto(qEl, q, 30, gen)) return;
      await wait(420);
      if (!await typeInto(aEl, a, 12, gen)) return;
      await wait(3800);
      i = (i + 1) % pairs.length;
      await wait(320);
    }
  })();
}
