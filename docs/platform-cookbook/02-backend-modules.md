# Backend Modules Cookbook

Tenant backend code is split across `Modules` and `Models`.

## Modules

- A module is an HTTP route handler.
- Create it from the `Modules` tree and choose route path plus HTTP method.
- Export a single handler with `module.exports = async function handler(req, adapters) {}`.

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

  @Column()
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
