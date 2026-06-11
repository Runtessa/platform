# IdpCore Stabilization & Ownership Plan

> **For Hermes:** Use subagent-driven-development style execution: one focused task at a time, with read-only discovery before changes and review after each batch.

**Goal:** تبدیل IdpCore از یک پروژه بزرگ و dirty به یک codebase قابل‌فهم، قابل‌تست، قابل‌توسعه و امن‌تر، بدون شکستن رفتار فعلی.

**Architecture:** اول نقشه و safety net می‌سازیم، بعد refactorهای کوچک و قابل‌برگشت. تمرکز اصلی روی مرزهای Core/Auth/IDE/Kernel، کاهش god fileها، تثبیت build و audit امنیتی است.

**Tech Stack:** TypeScript, Node.js, Express, Next.js, React, TypeORM, PostgreSQL, Redis, Monaco, Docker Compose.

---

## اصول اجرای تیم

1. هیچ تغییر بزرگی بدون baseline و تست انجام نشود.
2. قبل از هر edit، dirty diff فعلی بررسی و مالکیت تغییرات مشخص شود.
3. generated/build/vendor را دست نزنیم مگر صریحاً لازم باشد:
   - `dist/`
   - `.next/`
   - `src/public/bundle.js`
   - `src/public/bundle.js.map`
   - `src/ideNew/public/monaco/`
   - `node_modules/`
4. هر batch کوچک باشد و بعدش type-check/build/test مرتبط اجرا شود.
5. public API و رفتار runtime حفظ شود؛ اگر لازم شد re-export/shim نگه داریم.
6. مسیر dependency سالم بماند: shared/core → domain → adapters، بدون circular dependency.

---

## فاز 0: تثبیت وضعیت فعلی

### Task 0.1: ثبت وضعیت git و تفکیک تغییرات موجود

**Objective:** بفهمیم تغییرات فعلی متعلق به کدام کار هستند و روی آن‌ها پا نگذاریم.

**Files:** فقط خواندنی.

**Commands:**

```bash
cd /home/adadrass/Projects/IdpCore
git status --short --branch
git diff --stat
git diff -- src/core/server.ts src/core/app/routes/authSsoRoutes.ts
```

**Expected:** فهرست دقیق modified/untrackedها داشته باشیم.

**Output:** یک یادداشت کوتاه از فایل‌های dirty و دسته‌بندی آن‌ها: SSO, kernel, IDE tenant settings, generated bundle.

---

### Task 0.2: baseline build/type-check بدون تغییر کد

**Objective:** بفهمیم پروژه همین الان build/type-check می‌شود یا نه.

**Commands:**

```bash
cd /home/adadrass/Projects/IdpCore
npm run build --if-present
npm --prefix src/core run build --if-present
npm --prefix src/ideNew run type-check --if-present
npm --prefix src/auth run type-check --if-present
npm --prefix src/kernel run build --if-present
```

**Notes:** اگر command طولانی/خراب بود، خروجی را خلاصه کنیم و blocker را ثبت کنیم.

**Expected:** یک ماتریس وضعیت: pass/fail + علت fail.

---

## فاز 1: نقشه رسمی پروژه

### Task 1.1: ساخت Architecture Index

**Objective:** یک index قابل‌اعتماد برای onboarding و تصمیم‌گیری بسازیم.

**Create:**
- `docs/architecture/idpcore-map.md`

**Content:**
- bounded contexts:
  - Core Runtime
  - Auth
  - IDE
  - Kernel
  - Shared Entities
  - Monitoring
  - Container Agent
  - Codex Gateway
  - VS Code Extension
- entrypointهای هر بخش
- dependency direction
- integration points
- envهای مهم

**Validation:**

```bash
npm run docs:build --if-present
```

اگر docs build فعلاً آماده نبود، حداقل markdown lint دستی/خوانایی انجام شود.

---

### Task 1.2: ساخت Reading Order برای بچه‌ها

**Objective:** هر specialist دقیقاً بداند از کجا شروع کند.

**Create:**
- `docs/architecture/reading-order.md`

**Sections:**
- Backend/Core path
- Frontend/IDE path
- Auth/SSO path
- Kernel/Runtime path
- Ops/Infrastructure path

---

## فاز 2: Safety Net تست و build

### Task 2.1: شناسایی تست‌های موجود

**Objective:** بفهمیم چه test frameworkهایی داریم و coverage کجاست.

**Commands:**

```bash
cd /home/adadrass/Projects/IdpCore
find . -path '*/node_modules' -prune -o -path '*/.next' -prune -o -iname '*test*' -print
find . -path '*/node_modules' -prune -o -iname 'jest.config.*' -o -iname 'vitest.config.*' -o -iname 'playwright.config.*' -print
```

**Expected:** فهرست test targets و gaps.

---

### Task 2.2: تعریف smoke checks حداقلی

**Objective:** برای refactorها حداقل محافظ داشته باشیم.

**Likely files:**
- root `package.json`
- `src/core/package.json`
- `src/ideNew/package.json`
- `src/auth/package.json`
- `src/kernel/package.json`

**Approach:** اگر scriptهای موجود کافی نبودند، فقط scriptهای non-invasive اضافه شود:
- `type-check`
- `build`
- `lint` اگر config دارد

**Validation:** همه scriptها اجرا شوند و نتیجه ثبت شود.

---

## فاز 3: Security & Runtime Risk Audit

### Task 3.1: Audit Core exposed admin endpoints

**Objective:** بررسی کنیم endpointهای admin/tenant creation واقعاً محافظت دارند یا نه.

**Read:**
- `src/core/server.ts`
- `src/core/app/controllers/AdminController.ts`
- `src/core/app/middleware/AuthGuard.ts`

**Questions:**
- آیا `/admin/tenants` public است؟
- آیا behind proxy/internal فرض شده؟
- آیا باید bearer/internal token داشته باشد؟

**Deliverable:** تصمیم: secure as-is / add guard / document deployment constraint.

---

### Task 3.2: Audit CORS + credentials

**Objective:** ریسک `origin: true` با credentials را مشخص کنیم.

**Read:**
- `src/core/server.ts`
- `src/auth/server.ts`
- `src/ideNew/src/pages/api/*` where CORS/session applies

**Deliverable:** پیشنهاد allowlist بر اساس env.

---

### Task 3.3: Audit sandbox capability boundary

**Objective:** بفهمیم tenant code دقیقاً به چه adapter/capabilityهایی دسترسی دارد.

**Read:**
- `src/core/engine/SandboxRunner.ts`
- `src/core/engine/AdapterFactory.ts`
- `src/core/engine/sandboxRuntime.ts`
- `src/core/engine/sandboxWorker.ts`

**Deliverable:** capability matrix: DB, Redis, HTTP, S3, Kafka, compiler, shared modules.

---

### Task 3.4: Audit session/token model

**Objective:** دو مدل Auth و IDE/Core را مقایسه و ناسازگاری‌ها را روشن کنیم.

**Read:**
- `src/auth/server.ts`
- `src/auth/lib/*session*`
- `src/ideNew/src/lib/client/session.ts`
- `src/core/app/middleware/AuthGuard.ts`
- `src/core/core/security/*`

**Deliverable:** پیشنهاد مسیر migration یا hardening.

---

## فاز 4: Refactor کوچک و کم‌ریسک Core

### Task 4.1: Split SSO route registration اگر تغییرات فعلی همین مسیر است

**Objective:** SSO routeها کوچک، قابل‌تست و قابل‌فهم شوند.

**Likely files:**
- `src/core/app/routes/authSsoRoutes.ts`
- `src/core/app/routes/authSsoStart.ts`
- `src/core/app/routes/authSsoCallback.ts`
- `src/core/app/routes/authSsoSessionRoutes.ts`
- `src/core/app/routes/authSsoRouteUtils.ts`
- `src/core/app/routes/authSsoRouteTypes.ts`

**Validation:**

```bash
npm --prefix src/core run build
```

**Rule:** behavior و route paths عوض نشود.

---

### Task 4.2: RegistryController decomposition

**Objective:** `RegistryController.ts` را بدون تغییر public behavior به serviceهای کوچک‌تر تقسیم کنیم.

**Likely files:**
- `src/core/app/controllers/RegistryController.ts`
- Create maybe:
  - `src/core/app/services/registry/RegistryCatalogService.ts`
  - `src/core/app/services/registry/RegistryResolverService.ts`
  - `src/core/app/services/registry/RegistryPackageSerializer.ts`

**Validation:**

```bash
npm --prefix src/core run build
```

**Risk:** registry/kernel coupling؛ اول tests/smoke لازم است.

---

## فاز 5: Refactor Kernel Runtime

### Task 5.1: Document current Kernel public API

**Objective:** قبل از split بدانیم چه globalها و behaviorهایی نباید بشکنند.

**Read:**
- `src/kernel/src/index.ts`
- `src/public/index.html`
- `src/public/preview.html`
- `src/core/server.ts` بخش `/kernel-source.js`

**Deliverable:**
- `docs/architecture/kernel-runtime-contract.md`

---

### Task 5.2: Split package loading/cache/runtime eval

**Objective:** `src/kernel/src/index.ts` کوچک‌تر شود.

**Likely files:**
- `src/kernel/src/index.ts`
- `src/kernel/src/packageCache.ts`
- Create maybe:
  - `src/kernel/src/packageLoader.ts`
  - `src/kernel/src/runtimeRequire.ts`
  - `src/kernel/src/styleInjector.ts`
  - `src/kernel/src/sessionRuntime.ts`

**Validation:**

```bash
npm --prefix src/kernel run build
```

**Rule:** `window.Kernel` و boot behavior حفظ شود.

---

## فاز 6: Refactor IDE Editor

### Task 6.1: Freeze editor behavior with smoke checklist

**Objective:** چون `editor.tsx` خیلی بزرگ است، قبل از split یک checklist دستی/خودکار داشته باشیم.

**Read:**
- `src/ideNew/src/pages/editor.tsx`
- `src/ideNew/src/components/editor/*`
- `src/ideNew/src/lib/monaco.ts`

**Checklist:**
- load editor
- open file
- edit file
- preview
- diff
- staging
- AI panel
- history panel
- search panel

---

### Task 6.2: Extract editor state/hooks in tiny batches

**Objective:** `editor.tsx` را بدون rewrite تکه‌تکه کوچک کنیم.

**Likely create:**
- `src/ideNew/src/components/editor/hooks/useEditorTabs.ts`
- `src/ideNew/src/components/editor/hooks/useEditorPreview.ts`
- `src/ideNew/src/components/editor/hooks/useEditorPersistence.ts`
- `src/ideNew/src/components/editor/hooks/useEditorKeyboardShortcuts.ts`

**Validation:**

```bash
npm --prefix src/ideNew run type-check
```

**Rule:** هر batch حداکثر 1 concept.

---

## فاز 7: Auth/Core Integration Hardening

### Task 7.1: Document Core/Auth ownership boundary

**Objective:** از انتقال اشتباه مسئولیت‌ها جلوگیری کنیم.

**Modify/Create:**
- `docs/core-auth-multitenant-context.md` یا سند مکمل

**Content:**
- Auth owns identity/OAuth/profile/org role
- Core owns runtime tenant config/modules/ACL/adapters
- sync points
- forbidden coupling

---

### Task 7.2: Make SSO env/config validation explicit

**Objective:** startup در حالت config ناقص، خطای واضح بدهد.

**Likely files:**
- `src/core/core/security/ssoPrimitives.ts`
- `src/core/app/routes/authSsoRouteUtils.ts`
- `src/auth/lib/config/*`

**Validation:**

```bash
npm --prefix src/core run build
npm --prefix src/auth run type-check
```

---

## فاز 8: Dependency & Build Reproducibility

### Task 8.1: Remove risky `latest` dependencies where possible

**Objective:** build آینده قابل‌تکرار شود.

**Likely files:**
- `src/ideNew/package.json`
- maybe root `package.json`

**Approach:** اول فقط گزارش و پیشنهاد نسخه؛ بعد با اجازه کاربر lock کنیم.

**Validation:**

```bash
npm install --package-lock-only
npm --prefix src/ideNew run type-check
```

---

### Task 8.2: Decide policy for committed build artifacts

**Objective:** روشن کنیم `src/public/bundle.js` و mapها باید commit شوند یا generated محسوب شوند.

**Read:**
- `src/kernel/webpack.config.js`
- `src/public/index.html`
- `.gitignore`
- deployment docs

**Deliverable:** decision note.

---

## فاز 9: Execution Workflow با تیم One Piece

### Luffy / Coordinator
- scope taskها را کوچک می‌کند.
- dirty diff را محافظت می‌کند.
- verification را enforce می‌کند.

### Zoro / Backend
- Core Runtime
- SSO routes
- Dispatcher
- RegistryController
- Sandbox/Adapter audit

### Nami / Frontend UI
- `src/ideNew`
- editor split
- auth UI consistency
- theme/design system

### Usopp / QA Review
- baseline test matrix
- smoke checklist
- regression review
- security checklist sanity

### Franky / DevOps Infra
- docker-compose
- env/deployment
- monitoring/container-agent/codex-gateway
- reproducible build

### Robin / Architecture Research
- docs/architecture map
- module boundaries
- ownership rules
- dependency/circular checks

---

## اولویت پیشنهادی اجرا

1. فاز 0: baseline و dirty-state protection
2. فاز 1: architecture index
3. فاز 2: safety net
4. فاز 3: security audit سریع
5. فاز 4: SSO/Core cleanup چون همین الان در diffها فعال است
6. فاز 5: Kernel split
7. فاز 6: IDE editor split
8. فاز 8: dependency/build reproducibility

---

## Definition of Done برای هر batch

- فقط فایل‌های scoped تغییر کرده باشند.
- generated/vendor بی‌دلیل تغییر نکرده باشد.
- `git diff --stat` کوچک و قابل‌توضیح باشد.
- build/type-check مربوطه pass یا blocker دقیق ثبت شود.
- اگر behavior تغییر کرده، مستند شده باشد.
- اگر security risk پیدا شده، issue/action مشخص داشته باشد.
