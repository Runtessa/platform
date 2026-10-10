const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const load = (file, mocks = {}) => {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: file,
  }).outputText;
  const module = { exports: {} };
  const resolve = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    throw new Error(`Unexpected dependency: ${id}`);
  };
  new Function('require', 'module', 'exports', code)(resolve, module, module.exports);
  return module.exports;
};
const shared = {
  ...load('src/packages/shared/src/logging/safe-error.ts'),
  ...load('src/packages/shared/src/logging/safe-metadata.ts'),
};
const response = () => ({ statusCode: 200, payload: null,
  status(code) { this.statusCode = code; return this; },
  json(value) { this.payload = value; return this; },
});
const captureConsole = async (fn) => {
  const output = [];
  const originals = {};
  for (const name of ['error', 'warn', 'debug', 'log']) {
    originals[name] = console[name];
    console[name] = (...args) => output.push(args);
  }
  try { await fn(output); } finally { Object.assign(console, originals); }
  return output;
};
module.exports = { load, shared, response, captureConsole };
