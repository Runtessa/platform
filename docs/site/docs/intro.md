---
title: Documentation
slug: /
---

<!-- Generated from docs/README.md; edit the source guide. -->

# Runtessa documentation

Runtessa combines a tenant application runtime with the tools for authoring its
backend, data models and React UI. Start with the platform tour, install a local
workspace, then follow an application from draft to published execution.

## Choose a path

| Goal | Reading path |
| --- | --- |
| Evaluate the platform | [Platform tour](/docs/platform/overview) → [Architecture map](https://github.com/Runtessa/platform/blob/main/docs/site/docs/architecture/idpcore-map.md) → [Validation](/docs/project/validation) |
| Build a tenant application | [Installation](/docs/getting-started) → [First application](/docs/tutorials/first-application) → [Cookbook](/docs/cookbook/overview) |
| Understand publication | [Authoring lifecycle](/docs/platform/authoring) → [Backend](/docs/cookbook/backend) → [UI](/docs/cookbook/ui) |
| Develop outside the browser | [Tooling](/docs/platform/tooling) → [VS Code extension](https://github.com/Runtessa/vscode/blob/main/README.md) |
| Operate an installation | [Runtime requirements](/docs/operations/runtime) → [Migrations](/docs/operations/migrations) → [Docker](https://github.com/Runtessa/platform/blob/main/docker/README.md) |
| Contribute to the platform | [Developer guide](/docs/platform/developer-guide) → [Contributing](/docs/contributing) |

## Concepts to understand first

- A **tenant** selects an application's hostname, runtime settings, access policy
  and adapter grants. It is not just an editor folder.
- A **module** is an HTTP handler. A **UI entity** is a browser package.
- **Models** are executable TypeORM classes. Their schema operations are separate
  from module/UI publication and from platform migrations.
- **Draft** is the authoring state. **Published** is the selected runtime artifact
  for module/UI traffic. A preview header is not authorization.
- **Kernel** runs in the browser and loads UI packages. It is not a deployment service.
- **Shared projects** contain reusable versioned backend or UI code.

## Guides and source references

The platform guides and cookbook explain how to work with the system. The
[developer guide](/docs/platform/developer-guide) and
[architecture map](https://github.com/Runtessa/platform/blob/main/docs/site/docs/architecture/idpcore-map.md) explain where that
behavior belongs in the source.
The [dependency graph](/docs/architecture/dependency-graph) distinguishes browser
requests, direct database access and optional infrastructure connections.

The [route inventory](https://github.com/Runtessa/platform/blob/main/docs/site/docs/reference/routes.md),
[service inventory](https://github.com/Runtessa/platform/blob/main/docs/site/docs/reference/services.md) and
[OpenAPI inventory](https://github.com/Runtessa/platform/blob/main/docs/site/docs/reference/openapi-spec.md) are generated from source.
They help locate endpoints, but do not certify request/response contracts or
end-to-end behavior. Mounted route prefixes and dynamic routes may need a direct
source read.

## Current maturity

This is a developer preview with targeted authorization, logging, isolation,
migration and installation checks. Read the [validation record](/docs/project/validation),
[code integrity and duplication audit](/docs/project/code-integrity),
[dependency policy](/docs/project/dependencies), [security policy](/docs/security) and
[roadmap](/docs/project/roadmap) for the current limits.

The website and technical guides are English-only. The source Markdown remains
usable directly on GitHub.
