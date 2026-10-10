import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    'getting-started',
    'security',
    'contributing',
    { type: 'category', label: 'Operations', items: ['operations/migrations', 'operations/runtime'] },
    { type: 'category', label: 'Project', items: ['project/roadmap', 'project/dependencies', 'project/release'] },
    {
      type: 'category',
      label: 'Architecture',
      items: ['architecture/overview', 'architecture/idpcore-map', 'architecture/dependency-graph'],
    },
    {
      type: 'category',
      label: 'Services',
      items: ['services/core', 'services/ide', 'services/auth', 'services/infrastructure'],
    },
    {
      type: 'category',
      label: 'Reference',
      items: ['reference/services', 'reference/routes', 'reference/openapi-spec'],
    },
  ],
};

export default sidebars;
