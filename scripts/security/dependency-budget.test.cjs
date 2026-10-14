const test = require('node:test');
const assert = require('node:assert/strict');
require('@idp/shared/dist/security/glob-budget.cjs');

test('unpatched brace parsers reject adversarial depth while ordinary build globs remain compatible', () => {
  const braces = require('braces');
  assert.deepEqual(braces.expand('packages/{backend,frontend}/*.js'), ['packages/backend/*.js', 'packages/frontend/*.js']);
  const deep = '{'.repeat(20000) + 'a,b' + '}'.repeat(20000);
  for (const fn of [braces, braces.parse, braces.compile, braces.expand]) assert.throws(() => fn(deep), /budget/);
  const root = { type: 'root', nodes: [] }; let current = root;
  for (let i = 0; i < 200; i++) { const next = { type: 'brace', nodes: [] }; current.nodes.push(next); current = next; }
  assert.throws(() => braces.compile(root), /budget/);
  assert.throws(() => require('braces/lib/parse')(deep), /budget/);
  const { sprintf, vsprintf } = require('sprintf-js');
  assert.equal(sprintf('%.2f', 1.234), '1.23'); assert.equal(vsprintf('%s:%d', ['note', 3]), 'note:3');
  assert.throws(() => sprintf('%.100000000f', 1), /budget/);
  assert.throws(() => sprintf('%.' + '0'.repeat(200) + '100000000f', 1), /budget/);
});
