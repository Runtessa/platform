const createContainerLifecycle = ({ docker, resolveManagedSecurityOpts }) => {
  const containerFromName = (name) => docker.getContainer(name);

  const listImageTags = async () => {
    const images = await docker.listImages();
    const tags = new Set();
    for (const image of images) {
      if (!Array.isArray(image?.RepoTags)) continue;
      for (const tag of image.RepoTags) {
        if (typeof tag === 'string' && tag.trim()) tags.add(tag.trim());
      }
    }
    return tags;
  };

  const localImageCandidates = (image) => {
    const raw = String(image || '').trim();
    if (!raw) return [];
    const candidates = new Set([raw]);
    if (raw.startsWith('localhost/')) {
      candidates.add(raw.slice('localhost/'.length));
    } else {
      candidates.add(`localhost/${raw}`);
    }
    return [...candidates];
  };

  const inspectContainer = async (name) => {
    try {
      return await containerFromName(name).inspect();
    } catch (error) {
      if (error?.statusCode === 404) return null;
      throw error;
    }
  };

  const ensureImage = async (image) => {
    try {
      await docker.getImage(image).inspect();
      return;
    } catch (error) {
      if (error?.statusCode !== 404) throw error;
    }

    const localTags = await listImageTags();
    for (const candidate of localImageCandidates(image)) {
      if (localTags.has(candidate)) return;
    }

    if (String(image || '').trim().startsWith('localhost/')) {
      throw new Error(
        `Local image "${image}" is not available to the container engine. Build or retag it before creating the managed service.`
      );
    }

    await new Promise((resolve, reject) => {
      docker.pull(image, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        docker.modem.followProgress(stream, (pullErr) => {
          if (pullErr) reject(pullErr);
          else resolve(undefined);
        });
      });
    });
  };

  const extractMappedPort = (inspect, containerPort) => {
    const key = `${containerPort}/tcp`;
    const mapping = inspect?.NetworkSettings?.Ports?.[key];
    if (!Array.isArray(mapping) || !mapping[0]?.HostPort) return null;
    const port = Number(mapping[0].HostPort);
    if (!Number.isFinite(port)) return null;
    return port;
  };

  const createContainerIfMissing = async ({
    name,
    image,
    port,
    binds,
    env,
    labels,
    containerPort,
  }) => {
    const existing = await inspectContainer(name);
    if (existing) return existing;

    await ensureImage(image);

    const securityOpts = resolveManagedSecurityOpts();
    const container = await docker.createContainer({
      name,
      Image: image,
      Env: env,
      Labels: labels,
      ExposedPorts: {
        [`${containerPort}/tcp`]: {},
      },
      HostConfig: {
        RestartPolicy: { Name: 'unless-stopped' },
        PortBindings: {
          [`${containerPort}/tcp`]: [{ HostPort: String(port) }],
        },
        Binds: binds,
        ...(securityOpts.length > 0 ? { SecurityOpt: securityOpts } : {}),
      },
    });
    await container.start();
    return inspectContainer(name);
  };

  const startContainerIfStopped = async (name, inspect) => {
    if (inspect?.State?.Running) return inspect;
    await containerFromName(name).start();
    return inspectContainer(name);
  };

  const applyAction = async (name, action) => {
    const inspect = await inspectContainer(name);
    if (!inspect) {
      if (action === 'remove') return;
      throw new Error(`Container ${name} does not exist`);
    }
    const container = containerFromName(name);
    if (action === 'start') {
      if (!inspect.State?.Running) await container.start();
      return;
    }
    if (action === 'stop') {
      if (inspect.State?.Running) await container.stop();
      return;
    }
    if (action === 'restart') {
      await container.restart();
      return;
    }
    if (action === 'remove') {
      await container.remove({ force: true });
      return;
    }
    throw new Error(`Unsupported action: ${action}`);
  };

  return {
    containerFromName,
    inspectContainer,
    ensureImage,
    extractMappedPort,
    createContainerIfMissing,
    startContainerIfStopped,
    applyAction,
  };
};

module.exports = {
  createContainerLifecycle,
};
