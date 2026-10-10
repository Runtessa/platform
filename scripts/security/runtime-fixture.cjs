const { serveRestrictedProcess } = require('@idp/shared/dist/runtime/process-channel');
const { loadDynamicOrmEntities } = require('@idp/shared/dist/runtime/orm-loader');
const { DataSource } = require('typeorm');

serveRestrictedProcess(async (input, call) => {
  if (input.operation === 'echo') return { version: input.version, environment: Object.keys(process.env) };
  if (input.operation === 'rpc') return call(input.capability, input.value);
  if (input.operation === 'loop') { while (true) {} }
  if (input.operation === 'hold') return new Promise((resolve) => setTimeout(() => resolve(true), 5000));
  if (input.operation === 'read') return require('node:fs').readFileSync(input.path, 'utf8');
  if (input.operation === 'spawn') return require('node:child_process').execFileSync('/usr/bin/true');
  if (input.operation === 'models') {
    const { entities, entityMap } = loadDynamicOrmEntities(input.models);
    const source = new DataSource({ type: 'postgres', entities, synchronize: false });
    await source.buildMetadatas();
    return { tables: source.entityMetadatas.map((entity) => entity.tableName).sort(),
      methodResult: new entityMap.Note().label(), columns: source.getMetadata(entityMap.Note).columns.map((column) => column.propertyName),
      relations: source.getMetadata(entityMap.Note).relations.map((relation) => relation.propertyName) };
  }
  throw Error('Unknown test operation');
});
