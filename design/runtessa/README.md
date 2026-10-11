# Runtessa visual identity

**Selected direction: C — Signal.**

[Selected Signal reference](selected-signal.png)

The selected identity uses a flowing folded ribbon, an open counter, and a
plum, violet, and lilac palette. Keep its proportions, negative space, and
flow when preparing the production logo. Preserve the Runtessa wordmark.

The brand line is:

> Build the application. Keep the platform running.

## Brand applications

Use this direction for the public website, documentation branding, repository
artwork, social previews, and campaign materials. Real IDE screenshots must
retain their original colors when shown on the website or in campaign artwork.

## IDE colors are fixed

The user explicitly selected Signal while requiring the current IDE colors to
remain unchanged. The brand palette must not replace or tint any IDE theme.

Preserve both light and dark themes, application backgrounds, surfaces, borders,
buttons, text, focus and selection colors, syntax highlighting, and semantic
status colors. A future logo replacement must fit the existing surfaces without
requiring a theme change. Prefer a monochrome logo variant inside the IDE if
the full-color mark would distract from the workspace.

The existing implementations remain authoritative:

- [Global styles](../../src/ideNew/src/styles/globals.css)
- [Tailwind theme mapping](../../src/ideNew/tailwind.config.js)
- [Theme selection](../../src/ideNew/src/lib/client/theme.ts)
- Existing editor-specific styles and syntax themes.
- VS Code host theme colors used by the extension.

These source references are relative to this folder; no brand tokens
from this folder should be imported into either IDE.

## Asset status

`selected-signal.png` is the approved visual reference, generated with ImageGen.
It is a raster concept board, not a finished vector logo or an implemented web
page. Production work still requires faithful SVG artwork, a small-size symbol,
light/dark/monochrome exports, and accessible color values for website text.

The former green geometric R kit is archived under
`explorations/rejected-01/`; it is not the selected identity. The GitHub organization is `Runtessa`; `platform` integrates the component repositories.
Runtime identifiers and package names remain compatible.

## GitHub avatar

`github-avatar-1mb.png` is the upload-ready Signal symbol: 1254 × 1254 pixels,
exactly 1,000,000 bytes. Its pixels are identical to `github-avatar.png`; only PNG
encoding and metadata differ. The provenance sidecar records the source digest.
The organization profile uses the approved concept board while private.
