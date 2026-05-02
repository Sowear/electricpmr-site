import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = 'C:\\Users\\mmxxn\\Downloads\\Telegram Desktop\\Untitled.mp4';
const destDir = path.join(__dirname, 'public', 'video');
const dest = path.join(destDir, 'hero-video.mp4');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

try {
  fs.copyFileSync(src, dest);
  console.log('✅ Видео успешно скопировано в ' + dest);
} catch (err) {
  console.error('❌ Ошибка копирования файла:', err);
}
