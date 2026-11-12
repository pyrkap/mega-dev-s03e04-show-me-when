import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const destination = resolve(process.argv[2] || 'dist');
mkdirSync(destination, { recursive: true });
cpSync('app', destination, { recursive: true });
const index = resolve(destination, 'index.html');
writeFileSync(index, readFileSync(index, 'utf8').replaceAll('development', sha));
writeFileSync(resolve(destination, '.nojekyll'), '');
console.log(JSON.stringify({ sha, destination }));
