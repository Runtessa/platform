import { execFileSync } from 'node:child_process';

export const imageNames = ['auth', 'runtime', 'studio', 'monitoring', 'container-agent', 'assistant-gateway'];
export const verificationJobs = ['ide-authorization', 'infrastructure-tls', 'auth-types', 'vscode-host', 'publishable-files'];

export function releaseVersion(event) {
  const release = event.release;
  if (event.action !== 'published' || !release || release.draft) {
    throw new Error('Only a published GitHub Release can publish images.');
  }
  const tag = release.tag_name;
  const number = '(?:0|[1-9][0-9]*)';
  const identifier = '(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)';
  const pattern = new RegExp(`^v${number}\\.${number}\\.${number}(?:-${identifier}(?:\\.${identifier})*)?$`);
  if (typeof tag !== 'string' || !pattern.test(tag) || tag.length > 128) {
    throw new Error('Use a release tag such as v0.1.0 or v0.1.0-rc.1 (no build metadata).');
  }
  if (tag.includes('-') && !release.prerelease) {
    throw new Error('A prerelease version must be marked as a GitHub prerelease.');
  }
  return tag.slice(1);
}

export function releaseCommit(tag, cwd = process.cwd()) {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const sha = git('rev-parse', '--verify', `refs/tags/${tag}^{commit}`);
  if (sha !== git('rev-parse', 'HEAD')) throw new Error('Checkout does not match the release tag.');
  try {
    git('merge-base', '--is-ancestor', sha, 'refs/remotes/origin/main');
  } catch {
    throw new Error('The release commit must be reachable from main.');
  }
  return sha;
}

export function verifiedRun(runs, sha) {
  const candidates = runs.filter(run => run.head_sha === sha && run.head_branch === 'main' && run.event === 'push');
  const latest = candidates.sort((a, b) => b.run_number - a.run_number)[0];
  if (!latest || latest.status !== 'completed' || latest.conclusion !== 'success') {
    throw new Error('Wait for Repository verification on this exact main commit to pass, then rerun Docker Images.');
  }
  return latest;
}

export function verifiedJobs(jobs) {
  for (const name of verificationJobs) {
    if (!jobs.some(job => job.name === name && job.conclusion === 'success')) {
      throw new Error(`Release requires a successful ${name} job; skipped jobs are not accepted.`);
    }
  }
}

export function packageAllowed(pkg, isPrivate) {
  if (isPrivate && pkg && pkg.visibility !== 'private') {
    throw new Error('Private source must not be pushed into a non-private package.');
  }
}
