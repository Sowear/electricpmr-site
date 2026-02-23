const { execSync } = require('child_process');
const { unlinkSync, existsSync } = require('fs');
const { join } = require('path');

const root = '/vercel/share/v0-project';

// Remove all stale lock files
const lockFiles = ['package-lock.json', 'pnpm-lock.yaml', 'bun.lockb'];
for (const f of lockFiles) {
  const p = join(root, f);
  if (existsSync(p)) {
    unlinkSync(p);
    console.log('Deleted: ' + f);
  } else {
    console.log('Not found: ' + f);
  }
}

// Run fresh npm install (NOT npm ci) to generate a new lock file
console.log('Running npm install...');
try {
  const result = execSync('npm install --legacy-peer-deps', {
    cwd: root,
    stdio: 'pipe',
    timeout: 180000,
    env: { ...process.env, npm_config_yes: 'true' }
  });
  console.log(result.toString());
  console.log('SUCCESS: npm install completed!');
} catch (e) {
  console.error('npm install failed:', e.stderr ? e.stderr.toString() : e.message);
  process.exit(1);
}
