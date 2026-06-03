# Ashna CloudWay Branding and Theme Brief

## Goal

Apply the **Ashna CloudWay** visual identity to the product without changing product behavior, routes, data models, permissions, APIs, workflows, extension command IDs, or internal TypeScript/API identifiers.

The redesign must improve visual consistency and brand alignment while preserving the current UI structure.

---

## Brand

**Brand name:** Ashna CloudWay  
**Tagline:** The familiar path from code to cloud.  
**Product category:** Internal Developer Platform

### Brand voice

Use a tone that is:

- Clear
- Practical
- Technical
- Calm
- Reliable
- Developer-first

Avoid:

- Decorative marketing UI
- Heavy gradients
- Purple/blue SaaS cliché styling
- Glassmorphism-heavy layouts
- Cartoon visuals
- Persian letters in logo/brand assets
- Pure black backgrounds

---

## Theme Direction

Use a monochrome, high-contrast developer platform theme, but **do not use pure black (`#000000`) as the main background**.

The theme should feel like a modern developer console: dark, calm, sharp, and technical.

### Important rule

Do **not** use `#000000` for app backgrounds, cards, sidebars, panels, overlays, or layout surfaces.

Pure black may only be used in rare cases where it already exists inside a logo image asset and should not be recolored.

---

## Color System

### Core palette

```css
:root {
  --acw-bg: #0b0d10;
  --acw-bg-elevated: #101318;
  --acw-bg-sidebar: #080a0d;
  --acw-bg-header: #0d1014;

  --acw-surface: #12161c;
  --acw-surface-hover: #181d24;
  --acw-surface-active: #1f2630;

  --acw-border: #252c36;
  --acw-border-strong: #343d4a;

  --acw-text-primary: #f4f7fb;
  --acw-text-secondary: #c9d1dc;
  --acw-text-muted: #8f9aaa;
  --acw-text-disabled: #5f6b7a;

  --acw-inverse-bg: #f4f7fb;
  --acw-inverse-text: #0b0d10;

  --acw-success: #22c55e;
  --acw-warning: #f59e0b;
  --acw-error: #ef4444;
  --acw-info: #38bdf8;
}
```

### Color usage

Use monochrome colors for structure and hierarchy.

Semantic colors must only be used for real status or feedback:

- **Success:** healthy, completed, saved
- **Warning:** degraded, pending, attention needed
- **Error:** failed, destructive, blocked
- **Info:** running, neutral technical state

Avoid using semantic colors as decoration.

---

## Typography

Use clean developer-oriented typography.

### Primary UI font

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Code font

```css
font-family: "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
```

### Typography rules

- Headings should be compact and confident.
- Use semibold for important labels.
- Use normal weight for dense body text.
- Use monospace only for IDs, paths, commands, logs, environment variables, commit hashes, versions, and code.
- Avoid oversized marketing-style headings inside the app shell.

---

## Logo Usage

Use existing assets where available:

```text
/public/brand/ashna-cloudway-logo-white-on-black.png
/public/brand/ashna-cloudway-logo-white-transparent.png
/public/brand/ashna-cloudway-icon-white-transparent.png
/public/brand/ashna-cloudway-icon-black-transparent.png
```

### Logo rules

- Do not crop the logo.
- Keep at least 10% padding around the logo.
- Use the full logo in login, sidebar, and header when space allows.
- Use icon-only assets only in compact spaces.
- Do not recolor, stretch, rotate, shadow, blur, outline, or add effects to the logo.
- Do not use Persian letters in logo or brand assets.
- When a background is required behind a white logo, use `#0b0d10` or `#080a0d`, not pure black.

---

## Redesign Scope

### Allowed

- Theme tokens
- CSS variables
- Tailwind theme values
- Button styles
- Card styles
- Sidebar visual treatment
- Header visual treatment
- Login page visual polish
- Status pills
- Table density
- Empty states
- Page metadata
- Logo placement
- Typography spacing

### Not allowed

- Route changes
- API changes
- Permission changes
- Data structure changes
- Workflow changes
- Removing features
- Renaming internal TypeScript/API identifiers like `IdpModuleHandler`
- Changing extension command IDs like `idpcore.*`
- Editing generated files
- Editing vendor files

---

## App Shell

### Desired feel

- Near-black graphite base, not pure black
- Charcoal cards
- Subtle borders
- Minimal active nav state
- Clear hierarchy
- Compact developer-console density

### Sidebar

Use:

```css
background: var(--acw-bg-sidebar);
border-right: 1px solid var(--acw-border);
```

Rules:

- Header should show the full Ashna CloudWay logo.
- Active item should be high-contrast but not colorful.
- Icons should be neutral and simple.
- Footer may show product version or environment.
- Avoid decorative gradients.

### Top bar

Use:

```css
background: var(--acw-bg-header);
border-bottom: 1px solid var(--acw-border);
```

Rules:

- Keep it minimal.
- Show the current area name clearly.
- Keep user/team controls unchanged.
- Do not add marketing decoration.

---

## Components

### Buttons

#### Primary

```css
background: var(--acw-inverse-bg);
color: var(--acw-inverse-text);
border: 1px solid var(--acw-inverse-bg);
```

Use for primary actions such as:

- Create service
- Deploy
- Save changes
- Sign in

#### Secondary

```css
background: var(--acw-surface);
color: var(--acw-text-primary);
border: 1px solid var(--acw-border);
```

Use for normal actions.

#### Ghost

```css
background: transparent;
color: var(--acw-text-secondary);
border: 1px solid transparent;
```

On hover:

```css
background: var(--acw-surface-hover);
color: var(--acw-text-primary);
```

#### Danger

Use semantic red only for destructive actions.

---

### Cards

Use:

```css
background: var(--acw-surface);
border: 1px solid var(--acw-border);
border-radius: 12px;
box-shadow: none;
```

Rules:

- Use subtle dark borders.
- Use low or no shadow.
- Use compact spacing.
- Avoid bright colored cards.
- Avoid heavy gradients.
- Avoid glass blur unless it already exists as part of the current UX.

---

### Tables

Use:

- Compact row height
- Clear hover state with `--acw-surface-hover`
- Muted metadata text
- Monospace for IDs, paths, hashes, image tags, and versions
- Sticky headers only if already supported

Suggested styles:

```css
background: var(--acw-surface);
border-color: var(--acw-border);
color: var(--acw-text-primary);
```

Header:

```css
background: var(--acw-bg-elevated);
color: var(--acw-text-secondary);
```

---

### Forms

Use:

```css
background: var(--acw-bg-elevated);
border: 1px solid var(--acw-border);
color: var(--acw-text-primary);
```

Focus:

```css
border-color: var(--acw-border-strong);
outline: 2px solid rgba(244, 247, 251, 0.08);
```

Rules:

- Use dark inputs.
- Use clear focus borders.
- Use high-contrast labels.
- Use semantic red for error text.
- Use muted help text.

---

### Status Pills

Use semantic colors only for real status.

Examples:

```text
Healthy      -> success
Completed    -> success
Running      -> info
Pending      -> warning
Degraded     -> warning
Failed       -> error
Blocked      -> error
```

Status pills should be compact, readable, and not overly bright.

---

### Empty States

Use direct copy.

```text
No services found
Create a new service or adjust your filters.
```

```text
No deployments yet
Deploy your service to see release history here.
```

```text
No documentation linked
Add docs to help other teams understand and operate this service.
```

Visual rules:

- No large illustrations.
- No cartoon visuals.
- No colorful decoration.
- Keep the tone technical and useful.

---

## Login Page

Keep the current authentication behavior exactly.

### Target copy

```text
Sign in to Ashna CloudWay
Access your internal developer platform.
```

### Visual direction

Use:

```css
background: var(--acw-bg);
```

Panel:

```css
background: var(--acw-surface);
border: 1px solid var(--acw-border);
```

Rules:

- Logo must be visible and uncropped.
- Use a simple login card or panel.
- Do not use pure black.
- Do not use decorative gradients unless already present and extremely subtle.
- Preserve existing form fields, validation, auth flow, redirects, and error handling.

---

## Navigation Labels

Prefer concise developer-platform labels where safe:

```text
Dashboard
Catalog
Create
Deployments
Environments
Observability
Documentation
Templates
Security
Settings
```

Only rename labels if the route/function remains obvious.

Do not rename internal route IDs, API identifiers, extension commands, or permission keys.

---

## Brand Copy

### Main product description

```text
Ashna CloudWay is the familiar path from code to cloud.
```

### Longer description

```text
Ashna CloudWay gives developers one familiar place to create, deploy, observe, and manage cloud-native software.
```

### Developer-facing slogan

```text
Build, ship, and operate from one familiar platform.
```

### Login subtitle

```text
Access your internal developer platform.
```

---

## Tailwind Mapping

If the project uses Tailwind, map the theme roughly like this:

```js
theme: {
  extend: {
    colors: {
      acw: {
        bg: "#0b0d10",
        elevated: "#101318",
        sidebar: "#080a0d",
        header: "#0d1014",
        surface: "#12161c",
        hover: "#181d24",
        active: "#1f2630",
        border: "#252c36",
        borderStrong: "#343d4a",
        text: "#f4f7fb",
        secondary: "#c9d1dc",
        muted: "#8f9aaa",
        disabled: "#5f6b7a",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#38bdf8"
      }
    },
    fontFamily: {
      sans: [
        "Inter",
        "ui-sans-serif",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "sans-serif"
      ],
      mono: [
        "JetBrains Mono",
        "SFMono-Regular",
        "Consolas",
        "Liberation Mono",
        "Menlo",
        "monospace"
      ]
    }
  }
}
```

---

## Codex Implementation Checklist

1. Locate the app theme entry points:
   - global CSS
   - Tailwind config
   - theme provider
   - layout shell
   - component library wrappers

2. Add Ashna CloudWay theme tokens.

3. Replace pure black backgrounds with:
   - `#0b0d10` for main app background
   - `#080a0d` for sidebar
   - `#12161c` for cards and panels

4. Keep all behavior unchanged.

5. Add or verify brand assets under:

```text
/public/brand/
```

6. Apply logo usage:
   - full logo in login/sidebar/header
   - icon only in compact areas
   - no cropping
   - no effects

7. Update visible copy where safe:
   - product title
   - login title
   - login subtitle
   - empty states

8. Apply component styles:
   - buttons
   - cards
   - forms
   - tables
   - status pills
   - navigation

9. Confirm semantic colors are used only for status/feedback.

10. Run project checks:
    - type-check
    - lint
    - tests if available
    - production build

---

## Acceptance Criteria

The theme redesign is acceptable when:

- Ashna CloudWay is clearly visible as the product.
- Logo is visible and not cropped.
- The theme is monochrome-first.
- The UI does not use pure black as the main background.
- Semantic colors are only used for real status.
- Existing behavior is unchanged.
- Type-check/build passes.
- No generated/vendor files are edited.
- UI remains usable on desktop and mobile.
