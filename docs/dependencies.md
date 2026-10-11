# Dependency policy

Direct npm dependencies are pinned to exact versions. Commit the lockfile for every
install root; use `npm ci` for repeatable installs. The root lock owns Core, IDE,
shared and VS Code. Core/IDE standalone locks also support the existing image staging
layout. Auth, Kernel, monitoring, container-agent and docs have separate locks.

Use Node 22.13+ in the 22.x line for the supported application runtime and CI.
Dependency lifecycle scripts may download/build native components. CI source checks
install with `--ignore-scripts`; image/native builds use their appropriate packaging
path. Review dependency changes before enabling lifecycle scripts.

## Audit

```sh
npm run security:dependencies
```

This queries npm's advisory service for every independent install root and writes a
dated [report](release/dependency-audit.md) plus structured data. It includes development
dependencies because build tools and documentation generators execute on maintainer
machines and CI. A registry/network failure is an error, not a clean security result.
The report is a point-in-time snapshot; it is not proof that software is vulnerability-free.

For an individual root, run `npm audit --json` (or `npm audit --omit=dev --json` for
a runtime-only view). Assess actual use and severity before updating. Do not blindly
apply a major `audit fix --force` or hide advisories in an allowlist.

## Update process

1. Read the upstream advisory and supported Node/API requirements.
2. Prefer a supported patch/minor upgrade. Explain major upgrades and API adaptations.
3. Regenerate affected locks using npm; keep packaging locks aligned.
4. Run builds and affected behavior checks, including native adapters when changed.
5. Re-run the advisory and license reports. Document unresolved advisories and their
   exposure; do not advertise a zero-advisory result unless the scan confirms it.

Some transitive packages are pinned through npm overrides where a parent package's
range lags a patched release. These are compatibility decisions and require the same
tests as direct upgrades. Revisit them when upstream parent packages update.

Dependabot proposes npm and workflow updates weekly. Maintainers review them; no
automatic merge or deployment is configured.

Keep type definitions within the supported runtime/API contract: Kernel uses Node
22 types, and VS Code API types must match the minimum advertised extension host.
Major router upgrades must preserve a single context across Kernel's built-in
`react-router` and `react-router-dom` aliases. Tailwind and Mermaid layout upgrades
require compatible build plugins and visual verification, including the existing
IDE palette. Deferred major updates are recorded in the
[2026-10-11 PR review](release/dependency-pr-review-2026-10-11.md); compatible
patch/minor updates remain enabled.

## Current unresolved exposure

The committed snapshot has no critical findings, but still reports high and lower
severity advisories. High totals mostly propagate the `braces` advisory through
packages that depend on glob matching; they are not counts of separate upstream
bugs. Build-time glob inputs come from repository/configuration content. Keep builds
of untrusted contributions in disposable CI, and review any runtime use that could
accept attacker-selected patterns before internet exposure. This is an exposure
assessment, not proof that the dependency is safe.

`sprintf-js` remains in the SQL Server dependency chain. PostgreSQL integration
tests do not establish safety of every SQL Server formatting path. DOMPurify is
present in editor/assistant dependencies, and KaTeX in documentation dependencies;
keep untrusted rendered content within the application's existing authorization and
sanitization boundaries. AI provider utilities and Auth's development tooling also
have lower-severity findings recorded in the snapshot.

Do not suppress the audit's nonzero exit code. These findings remain tracked work
for the preview release and must be reassessed before a hosted production offering.
