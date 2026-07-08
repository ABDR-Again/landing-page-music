import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const imagesDir = 'c:/landing-page-music/optimized';

async function resizeImages() {
  console.log('Starting image resize...');
  const resizeTasks = [
    { name: 'jasmine-successstory.webp', width: 140, height: 251 },
    { name: 'wendy-successstory.webp', width: 140, height: 251 },
    { name: 'tommy-successstory.webp', width: 140, height: 251 },
    { name: 'yt-thumb-1.webp', width: 277, height: 156 },
    { name: 'yt-thumb-2.webp', width: 277, height: 156 },
    { name: 'yt-thumb-3.webp', width: 277, height: 156 },
    { name: 'yt-thumb-4.webp', width: 277, height: 156 },
  ];

  for (const task of resizeTasks) {
    const filePath = path.join(imagesDir, task.name);
    if (fs.existsSync(filePath)) {
      const buffer = await sharp(filePath)
        .resize(task.width, task.height)
        .webp({ quality: 80 })
        .toBuffer();
      
      fs.writeFileSync(filePath, buffer);
      console.log(`Resized ${task.name} to ${task.width}x${task.height}`);
    } else {
      console.warn(`File not found: ${filePath}`);
    }
  }

  console.log('Image resize complete.');
}

resizeImages().catch(console.error);
