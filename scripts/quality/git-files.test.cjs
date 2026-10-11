const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { publishableFiles, gitRepositories } = require('./git-files.cjs');

test('scans initialized private components, excludes ignored secrets and rejects missing checkouts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'runtessa-git-files-'));
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: 'pipe' }).toString();
  try {
    git(root, 'init');
    fs.writeFileSync(path.join(root, 'platform.js'), 'module.exports = {};');
    git(root, 'add', 'platform.js');
    const child = path.join(root, 'component');
    fs.mkdirSync(child);
    git(child, 'init');
    fs.writeFileSync(path.join(child, '.gitignore'), '.env\n');
    fs.writeFileSync(path.join(child, '.env'), 'SECRET=fixture-do-not-scan');
    fs.writeFileSync(path.join(child, 'runtime.js'), 'module.exports = {};');
    git(child, 'add', '.gitignore', 'runtime.js');
    git(child, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-m', 'fixture');
    const sha = git(child, 'rev-parse', 'HEAD').trim();
    git(root, 'update-index', '--add', '--cacheinfo', `160000,${sha},component`);
    fs.writeFileSync(path.join(child, 'draft.js'), 'module.exports = {};');
    assert.deepEqual(publishableFiles(root), ['component/.gitignore', 'component/draft.js', 'component/runtime.js', 'platform.js']);
    assert.equal(gitRepositories(root).length, 2);
    fs.renameSync(path.join(child, '.git'), path.join(root, 'saved-git'));
    assert.throws(() => publishableFiles(root), /Uninitialized submodule/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
