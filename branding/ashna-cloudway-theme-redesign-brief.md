# Ashna CloudWay Theme Redesign Brief

## Goal

Redesign the product theme for **Ashna CloudWay** without changing product behavior, routes, data models, permissions, APIs, or workflows.

The redesign must improve visual consistency and brand alignment while preserving the current UI structure.

## Brand

Brand name: **Ashna CloudWay**

Tagline: **The familiar path from code to cloud.**

Product category: **Internal Developer Platform**

Voice:

- Clear
- Practical
- Technical
- Calm
- Reliable
- Developer-first

Avoid:

- Decorative marketing UI
- Heavy gradients
- Purple/blue SaaS cliches
- Glassmorphism-heavy layouts
- Cartoon visuals
- Persian letters in logo/brand assets

## Theme Direction

Use a monochrome, high-contrast developer platform theme.

Core colors:

```css
--acw-black: #000000;
--acw-near-black: #050505;
--acw-charcoal: #111111;
--acw-graphite: #1a1a1a;
--acw-border: #2a2a2a;
--acw-white: #ffffff;
--acw-text-secondary: #d4d4d4;
--acw-text-muted: #a3a3a3;

--acw-success: #22c55e;
--acw-warning: #f59e0b;
--acw-error: #ef4444;
--acw-info: #38bdf8;
```

Semantic colors must only be used for real status/feedback:

- Success: healthy, completed, saved
- Warning: degraded, pending, attention needed
- Error: failed, destructive, blocked
- Info: running, neutral technical state

## Typography

Use clean developer-oriented typography.

Primary UI font:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Code font:

```css
font-family: "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
```

Rules:

- Headings should be compact and confident.
- Use semibold for important labels.
- Use monospace only for IDs, paths, commands, logs, env vars, and code.

## Logo Usage

Use existing assets:

```text
/public/brand/ashna-cloudway-logo-white-on-black.png
/public/brand/ashna-cloudway-logo-white-transparent.png
/public/brand/ashna-cloudway-icon-white-transparent.png
/public/brand/ashna-cloudway-icon-black-transparent.png
```

Rules:

- Do not crop the logo.
- Keep at least 10% padding around logo.
- Use full logo in login/sidebar/header.
- Use icon only in compact spaces.
- Do not recolor, stretch, rotate, shadow, or add effects to logo.

## Redesign Scope

Allowed:

- Theme tokens
- CSS variables
- Tailwind theme values
- Button styles
- Card styles
- Sidebar/header visual treatment
- Login page visual polish
- Status pills
- Table density
- Empty states
- Page metadata
- Logo placement
- Typography spacing

Not allowed:

- Route changes
- API changes
- Permission changes
- Data structure changes
- Workflow changes
- Removing features
- Renaming internal TypeScript/API identifiers like `IdpModuleHandler`
- Changing extension command IDs like `idpcore.*`

## App Shell

Desired feel:

- Black or near-black base
- Charcoal cards
- Subtle borders
- Minimal active nav state
- Clear hierarchy
- Compact developer-console density

Sidebar:

- Background: black or near-black
- Header: full Ashna CloudWay logo
- Active item: high-contrast but not colorful
- Icons: neutral, simple
- Footer: short product name or version

Top bar:

- Minimal
- Clear current area name
- User/team controls unchanged
- No marketing decoration

## Components

### Buttons

Primary:

- White background
- Black text
- Strong but simple

Secondary:

- Charcoal background
- White text
- Subtle border

Danger:

- Red semantic only

### Cards

Use:

- Charcoal background
- Subtle dark border
- Slight radius
- Low shadow or no shadow

Avoid:

- Bright colored cards
- Heavy gradients
- Glass blur unless already part of existing UX

### Tables

Use:

- Compact row height
- Clear hover state
- Muted metadata text
- Monospace for IDs/paths
- Sticky headers only if already supported

### Forms

Use:

- Dark inputs
- Clear focus border
- High contrast labels
- Error text in semantic red
- Help text muted

### Empty States

Use direct copy:

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

## Login Page

Keep current auth behavior exactly.

Target copy:

```text
Sign in to Ashna CloudWay
Access your internal developer platform.
```

Visual:

- Black background
- Logo visible, uncropped
- Simple card/panel
- No decorative gradients unless very subtle
- Preserve existing form fields and validation

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

## Acceptance Criteria

Theme redesign is acceptable when:

- Ashna CloudWay is clearly visible as the product.
- Logo is visible and not cropped.
- Theme is monochrome-first.
- Semantic colors are only used for real status.
- Existing behavior is unchanged.
- Type-check/build passes.
- No generated/vendor files are edited.
- UI remains usable on desktop and mobile.
