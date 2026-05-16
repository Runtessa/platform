import Head from 'next/head';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiLayers } from 'react-icons/fi';
import { localeDir, useUiLocale } from '../../lib/ui/locale';
import { getAuthMessages } from '../../lib/ui/i18n';

interface SessionPayload {
  authenticated: boolean;
  csrfToken?: string;
  user?: {
    randId: string;
    email: string;
    firstName: string;
    lastName: string;
    isAuthAdmin?: boolean;
  };
}

interface TenantItem {
  tenantName: string;
  tenantRandId: string | null;
  isActive: boolean;
  meta?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const boolFromMeta = (meta: Record<string, unknown> | undefined, key: string, fallback: boolean): boolean => {
  const value = meta?.[key];
  return typeof value === 'boolean' ? value : fallback;
};

const strFromMeta = (meta: Record<string, unknown> | undefined, key: string): string => {
  const value = meta?.[key];
  return typeof value === 'string' ? value : '';
};

const cardClass =
  'rounded-[28px] border border-white/60 bg-white/70 p-6 shadow-[0_12px_32px_rgba(60,64,67,.10)] ring-1 ring-white/35 backdrop-blur-xl';
const insetCardClass =
  'rounded-[24px] border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-md';
const labelClass = 'mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]';
const inputClass =
  'h-12 w-full rounded-2xl border border-white/70 bg-white/75 px-4 text-sm font-medium text-[#202124] outline-none shadow-sm backdrop-blur-md transition placeholder:text-[#9AA0A6] focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#D2E3FC]/70';
const checkboxClass = 'h-4 w-4 rounded border-[#C7C9CC] accent-[#1A73E8] focus:ring-[#D2E3FC]';
const primaryBtnClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#1A73E8] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-[#1765cc] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryBtnClass =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-5 py-2.5 text-sm font-medium text-[#1A73E8] shadow-sm transition-all duration-200 hover:bg-white active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60';
const dangerBtnClass =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#F28B82] bg-white px-5 py-2.5 text-sm font-medium text-[#B3261E] shadow-sm transition-all duration-200 hover:bg-[#FDECEA] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60';

const badgeClass = (tone: 'blue' | 'green' | 'amber') => {
  if (tone === 'blue') return 'border-[#D2E3FC] bg-[#E8F0FE] text-[#1A73E8]';
  if (tone === 'green') return 'border-[#CEEAD6] bg-[#E6F4EA] text-[#137333]';
  return 'border-[#FDE293] bg-[#FEF7E0] text-[#B06000]';
};

const Badge = ({
  tone,
  text,
}: {
  tone: 'blue' | 'green' | 'amber';
  text: string;
}) => <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(tone)}`}>{text}</span>;

export default function AdminTenantsPage() {
  const { locale, isRtl } = useUiLocale();
  const copy = getAuthMessages(locale).tenants;
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [items, setItems] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');

  const [form, setForm] = useState({
    tenantName: '',
    tenantRandId: '',
    tenantDisplayName: '',
    allowRegistration: true,
    isActive: true,
    customToken: '',
  });

  const csrfToken = session?.csrfToken || '';
  const canManage = Boolean(session?.authenticated && session.user?.isAuthAdmin);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const sessionRes = await fetch('/api/session', { credentials: 'include' });
      const sessionData = (await sessionRes.json()) as SessionPayload;
      setSession(sessionData);

      if (!sessionData.authenticated) {
        setError(copy.authenticationRequired);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/tenant-whitelist', { credentials: 'include' });
      const data = (await res.json()) as { items?: TenantItem[]; error?: string };
      if (!res.ok) throw new Error(data.error || copy.loadFailed);

      setItems(data.items || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGeneratedToken('');

    try {
      const payload = {
        tenant_name: form.tenantName,
        tenant_rand_id: form.tenantRandId || null,
        tenant_display_name: form.tenantDisplayName || null,
        allow_registration: form.allowRegistration,
        is_active: form.isActive,
        sso_token: form.customToken || undefined,
      };

      const res = await fetch('/api/admin/tenant-whitelist', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { generatedToken?: string; error?: string };
      if (!res.ok) throw new Error(data.error || copy.saveFailed);

      setSuccess(copy.saveSuccess);
      if (data.generatedToken) setGeneratedToken(data.generatedToken);
      setForm((prev) => ({ ...prev, customToken: '' }));
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.unexpectedError);
    }
  };

  const rotateToken = async (tenantName: string) => {
    setError('');
    setSuccess('');
    setGeneratedToken('');

    try {
      const res = await fetch(`/api/admin/tenant-whitelist/${encodeURIComponent(tenantName)}/rotate-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      });

      const data = (await res.json()) as { generatedToken?: string; error?: string };
      if (!res.ok) throw new Error(data.error || copy.rotateFailed);

      if (data.generatedToken) setGeneratedToken(data.generatedToken);
      setSuccess(copy.rotatedFor.replace('{tenant}', tenantName));
      await load();
    } catch (rotateError) {
      setError(rotateError instanceof Error ? rotateError.message : copy.unexpectedError);
    }
  };

  const removeTenant = async (tenantName: string) => {
    setError('');
    setSuccess('');
    setGeneratedToken('');

    try {
      const res = await fetch(`/api/admin/tenant-whitelist/${encodeURIComponent(tenantName)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || copy.deleteFailed);

      setSuccess(copy.deleted.replace('{tenant}', tenantName));
      await load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : copy.unexpectedError);
    }
  };

  const activeCount = useMemo(() => items.filter((item) => item.isActive).length, [items]);
  const inactiveCount = Math.max(items.length - activeCount, 0);

  if (session?.authenticated && session.user && !session.user.isAuthAdmin) {
    return (
      <>
        <Head>
          <title>{copy.headTitle}</title>
        </Head>
        <div className="space-y-6" dir={localeDir(locale)}>
          <article className={cardClass}>
            <h2 className="text-xl font-normal text-[#202124]">{copy.permissionDenied}</h2>
            <p className="mt-2 text-sm text-[#5F6368]">{copy.permissionHelp}</p>
          </article>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{copy.headTitle}</title>
      </Head>

      <div className="space-y-6" dir={localeDir(locale)}>
        {error ? <div className="rounded-2xl border border-[#F28B82]/70 bg-[#FDECEA]/85 px-4 py-3 text-sm text-[#B3261E] shadow-sm backdrop-blur-md">{error}</div> : null}
        {success ? <div className="rounded-2xl border border-[#81C995]/70 bg-[#E6F4EA]/85 px-4 py-3 text-sm text-[#137333] shadow-sm backdrop-blur-md">{success}</div> : null}
        {generatedToken ? (
          <div className="rounded-2xl border border-[#81C995]/70 bg-[#E6F4EA]/85 px-4 py-3 text-sm text-[#137333] shadow-sm backdrop-blur-md">
            <p className="font-semibold">{copy.generatedTokenTitle}</p>
            <code className="mt-2 block overflow-x-auto rounded-lg border border-[#DADCE0] bg-white px-2 py-1 text-xs text-[#202124]">
              {generatedToken}
            </code>
          </div>
        ) : null}

        <section className="grid w-full gap-6 xl:grid-cols-3">
          <article className={cardClass}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-[#5F6368] shadow-sm">
                <FiLayers className="h-5 w-5" />
              </span>
              <Badge tone="blue" text={String(items.length)} />
            </div>
            <h2 className="text-sm font-medium text-[#5F6368]">{copy.totalEntries}</h2>
            <p className="mt-2 text-3xl font-normal tracking-tight text-[#202124]">{items.length}</p>
          </article>
          <article className={cardClass}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-[#5F6368] shadow-sm">
                <FiCheckCircle className="h-5 w-5" />
              </span>
              <Badge tone="green" text={String(activeCount)} />
            </div>
            <h2 className="text-sm font-medium text-[#5F6368]">{copy.activeEntries}</h2>
            <p className="mt-2 text-3xl font-normal tracking-tight text-[#202124]">{activeCount}</p>
          </article>
          <article className={cardClass}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-[#5F6368] shadow-sm">
                <FiAlertTriangle className="h-5 w-5" />
              </span>
              <Badge tone="amber" text={String(inactiveCount)} />
            </div>
            <h2 className="text-sm font-medium text-[#5F6368]">Inactive tenants</h2>
            <p className="mt-2 text-3xl font-normal tracking-tight text-[#202124]">{inactiveCount}</p>
          </article>
        </section>

        <article className={cardClass}>
          <h2 className="text-xl font-normal text-[#202124]">{copy.createOrUpdate}</h2>
          <p className="mt-1 text-sm leading-6 text-[#5F6368]">{copy.createOrUpdateHelp}</p>

          <div className="mt-5 grid gap-5 lg:grid-cols-[330px_1fr]">
            <div className="rounded-[24px] border border-white/70 bg-gradient-to-br from-white/75 via-white/55 to-[#E8F0FE]/70 p-5 shadow-sm backdrop-blur-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/75 text-[#1A73E8] shadow-sm">
                <FiLayers className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-[#202124]">Whitelist control</h3>
              <p className="mt-2 text-sm leading-6 text-[#5F6368]">
                Add tenant domains, configure registration permission, and bind custom SSO tokens for trusted environments.
              </p>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/55 p-3 shadow-sm backdrop-blur-md">
                  <span className="text-sm text-[#202124]">{copy.activeEntries}</span>
                  <Badge tone="green" text={String(activeCount)} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/55 p-3 shadow-sm backdrop-blur-md">
                  <span className="text-sm text-[#202124]">Inactive tenants</span>
                  <Badge tone="amber" text={String(inactiveCount)} />
                </div>
              </div>
            </div>

            <div className={insetCardClass}>
              <form className="space-y-4" onSubmit={submit}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="tenant_name">
                      {copy.tenantName}
                    </label>
                    <input
                      id="tenant_name"
                      className={inputClass}
                      value={form.tenantName}
                      onChange={(e) => setForm((prev) => ({ ...prev, tenantName: e.target.value }))}
                      placeholder={copy.tenantNamePlaceholder}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="tenant_rand_id">
                      {copy.tenantRandId}
                    </label>
                    <input
                      id="tenant_rand_id"
                      className={inputClass}
                      value={form.tenantRandId}
                      onChange={(e) => setForm((prev) => ({ ...prev, tenantRandId: e.target.value }))}
                      placeholder={copy.tenantRandIdPlaceholder}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="tenant_display_name">
                      {copy.tenantDisplayName}
                    </label>
                    <input
                      id="tenant_display_name"
                      className={inputClass}
                      value={form.tenantDisplayName}
                      onChange={(e) => setForm((prev) => ({ ...prev, tenantDisplayName: e.target.value }))}
                      placeholder={copy.tenantDisplayNamePlaceholder}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="custom_sso_token">
                      {copy.customToken}
                    </label>
                    <input
                      id="custom_sso_token"
                      className={inputClass}
                      value={form.customToken}
                      onChange={(e) => setForm((prev) => ({ ...prev, customToken: e.target.value }))}
                      placeholder={copy.customTokenPlaceholder}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/50 p-3 text-sm text-[#202124]">
                    {copy.allowRegistration}
                    <input
                      className={checkboxClass}
                      type="checkbox"
                      checked={form.allowRegistration}
                      onChange={(e) => setForm((prev) => ({ ...prev, allowRegistration: e.target.checked }))}
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/50 p-3 text-sm text-[#202124]">
                    {copy.entryActive}
                    <input
                      className={checkboxClass}
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        tenantName: '',
                        tenantRandId: '',
                        tenantDisplayName: '',
                        allowRegistration: true,
                        isActive: true,
                        customToken: '',
                      })
                    }
                    className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-[#5F6368] hover:bg-white"
                  >
                    Reset
                  </button>
                  <button type="submit" className={primaryBtnClass} disabled={loading || !csrfToken || !canManage}>
                    {copy.saveEntry}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </article>

        <article className={cardClass}>
          <h2 className="text-xl font-normal text-[#202124]">{copy.currentWhitelist}</h2>
          <p className="mt-1 text-sm text-[#5F6368]">{copy.showingEntries.replace('{count}', String(items.length))}</p>
          <div className="mt-4 overflow-x-auto rounded-[24px] border border-white/70 bg-white/50 shadow-sm backdrop-blur-md">
            <table className={`w-full border-collapse text-sm text-[#202124] ${isRtl ? 'text-right' : 'text-left'}`}>
              <thead className="bg-white/55 text-[#5F6368]">
                <tr>
                  <th className="px-4 py-3 font-semibold">{copy.table.tenant}</th>
                  <th className="px-4 py-3 font-semibold">{copy.table.tenantId}</th>
                  <th className="px-4 py-3 font-semibold">{copy.table.allowReg}</th>
                  <th className="px-4 py-3 font-semibold">{copy.table.active}</th>
                  <th className="px-4 py-3 font-semibold">{copy.table.updated}</th>
                  <th className="px-4 py-3 font-semibold">{copy.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/70">
                {loading ? (
                  <tr>
                    <td className="px-4 py-3 text-[#5F6368]" colSpan={6}>
                      {copy.table.loading}
                    </td>
                  </tr>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.tenantName} className="bg-white/30 text-sm transition hover:bg-white/50">
                      <td className="px-4 py-3 text-[#202124]">{item.tenantName}</td>
                      <td className="px-4 py-3 text-[#5F6368]">{item.tenantRandId || copy.na}</td>
                      <td className="px-4 py-3 text-[#5F6368]">
                        {boolFromMeta(item.meta, 'allowRegistration', false) ? copy.table.yes : copy.table.no}
                      </td>
                      <td className="px-4 py-3 text-[#5F6368]">{item.isActive ? copy.table.yes : copy.table.no}</td>
                      <td className="px-4 py-3 text-[#5F6368]">{new Date(item.updatedAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className={secondaryBtnClass} onClick={() => rotateToken(item.tenantName)}>
                            {copy.rotateToken}
                          </button>
                          <button type="button" className={dangerBtnClass} onClick={() => removeTenant(item.tenantName)}>
                            {copy.delete}
                          </button>
                          {strFromMeta(item.meta, 'tenantDisplayName') ? (
                            <span className="self-center text-xs text-[#5F6368]">
                              {strFromMeta(item.meta, 'tenantDisplayName')}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-3 text-[#5F6368]" colSpan={6}>
                      {copy.table.empty}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </>
  );
}
