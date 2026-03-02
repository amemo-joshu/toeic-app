const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = './public/images/part1';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

async function main() {
  for (const file of files) {
    const input = path.join(dir, file);
    const tmp = path.join(dir, '_tmp_' + file);
    const before = fs.statSync(input).size;
    await sharp(input)
      .resize(800, 500, { fit: 'cover' })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(tmp);
    const after = fs.statSync(tmp).size;
    fs.renameSync(tmp, input);
    console.log(`${file}: ${Math.round(before/1024)}KB → ${Math.round(after/1024)}KB`);
  }
  console.log('Done!');
}
main().catch(console.error);
