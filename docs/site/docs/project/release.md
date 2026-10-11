---
title: Public release preparation
---

<!-- Generated from docs/release/README.md; edit the source guide. -->

# Public release preparation

The project is a developer preview. Publishing the source is separate from deploying
a production application. This runbook records the release checks and external actions
that cannot be proven by a local build.

See the [dated validation record](/docs/project/validation) for completed checks and their limits.
The [code integrity audit](/docs/project/code-integrity) records marked duplication,
completed consolidation and the remaining architecture/testing backlog.

## Repository gates

- [ ] Apply only intended changes; review tracked files and a clean worktree.
- [ ] Run source and publishable-history secret scans with Gitleaks 8.30.1.
- [ ] Audit all install roots and review the generated dependency report.
- [ ] Install from locks; build Core, IDE, Auth, Kernel and documentation.
- [ ] Run tenant authorization, logging, environment, migration and execution tests.
- [ ] Run source audit and shared/Gateway/Agent contracts, Auth OAuth, Monitoring
      Redis contracts and the actual VS Code extension host tests.
- [ ] Exercise a fresh disposable installation and document any host limitations.
- [ ] Run `npm run test:container` to check the actual Core image's migration CLI,
      HTTP ingress, live execution and runtime compiler under the outer seccomp policy.
- [ ] Preserve third-party notices; include Apache-2.0 LICENSE and project NOTICE.
- [ ] Verify GitHub Pages links/assets at `/platform/` on desktop and mobile.

Private original-history backups, reflogs and runtime `.env` files may still exist
on the maintainer's machine. They must never be pushed or uploaded with a release.
Scan the references intended for publication separately from private recovery refs.

## Previously exposed credentials

History cleanup is not credential revocation. Before making the repository public,
the installation owner must revoke/rotate the previously exposed provider keys,
database passwords, admin/internal tokens and signing secrets. This work requires
access to those providers/deployments and a verified recovery plan.

For encrypted stored data: back up, restore to staging, decrypt with the old key,
re-encrypt with the new key, validate reads and rollback, then schedule the live
change. Do not regenerate environment files over an existing installation.
Record completion privately; never attach the credentials or private backup to GitHub.

## GitHub settings and Pages

The Pages workflow builds Docusaurus with no application database and deploys only
its static `docs/site/build` output. No service environment files or runtime code
execution endpoint is published. PRs validate the site but cannot deploy it.

After the reviewed commit is on the default branch:

1. In repository **Settings → Pages**, choose **GitHub Actions** as the source.
2. Enable private vulnerability reporting under **Settings → Security** when available.
3. Require relevant CI checks in the default branch's ruleset before merging PRs.
4. Run the Pages workflow or push a documentation change; confirm its deployment URL.
5. Public visibility is a separate owner action after the credential gate above.

The configured project URL is `https://runtessa.github.io/platform/`. Forks can set
`DOCS_URL` and `DOCS_BASE_URL` for their owner/project or custom domain. A private
repository's Pages availability depends on the GitHub account plan; do not claim
the site is live until a successful Pages deployment is confirmed.

The private-repository activation was rejected on 2026-10-10 because the current
plan does not support Pages for this repository. The workflow validates the site
while private and deploys after it is public. If enabling a plan that supports
private Pages, review and remove its public-repository deployment condition.

## Container image publication

Publish a versioned GitHub Release from a verified `main` revision in `platform`
to build and push the six service images to GHCR. Releases resolve the exact
component commits pinned by that revision. Ordinary main pushes and manual build
runs validate Docker builds without pushing images. Registry visibility stays
private while the repository is private. See [container image releases](/docs/operations/container-images)
for prerequisites, package names, stable/prerelease tags and recovery steps.

## Production offering gates

Public source availability does not establish production readiness. Before an
internet-facing deployment, rehearse schema adoption/upgrade and backup restoration,
restrict service/adapter database privileges, configure TLS/origins, enforce network
and resource policy, and measure latency/load. See [SECURITY.md](/docs/security)
and [ROADMAP.md](/docs/project/roadmap).
