---
title: The live application platform
description: Authoring, runtime boundaries and deployment for IdpCore
slug: /
---

IdpCore is a self-hosted TypeScript platform for tenant-specific backend modules,
database model classes and React interfaces. Edit in the IDE, preview a draft,
publish a revision, and run the selected code without restarting the platform.

Start with [Getting started](getting-started.md), then explore architecture and
the route inventory. The source is licensed under
[Apache-2.0](https://github.com/AlirezaDadrass/Idp/blob/main/LICENSE).

## Developer preview

This project exposes a working foundation with regression tests and explicit limits.
It does not claim a hardened public SaaS or full OIDC conformance. Review the
[security policy](security.md) and [runtime boundary](operations/runtime.md).

## Find the right guide

| Task | Guide |
| --- | --- |
| Install locally | [Getting started](getting-started.md) |
| Understand service ownership | [Architecture](architecture/overview.md) |
| Prepare or upgrade platform tables | [Migrations](operations/migrations.md) |
| Assess live execution | [Runtime boundary](operations/runtime.md) |
| Find implemented routes | [Route inventory](reference/routes.md) |
| Change the platform | [Contributing](contributing.md) |
| Prepare a public release | [Release runbook](project/release.md) |

Generated routes are an inventory, not a complete validated API contract. Read the
handler source for permissions, request fields and error behavior.
