# Ashna CloudWay Branding Guide

This file is the source of truth for applying the **Ashna CloudWay** brand to the internal developer platform.

> For Codex: apply this branding without changing product behavior. Prioritize visible product identity, navigation labels, theme tokens, logo placement, page metadata, and reusable UI components.

---

## 1. Brand Summary

### Brand Name

**Ashna CloudWay**

### Product Category

**Internal Developer Platform**

### Core Meaning

Ashna CloudWay is the familiar, trusted path from code to cloud. The platform gives developers one clear place to create services, deploy applications, observe runtime health, access documentation, and follow standard engineering workflows.

### Brand Promise

**One familiar platform for building, shipping, and running cloud-native software.**

### Primary Tagline

**The familiar path from code to cloud.**

### Secondary Taglines

- **Build faster. Ship safer. Run clearly.**
- **One way from repository to production.**
- **Developer workflows, standardized.**
- **From service creation to cloud operations.**

---

## 2. Logo Direction

### Final Logo Style

Use a **minimal monochrome logo** with:

- A geometric **A + forward-arrow / terminal prompt** style icon.
- The wordmark **Ashna CloudWay**.
- English letters only.
- No Persian letters or Persian script in the logo.
- High contrast.
- Clean, bold, modern SaaS/platform feel.

### Primary Logo Asset

Use this asset as the current approved visual reference:

```text
ashna-cloudway-logo-white-on-black.png
```

Recommended project location:

```text
/public/brand/ashna-cloudway-logo-white-on-black.png
```

### Logo Mark Concept

The icon should visually communicate:

- **A** = Ashna
- **>** = command prompt, forward motion, developer workflow, deployment path
- **CloudWay** = path from code to cloud

### Logo Variants to Maintain

| Variant | Usage | Background | Logo Color |
|---|---|---:|---:|
| Primary dark | Login page, landing, sidebar header | `#000000` | `#FFFFFF` |
| Transparent white | Dark UI surfaces | Transparent | `#FFFFFF` |
| Inverse light | Documentation or light mode | `#FFFFFF` | `#000000` |
| Icon only | Favicon, compact sidebar, app switcher | Any valid surface | Match contrast |

### Logo Framing Rules

When rendering or exporting the logo:

- Keep the full logo visible inside the frame.
- Do not crop the icon or the wordmark.
- Keep at least **10% padding** around all edges.
- Center the full lockup visually.
- Avoid excessive empty space.
- Prefer a horizontal lockup for headers and login pages.
- Prefer icon-only for favicon, collapsed navigation, and small UI placements.

### Minimum Sizes

| Context | Minimum Size |
|---|---:|
| Full logo in header | `180px` wide |
| Full logo on login page | `260px` wide |
| Icon-only in sidebar | `32px` square |
| Favicon | `32x32`, `48x48`, `180x180`, `512x512` |

### Clear Space

Use the height of the letter **A** in the wordmark as the minimum clear space around the logo.

### Logo Usage Rules

Do:

- Use white logo on black background for the primary identity.
- Use black logo on white background only when required by light documents or printable material.
- Use the logo exactly as a brand lockup.
- Keep proportions unchanged.

Do not:

- Do not use Persian letters in the logo.
- Do not add gradients to the logo.
- Do not add shadows, glow, bevel, or 3D effects.
- Do not stretch, rotate, skew, or crop the logo.
- Do not recolor the logo with blue, purple, or other decorative colors.
- Do not place the white logo on a light background.
- Do not place the black logo on a dark background.

---

## 3. Color System

The brand identity is monochrome. The product UI may use restrained semantic colors only for status and feedback.

### Core Brand Colors

| Token | Hex | Usage |
|---|---:|---|
| `brand.black` | `#000000` | Primary brand background |
| `brand.white` | `#FFFFFF` | Primary logo and high-emphasis text |
| `brand.offWhite` | `#F8F8F8` | Light surfaces |
| `brand.nearBlack` | `#050505` | Dark surfaces, app shell |
| `brand.charcoal` | `#111111` | Cards and elevated dark surfaces |
| `brand.graphite` | `#1A1A1A` | Secondary dark surfaces |
| `brand.borderDark` | `#2A2A2A` | Dark borders |
| `brand.muted` | `#A3A3A3` | Muted text |

### Recommended UI Semantic Colors

Use these sparingly. They are not part of the core logo identity.

| Token | Hex | Usage |
|---|---:|---|
| `status.success` | `#22C55E` | Successful deployment, healthy service |
| `status.warning` | `#F59E0B` | Warnings, degraded state |
| `status.error` | `#EF4444` | Failed deployment, incident, error |
| `status.info` | `#38BDF8` | Neutral info, running workflow |

### CSS Variables

```css
:root {
  --acw-brand-black: #000000;
  --acw-brand-white: #ffffff;
  --acw-off-white: #f8f8f8;
  --acw-near-black: #050505;
  --acw-charcoal: #111111;
  --acw-graphite: #1a1a1a;
  --acw-border-dark: #2a2a2a;
  --acw-text-primary: #ffffff;
  --acw-text-secondary: #d4d4d4;
  --acw-text-muted: #a3a3a3;
  --acw-text-inverse: #000000;

  --acw-success: #22c55e;
  --acw-warning: #f59e0b;
  --acw-error: #ef4444;
  --acw-info: #38bdf8;

  --acw-radius-sm: 6px;
  --acw-radius-md: 10px;
  --acw-radius-lg: 16px;
  --acw-radius-xl: 24px;

  --acw-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.24);
  --acw-shadow-md: 0 8px 24px rgba(0, 0, 0, 0.32);
  --acw-shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.42);
}
```

### Tailwind Theme Tokens

```js
// tailwind.config.js / tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        acw: {
          black: '#000000',
          white: '#ffffff',
          offWhite: '#f8f8f8',
          nearBlack: '#050505',
          charcoal: '#111111',
          graphite: '#1a1a1a',
          borderDark: '#2a2a2a',
          muted: '#a3a3a3',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#38bdf8'
        }
      },
      borderRadius: {
        acwSm: '6px',
        acwMd: '10px',
        acwLg: '16px',
        acwXl: '24px'
      }
    }
  }
};
```

---

## 4. Typography

### Primary UI Font

Use:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Code / CLI Font

Use:

```css
font-family: "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
```

### Font Rules

- Use clean sans-serif typography.
- Prefer medium and semibold weights.
- Avoid overly decorative typefaces.
- Keep headings compact and confident.
- Use monospace only for code, CLI examples, environment names, resource IDs, and technical values.

### Suggested Type Scale

| Token | Size | Line Height | Weight | Usage |
|---|---:|---:|---:|---|
| `display` | `48px` | `56px` | `700` | Login/landing hero |
| `h1` | `36px` | `44px` | `700` | Page title |
| `h2` | `28px` | `36px` | `650` | Section title |
| `h3` | `22px` | `30px` | `600` | Card title |
| `body` | `16px` | `24px` | `400` | Main text |
| `body-sm` | `14px` | `20px` | `400` | Secondary UI text |
| `caption` | `12px` | `16px` | `500` | Labels, metadata |
| `code` | `13px` | `20px` | `400` | CLI and code snippets |

---

## 5. Visual Style

### Overall Style

Ashna CloudWay should feel:

- Minimal
- Technical
- Stable
- Developer-first
- Self-service oriented
- High contrast
- Fast and clear

### Shape Language

Use:

- Geometric shapes
- Straight lines
- Slightly rounded cards
- Clean spacing
- Simple icons
- High contrast sections

Avoid:

- Heavy gradients
- Decorative illustrations
- Overly colorful dashboards
- Cartoon-style graphics
- Marketing-heavy effects
- Excessive glassmorphism

### UI Density

Developer platforms should be efficient. Use moderate density:

- Compact navigation
- Clear tables
- Strong search and filter affordances
- Direct action buttons
- Status indicators that are easy to scan

---

## 6. Brand Voice

### Personality

Ashna CloudWay should sound:

- Clear
- Practical
- Reliable
- Calm
- Technical
- Helpful
- Direct

### Writing Principles

Use direct product language:

- **Create service**
- **Deploy application**
- **View logs**
- **Open catalog**
- **Check health**
- **Manage environments**
- **Follow golden path**

Avoid vague marketing language:

- Revolutionary
- Magical
- Next-generation
- Supercharged
- Unlimited innovation
- Transform your journey

---

## 7. Product Copy

### Main Hero Copy

```text
Welcome to Ashna CloudWay
The familiar path from code to cloud.
Create services, manage deployments, observe runtime health, and follow golden paths from one internal developer platform.
```

### Login Page Copy

```text
Sign in to Ashna CloudWay
Access your internal developer platform.
```

### Empty State Copy

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

### Error Copy

```text
Something went wrong
The platform could not complete this request. Try again or contact the platform team.
```

```text
Access denied
You do not have permission to view this resource.
```

### Loading Copy

```text
Loading platform data...
```

```text
Checking service health...
```

```text
Preparing deployment...
```

### Success Copy

```text
Service created successfully.
```

```text
Deployment started.
```

```text
Configuration saved.
```

---

## 8. Navigation Model

Use concise developer-oriented labels.

### Primary Navigation

| Label | Purpose |
|---|---|
| Dashboard | Platform overview |
| Catalog | Services, components, systems, APIs |
| Create | New services, jobs, libraries, templates |
| Deployments | Releases, environments, rollout history |
| Environments | Dev, test, stage, prod resources |
| Observability | Logs, metrics, traces, health |
| Documentation | Engineering docs and runbooks |
| Templates | Golden paths and scaffolding templates |
| Security | Secrets, policies, permissions |
| Settings | Platform and user preferences |

### Module Naming

Use the following module names when a branded module name is needed:

| Module | Purpose |
|---|---|
| CloudWay Catalog | Service catalog |
| CloudWay Create | Project and service scaffolding |
| CloudWay Deploy | Deployment management |
| CloudWay Flow | CI/CD and workflows |
| CloudWay Observe | Logs, metrics, traces, health |
| CloudWay Secure | Secrets, access, policies |
| CloudWay Docs | Documentation and runbooks |
| CloudWay Templates | Golden-path templates |
| CloudWay Environments | Environment management |
| CloudWay Console | Main web dashboard |
| CloudWay CLI | Command-line tool |

---

## 9. CLI Branding

The CLI command should be:

```bash
ashna
```

Use short, predictable commands:

```bash
ashna status
ashna create service
ashna deploy payment-api
ashna logs payment-api
ashna catalog search payment
ashna env list
ashna docs open payment-api
```

CLI banner:

```text
Ashna CloudWay CLI
The familiar path from code to cloud.
```

CLI output style:

```text
✓ Service created: payment-api
✓ Repository connected
✓ Deployment pipeline configured
→ Next: ashna deploy payment-api
```

---

## 10. Page Metadata

Use these values in app metadata, browser title, Open Graph metadata, and manifest files.

```json
{
  "name": "Ashna CloudWay",
  "short_name": "CloudWay",
  "description": "The familiar path from code to cloud.",
  "theme_color": "#000000",
  "background_color": "#000000",
  "display": "standalone"
}
```

Recommended browser titles:

```text
Ashna CloudWay
Ashna CloudWay | Dashboard
Ashna CloudWay | Catalog
Ashna CloudWay | Deployments
Ashna CloudWay | Observability
```

---

## 11. Component Guidelines

### App Shell

- Use black or near-black background.
- Use white logo in the sidebar/header.
- Keep navigation labels short.
- Use high-contrast active states.
- Avoid colorful branding decorations.

### Buttons

Primary button:

- Background: `#FFFFFF`
- Text: `#000000`
- Border: `#FFFFFF`

Secondary button:

- Background: transparent or `#111111`
- Text: `#FFFFFF`
- Border: `#2A2A2A`

Danger button:

- Use semantic red only for destructive actions.

Example CSS:

```css
.acw-button-primary {
  background: var(--acw-brand-white);
  color: var(--acw-brand-black);
  border: 1px solid var(--acw-brand-white);
  border-radius: var(--acw-radius-md);
  font-weight: 600;
}

.acw-button-secondary {
  background: var(--acw-charcoal);
  color: var(--acw-brand-white);
  border: 1px solid var(--acw-border-dark);
  border-radius: var(--acw-radius-md);
  font-weight: 600;
}
```

### Cards

Use dark cards on black background:

```css
.acw-card {
  background: var(--acw-charcoal);
  border: 1px solid var(--acw-border-dark);
  border-radius: var(--acw-radius-lg);
  box-shadow: var(--acw-shadow-sm);
}
```

### Status Pills

Use semantic colors for operational meaning only:

```text
Healthy     success
Degraded    warning
Failed      error
Running     info
Unknown     muted
```

---

## 12. Example React Logo Component

Use this structure when the logo is available as an image asset.

```tsx
export function AshnaCloudWayLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src="/brand/ashna-cloudway-logo-white-on-black.png"
      alt="Ashna CloudWay"
      className={className}
    />
  );
}
```

For a transparent logo variant on a dark surface:

```tsx
export function AshnaCloudWayLogoTransparent({ className = '' }: { className?: string }) {
  return (
    <img
      src="/brand/ashna-cloudway-logo-white-transparent.png"
      alt="Ashna CloudWay"
      className={className}
    />
  );
}
```

---

## 13. Example App Header

```tsx
export function AppHeader() {
  return (
    <header className="acw-header">
      <div className="acw-header__brand">
        <img
          src="/brand/ashna-cloudway-logo-white-transparent.png"
          alt="Ashna CloudWay"
          className="acw-header__logo"
        />
      </div>
      <nav className="acw-header__nav" aria-label="Main navigation">
        <a href="/dashboard">Dashboard</a>
        <a href="/catalog">Catalog</a>
        <a href="/deployments">Deployments</a>
        <a href="/observability">Observability</a>
        <a href="/docs">Documentation</a>
      </nav>
    </header>
  );
}
```

```css
.acw-header {
  min-height: 64px;
  background: var(--acw-brand-black);
  color: var(--acw-brand-white);
  border-bottom: 1px solid var(--acw-border-dark);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.acw-header__logo {
  width: 190px;
  height: auto;
  display: block;
}

.acw-header__nav {
  display: flex;
  align-items: center;
  gap: 20px;
}

.acw-header__nav a {
  color: var(--acw-text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.acw-header__nav a:hover,
.acw-header__nav a[aria-current='page'] {
  color: var(--acw-brand-white);
}
```

---

## 14. Example Login Page

```tsx
export function LoginPage() {
  return (
    <main className="acw-login">
      <section className="acw-login__panel">
        <img
          src="/brand/ashna-cloudway-logo-white-transparent.png"
          alt="Ashna CloudWay"
          className="acw-login__logo"
        />
        <h1>Sign in to Ashna CloudWay</h1>
        <p>Access your internal developer platform.</p>
        <button className="acw-button-primary">Continue with SSO</button>
      </section>
    </main>
  );
}
```

```css
.acw-login {
  min-height: 100vh;
  background: var(--acw-brand-black);
  color: var(--acw-brand-white);
  display: grid;
  place-items: center;
  padding: 32px;
}

.acw-login__panel {
  width: min(100%, 440px);
  background: var(--acw-charcoal);
  border: 1px solid var(--acw-border-dark);
  border-radius: var(--acw-radius-xl);
  padding: 40px;
  box-shadow: var(--acw-shadow-lg);
}

.acw-login__logo {
  width: 280px;
  height: auto;
  display: block;
  margin-bottom: 32px;
}

.acw-login h1 {
  margin: 0 0 8px;
  font-size: 28px;
  line-height: 36px;
}

.acw-login p {
  margin: 0 0 28px;
  color: var(--acw-text-muted);
}
```

---

## 15. Asset Naming

Use predictable filenames.

```text
/public/brand/ashna-cloudway-logo-white-on-black.png
/public/brand/ashna-cloudway-logo-white-transparent.png
/public/brand/ashna-cloudway-logo-black-transparent.png
/public/brand/ashna-cloudway-icon-white-transparent.png
/public/brand/ashna-cloudway-icon-black-transparent.png
/public/favicon.ico
/public/apple-touch-icon.png
/public/icon-192.png
/public/icon-512.png
```

---

## 16. Codex Implementation Checklist

When applying this brand to an existing repository, complete these tasks:

1. Replace old product names with **Ashna CloudWay**.
2. Update browser title, app metadata, manifest, and Open Graph metadata.
3. Add logo assets under `/public/brand` or the project’s equivalent static asset path.
4. Use the white logo on `#000000` for the primary identity.
5. Add brand tokens as CSS variables or theme tokens.
6. Update header/sidebar branding.
7. Update login page branding.
8. Update dashboard hero or welcome area.
9. Rename navigation labels to the approved navigation model where applicable.
10. Use the approved typography stack.
11. Keep the logo monochrome.
12. Do not introduce Persian letters into the logo or brand assets.
13. Do not add gradients, shadows, or decorative logo effects.
14. Check that the logo fits inside its frame with no cropping.
15. Verify light and dark contrast.
16. Ensure the app remains functionally unchanged.

---

## 17. Acceptance Criteria

The branding implementation is complete when:

- The app clearly displays **Ashna CloudWay** as the platform name.
- The primary logo is white on a `#000000` background.
- The logo is not cropped and has correct padding.
- No Persian letters appear in the logo.
- The UI uses monochrome brand colors as the foundation.
- Semantic colors are used only for operational status and feedback.
- Typography is clean and developer-oriented.
- Login, app shell, metadata, and navigation are branded consistently.
- The platform still behaves exactly as before.

---

## 18. One-Line Brand Definition

**Ashna CloudWay is the familiar path from code to cloud for internal engineering teams.**
