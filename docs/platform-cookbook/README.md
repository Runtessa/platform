# Application cookbook

Use these recipes after [installation](../getting-started.md) and the
[first HTTP + React application](../tutorials/first-application.md). Each recipe
explains one part of a tenant application; the
[authoring guide](../platform/authoring.md) connects their different lifecycles.

| Recipe | What you will configure/build |
| --- | --- |
| [Tenant configuration](01-tenant-config.md) | Hostname, runtime settings, named adapter grants and secret references |
| [Backend modules and models](02-backend-modules.md) | Request handler, native TypeORM model and model-backed route |
| [Access control](03-acl.md) | Permission definitions, roles and endpoint requirements |
| [React UI and Kernel](04-ui-modules.md) | Entry point, API client, component packages and preview |
| [Shared projects](05-shared-projects.md) | Versioned reusable multi-file backend/UI code |

## Build a complete feature

For a database-backed feature, connect the pieces deliberately:

1. Provision the tenant's database connection and grant its named adapter.
2. Define models and review the schema operation.
3. Implement the backend module using the injected ORM adapter.
4. Set endpoint ACL and role permissions.
5. Build the React UI with the Kernel API client.
6. Preview the draft and verify the published module/UI path.

Models, configuration and ACL do not all share the module/UI publication lifecycle.
An example snippet alone does not create its required database, identity or grants.
These guides describe repository behavior, not a particular deployed tenant state.
