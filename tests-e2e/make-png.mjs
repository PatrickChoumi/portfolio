// Encodeur PNG minimal — niveaux de gris, 8 bits.
//
// Sert uniquement aux tests : le harnais a besoin d'une vraie image pour
// vérifier que la conversion en caractères (src/js/ascii.js) fonctionne de
// bout en bout. Écrire trente lignes de zlib évite d'ajouter une dépendance
// d'image au projet pour un seul fichier de test.
//
// Spécification : https://www.w3.org/TR/png/ — on n'implémente que le
// strict nécessaire (IHDR, IDAT non filtré, IEND).

import { deflateSync } from 'node:zlib';

const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

// `pixel(x, y)` renvoie une luminance de 0 (noir) à 255 (blanc).
export function grayPng(width, height, pixel) {
  const raw = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0; // type de filtre 0 : aucun
    for (let x = 0; x < width; x++) {
      raw[y * (width + 1) + 1 + x] = Math.max(0, Math.min(255, Math.round(pixel(x, y))));
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // profondeur : 8 bits
  ihdr[9] = 0;   // type de couleur : niveaux de gris
  ihdr[10] = 0;  // compression : deflate
  ihdr[11] = 0;  // filtrage : standard
  ihdr[12] = 0;  // entrelacement : aucun

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Une mire reconnaissable : un disque sombre sur fond clair, avec un dégradé.
// Assez structurée pour qu'on vérifie que le dessin n'est ni uniforme, ni
// retourné, ni écrasé.
export function testAvatar(size = 128) {
  return grayPng(size, size, (x, y) => {
    const cx = size / 2, cy = size * 0.45, r = size * 0.3;
    const d = Math.hypot(x - cx, y - cy);
    if (d < r) return 30 + (d / r) * 60;          // disque sombre, éclairci vers le bord
    return 200 + (y / size) * 55;                 // fond clair, dégradé vertical
  });
}
