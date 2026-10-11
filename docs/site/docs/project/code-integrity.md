---
title: Code integrity and duplication
---

<!-- Generated from docs/release/code-integrity-audit.md; edit the source guide. -->

# Code integrity and duplication audit — 2026-10-11

## Assessment

The repository has a credible developer-preview foundation: separate authoring,
execution and browser-loading responsibilities; explicit platform migrations;
server-side tenant checks; and a restricted live execution boundary with real
PostgreSQL and HTTP regression coverage. Its strongest behavior—changing published
code without restarting Core—remains verified.

It is not yet a uniformly modular or production-certified codebase. Large editor,
Kernel and orchestration modules, duplicated validation and incomplete interactive
workflow coverage remain visible engineering debt. Publishing it as an Apache-2.0
**developer preview**, with this evidence and a maintained backlog, is defensible.
Claiming complete production readiness would not be supported by these checks.

No new execution service was introduced. Runtime, authoring, database schemas and
public response field names were preserved in this refactor.

## Scope and method

The initial scan inspected **787 Git-tracked JS/TS files, 102,948 lines**, excluding
vendored browser libraries. It found **24 groups of exact function-body matches**.
The current reproducible [source snapshot](https://github.com/Runtessa/platform/blob/main/docs/release/source-audit.json) includes new tests and
helpers: **801 files, 103,480 lines, zero syntax diagnostics**, and **18 remaining
groups** (16 executable-code candidates and two design-reference groups).

The scanner ignores comments/whitespace, but preserves identifiers and literals;
its threshold is 80 tokens and 10 body lines. It does not identify every short,
renamed or semantically similar implementation. Matches were read in context
before classification. A syntax scan is not a type check or a correctness proof.
The relevant compiler, route and runtime checks are recorded separately below.

Graph orientation was cross-checked against source and path coverage. Generated
architecture/reference inventories are navigation aids, not evidence that every
service communicates over HTTP. See the corrected
[dependency graph](/docs/architecture/dependency-graph) for actual transports.

Reproduce the inventory after installing the root lock:

```sh
npm run quality:source
npm run quality:source -- --output docs/release/source-audit.json
```

Stable review IDs and body hashes are stored in
[duplicate-review.json](https://github.com/Runtessa/platform/blob/main/scripts/quality/duplicate-review.json). Remaining
candidates carry matching comments in source. The command fails for syntax errors
or reintroduced exact copies of the six consolidated groups. Other candidates are
reported for review; their presence is not hidden behind an arbitrary zero-duplicate
threshold. Locations in this dated report may move; regenerate the snapshot.

## Consolidated duplication

| ID | Original copies | Shared implementation | Preserved behavior |
| --- | ---: | --- | --- |
| D01 | 4 | [Tenant UI DTO](https://github.com/Runtessa/studio/blob/main/src/lib/api/tenant-artifact-dto.ts) | Draft/published fields, omitted null publication fields, generated Tailwind dependency filtering |
| D02 | 3 | [Shared UI DTO](https://github.com/Runtessa/studio/blob/main/src/lib/api/shared-artifact-dto.ts) | Team ownership/editor access and UI-specific dependency filtering |
| D03 | 4 | [Tenant module DTO](https://github.com/Runtessa/studio/blob/main/src/lib/api/tenant-artifact-dto.ts) | Draft and published route/method/code remain distinct |
| D04 | 3 | [Shared backend DTO](https://github.com/Runtessa/studio/blob/main/src/lib/api/shared-artifact-dto.ts) | Access flags and backend dependency values, distinct from UI |
| D05 | 2 | [NPM request parser](https://github.com/Runtessa/packages/blob/main/shared/src/runtime/npm-specifier.ts) | Scoped/subpath imports, React Router alias and invalid input rejection in both Core and IDE |
| D14 | 2 | [CSS module source](https://github.com/Runtessa/studio/blob/main/src/lib/shared-build/css-module-source.ts) | Server/browser execution and existing editor/compiler exports via re-export shims |

At extraction, all **18 original implementation bodies** were compared with the
helper bodies and matched exactly after token normalization. The CSS helper was
subsequently corrected for the independently reproduced selector bug below. Six implementations now own
those contracts; 12 extra copies were removed. The four consolidation modules are
small and focused. The NPM parser and CSS generator have no application imports;
DTO helpers depend on existing domain/access utilities, not API routes.

## Remaining marked candidates

P1 means address in the next focused maintenance batch because behavior can drift
across mutation paths. P2 is routine consolidation after contract tests. P3 is
reference material. These labels are maintenance priorities, not asserted exploits.

| ID | Priority | Candidate and source locations | Decision / required regression coverage |
| --- | --- | --- | --- |
| D06 | P1 | [src/ideNew/src/pages/api/admin/tenants.ts:57](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/tenants.ts#L57)<br/>[src/ideNew/src/pages/api/admin/tenants/[id].ts:215](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/tenants/[id].ts#L215) | Share create/update validation only after covering fallback values, shared/dedicated modes and rejected secrets. |
| D07 | P1 | [src/ideNew/src/lib/assistant/toolOperations.ts:275](https://github.com/Runtessa/studio/blob/main/src/lib/assistant/toolOperations.ts#L275)<br/>[src/ideNew/src/lib/assistant/toolRollback.ts:87](https://github.com/Runtessa/studio/blob/main/src/lib/assistant/toolRollback.ts#L87) | Unify rebuild orchestration after covering compile/save ordering and Tailwind rebuild on edit and rollback. |
| D08 | P2 | [src/ideNew/src/pages/api/admin/teams/[id].ts:85](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/teams/[id].ts#L85)<br/>[src/ideNew/src/pages/api/admin/teams/[id]/members/[memberId].ts:33](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/teams/[id]/members/[memberId].ts#L33)<br/>[src/ideNew/src/pages/api/admin/teams/[id]/members/index.ts:38](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/teams/[id]/members/index.ts#L38) | Extract team-member response DTO; preserve multi-role and legacy single-role fallbacks. |
| D09 | P3 | [src/auth/docs/new_admin.tsx:723](https://github.com/Runtessa/auth/blob/main/docs/new_admin.tsx#L723)<br/>[src/auth/docs/new_design.tsx:870](https://github.com/Runtessa/auth/blob/main/docs/new_design.tsx#L870) | Reference-only Auth design prototypes; separate or archive after maintainer review, rather than treating them as shipped UI. |
| D10 | P1 | [src/ideNew/src/pages/api/admin/tenants.ts:155](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/tenants.ts#L155)<br/>[src/ideNew/src/pages/api/admin/tenants/[id].ts:296](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/tenants/[id].ts#L296) | Share adapter-config parsing; preserve the current JSON/object errors and explicitly decide array acceptance. |
| D11 | P2 | [src/core/app/controllers/RegistryController.ts:65](https://github.com/Runtessa/runtime/blob/main/app/controllers/RegistryController.ts#L65)<br/>[src/core/app/controllers/RegistryController.ts:186](https://github.com/Runtessa/runtime/blob/main/app/controllers/RegistryController.ts#L186) | Extract tenant package lookup inside Core; preserve aliases, latest/exact selection and caller authentication. |
| D12 | P1 | [src/ideNew/src/pages/api/admin/tenants.ts:90](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/tenants.ts#L90)<br/>[src/ideNew/src/pages/api/admin/tenants/[id].ts:248](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/tenants/[id].ts#L248) | Share branding validation; preserve missing fields and create/update fallback behavior. |
| D13 | P2 | [src/container-agent/lib/orchestrator-handlers-containers.js:41](https://github.com/Runtessa/container-agent/blob/main/lib/orchestrator-handlers-containers.js#L41)<br/>[src/container-agent/lib/routes-containers-read.js:33](https://github.com/Runtessa/container-agent/blob/main/lib/routes-containers-read.js#L33) | Route and orchestrator repeat container filtering. New transport-parity tests establish a baseline before extraction. |
| D15 | P1 | [src/ideNew/src/pages/api/modules/[id].ts:55](https://github.com/Runtessa/studio/blob/main/src/pages/api/modules/[id].ts#L55)<br/>[src/ideNew/src/pages/api/modules/index.ts:53](https://github.com/Runtessa/studio/blob/main/src/pages/api/modules/index.ts#L53) | Share ACL initialization; preserve existing policies and deny-by-default new endpoint entries. |
| D16 | P3 | [src/auth/docs/new_admin.tsx:189](https://github.com/Runtessa/auth/blob/main/docs/new_admin.tsx#L189)<br/>[src/auth/docs/new_design.tsx:195](https://github.com/Runtessa/auth/blob/main/docs/new_design.tsx#L195) | Reference-only setting-row prototypes; no runtime imports were found. |
| D17 | P1 | [src/ideNew/src/lib/assistant/toolOperations.ts:442](https://github.com/Runtessa/studio/blob/main/src/lib/assistant/toolOperations.ts#L442)<br/>[src/ideNew/src/lib/assistant/toolRollback.ts:33](https://github.com/Runtessa/studio/blob/main/src/lib/assistant/toolRollback.ts#L33) | Unify Tailwind cleanup only with tenant/version isolation and rollback restoration tests. |
| D18 | P2 | [src/ideNew/src/pages/api/admin/shared-modules/[id]/files/[fileId].ts:32](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/shared-modules/[id]/files/[fileId].ts#L32)<br/>[src/ideNew/src/pages/api/admin/shared-modules/[id]/files/index.ts:31](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/shared-modules/[id]/files/index.ts#L31) | Share backend-file normalization inside its domain; TS/TSX currently map to JS. |
| D19 | P2 | [src/ideNew/src/pages/api/admin/shared-packages/[id]/files/[fileId].ts:37](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/shared-packages/[id]/files/[fileId].ts#L37)<br/>[src/ideNew/src/pages/api/admin/shared-packages/[id]/files/index.ts:37](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/shared-packages/[id]/files/index.ts#L37) | Share UI-file normalization inside its domain; TS/TSX currently map to JSX. Do not reuse D18 unchanged. |
| D20 | P1 | [src/ideNew/src/pages/api/admin/tenants.ts:30](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/tenants.ts#L30)<br/>[src/ideNew/src/pages/api/admin/tenants/[id].ts:188](https://github.com/Runtessa/studio/blob/main/src/pages/api/admin/tenants/[id].ts#L188) | Share tenant resource validation; test bounds and create/update defaults first. |
| D21 | P2 | [src/ideNew/src/lib/assistant/gateway-runtime/container-agent-client.ts:33](https://github.com/Runtessa/studio/blob/main/src/lib/assistant/gateway-runtime/container-agent-client.ts#L33)<br/>[src/ideNew/src/lib/container-manager-client.ts:43](https://github.com/Runtessa/studio/blob/main/src/lib/container-manager-client.ts#L43) | Retain separate clients for now: only the response-buffer callback matches, while TLS, timeouts and errors differ. |
| D22 | P2 | [src/ideNew/src/pages/api/modules/[id].ts:13](https://github.com/Runtessa/studio/blob/main/src/pages/api/modules/[id].ts#L13)<br/>[src/ideNew/src/pages/api/modules/index.ts:11](https://github.com/Runtessa/studio/blob/main/src/pages/api/modules/index.ts#L11) | Share HTTP-method validation across module create/update; preserve current accepted casing and invalid-value errors. |
| D23 | P2 | [src/ideNew/src/pages/api/models/[id].ts:39](https://github.com/Runtessa/studio/blob/main/src/pages/api/models/[id].ts#L39)<br/>[src/ideNew/src/pages/api/models/index.ts:40](https://github.com/Runtessa/studio/blob/main/src/pages/api/models/index.ts#L40) | Share model-file validation within the model domain; it rejects non-JS files, unlike D18/D19. |
| D24 | P2 | [src/ide-vscode/src/preview.ts:41](https://github.com/Runtessa/vscode/blob/main/src/preview.ts#L41)<br/>[src/ideNew/src/pages/editor.tsx:150](https://github.com/Runtessa/studio/blob/main/src/pages/editor.tsx#L150) | Retain across browser/extension build boundaries until a browser-safe shared utility is designed; preserve route/query/hash behavior. |

## Functional issues found and fixed

- **Gateway working-directory containment:** string-prefix matching accepted a
  sibling such as `workspace-other`. An in-root symlink could also point outside
  the configured root. Validation now checks path boundaries and resolves existing
  ancestors, including the ancestor of a not-yet-created path. The new rejection
  tests failed before the correction and pass afterward. Root, nested and internal
  symlink paths remain usable. This is directory validation, not an OS sandbox or
  protection against a concurrent filesystem rename.
- **VS Code shared preview:** looking up a shared project folder or new file could
  pass an undefined manifest entry into the preview resolver. The actual extension
  host exposed the crash. Missing entries now proceed to project lookup or return
  no target. Direct UI targets and shared-folder previews remain tested.
- **Browser CSS injection:** the shared CSS generator produced an unquoted attribute
  selector containing a colon and a file path. A native browser query reproduced
  `SyntaxError`, including for ordinary paths. The generator now selects style
  elements by a valid static selector and compares their attribute value directly.
  Tests cover server execution, quoted/Unicode content, distinct files and updates
  that reuse the existing style. A native browser fixture generated from the actual
  helper also passed: two distinct style elements, in-place update, quoted/Unicode
  file path and Unicode CSS content, with no console errors. Existing exports remain compatible.
- **History scan scope:** scanning every local ref also included private recovery
  history, which is not sent by a normal branch/tag push. The scanner now explicitly
  checks detached `HEAD` plus every branch, remote-tracking branch and tag and their
  full ancestry. A disposable Git fixture confirms detector input is rejected in
  each publication category. Private recovery refs remain local; credential
  revocation is still required before publication.
- **False successful extension test run:** a local CLI wrapper could exit zero
  without executing the suite. The runner now uses the actual installed application
  when available, creates an isolated profile and verifies a result written by the
  completed suite. Command registration tests explicitly activate the extension
  before querying commands. Twelve host tests executed successfully.

## Architecture and maintainability backlog

| Area | Observed debt | Next bounded change |
| --- | --- | --- |
| Browser editor | `src/ideNew/src/pages/editor.tsx`: 2,607 lines combining state, preview and editor UI | Extract preview/session coordination and workspace state behind existing hooks; preserve desktop/mobile workflows |
| Kernel | `src/kernel/src/index.ts`: 1,295 lines | Separate package loading, routing and browser environment initialization; add browser-level import/cache regression coverage first |
| Tenant administration | Update route is 633 lines; D06/D10/D12/D20 repeat create-route validation | One tenant-config module, with fallback/error tests before moving provisioning or DB effects |
| Core registry | Controller is 593 lines and repeats D11 lookup | Extract package lookup separately from HTTP/auth/cache dispatch |
| Assistant edit/rollback | D07/D17 repeat rebuild/cleanup; agent session module is 617 lines | Share rebuild/cleanup with tests for failed compilation and restoration ordering |
| Monitoring | `MonitoringService.ts`: 658 lines | Separate sampling, rule evaluation and publication; preserve event/retention contracts |
| Auth UI | Profile and admin shell remain large; two files under `src/auth/docs` are design references | Refactor shipped components separately from archiving design references |
| Type precision | Strict TypeScript is configured, but boundary casts and dictionary lookups still need review | Improve types when touching those boundaries; adopt unchecked-index checks incrementally rather than suppressing errors |

Long translation dictionaries are data, not automatically god modules. Similar
backend/UI normalizers and transport clients must not be merged merely because
their shape looks similar: defaults, accepted extensions and error handling differ.
There is no repository-wide lint script; this audit uses syntax checks, strict
compiler checks, reviewed diffs and behavioral tests instead of claiming a lint pass.

## Verification evidence

All tests below use synthetic data or isolated temporary resources. Agent tests
inject a container-engine adapter and never mutate deployment containers.

| Area | Current evidence | Limit |
| --- | --- | --- |
| Shared/Core | Shared/Core builds and all six existing Core suites passed; shared NPM parser contracts passed | Does not benchmark registry traffic |
| IDE | Production build/type check; **87 tests** passed (73 existing + 14 new DTO/publication/rollback/CSS checks) | Route lifecycle fixtures mock repositories and compiler side effects; they are not a full Next.js browser session |
| Auth | Server/web builds; **six OAuth HTTP scenarios** against real disposable PostgreSQL, including signed session, PKCE, tenant/org scope, one-use concurrent exchange and revocation | Does not exercise login UI, external SMS, MFA enrollment or a remote tenant-policy server |
| Gateway | **Four checks** passed, including actual HTTP JSON/SSE execution and path rejection | CLI is a synthetic executable; no provider account or paid request used |
| Container Agent | **Five checks** passed: HTTP/orchestrator list parity, token enforcement, unmanaged-action denial, safe creation options and name conflict | Docker/Podman operations are mocked; full lifecycle/network/self-update is not covered |
| Monitoring | **Four HTTP/Redis scenarios** passed: auth/validation, ingestion dedup/filtering, actual pub/sub and rule CRUD | No real alert webhook delivery or load test |
| VS Code | **12 tests actually ran** in an isolated extension host; build/type checks passed | Browser sign-in callback and a full connected authoring session remain outside this suite |
| Kernel | TypeScript and production bundle passed | Three existing bundle-size warnings remain; no automated browser package-loading suite |
| Runtime/database | 16 restricted-runtime checks, 17 migration checks, real PostgreSQL ORM/SQL integration and fresh-install Core HTTP/live edits passed | Target deployment host policies and upgrade/restore rehearsal remain separate |
| Other guards | 18 logging, five env-init, four TLS and the history-scope regression passed; publishable source/history secret scans clean | A clean scan does not revoke previously exposed credentials |

The actual Core image built and its packaged migration ran. The default Fedora
SELinux container label prevented the packaged restricted runtime from serving the
HTTP fixture; the explicit disposable-container diagnostic run is recorded in the
[validation record](/docs/project/validation). Production security settings were not relaxed.

New contracts are wired into the repository verification workflow, including Auth,
Monitoring and the actual VS Code host. Node 22.23.3 was checksum-verified from the official distribution and used for the
129 combined contract/security/logging checks and all 16 restricted-runtime tests.
The host default Node 24 was used for initial baseline checks; the supported Node
22 line was checked separately. Remote CI results are separate from this local record.

## Release decision

For source publication, retain the developer-preview description, Apache-2.0
license/notices, marked debt and explicit coverage limits. Follow the
[release runbook](/docs/project/release): previous credential revocation, high dependency
findings and GitHub Pages activation remain separate gates. No code review or test
suite here establishes that every possible project workflow is regression-free.

Before a production offering, prioritize full IDE → Auth → Core browser workflows,
model migration/rollback failure recovery, least-privilege data access, restore
rehearsal, and measured load/latency. The current audit supports incremental cleanup
with regression evidence; it does not justify a broad untested rewrite.
