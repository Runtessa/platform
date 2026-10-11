import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Runtessa',
  tagline: 'Author, publish and run live tenant applications',
  favicon: 'img/runtessa-avatar.png',
  url: process.env.DOCS_URL || 'https://runtessa.github.io',
  baseUrl: process.env.DOCS_BASE_URL || '/platform/',
  organizationName: 'Runtessa',
  projectName: 'platform',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',

        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/social-card.svg',
    navbar: {
      title: 'Runtessa',
      logo: { alt: 'Runtessa', src: 'img/runtessa-avatar.png' },
      items: [
        { to: '/docs/getting-started', label: 'Get started', position: 'left' },
        { to: '/docs/', label: 'Documentation', position: 'left' },
        { to: '/docs/platform/overview', label: 'Platform', position: 'left' },
        { href: 'https://github.com/Runtessa/platform', label: 'GitHub', position: 'right' },
        { to: '/docs/security', label: 'Security', position: 'left' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Build',
          items: [
            { label: 'First application', to: '/docs/tutorials/first-application' },
            { label: 'Application cookbook', to: '/docs/cookbook/overview' },
            { label: 'Authoring workflow', to: '/docs/platform/authoring' },
          ],
        },
        {
          title: 'Understand',
          items: [
            { label: 'Platform tour', to: '/docs/platform/overview' },
            { label: 'Architecture', to: '/docs/architecture/overview' },
            { label: 'Live runtime', to: '/docs/operations/runtime' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/Runtessa/platform' },
            { label: 'Contributing', to: '/docs/contributing' },
            { label: 'Roadmap', to: '/docs/project/roadmap' },
            { label: 'Security & validation', to: '/docs/project/validation' },
          ],
        },
      ],
      copyright: 'Copyright 2026 Alireza Dadrass and Runtessa contributors. Apache-2.0.',
    },
    prism: {
      additionalLanguages: ['bash', 'json', 'yaml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
