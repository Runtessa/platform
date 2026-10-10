---
title: Your first application
---

<!-- Generated from docs/tutorials/first-application.md; edit the source guide. -->

# Your first live application

Build a published HTTP endpoint and a React UI that calls it through Kernel. This
walkthrough uses no tenant database adapter: it demonstrates the authoring/runtime
contract before adding persistence.

## Prerequisites

Complete [Getting started](/docs/getting-started), including migrations and the
first IDE login. Create/select a tenant with hostname `localhost` for the local
Compose setup. Core is at `http://localhost:3005`, IDE at `http://localhost:3002`.

Use installation-specific credentials. The IDE operator account and the Auth
account are different; this intentionally public demonstration endpoint does not
exercise protected tenant SSO.

## 1. Create a backend module

In the tenant workspace's Modules area, create a **GET** module with route
`/api/hello` and JavaScript source:

```js
module.exports = async function handler(req, adapters) {
  return {
    statusCode: 200,
    body: { message: 'Hello from live tenant code' },
  };
};
```

Save the draft and publish the module. Choose a non-conflicting API route; normal
application GET page routes use the browser shell rather than this endpoint.

## 2. Set access for the demonstration

Open `Modules/acl/endpoints.json`, keep its existing entries and add:

```json
{
  "/api/hello": {
    "allowAnonymous": true,
    "read": [],
    "write": []
  }
}
```

Save the ACL. This makes only the demonstration endpoint public. It grants no
IDE/admin access, no draft access and no database access. For a real protected API,
use [permission/role/endpoint rules](/docs/cookbook/acl).

Request the published endpoint:

```sh
curl --fail http://localhost:3005/api/hello
```

The JSON body should contain `message: "Hello from live tenant code"`. If it does
not, check the selected tenant, method/route, publication state and ACL. A bare Core
URL is not an installed example application.

## 3. Add the React application entry point

Create or edit the UI entity named **`@app/dashboard`** with JSX source. The default
shell expects its named `App` export. This example uses the real Kernel API client
and handles loading/error states.

```jsx
import React, { useState } from 'react';
import { useApiClient } from '@app/datacontext';

export function App() {
  const api = useApiClient();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadMessage() {
    setBusy(true);
    setError('');
    try {
      const response = await api.get('/api/hello');
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const body = await response.json();
      setMessage(body.message);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return <main>
    <h1>My first IdpCore application</h1>
    <button onClick={loadMessage} disabled={busy}>
      {busy ? 'Loading…' : 'Call the backend'}
    </button>
    {message && <p>{message}</p>}
    {error && <p role="alert">{error}</p>}
  </main>;
}
```

Save and open the Studio draft preview. Click **Call the backend** and inspect the
request/result. The client returns a standard `Response`; it does not decode JSON
for you. Kernel supplies tenant/session context through `@app/datacontext`.

Publish the UI entity and load `http://localhost:3005/`. Use the published preview
if the installation's application route/entry configuration differs from the
local default. The public UI/endpoint example is not a protected SSO test.

## 4. Change the backend while Core stays running

Change the backend message to `Hello from revision two`, save and publish it.
Request `/api/hello` again or press the UI button again. The selected published
handler now returns the new message; this module change does not need a new Core
image or a platform restart.

An unpublished draft is not expected to change this public request. Draft backend
access needs authenticated developer context bound to the tenant. Do not use a
preview header as a substitute for that identity.

## 5. Inspect history and restore

Open the module's revision history and compare its source. Restoring a prior
revision updates the draft. Review it and publish again to select it for public
runtime traffic. This source workflow does not roll back database contents or
external effects.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| No tenant / wrong application | Tenant hostname must match the browser/request host |
| 404 or wrong shell response | GET method, `/api/hello` route, publication and route collision |
| 401 / 403 | Endpoint ACL, tenant session and stage; don't weaken unrelated access |
| UI package not found | Package name, publication, entry point and dependency metadata |
| Invalid component / no mount | Named `App` export for `@app/dashboard` |
| Isolation startup failure | Linux namespaces, bubblewrap and host/container policy |

## Add persistence and reuse

Continue with [backend/model recipes](/docs/cookbook/backend)
to create an entity, provision a named database connection and review model schema
operations. Then add [protected ACL](/docs/cookbook/acl),
[reusable UI components](/docs/cookbook/ui) and
[shared projects](/docs/cookbook/shared).
