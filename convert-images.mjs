import sharp from 'sharp';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, parse } from 'path';

const SRC_DIR = './images';
const OUT_DIR = './images'; // overwrite in place with .webp extension

// Resize rules based on filename patterns
function getMaxWidth(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('hero')) return 1200;
  if (lower.includes('successstory')) return 800;
  // logos, portraits, icons
  return 400;
}

async function processImages() {
  const files = await readdir(SRC_DIR);
  const imageFiles = files.filter(f =>
    /\.(jpe?g|png)$/i.test(f)
  );

  console.log(`Found ${imageFiles.length} images to process.\n`);

  for (const file of imageFiles) {
    const srcPath = join(SRC_DIR, file);
    const info = await stat(srcPath);
    const sizeKB = (info.size / 1024).toFixed(0);
    const { name } = parse(file);

    // Sanitize filename: replace spaces and special chars
    const safeName = name
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    const outPath = join(OUT_DIR, `${safeName}.webp`);
    const maxWidth = getMaxWidth(file);

    try {
      const metadata = await sharp(srcPath).metadata();
      const needsResize = metadata.width > maxWidth;

      let pipeline = sharp(srcPath);

      if (needsResize) {
        pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
        console.log(`  Resizing ${metadata.width}px → ${maxWidth}px`);
      }

      await pipeline
        .webp({ quality: 80 })
        .toFile(outPath);

      const outInfo = await stat(outPath);
      const outSizeKB = (outInfo.size / 1024).toFixed(0);

      console.log(`✓ ${file} (${sizeKB}KB) → ${safeName}.webp (${outSizeKB}KB)`);
    } catch (err) {
      console.error(`✗ Failed: ${file} — ${err.message}`);
    }
  }

  console.log('\nDone!');
}

processImages();
