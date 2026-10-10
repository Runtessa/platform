import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const guides = {
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
  writeFileSync(output, `---\ntitle: ${title}\n---\n\n<!-- Generated from ${source}; edit the source guide. -->\n\n${transformed}`);
}
console.log('Synchronized canonical guides into the documentation site.');
