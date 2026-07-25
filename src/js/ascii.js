// ═══════════════════════════════════════════════════════════════════════
//  LE PORTRAIT, EN CARACTÈRES
//
//  Le site repose sur une idée : une seule source, deux rendus. La photo de
//  profil ne fait pas exception — c'est le même fichier qui s'affiche dans le
//  sommaire et qui, dans le terminal, devient un tableau de caractères.
//
//  La conversion se fait dans le navigateur, au moment où on la demande :
//  aucune étape de build, aucun décodeur d'image à écrire, aucune dépendance,
//  et n'importe quel format lisible par le navigateur fonctionne.
//
//  Trois décisions ont été prises après un premier rendu illisible :
//
//  1. LES CARACTÈRES JOUENT L'ENCRE, PAS LA LUMIÈRE. Les pixels sombres sont
//     denses, les clairs sont vides — dans les deux thèmes. Inverser la rampe
//     sur fond sombre remplissait le cadre de « @ » : sur un dessin au trait,
//     dont le fond est blanc, le visage disparaissait.
//
//  2. ON SUR-ÉCHANTILLONNE, PUIS ON PENCHE VERS LE PLUS SOMBRE. Réduire une
//     image directement à la taille d'une grille de caractères fait la
//     moyenne de chaque cellule : un trait noir d'un pixel au milieu de blanc
//     devient un gris très clair, et le dessin s'efface. On dessine donc à
//     plusieurs fois la résolution cible, puis chaque cellule mélange sa
//     moyenne et son pixel le plus sombre. Les traits survivent, les aplats
//     gardent leur valeur.
//
//  3. LES NIVEAUX SONT RECALÉS SUR L'IMAGE. Plutôt qu'un contraste fixe, on
//     étale la plage réellement présente (2e au 98e centile) sur toute la
//     rampe. Une image terne comme une image contrastée sortent lisibles.
//
//  4. LES DEMI-TONS SONT REPOUSSÉS VERS LE PAPIER. Une trame de manga —
//     hachures serrées — a beau se lire gris clair à l'œil, sa moyenne est
//     franchement sombre : sans correction, une chevelure sort en bloc plein
//     et avale le visage. Une courbe en puissance rend ces aplats au papier
//     et ne garde dense que l'encre franche.
//
//  (Détail voisin, réglé côté CSS : JetBrains Mono ligature « == », « -- »,
//  « =+ ». Sur un dessin en caractères, ces fusions disloquent la grille — le
//  terminal coupe donc les ligatures.)
//
//  Si aucune image n'est déposée, tout se dégrade proprement : `loadImage`
//  rejette, l'appelant retombe sur son rendu de secours. Rien ne casse.
// ═══════════════════════════════════════════════════════════════════════

// Du plus clair au plus dense. Dix niveaux : au-delà, l'œil ne distingue
// plus, et le dessin devient du bruit.
const RAMP = ' .:-=+*#%@';

// Résolution de travail : chaque cellule de caractère est examinée sur
// SUPER×SUPER pixels. Au-delà de 4, le gain devient invisible.
const SUPER = 4;

// Part du pixel le plus sombre dans la valeur d'une cellule. À 0 on obtient
// une moyenne pure — les traits d'un pixel s'effacent. À 1, le moindre point
// noir noircit toute la cellule et les aplats hachurés se bouchent. Réglé à
// l'œil sur une vraie planche de manga.
const INK_BIAS = 0.32;

// Courbe appliquée après le recalage des niveaux. En dessous de 1, elle
// repousse les demi-tons vers le papier. Sans elle, une chevelure hachurée —
// qui se lit gris clair à l'œil — sort en bloc uniforme et avale le visage.
const GAMMA = 0.28;

// Rapport hauteur/largeur d'un caractère. Sert de repli : l'appelant mesure
// normalement la vraie valeur sur le terminal et la passe en option.
const DEFAULT_CHAR_RATIO = 2;

const cache = new Map();

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Le fichier est servi par notre propre origine ; l'attribut évite
    // simplement qu'une image tierce ne « teinte » le canvas et ne rende
    // getImageData inutilisable.
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image introuvable : ${url}`));
    img.src = url;
  });
}

// Renvoie un tableau de lignes de texte, de `cols` caractères de large.
// `charRatio` : hauteur d'un caractère divisée par sa largeur, à l'écran.
export async function imageToAscii(url, cols = 40, {
  charRatio = DEFAULT_CHAR_RATIO, inkBias = INK_BIAS, gamma = GAMMA, maxRows = 0
} = {}) {
  const img = await loadImage(url);
  const aspect = img.naturalHeight / img.naturalWidth;

  let rows = Math.max(1, Math.round((cols * aspect) / charRatio));
  // Un portrait plus haut que la fenêtre oblige à faire défiler pour le voir
  // en entier : on préfère le rétrécir jusqu'à ce qu'il tienne d'un coup
  // d'œil. Une largeur explicite (`portrait 90`) passe outre.
  if (maxRows && rows > maxRows) {
    rows = maxRows;
    cols = Math.max(12, Math.round((rows * charRatio) / aspect));
  }

  const key = `${url}|${cols}×${rows}|${charRatio.toFixed(2)}|${inkBias}|${gamma}`;
  if (cache.has(key)) return cache.get(key);

  const w = cols * SUPER;
  const h = rows * SUPER;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Fond blanc explicite : une image à canal alpha doit tomber sur du papier,
  // pas sur du noir — sinon la transparence devient de l'encre.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);

  // ─── Une valeur par cellule ─────────────────────────────────────────
  const cells = new Float32Array(cols * rows);
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      let sum = 0;
      let min = 1;
      for (let sy = 0; sy < SUPER; sy++) {
        for (let sx = 0; sx < SUPER; sx++) {
          const i = ((cy * SUPER + sy) * w + cx * SUPER + sx) * 4;
          // Luminance perceptuelle (Rec. 709), pas une moyenne des canaux.
          const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
          sum += lum;
          if (lum < min) min = lum;
        }
      }
      const mean = sum / (SUPER * SUPER);
      cells[cy * cols + cx] = mean * (1 - inkBias) + min * inkBias;
    }
  }

  // ─── Recalage des niveaux ───────────────────────────────────────────
  const sorted = Float32Array.from(cells).sort();
  const lo = sorted[Math.floor(sorted.length * 0.02)];
  const hi = sorted[Math.floor(sorted.length * 0.98)];
  const span = Math.max(0.06, hi - lo); // garde-fou : une image quasi unie ne doit pas exploser

  const lines = [];
  for (let cy = 0; cy < rows; cy++) {
    let line = '';
    for (let cx = 0; cx < cols; cx++) {
      const level = Math.pow(clamp((cells[cy * cols + cx] - lo) / span), gamma);
      // `level` vaut 1 pour le papier : on prend le complément, l'encre étant
      // ce qui doit être dense.
      line += RAMP[Math.min(RAMP.length - 1, Math.round((1 - level) * (RAMP.length - 1)))];
    }
    lines.push(line);
  }

  cache.set(key, lines);
  return lines;
}

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
