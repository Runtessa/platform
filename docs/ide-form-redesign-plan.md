# IDE Form Redesign Plan

## Goal

Raise all major form surfaces in `src/ideNew` to a consistent product-grade standard.

Target outcomes:
- stronger information hierarchy
- fewer flat "sheet of inputs" layouts
- better grouping of related decisions
- consistent actions and empty/error states
- less implementation-driven wording
- smaller, reusable form components

---

## Classification

### Good
- `src/ideNew/src/pages/login.tsx`
- `src/ideNew/src/pages/admin/users/new.tsx`
- `src/ideNew/src/pages/admin/shared-packages/new.tsx`
- `src/ideNew/src/pages/admin/shared-packages/[id].tsx`
- `src/ideNew/src/pages/admin/shared-modules/[id].tsx`:
  main metadata form only

### Improved But Still Weak
- `src/ideNew/src/pages/profile.tsx`
- `src/ideNew/src/pages/admin/teams/new.tsx`
- `src/ideNew/src/pages/admin/teams/[id].tsx`
- `src/ideNew/src/pages/admin/shared-modules/[id].tsx`:
  team access and route management sections
- `src/ideNew/src/pages/admin/tenants/new.tsx`
- `src/ideNew/src/pages/admin/tenants/[id].tsx`

### Needs Redesign
- `src/ideNew/src/components/editor/modals/CreateItemModal.tsx`
- `src/ideNew/src/components/editor/modals/EditItemModal.tsx`
- `src/ideNew/src/components/editor/modals/RenameFolderModal.tsx`
- `src/ideNew/src/components/admin/tenants/TenantSecretsManager.tsx`
- `src/ideNew/src/components/admin/tenants/TenantPwaFields.tsx`

---

## Priority Order

### P1: Small, high-visibility forms
- Profile
- Create team

Why:
- fast to improve
- low risk
- sets design pattern for larger refactors

### P2: Tenant workspace
- Tenant configuration
- Branding
- PWA
- Secrets
- Adapter configuration

Why:
- highest current admin friction
- most obvious quality gap
- needs stronger information architecture

### P3: Shared backend management
- shared backend metadata
- team access
- route management

Why:
- operationally important
- currently dense and hard to scan

### P4: Team detail page
- team settings
- add member
- assign tenant

Why:
- too many workflows on one page
- needs clearer section boundaries and action rhythm

### P5: Editor modals
- create item
- edit item
- rename folder

Why:
- structurally inconsistent
- still implementation-driven
- should reuse a common modal form system

---

## Redesign Rules

### Layout
- one primary purpose per form surface
- split long forms into named sections
- use preview or summary panels only when they reduce ambiguity
- keep destructive actions visually separated

### Copy
- prefer product language over schema language
- every section needs a short explanatory subtitle
- helper text should explain impact, not restate labels

### Interaction
- actions should be stable and predictable
- avoid repeated action rows when one submit target is enough
- advanced controls should sit below primary controls, not compete with them

### Visual hierarchy
- section cards should not all have equal weight
- use quieter containers for secondary guidance
- use stronger headings for actual decision groups

### Component design
- extract shared admin form sections where repetition exists
- keep files below ~200 lines where practical
- avoid page files owning large chunks of raw JSX structure

---

## Target State By Form

### Profile
Target:
- account identity section
- password/security section
- cleaner action row
- better read of current user state

Status:
- first-pass refinement completed

### Create team
Target:
- team identity section
- key/slug guidance section
- lifecycle section
- better explanation of active/inactive state

Status:
- first-pass refinement completed

### Tenant workspace
Target:
- stronger tab rhythm
- cleaner tenant core form
- secrets and PWA treated as first-class product workflows
- adapter config explicitly separated into basic vs advanced if kept in JSON

Status:
- major structural refactor completed
- remaining weak points are PWA field UX and secrets workflow polish

### Shared backend edit
Target:
- metadata, access, and routes become distinct management surfaces
- route editing should stop feeling like inline spreadsheet editing

Status:
- first structural refactor completed
- metadata now reused between create and edit
- access and route workflows are separated into dedicated cards

### Team detail
Target:
- split by purpose
- settings, members, and tenant assignments need clearer action boundaries

Status:
- first structural refactor in progress

### Editor modals
Target:
- common modal layout system
- each modal only shows relevant fields
- less raw code-first appearance for creation flows

Status:
- not started

---

## Execution Batches

### Batch 1
- profile
- create team

Status:
- completed

### Batch 2
- tenant workspace

Status:
- structural refactor completed
- visual and workflow polish still pending

### Batch 3
- shared backend edit
- team detail

Status:
- team detail first refactor completed
- shared backend edit first refactor completed

### Batch 4
- editor modals

Status:
- not started

---

## Current Batch

In progress:
- Batch 3

Next implementation steps:
1. finish team detail refinement and reduce remaining friction in member-role editing
2. redesign `src/ideNew/src/pages/admin/shared-modules/[id].tsx`
3. revisit `TenantSecretsManager.tsx` and `TenantPwaFields.tsx` after shared backend work
4. validate with `npm --prefix src/ideNew run type-check`
