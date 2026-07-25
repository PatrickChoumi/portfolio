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
//  L'OBJECTIF EST LA RESSEMBLANCE. Pas la lisibilité du visage, pas la
//  finesse du trait : que le tableau de caractères évoque immédiatement
//  l'image d'origine. C'est ce critère qui a tranché chacun des choix
//  ci-dessous, et il n'est pas toujours celui qu'on croit — un rendu plus
//  clair montre mieux les traits, mais ressemble à un croquis là où la
//  planche source est une masse dense.
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
//     moyenne et son pixel le plus sombre. Les traits survivent, et les
//     aplats hachurés gardent la densité qu'ils ont à l'œil.
//
//  3. LES NIVEAUX SONT RECALÉS SUR L'IMAGE. Plutôt qu'un contraste fixe, on
//     étale la plage réellement présente (2e au 98e centile) sur toute la
//     rampe. Une image terne comme une image contrastée s'en sortent.
//
//  4. LA COURBE FINALE DOSE LA DENSITÉ. Elle décide de la quantité d'encre
//     du dessin — c'est le réglage le plus sensible, et celui qui fait qu'on
//     reconnaît la photo ou non. Voir INK_BIAS et GAMMA plus bas.
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

// ─── Les deux réglages qui décident du rendu ──────────────────────────
//
// Ils ont été arrêtés en comparant plusieurs rendus à l'image source, et le
// critère retenu est la RESSEMBLANCE, pas la lisibilité du visage. Ce sont
// deux choses différentes, et il faut choisir :
//
//   • des valeurs plus basses donnent un dessin clair, aéré, où l'on
//     distingue mieux les traits — mais qui ressemble à un croquis léger,
//     alors que la planche source est une masse dense de hachures ;
//   • les valeurs ci-dessous rendent cette densité. Le dessin est plus
//     chargé, et c'est précisément ce qui le fait reconnaître.
//
// Elles vont de pair avec PORTRAIT_COLS (src/js/commands.js) : le rendu a été
// jugé à cette largeur-là. Changer l'un sans l'autre casse l'équilibre.

// Part du pixel le plus sombre dans la valeur d'une cellule. À 0 on obtient
// une moyenne pure — les traits d'un pixel s'effacent. À 1, le moindre point
// noir noircit toute la cellule.
const INK_BIAS = 0.55;

// Courbe appliquée après le recalage des niveaux. En dessous de 1, elle
// repousse les demi-tons vers le papier ; plus on descend, plus le dessin
// s'éclaircit.
const GAMMA = 0.6;

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
  charRatio = DEFAULT_CHAR_RATIO, inkBias = INK_BIAS, gamma = GAMMA
} = {}) {
  const img = await loadImage(url);
  const rows = Math.max(1, Math.round((cols * img.naturalHeight / img.naturalWidth) / charRatio));

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

// ─── Le dessin, en image ──────────────────────────────────────────────
// Compose les lignes de caractères sur un canvas aux dimensions d'un écran
// et renvoie un PNG. Sert à la commande `wallpaper` : le portfolio fabrique
// un fond d'écran à partir de la même image que le reste — toujours une
// source, plusieurs rendus.
//
// La taille de police n'est pas choisie au hasard : elle est calculée pour
// que le dessin remplisse la fraction voulue de l'écran, quelle que soit la
// résolution demandée.
export function asciiToPng(lines, { width = 2560, height = 1440, bg = '#101215', fg = '#7aa2f7', fill = 0.8 } = {}) {
  const cols = Math.max(...lines.map((l) => l.length));
  const rows = lines.length;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Largeur d'un caractère à une taille de référence, mesurée plutôt que
  // supposée : elle dépend de la police réellement disponible.
  const REF = 100;
  const font = (size) => `${size}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.font = font(REF);
  const unitWidth = ctx.measureText('0').width / REF;   // largeur / taille
  const unitHeight = 1.05;                              // interligne du terminal

  const size = Math.floor(Math.min(
    (width * fill) / (cols * unitWidth),
    (height * fill) / (rows * unitHeight)
  ));

  ctx.font = font(size);
  ctx.textBaseline = 'top';
  ctx.fillStyle = fg;

  const charW = unitWidth * size;
  const lineH = unitHeight * size;
  const x0 = (width - cols * charW) / 2;
  const y0 = (height - rows * lineH) / 2;
  lines.forEach((line, i) => ctx.fillText(line, x0, y0 + i * lineH));

  return canvas.toDataURL('image/png');
}
