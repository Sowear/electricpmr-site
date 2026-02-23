import { execSync } from 'child_process';
import { unlinkSync, existsSync } from 'fs';

// Remove stale lock files
const lockFiles = ['package-lock.json', 'bun.lockb'];
for (const file of lockFiles) {
  if (existsSync(file)) {
    console.log(`Removing ${file}...`);
    unlinkSync(file);
  }
}

// Regenerate package-lock.json
console.log('Running npm install to regenerate package-lock.json...');
execSync('npm install --legacy-peer-deps', { stdio: 'inherit', cwd: '/vercel/share/v0-project' });
console.log('Done! Lock file regenerated successfully.');
