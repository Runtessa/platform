import { createRequire } from 'node:module';
import { cpSync, existsSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(path.join(root, 'src/ideNew/package.json'));
let directory = path.dirname(require.resolve('monaco-editor'));
while (!existsSync(path.join(directory, 'package.json'))) {
  const parent = path.dirname(directory);
  if (parent === directory) throw new Error('Cannot locate the installed Monaco package.');
  directory = parent;
}
const pkg = JSON.parse(readFileSync(path.join(directory, 'package.json')));
if (pkg.name !== 'monaco-editor') throw new Error('Unexpected Monaco package path.');
const output = path.join(root, 'src/ideNew/public/monaco');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(path.join(directory, 'min/vs'), path.join(output, 'vs'), { recursive: true });
cpSync(path.join(directory, 'LICENSE'), path.join(output, 'LICENSE'));
if (existsSync(path.join(directory, 'ThirdPartyNotices.txt'))) {
  cpSync(path.join(directory, 'ThirdPartyNotices.txt'), path.join(output, 'ThirdPartyNotices.txt'));
}
writeFileSync(path.join(output, 'version.json'), JSON.stringify({ version: pkg.version }) + '\n');
console.log(`Prepared self-hosted Monaco ${pkg.version} assets and notices.`);
