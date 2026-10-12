const test = require('node:test');
const assert = require('node:assert/strict');
const connect = require('../../src/public/preview-capture.js');
function fixture(capture = async () => 'data:image/png;base64,iVBORw0KGgo=') {
  const calls = [], replies = [];
  let receive;
  const parent = { postMessage: (data, origin) => replies.push({ data, origin }) };
  const win = { parent, innerWidth: 800, innerHeight: 600, scrollX: 0, scrollY: 45,
    location: { pathname: '/tasks', hash: '#board' }, setTimeout, clearTimeout,
    document: { documentElement: {}, getElementById: () => ({ children: [{}] }) },
    RuntessaCapture: { toPng: async (node, options) => { calls.push({ node, options }); return capture(); } },
    addEventListener: (_name, callback) => { receive = callback; } };
  connect(win, { editorOrigin: 'https://studio.test', previewSession: 'session-1', stage: 'draft' }, Promise.resolve());
  const request = { source: 'runtessa-preview-capture', previewSession: 'session-1', requestId: 'capture-1' };
  return { calls, replies, win, send: (override = {}) => receive({ source: parent, origin: 'https://studio.test', data: request, ...override }), request };
}
test('a foreign window, origin, session or request type cannot capture the preview', async () => {
  const f = fixture();
  for (const override of [{ source: {} }, { origin: 'https://attacker.test' },
    { data: { ...f.request, previewSession: 'other' } }, { data: { ...f.request, source: 'other' } }]) await f.send(override);
  assert.equal(f.calls.length, 0); assert.equal(f.replies.length, 0);
});
test('the signed-in editor gets the full viewport, route and stage without auth parameters or image resizing', async () => {
  const f = fixture(); await f.send();
  assert.equal(f.calls.length, 1);
  assert.deepEqual({ width: f.calls[0].options.width, height: f.calls[0].options.height, pixelRatio: f.calls[0].options.pixelRatio }, { width: 800, height: 600, pixelRatio: 1 });
  const reply = f.replies[0]; assert.equal(reply.origin, 'https://studio.test');
  assert.equal(reply.data.route, '/tasks#board'); assert.equal(reply.data.stage, 'draft');
  assert.equal(reply.data.requestId, 'capture-1'); assert.equal(reply.data.token, undefined);
  assert.equal(reply.data.width, 800); assert.equal(reply.data.height, 600);
});
test('capture errors return an actionable failure and unlock subsequent attempts', async () => {
  const f = fixture(async () => { throw Error('Image could not be captured'); });
  await f.send(); await f.send();
  assert.equal(f.replies.length, 2); assert.match(f.replies[0].data.error, /could not be captured/);
  assert.equal(f.replies[0].data.image, undefined);
});
test('renderer scripts always load from Runtime itself, never the configurable Studio origin', async () => {
  const f = fixture(); const capture = f.win.RuntessaCapture;
  delete f.win.RuntessaCapture;
  let scriptSrc;
  f.win.document.createElement = () => ({});
  f.win.document.head = { appendChild: script => { scriptSrc = script.src; f.win.RuntessaCapture = capture; script.onload(); } };
  await f.send();
  assert.equal(scriptSrc, '/preview-capture-renderer.js');
  assert.equal(f.replies.length, 1); assert.equal(f.replies[0].data.error, undefined);
});
test('concurrent capture requests do not interfere with the original request', async () => {
  let complete;
  const f = fixture(() => new Promise(resolve => { complete = resolve; }));
  const first = f.send(); await new Promise(resolve => setImmediate(resolve));
  await f.send({ data: { ...f.request, requestId: 'capture-2' } });
  complete('data:image/png;base64,iVBORw0KGgo='); await first;
  assert.equal(f.calls.length, 1); assert.equal(f.replies.length, 1); assert.equal(f.replies[0].data.requestId, 'capture-1');
});
