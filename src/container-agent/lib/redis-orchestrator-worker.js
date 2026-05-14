const os = require('os');
const Redis = require('ioredis');
const { normalizeError } = require('./orchestrator-errors');

const buildRedisUrl = ({ pickEnv }) =>
  pickEnv(
    'CONTAINER_ORCHESTRATOR_REDIS_URL',
    'CACHE_REDIS_URL',
    'REDIS_URL',
    'CONTAINER_MANAGER_MONITORING_REDIS_URL'
  ) || 'redis://localhost:6379';

const createRedisOrchestratorWorker = ({ pickEnv, sanitizeSegment, handlers }) => {
  const enabledRaw = pickEnv('CONTAINER_ORCHESTRATOR_ENABLED');
  const enabled = !enabledRaw || ['1', 'true', 'yes', 'on'].includes(enabledRaw.toLowerCase());
  const agentId =
    sanitizeSegment(
      pickEnv('CONTAINER_ORCHESTRATOR_AGENT_ID', 'CONTAINER_AGENT_ID', 'CONTAINER_MANAGER_ID') ||
        os.hostname(),
      64
    ) || 'default';
  const requestChannelPrefix =
    pickEnv('CONTAINER_ORCHESTRATOR_REQUEST_CHANNEL_PREFIX') || 'idp:orchestrator:requests:';
  const heartbeatKeyPrefix =
    pickEnv('CONTAINER_ORCHESTRATOR_HEARTBEAT_KEY_PREFIX') || 'idp:orchestrator:agent:';
  const heartbeatIntervalMs = Math.max(
    1_000,
    Number(pickEnv('CONTAINER_ORCHESTRATOR_HEARTBEAT_INTERVAL_MS') || '5000') || 5000
  );
  const heartbeatTtlSec = Math.max(
    5,
    Number(pickEnv('CONTAINER_ORCHESTRATOR_HEARTBEAT_TTL_SEC') || '20') || 20
  );
  const requestChannel = `${requestChannelPrefix}${agentId}`;
  const heartbeatKey = `${heartbeatKeyPrefix}${agentId}`;
  const redisUrl = buildRedisUrl({ pickEnv });

  const start = async () => {
    if (!enabled) {
      console.log('[container-manager] redis orchestration is disabled');
      return;
    }

    const redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
    const sub = redis.duplicate();
    await redis.connect();
    await sub.connect();
    await sub.subscribe(requestChannel);
    console.log(
      `[container-manager] redis orchestration online (agent=${agentId}, channel=${requestChannel})`
    );

    const pulse = async () => {
      const state = {
        agentId,
        channel: requestChannel,
        host: os.hostname(),
        pid: process.pid,
        now: new Date().toISOString(),
      };
      await redis.set(heartbeatKey, JSON.stringify(state), 'EX', heartbeatTtlSec);
    };

    const heartbeatTimer = setInterval(() => {
      pulse().catch((error) => {
        const { message } = normalizeError(error);
        console.error(`[container-manager] heartbeat failed: ${message}`);
      });
    }, heartbeatIntervalMs);
    if (typeof heartbeatTimer.unref === 'function') heartbeatTimer.unref();
    await pulse();

    sub.on('message', async (channel, rawMessage) => {
      if (channel !== requestChannel) return;

      let message = null;
      try {
        message = JSON.parse(String(rawMessage || '{}'));
      } catch (error) {
        const normalized = normalizeError(error);
        console.error(`[container-manager] invalid orchestration message: ${normalized.message}`);
        return;
      }

      const commandId = String(message?.id || '').trim();
      const command = String(message?.command || '').trim();
      const replyChannel = String(message?.replyChannel || '').trim();
      const payload = message?.payload && typeof message.payload === 'object' ? message.payload : {};
      if (!replyChannel || !command) return;

      let ok = true;
      let data = null;
      let errorMessage = '';
      let statusCode = 200;
      try {
        data = await handlers.execute(command, payload);
      } catch (error) {
        const normalized = normalizeError(error);
        ok = false;
        errorMessage = normalized.message;
        statusCode = normalized.status;
        data = { error: normalized.message, statusCode };
      }

      try {
        await redis.publish(
          replyChannel,
          JSON.stringify({
            id: commandId,
            ok,
            statusCode,
            error: errorMessage,
            data: data || {},
          })
        );
      } catch (error) {
        const normalized = normalizeError(error);
        console.error(`[container-manager] failed to publish reply: ${normalized.message}`);
      }
    });
  };

  return {
    start,
    agentId,
    requestChannel,
  };
};

module.exports = {
  createRedisOrchestratorWorker,
};
