/**
 * Icon Generator for Samla PWA
 * The mark is defined inline below and must stay in sync with icon.svg.
 * Sizes: 192px and 512px, both "any" and "maskable" variants
 * Maskable icons: full-bleed background, logo content stays within 80% safe zone
 *
 * Usage: node scripts/generate-icons.js
 * Dependencies: sharp (devDependency)
 */

import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');

mkdirSync(ICONS_DIR, { recursive: true });

/**
 * „Samla" = sammeln: drei abgerundete Arme laufen auf EINE gemeinsame Mitte zu.
 * Der Spalt zwischen Mittelpunkt (r 14) und Armansatz (r 20) macht die Bewegung
 * nach innen lesbar. Maximaler Radius 52 - innerhalb der maskable-Safe-Zone (64).
 */
const MARK = `<g transform="translate(80 80)" fill="#fff">
    <g fill-opacity="0.78">
      <rect x="-10" y="-52" width="20" height="32" rx="10"/>
      <rect x="-10" y="-52" width="20" height="32" rx="10" transform="rotate(120)"/>
      <rect x="-10" y="-52" width="20" height="32" rx="10" transform="rotate(240)"/>
    </g>
    <circle r="14"/>
  </g>`;

/** Gemeinsame Gradient-Defs: Marken-Violett + dezenter Top-Sheen (Glas-Charakter) */
const DEFS = `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#6c3aed"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.14"/>
      <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>`;

/** Logo SVG (any): rounded corners, gradient background + sheen */
function createLogoSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 160 160" fill="none">
  ${DEFS}
  <rect width="160" height="160" rx="36" fill="url(#bg)"/>
  <rect width="160" height="160" rx="36" fill="url(#sheen)"/>
  ${MARK}
</svg>`;
}

/** Maskable logo SVG: full-bleed background (no rx), logo within safe zone */
function createMaskableLogoSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 160 160" fill="none">
  ${DEFS}
  <rect width="160" height="160" fill="url(#bg)"/>
  <rect width="160" height="160" fill="url(#sheen)"/>
  ${MARK}
</svg>`;
}

/** Apple Touch Icon (180x180): same as any-icon */
function createAppleTouchSvg() {
  return createLogoSvg(180);
}

/** Favicon (32x32): simplified - just gradient background with house */
function createFaviconSvg() {
  return createLogoSvg(32);
}

const icons = [
  { name: 'icon-192.png',          size: 192, svg: createLogoSvg(192)         },
  { name: 'icon-512.png',          size: 512, svg: createLogoSvg(512)         },
  { name: 'icon-maskable-192.png', size: 192, svg: createMaskableLogoSvg(192) },
  { name: 'icon-maskable-512.png', size: 512, svg: createMaskableLogoSvg(512) },
  { name: 'apple-touch-icon.png',  size: 180, svg: createAppleTouchSvg()      },
  { name: 'favicon-32.png',        size: 32,  svg: createFaviconSvg()         },
];

for (const icon of icons) {
  const outputPath = join(ICONS_DIR, icon.name);
  await sharp(Buffer.from(icon.svg))
    .png()
    .toFile(outputPath);
  console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size})`);
}

/**
 * public/favicon.ico — von index.html und der Service-Worker-Precache-Liste
 * referenziert. sharp schreibt kein ICO, deshalb bauen wir den Container selbst:
 * ein ICO darf seit Vista PNG-Frames direkt einbetten, sodass nur Header und
 * Verzeichnis von Hand entstehen. Ohne diesen Schritt bliebe die alte Datei
 * beim Neugenerieren der Marke unverändert zurück.
 */
async function writeFaviconIco(sizes, outputPath) {
  const frames = [];
  for (const size of sizes) {
    frames.push({ size, png: await sharp(Buffer.from(createLogoSvg(size))).png().toBuffer() });
  }

  const HEADER = 6;
  const ENTRY = 16;
  const header = Buffer.alloc(HEADER);
  header.writeUInt16LE(0, 0);             // reserviert
  header.writeUInt16LE(1, 2);             // Typ 1 = Icon
  header.writeUInt16LE(frames.length, 4);

  let offset = HEADER + ENTRY * frames.length;
  const entries = [];
  for (const frame of frames) {
    const entry = Buffer.alloc(ENTRY);
    entry.writeUInt8(frame.size >= 256 ? 0 : frame.size, 0);  // 0 bedeutet 256
    entry.writeUInt8(frame.size >= 256 ? 0 : frame.size, 1);
    entry.writeUInt8(0, 2);               // Palettengroesse (keine Palette)
    entry.writeUInt8(0, 3);               // reserviert
    entry.writeUInt16LE(1, 4);            // Farbebenen
    entry.writeUInt16LE(32, 6);           // Bit pro Pixel
    entry.writeUInt32LE(frame.png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += frame.png.length;
  }

  writeFileSync(outputPath, Buffer.concat([header, ...entries, ...frames.map((f) => f.png)]));
  console.log(`  ✓ favicon.ico (${sizes.join(', ')})`);
}

await writeFaviconIco([16, 32, 48], join(__dirname, '..', 'public', 'favicon.ico'));

console.log('\nIcons generated in public/icons/ and public/favicon.ico');
