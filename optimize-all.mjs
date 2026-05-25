import sharp from 'sharp';
import { readdir, stat, mkdir, copyFile } from 'fs/promises';
import { join, parse } from 'path';
import https from 'https';
import fs from 'fs';

const OUT_DIR = './optimized';

// Ensure output directory exists
await mkdir(OUT_DIR, { recursive: true });

// =============================================
// 1. Process existing images (hero, success stories, team, stat logos)
// =============================================
const existingImages = [
  { src: 'images/hero-image.jpeg', out: 'hero-image.webp', maxW: 1600 },
  { src: 'images/jasmine-successstory.jpeg', out: 'jasmine-successstory.webp', maxW: 300 },
  { src: 'images/tommy-successstory.jpeg', out: 'tommy-successstory.webp', maxW: 300 },
  { src: 'images/wendy-successstory.jpeg', out: 'wendy-successstory.webp', maxW: 300 },
  { src: 'images/mrp-logo.jpeg', out: 'mrp-logo.webp', maxW: 300 },
  { src: 'images/stephen-wrench-CEO.jpg', out: 'stephen-wrench-ceo.webp', maxW: 400 },
  { src: 'images/rhonda-head-PRESIDENT.jpg', out: 'rhonda-head-president.webp', maxW: 400 },
  { src: 'images/Wayne Killius Producer, Nashville StudiosMusik and Film Radio Promotions Specialist.jpeg', out: 'wayne-killius.webp', maxW: 400 },
  { src: 'images/have Wayne on our team.Promo Me _ 2Robyn RobbinsProducer.jpg', out: 'robyn-robbins.webp', maxW: 400 },
  { src: 'images/Terry NailsA&R.jpg', out: 'terry-nails.webp', maxW: 400 },
  { src: 'images/Kenny BlackProducer.png', out: 'kenny-black.webp', maxW: 400 },
];

console.log('=== Processing existing images ===\n');
for (const img of existingImages) {
  try {
    const metadata = await sharp(img.src).metadata();
    let pipeline = sharp(img.src);
    if (metadata.width > img.maxW) {
      pipeline = pipeline.resize({ width: img.maxW, withoutEnlargement: true });
    }
    await pipeline.webp({ quality: 80 }).toFile(join(OUT_DIR, img.out));
    const outStat = await stat(join(OUT_DIR, img.out));
    console.log(`✓ ${img.out} (${(outStat.size/1024).toFixed(1)}KB)`);
  } catch (err) {
    console.error(`✗ ${img.src}: ${err.message}`);
  }
}

// =============================================
// 2. Process icons (resize 1024→64, convert to WebP)
// =============================================
console.log('\n=== Processing icons ===\n');
const iconFiles = await readdir('images/icons');
for (const file of iconFiles) {
  if (!/\.(jpe?g|png)$/i.test(file)) continue;
  const { name } = parse(file);
  const safeName = `icon-${name.toLowerCase()}.webp`;
  const srcPath = join('images/icons', file);
  try {
    await sharp(srcPath)
      .resize({ width: 64, height: 64, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 80 })
      .toFile(join(OUT_DIR, safeName));
    const outStat = await stat(join(OUT_DIR, safeName));
    console.log(`✓ ${safeName} (${(outStat.size/1024).toFixed(1)}KB)`);
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
  }
}

// =============================================
// 3. Process partner/affiliate logos (resize to max 200px wide, keep aspect ratio)
// =============================================
console.log('\n=== Processing partner logos (48 images) ===\n');
const logoFiles = (await readdir('images/loggo')).filter(f => /\.(png|jpe?g)$/i.test(f));
// Sort numerically
logoFiles.sort((a, b) => {
  const numA = parseInt(parse(a).name);
  const numB = parseInt(parse(b).name);
  return numA - numB;
});

for (const file of logoFiles) {
  const { name } = parse(file);
  const safeName = `logo-${name}.webp`;
  const srcPath = join('images/loggo', file);
  try {
    await sharp(srcPath)
      .resize({ width: 200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(join(OUT_DIR, safeName));
    const outStat = await stat(join(OUT_DIR, safeName));
    console.log(`✓ ${safeName} (${(outStat.size/1024).toFixed(1)}KB)`);
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
  }
}

// =============================================
// 4. Download YouTube thumbnails
// =============================================
console.log('\n=== Downloading YouTube thumbnails ===\n');
const videos = [
  { id: 'MWQSIw5wkQo', out: 'yt-thumb-1.jpg' },
  { id: 'NnBqrTJefJ0', out: 'yt-thumb-2.jpg' },
  { id: 'VfqvmDoLymY', out: 'yt-thumb-3.jpg' },
  { id: 'OJApNVbZHuo', out: 'yt-thumb-4.jpg' },
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => { file.close(resolve); });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

for (const video of videos) {
  // Try maxresdefault first, fallback to hqdefault
  const urls = [
    `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`,
  ];
  
  let downloaded = false;
  for (const url of urls) {
    try {
      const tmpPath = join(OUT_DIR, video.out);
      await downloadFile(url, tmpPath);
      // Check if valid image (maxresdefault returns a tiny placeholder when not available)
      const thumbStat = await stat(tmpPath);
      if (thumbStat.size < 5000) {
        fs.unlinkSync(tmpPath);
        continue; // try next URL
      }
      // Convert to WebP
      const webpName = video.out.replace('.jpg', '.webp');
      await sharp(tmpPath)
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(join(OUT_DIR, webpName));
      // Remove the temp jpg
      fs.unlinkSync(tmpPath);
      const outStat = await stat(join(OUT_DIR, webpName));
      console.log(`✓ ${webpName} (${(outStat.size/1024).toFixed(1)}KB)`);
      downloaded = true;
      break;
    } catch (err) {
      console.log(`  Trying fallback for ${video.id}...`);
    }
  }
  if (!downloaded) {
    console.error(`✗ Could not download thumbnail for ${video.id}`);
  }
}

// =============================================
// 5. Summary
// =============================================
console.log('\n=== Final optimized folder contents ===\n');
const allFiles = await readdir(OUT_DIR);
let totalSize = 0;
for (const f of allFiles.sort()) {
  const s = await stat(join(OUT_DIR, f));
  totalSize += s.size;
  console.log(`  ${f.padEnd(40)} ${(s.size/1024).toFixed(1).padStart(8)} KB`);
}
console.log(`\n  TOTAL: ${(totalSize/1024).toFixed(1)} KB (${(totalSize/1024/1024).toFixed(2)} MB)`);
console.log('\nDone!');
