# React UI and Kernel cookbook

Tenant frontend code lives under **UI Entities**. Kernel loads its packages in the
browser and supplies dependency resolution, styles, route handling and API context.
Use backend modules for databases and server integrations.

## Supported source

| Extension | Typical use |
| --- | --- |
| `.jsx` | React components and application entry point |
| `.js` | Helpers and non-JSX exports |
| `.css` | Runtime styles |
| `.json` | Static configuration |

Imported React projects can contain additional source formats that the importer
normalizes. Review the generated entry and imports; arbitrary build-tool/npm
compatibility is not promised.

## Create an application entry point

The default tenant shell loads `@app/dashboard`. Its entry point should have a
**named `App` export**, and use `@app/datacontext` when calling tenant APIs.

```jsx
import React, { useState } from 'react';
import { useApiClient } from '@app/datacontext';

export function App() {
  const api = useApiClient();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const response = await api.get('/api/hello');
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      setMessage((await response.json()).message);
    } catch (failure) {
      setError(failure.message);
    }
  }

  return <section>
    <h1>Dashboard</h1>
    <button onClick={load}>Load message</button>
    {message && <p>{message}</p>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
```

This expects the `/api/hello` module and access policy from the
[first application tutorial](../tutorials/first-application.md). Save the UI entity,
preview its draft, then publish and test the published route.

## Call backend APIs through Kernel

The built-in data-context package exports `useApiClient` for React components and
`getApiClient` for helpers. The client has `request`, `get`, `post`, `put` and `del`.
It carries credentials and the configured tenant/session context.

```js
import { getApiClient } from '@app/datacontext';

export async function loadOrders() {
  const response = await getApiClient().get('/api/orders');
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}
```

Responses are standard `Response` objects; decode them explicitly. Use loading and
error states in the UI. Database libraries and adapter credentials belong in the
backend, not browser packages. Studio assistant contracts reject direct `fetch`,
Axios and ORM imports in generated UI code to keep it on this client path.

## Compose packages

Put reusable components in additional UI entities and import them by package name:

```jsx
// UI entity name: @app/components/Heading
import React from 'react';
export function Heading({ children }) { return <h2>{children}</h2>; }
```

```jsx
import { Heading } from '@app/components/Heading';
```

Keep only the application entry in `@app/dashboard`. A helper/component package
should not define a second `App` entry point. Saving updates compiled output and
dependency metadata; publish dependencies as well as the consuming package.

Kernel also supports CSS packages and style injection. Shared UI projects are the
next step when components/themes should be reused across tenant applications.

## Preview and inspect

Check both draft and published preview. When imports or rendering fail, compare:

- Tenant hostname, stage, package name and selected version.
- Named/default exports and import names.
- Compiled output and dependency metadata.
- Whether dependencies are published.
- Request status, session and endpoint ACL.

Development source-mode preview provides source maps, with a bundle fallback.
The inspection panel captures runtime/console/network events. Do not publish real
credentials or private diagnostic payloads in bug reports.

## Routing, branding and PWA

Kernel loads route manifests and can check session state for protected routes.
UI route protection does not replace backend ACL. Tenant administration also exposes
branding/manifest configuration; Core serves optional PWA assets and Kernel can
register the service worker when enabled. This does not promise offline correctness
for every tenant application's API/data workflow.

See [authoring](../platform/authoring.md), [shared projects](05-shared-projects.md)
and [access control](03-acl.md).
