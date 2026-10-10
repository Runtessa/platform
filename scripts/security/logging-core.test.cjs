const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, shared, response, captureConsole } = require('./logging-harness.cjs');
const { AppError } = load('src/core/common/AppError.ts');
const { coreErrorHandler } = load('src/core/app/security/errorHandler.ts', {
  '@idp/shared': shared, '../../common/AppError': { AppError },
});

test('Core logs safe error locations and preserves production and development response contracts', async () => {
  const original = process.env.NODE_ENV;
  const error = Object.assign(Error('synthetic-password'), { parameters: ['synthetic-param'] });
  error.stack = 'Error: synthetic-password\n    at execute (/app/core.ts:12:4)';
  try {
    for (const environment of ['production', 'development']) {
      process.env.NODE_ENV = environment;
      const res = response();
      const output = await captureConsole(() => coreErrorHandler(error, {}, res, () => {}));
      assert.equal(res.statusCode, 500);
      assert.doesNotMatch(JSON.stringify(output), /synthetic-/);
      assert.equal(output[0][1].frames[0].line, 12);
      assert.equal(res.payload.error, environment === 'production' ? 'Internal server error' : error.message);
      assert.equal(res.payload.stack, environment === 'production' ? undefined : error.stack);
    }
  } finally { if (original === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = original; }
});

test('expected application errors keep status and public code without console noise', async () => {
  const res = response();
  const output = await captureConsole(() => coreErrorHandler(new AppError('Forbidden', 403, 'FORBIDDEN'), {}, res, () => {}));
  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.error, 'Forbidden');
  assert.equal(res.payload.code, 'FORBIDDEN');
  assert.equal(output.length, 0);
});

test('enabled SQL diagnostics omit inline literals, parameters, errors and schema messages', async () => {
  const { SafeDatabaseLogger } = load('src/core/core/safeDatabaseLogger.ts');
  const output = await captureConsole(() => {
    const logger = new SafeDatabaseLogger(true);
    logger.logQuery("SELECT 'synthetic-literal'", ['synthetic-param']);
    logger.logQueryError('synthetic-error', 'synthetic-query', ['synthetic-param']);
    logger.logQuerySlow(40, 'synthetic-query', ['synthetic-param']);
    logger.logSchemaBuild('synthetic-schema');
    logger.logMigration('synthetic-migration');
    logger.log('warn', 'synthetic-warning');
  });
  assert.equal(output.length, 6);
  assert.equal(output[2][1].durationMs, 40);
  assert.doesNotMatch(JSON.stringify(output), /synthetic-/);
});

test('disabled SQL diagnostics remain silent', async () => {
  const { SafeDatabaseLogger } = load('src/core/core/safeDatabaseLogger.ts');
  const output = await captureConsole(() => {
    const logger = new SafeDatabaseLogger();
    logger.logQuery('query'); logger.logQueryError('error', 'query');
    logger.logSchemaBuild('schema'); logger.logMigration('migration');
    logger.logQuerySlow(40, 'query'); logger.log('warn', 'warning');
  });
  assert.equal(output.length, 0);
});
