# IdpCore documentation

IdpCore combines a tenant application runtime with the tools for authoring its
backend, data models and React UI. Start with the platform tour, install a local
workspace, then follow an application from draft to published execution.

## Choose a path

| Goal | Reading path |
| --- | --- |
| Evaluate the platform | [Platform tour](platform/overview.md) → [Architecture map](site/docs/architecture/idpcore-map.md) → [Validation](release/validation.md) |
| Build a tenant application | [Installation](getting-started.md) → [First application](tutorials/first-application.md) → [Cookbook](platform-cookbook/README.md) |
| Understand publication | [Authoring lifecycle](platform/authoring.md) → [Backend](platform-cookbook/02-backend-modules.md) → [UI](platform-cookbook/04-ui-modules.md) |
| Develop outside the browser | [Tooling](platform/tooling.md) → [VS Code extension](../src/ide-vscode/README.md) |
| Operate an installation | [Runtime requirements](../docker/runtime/README.md) → [Migrations](../scripts/database/README.md) → [Docker](../docker/README.md) |
| Contribute to the platform | [Developer guide](developer-guide.md) → [Contributing](../CONTRIBUTING.md) |

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
[developer guide](developer-guide.md) and
[architecture map](site/docs/architecture/idpcore-map.md) explain where that
behavior belongs in the source.

The [route inventory](site/docs/reference/routes.md),
[service inventory](site/docs/reference/services.md) and
[OpenAPI inventory](site/docs/reference/openapi-spec.md) are generated from source.
They help locate endpoints, but do not certify request/response contracts or
end-to-end behavior. Mounted route prefixes and dynamic routes may need a direct
source read.

## Current maturity

This is a developer preview with targeted authorization, logging, isolation,
migration and installation checks. Read the [validation record](release/validation.md),
[dependency policy](dependencies.md), [security policy](../SECURITY.md) and
[roadmap](../ROADMAP.md) for the current limits.

The website's landing page is available in English and Persian. Technical guides
are currently English. The source Markdown remains usable directly on GitHub.
