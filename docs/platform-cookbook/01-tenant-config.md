# Tenant Config Cookbook

This platform separates tenant setup into admin-managed configuration and editor-managed workspace files.

## Where To Edit

- Tenant form: hostname, resource limits, adapter access, adapter config, auth DB mode, registration, suspension.
- Tenant secrets page: store secret values and reference them from config.
- Editor ACL files: `Modules/acl/permissions.json`, `roles.json`, `endpoints.json`.

## Config Shape

```json
{
  "hostname": "tenant.local",
  "resourceConfig": {
    "memory": 512,
    "timeout": 5000
  },
  "adapterAccess": {
    "postgres": {
      "allow": ["pga1"]
    }
  },
  "adapterConfig": {
    "postgres": {
      "pga1": { "secretKey": "DB_MAIN_URL" }
    }
  },
  "authDbConfig": {
    "mode": "shared",
    "secretKey": null
  },
  "allowRegistration": true,
  "isSuspended": false
}
```

## Rules

- Keep secrets out of raw config values.
- Store secrets in tenant secret storage and reference them by key.
- `adapterAccess` defines which named adapters backend code may request.
- `resourceConfig.timeout` is in milliseconds.
- `authDbConfig.mode` should stay `shared` unless the tenant is explicitly provisioned for a dedicated auth database.

The access map is keyed by **adapter type** (`postgres`), whose `allow` array
contains named connections (`pga1`). Backend ORM calls join those into the key
`postgres:pga1`. The configuration map nests the connection name under its type.
An adapter grant does not create a database or user; provision those separately.

See [the platform tour](../platform/overview.md) for identity and runtime ownership,
and [authoring](../platform/authoring.md) for configuration versus publication.
