import vm from 'vm';
import { SandboxAdapters } from './AdapterFactory';
import { AccountRole } from '@idp/shared';
import { AppError } from '../common/AppError';

export interface SandboxRequestContext {
  path: string;
  method: string;
  headers: Record<string, string>;
  query: Record<string, unknown>;
  body: unknown;
  params: Record<string, string>;
  tenant: {
    id: string;
    hostname: string;
    resourceConfig: {
      memory: number;
      timeout: number;
    };
  };
  account?: {
    id: string;
    email: string;
    role: AccountRole;
  };
}

export interface SandboxContext {
  request: SandboxRequestContext;
  adapters: SandboxAdapters;
}

export interface SandboxResult {
  statusCode: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export class SandboxRunner {
  constructor(private readonly maxTimeoutMs = 30_000) {}

  async run(code: string, context: SandboxContext): Promise<SandboxResult> {
    const safeRequest = this.sanitizeRequest(context.request);
    const effectiveTimeout = this.resolveTimeout(safeRequest.tenant.resourceConfig);

    const frozenAdapters: SandboxAdapters = context.adapters;
    const frozenRequest = Object.freeze({ ...safeRequest }) as SandboxRequestContext;

    const sandboxGlobals: Record<string, unknown> = {
      request: frozenRequest,
      adapters: frozenAdapters,
      console,
    };
    Object.freeze(sandboxGlobals);

    const vmContext = vm.createContext(sandboxGlobals);
    const script = new vm.Script(
      `
        "use strict";
        const module = { exports: {} };
        const exports = module.exports;
        ${code}

        let handler = module.exports;
        if (handler && typeof handler === 'object' && handler.default) {
          handler = handler.default;
        }

        if (typeof handler !== 'function') {
          throw new Error('Module must export a function');
        }

        handler(request, adapters);
      `,
      { filename: 'tenant-module.js' },
    );

    try {
      const resultPromise = script.runInContext(vmContext, { timeout: effectiveTimeout });

      const result = await Promise.race([
        Promise.resolve(resultPromise),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Execution timed out')), effectiveTimeout),
        ),
      ]);

      if (result && typeof result === 'object') {
        const typed = result as SandboxResult;
        return {
          statusCode: typed.statusCode ?? 200,
          headers: typed.headers,
          body: typed.body,
        };
      }

      return { statusCode: 200, body: result };
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'Script execution timed out.') {
        throw new AppError('Execution timed out', 500);
      }
      throw new AppError(`Module error: ${message}`, 500);
    }
  }

  private sanitizeRequest(request: SandboxRequestContext): SandboxRequestContext {
    return {
      path: request.path,
      method: request.method,
      headers: { ...request.headers },
      query: { ...request.query },
      body: request.body,
      params: { ...(request.params ?? {}) },
      tenant: {
        id: request.tenant.id,
        hostname: request.tenant.hostname,
        resourceConfig: { ...request.tenant.resourceConfig },
      },
      account: request.account
        ? {
            id: request.account.id,
            email: request.account.email,
            role: request.account.role,
          }
        : undefined,
    };
  }

  private resolveTimeout(resourceConfig: { memory: number; timeout: number }): number {
    const configured = resourceConfig?.timeout ?? 5_000;
    return Math.min(configured, this.maxTimeoutMs);
  }
}
