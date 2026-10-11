# Runtessa repository ownership and history

`platform` is the integration workspace and the original repository transferred to
Runtessa. Its existing commits, pull requests and branch histories remain intact.
The integration repository and all nine components are public under Apache-2.0.
Source publication was authorized by the project owner on 2026-10-11.

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
The [migration manifest](repository-migration.json) records both histories and
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

## Branding and compatibility

Public product titles, command labels, contributor notices and documentation use
Runtessa. Component package metadata points to its owning Runtessa repository.
Original author attribution, license terms and Git history remain intact.

Existing installations retain technical identifiers: `@idp/*` workspace imports,
VS Code extension/command/settings IDs, database names, container labels and
storage keys. The architecture and OpenAPI URLs retain their original slugs so
existing documentation links and tooling remain valid. These compatibility
identifiers are not product names and must not be changed by a text replacement.

## Public access and protected main branches

Public clones resolve the pinned HTTPS submodules without credentials. Integration
checks and secret scans traverse every initialized component and fail if one is
missing. Source/history scanners do not treat private local recovery references
as publication targets.

All source repositories require pull requests for changes to `main`, including
administrator changes. Force pushes and branch deletion are disabled; review
conversations must be resolved. The platform additionally requires its five
integration verification jobs and documentation build to pass on the current base.
The minimum approving-review count is zero so a sole maintainer can merge a tested
pull request without pushing directly to `main`. Merge commits retain history.

Private vulnerability reporting, secret scanning and secret push protection are
available on every public source repository. See [the security policy](../../SECURITY.md).
GitHub Pages publishes the static documentation at
[https://runtessa.github.io/platform/](https://runtessa.github.io/platform/).

Before publication, private CI used nine read-only component deploy keys. Public
CI no longer needs those credentials. Shared npm packages remain workspace-only;
repository publication does not publish packages to npm.

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
configuration owns documentation and GitHub Actions, because each component
has its own authoritative manifest and dependency review. For every
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
