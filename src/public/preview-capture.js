(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.RuntessaPreviewCapture = { connect: factory };
})(typeof window === 'undefined' ? null : window, function (win, config, ready) {
  if (!config.editorOrigin || !config.previewSession || win.parent === win) return;
  var pending = false, renderer;
  function loadRenderer() {
    if (win.RuntessaCapture) return Promise.resolve(win.RuntessaCapture);
    if (!renderer) renderer = new Promise(function (resolve, reject) {
      var timer = win.setTimeout(function () { renderer = null; reject(Error('Preview capture failed to load.')); }, 10000);
      var script = win.document.createElement('script');
      script.src = '/preview-capture-renderer.js';
      script.onload = function () { win.clearTimeout(timer); resolve(win.RuntessaCapture); };
      script.onerror = function () { win.clearTimeout(timer); renderer = null; reject(Error('Could not load preview capture.')); };
      win.document.head.appendChild(script);
    });
    return renderer;
  }
  win.addEventListener('message', async function (event) {
    var data = event.data;
    if (event.source !== win.parent || event.origin !== config.editorOrigin ||
        !data || data.source !== 'runtessa-preview-capture' || data.previewSession !== config.previewSession ||
        typeof data.requestId !== 'string' || data.requestId.length > 100 || pending) return;
    pending = true;
    var reply = { source: 'runtessa-preview-snapshot', previewSession: config.previewSession, requestId: data.requestId };
    try {
      await ready;
      if (!win.document.getElementById('root')?.children.length) throw Error('Wait for the preview to finish loading.');
      var capture = await loadRenderer();
      var width = win.innerWidth, height = win.innerHeight;
      if (width < 1 || height < 1 || width > 8192 || height > 8192 || width * height > 24000000)
        throw Error('Preview is too large to capture.');
      var timeout;
      var image = await Promise.race([capture.toPng(win.document.documentElement, {
        width: width, height: height, pixelRatio: 1, skipAutoScale: true, skipFonts: true,
        style: { transform: 'translate(' + -win.scrollX + 'px,' + -win.scrollY + 'px)' },
        filter: function (node) { return !['SCRIPT', 'NOSCRIPT'].includes(node.tagName); },
      }), new Promise(function (_, reject) { timeout = win.setTimeout(function () { reject(Error('Preview capture took too long. Try again.')); }, 15000); })]).finally(function () { win.clearTimeout(timeout); });
      if (image.length > 7 * 1024 * 1024) throw Error('Preview image exceeds 5 MB.');
      reply.image = image;
      reply.width = width; reply.height = height;
      reply.route = win.location.pathname + win.location.hash;
      reply.stage = config.stage === 'published' ? 'published' : 'draft';
    } catch (error) { reply.error = error.message || 'Could not capture preview.'; }
    finally { pending = false; win.parent.postMessage(reply, config.editorOrigin); }
  });
});
