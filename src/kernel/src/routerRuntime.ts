import React from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  useRoutes,
  type RouteObject,
} from "react-router-dom";
import { KernelRouteRecord } from "./routeManifest";

type KernelApiClient = {
  get: (
    path: string,
    options?: { redirectOnUnauthorized?: boolean },
  ) => Promise<Response>;
};

export type KernelRouterRuntime = {
  api: KernelApiClient;
  load: (name: string, version?: string) => Promise<unknown>;
  redirectToLogin: () => void;
};

type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | {
      status: "authenticated";
      user: Record<string, unknown>;
      tenant: Record<string, unknown>;
    };

const SessionContext = React.createContext<SessionState>({ status: "loading" });

const SessionProvider = ({
  runtime,
  children,
}: {
  runtime: KernelRouterRuntime;
  children?: React.ReactNode;
}) => {
  const [session, setSession] = React.useState<SessionState>({ status: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    runtime.api
      .get("/api/auth/session", { redirectOnUnauthorized: false })
      .then(async (response) => {
        if (cancelled) return;
        if (!response.ok) {
          setSession({ status: "anonymous" });
          return;
        }
        const payload = (await response.json().catch(() => null)) as
          | {
              authenticated?: boolean;
              user?: Record<string, unknown>;
              tenant?: Record<string, unknown>;
            }
          | null;
        if (!payload?.authenticated || !payload.user || !payload.tenant) {
          setSession({ status: "anonymous" });
          return;
        }
        setSession({
          status: "authenticated",
          user: payload.user,
          tenant: payload.tenant,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setSession({ status: "anonymous" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [runtime]);

  return React.createElement(SessionContext.Provider, { value: session }, children);
};

const PackageElement = ({
  runtime,
  packageName,
}: {
  runtime: KernelRouterRuntime;
  packageName: string;
}) => {
  const [state, setState] = React.useState<{
    Component: React.ComponentType | React.ReactElement | null;
    error: string;
  }>({
    Component: null,
    error: "",
  });

  React.useEffect(() => {
    let cancelled = false;
    setState({ Component: null, error: "" });
    runtime
      .load(packageName)
      .then((pkg) => {
        if (cancelled) return;
        const component = (pkg as any)?.App ?? (pkg as any)?.default ?? pkg;
        if (!component) {
          throw new Error(`Route package ${packageName} has no renderable export`);
        }
        setState({ Component: component as any, error: "" });
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            Component: null,
            error: error instanceof Error ? error.message : String(error || "Route load failed"),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [packageName, runtime]);

  if (state.error) {
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
        },
      },
      state.error,
    );
  }

  if (!state.Component) {
    return null;
  }

  return React.isValidElement(state.Component)
    ? state.Component
    : React.createElement(state.Component as React.ComponentType);
};

const ProtectedRoute = ({
  runtime,
  children,
}: {
  runtime: KernelRouterRuntime;
  children?: React.ReactNode;
}) => {
  const session = React.useContext(SessionContext);

  React.useEffect(() => {
    if (session.status === "anonymous") {
      runtime.redirectToLogin();
    }
  }, [runtime, session.status]);

  if (session.status !== "authenticated") {
    return null;
  }

  return React.createElement(React.Fragment, null, children);
};

const buildRouteElement = (
  runtime: KernelRouterRuntime,
  route: KernelRouteRecord,
) => {
  const baseElement = route.redirectTo
    ? React.createElement(Navigate, { to: route.redirectTo, replace: true })
    : route.packageName
      ? React.createElement(PackageElement, {
          runtime,
          packageName: route.packageName,
        })
      : React.createElement(Outlet);

  if (!route.requireAuth) {
    return baseElement;
  }

  return React.createElement(ProtectedRoute, { runtime }, baseElement);
};

const toRouteObject = (
  runtime: KernelRouterRuntime,
  route: KernelRouteRecord,
): RouteObject => {
  if (route.index) {
    return {
      element: buildRouteElement(runtime, route),
      index: true,
    };
  }

  return {
    element: buildRouteElement(runtime, route),
    children: route.children?.map((child) => toRouteObject(runtime, child)),
    path: route.path,
  };
};

const RoutesRenderer = ({
  runtime,
  routes,
}: {
  runtime: KernelRouterRuntime;
  routes: KernelRouteRecord[];
}) => {
  const routeObjects = React.useMemo(() => {
    const objects = routes.map((route) => toRouteObject(runtime, route));
    const hasWildcard = routes.some((route) => route.path === "*");
    if (!hasWildcard) {
      objects.push({
        path: "*",
        element: React.createElement(Navigate, { to: "/", replace: true }),
      });
    }
    return objects;
  }, [routes, runtime]);

  return useRoutes(routeObjects);
};

export const createKernelRouterElement = (
  runtime: KernelRouterRuntime,
  routes: KernelRouteRecord[],
) =>
  React.createElement(
    BrowserRouter,
    null,
    React.createElement(
      SessionProvider,
      { runtime },
      React.createElement(RoutesRenderer, { runtime, routes }),
    ),
  );
