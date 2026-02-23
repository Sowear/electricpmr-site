import { execSync } from 'child_process';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const root = '/vercel/share/v0-project';

// Remove all stale lock files
const lockFiles = ['package-lock.json', 'pnpm-lock.yaml', 'bun.lockb'];
for (const f of lockFiles) {
  const p = join(root, f);
  if (existsSync(p)) {
    unlinkSync(p);
    console.log(`Deleted: ${f}`);
  }
}

// Run fresh npm install (NOT npm ci)
console.log('Running npm install...');
try {
  const result = execSync('npm install --no-package-lock', { cwd: root, stdio: 'pipe', timeout: 120000 });
  console.log(result.toString());
  console.log('npm install succeeded!');
} catch (e) {
  console.error('npm install failed:', e.stderr?.toString() || e.message);
  // Try with --legacy-peer-deps as fallback
  try {
    console.log('Retrying with --legacy-peer-deps...');
    const result2 = execSync('npm install --no-package-lock --legacy-peer-deps', { cwd: root, stdio: 'pipe', timeout: 120000 });
    console.log(result2.toString());
    console.log('npm install with --legacy-peer-deps succeeded!');
  } catch (e2) {
    console.error('Fallback also failed:', e2.stderr?.toString() || e2.message);
  }
}
