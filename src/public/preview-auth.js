(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.RuntessaPreviewAuth = { connect: factory };
})(
  typeof window === "undefined" ? null : window,
  function connectPreviewAuth(win, config) {
    var token = "";
    var expiresAt = 0;
    var hasParent = win.parent && win.parent !== win;
    var editorOrigin = config.editorOrigin;
    var settle, fail;
    var ready =
      !hasParent || !editorOrigin
        ? Promise.resolve()
        : new Promise(function (resolve, reject) {
            settle = resolve;
            fail = reject;
          });
    var timer;
    if (settle) {
      timer = win.setTimeout(function () {
        fail(
          new Error("Preview sign-in timed out. Reload preview from Studio."),
        );
      }, 30000);
      win.addEventListener("message", function (event) {
        var data = event.data;
        if (
          event.source !== win.parent ||
          event.origin !== editorOrigin ||
          !data ||
          data.source !== "idp-preview-auth" ||
          data.previewSession !== config.previewSession
        )
          return;
        if (data.error) {
          token = "";
          expiresAt = 0;
          win.clearTimeout(timer);
          fail(new Error(data.error));
          return;
        }
        if (
          data.tenantHost !== config.tenantHost ||
          typeof data.token !== "string" ||
          !data.token ||
          !Number.isFinite(data.expiresAt) ||
          data.expiresAt <= Date.now()
        )
          return;
        token = data.token;
        expiresAt = data.expiresAt;
        win.clearTimeout(timer);
        settle();
      });
    }
    var originalFetch = win.fetch.bind(win);
    win.fetch = async function (input, init) {
      var requestUrl =
        typeof input === "string" || input instanceof win.URL
          ? String(input)
          : input.url;
      var target = new win.URL(requestUrl, win.location.href);
      if (target.origin !== win.location.origin)
        return originalFetch(input, init);
      await ready;
      if (expiresAt && expiresAt <= Date.now()) {
        throw new Error("Preview session expired. Reload preview from Studio.");
      }
      var options = Object.assign({}, init || {});
      var headers = new win.Headers(
        options.headers || (input && input.headers) || {},
      );
      if (token) headers.set("Authorization", "Bearer " + token);
      if (config.tenantHost) headers.set("X-Tenant-Host", config.tenantHost);
      headers.set("X-Dev-Preview", config.stage === "draft" ? "1" : "0");
      headers.set("X-Dev-Source", config.stage === "draft" ? "1" : "0");
      options.headers = headers;
      return originalFetch(input, options);
    };
    if (settle)
      win.parent.postMessage(
        {
          source: "idp-preview-ready",
          previewSession: config.previewSession,
        },
        editorOrigin,
      );
    if (win.RuntessaPreviewCapture) win.RuntessaPreviewCapture.connect(win, config, ready);
    return { ready: ready };
  },
);
