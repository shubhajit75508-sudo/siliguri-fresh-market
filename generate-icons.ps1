const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src = 'D:\\Freshmart\\prototype no.1 - Copy\\siliguri-fresh-market\\public\\logo.png';
const outDir = 'D:\\Freshmart\\prototype no.1 - Copy\\siliguri-fresh-market\\public\\icons';

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function run() {
  for (const size of sizes) {
    await sharp(src)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .png()
      .toFile(path.join(outDir, 'icon-' + size + 'x' + size + '.png'));
    console.log('Generated icon-' + size + 'x' + size + '.png');
  }
}
run().catch(e => console.error(e));
