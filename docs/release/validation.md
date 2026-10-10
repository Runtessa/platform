# Developer preview validation — 2026-10-11

This records preparation checks and the 2026-10-11 integrity follow-up on the
maintainer's Linux x86-64 host. It is
not a production certification or an end-to-end claim for every supported host.

| Check | Observed result |
| --- | --- |
| Locked installation | Root workspace installed with `npm ci`; all nine install roots accepted their locks |
| Builds | Shared/Core, IDE, Auth server/web, Kernel, VS Code types and Docusaurus passed |
| Core regressions | Six suites passed, including authenticated draft access and registry authentication |
| IDE authorization and artifact lifecycle | 87 checks passed, including DTO, publication, rollback and CSS contracts |
| Sensitive logging | 18 checks passed after extraction, using the real shared CSS generator in the compiler fixture |
| Private configuration initialization | Five checks passed; eight existing private files remained byte-for-byte unchanged |
| Platform migrations | 17 checks passed against disposable PostgreSQL 17 |
| Restricted live runtime | 16 checks passed on the host and in Node 22.23.3 |
| Native ORM and SQL | Disposable PostgreSQL migration, live class/CRUD and read-only permission checks passed |
| Fresh installation smoke | Three database initialization, Core/IDE baselines, actual Core HTTP, published/draft isolation and edits without restart passed |
| Infrastructure TLS | Four checks passed for real trusted HTTPS, certificate expiry/reuse, private-key permissions and required-TLS refusal |
| Core image | Production dependency installation, Kernel artifacts, notices, migration CLI, actual HTTP ingress/live execution and live TypeScript compilation checked with Node 22.23.3 |
| Redis 8.8 | Actual locked ioredis connection, TTL cache and pub/sub passed in a disposable container |
| Documentation | Production build and strict broken-link validation passed at `/Idp/`; desktop, 390px mobile layout, navigation and browser errors checked |
| Code integrity | 24 original exact-body groups reviewed; six consolidated and 18 marked; zero syntax errors in 801 source/test files |
| Auth OAuth | Six HTTP/PostgreSQL scenarios passed, including PKCE, tenant/org scope, concurrent one-use exchange and session/token revocation |
| Gateway / Agent | Nine checks passed for execution contracts, workspace containment, engine-adapter contracts and authorization |
| Monitoring contracts | Four HTTP/Redis scenarios passed, including actual pub/sub and rule CRUD |
| VS Code | 12 tests executed in an isolated host; runner verifies that the suite actually completed |
| History scanner scope | Disposable Git fixture verifies branches, remotes, tags and detached HEAD; private recovery refs excluded |
| Publishable secrets | Gitleaks 8.30.1 found no leaks in publishable files or the `main` history; private recovery references were excluded |

For the integrity follow-up, the official Node 22.23.3 archive was checksum-verified
and used locally for 129 combined contracts/security/logging checks and 16 restricted
runtime checks. Initial baseline builds used the host's Node 24.13.0; the supported
Node 22 line was also used for the final IDE/Auth web builds. See the
[code integrity audit](code-integrity-audit.md) for marked debt and per-suite limits.

The Node 22 runtime container used the repository's seccomp policy, no capabilities
and no-new-privileges. Fedora's default SELinux container label denied bubblewrap's
nested devpts mount. The default-label Core image HTTP smoke was reproduced as
failing in this follow-up.
The same check passed with the explicit `--selinux-diagnostic` fixture option. Only
the disposable test container's label isolation was disabled for that check; the
Compose security settings were not relaxed. Validate the target deployment's host
policy separately.

GitHub's moving Ubuntu runner rejected native restricted execution during the first
CI run. Native isolation checks are now pinned to Ubuntu 22.04 with an explicit
namespace preflight; host protections are not disabled. This is a temporary CI host:
[GitHub retires that runner on 2027-04-17](https://github.com/actions/runner-images/issues/14254).
Move these checks to a newer compatible runner with a reviewed application-specific
host policy before retirement; do not hide failures or add an in-process fallback.

The fresh installation smoke creates its own PostgreSQL containers and synthetic
configuration. It does not perform an interactive IDE → Auth SSO walkthrough or
prove the entire Compose deployment. IDE/Auth production images, upgrade/restore
rehearsals, arm64 and latency/load measurements remain separate validation work.

The [dependency snapshot](dependency-audit.md) still contains high and lower-severity
upstream findings, with no critical findings reported. The audit command deliberately
returns a failing status while high findings remain; see the scoped
[exposure assessment](../dependencies.md). No advisory allowlist hides them.

GitHub rejected Pages activation for the private repository with HTTP 422 because
the current account plan does not support it. The site is built locally; deployment
is not confirmed. Previously exposed credential revocation is also not established
by a source scan. Keep the repository private until the installation owner clears
that gate, then follow the [release runbook](README.md).
