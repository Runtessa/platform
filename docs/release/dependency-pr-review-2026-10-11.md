# Dependency pull request review — 2026-10-11

The review covers the 26 dependency pull requests open across Runtessa at the start
of this maintenance batch, plus seven proposals opened automatically after earlier
proposals merged. Of these 33 proposals, 22 are integrated and 11 are deferred.
Changes are assembled and tested together before merge.
Original proposal commits are retained through merge commits, including when
overlapping lockfile edits require npm to regenerate a consistent lock.

## Accepted updates

| Repository | Proposals | Compatibility work |
| --- | --- | --- |
| platform | #3, #4, #5, #6, #7, #8, #15 | SHA-pinned workflow actions; Node 22 remains the application runtime; docs TypeScript 7. |
| auth | #1, #2, #3, #4 | Production web/server build and PostgreSQL OAuth checks; Tailwind 3 retained. |
| monitoring | #1, #2 | Express 5, ioredis 6; explicit RESP2 keeps the previous Redis wire protocol. |
| container-agent | #1, #2 | Express 5, ioredis 6; explicit RESP2; real Redis request/reply and heartbeat regression test. |
| kernel | #1, #2, #4, #8, #9 | TypeScript 7 uses bundler resolution; browser bundle builds; Node types aligned to Node 22; follow-up Express 5 and Node 22 type patch verified. |
| vscode | #3, #4 | TypeScript 7 uses Node16 resolution; dynamic imports include `.js`; API types and test tooling aligned to the advertised VS Code 1.90 minimum. |

Component changes are pinned in the platform integration lock and gitlinks.
Standalone locks are regenerated using npm, without running dependency lifecycle
scripts during source verification. Build/image jobs use their normal packaging path.

## Deferred incompatible proposals

These proposals are closed rather than merged. Their pull requests and evidence
remain available. Dependabot still proposes compatible patch/minor updates.

| Proposal | Evidence and reason | Requirement before reconsidering |
| --- | --- | --- |
| [platform #14](https://github.com/Runtessa/platform/pull/14) | Docusaurus theme-mermaid 3.10.2 declares optional peer `@mermaid-js/layout-elk: ^0.1.9`; proposed 1.0.1 is outside that contract. The original docs check failed. | A compatible Docusaurus release and diagram rendering checks, including layout changes. |
| [auth #5](https://github.com/Runtessa/auth/pull/5) | Production build fails: Tailwind 4 cannot be used directly as the existing PostCSS plugin. | A coordinated PostCSS/CSS migration and visual checks that preserve the current UI palette and behavior. |
| [kernel #5](https://github.com/Runtessa/kernel/pull/5) | Upgrading only react-router to 8.4.0 leaves react-router-dom 7.18.4 loading its own v7 router. The two `UNSAFE_NavigationContext` objects differ; Kernel exposes both packages. | A coordinated router migration preserving built-in package aliases and a single context for tenant components. |
| [kernel #3](https://github.com/Runtessa/kernel/pull/3) | Node 26 types exceed the supported Node 22 runtime. Types are instead aligned to the existing Node 22 contract. | An explicit runtime support change and runtime verification. |
| [vscode #2](https://github.com/Runtessa/vscode/pull/2) | Node 26 types exceed the extension host compatibility contract. Existing Node 20 types are retained. | An explicit minimum host/runtime support change. |
| [vscode #1](https://github.com/Runtessa/vscode/pull/1) | VS Code 1.140 API types exceed the advertised `engines.vscode: ^1.90.0`. Types are instead pinned to 1.90.0. | An explicit minimum VS Code version change and host verification. |
| [auth #9](https://github.com/Runtessa/auth/pull/9) | TypeScript 7 reports TS5108 against the existing server compiler configuration: `moduleResolution=node10` is removed. | A coordinated Next/server compiler and decorator metadata migration, with full web/server verification. |
| [auth #10](https://github.com/Runtessa/auth/pull/10) | Node 26 types exceed the supported Node 22 Auth runtime. | An explicit runtime support change and runtime verification. |
| [auth #11](https://github.com/Runtessa/auth/pull/11) | Rate-limit v8 changes the default IPv6 key to a /56 subnet, while the existing v7 limiter budgets individual addresses. This changes authentication abuse-control behavior. | A dedicated policy migration covering IPv6 grouping, request budgets and HTTP 429 responses. |
| [auth #12](https://github.com/Runtessa/auth/pull/12) | The actual `app.all('*', ...)` Next fallback pattern throws `Missing parameter name` when registered against Express 5. | A coordinated custom server/router migration and production HTTP fallback checks. |
| [auth #13](https://github.com/Runtessa/auth/pull/13) | TypeORM 1.1.2 declares optional ioredis peer `^5.0.4`; proposed ioredis 6 is outside that contract. | An upstream-compatible ORM/cache-client combination and Auth Redis integration verification. |

## Verification

- Auth production web/server builds, type checking, and real OAuth flow against
  disposable PostgreSQL: tenant/organization/scope boundaries, PKCE, token revocation,
  signed sessions, and concurrent one-use authorization-code consumption.
- Kernel TypeScript and production Webpack builds. The incompatible mixed router
  proposal was inspected before retaining the coordinated v7 packages.
- VS Code compilation against the advertised API floor and 12 tests on both the
  actual VS Code 1.90 minimum host and the current installed host, using isolated
  profiles. CI runs both the minimum and stable host. Mocha 12 requires Node
  20.19+, which exceeds the older minimum host's runtime; Mocha 11.8.0 is retained
  with patched `serialize-javascript` and scoped `diff: 8.0.3` overrides. Its standalone
  advisory scan reports zero findings. This does not claim every host version was tested.
- Monitoring HTTP authorization, ingest deduplication, tenant filters, rule CRUD,
  and actual Redis publication; Agent handlers and certificate/TLS enforcement.
- Agent actual Redis heartbeat and correlated success/error replies, using the
  production worker and disposable Redis, with no connection to a production engine.
- Documentation production build, broken links/anchors, SHA-pinned workflow syntax,
  redacted secret scanning, refreshed advisory and dependency license reports.
- The platform integration pipeline also verifies IDE authorization, database
  migrations, live code isolation, installation, and the production runtime container.

Advisory counts are recorded separately in [dependency-audit.md](dependency-audit.md).
Successful functional tests do not establish that unresolved advisories are harmless.
