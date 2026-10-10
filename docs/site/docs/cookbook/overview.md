---
title: Application cookbook
---

<!-- Generated from docs/platform-cookbook/README.md; edit the source guide. -->

# Application cookbook

Use these recipes after [installation](/docs/getting-started) and the
[first HTTP + React application](/docs/tutorials/first-application). Each recipe
explains one part of a tenant application; the
[authoring guide](/docs/platform/authoring) connects their different lifecycles.

| Recipe | What you will configure/build |
| --- | --- |
| [Tenant configuration](/docs/cookbook/tenant-config) | Hostname, runtime settings, named adapter grants and secret references |
| [Backend modules and models](/docs/cookbook/backend) | Request handler, native TypeORM model and model-backed route |
| [Access control](/docs/cookbook/acl) | Permission definitions, roles and endpoint requirements |
| [React UI and Kernel](/docs/cookbook/ui) | Entry point, API client, component packages and preview |
| [Shared projects](/docs/cookbook/shared) | Versioned reusable multi-file backend/UI code |

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
