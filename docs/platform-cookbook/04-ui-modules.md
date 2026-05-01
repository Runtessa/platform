# UI Modules Cookbook

Tenant frontend code lives under `UI Entities`.

## Supported File Types

- `.jsx` for React components
- `.js` for helpers
- `.css` for styles
- `.json` for static config

## Creation Flow

1. Create a UI entity from the tree.
2. Give it a stable name such as `Dashboard`, `components/Button`, or `features/orders/Table`.
3. Export the component or value you want other files to use.
4. Save the file so compiled output and dependency metadata update.

## App Example

```jsx
import React from "react";

export default function App() {
  return (
    <section className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-slate-600">Start building your tenant UI here.</p>
    </section>
  );
}
```

## Reuse

- Import other UI entities by package name.
- Keep page composition in top-level files such as `Dashboard`.
- Move cross-tenant UI into shared UI packages when the same pattern is reused in multiple places.
