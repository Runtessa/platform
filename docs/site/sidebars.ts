import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    'getting-started',
    'tutorials/first-application',
    { type: 'category', label: 'Platform', items: ['platform/overview', 'platform/authoring', 'platform/tooling', 'platform/developer-guide'] },
    { type: 'category', label: 'Application cookbook', items: ['cookbook/overview', 'cookbook/tenant-config', 'cookbook/backend', 'cookbook/acl', 'cookbook/ui', 'cookbook/shared'] },
    { type: 'category', label: 'Operations', items: ['operations/migrations', 'operations/runtime'] },
    { type: 'category', label: 'Project', items: ['project/roadmap', 'project/dependencies', 'project/validation', 'project/release', 'security', 'contributing'] },
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
