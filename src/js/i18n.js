// Internationalisation — français par défaut, anglais en second.
//
// Deux mécanismes complémentaires :
//   • `t(clé)` pour les chaînes de l'interface (chrome, shell, palette) ;
//   • `tx(valeur)` pour les données de profile.js, qui portent leur propre
//     traduction sous forme { fr, en }.
//
// Le HTML statique porte le français dans `data-i18n` ; passer en anglais
// remplace le texte en place. Pas de rechargement, pas de duplication de page.

import { pick, DEFAULT_LANG, LANGS } from '../data/lang.js';

const STORAGE_KEY = 'portfolio_lang';

const DICT = {
  fr: {
    'a11y.skip': 'Aller au contenu',
    'nav.home': 'Accueil',
    'nav.about': 'À propos',
    'nav.experience': 'Parcours',
    'nav.projects': 'Projets',
    'nav.stack': 'Stack',
    'nav.contact': 'Contact',
    'cta.projects': 'Voir les projets',
    'cta.term': '…ou explorer au terminal',
    'block.principles': 'Convictions',
    'block.facts': 'Fiche',
    'exp.title': 'Parcours',
    'exp.lede': 'Le plus récent en premier. Chaque étape de la formation est un commit ; les lignes marquées sont ce qui a été appris.',
    'stack.title': 'Stack',
    'stack.lede': 'Ce que j’utilise, et ce que j’en sais. Le C d’abord, le reste par-dessus.',
    'projects.title': 'Projets',
    'projects.lede': 'Ce qui est construit et ce qui est à construire, décrit par ce que ça résout plutôt que par la liste des technologies employées.',
    'projects.back': 'Tous les projets',
    'projects.detail': 'Ouvrir la fiche',
    'status.terminal': 'terminal',
    'status.hint': '` terminal · ⌘K palette · ⇧? aide',
    'term.hint': 'tape « help »',
    'palette.placeholder': 'Aller à… ou taper une commande',
    'palette.empty': 'Aucun résultat',
    'palette.nav': '↑↓ naviguer',
    'palette.open': '⏎ ouvrir',
    'palette.close': 'Échap fermer',
    'palette.kind.section': 'section',
    'palette.kind.file': 'fichier',
    'palette.kind.cmd': 'commande',
    'palette.kind.link': 'lien',
    'boot.skip': 'Une touche pour passer.',
    'foot.built': 'Construit à la main. Aucune dépendance à l’exécution.',
    'foot.source': 'Le code de ce site est ouvert.',
    'metrics.title': 'En chiffres',
    'links.title': 'Liens',
    'highlights.title': 'Faits marquants',
    'summary.title': 'Résumé',
    'tree.title': 'patrickchoumi/portfolio',
    'aria.theme': 'Changer de thème',
    'aria.lang': 'Changer de langue',
    'aria.palette': 'Palette de commandes',
    'copy.done': 'Copié.',
    'shell.welcome': 'Bienvenue. Ce portfolio est un système de fichiers.',
    'shell.hint': 'Tape `help` pour la liste des commandes, `ls` pour regarder autour, `open projects` pour revenir à la page.',
    'shell.notfound': 'commande introuvable',
    'shell.didyoumean': 'Peut-être :',
    'shell.nosuchfile': 'aucun fichier ou dossier de ce nom',
    'shell.notadir': 'n’est pas un dossier',
    'shell.notafile': 'est un dossier',
    'shell.needarg': 'argument manquant',
    'shell.opened': 'ouvert dans la page',
    'shell.noroute': 'ce fichier n’a pas d’équivalent dans la page',
    'shell.themeNow': 'thème :',
    'shell.langNow': 'langue :',
    'shell.cleared': '',
    'shell.historyEmpty': 'historique vide',
    'shell.matchesNone': 'aucune correspondance'
  },
  en: {
    'a11y.skip': 'Skip to content',
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.experience': 'Career',
    'nav.projects': 'Projects',
    'nav.stack': 'Stack',
    'nav.contact': 'Contact',
    'cta.projects': 'See the projects',
    'cta.term': '…or explore in the terminal',
    'block.principles': 'Principles',
    'block.facts': 'Fact sheet',
    'exp.title': 'Career',
    'exp.lede': 'Most recent first. Every step of the course is a commit; the marked lines are what was learned.',
    'stack.title': 'Stack',
    'stack.lede': 'What I use, and what I know of it. C first, the rest on top.',
    'projects.title': 'Projects',
    'projects.lede': 'What is built and what is still to build, described by what it solves rather than by the list of technologies involved.',
    'projects.back': 'All projects',
    'projects.detail': 'Open details',
    'status.terminal': 'terminal',
    'status.hint': '` terminal · ⌘K palette · ⇧? help',
    'term.hint': 'type “help”',
    'palette.placeholder': 'Go to… or type a command',
    'palette.empty': 'No results',
    'palette.nav': '↑↓ navigate',
    'palette.open': '⏎ open',
    'palette.close': 'Esc to close',
    'palette.kind.section': 'section',
    'palette.kind.file': 'file',
    'palette.kind.cmd': 'command',
    'palette.kind.link': 'link',
    'boot.skip': 'Press any key to skip.',
    'foot.built': 'Built by hand. Zero runtime dependencies.',
    'foot.source': 'The source of this site is open.',
    'metrics.title': 'In numbers',
    'links.title': 'Links',
    'highlights.title': 'Highlights',
    'summary.title': 'Summary',
    'tree.title': 'patrickchoumi/portfolio',
    'aria.theme': 'Toggle theme',
    'aria.lang': 'Switch language',
    'aria.palette': 'Command palette',
    'copy.done': 'Copied.',
    'shell.welcome': 'Welcome. This portfolio is a filesystem.',
    'shell.hint': 'Type `help` for the command list, `ls` to look around, `open projects` to jump back to the page.',
    'shell.notfound': 'command not found',
    'shell.didyoumean': 'Did you mean:',
    'shell.nosuchfile': 'no such file or directory',
    'shell.notadir': 'is not a directory',
    'shell.notafile': 'is a directory',
    'shell.needarg': 'missing argument',
    'shell.opened': 'opened in the page',
    'shell.noroute': 'this file has no counterpart in the page',
    'shell.themeNow': 'theme:',
    'shell.langNow': 'language:',
    'shell.cleared': '',
    'shell.historyEmpty': 'history is empty',
    'shell.matchesNone': 'no match'
  }
};

let current = DEFAULT_LANG;
const listeners = new Set();

export const getLang = () => current;
export const t = (key, fallback = '') => DICT[current]?.[key] ?? DICT[DEFAULT_LANG][key] ?? fallback ?? key;
export const tx = (value) => pick(value, current);

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Applique la langue au document : attribut `lang`, textes marqués
// `data-i18n`, puis notification des modules qui rendent du contenu.
export function applyLang(lang) {
  current = LANGS.includes(lang) ? lang : DEFAULT_LANG;
  document.documentElement.lang = current;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = DICT[current]?.[key];
    if (val != null) el.textContent = val;
  });
  const btn = document.getElementById('btn-lang');
  if (btn) btn.textContent = current === 'fr' ? 'FR' : 'EN';
  listeners.forEach((fn) => fn(current));
}

export function initI18n() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const nav = (navigator.language || 'fr').slice(0, 2).toLowerCase();
  applyLang(saved || (LANGS.includes(nav) ? nav : DEFAULT_LANG));
}

export function setLang(lang) {
  localStorage.setItem(STORAGE_KEY, lang);
  applyLang(lang);
}

export function toggleLang() {
  setLang(current === 'fr' ? 'en' : 'fr');
  return current;
}
