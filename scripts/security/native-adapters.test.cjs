require('reflect-metadata');
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const Redis = require('ioredis');
const { nativePostgres } = require('../database/native-postgres.cjs');
const { validateTenantPostgresConfig } = require('@idp/shared/dist/runtime/postgres-config');
const { authorizeNetworkTarget } = require('@idp/shared/dist/runtime/network-policy');
const { createRedisCapability } = require('../../dist/engine/runtimeRedisCapability');

test('native adapters validate database roles and scope Redis keys without exposing raw connections', async () => {
  const database = await nativePostgres(), previous = process.env.RUNTIME_EGRESS_ALLOW;
  process.env.RUNTIME_EGRESS_ALLOW = '127.0.0.1:5432,127.0.0.1:6379';
  const tenant = { id: crypto.randomUUID() }, prefix = `runtessa:${tenant.id}:`;
  const client = new Redis({host:'127.0.0.1',port:6379,lazyConnect:true,maxRetriesPerRequest:0});
  const scoped = createRedisCapability(tenant, {resolveSecretValue:async()=>JSON.stringify({host:'127.0.0.1',port:6379})},
    {ensureAdapterAccess(_tenant,_adapter,key){if(key!=='own')throw Error('Access denied');}});
  try {
    await validateTenantPostgresConfig(database.config);
    await assert.rejects(authorizeNetworkTarget({host:'127.0.0.1',port:6379}),/Raw Redis/);
    await client.connect();
    await scoped.call({key:'own',command:'set',name:'note',value:'isolated',ttl:30});
    assert.equal(await client.get(prefix+'note'),'isolated'); assert.equal(await scoped.call({key:'own',command:'get',name:'note'}),'isolated');
    assert.ok(await client.ttl(prefix+'note')>0);
    await assert.rejects(scoped.call({key:'own',command:'flushall',name:'note'}),/Invalid/);
    await assert.rejects(scoped.call({key:'foreign',command:'get',name:'note'}),/Access denied/);
    await assert.rejects(scoped.call({key:'own',command:'set',name:'note',value:'x'.repeat(262145)}),/budget/);
    assert.equal(await scoped.call({key:'own',command:'del',name:'note'}),1);
  } finally {
    await scoped.dispose(); if(client.status==='ready')await client.del(prefix+'note'); client.disconnect(); await database.stop();
    if(previous===undefined)delete process.env.RUNTIME_EGRESS_ALLOW;else process.env.RUNTIME_EGRESS_ALLOW=previous;
  }
});
