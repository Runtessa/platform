# Current Auth Layout Design (As-Is)

This document describes the **current implemented UI layout** in `src/auth` so it can be used as input for redesign with another AI.

## Scope

- Project: `src/auth`
- Main shell/layout files:
  - `components/layout/AdminShell.tsx`
  - `pages/profile.tsx`
  - `components/profile/SidebarNav.tsx`
  - `components/profile/MobileBottomNav.tsx`
  - `components/profile/ProfileSectionContent.tsx`

## 1) Global Page Shell

- Background: light gray `#F6F8FC`.
- Main wrapper is full-height: `min-h-screen`.
- Language toggle is fixed at top corner:
  - LTR: top-right
  - RTL: top-left
- Desktop layout:
  - Left fixed sidebar area (`280px`).
  - Main content area to the right.
- Mobile layout:
  - Bottom navigation bar replaces desktop sidebar.

## 2) Sidebar (Desktop)

### Positioning

- Sidebar nav card is fixed and vertically centered:
  - `top: 50%` + `translateY(-50%)`
- Width: `280px`.
- Side offset from viewport edge: `0.75rem`.
- Keeps position while main content scrolls.

### Logo placement

- Logo is **not inside nav card**.
- Logo is fixed at top corner of viewport on desktop (`md+`):
  - LTR: top-left
  - RTL: top-right
- Asset: `/images/lw_dark.png`.

### Sidebar visual style

- Card style uses rounded container:
  - radius approx `24px`
  - padding `p-6` plus internal `p-3` on nav wrapper
- Nav item style:
  - Rounded pill buttons
  - Icon + label row
  - Active: blue-tinted background (`#E8F0FE`), text `#1A73E8`
  - Inactive: text `#5F6368`, hover gray background

## 3) Top Utility Controls

- Language toggle is floating/fixed near top corner.
- Direction-aware placement based on locale (`ltr` / `rtl`).

## 4) Main Content Container

- In `AdminShell`: children rendered in centered inner container with `max-w-[85%]`.
- In `profile` page:
  - Main content region is flexible and centered.
  - Section content is rendered based on selected rail item.

## 5) Profile Page Information Architecture

### Active sections (after privacy removal)

- `home`
- `personal-info`
- `contact-info`
- `security`
- `two-factor`

### Removed section

- `data-privacy` is removed from nav and rendering.

### Section rendering

- `ProfileSectionContent` conditionally renders one section by `activeRail`.

## 6) Home Section (Current)

- Centered card with:
  - Circular avatar + camera action button.
  - Welcome title and subtitle.
  - Last login, last seen, email chips.
  - Optional `Open Auth Admin` button for admin users.
- Avatar display source:
  - `detailsForm.avatarUrl` first, fallback to `profile.user.avatarUrl`.

## 7) Avatar Flow (Current Behavior)

- Upload endpoint:
  - `POST /api/profile/avatar/upload` (binary image payload).
- Persist behavior:
  - After upload, frontend calls `POST /api/profile/details` including:
    - profile required fields (`firstName`, `lastName`, `nationalId`, `phoneNumber`)
    - `avatarUrl`
    - `birthday`, `gender`
- Result:
  - Avatar is persisted in user profile meta and survives refresh.

## 8) Mobile Navigation

- Fixed bottom nav with 5 slots:
  - primary items before home
  - center home FAB-style button
  - primary items after home
  - overflow "More" menu
- Overflow menu contains secondary rail items and logout.

## 9) Color / Style Tokens Currently Used (Hardcoded)

- Primary blue: `#1A73E8`
- Active tint: `#E8F0FE`
- Text primary: `#202124`
- Text secondary: `#5F6368`
- Border gray: `#DADCE0`, `#E8EAED`
- Page bg: `#F6F8FC`

Note: These are mostly hardcoded utility classes; there is no single centralized design token file for this page yet.

## 10) Directionality (RTL/LTR)

- Container `dir` set from locale.
- Sidebar/logo and language-toggle corner placement are direction-aware.
- Text alignment in many nav/menu controls switches based on `isRtl`.

## 11) Known Structural Characteristics

- Sidebar is fixed; content scrolls independently.
- Layout mixes percentage-based content width (`85%`) and fixed sidebar width.
- Uses Tailwind utility classes directly in components.
- Separate shell patterns exist for admin and profile (shared look, different components).

## 12) Source Files to Give AI for Redesign

If another AI needs exact context, provide these files together:

- `src/auth/components/layout/AdminShell.tsx`
- `src/auth/pages/profile.tsx`
- `src/auth/components/profile/SidebarNav.tsx`
- `src/auth/components/profile/MobileBottomNav.tsx`
- `src/auth/components/profile/ProfileSectionContent.tsx`
- `src/auth/components/profile/sections/HomeSection.tsx`
- `src/auth/components/profile/config.tsx`
- `src/auth/components/profile/hooks/useProfileNavigation.ts`

