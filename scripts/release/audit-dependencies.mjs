import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const roots = ['.', 'src/core', 'src/ideNew', 'src/ide-vscode', 'src/auth',
  'src/kernel', 'src/monitoring', 'src/container-agent', 'docs/site'];
const reports = [];
let failed = false;
for (const directory of roots) {
  console.log(`Auditing ${directory}`);
  const result = spawnSync('npm', ['audit', '--json', ...(directory === '.' ? [] : ['--workspaces=false'])], {
    cwd: path.join(root, directory), encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    timeout: 180000,
  });
  let report;
  try { report = JSON.parse(result.stdout); } catch { /* Fail explicitly below. */ }
  if (result.error || !report?.metadata?.vulnerabilities || report.error) {
    reports.push({ directory, error: 'Advisory service query failed; no clean result established.' });
    failed = true;
    continue;
  }
  reports.push({ directory, counts: report.metadata.vulnerabilities,
    vulnerabilities: report.vulnerabilities });
}

const date = new Date().toISOString().slice(0, 10);
const output = path.join(root, 'docs/release');
mkdirSync(output, { recursive: true });
writeFileSync(path.join(output, 'dependency-audit.json'), JSON.stringify({ date, reports }, null, 2) + '\n');
const rows = reports.map(({ directory, counts }) => counts
  ? `| \`${directory}\` | ${counts.critical} | ${counts.high} | ${counts.moderate} | ${counts.low} | ${counts.total} |`
  : `| \`${directory}\` | query failed | — | — | — | — |`);
const advisories = new Map();
for (const { directory, vulnerabilities = {} } of reports) {
  for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
    for (const via of vulnerability.via || []) {
      if (typeof via !== 'object') continue;
      const item = advisories.get(via.url) || { ...via, roots: new Set(), names: new Set() };
      item.roots.add(directory); item.names.add(name); advisories.set(via.url, item);
    }
  }
}
const details = [...advisories.values()].sort((a, b) => a.name.localeCompare(b.name))
  .map(item => `- **${item.severity} · ${item.name}**: [${item.title}](${item.url}). Roots: ${[...item.roots].map(r => `\`${r}\``).join(', ')}.`);
writeFileSync(path.join(output, 'dependency-audit.md'), `# Dependency advisory snapshot\n\nGenerated ${date} by \`npm run security:dependencies\`. Includes development dependencies.\nCounts across roots overlap and must not be added as unique vulnerability counts.\nThis is a registry snapshot, not a claim that every advisory is exploitable.\n\n| Install root | Critical | High | Moderate | Low | Total |\n| --- | ---: | ---: | ---: | ---: | ---: |\n${rows.join('\n')}\n\n## Unresolved upstream advisories\n\n${details.join('\n') || 'No advisories reported by the queried service.'}\n\nRead [the dependency policy](../dependencies.md) for verification and upgrade scope.\nThe structured report is in [dependency-audit.json](dependency-audit.json).\n`);
const high = reports.some(r => r.counts && (r.counts.high || r.counts.critical));
console.log(`Wrote advisory reports; ${failed ? 'queries failed' : high ? 'high/critical findings remain' : 'no high/critical findings reported'}.`);
process.exitCode = failed || high ? 1 : 0;
