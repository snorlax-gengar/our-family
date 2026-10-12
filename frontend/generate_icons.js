import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

// 1. Full-bleed SVG for Apple Touch Icon (No rounded rect corners, iOS applies squircle mask automatically)
const appleTouchSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="512" height="512">
  <defs>
    <linearGradient id="hearthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff4757" />
      <stop offset="60%" stop-color="#ff6b4a" />
      <stop offset="100%" stop-color="#ffa502" />
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Full-bleed background tile for iOS Safari Bookmarks & Home Screen -->
  <rect width="64" height="64" fill="url(#hearthGrad)" />

  <g filter="url(#softShadow)">
    <!-- Chimney on Right -->
    <rect x="42" y="16" width="6.5" height="12" rx="1.5" fill="#ffffff" />
    
    <!-- Heart-shaped Smoke floating out of chimney -->
    <path d="M49 12 C49 12 46.5 9.2 46.5 7.2 C46.5 5.8 47.5 4.8 49 4.8 C49.8 4.8 50.4 5.3 50.4 5.3 C50.4 5.3 51 4.8 51.8 4.8 C53.3 4.8 54.3 5.8 54.3 7.2 C54.3 9.2 51.8 12 49 12 Z" fill="#ffffff" opacity="0.95" />

    <!-- Solid Bold White Roof -->
    <path d="M11 31 L30.2 14.5 C31.2 13.6 32.8 13.6 33.8 14.5 L53 31 C54 31.8 53.5 33 52 33 L12 33 C10.5 33 10 31.8 11 31 Z" fill="#ffffff" />

    <!-- Solid White House Body -->
    <rect x="15" y="31" width="34" height="21" rx="4" fill="#ffffff" />

    <!-- Warm Loving Heart in House Center (Our Family / 우리家) -->
    <path d="M32 46 C32 46 23.5 39.5 23.5 34 C23.5 30.5 26 28.5 29 28.5 C30.6 28.5 31.5 29.5 32 30 C32.5 29.5 33.4 28.5 35 28.5 C38 28.5 40.5 30.5 40.5 34 C40.5 39.5 32 46 32 46 Z" fill="#ff4757" />

    <!-- Warm Windows -->
    <circle cx="20" cy="38" r="1.8" fill="#ffd1d5" />
    <circle cx="44" cy="38" r="1.8" fill="#ffd1d5" />
  </g>
</svg>
`;

// 2. Pre-rounded Squircle SVG for Android / Desktop Tab favicons
const roundedFaviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="512" height="512">
  <defs>
    <linearGradient id="hearthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff4757" />
      <stop offset="60%" stop-color="#ff6b4a" />
      <stop offset="100%" stop-color="#ffa502" />
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Pre-rounded Squircle tile -->
  <rect width="64" height="64" rx="16" fill="url(#hearthGrad)" />

  <g filter="url(#softShadow)">
    <rect x="42" y="16" width="6.5" height="12" rx="1.5" fill="#ffffff" />
    <path d="M49 12 C49 12 46.5 9.2 46.5 7.2 C46.5 5.8 47.5 4.8 49 4.8 C49.8 4.8 50.4 5.3 50.4 5.3 C50.4 5.3 51 4.8 51.8 4.8 C53.3 4.8 54.3 5.8 54.3 7.2 C54.3 9.2 51.8 12 49 12 Z" fill="#ffffff" opacity="0.95" />
    <path d="M11 31 L30.2 14.5 C31.2 13.6 32.8 13.6 33.8 14.5 L53 31 C54 31.8 53.5 33 52 33 L12 33 C10.5 33 10 31.8 11 31 Z" fill="#ffffff" />
    <rect x="15" y="31" width="34" height="21" rx="4" fill="#ffffff" />
    <path d="M32 46 C32 46 23.5 39.5 23.5 34 C23.5 30.5 26 28.5 29 28.5 C30.6 28.5 31.5 29.5 32 30 C32.5 29.5 33.4 28.5 35 28.5 C38 28.5 40.5 30.5 40.5 34 C40.5 39.5 32 46 32 46 Z" fill="#ff4757" />
    <circle cx="20" cy="38" r="1.8" fill="#ffd1d5" />
    <circle cx="44" cy="38" r="1.8" fill="#ffd1d5" />
  </g>
</svg>
`;

async function generate() {
  console.log('Generating Safari & Web Favicon package...');

  // Apple touch icon sizes (180x180 is the standard retina for iPhone Safari bookmarks & home screen)
  const appleSizes = [
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'apple-touch-icon-180x180.png', size: 180 },
    { name: 'apple-touch-icon-167x167.png', size: 167 },
    { name: 'apple-touch-icon-152x152.png', size: 152 },
    { name: 'apple-touch-icon-120x120.png', size: 120 },
    { name: 'apple-touch-icon-precomposed.png', size: 180 },
  ];

  for (const { name, size } of appleSizes) {
    await sharp(Buffer.from(appleTouchSvg))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(path.join(publicDir, name));
    console.log(` Created ${name} (${size}x${size})`);
  }

  // Standard Favicon sizes
  const favSizes = [
    { name: 'favicon-512x512.png', size: 512 },
    { name: 'favicon-192x192.png', size: 192 },
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-16x16.png', size: 16 },
  ];

  const pngBuffersForIco = {};

  for (const { name, size } of favSizes) {
    const buf = await sharp(Buffer.from(roundedFaviconSvg))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toBuffer();
    
    fs.writeFileSync(path.join(publicDir, name), buf);
    console.log(` Created ${name} (${size}x${size})`);
    if ([16, 32, 48].includes(size)) {
      pngBuffersForIco[size] = buf;
    }
  }

  // Generate ICO file containing 16x16, 32x32, 48x48
  const icoBuffer = createIco([
    { size: 16, buffer: pngBuffersForIco[16] },
    { size: 32, buffer: pngBuffersForIco[32] },
    { size: 48, buffer: pngBuffersForIco[48] }
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log(` Created favicon.ico (multi-res 16, 32, 48)`);

  console.log('Favicon generation complete!');
}

// Function to construct standard multi-resolution ICO file with embedded PNG chunks
function createIco(images) {
  const count = images.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + count * dirEntrySize;

  let offset = dirSize;
  const entries = [];
  const imageBuffers = [];

  for (const img of images) {
    const width = img.size >= 256 ? 0 : img.size;
    const height = img.size >= 256 ? 0 : img.size;
    const size = img.buffer.length;

    const entry = Buffer.alloc(16);
    entry.writeUInt8(width, 0); // width
    entry.writeUInt8(height, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(size, 8); // image size in bytes
    entry.writeUInt32LE(offset, 12); // image offset

    entries.push(entry);
    imageBuffers.push(img.buffer);
    offset += size;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // image type (1 = icon)
  header.writeUInt16LE(count, 4); // number of images

  return Buffer.concat([header, ...entries, ...imageBuffers]);
}

generate().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
