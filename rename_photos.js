const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'public', 'sitephoto');
const files = fs.readdirSync(dir);

files.forEach((file, index) => {
  const oldPath = path.join(dir, file);
  const newPath = path.join(dir, `photo_${index + 1}.jpg`);
  fs.renameSync(oldPath, newPath);
  console.log(`Renamed ${file} to photo_${index + 1}.jpg`);
});
