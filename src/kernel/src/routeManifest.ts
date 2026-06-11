export type KernelRouteRecord = {
  path?: string;
  index?: boolean;
  packageName?: string;
  requireAuth?: boolean;
  redirectTo?: string;
  children?: KernelRouteRecord[];
};

const asObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const normalizePath = (value: unknown) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw !== "/" && raw.endsWith("/")) {
    return raw.slice(0, -1);
  }
  return raw;
};

const normalizePackageName = (value: unknown) => {
  const raw = String(value || "").trim();
  return raw || undefined;
};

const normalizeRequireAuth = (record: Record<string, unknown>) => {
  if (typeof record.requireAuth === "boolean") {
    return record.requireAuth;
  }
  if (typeof record.protected === "boolean") {
    return record.protected;
  }
  if (typeof record.private === "boolean") {
    return record.private;
  }
  if (record.auth === true) {
    return true;
  }
  return String(record.auth || "").trim().toLowerCase() === "required";
};

const normalizeChildren = (value: unknown): KernelRouteRecord[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const children = value
    .map((entry) => normalizeRouteRecord(entry))
    .filter((entry): entry is KernelRouteRecord => Boolean(entry));
  return children.length > 0 ? children : undefined;
};

const normalizeRouteRecord = (value: unknown): KernelRouteRecord | null => {
  const record = asObject(value);
  if (Object.keys(record).length === 0) return null;

  const index = record.index === true;
  const path = normalizePath(record.path);
  const packageName = normalizePackageName(
    record.package ??
      record.packageName ??
      record.component ??
      record.module ??
      record.screen,
  );
  const redirectTo = normalizePath(record.redirectTo ?? record.redirect ?? record.to);
  const children = normalizeChildren(record.children);

  if (!index && !path) return null;
  if (!packageName && !redirectTo && !children?.length) return null;

  return {
    path: index ? undefined : path,
    index,
    packageName,
    requireAuth: normalizeRequireAuth(record),
    redirectTo: redirectTo || undefined,
    children,
  };
};

const pickRouteList = (value: unknown): unknown[] | null => {
  if (Array.isArray(value)) return value;
  const record = asObject(value);
  if (Array.isArray(record.routes)) return record.routes;
  if (record.default !== undefined) return pickRouteList(record.default);
  return null;
};

export const normalizeRouteManifest = (moduleExports: unknown): KernelRouteRecord[] | null => {
  const routeList = pickRouteList(moduleExports);
  if (!routeList?.length) return null;
  const routes = routeList
    .map((entry) => normalizeRouteRecord(entry))
    .filter((entry): entry is KernelRouteRecord => Boolean(entry));
  return routes.length > 0 ? routes : null;
};
