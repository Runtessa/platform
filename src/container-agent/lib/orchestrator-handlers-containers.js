const { createHttpError } = require('./orchestrator-errors');

const createContainerHandlers = ({
  parseQueryBool,
  asBool,
  managedLabelValues,
  docker,
  formatContainerSummary,
  sanitizeSegment,
  inspectContainer,
  isManagedContainer,
  parseIntBounded,
  containerFromName,
  readDockerLogBuffer,
  demuxDockerLogs,
  parseEnvList,
  parseEnvMap,
  allowedActions,
  managerLabel,
  ensureImage,
  resolveManagedSecurityOpts,
  resolveAllowUnmanagedActions,
  applyAction,
}) => {
  const listContainers = async (input) => {
    const managedOnly = parseQueryBool(input?.managedOnly, true, asBool);
    const query = {
      all: true,
      ...(managedOnly
        ? {
            filters: {
              label: managedLabelValues.map((value) => `idp.managed.by=${value}`),
            },
          }
        : {}),
    };
    const list = await docker.listContainers(query);
    const serviceFilter = String(input?.service || '').trim();
    const search = String(input?.search || '').trim().toLowerCase();
    // Duplicate D13: see docs/release/code-integrity-audit.md before changing either copy.
    const filtered = list.filter((row) => {
      if (serviceFilter) {
        const service = String(row.Labels?.['idp.service'] || '').trim();
        if (service !== serviceFilter) return false;
      }
      if (!search) return true;
      const haystack = [
        row.Id,
        ...(Array.isArray(row.Names) ? row.Names : []),
        row.Image,
        row.Command,
        row.Status,
        row.Labels?.['idp.service'] || '',
      ]
        .map((entry) => String(entry || '').toLowerCase())
        .join(' ');
      return haystack.includes(search);
    });
    return {
      ok: true,
      managedOnly,
      total: filtered.length,
      containers: filtered.map(formatContainerSummary),
    };
  };

  const inspectContainerState = async (input) => {
    const containerName = sanitizeSegment(input?.containerName || '', 128);
    if (!containerName) {
      throw createHttpError(400, 'containerName is required');
    }
    const inspect = await inspectContainer(containerName);
    if (!inspect) {
      throw createHttpError(404, `Container ${containerName} not found`);
    }
    const state = {
      id: inspect.Id,
      name: String(inspect.Name || '').replace(/^\/+/, ''),
      image: inspect.Config?.Image || '',
      created: inspect.Created,
      platform: inspect.Platform || '',
      state: inspect.State || {},
      config: {
        env: inspect.Config?.Env || [],
        cmd: inspect.Config?.Cmd || [],
        entrypoint: inspect.Config?.Entrypoint || [],
        workingDir: inspect.Config?.WorkingDir || '',
        labels: inspect.Config?.Labels || {},
      },
      hostConfig: {
        restartPolicy: inspect.HostConfig?.RestartPolicy || {},
        networkMode: inspect.HostConfig?.NetworkMode || '',
        binds: inspect.HostConfig?.Binds || [],
        portBindings: inspect.HostConfig?.PortBindings || {},
      },
      mounts: inspect.Mounts || [],
      networkSettings: inspect.NetworkSettings || {},
      isManaged: isManagedContainer(inspect),
    };
    return {
      ok: true,
      containerName,
      inspect: state,
    };
  };

  const getContainerLogs = async (input) => {
    const containerName = sanitizeSegment(input?.containerName || '', 128);
    if (!containerName) {
      throw createHttpError(400, 'containerName is required');
    }
    const inspect = await inspectContainer(containerName);
    if (!inspect) {
      throw createHttpError(404, `Container ${containerName} not found`);
    }
    const tail = parseIntBounded(input?.tail, 200, 1, 5000);
    const since = parseIntBounded(input?.since, 0, 0, 4_000_000_000);
    const rawLogs = await containerFromName(containerName).logs({
      stdout: true,
      stderr: true,
      timestamps: true,
      tail,
      ...(since > 0 ? { since } : {}),
    });
    const logBuffer = await readDockerLogBuffer(rawLogs);
    const logs = demuxDockerLogs(logBuffer);
    return {
      ok: true,
      containerName,
      tail,
      logs,
    };
  };

  const createContainer = async (input) => {
    const image = String(input?.image || '').trim();
    if (!image) {
      throw createHttpError(400, 'image is required');
    }
    const requestedName = sanitizeSegment(input?.name || '', 128);
    const containerName =
      requestedName ||
      `idp-${sanitizeSegment(image.replace(/[:/@]+/g, '-'), 40) || 'container'}-${Date.now()}`;
    const existing = await inspectContainer(containerName);
    if (existing) {
      throw createHttpError(409, `Container ${containerName} already exists`);
    }

    const envList = parseEnvList(input?.env);
    const envMap = parseEnvMap(input?.envMap);
    const env = [...envList, ...Object.entries(envMap).map(([key, value]) => `${key}=${value}`)];
    const binds = parseEnvList(input?.binds);
    const labels = parseEnvMap(input?.labels);
    const managed = Boolean(input?.managed);
    if (managed) {
      labels['idp.managed.by'] = managerLabel;
    }

    const rawPorts = Array.isArray(input?.ports) ? input.ports : [];
    const ExposedPorts = {};
    const PortBindings = {};
    rawPorts.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const containerPort = parseIntBounded(entry.containerPort, 0, 1, 65535);
      if (!containerPort) return;
      const hostPort = parseIntBounded(entry.hostPort, 0, 0, 65535);
      const protocol =
        String(entry.protocol || 'tcp').trim().toLowerCase() === 'udp' ? 'udp' : 'tcp';
      const portKey = `${containerPort}/${protocol}`;
      ExposedPorts[portKey] = {};
      PortBindings[portKey] = hostPort > 0 ? [{ HostPort: String(hostPort) }] : [{}];
    });

    const restartPolicyName = String(input?.restartPolicy || 'unless-stopped')
      .trim()
      .toLowerCase();
    const allowedRestartPolicies = new Set(['no', 'always', 'unless-stopped', 'on-failure']);
    const restartPolicy = allowedRestartPolicies.has(restartPolicyName)
      ? restartPolicyName
      : 'unless-stopped';
    const cmd =
      Array.isArray(input?.cmd) && input.cmd.length
        ? input.cmd.map((item) => String(item))
        : typeof input?.cmd === 'string' && input.cmd.trim()
        ? input.cmd
            .trim()
            .split(' ')
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined;
    const entrypoint =
      Array.isArray(input?.entrypoint) && input.entrypoint.length
        ? input.entrypoint.map((item) => String(item))
        : typeof input?.entrypoint === 'string' && input.entrypoint.trim()
        ? input.entrypoint
            .trim()
            .split(' ')
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined;

    await ensureImage(image);
    const securityOpts = resolveManagedSecurityOpts();
    const container = await docker.createContainer({
      name: containerName,
      Image: image,
      ...(env.length ? { Env: env } : {}),
      ...(Object.keys(labels).length ? { Labels: labels } : {}),
      ...(cmd && cmd.length ? { Cmd: cmd } : {}),
      ...(entrypoint && entrypoint.length ? { Entrypoint: entrypoint } : {}),
      ...(Object.keys(ExposedPorts).length ? { ExposedPorts } : {}),
      HostConfig: {
        RestartPolicy: { Name: restartPolicy },
        ...(Object.keys(PortBindings).length ? { PortBindings } : {}),
        ...(binds.length ? { Binds: binds } : {}),
        ...(securityOpts.length > 0 ? { SecurityOpt: securityOpts } : {}),
      },
    });

    const autoStart = input?.autoStart === undefined ? true : Boolean(input?.autoStart);
    if (autoStart) {
      await container.start();
    }
    const created = await inspectContainer(containerName);
    return {
      ok: true,
      containerName,
      created: true,
      running: Boolean(created?.State?.Running),
    };
  };

  const containerAction = async (input) => {
    const action = String(input?.action || '')
      .trim()
      .toLowerCase();
    const containerName = sanitizeSegment(input?.containerName || '', 128);
    if (!allowedActions.has(action)) {
      throw createHttpError(400, 'Invalid action');
    }
    if (!containerName) {
      throw createHttpError(400, 'containerName is required');
    }
    const inspect = await inspectContainer(containerName);
    if (!inspect) {
      if (action === 'remove') {
        return { ok: true, removed: true, containerName, existed: false };
      }
      throw createHttpError(404, `Container ${containerName} not found`);
    }

    const allowUnmanaged = resolveAllowUnmanagedActions();
    if (!allowUnmanaged && !isManagedContainer(inspect)) {
      throw createHttpError(
        403,
        'Action denied for unmanaged container. Set CONTAINER_MANAGER_ALLOW_UNMANAGED_ACTIONS=true to override.'
      );
    }
    await applyAction(containerName, action);
    const nextState = await inspectContainer(containerName);
    return {
      ok: true,
      containerName,
      action,
      exists: Boolean(nextState),
      running: Boolean(nextState?.State?.Running),
    };
  };

  return {
    listContainers,
    inspectContainerState,
    getContainerLogs,
    createContainer,
    containerAction,
  };
};

module.exports = {
  createContainerHandlers,
};
