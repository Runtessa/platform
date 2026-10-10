# Developer preview validation — 2026-10-10

This records the preparation checks on the maintainer's Linux x86-64 host. It is
not a production certification or an end-to-end claim for every supported host.

| Check | Observed result |
| --- | --- |
| Locked installation | Root workspace installed with `npm ci`; all nine install roots accepted their locks |
| Builds | Shared/Core, IDE, Auth server/web, Kernel, VS Code types and Docusaurus passed |
| Core regressions | Six suites passed, including authenticated draft access and registry authentication |
| IDE authorization | 73 checks passed |
| Sensitive logging | 18 checks passed |
| Private configuration initialization | Five checks passed; eight existing private files remained byte-for-byte unchanged |
| Platform migrations | 17 checks passed against disposable PostgreSQL 17 |
| Restricted live runtime | 16 checks passed on the host and in Node 22.23.3 |
| Native ORM and SQL | Disposable PostgreSQL migration, live class/CRUD and read-only permission checks passed |
| Fresh installation smoke | Three database initialization, Core/IDE baselines, actual Core HTTP, published/draft isolation and edits without restart passed |
| Infrastructure TLS | Four checks passed for real trusted HTTPS, certificate expiry/reuse, private-key permissions and required-TLS refusal |
| Core image | Production dependency installation, Kernel artifacts, notices, migration CLI, actual HTTP ingress/live execution and live TypeScript compilation checked with Node 22.23.3 |
| Redis 8.8 | Actual locked ioredis connection, TTL cache and pub/sub passed in a disposable container |
| Documentation | Production build and strict broken-link validation passed at `/Idp/`; desktop, 390px mobile layout, navigation and browser errors checked |
| Publishable secrets | Gitleaks 8.30.1 found no leaks in publishable files or the `main` history; private recovery references were excluded |

The Node 22 runtime container used the repository's seccomp policy, no capabilities
and no-new-privileges. Fedora's default SELinux container label denied bubblewrap's
nested devpts mount. Only the disposable test container's label isolation was
disabled for the compatibility check; the Compose security settings were not
relaxed. Validate the target deployment's host policy separately.

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
