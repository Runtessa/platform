import React from "react";
import { createRoot } from "react-dom/client";
import * as ReactRouter from "react-router";
import * as ReactRouterDom from "react-router-dom";
import {
  BrowserPackageCache,
  RegistryPackageCatalog,
  RegistryPackageCatalogEntry,
  RegistryPackageMetadata,
  RegistryPackagePayload,
} from "./packageCache";
import { normalizeRouteManifest } from "./routeManifest";
import { createKernelRouterElement } from "./routerRuntime";

window.React = React;
interface Options {
  registryUrl?: string;
  apiBaseUrl?: string;
  tenantHost?: string;
  preview?: boolean;
  redirectOnUnauthorized?: boolean;
}

type ApiRequestOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  rawBody?: BodyInit | null;
  json?: boolean;
  redirectOnUnauthorized?: boolean;
};

type ApiClient = {
  request: (path: string, options?: ApiRequestOptions) => Promise<Response>;
  get: (path: string, options?: Omit<ApiRequestOptions, "method" | "body">) => Promise<Response>;
  post: (path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) => Promise<Response>;
  put: (path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) => Promise<Response>;
  del: (path: string, options?: Omit<ApiRequestOptions, "method" | "body">) => Promise<Response>;
};

type KernelDataContext = {
  api: ApiClient;
  tenantHost: string | null;
  previewMode: boolean;
  getToken: () => string | null;
};

const DATA_CONTEXT_PACKAGE_NAMES = new Set([
  "@app/datacontext",
  "@idp/datacontext",
  "idp/datacontext",
]);
const KERNEL_BUILTIN_MODULES = new Set([
  "react",
  "React",
  "react-dom",
  "react-dom/client",
  "react-router",
  "react-router-dom",
  "react-router/dom",
  ...Array.from(DATA_CONTEXT_PACKAGE_NAMES),
]);

export class Kernel {
  registryUrl: string;
  apiBaseUrl: string;
  tenantHost: string | null;
  previewMode: boolean;
  cache: Map<string, any>;
  api: ApiClient;
  private appliedStyles: Map<string, HTMLStyleElement>;
  private dataContextExports: any | null;
  private authRedirectInFlight: boolean;
  private renewIntervalId: number | null;
  private renewPending: boolean;
  private lastRenewAtMs: number;
  private previewErrorBoundaryType: React.ComponentType<{ children?: React.ReactNode }> | null;
  private redirectOnUnauthorized: boolean;
  private packageCache: BrowserPackageCache | null;
  private packageCatalogPromise: Promise<RegistryPackageCatalog | null> | null;
  private static previewReactGuardInstalled = false;

  constructor(options: Options = {}) {
    this.registryUrl = (options && options.registryUrl) || "/api/registry";
    this.apiBaseUrl = (options && options.apiBaseUrl) || "";
    this.tenantHost = (options && options.tenantHost) || null;
    this.previewMode = Boolean(options && options.preview);
    this.redirectOnUnauthorized = Boolean(options && options.redirectOnUnauthorized);
    this.cache = new Map(); // key: name@version -> exports or Promise<exports>
    this.appliedStyles = new Map();
    this.dataContextExports = null;
    this.authRedirectInFlight = false;
    this.renewIntervalId = null;
    this.renewPending = false;
    this.lastRenewAtMs = 0;
    this.previewErrorBoundaryType = null;
    this.packageCache = null;
    this.packageCatalogPromise = null;
    this.api = this.createApiClient();
    this.initGlobalContext();
    if (!this.previewMode) {
      this.packageCache = new BrowserPackageCache();
    }
    this.installPreviewReactGuard();
    this.initSessionRenewal();
    this.initPwaSupport();
  }

  async load(name: string, version: string = "latest") {
    const cacheKey = `${name}@${version || "latest"}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached.then ? await cached : cached;
    }

    const promise = this.fetchAndEval(name, version).then((exports) => {
      this.cache.set(cacheKey, exports);
      return exports;
    });

    this.cache.set(cacheKey, promise);
    return promise;
  }

  async fetchAndEval(name: string, version: string) {
    const requestVersion = version || "latest";
    const payload = await this.resolveRegistryPayload(name, requestVersion);
    const dependencies = [...(payload.dependencies || [])];
    const fileExtension = (payload.fileExtension || "js").toLowerCase();
    const cacheKey = `${name}@${requestVersion}`;
    const resolvedVersion = this.resolveRegistryVersion(payload, requestVersion);

    const resolveDependencySpecifier = (request: string) =>
      this.resolveRuntimeRequestSpecifier(name, request);

    // Pre-load dependencies in parallel to reduce boot latency.
    const repairedSource = this.repairBrokenCommonJsExports(
      name,
      payload.source || "",
      fileExtension
    );
    const discoveredDependencies = this.extractStaticRequireDependencies(
      repairedSource,
      resolveDependencySpecifier
    );
    const preloadList = Array.from(
      new Set(
        [...dependencies, ...discoveredDependencies]
          .map((dep) => String(dep || "").trim())
          .filter(Boolean)
      )
    );

    const preloadTasks = preloadList.map(async (dep) => {
      if (KERNEL_BUILTIN_MODULES.has(dep)) {
        return;
      }
      const isTailwindDependency = dep.endsWith("__tw");
      if (isTailwindDependency) {
        try {
          await this.load(dep);
        } catch {
          // Tailwind companion packages are optional.
          // We tolerate missing "*__tw" for both explicit and auto-attached dependencies.
        }
        return;
      }
      await this.load(dep);
    });
    await Promise.all(preloadTasks);

    if (fileExtension === "css") {
      const cssText = payload.source || "";
      const styleElement = this.injectCss(cacheKey, cssText);
      return {
        fileExtension,
        cssText,
        styleElement,
      };
    }

    const module = { exports: {} as any };
    const require = (pkgName: string) => this.requireLocal(pkgName);
    const source = this.attachRuntimeSourceMetadata(
      name,
      requestVersion,
      fileExtension,
      this.decorateBundleSource(repairedSource)
    );
    const factory = new Function(
      "module",
      "exports",
      "require",
      "React",
      source,
    );
    const result = factory(module, module.exports, require, React);
    if (result !== undefined) {
      module.exports = result;
    }
    if (
      module.exports &&
      (typeof module.exports === "object" || typeof module.exports === "function")
    ) {
      (module.exports as any).__kernelPackageName = `${name}@${resolvedVersion}`;
    }
    module.exports = this.wrapExports(module.exports);
    module.exports = this.normalizeDefaultExportInterop(module.exports);
    return module.exports;
  }

  private async resolveRegistryPayload(name: string, version: string) {
    const requestVersion = version || "latest";
    if (!this.packageCache || !this.packageCache.isAvailable()) {
      const { payload } = await this.fetchRegistryPayload(name, requestVersion);
      return payload;
    }

    const catalog = await this.loadPackageCatalog();
    const catalogEntry = this.findCatalogEntry(catalog, name, requestVersion);

    if (requestVersion !== "latest") {
      const cached = await this.packageCache.getPayload(name, requestVersion);
      if (cached?.source && this.isCachedPayloadFresh(cached, catalogEntry)) {
        return cached;
      }
      if (cached && catalogEntry) {
        await this.packageCache.deletePayload(name, requestVersion);
      }
      const { payload } = await this.fetchRegistryPayload(name, requestVersion);
      await this.persistRegistryPayload(name, requestVersion, payload);
      return payload;
    }

    const latestAlias = await this.packageCache.getLatestAlias(name);
    if (latestAlias?.resolvedVersion) {
      const cached = await this.packageCache.getPayload(name, latestAlias.resolvedVersion);
      if (cached?.source && catalogEntry) {
        const resolvedVersion = this.resolveRegistryVersion(catalogEntry, requestVersion);
        if (
          resolvedVersion === latestAlias.resolvedVersion &&
          this.isCachedPayloadFresh(cached, catalogEntry)
        ) {
          return cached;
        }
        await this.packageCache.clearLatestAlias(name);
        await this.packageCache.deletePayload(name, latestAlias.resolvedVersion);
      } else if (cached?.source) {
        try {
          const { payload: metadata } = await this.fetchRegistryMetadata(name, requestVersion);
          const resolvedVersion = this.resolveRegistryVersion(metadata, requestVersion);
          if (
            resolvedVersion === latestAlias.resolvedVersion &&
            this.isCachedPayloadFresh(cached, metadata)
          ) {
            return cached;
          }
        } catch {
          return cached;
        }
        await this.packageCache.clearLatestAlias(name);
        await this.packageCache.deletePayload(name, latestAlias.resolvedVersion);
      } else {
        await this.packageCache.clearLatestAlias(name);
      }
    }

    const { payload } = await this.fetchRegistryPayload(name, requestVersion);
    await this.persistRegistryPayload(name, requestVersion, payload);
    return payload;
  }

  private async persistRegistryPayload(
    name: string,
    requestVersion: string,
    payload: RegistryPackagePayload,
  ) {
    if (!this.packageCache || !this.packageCache.isAvailable()) return;
    const resolvedVersion = this.resolveRegistryVersion(payload, requestVersion);
    await this.packageCache.putPayload(name, resolvedVersion, resolvedVersion, payload);
    if (requestVersion === "latest") {
      await this.packageCache.putLatestAlias(name, resolvedVersion, payload.cacheKey);
    }
  }

  private async fetchRegistryPayload(name: string, version: string) {
    return this.fetchRegistryJson<RegistryPackagePayload>(name, version, false);
  }

  private async fetchRegistryMetadata(name: string, version: string) {
    return this.fetchRegistryJson<RegistryPackageMetadata>(name, version, true);
  }

  private async loadPackageCatalog() {
    if (!this.packageCache || !this.packageCache.isAvailable()) return null;
    if (this.packageCatalogPromise) return this.packageCatalogPromise;

    this.packageCatalogPromise = this.fetchRegistryCatalog()
      .then(async (catalog) => {
        await this.packageCache?.putCatalog(catalog);
        return catalog;
      })
      .catch(async () => this.packageCache?.getCatalog() ?? null);

    return this.packageCatalogPromise;
  }

  private async fetchRegistryCatalog() {
    const url = this.buildRegistryCatalogUrl();
    const response = await fetch(url, {
      headers: this.buildAuthHeaders(),
      credentials: "include",
    });
    this.maybeHandleUnauthorized(response, { requestUrl: url });
    if (!response.ok) {
      throw new Error(`Failed to fetch registry catalog (${response.status})`);
    }
    return (await response.json()) as RegistryPackageCatalog;
  }

  private findCatalogEntry(
    catalog: RegistryPackageCatalog | null,
    packageName: string,
    requestVersion: string,
  ) {
    if (!catalog?.packages?.length) return null;
    const normalizedName = String(packageName || "").trim();
    const normalizedVersion = String(requestVersion || "latest").trim() || "latest";
    const matchesName = (entry: RegistryPackageCatalogEntry) =>
      entry.name === normalizedName || Boolean(entry.aliases?.includes(normalizedName));
    const matches = catalog.packages.filter(matchesName);
    if (matches.length === 0) return null;
    if (normalizedVersion === "latest") {
      return matches[0] ?? null;
    }
    return (
      matches.find((entry) => entry.version === normalizedVersion) ??
      matches.find((entry) => entry.packageVersion === normalizedVersion) ??
      null
    );
  }

  private isCachedPayloadFresh(
    payload: RegistryPackagePayload,
    metadata: Pick<RegistryPackageMetadata, "version" | "packageVersion" | "cacheKey"> | null,
  ) {
    if (!metadata) return true;
    const cachedVersion = this.resolveRegistryVersion(payload, payload.version || "latest");
    const latestVersion = this.resolveRegistryVersion(metadata, cachedVersion);
    if (cachedVersion !== latestVersion) return false;
    if (metadata.cacheKey && payload.cacheKey && metadata.cacheKey !== payload.cacheKey) {
      return false;
    }
    return true;
  }

  private async fetchRegistryJson<T>(
    name: string,
    version: string,
    metadataOnly: boolean,
  ) {
    const requestVersion = version || "latest";
    const headers = this.buildAuthHeaders();

    const attemptFetch = async (requestedName: string) => {
      const url = this.buildRegistryUrl(requestedName, requestVersion, metadataOnly);
      const response = await fetch(url, {
        headers,
        credentials: "include",
      });
      this.maybeHandleUnauthorized(response, { requestUrl: url });
      return { requestedName, url, response };
    };

    let attempt = await attemptFetch(name);

    if (!attempt.response.ok && attempt.response.status === 404) {
      const fallbackName = String(name || "").replace(
        /\.(css|js|jsx|ts|tsx|json)$/i,
        "",
      );
      if (fallbackName && fallbackName !== name) {
        const fallbackAttempt = await attemptFetch(fallbackName);
        if (fallbackAttempt.response.ok) {
          attempt = fallbackAttempt;
        }
      }
    }

    if (!attempt.response.ok) {
      throw new Error(
        `Failed to fetch package ${attempt.requestedName}@${requestVersion} (${attempt.response.status})`,
      );
    }

    return {
      resolvedName: attempt.requestedName,
      payload: (await attempt.response.json()) as T,
    };
  }

  private buildRegistryUrl(
    packageName: string,
    version: string,
    metadataOnly = false,
  ) {
    const base = `${this.registryUrl}/${encodeURIComponent(
      packageName,
    )}/${encodeURIComponent(version || "latest")}`;
    if (!metadataOnly) return base;
    return `${base}?meta=1`;
  }

  private buildRegistryCatalogUrl() {
    const base = this.registryUrl.replace(/\/+$/, "");
    if (base.endsWith("/registry-tenant")) {
      return `${base.slice(0, -"/registry-tenant".length)}/registry-tenant-catalog`;
    }
    if (base.endsWith("/registry")) {
      return `${base.slice(0, -"/registry".length)}/registry-catalog`;
    }
    return `${base}/catalog`;
  }

  private resolveRegistryVersion(
    payload: Pick<RegistryPackagePayload, "version" | "packageVersion">,
    fallbackVersion: string,
  ) {
    const resolved = String(payload.version || payload.packageVersion || fallbackVersion || "latest")
      .trim();
    return resolved || fallbackVersion || "latest";
  }

  private repairBrokenCommonJsExports(
    packageName: string,
    source: string,
    fileExtension?: string
  ) {
    const ext = String(fileExtension || "")
      .trim()
      .toLowerCase();
    if (!source || typeof source !== "string") return source;
    if (ext !== "js" && ext !== "jsx") return source;

    const hasExportsSyntax =
      source.includes("exports.") ||
      source.includes("module.exports") ||
      source.includes("Object.defineProperty(exports");
    if (hasExportsSyntax) return source;

    const packageTail = String(packageName || "")
      .trim()
      .split("/")
      .pop();
    if (!packageTail) return source;
    const inferred = packageTail
      .split(/[^a-zA-Z0-9]+/g)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    if (!inferred) return source;

    const declarationRegex = new RegExp(
      `\\b(?:function|var|let|const|class)\\s+${inferred}\\b`
    );
    if (!declarationRegex.test(source)) return source;

    const patch = `
;try {
  if (typeof ${inferred} !== 'undefined') {
    if (typeof module === 'object' && module) {
      if (!module.exports || (typeof module.exports !== 'object' && typeof module.exports !== 'function')) {
        module.exports = {};
      }
      if (typeof module.exports.default === 'undefined') module.exports.default = ${inferred};
      if (typeof module.exports.${inferred} === 'undefined') module.exports.${inferred} = ${inferred};
    }
    if (typeof exports === 'object' && exports) {
      if (typeof exports.default === 'undefined') exports.default = ${inferred};
      if (typeof exports.${inferred} === 'undefined') exports.${inferred} = ${inferred};
    }
  }
} catch (e) {}
`;

    return `${source}\n${patch}`;
  }

  private initPwaSupport() {
    if (typeof window === "undefined") return;
    if (this.previewMode) return;
    if (!("serviceWorker" in navigator)) return;
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifest?.href) return;

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js", { scope: "/" })
        .catch(() => {
          // PWA support is optional; boot must not fail if registration is blocked.
        });
    });
  }

  private initGlobalContext() {
    if (typeof window === "undefined") return;
    const win = window as any;
    if (win.__IDP_TENANT_HOST__) {
      this.tenantHost = win.__IDP_TENANT_HOST__ || this.tenantHost;
    }
    if (win.__IDP_API_BASE__) {
      this.apiBaseUrl = win.__IDP_API_BASE__ || this.apiBaseUrl;
    }
    if (win.__IDP_PREVIEW__) {
      this.previewMode = true;
    }
    if (typeof win.__IDP_REDIRECT_ON_UNAUTHORIZED__ !== "undefined") {
      this.redirectOnUnauthorized = Boolean(win.__IDP_REDIRECT_ON_UNAUTHORIZED__);
    }
    win.IDP = win.IDP || {};
    win.IDP.kernel = this;
    win.IDP.api = this.api;
    win.IDP.getToken = () => this.getToken();
    win.IDP.datacontext = this.getDataContextModule();
  }

  private getToken() {
    if (typeof window === "undefined") return null;
    return window.localStorage?.getItem("idp_token") || null;
  }

  private getTenantHost() {
    if (this.tenantHost) return this.tenantHost;
    if (typeof window === "undefined") return null;
    return (window as any).__IDP_TENANT_HOST__ || null;
  }

  private buildReturnTo() {
    if (typeof window === "undefined") return "/";
    const { pathname, search, hash } = window.location;
    return `${pathname || "/"}${search || ""}${hash || ""}`;
  }

  redirectToLogin() {
    if (typeof window === "undefined") return;
    if (this.authRedirectInFlight) return;
    this.authRedirectInFlight = true;
    const returnTo = this.buildReturnTo();
    const next = `/login?returnTo=${encodeURIComponent(returnTo)}`;
    window.location.assign(next);
  }

  private shouldSkipUnauthorizedRedirect(requestUrl?: string) {
    if (!requestUrl) return false;
    const toPath = (value: string) => {
      try {
        if (typeof window !== "undefined") {
          return new URL(value, window.location.origin).pathname;
        }
        return new URL(value).pathname;
      } catch {
        return value.split("?")[0].split("#")[0];
      }
    };
    const pathname = toPath(requestUrl);
    return pathname === "/api/auth/session" || pathname === "/api/auth/session/renew";
  }

  private maybeHandleUnauthorized(
    res: Response,
    options: {
      requestUrl?: string;
      redirectOnUnauthorized?: boolean;
    } = {},
  ) {
    if (res.status !== 401) return;
    if (this.previewMode) return;
    if (!this.redirectOnUnauthorized) return;
    if (options.redirectOnUnauthorized === false) return;
    if (this.shouldSkipUnauthorizedRedirect(options.requestUrl || res.url || "")) return;
    this.redirectToLogin();
  }

  private async renewTenantSession(force = false) {
    if (typeof window === "undefined") return;
    if (this.previewMode) return;
    if (this.renewPending) return;
    const now = Date.now();
    if (!force && now - this.lastRenewAtMs < 45_000) return;

    this.renewPending = true;
    try {
      await fetch(this.resolveApiUrl("/api/auth/session/renew"), {
        method: "POST",
        credentials: "include",
        headers: this.buildAuthHeaders(),
      });
      this.lastRenewAtMs = Date.now();
    } catch {
      // ignore keepalive errors; next request can recover session state
    } finally {
      this.renewPending = false;
    }
  }

  private initSessionRenewal() {
    if (typeof window === "undefined") return;
    if (this.previewMode) return;

    const onUserActivity = () => {
      void this.renewTenantSession(false);
    };

    this.renewIntervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void this.renewTenantSession(false);
    }, 120_000);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void this.renewTenantSession(true);
      }
    });
    window.addEventListener("focus", () => {
      void this.renewTenantSession(true);
    });
    window.addEventListener("pointerdown", onUserActivity, { passive: true });
    window.addEventListener("keydown", onUserActivity);
    window.addEventListener("scroll", onUserActivity, { passive: true });
  }

  private buildAuthHeaders(extra?: HeadersInit) {
    const headers = new Headers(extra || {});
    const tenantHost = this.getTenantHost();
    if (tenantHost && !headers.has("X-Tenant-Host")) {
      headers.set("X-Tenant-Host", tenantHost);
    }
    if (this.previewMode && !headers.has("X-Dev-Preview")) {
      const stage =
        typeof window !== "undefined"
          ? String((window as any).__IDP_PREVIEW_STAGE__ || "").trim().toLowerCase()
          : "";
      headers.set("X-Dev-Preview", stage === "published" ? "0" : "1");
    }
    return headers;
  }

  private installPreviewReactGuard() {
    if (!this.previewMode) return;
    if (Kernel.previewReactGuardInstalled) return;

    const reactAny = React as any;
    const originalCreateElement =
      reactAny && typeof reactAny.createElement === "function"
        ? reactAny.createElement.bind(reactAny)
        : null;
    if (!originalCreateElement) return;

    const isLikelyValidType = (type: any) => {
      if (typeof type === "string" || typeof type === "function" || typeof type === "symbol") {
        return true;
      }
      if (!type || typeof type !== "object") return false;
      return Boolean((type as any).$$typeof);
    };

    reactAny.createElement = function patchedCreateElement(type: any, ...args: any[]) {
      if (!isLikelyValidType(type)) {
        const typeDescription =
          type === undefined
            ? "undefined"
            : type === null
              ? "null"
              : Array.isArray(type)
                ? "array"
                : typeof type;
        const hint =
          "Preview render error: invalid React element type (" +
          typeDescription +
          "). This usually means an import/export mismatch (default vs named), wrong package path, or missing route component export.";
        throw new Error(hint);
      }
      return originalCreateElement(type, ...args);
    };

    Kernel.previewReactGuardInstalled = true;
  }

  private getPreviewErrorBoundaryType() {
    if (this.previewErrorBoundaryType) {
      return this.previewErrorBoundaryType;
    }
    const kernel = this;

    class PreviewErrorBoundary extends React.Component<
      { children?: React.ReactNode },
      { errorMessage: string | null }
    > {
      constructor(props: { children?: React.ReactNode }) {
        super(props);
        this.state = { errorMessage: null };
      }

      static getDerivedStateFromError(error: unknown) {
        const fallback = "Unknown preview render error";
        if (error instanceof Error && error.message) {
          return { errorMessage: error.message };
        }
        return { errorMessage: String(error || fallback) };
      }

      componentDidCatch(error: unknown, info: React.ErrorInfo) {
        if (typeof window === "undefined") return;
        if (!window.parent || window.parent === window) return;
        const errorMessage =
          error instanceof Error
            ? error.message || "Unknown preview render error"
            : String(error || "Unknown preview render error");
        const stack = error instanceof Error && error.stack ? String(error.stack) : "";
        try {
          window.parent.postMessage(
            {
              source: "idp-preview-exception",
              payload: {
                id: `react-boundary-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                kind: "react-render-error",
                level: "error",
                message: errorMessage,
                stack,
                componentStack: info?.componentStack || "",
                createdAt: new Date().toISOString(),
                previewSession:
                  typeof (window as any).__IDP_PREVIEW_SESSION__ === "string"
                    ? String((window as any).__IDP_PREVIEW_SESSION__)
                    : "",
                previewStage:
                  typeof (window as any).__IDP_PREVIEW_STAGE__ === "string"
                    ? String((window as any).__IDP_PREVIEW_STAGE__)
                    : "",
                tenantHost: kernel.getTenantHost() || "",
                href: window.location.href,
              },
            },
            "*"
          );
        } catch {
          // ignore parent channel errors
        }
      }

      render() {
        if (this.state.errorMessage) {
          return React.createElement(
            "pre",
            {
              style: {
                margin: "16px",
                padding: "12px",
                border: "1px solid #ef4444",
                borderRadius: "8px",
                background: "#111827",
                color: "#f9fafb",
                whiteSpace: "pre-wrap",
                fontSize: "12px",
                lineHeight: "1.4",
              },
            },
            `Preview render error\n${this.state.errorMessage}`
          );
        }
        return this.props.children as any;
      }
    }

    this.previewErrorBoundaryType = PreviewErrorBoundary;
    return this.previewErrorBoundaryType;
  }

  private resolveApiUrl(path: string, baseUrl?: string) {
    if (/^https?:\/\//i.test(path)) return path;
    const base = (baseUrl ?? this.apiBaseUrl ?? "").replace(/\/$/, "");
    if (!base) return path;
    return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  }

  private createApiClient(baseUrl?: string): ApiClient {
    const request = async (path: string, options: ApiRequestOptions = {}) => {
      const url = this.resolveApiUrl(path, baseUrl);
      const headers = this.buildAuthHeaders(options.headers);
      let body: BodyInit | null | undefined = options.rawBody ?? null;
      if (body == null && options.body !== undefined) {
        if (options.body instanceof FormData || options.body instanceof Blob) {
          body = options.body as BodyInit;
        } else {
          body = JSON.stringify(options.body);
          if (!headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
          }
        }
      }
      return fetch(url, {
        credentials: "include",
        method: options.method ?? "GET",
        headers,
        body: body ?? undefined,
      }).then((res) => {
        this.maybeHandleUnauthorized(res, {
          requestUrl: url,
          redirectOnUnauthorized: options.redirectOnUnauthorized,
        });
        return res;
      });
    };
    return {
      request,
      get: (path, options) => request(path, { ...options, method: "GET" }),
      post: (path, body, options) =>
        request(path, { ...options, method: "POST", body }),
      put: (path, body, options) =>
        request(path, { ...options, method: "PUT", body }),
      del: (path, options) => request(path, { ...options, method: "DELETE" }),
    };
  }

  private injectCss(cacheKey: string, cssText: string) {
    if (typeof document === "undefined") return null;
    const existing = this.appliedStyles.get(cacheKey);
    if (existing) {
      if (existing.textContent !== cssText) {
        existing.textContent = cssText;
      }
      return existing;
    }
    const style = document.createElement("style");
    style.setAttribute("data-ui-style", cacheKey);
    style.textContent = cssText;
    document.head.appendChild(style);
    this.appliedStyles.set(cacheKey, style);
    return style;
  }

  private buildDataContextValue(): KernelDataContext {
    return {
      api: this.api,
      tenantHost: this.getTenantHost(),
      previewMode: this.previewMode,
      getToken: () => this.getToken(),
    };
  }

  private getDataContextModule() {
    if (this.dataContextExports) return this.dataContextExports;

    const DataContext = React.createContext<KernelDataContext>(
      this.buildDataContextValue()
    );

    const DataProvider = ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        DataContext.Provider,
        { value: this.buildDataContextValue() },
        children
      );

    const useDataContext = () => React.useContext(DataContext);
    const useApiClient = () => useDataContext().api;
    const getApiClient = () => this.api;

    const exportsObject = {
      DataContext,
      DataProvider,
      useDataContext,
      useApiClient,
      getApiClient,
      api: this.api,
      default: {
        DataContext,
        DataProvider,
        useDataContext,
        useApiClient,
        getApiClient,
        api: this.api,
      },
    };
    this.dataContextExports = exportsObject;
    return this.dataContextExports;
  }

  private resolveRuntimeRequestSpecifier(fromPackage: string, request: string) {
    const raw = String(request || "").trim();
    if (!raw) return raw;
    if (!raw.startsWith(".") && !raw.startsWith("/")) {
      return raw;
    }

    const from = String(fromPackage || "").trim().replace(/\\/g, "/");
    if (!from) return raw;

    const parts = from.split("/").filter(Boolean);
    if (!parts.length) return raw;

    let packageRoot = "";
    let modulePathParts: string[] = [];
    if (from.startsWith("@") && parts.length >= 2) {
      packageRoot = `${parts[0]}/${parts[1]}`;
      modulePathParts = parts.slice(2);
    } else {
      packageRoot = parts[0];
      modulePathParts = parts.slice(1);
    }

    if (!packageRoot) return raw;

    const baseDir = modulePathParts.slice(0, -1);
    const requestParts = raw.startsWith("/")
      ? raw.split("/").filter(Boolean)
      : baseDir.concat(raw.split("/").filter(Boolean));
    const normalized: string[] = [];
    requestParts.forEach((part) => {
      if (!part || part === ".") return;
      if (part === "..") {
        if (normalized.length > 0) normalized.pop();
        return;
      }
      normalized.push(part);
    });

    if (!normalized.length) return packageRoot;
    return `${packageRoot}/${normalized.join("/")}`;
  }

  private extractStaticRequireDependencies(
    source: string,
    resolver: (request: string) => string
  ) {
    if (!source || typeof source !== "string") return [] as string[];
    const deps = new Set<string>();
    const requireRegex = /(?:^|[^\w$])require\(\s*['\"]([^'\"]+)['\"]\s*\)/g;
    let match: RegExpExecArray | null = null;
    while ((match = requireRegex.exec(source)) !== null) {
      const request = String(match[1] || "").trim();
      if (!request) continue;
      const resolved = resolver(request);
      if (!resolved) continue;
      deps.add(resolved);
    }
    return Array.from(deps);
  }

  requireLocal(name: string) {
    if (name === "react" || name === "React") return React;
    if (name === "react-dom/client") return { createRoot };
    if (name === "react-dom") return { createRoot };
    if (name === "react-router") return ReactRouter;
    if (name === "react-router-dom" || name === "react-router/dom") {
      return ReactRouterDom;
    }
    if (DATA_CONTEXT_PACKAGE_NAMES.has(name)) {
      return this.getDataContextModule();
    }
    const candidates = [name];
    if (/\.(css|js|jsx|ts|tsx|json)$/i.test(name)) {
      candidates.push(name.replace(/\.(css|js|jsx|ts|tsx|json)$/i, ""));
    }

    const entryKey = candidates
      .map((candidate) =>
        Array.from(this.cache.keys()).find((key) => key.startsWith(`${candidate}@`))
      )
      .find(Boolean);
    if (!entryKey) {
      throw new Error(
        `Module not loaded: ${name}. Use Kernel.load('${name}') first.`,
      );
    }
    const entry = this.cache.get(entryKey);
    if (!entry) {
      throw new Error(`Module cache empty for: ${name}`);
    }
    if (entry.then) {
      throw new Error(
        `Module ${name} is still loading; await Kernel.load('${name}')`,
      );
    }
    return entry;
  }

  private decorateBundleSource(source: string) {
    if (!source) return source;
    if (!source.includes("const __modules") || !source.includes("const __require")) {
      return source;
    }
    const suffix = `
;try {
  if (typeof __require === 'function') {
    const entry = module && module.exports ? module.exports : null;
    const canAttach = entry && (typeof entry === 'object' || typeof entry === 'function');
    if (canAttach) {
      entry.__kernelRequire = __require;
      const moduleKeys = (typeof __modules === 'object' && __modules) ? Object.keys(__modules) : [];
      entry.__kernelModules = moduleKeys;
    }
  }
} catch (e) {}
`;
    return `${source}\n${suffix}`;
  }

  private attachRuntimeSourceMetadata(
    packageName: string,
    version: string,
    fileExtension: string,
    source: string
  ) {
    if (!source || typeof source !== "string") return source;
    if (/^\s*\/\/[#@]\s*sourceURL=/m.test(source)) {
      return source;
    }

    const safePackage = String(packageName || "pkg")
      .trim()
      .replace(/^@/, "")
      .replace(/[^a-zA-Z0-9._\/-]+/g, "_");
    const safeVersion = String(version || "latest")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "_");
    const ext = String(fileExtension || "js")
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "") || "js";
    const virtualPath = `/__idp_runtime__/${safePackage}@${safeVersion}.${ext}`;

    return `${source}\n//# sourceURL=${virtualPath}`;
  }

  private wrapExports(value: any) {
    if (!value || (typeof value !== "object" && typeof value !== "function")) {
      return value;
    }
    if ((value as any).__kernelWrapped) return value;
    const kernelRequire = (value as any).__kernelRequire;
    const moduleKeys = (value as any).__kernelModules;
    const packageName = String((value as any).__kernelPackageName || "").trim();
    if (typeof kernelRequire !== "function" || !Array.isArray(moduleKeys)) {
      return value;
    }

    const resolved = new Map<string, any>();
    const moduleKeySet = new Set<string>(moduleKeys);
    const shouldReportMissingExport = (prop: string) => {
      if (!prop) return false;
      if (prop === "default") return false;
      if (prop.startsWith("__")) return false;
      if (
        prop === "then" ||
        prop === "catch" ||
        prop === "finally" ||
        prop === "constructor" ||
        prop === "prototype" ||
        prop === "toString" ||
        prop === "valueOf"
      ) {
        return false;
      }
      return /^[A-Za-z$_][A-Za-z0-9$_]*$/.test(prop);
    };
    const getBasename = (key: string) => {
      const normalized = key.replace(/\\/g, "/");
      const last = normalized.split("/").pop() || normalized;
      return last.replace(/\.[^.]+$/, "");
    };

    const resolveExport = (prop: string) => {
      if (resolved.has(prop)) return resolved.get(prop);
      const propLower = prop.toLowerCase();
      const preferred: string[] = [];
      const fallback: string[] = [];
      moduleKeys.forEach((key) => {
        if (key.endsWith(".css")) return;
        const base = getBasename(key).toLowerCase();
        if (base.includes(propLower)) {
          preferred.push(key);
        } else {
          fallback.push(key);
        }
      });
      const ordered = preferred.concat(fallback);
      const preferredSet = new Set(preferred);

      for (const key of ordered) {
        if (!moduleKeySet.has(key)) continue;
        let mod: any;
        try {
          mod = kernelRequire(key);
        } catch (err) {
          if (preferredSet.has(key)) {
            throw err;
          }
          continue;
        }
        if (!mod) continue;
        if (prop === "default" && mod.default !== undefined) {
          resolved.set(prop, mod.default);
          return mod.default;
        }
        if (
          mod.default &&
          (typeof mod.default === "object" || typeof mod.default === "function") &&
          Object.prototype.hasOwnProperty.call(mod.default, prop)
        ) {
          resolved.set(prop, (mod.default as any)[prop]);
          return (mod.default as any)[prop];
        }
        if (Object.prototype.hasOwnProperty.call(mod, prop)) {
          resolved.set(prop, mod[prop]);
          return mod[prop];
        }
      }
      const rootKeys = Object.keys(value || {}).filter(
        (key) =>
          key !== "__kernelRequire" &&
          key !== "__kernelModules" &&
          key !== "__kernelWrapped" &&
          key !== "__kernelPackageName"
      );
      const defaultValue = (value as any)?.default;
      const defaultKeys =
        defaultValue && (typeof defaultValue === "object" || typeof defaultValue === "function")
          ? Object.keys(defaultValue)
          : [];
      const availableKeys = Array.from(new Set([...rootKeys, ...defaultKeys])).slice(0, 40);
      if (this.previewMode && shouldReportMissingExport(prop)) {
        const label = packageName || "unknown-package";
        const keysText = availableKeys.length ? availableKeys.join(", ") : "(none)";
        throw new Error(
          `Missing export "${prop}" from ${label}. Available exports: ${keysText}`
        );
      }
      resolved.set(prop, undefined);
      return undefined;
    };

    const handler: ProxyHandler<any> = {
      get(target, prop) {
        if (typeof prop !== "string") return (target as any)[prop];
        if (
          prop === "__kernelRequire" ||
          prop === "__kernelModules" ||
          prop === "__kernelWrapped"
        ) {
          return (target as any)[prop];
        }
        if (Object.prototype.hasOwnProperty.call(target, prop)) {
          return (target as any)[prop];
        }
        return resolveExport(prop);
      },
    };

    const proxy = new Proxy(value, handler);
    (proxy as any).__kernelWrapped = true;
    return proxy;
  }

  private normalizeDefaultExportInterop(value: any) {
    if (!value || (typeof value !== "object" && typeof value !== "function")) {
      return value;
    }
    if ((value as any).__kernelDefaultInteropApplied) {
      return value;
    }
    const hasDefault =
      Object.prototype.hasOwnProperty.call(value, "default") &&
      (value as any).default !== undefined;
    if (!hasDefault) {
      return value;
    }

    const handler: ProxyHandler<any> = {
      get(target, prop, receiver) {
        if (typeof prop !== "string") {
          return Reflect.get(target, prop, receiver);
        }
        if (Reflect.has(target, prop)) {
          return Reflect.get(target, prop, receiver);
        }
        const defaultValue = Reflect.get(target, "default", receiver);
        if (!defaultValue) return undefined;

        if (
          (typeof defaultValue === "object" || typeof defaultValue === "function") &&
          Reflect.has(defaultValue, prop)
        ) {
          return Reflect.get(defaultValue, prop);
        }

        if (typeof defaultValue === "function") {
          if (defaultValue.name && prop === defaultValue.name) {
            return defaultValue;
          }
          const ownKeys = Object.keys(target).filter(
            (key) =>
              key !== "default" &&
              key !== "__esModule" &&
              key !== "__kernelRequire" &&
              key !== "__kernelModules" &&
              key !== "__kernelWrapped" &&
              key !== "__kernelPackageName" &&
              key !== "__kernelDefaultInteropApplied"
          );
          if (!ownKeys.length && /^[A-Z]/.test(prop)) {
            return defaultValue;
          }
        }
        return undefined;
      },
    };

    const proxy = new Proxy(value, handler);
    (proxy as any).__kernelDefaultInteropApplied = true;
    return proxy;
  }

  private renderElement(containerId: string, element: React.ReactNode) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container "${containerId}" not found`);
    }
    const root = createRoot(container);
    const wrapped = this.previewMode
      ? React.createElement(this.getPreviewErrorBoundaryType(), null, element)
      : element;
    root.render(wrapped);
  }

  private async mountRouteManifest(
    routes: ReturnType<typeof normalizeRouteManifest>,
    containerId: string,
  ) {
    if (!routes) {
      throw new Error("Route manifest is empty");
    }
    const element = createKernelRouterElement(
      {
        api: this.api,
        load: (name: string, version = "latest") => this.load(name, version),
        redirectToLogin: () => this.redirectToLogin(),
      },
      routes,
    );
    this.renderElement(containerId, element);
  }

  async mount(name: string, containerId = "root", version = "latest") {
    const pkg = await this.load(name, version);
    if (!pkg) {
      throw new Error(`Package ${name} does not found`);
    }
    const routes = normalizeRouteManifest(pkg);
    if (routes) {
      await this.mountRouteManifest(routes, containerId);
      return;
    }
    const Component = pkg.App ?? pkg.default ?? pkg;
    if (!Component) {
      throw new Error(`Package ${name} has no App export`);
    }
    const baseElement = React.isValidElement(Component)
      ? Component
      : React.createElement(Component);
    this.renderElement(containerId, baseElement);
  }

  async boot(name = "@app/routes", containerId = "root", version = "latest") {
    const candidates =
      name === "@app/routes" ? ["@app/routes", "@app/dashboard"] : [name];
    let lastError: unknown = null;

    for (const candidate of candidates) {
      try {
        await this.mount(candidate, containerId, version);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Kernel boot failed");
  }
}

(window as any).Kernel = Kernel;
(window as any).__IDP_KERNEL_BUILD__ = "2026-05-25-kernel-auth-redirect-1";
