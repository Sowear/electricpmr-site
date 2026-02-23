import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { resolve } from 'path';

const projectDir = resolve(import.meta.dirname, '..');

// Delete the existing lock file if it exists
const lockFilePath = resolve(projectDir, 'package-lock.json');
if (existsSync(lockFilePath)) {
  console.log('Deleting existing package-lock.json...');
  unlinkSync(lockFilePath);
}

console.log('Running npm install to regenerate package-lock.json...');
try {
  const output = execSync('npm install --package-lock-only', {
    cwd: projectDir,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  console.log(output);
  console.log('Successfully regenerated package-lock.json!');
} catch (error) {
  console.error('Error running npm install:', error.message);
  if (error.stdout) console.log('stdout:', error.stdout);
  if (error.stderr) console.log('stderr:', error.stderr);
  process.exit(1);
}
