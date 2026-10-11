---
title: Repository ownership and history
---

<!-- Generated from docs/project/repositories.md; edit the source guide. -->

# Runtessa repository ownership and history

`platform` is the integration workspace and the original repository transferred to
Runtessa. Its existing commits, pull requests and branch histories remain intact.
All repositories are private during preparation; publication is a separate decision.

| Repository | Workspace path | Responsibility | Imported subtree commits |
| --- | --- | --- | --- |
| [runtime](https://github.com/Runtessa/runtime) | `src/core` | Live tenant backend runtime | 60 |
| [studio](https://github.com/Runtessa/studio) | `src/ideNew` | Browser development studio | 72 |
| [kernel](https://github.com/Runtessa/kernel) | `src/kernel` | React application browser kernel | 17 |
| [packages](https://github.com/Runtessa/packages) | `src/packages` | Shared entities, migrations and runtime contracts | 136 |
| [auth](https://github.com/Runtessa/auth) | `src/auth` | Identity, OAuth and SSO | 33 |
| [assistant-gateway](https://github.com/Runtessa/assistant-gateway) | `src/codex-gateway` | Optional Codex CLI gateway | 11 |
| [container-agent](https://github.com/Runtessa/container-agent) | `src/container-agent` | Optional container operations agent | 12 |
| [monitoring](https://github.com/Runtessa/monitoring) | `src/monitoring` | Optional monitoring and alerts | 9 |
| [vscode](https://github.com/Runtessa/vscode) | `src/ide-vscode` | VS Code tenant workspace extension | 4 |

## History preservation

The source snapshot is `c25521a53a10b9f255bbfa5c05607fbde1330d69`.
Components were extracted with Git subtree split without squash. Their imported
root trees match the source subtree objects exactly, before additive ownership,
license and contribution metadata. Authors, dates and relevant commit messages
remain in component history; subtree extraction gives commits new IDs.
The original commit IDs and complete cross-component history remain in `platform`.
The [migration manifest](https://github.com/Runtessa/platform/blob/main/docs/project/repository-migration.json) records both histories and
source tree IDs. Original remote branch and tag refs were compared after transfer. Dependabot
subsequently rebased its patch/minor branch automatically; the pre-transfer head
is retained under `migration/pre-runtessa/dependabot-patch-and-minor-aa91ca859c`.
Private recovery refs and backups stay outside the published repositories.

## Reproduce the tested workspace

```sh
git clone --recurse-submodules https://github.com/Runtessa/platform.git
cd platform
git submodule update --init --recursive
npm ci
```

Each gitlink pins a reviewed component commit. Do not use `git submodule update
--remote` as an installation step. Components retain their original paths because
npm workspaces, shared contracts, build scripts and Docker contexts use them.
Separate repositories do not add services or change deployment topology.
The IDE's existing theme and editor palettes remain unchanged.

For an existing checkout, fetch the platform changes, then initialize submodules.
If local component edits exist, save them on component branches before switching
integration revisions. Commit a component change in its own repository first;
update and review its platform gitlink afterward.

## Private CI access

Integration jobs use nine dedicated read-only deploy keys stored in the platform
Actions and Dependabot secret `RUNTESSA_COMPONENT_KEYS`. No personal token is committed or copied
into images. The checkout action resolves the pinned components; quality and
secret scans explicitly traverse every initialized repository and fail if a
component is missing. The history scanner also covers future component commits.
Public clones can resolve HTTPS submodules without that secret after publication.
GitHub Pages deployment remains gated off while the platform repository is private.

## Migration validation (2026-10-11)

All nine imported source trees matched their original Git subtree IDs. Only
license, contribution and ownership metadata were added to component heads.
The working checkouts and uploaded heads matched the integration manifest.

The assembled workspace passed root/Core builds, IDE type checking, all six Core
regression suites, contract/IDE authorization/logging checks, 17 schema migration
tests, 16 restricted execution tests, live PostgreSQL ORM/SQL checks and a fresh
installation with actual HTTP live edits. Auth OAuth/PKCE, Redis Monitoring and
TLS contracts passed. Kernel and documentation production builds passed. All 12 VS Code extension
tests passed in an isolated actual host.
Recursive file/history scanning passed with Gitleaks 8.30.1 and fully redacted
output. The source audit covered 803 JavaScript/TypeScript files without syntax
errors or reintroduced duplicate groups. This record verifies the migration;
it does not claim production load or full public-release approval.

## Dependency ownership

Dependabot npm updates target each component's own root manifest. The platform
configuration owns documentation and GitHub Actions, because Dependabot cannot
traverse the private component gitlinks as a workspace checkout. For every
component dependency update, refresh the authoritative integration lock with
`npm install --package-lock-only --ignore-scripts` from the assembled workspace,
review the lock diff and commit it alongside the updated gitlink. Reconcile any
standalone packaging lock as described in the dependency policy. Run locked
installation, component checks and the integration pipeline before merging.
Shared packages remain private workspace dependencies; this migration does not
publish npm packages.

The complete five-job GitHub integration run passed for the migration commit,
including the actual production container test on Ubuntu, and a fresh recursive
GitHub clone installed its locked workspace successfully. On this Fedora host,
the default disposable container fixture failed at HTTP startup; its separate
SELinux diagnostic is not a deployment fallback.
