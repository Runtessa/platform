const test = require("node:test");
const assert = require("node:assert/strict");
const connect = require("../../src/public/preview-auth.js");

function fixture() {
  let message;
  const calls = [];
  const parent = {
    postMessage: (data, origin) => {
      message = { data, origin };
    },
  };
  let receive;
  const win = {
    parent,
    URL,
    Headers,
    location: {
      origin: "https://runtime.test",
      href: "https://runtime.test/preview.html",
    },
    setTimeout,
    clearTimeout,
    addEventListener: (_, fn) => {
      receive = fn;
    },
    fetch: async (...args) => {
      calls.push(args);
      return { ok: true };
    },
  };
  const config = {
    editorOrigin: "https://studio.test",
    tenantHost: "tenant.test",
    previewSession: "frame-a",
    stage: "draft",
  };
  const auth = connect(win, config);
  const credential = {
    source: "idp-preview-auth",
    previewSession: "frame-a",
    tenantHost: "tenant.test",
    token: "scoped",
    expiresAt: Date.now() + 600000,
  };
  const send = (
    data = credential,
    origin = config.editorOrigin,
    source = parent,
  ) => receive({ data, origin, source });
  return { win, auth, calls, send, credential, message };
}

test("preview waits for matching parent, origin, frame and tenant before sending credentials", async () => {
  const f = fixture();
  assert.equal(f.message.origin, "https://studio.test");
  const request = f.win.fetch("/api/tasks");
  f.send(f.credential, "https://evil.test");
  f.send(f.credential, "https://studio.test", {});
  f.send({ ...f.credential, previewSession: "frame-b" });
  f.send({ ...f.credential, tenantHost: "other.test" });
  await Promise.resolve();
  assert.equal(f.calls.length, 0);
  f.send();
  await request;
  const headers = f.calls[0][1].headers;
  assert.equal(headers.get("Authorization"), "Bearer scoped");
  assert.equal(headers.get("X-Tenant-Host"), "tenant.test");
  assert.equal(headers.get("X-Dev-Preview"), "1");
});

test("external requests never receive preview credentials; Request headers and refresh are preserved", async () => {
  const f = fixture();
  await f.win.fetch("https://cdn.test/package.js");
  assert.equal(f.calls[0][1], undefined);
  f.send();
  await f.win.fetch(
    new Request("https://runtime.test/api/tasks", {
      headers: { "X-Custom": "kept" },
    }),
  );
  assert.equal(f.calls[1][1].headers.get("X-Custom"), "kept");
  f.send({ ...f.credential, token: "refreshed" });
  await f.win.fetch("/api/tasks");
  assert.equal(f.calls[2][1].headers.get("Authorization"), "Bearer refreshed");
});

test("preview surfaces authentication failure and direct previews retain ordinary cookie login", async () => {
  const f = fixture();
  f.send({
    source: "idp-preview-auth",
    previewSession: "frame-a",
    error: "Access denied",
  });
  await assert.rejects(f.auth.ready, /Access denied/);
  assert.equal(f.calls.length, 0);
  const calls = [];
  const direct = {
    URL,
    Headers,
    location: { href: "https://runtime.test/", origin: "https://runtime.test" },
    fetch: async (...args) => calls.push(args),
  };
  direct.parent = direct;
  connect(direct, { tenantHost: "tenant.test", stage: "published" });
  await direct.fetch("/api/tasks", { credentials: "include" });
  assert.equal(calls[0][1].credentials, "include");
  assert.equal(calls[0][1].headers.get("Authorization"), null);
  assert.equal(calls[0][1].headers.get("X-Dev-Preview"), "0");
});
