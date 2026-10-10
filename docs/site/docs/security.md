---
title: Security
---

<!-- Generated from SECURITY.md; edit the source guide. -->

# Security policy

## Supported scope

Security fixes currently target the default branch. There is no supported release
matrix or response-time SLA yet. IdpCore is a developer preview for controlled
installations; it is not a public untrusted-code hosting service.

## Report privately

Use [GitHub private vulnerability reporting](https://github.com/AlirezaDadrass/Idp/security/advisories/new)
when available. If that form is unavailable, contact the maintainer through the
[GitHub profile](https://github.com/AlirezaDadrass) to request a private channel
without posting exploit details. Do not put credentials or a working cross-tenant
exploit in a public issue. No dedicated security email is advertised.

Include the affected commit, installation/runtime versions, minimal reproduction,
impact, required permissions and any mitigation. Use synthetic data. The maintainer
will coordinate a fix and disclosure; do not test another installation without its
owner's authorization.

## Execution boundary

Live modules and tenant model classes execute in short-lived restricted processes
inside Core/IDE. The parent selects the tenant and draft/published stage, retains
platform keys, and grants limited RPC capabilities. The child cannot use a supplied
tenant identifier to select another tenant's resources. See the
[runtime design and tested limits](/docs/operations/runtime).

Known deployment boundaries:

- Linux namespaces, bubblewrap, seccomp and Node permissions must work. Unsupported
  startup fails closed; do not disable them to make a deployment run.
- Network access remains available. Egress/SSRF policy must be enforced by the
  installation; there is no built-in destination allowlist.
- V8 heap budgets do not cap native buffers, total RSS or temporary files. Configure
  container/cgroup budgets and monitor resource use.
- Adapter credentials must be tenant-scoped. An allowed connection with broad
  database privileges can still reach whatever those privileges permit.
- The optional container agent controls a container engine. Restrict its exposure,
  socket access and tokens independently from tenant code.

## Secrets and upgrades

Generate fresh private configuration using `npm run docker:init-env`. Keep backups
outside Git. Track only explicit environment examples. Fully redacted source and
history scans are included in CI.

If a real credential was committed, revoke/rotate it at its provider even after Git
cleanup. Rewriting history does not invalidate prior copies. Database and encryption
key rotation must preserve application data; do not replace an encryption key before
testing re-encryption and recovery on a restored staging copy.

Core/IDE platform migrations are explicit, transactional and checksum-checked.
Review migration plans, back up and rehearse before deployment. Auth has a separate
SQL migration runner. Tenant model schema actions have their own data risks.

Use locked dependencies, review [dependency advisories](/docs/project/dependencies), and
run the relevant isolation, authorization and migration checks before an upgrade.
