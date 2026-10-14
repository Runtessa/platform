---
title: Dependency policy
---

<!-- Generated from docs/dependencies.md; edit the source guide. -->

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
dated [report](https://github.com/Runtessa/platform/blob/main/docs/release/dependency-audit.md) plus structured data. It includes development
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
[2026-10-11 PR review](https://github.com/Runtessa/platform/blob/main/docs/release/dependency-pr-review-2026-10-11.md); compatible
patch/minor updates remain enabled.

## Current unresolved exposure

The snapshot retains nonzero advisory results. `braces` has no upstream patched
release; the shared dependency boundary rejects excessive string/AST nesting before
its parser executes. The guarded native launch/build commands preload that boundary.
The `sprintf-js` formatter similarly rejects excessive width/precision and input
size. Regular glob expansion and formatting have compatibility checks. These are
scoped mitigations, not claims that the upstream packages have become patched.

DOMPurify, KaTeX, modern AI provider utilities, SQL Server's tedious dependency and
test serializers are pinned to patched versions in the reviewed locks. The older
AI provider-utils v2 has no compatible patched release; its low-severity resource
advisory remains visible. Default production assistant execution uses the isolated
Codex gateway; alternate provider routes need their own production evaluation.

The guard uses the Node CommonJS module boundary. It does not cover a separately
bundled copy or an unguarded standalone command. Keep untrusted source builds in
isolated CI, use the provided guarded native scripts and retain the audit's
nonzero exit code. Reassess the upstream advisories before enabling arbitrary
public tenant registration or accepting new provider/dependency integrations.
