const { DEFAULTS } = require('./constants');
const { parseIntBounded, isObject } = require('./utils');
const { isValidSnapshot, isValidAlert, normalizeSnapshot, normalizeAlert } = require('./models');
const { redis, ingestSnapshot, ingestAlert } = require('./redisStore');

const MONITORING_PUBSUB_CHANNEL =
  (process.env.MONITORING_PUBSUB_CHANNEL || '').trim() || 'idp:monitoring:ingest';

const parsePayload = (raw) => {
  try {
    const parsed = JSON.parse(String(raw || '{}'));
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const createMonitoringPubSubIngest = () => {
  const subscriber = redis.duplicate();

  const ingestPayload = async (payload) => {
    const snapshots = [payload.snapshot, ...(Array.isArray(payload.snapshots) ? payload.snapshots : [])]
      .filter(isValidSnapshot)
      .map(normalizeSnapshot);
    const alerts = [payload.alert, ...(Array.isArray(payload.alerts) ? payload.alerts : [])]
      .filter(isValidAlert)
      .map(normalizeAlert);

    if (!snapshots.length && !alerts.length) return;

    const snapshotRetention = parseIntBounded(
      payload.snapshotRetention,
      DEFAULTS.snapshotRetention,
      100,
      30000
    );
    const alertRetention = parseIntBounded(payload.alertRetention, DEFAULTS.alertRetention, 100, 50000);
    const heartbeatTtlSec = parseIntBounded(
      process.env.MONITORING_INSTANCE_TTL_SEC,
      DEFAULTS.instanceTtlSec,
      10,
      300
    );

    await Promise.all([
      ...snapshots.map((snapshot) => ingestSnapshot(snapshot, snapshotRetention, heartbeatTtlSec)),
      ...alerts.map((alert) => ingestAlert(alert, alertRetention)),
    ]);
  };

  const start = async () => {
    if (subscriber.status === 'wait') {
      await subscriber.connect();
    }
    await subscriber.subscribe(MONITORING_PUBSUB_CHANNEL);
    console.log(`[monitoring] pubsub ingest subscribed (${MONITORING_PUBSUB_CHANNEL})`);

    subscriber.on('message', (channel, rawMessage) => {
      if (channel !== MONITORING_PUBSUB_CHANNEL) return;
      const payload = parsePayload(rawMessage);
      void ingestPayload(payload).catch((error) => {
        const message = String(error?.message || error || 'ingest failed');
        console.error(`[monitoring] pubsub ingest failed: ${message}`);
      });
    });
  };

  return {
    start,
  };
};

module.exports = {
  createMonitoringPubSubIngest,
};
