const { createServiceHandlers } = require('./orchestrator-handlers-services');
const { createContainerHandlers } = require('./orchestrator-handlers-containers');
const { createHttpError } = require('./orchestrator-errors');

const createOrchestratorCommandHandlers = ({
  pkg,
  startedAt,
  resolveEngineLabel,
  ...deps
}) => {
  const services = createServiceHandlers(deps);
  const containers = createContainerHandlers(deps);

  const commands = {
    'manager.version': async () => ({
      ok: true,
      service: 'idp-container-manager',
      version: pkg.version,
      startedAt,
      now: new Date().toISOString(),
      engine: resolveEngineLabel(),
    }),
    'service.list': services.listServices,
    'service.state': services.serviceState,
    'service.action': services.serviceAction,
    'container.list': containers.listContainers,
    'container.inspect': containers.inspectContainerState,
    'container.logs': containers.getContainerLogs,
    'container.create': containers.createContainer,
    'container.action': containers.containerAction,
  };

  const execute = async (command, payload) => {
    const handler = commands[String(command || '').trim()];
    if (!handler) {
      throw createHttpError(404, `Unsupported command: ${String(command || '')}`);
    }
    return handler(payload || {});
  };

  return {
    execute,
  };
};

module.exports = {
  createOrchestratorCommandHandlers,
};
