import { appendFileSync, readFileSync } from 'node:fs';
import { imageNames, packageAllowed, releaseCommit, releaseVersion, verifiedJobs, verifiedRun } from './image-release-policy.mjs';

const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const repository = process.env.GITHUB_REPOSITORY;
const owner = event.repository.owner.login.toLowerCase();
const headers = {
  Authorization: `Bearer ${process.env.GH_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function api(path, allowMissing = false) {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (allowMissing && response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub release check failed (${response.status}) for ${path}`);
  return response.json();
}

async function allPages(path, key) {
  const results = [];
  for (let page = 1; ; page++) {
    const value = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    results.push(...value[key]);
    if (value[key].length < 100) return results;
  }
}

const registryOnly = process.argv.includes('--registry-only');
let version, sha;
if (!registryOnly) {
  version = releaseVersion(event);
  sha = releaseCommit(event.release.tag_name);
  const runs = await allPages(`/repos/${repository}/actions/workflows/secret-scan.yml/runs?branch=main&event=push&head_sha=${sha}`, 'workflow_runs');
  const run = verifiedRun(runs, sha);
  const jobs = await allPages(`/repos/${repository}/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs`, 'jobs');
  verifiedJobs(jobs);
}

// New GHCR packages start private. Existing packages must already be private
// while the integration repository is private; do not mutate package visibility.
const account = event.repository.owner.type === 'Organization' ? 'orgs' : 'users';
for (const name of imageNames) {
  const pkg = await api(`/${account}/${owner}/packages/container/${name}`, true);
  packageAllowed(pkg, event.repository.private);
}
if (registryOnly) {
  console.log(`Checked six GHCR destinations under ${owner}; private-source visibility policy passed.`);
} else {
  const latest = event.release.prerelease ? null : await api(`/repos/${repository}/releases/latest`, true);
  const isLatest = latest?.tag_name === event.release.tag_name;
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\nsha=${sha}\nowner=${owner}\nlatest=${isLatest}\n`);
  console.log(`Release ${version}: verified main commit ${sha}; all five integration jobs passed.`);
}
