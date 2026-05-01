# ACL Cookbook

ACL is managed by three JSON files under `Modules/acl`.

## `permissions.json`

Defines the available permission keys.

```json
{
  "permissions": [
    { "key": "orders.read", "label": "Read Orders" },
    { "key": "orders.write", "label": "Write Orders" }
  ]
}
```

## `roles.json`

Maps roles and groups to permission keys.

```json
{
  "roles": {
    "admin": ["orders.read", "orders.write"],
    "viewer": ["orders.read"]
  },
  "groups": {
    "devs": ["admin"],
    "guests": ["viewer"]
  }
}
```

## `endpoints.json`

Maps route paths to ACL requirements.

```json
{
  "/api/orders": {
    "allowAnonymous": false,
    "read": ["orders.read"],
    "write": ["orders.write"]
  }
}
```

## Flow

1. Add permission keys in `permissions.json`.
2. Assign those keys to roles in `roles.json`.
3. Bind route paths to those keys in `endpoints.json`.

## Notes

- `allowAnonymous` should stay `false` unless the route is intentionally public.
- Endpoint keys use route paths such as `/api/orders`.
