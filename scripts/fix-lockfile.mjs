import { execSync } from 'child_process';

console.log('Regenerating package-lock.json...');
try {
  const output = execSync('npm install --package-lock-only', {
    cwd: '/vercel/share/v0-project',
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  console.log(output);
  console.log('package-lock.json regenerated successfully.');
} catch (error) {
  console.error('Error:', error.stderr || error.message);
  console.log('stdout:', error.stdout);
  process.exit(1);
}
