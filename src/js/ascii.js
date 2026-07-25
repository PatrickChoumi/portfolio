// ═══════════════════════════════════════════════════════════════════════
//  LE PORTRAIT, EN CARACTÈRES
//
//  Le site repose sur une idée : une seule source, deux rendus. La photo de
//  profil ne fait pas exception — c'est le même fichier qui s'affiche dans le
//  sommaire et qui, dans le terminal, devient un tableau de caractères.
//
//  La conversion se fait dans le navigateur, au moment où on la demande :
//    • aucune étape de build, aucun décodeur PNG à écrire, aucune dépendance ;
//    • n'importe quel format que le navigateur sait lire fonctionne
//      (png, jpg, webp, avif) ;
//    • la largeur s'adapte à celle du terminal.
//
//  Un choix qui compte : les caractères jouent l'ENCRE, jamais la lumière.
//  Les pixels sombres de l'image sont denses, les clairs sont vides — dans
//  les deux thèmes. L'inversion selon le thème a été essayée : sur un dessin
//  au trait, dont le fond est blanc, elle remplit tout le cadre de « @ » et
//  le visage disparaît. Un trait reste un trait, quel que soit le fond.
//
//  Si aucune image n'est déposée, tout se dégrade proprement : `loadImage`
//  rejette, l'appelant retombe sur son rendu de secours. Rien ne casse.
// ═══════════════════════════════════════════════════════════════════════

// Du plus clair au plus dense. Dix niveaux : au-delà, l'œil ne distingue
// plus, et le dessin devient du bruit.
const RAMP = ' .:-=+*#%@';

// Un caractère est environ deux fois plus haut que large : sans ce facteur,
// le portrait sort étiré verticalement.
const CHAR_ASPECT = 0.5;

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

// Renvoie un tableau de lignes de texte. `cols` est la largeur en caractères.
export async function imageToAscii(url, cols = 34, { contrast = 1.25 } = {}) {
  const key = `${url}|${cols}|${contrast}`;
  if (cache.has(key)) return cache.get(key);

  const img = await loadImage(url);
  const rows = Math.max(1, Math.round((cols * img.naturalHeight / img.naturalWidth) * CHAR_ASPECT));

  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  // Le navigateur fait le sous-échantillonnage : il moyenne les pixels, ce qui
  // vaut mieux qu'un simple prélèvement — les traits fins survivent.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, cols, rows);

  const { data } = ctx.getImageData(0, 0, cols, rows);
  const lines = [];

  for (let y = 0; y < rows; y++) {
    let line = '';
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const alpha = data[i + 3] / 255;
      // Luminance perceptuelle (Rec. 709), pas une moyenne des canaux : sur du
      // trait noir et blanc la différence est faible, sur une photo elle ne
      // l'est pas.
      let lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      lum = clamp((lum - 0.5) * contrast + 0.5);  // contraste autour du gris moyen
      lum = lum * alpha + 1 * (1 - alpha);        // transparent = papier, donc vide
      line += RAMP[Math.min(RAMP.length - 1, Math.round((1 - lum) * (RAMP.length - 1)))];
    }
    lines.push(line);
  }

  cache.set(key, lines);
  return lines;
}

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
