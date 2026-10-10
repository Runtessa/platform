---
title: Shared projects
---

<!-- Generated from docs/platform-cookbook/05-shared-projects.md; edit the source guide. -->

# Shared backend projects and UI packages

Shared projects are reusable, versioned assets managed through the Studio's shared
administration areas. They keep multi-file application code together, with an
entry file, compiled output, documentation and publication state.

## Choose the right kind of reuse

| Scope | Use |
| --- | --- |
| One tenant screen | Additional tenant UI entities/helpers |
| Several modules in one or more tenants | Shared backend project |
| Components/themes used across applications | Shared UI package |
| Platform service contracts | `src/packages/shared` in the platform repository |

The npm workspace `src/packages/shared` is the platform's entity/contract package.
It is not the same thing as a tenant-authored shared project in the Studio.

## A shared backend project

Create a project with a stable name and version, and choose its entry file, usually
`src/index.js`. Supporting source can include JavaScript, JSON and Markdown docs.
For example:

```text
src/index.js
src/validation.js
docs/README.md
docs/examples.md
```

A small entry export could be:

```js
function normalizeTitle(value) {
  const title = String(value ?? '').trim();
  if (!title) throw new Error('Title is required');
  return title;
}

module.exports = { normalizeTitle };
```

Save and publish the project before a published tenant module consumes it. Load
its exports through the injected shared adapter, using the exact configured name:

```js
module.exports = async function handler(req, adapters) {
  const shared = await adapters.shared.require('order-helpers', '1.0.0');
  const title = shared.normalizeTitle(req.body?.title);
  return { statusCode: 200, body: { title } };
};
```

This assumes a shared project named `order-helpers` at version `1.0.0` has been
published. Use the matching version in your installation. The example is a helper
contract, not a persisted order endpoint.

## Version selection

An explicit name/version asks for that package record. Omitting the version uses
`latest` resolution. Published execution needs published compiled output;
authenticated draft execution can select draft output according to its parent
request context.

Pin a version when a tenant feature requires a stable contract. Before changing a
shared package used by multiple applications, identify those callers and validate
their imports, arguments and return shapes. Publication does not migrate consumer
source or databases automatically.

## A shared UI package

Use a shared UI project for components, themes, helpers and styles. An executable
entry is usually `src/index.jsx`; supporting files can include JSX, JavaScript,
CSS, JSON and documentation.

```jsx
import React from 'react';

export function SectionHeading({ children }) {
  return <h2>{children}</h2>;
}
```

Give the project a stable package name/version, select its entry file, save and
publish it. Tenant UI imports should use the exact name registered for that package.
Check the compiled output and dependency metadata when a consumer fails to load.

A shared UI component is not the tenant application's `App` entry point. Keep
application composition in `@app/dashboard` and use the Kernel API client in the
consumer when it needs tenant data.

## Access and release behavior

Shared editing/publication respects team/project ownership and resource permissions.
Keep data access within the calling tenant's granted context. A reusable package
must not embed installation credentials or assume all tenants share a database.

Before publication:

1. Review the entry point and exported interface.
2. Save supporting files and inspect compilation/dependencies.
3. Test a tenant consumer in the intended stage.
4. Publish the package and verify published consumers.
5. Document breaking changes and coordinate any consumer update.

Source history does not restore external side effects or database contents.
See [authoring](/docs/platform/authoring) and [UI recipes](/docs/cookbook/ui).
