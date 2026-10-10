import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const guides = {
  'docs/README.md': ['intro', 'Documentation'],
  'docs/platform/overview.md': ['platform/overview', 'Platform tour'],
  'docs/platform/authoring.md': ['platform/authoring', 'Authoring and publication'],
  'docs/platform/tooling.md': ['platform/tooling', 'Development and operations tools'],
  'docs/architecture/dependency-graph.md': ['architecture/dependency-graph', 'Dependency Graph'],
  'docs/tutorials/first-application.md': ['tutorials/first-application', 'Your first application'],
  'docs/developer-guide.md': ['platform/developer-guide', 'Platform developer guide'],
  'docs/platform-cookbook/README.md': ['cookbook/overview', 'Application cookbook'],
  'docs/platform-cookbook/01-tenant-config.md': ['cookbook/tenant-config', 'Tenant configuration'],
  'docs/platform-cookbook/02-backend-modules.md': ['cookbook/backend', 'Backend modules and models'],
  'docs/platform-cookbook/03-acl.md': ['cookbook/acl', 'Application access control'],
  'docs/platform-cookbook/04-ui-modules.md': ['cookbook/ui', 'React and Kernel'],
  'docs/platform-cookbook/05-shared-projects.md': ['cookbook/shared', 'Shared projects'],
  'docs/release/validation.md': ['project/validation', 'Developer preview validation'],
  'docs/getting-started.md': ['getting-started', 'Getting started'],
  'SECURITY.md': ['security', 'Security'],
  'CONTRIBUTING.md': ['contributing', 'Contributing'],
  'scripts/database/README.md': ['operations/migrations', 'Platform migrations'],
  'docker/runtime/README.md': ['operations/runtime', 'Live execution boundary'],
  'ROADMAP.md': ['project/roadmap', 'Roadmap'],
  'docs/dependencies.md': ['project/dependencies', 'Dependency policy'],
  'docs/release/README.md': ['project/release', 'Public release preparation'],
};

for (const [source, [id, title]] of Object.entries(guides)) {
  const text = readFileSync(path.join(root, source), 'utf8');
  const transformed = text.replace(/\]\(([^)\s]+)\)/g, (whole, href) => {
    if (/^(?:[a-z]+:|#|\/)/i.test(href)) return whole;
    const [relative, anchor = ''] = href.split('#');
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(source), relative));
    const mapped = guides[target];
    const url = mapped
      ? `/docs/${mapped[0]}${anchor ? `#${anchor}` : ''}`
      : `https://github.com/AlirezaDadrass/Idp/blob/main/${target}${anchor ? `#${anchor}` : ''}`;
    return `](${url})`;
  });
  const output = path.join(root, 'docs/site/docs', `${id}.md`);
  mkdirSync(path.dirname(output), { recursive: true });
  const slug = id === 'intro' ? '\nslug: /' : '';
  writeFileSync(output, `---\ntitle: ${title}${slug}\n---\n\n<!-- Generated from ${source}; edit the source guide. -->\n\n${transformed}`);
}
console.log('Synchronized canonical guides into the documentation site.');
