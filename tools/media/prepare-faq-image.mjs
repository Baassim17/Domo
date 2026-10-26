import fs from 'node:fs/promises';
import sharp from 'sharp';

const source = process.argv[2];
if (!source) throw new Error('Pass the generated image path.');
await fs.mkdir('public/images', { recursive: true });
await fs.mkdir('docs/design-references/domo', { recursive: true });
await fs.copyFile(source, 'docs/design-references/domo/faq-generated-original.png');
await Promise.all([
  sharp(source).resize(1920, 1080, { fit: 'cover' }).webp({ quality: 83 }).toFile('public/images/domo-faq-background.webp'),
  sharp(source).resize(1280, 720, { fit: 'cover' }).webp({ quality: 81 }).toFile('public/images/domo-faq-background-1280.webp'),
  sharp(source).resize(768, 1152, { fit: 'cover', position: 'centre' }).webp({ quality: 83 }).toFile('public/images/domo-faq-mobile.webp'),
]);
for (const file of ['domo-faq-background.webp', 'domo-faq-background-1280.webp', 'domo-faq-mobile.webp']) {
  console.log(file, (await fs.stat(`public/images/${file}`)).size, 'bytes');
}
