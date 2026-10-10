// Auth is deployed independently of the shared entity workspace. Keep this
// summary dependency-free and exclude exception messages, SQL and parameters.
export const authErrorDiagnostics = (error: unknown): { name: string; code?: string } => ({
  name: error instanceof TypeError ? 'TypeError'
    : error instanceof RangeError ? 'RangeError'
    : error instanceof SyntaxError ? 'SyntaxError' : 'Error',
  ...(error instanceof Error && (error as Error & { code?: unknown }).code === 'AUTH_BOOTSTRAP_TENANT_SSO_TOKEN_REQUIRED'
    ? { code: 'AUTH_BOOTSTRAP_TENANT_SSO_TOKEN_REQUIRED' } : {}),
});
