# Shared Modules And Packages Cookbook

Shared projects are versioned reusable assets managed in admin shared areas.

## Shared Backend Projects

- Use them for reusable server-side logic.
- Keep an executable entry file, usually `src/index.js`.
- Supporting files can include `.js`, `.json`, and `.md` docs.

## Shared UI Packages

- Use them for reusable UI components, themes, helpers, and styles.
- Keep an executable entry file, usually `src/index.jsx`.
- Supporting files can include `.jsx`, `.js`, `.css`, `.json`, and `.md` docs.

## Suggested Layout

```text
docs/README.md
docs/examples.md
src/index.js
src/components/*
```

## When To Extract Shared Code

- The same backend logic appears in multiple tenant modules.
- The same UI entity pattern appears in multiple screens or tenants.
- A team needs one reusable versioned package instead of copied code.
