const fs = require('fs');
const path = require('path');
const express = require('express');
const pkg = require('./package.json');
const { parseIntBounded } = require('./lib/utils');
const { createIngressServer } = require('./lib/tls');
const { registerRoutes } = require('./lib/routes');
const { registerErrorHandler } = require('./lib/errorHandler');
const { createMonitoringPubSubIngest } = require('./lib/pubsubIngest');

const envPath = path.resolve(__dirname, '.env');
if (typeof process.loadEnvFile === 'function' && fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const app = express();
app.use(express.json({ limit: process.env.MONITORING_PAYLOAD_LIMIT || '2mb' }));

registerRoutes(app);
registerErrorHandler(app);

const host = (process.env.MONITORING_HOST || '0.0.0.0').trim();
const port = parseIntBounded(process.env.MONITORING_PORT, 3011, 1, 65535);

const monitoringPubSubIngest = createMonitoringPubSubIngest();

createIngressServer(app).then(({ server, protocol }) => {
  server.listen(port, host, () => {
    console.log(`[monitoring] listening on ${protocol}://${host}:${port} (version: ${pkg.version})`);
    monitoringPubSubIngest.start().catch((error) => {
      const message = String(error?.message || error || 'failed to start monitoring pubsub ingest');
      console.error(`[monitoring] ${message}`);
    });
  });
}).catch(() => {
  console.error('TLS server initialization failed; check private configuration.');
  process.exitCode = 1;
});
