# Roadmap

IdpCore is a developer preview. These are priorities, not promised delivery dates.
Live tenant code execution and the existing service topology remain design constraints.

## Established foundation

- Tenant/resource authorization checks in the IDE, with regression tests.
- Redacted platform error/log metadata.
- Restricted process execution preserving live modules and native model classes.
- Explicit versioned Core/IDE platform migrations with checksum, adoption, concurrency
  and rollback checks.
- Private per-installation configuration generation and source/history secret scans.

## Before a production offering

- Revoke previously exposed credentials and rehearse encryption-key/data recovery.
- Enforce installation network/SSRF policy and total CPU/memory/temp-file budgets.
- Rehearse a full new installation and upgrade on each supported host/container setup.
- Measure live invocation startup latency, throughput and saturation under load.
- Exercise backup restore, tenant lifecycle and SSO provisioning failure recovery.
- Resolve or document remaining dependency advisories with a scoped risk assessment.

## Contributor improvements

- Expand end-to-end IDE → preview → publish → invocation coverage.
- Reduce large editor/runtime modules while preserving APIs and existing UI patterns.
- Improve adapter role/grant validation and operational diagnostics.
- Provide realistic, credential-free sample applications and migration examples.
- Define release/version compatibility and support windows once releases stabilize.

Changes to the process boundary, tenant identifiers or SSO contracts should start with
a scoped design discussion and tests. OIDC conformance is not currently a project claim.
