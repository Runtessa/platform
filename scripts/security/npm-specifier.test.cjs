const test = require('node:test');
const assert = require('node:assert/strict');
const { parseNpmRequestSpecifier } = require('@idp/shared/dist/runtime/npm-specifier');

test('npm resolution keeps scoped packages and subpath imports distinct', () => {
  assert.deepEqual(parseNpmRequestSpecifier('  @scope/package/subpath  '), {
    installName: '@scope/package', requestSpecifier: '@scope/package/subpath',
    runtimeSpecifier: '@scope/package/subpath',
  });
  assert.deepEqual(parseNpmRequestSpecifier('lodash/fp'), {
    installName: 'lodash', requestSpecifier: 'lodash/fp', runtimeSpecifier: 'lodash/fp',
  });
});

test('legacy React Router import retains its runtime alias', () => {
  assert.deepEqual(parseNpmRequestSpecifier('react-router/dom'), {
    installName: 'react-router-dom', requestSpecifier: 'react-router/dom',
    runtimeSpecifier: 'react-router-dom',
  });
});

test('npm parser rejects local paths, traversal and query/control delimiters', () => {
  for (const input of ['', ' ', './local', '/absolute', '../escape', 'package/../escape',
    'package\\escape', 'package\0suffix', 'package?query', 'package#hash', '@scope',
    '@!invalid/name', 'invalid name', 'https://example.test/package']) {
    assert.equal(parseNpmRequestSpecifier(input), null, JSON.stringify(input));
  }
});
