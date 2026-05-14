const { createHttpError } = require('./orchestrator-errors');

const createServiceHandlers = ({
  getExtraServices,
  sanitizeSegment,
  userKeyFromInput,
  resolveManagedServiceDefinition,
  buildStateForService,
  ensureManagedService,
  allowedActions,
  applyAction,
}) => {
  const listServices = async () => {
    const extras = getExtraServices();
    const services = [
      { key: 'codex-gateway', userScoped: true, managed: true },
      { key: 'monitoring', userScoped: false, managed: true },
      ...Object.keys(extras).map((key) => ({ key, userScoped: false, managed: true })),
    ];
    return { ok: true, services };
  };

  const serviceState = async (input) => {
    const serviceKey = sanitizeSegment(input?.service, 64);
    if (!serviceKey) {
      throw createHttpError(400, 'service is required');
    }
    const userKey = userKeyFromInput(input?.userId || 'anonymous');
    const userName = String(input?.userName || '').trim();
    const service = await resolveManagedServiceDefinition(serviceKey, userKey, userName, null);
    if (!service) {
      throw createHttpError(404, `Unknown service: ${serviceKey}`);
    }
    const state = await buildStateForService(service, serviceKey === 'codex-gateway' ? userKey : null);
    return { ok: true, state };
  };

  const serviceAction = async (input) => {
    const action = String(input?.action || '')
      .trim()
      .toLowerCase();
    if (!allowedActions.has(action)) {
      throw createHttpError(400, 'Invalid action');
    }
    const serviceKey = sanitizeSegment(input?.service, 64);
    if (!serviceKey) {
      throw createHttpError(400, 'service is required');
    }
    const userKey = userKeyFromInput(input?.userId || 'anonymous');
    const userName = String(input?.userName || '').trim();
    const preferredPort = input?.preferredPort;
    const service = await resolveManagedServiceDefinition(serviceKey, userKey, userName, preferredPort);
    if (!service) {
      throw createHttpError(404, `Unknown service: ${serviceKey}`);
    }

    if (action === 'create') {
      const state = await ensureManagedService(service, serviceKey === 'codex-gateway' ? userKey : null);
      return { ok: true, state };
    }

    await applyAction(service.containerName, action);
    const state = await buildStateForService(service, serviceKey === 'codex-gateway' ? userKey : null);
    return { ok: true, state };
  };

  return {
    listServices,
    serviceState,
    serviceAction,
  };
};

module.exports = {
  createServiceHandlers,
};
