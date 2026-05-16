import Head from 'next/head';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiLayers,
  FiLock,
  FiShield,
  FiUsers,
} from 'react-icons/fi';
import { localeDir, useUiLocale } from '../../lib/ui/locale';
import { getAuthMessages } from '../../lib/ui/i18n';

interface SessionPayload {
  authenticated: boolean;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface WhitelistResponse {
  items?: Array<{ isActive: boolean }>;
  error?: string;
}

const cardClass =
  'rounded-[28px] border border-white/60 bg-white/70 p-6 shadow-[0_12px_32px_rgba(60,64,67,.10)] ring-1 ring-white/35 backdrop-blur-xl';
const metricCardClass =
  'rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_12px_32px_rgba(60,64,67,.10)] ring-1 ring-white/35 backdrop-blur-xl';
const primaryBtnClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#1A73E8] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#1765cc] active:brightness-95';
const secondaryBtnClass =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#DADCE0] bg-white px-5 py-2.5 text-sm font-medium text-[#1A73E8] transition-all duration-200 hover:bg-[#F6F9FE] active:brightness-95';
const quickActionClass =
  'flex w-full items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-left text-sm font-medium text-[#202124] shadow-sm backdrop-blur-md hover:bg-white/75';

const badgeToneClass = (tone: 'blue' | 'green' | 'amber') => {
  if (tone === 'blue') return 'border-[#D2E3FC] bg-[#E8F0FE] text-[#1A73E8]';
  if (tone === 'green') return 'border-[#CEEAD6] bg-[#E6F4EA] text-[#137333]';
  return 'border-[#FDE293] bg-[#FEF7E0] text-[#B06000]';
};

const Badge = ({
  children,
  tone = 'blue',
}: {
  children: ReactNode;
  tone?: 'blue' | 'green' | 'amber';
}) => (
  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${badgeToneClass(tone)}`}>
    {children}
  </span>
);

export default function AuthAdminDashboardPage() {
  const { locale, isRtl } = useUiLocale();
  const copy = getAuthMessages(locale).dashboard;
  const accessCopy = getAuthMessages(locale).access;
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [totalTenants, setTotalTenants] = useState(0);
  const [activeTenants, setActiveTenants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const sessionRes = await fetch('/api/session', { credentials: 'include' });
        const sessionData = (await sessionRes.json()) as SessionPayload;
        setSession(sessionData);

        if (!sessionData.authenticated) {
          setError(copy.authenticationRequired);
          return;
        }

        const listRes = await fetch('/api/admin/tenant-whitelist', { credentials: 'include' });
        const listData = (await listRes.json()) as WhitelistResponse;
        if (!listRes.ok) {
          throw new Error(listData.error || copy.loadTenantFailed);
        }

        const items = listData.items || [];
        setTotalTenants(items.length);
        setActiveTenants(items.filter((item) => item.isActive).length);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : copy.unexpectedError);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [copy.authenticationRequired, copy.loadTenantFailed, copy.unexpectedError]);

  const inactiveTenants = Math.max(totalTenants - activeTenants, 0);

  return (
    <>
      <Head>
        <title>{copy.headTitle}</title>
      </Head>

      <div className="space-y-6" dir={localeDir(locale)}>
        {error ? <div className="rounded-xl border border-[#F28B82] bg-[#FDECEA] px-4 py-3 text-sm text-[#B3261E]">{error}</div> : null}

        <section className="grid w-full grid-cols-1 gap-6 xl:grid-cols-3">
          <article className={metricCardClass}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-[#5F6368] shadow-sm">
                <FiLayers className="h-5 w-5" />
              </span>
              <Badge tone="blue">{loading ? '...' : `+${activeTenants}`}</Badge>
            </div>
            <p className="text-sm font-medium text-[#5F6368]">{copy.tenantWhitelistEntries}</p>
            <p className="mt-2 text-3xl font-normal tracking-tight text-[#202124]">{loading ? '...' : totalTenants}</p>
          </article>

          <article className={metricCardClass}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-[#5F6368] shadow-sm">
                <FiCheckCircle className="h-5 w-5" />
              </span>
              <Badge tone="green">Healthy</Badge>
            </div>
            <p className="text-sm font-medium text-[#5F6368]">{copy.activeTenants}</p>
            <p className="mt-2 text-3xl font-normal tracking-tight text-[#202124]">{loading ? '...' : activeTenants}</p>
          </article>

          <article className={metricCardClass}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-[#5F6368] shadow-sm">
                <FiUsers className="h-5 w-5" />
              </span>
              <Badge tone="amber">{copy.authAdminUser}</Badge>
            </div>
            <p className="text-sm font-medium text-[#5F6368]">{copy.authAdminUser}</p>
            <p className="mt-2 truncate text-lg text-[#202124]">{session?.user?.email || copy.na}</p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <article className={cardClass}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-normal text-[#202124]">{copy.overview}</h2>
                <p className="mt-1 text-sm leading-6 text-[#5F6368]">
                  Operational summary for tenant onboarding, SSO token validation, and access administration.
                </p>
              </div>
              <a href="/admin/tenants" className={primaryBtnClass}>
                {copy.openTenantPanel}
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-md">
                <div>
                  <p className="text-sm font-medium text-[#202124]">SSO validation</p>
                  <p className="mt-1 text-xs text-[#5F6368]">Tenant tokens are checked before authorization.</p>
                </div>
                <Badge tone="green">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-md">
                <div>
                  <p className="text-sm font-medium text-[#202124]">Admin access</p>
                  <p className="mt-1 text-xs text-[#5F6368]">Control panel requires elevated privileges.</p>
                </div>
                <Badge tone="blue">Protected</Badge>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-md">
                <div>
                  <p className="text-sm font-medium text-[#202124]">Last sync</p>
                  <p className="mt-1 text-xs text-[#5F6368]">Tenant whitelist cache refreshed recently.</p>
                </div>
                <Badge tone="green">Normal</Badge>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-md">
                <div>
                  <p className="text-sm font-medium text-[#202124]">Review queue</p>
                  <p className="mt-1 text-xs text-[#5F6368]">Inactive tenants that need verification.</p>
                </div>
                <Badge tone="amber">{inactiveTenants}</Badge>
              </div>
            </div>
          </article>

          <article className={cardClass}>
            <h2 className="text-xl font-normal text-[#202124]">{copy.quickActions}</h2>
            <div className="mt-4 space-y-3">
              <a href="/admin/tenants" className={quickActionClass}>
                {copy.manageTenantWhitelist}
                <FiChevronRight className={`h-4 w-4 text-[#9AA0A6] ${isRtl ? 'rotate-180' : ''}`} />
              </a>
              <a href="/admin/access" className={quickActionClass}>
                {accessCopy.title}
                <FiChevronRight className={`h-4 w-4 text-[#9AA0A6] ${isRtl ? 'rotate-180' : ''}`} />
              </a>
              <a href="/profile" className={quickActionClass}>
                {copy.openProfile}
                <FiChevronRight className={`h-4 w-4 text-[#9AA0A6] ${isRtl ? 'rotate-180' : ''}`} />
              </a>
            </div>
          </article>
        </section>

        <article className={cardClass}>
          <h2 className="text-xl font-normal text-[#202124]">Recent admin activity</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/60 bg-white/45 p-4 shadow-sm backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge tone="blue">Today</Badge>
                <FiCheckCircle className="h-4 w-4 text-[#137333]" />
              </div>
              <p className="text-sm font-medium text-[#202124]">Tenant whitelist updated</p>
              <p className="mt-1 text-xs text-[#5F6368]">A production host was added to whitelist.</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/45 p-4 shadow-sm backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge tone="green">Yesterday</Badge>
                <FiClock className="h-4 w-4 text-[#137333]" />
              </div>
              <p className="text-sm font-medium text-[#202124]">Access role assigned</p>
              <p className="mt-1 text-xs text-[#5F6368]">Tenant manager role mapped to an organization.</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/45 p-4 shadow-sm backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge tone="amber">Review</Badge>
                <FiAlertTriangle className="h-4 w-4 text-[#B06000]" />
              </div>
              <p className="text-sm font-medium text-[#202124]">Inactive tenant detected</p>
              <p className="mt-1 text-xs text-[#5F6368]">A staging tenant is disabled and pending review.</p>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
