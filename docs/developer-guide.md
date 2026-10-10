# IdpCore Developer Guide

This guide is for developers onboarding to the IdpCore platform and building tenant-facing functionality through `core`, `ideNew`, and `kernel`.

## 1. What This System Is

IdpCore is a multi-service tenant platform with:

- `core`: runtime + tenant APIs + registry + publish/draft execution
- `ideNew`: tenant IDE (editor, save/publish flow, preview, staging, assistant)
- `kernel`: browser runtime that loads tenant UI packages and mounts apps
- `auth`: SSO/auth service used by platform apps
- `packages/shared`: shared entities/types used across services

High-level flow:

1. Developer edits tenant code in IDE (`ideNew`).
2. IDE saves draft to Core APIs.
3. Preview loads through `public/preview.html` + Kernel.
4. Kernel fetches packages from Core registry endpoints.
5. Publish marks versions as published; non-dev runtime serves published payloads.

---

## 2. Repository Layout

- `src/core`: Express runtime, tenant APIs, registry, ACL, dispatch
- `src/ideNew`: Next.js IDE + API routes for editor operations
- `src/kernel/src/index.ts`: browser runtime source (dev source mode)
- `src/public`: static runtime/preview HTML (`index.html`, `preview.html`)
- `src/packages/shared`: shared TypeORM entities + contracts
- `docs/platform-cookbook`: tenant-facing cookbook docs (modules, ACL, UI, shared)

---

## 3. Local Setup

Follow the canonical [Getting started](getting-started.md) guide. The supported
live runtime uses Linux with namespaces and bubblewrap, Node 22.13+ in the 22.x
line, PostgreSQL 17 and private generated configuration. Use locked installs and
explicit platform migrations before starting Core/IDE. Older Node 20 instructions
and automatic schema synchronization are no longer supported.

---

## 4. Run Services

From repo root:

```bash
npm run apps:dev
```

This starts:

- `core:dev` (Core runtime)
- `ide:dev` (IDE)
- `auth:dev` (Auth)

Useful single-service commands:

```bash
npm run core:dev
npm run ide:dev
npm run auth:dev
```

Build commands:

```bash
npm run build:shared
npm run build
npm run build:front
```

---

## 5. Core Runtime Essentials

Entry point: `src/core/server.ts`.

Key runtime behavior:

- mounts `/api` routes via `ApiRouter`
- serves static assets from `/public`
- serves IDE shell page for non-API paths (`public/index.html`)
- routes tenant runtime requests through dispatcher (`app.all('*', ... dispatcher.handle)`)

Important controllers:

- `ModuleController`: backend module CRUD/version/publish/rollback
- `UIEntityController`: UI entity CRUD/version/publish/rollback
- `TenantAclController`: ACL config get/update
- `RegistryController`: package resolution for kernel

API router: `src/core/app/routers/api.ts`.

Important endpoints:

- `GET /api/registry/*`
- `GET /api/registry-tenant/*`
- `GET/POST/PUT/DELETE /api/modules...`
- `GET/POST/PUT/DELETE /api/ui-entities...`
- `GET/PUT /api/acl/config`

---

## 6. Tenant Code Model

Tenant code in IDE is organized as:

- Backend Modules
- UI Entities
- Models
- ACL JSON files

### Backend Modules

- Path-like route + method based handlers
- Saved/published through `/api/modules`
- Used by dispatcher at runtime

### UI Entities

- React/components/assets-like tenant UI packages
- Saved/published through `/api/ui-entities`
- Loaded by Kernel via registry endpoints

### Models

- ORM model files managed by IDE and used by backend runtime

### ACL

Stored as three JSON files under `Modules/acl` in IDE explorer:

- `permissions.json`
- `roles.json`
- `endpoints.json`

Persisted through `PUT /api/acl/config`.

---

## 7. IDE (`ideNew`) Internals

Main page: `src/ideNew/src/pages/editor.tsx`.

Editor responsibilities:

- explorer tree build and file buffers
- active/open tab management
- save, publish, rollback, history
- preview + inspect events
- staging and assistant integration

Core editor components:

- `EditorWorkspace.tsx`: Monaco/split/diff/preview container
- `EditorHeader.tsx`: top actions (code/preview/stage/route)
- `EditorExplorerPanel.tsx`: tenant file tree
- `EditorStagingPanel.tsx`: publish candidates

Key hooks:

- `useEditorSaveActions`
- `useEditorPublishActions`
- `useEditorPreviewActions`
- `useEditorHistory`

### ACL Side Form (new behavior)

ACL files now also have a side form panel next to Monaco:

- file: `src/ideNew/src/components/editor/AclSideFormPanel.tsx`
- shown only when active file meta is ACL
- form writes directly to JSON text buffer
- save flow remains unchanged (still `PUT /api/acl/config`)

This gives structured editing while preserving raw JSON control.

---

## 8. Preview + Kernel Runtime

Preview page: `src/public/preview.html`.

It bootstraps Kernel and mounts selected tenant package from URL params.

Key params:

- `name` package name (example `@app/dashboard`)
- `version` package version (`latest` in draft flow)
- `tenantHost` target tenant
- `previewSession` inspect/session grouping
- `stage` `draft` or `published`
- `kernelMode` `source` or `bundle`

In IDE dev mode, preview URL is generated with `kernelMode=source`.

Source mode behavior:

- loads `/kernel-source.js` generated from `src/kernel/src/index.ts`
- includes sourcemaps for better debugging visibility
- if source runtime fails, preview falls back to bundle runtime

Shell page: `src/public/index.html` bootstraps default app (`@app/dashboard`) for non-preview runtime entry.

---

## 9. Publish vs Draft Behavior

- Draft mode: IDE/dev flows can read draft source/compiled payloads.
- Published mode: runtime resolves published artifacts for stable tenant traffic.
- Non-dev registry paths are cached for published payload performance.

When debugging “works in published but fails in preview”, compare:

- preview `stage` (`draft` vs `published`)
- import/export style (default vs named)
- package path normalization (`@app/...`)
- dependency metadata completeness

---

## 10. Debugging Guide

### Frontend tenant runtime debugging

1. Open IDE preview in dev (`kernelMode=source` is automatic in dev builds).
2. Use browser DevTools Sources tab.
3. Inspect runtime files under `__idp_runtime__` and `kernel-source.js`.
4. Use Preview Inspect panel for runtime/console/network telemetry.

### Backend debugging

Run Core with inspector:

```bash
node --inspect-brk ./node_modules/ts-node/dist/bin.js src/core/server.ts
```

Then attach from your IDE debugger to Node inspect port (default `9229`).

### Common runtime errors

- `Module not loaded: ... Use Kernel.load(...) first`
  - missing dependency preload / unresolved import path
- `invalid React element type`
  - default/named export mismatch or wrong import path
- `Failed to fetch package ... (404)`
  - package name/version mismatch or unpublished stage mismatch

---

## 11. Adding Features Safely

When changing tenant authoring/runtime behavior:

1. Update editor behavior in `ideNew`.
2. Verify API contract in `core` controller/router.
3. Validate preview boot path (`preview.html` + kernel mode).
4. Confirm draft and published parity.
5. Update docs (`docs/platform-cookbook` and this guide if needed).

Recommended validation loop:

```bash
npm --prefix src/ideNew run type-check
npm --prefix src/core run dev
npm --prefix src/ideNew run dev
```

Then test:

- save file
- preview draft
- publish
- preview published
- load app root route and nested route

---

## 12. Docs to Read Next

- `docs/platform-cookbook/02-backend-modules.md`
- `docs/platform-cookbook/03-acl.md`
- `docs/platform-cookbook/04-ui-modules.md`
- `docs/platform-cookbook/05-shared-projects.md`
- `docs/site/docs/architecture/overview.md`
- `docs/site/docs/services/ide.md`
- `docs/site/docs/services/core.md`

---

## 13. Quick Start Checklist for New Developers

1. Complete the locked dependency and private configuration steps in [Getting started](getting-started.md).
2. Prepare platform schemas through the explicit migration workflow.
3. Start the local services using the installation guide; use `apps:dev` only with host-compatible private configuration.
4. Open IDE and select tenant.
5. Create/edit one module and one UI entity.
6. Edit ACL files from side form and save.
7. Verify preview in draft.
8. Publish and verify published preview.
9. Validate runtime route from tenant host.
