---
title: Backend modules and models
---

<!-- Generated from docs/platform-cookbook/02-backend-modules.md; edit the source guide. -->

# Backend Modules Cookbook

Tenant backend code is split across `Modules` and `Models`.

## Modules

- A module is an HTTP route handler.
- Create it from the `Modules` tree and choose route path plus HTTP method.
- Export a single handler with `module.exports = async function handler(req, adapters) {}`.

GET application pages use the frontend shell. For a backend walkthrough, use a
non-conflicting API path such as `/api/hello`, and grant anonymous access explicitly
only for a public demonstration route. Draft execution requires an authenticated
DEVELOPER/ADMIN bound to the selected tenant; a preview header is not authorization.

## Module Example

```js
/** @type {IdpModuleHandler} */
module.exports = async function handler(req, adapters) {
  const orm = await adapters.orm('postgres:pga1');
  const rows = await orm.getRepository('ExampleItem').find();

  return {
    statusCode: 200,
    body: {
      ok: true,
      items: rows,
    },
  };
};
```

## Models

- Models live under `Models` and must be `.js` files.
- Use TypeORM decorators and export entity classes.
- Saving a model recompiles it and triggers migration flow.

## Model Example

```js
const { Entity, PrimaryGeneratedColumn, Column } = require('typeorm');

@Entity({ name: 'example_items' })
class ExampleItem {
  @PrimaryGeneratedColumn('uuid')
  id;

  @Column({ type: 'varchar' })
  name;

  @Column({ default: true })
  isActive;
}

module.exports = { ExampleItem };
```

## Guidance

- Keep route handlers thin.
- Move reusable server logic into shared backend projects when multiple modules or tenants need it.
- Add ACL entries for protected routes.

## Provisioning a model-backed route

1. Create a database/schema and a narrowly scoped database role for the tenant.
2. Store the connection value in tenant secret storage.
3. Enable a named adapter (for example `postgres` with `allow: ["pga1"]`) and
   reference the secret under that named adapter's configuration.
4. Review/back up the intended schema change before saving the model in Studio;
   Studio save actions attempt schema synchronization after persisting source.
5. Verify repository queries before publishing the module that depends on them.
6. Define the route's permission/role/endpoint ACL and test the published request.

The named ORM key is `postgres:pga1`; `adapters.orm(...)` must be awaited.
The runtime exposes additional query/read-only adapter interfaces, but the Studio
assistant's generated backend contract uses ORM for database-backed module logic.

## Model changes and publication

Models do not share module/UI published snapshot semantics. A model edit and its
schema operation can affect runtime independently. Code restoration does not restore
table contents, and publishing a module does not apply database changes.

The current model migration endpoint performs TypeORM schema synchronization, not
the platform's versioned SQL migration stream. A failed schema action does not undo
the preceding model source save. Validate this workflow on staging before changing
models that address existing data.

Platform tables use [explicit migrations](/docs/operations/migrations).
Tenant model/schema operations are a different workflow. See
[authoring and publication](/docs/platform/authoring) before coordinating changes.

For a first endpoint without a data adapter, use the
[first application tutorial](/docs/tutorials/first-application).
