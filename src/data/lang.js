// Sélecteur de langue pur — aucune dépendance au DOM, donc testable en Node.
//
// Les données de profile.js mêlent volontairement deux formes :
//   - un objet { fr, en } pour ce qui se traduit ;
//   - une chaîne nue pour ce qui ne se traduit pas (noms propres, techno).
// `pick` absorbe les deux, et retombe sur l'autre langue plutôt que sur du
// vide si une traduction manque : mieux vaut une phrase en anglais qu'un trou.

export const LANGS = ['fr', 'en'];
export const DEFAULT_LANG = 'fr';

export function pick(value, lang = DEFAULT_LANG) {
  if (value == null) return '';
  if (typeof value !== 'object' || Array.isArray(value)) return value;
  return value[lang] ?? value[DEFAULT_LANG] ?? value.en ?? '';
}

// Identifiant d'URL / de fichier à partir d'un libellé libre.
export function slugify(str) {
  return String(str)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
