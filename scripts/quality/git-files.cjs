const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function git(cwd, args) {
  return execFileSync('git', args, { cwd, maxBuffer: 20 * 1024 * 1024 }).toString();
}

// Enumerate initialized submodules explicitly. A missing checkout must fail rather
// than silently turning a security or quality scan into a scan of the wrapper only.
function gitRepositories(root) {
  const repositories = [];
  function visit(directory) {
    repositories.push(directory);
    for (const entry of git(directory, ['ls-files', '--stage', '-z']).split('\0')) {
      const match = /^160000 [a-f0-9]+ \d\t(.+)$/.exec(entry);
      if (!match) continue;
      const child = path.join(directory, match[1]);
      if (!fs.existsSync(path.join(child, '.git'))) {
        throw new Error(`Uninitialized submodule: ${path.relative(root, child)}. Run git submodule update --init --recursive.`);
      }
      const top = git(child, ['rev-parse', '--show-toplevel']).trim();
      if (fs.realpathSync(top) !== fs.realpathSync(child)) {
        throw new Error(`Invalid submodule checkout: ${child}`);
      }
      visit(child);
    }
  }
  visit(path.resolve(root));
  return repositories;
}

function publishableFiles(root) {
  const files = new Set();
  for (const directory of gitRepositories(root)) {
    for (const file of git(directory, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0')) {
      if (!file) continue;
      const absolute = path.join(directory, file);
      if (fs.existsSync(absolute) && !fs.lstatSync(absolute).isDirectory()) {
        files.add(path.relative(root, absolute).split(path.sep).join('/'));
      }
    }
  }
  return [...files].sort();
}

module.exports = { gitRepositories, publishableFiles };
