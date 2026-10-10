// Reference prototype; duplicate candidates D09, D16 are tracked in docs/release/code-integrity-audit.md.
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  FiAlertTriangle,
  FiBell,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiGlobe,
  FiGrid,
  FiHelpCircle,
  FiHome,
  FiKey,
  FiLayers,
  FiLock,
  FiLogOut,
  FiMoreHorizontal,
  FiSearch,
  FiShield,
  FiUser,
  FiUsers,
} from 'react-icons/fi';

type AdminPageKey = 'dashboard' | 'tenants' | 'access' | 'profile';
type Tone = 'blue' | 'green' | 'amber' | 'gray' | 'red';
type IconType = typeof FiGrid;

type NavItem = {
  key: AdminPageKey;
  label: string;
  description: string;
  icon: IconType;
};

const adminProfile = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  role: 'Platform Administrator',
  lastSeen: '5/16/2026, 11:12 AM',
};

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'System overview', icon: FiGrid },
  { key: 'tenants', label: 'Tenants', description: 'Whitelist and SSO tokens', icon: FiLayers },
  { key: 'access', label: 'Access', description: 'Organizations, roles, users', icon: FiUsers },
  { key: 'profile', label: 'Profile', description: 'Admin identity', icon: FiUser },
];

const searchItems: Array<{ title: string; description: string; category: string; key: AdminPageKey; keywords: string[] }> = [
  {
    title: 'Dashboard',
    description: 'Tenant count, active tenants, health and recent admin activity',
    category: 'Overview',
    key: 'dashboard',
    keywords: ['dashboard', 'overview', 'metrics', 'health', 'activity'],
  },
  {
    title: 'Tenant whitelist',
    description: 'Create, update, activate, and review tenant whitelist records',
    category: 'Tenants',
    key: 'tenants',
    keywords: ['tenant', 'whitelist', 'host', 'sso token', 'registration'],
  },
  {
    title: 'Access management',
    description: 'Organizations, roles, users, and access assignments',
    category: 'Access',
    key: 'access',
    keywords: ['access', 'role', 'user', 'organization', 'permission'],
  },
  {
    title: 'Admin profile',
    description: 'Current admin identity and session information',
    category: 'Account',
    key: 'profile',
    keywords: ['profile', 'admin', 'account', 'session'],
  },
];

const tenantRows = [
  { tenant: 'tenant-a.example.com', displayName: 'Tenant A', allowReg: true, active: true, updated: '2026-05-16' },
  { tenant: 'tenant-b.example.com', displayName: 'Tenant B', allowReg: false, active: true, updated: '2026-05-15' },
  { tenant: 'staging.example.com', displayName: 'Staging', allowReg: false, active: false, updated: '2026-05-12' },
];

const accessRows = [
  { user: 'admin@example.com', org: 'Root Organization', role: 'ORG_ADMIN', status: 'Active', lastSeen: 'Today' },
  { user: 'tenant.manager@example.com', org: 'Operations Unit', role: 'TENANT_MANAGER', status: 'Active', lastSeen: 'Yesterday' },
  { user: 'viewer@example.com', org: 'Sales Department', role: 'VIEWER', status: 'Limited', lastSeen: '3 days ago' },
  { user: 'support.agent@example.com', org: 'Support Region EU', role: 'SUPPORT_AGENT', status: 'Active', lastSeen: 'Today' },
  { user: 'auditor@example.com', org: 'Compliance Unit', role: 'AUDITOR', status: 'Limited', lastSeen: 'Last week' },
];

const directoryTotals = {
  organizations: '10,842+',
  roles: '12,604+',
  users: '10,000,000+',
  loadedRows: '50',
};

const adminActivity = [
  { title: 'Tenant whitelist updated', meta: 'tenant-a.example.com', time: 'Today, 10:42', tone: 'blue' as Tone },
  { title: 'Access role assigned', meta: 'TENANT_MANAGER', time: 'Yesterday', tone: 'green' as Tone },
  { title: 'Inactive tenant detected', meta: 'staging.example.com', time: 'Review', tone: 'amber' as Tone },
];

function toneClasses(tone: Tone) {
  const map = {
    blue: 'border-[#D2E3FC] bg-[#E8F0FE] text-[#1A73E8]',
    green: 'border-[#CEEAD6] bg-[#E6F4EA] text-[#137333]',
    amber: 'border-[#FDE293] bg-[#FEF7E0] text-[#B06000]',
    gray: 'border-[#DADCE0] bg-[#F1F3F4] text-[#5F6368]',
    red: 'border-[#FAD2CF] bg-[#FDECEA] text-[#B3261E]',
  };

  return map[tone];
}

function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses(tone)}`}>{children}</span>;
}

function initials() {
  return `${adminProfile.firstName[0] || ''}${adminProfile.lastName[0] || ''}`.toUpperCase() || 'A';
}

function PageCard({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_12px_32px_rgba(60,64,67,.10)] ring-1 ring-white/35 backdrop-blur-xl ${className}`}>
      {(title || description || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? <h2 className="text-xl font-normal text-[#202124]">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-6 text-[#5F6368]">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

function MetricCard({ title, value, note, icon: Icon, tone }: { title: string; value: string; note: string; icon: IconType; tone: Tone }) {
  return (
    <article className="rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_12px_32px_rgba(60,64,67,.10)] ring-1 ring-white/35 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-[#5F6368] shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
        <Badge tone={tone}>{note}</Badge>
      </div>
      <p className="text-sm font-medium text-[#5F6368]">{title}</p>
      <p className="mt-2 text-3xl font-normal tracking-tight text-[#202124]">{value}</p>
    </article>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  badge,
  badgeTone = 'gray',
  action,
}: {
  icon: IconType;
  title: string;
  description: string;
  badge?: string;
  badgeTone?: Tone;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1F3F4] text-[#5F6368]">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#202124]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[#5F6368]">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{badge ? <Badge tone={badgeTone}>{badge}</Badge> : action}</div>
    </div>
  );
}

function TextInput({ label, placeholder, type = 'text' }: { label: string; placeholder: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-white/70 bg-white/75 px-4 text-sm font-medium text-[#202124] outline-none shadow-sm backdrop-blur-md transition placeholder:text-[#9AA0A6] focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#D2E3FC]/70"
      />
    </label>
  );
}

function DashboardPage({ navigate }: { navigate: (key: AdminPageKey) => void }) {
  return (
    <div className="space-y-6">
      <section className="grid w-full grid-cols-1 gap-6 xl:grid-cols-3">
        <MetricCard title="Tenant whitelist" value="32" note="+5 this month" icon={FiLayers} tone="blue" />
        <MetricCard title="Active tenants" value="27" note="Healthy" icon={FiCheckCircle} tone="green" />
        <MetricCard title="Directory users" value="10M+" note="Query only" icon={FiUsers} tone="amber" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <PageCard
          title="Admin overview"
          description="Operational summary for tenant onboarding, SSO token validation, and access administration."
          action={
            <button type="button" onClick={() => navigate('tenants')} className="rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1765CC]">
              Open tenants
            </button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingRow icon={FiShield} title="SSO validation" description="Tenant tokens are checked before authorization." badge="Enabled" badgeTone="green" />
            <SettingRow icon={FiLock} title="Admin access" description="Control panel requires elevated privileges." badge="Protected" badgeTone="blue" />
            <SettingRow icon={FiClock} title="Last sync" description="Tenant whitelist cache refreshed recently." badge="Normal" badgeTone="green" />
            <SettingRow icon={FiAlertTriangle} title="Review queue" description="Inactive staging tenant needs attention." badge="1 item" badgeTone="amber" />
          </div>
        </PageCard>

        <PageCard title="Quick actions" description="Common admin operations.">
          <div className="space-y-3">
            <button type="button" onClick={() => navigate('tenants')} className="flex w-full items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-left text-sm font-medium text-[#202124] shadow-sm backdrop-blur-md hover:bg-white/75">
              Manage tenant whitelist
              <FiChevronRight className="h-4 w-4 text-[#9AA0A6]" />
            </button>
            <button type="button" onClick={() => navigate('access')} className="flex w-full items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-left text-sm font-medium text-[#202124] shadow-sm backdrop-blur-md hover:bg-white/75">
              Assign users and roles
              <FiChevronRight className="h-4 w-4 text-[#9AA0A6]" />
            </button>
            <button type="button" onClick={() => navigate('profile')} className="flex w-full items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-left text-sm font-medium text-[#202124] shadow-sm backdrop-blur-md hover:bg-white/75">
              Review admin profile
              <FiChevronRight className="h-4 w-4 text-[#9AA0A6]" />
            </button>
          </div>
        </PageCard>
      </section>

      <PageCard title="Recent admin activity" description="Latest visible control-panel events.">
        <div className="grid gap-3 md:grid-cols-3">
          {adminActivity.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/60 bg-white/45 p-4 shadow-sm backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge tone={item.tone}>{item.time}</Badge>
                {item.tone === 'amber' ? <FiAlertTriangle className="h-4 w-4 text-[#B06000]" /> : <FiCheckCircle className="h-4 w-4 text-[#137333]" />}
              </div>
              <p className="text-sm font-medium text-[#202124]">{item.title}</p>
              <p className="mt-1 text-xs text-[#5F6368]">{item.meta}</p>
            </div>
          ))}
        </div>
      </PageCard>
    </div>
  );
}

function TenantsPage() {
  return (
    <div className="space-y-6">
      <PageCard
        title="Tenant whitelist"
        description="Create and maintain tenant host entries used for SSO token validation."
        action={<Badge tone="blue">32 entries</Badge>}
      >
        <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
          <div className="rounded-[24px] border border-white/70 bg-gradient-to-br from-white/75 via-white/55 to-[#E8F0FE]/70 p-5 shadow-sm backdrop-blur-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/75 text-[#1A73E8] shadow-sm">
              <FiLayers className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-[#202124]">Whitelist control</h3>
            <p className="mt-2 text-sm leading-6 text-[#5F6368]">
              Add tenant domains, configure registration permission, and bind custom SSO tokens for trusted environments.
            </p>
            <div className="mt-5 space-y-3">
              <SettingRow icon={FiCheckCircle} title="Active tenants" description="Production-ready tenant records." badge="27" badgeTone="green" />
              <SettingRow icon={FiAlertTriangle} title="Inactive tenants" description="Disabled or pending review records." badge="5" badgeTone="amber" />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-medium text-[#202124]">Create or update tenant</h3>
                <p className="mt-1 text-xs leading-5 text-[#5F6368]">Use a stable tenant host and a unique random identifier.</p>
              </div>
              <Badge tone="blue">Draft</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Tenant host" placeholder="tenant.example.com" />
              <TextInput label="Tenant random ID" placeholder="TENANT-8F29" />
              <TextInput label="Display name" placeholder="Tenant display name" />
              <TextInput label="Custom SSO token" placeholder="Optional token override" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/50 p-3 text-sm text-[#202124]">
                Allow registration
                <input type="checkbox" className="h-4 w-4 accent-[#1A73E8]" />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/50 p-3 text-sm text-[#202124]">
                Active tenant
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#1A73E8]" />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-[#5F6368] hover:bg-white">
                Reset
              </button>
              <button type="button" className="rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1765CC]">
                Save tenant
              </button>
            </div>
          </div>
        </div>
      </PageCard>

      <PageCard title="Current whitelist" description="Review registered tenants and their current authorization state.">
        <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white/50 shadow-sm backdrop-blur-md">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/55 text-[#5F6368]">
              <tr>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Display name</th>
                <th className="px-4 py-3 font-medium">Registration</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/70 text-[#202124]">
              {tenantRows.map((tenant) => (
                <tr key={tenant.tenant} className="bg-white/30 hover:bg-white/50">
                  <td className="px-4 py-3 font-medium">{tenant.tenant}</td>
                  <td className="px-4 py-3 text-[#5F6368]">{tenant.displayName}</td>
                  <td className="px-4 py-3"><Badge tone={tenant.allowReg ? 'blue' : 'gray'}>{tenant.allowReg ? 'Allowed' : 'Closed'}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={tenant.active ? 'green' : 'amber'}>{tenant.active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-4 py-3 text-[#5F6368]">{tenant.updated}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="text-sm font-medium text-[#1A73E8] hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageCard>
    </div>
  );
}

function AccessPage() {
  const [entityTab, setEntityTab] = useState<'users' | 'organizations' | 'roles'>('users');
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState('50');
  const [scope, setScope] = useState('All tenants');

  const hasQuery = query.trim().length >= 3;

  const entityMeta = {
    users: {
      title: 'Users',
      total: directoryTotals.users,
      placeholder: 'Email, phone, subject ID, or name',
      columns: ['User', 'Organization', 'Role', 'Status', 'Last seen', 'Action'],
    },
    organizations: {
      title: 'Organizations',
      total: directoryTotals.organizations,
      placeholder: 'Organization name, code, tenant, or path',
      columns: ['Organization', 'Tenant scope', 'Members', 'Status', 'Updated', 'Action'],
    },
    roles: {
      title: 'Roles',
      total: directoryTotals.roles,
      placeholder: 'Role key, permission, scope, or privilege',
      columns: ['Role', 'Scope', 'Privilege', 'Status', 'Updated', 'Action'],
    },
  };

  const activeMeta = entityMeta[entityTab];

  const organizationRows = [
    { org: 'Root Organization', scope: 'Global', members: '2,481,920', status: 'Active', updated: 'Today' },
    { org: 'Operations Unit', scope: 'tenant-a.example.com', members: '812,450', status: 'Active', updated: 'Yesterday' },
    { org: 'Compliance Unit', scope: 'Global', members: '14,208', status: 'Protected', updated: 'May 14' },
    { org: 'Support Region EU', scope: 'eu.example.com', members: '244,901', status: 'Active', updated: 'May 12' },
    { org: 'Archive Department', scope: 'legacy.example.com', members: '9,203', status: 'Limited', updated: 'May 8' },
  ];

  const roleRows = [
    { role: 'ORG_ADMIN', scope: 'Organization', privilege: 'High', status: 'Protected', updated: 'Today' },
    { role: 'TENANT_MANAGER', scope: 'Tenant', privilege: 'Admin', status: 'Active', updated: 'Yesterday' },
    { role: 'AUDITOR', scope: 'Global', privilege: 'Read-only', status: 'Active', updated: 'May 13' },
    { role: 'SUPPORT_AGENT', scope: 'Tenant', privilege: 'Limited', status: 'Active', updated: 'May 12' },
    { role: 'VIEWER', scope: 'Organization', privilege: 'Safe', status: 'Active', updated: 'May 9' },
  ];

  return (
    <div className="space-y-6">
      <section className="grid w-full gap-6 xl:grid-cols-4">
        <MetricCard title="Organizations" value={directoryTotals.organizations} note="Indexed" icon={FiLayers} tone="blue" />
        <MetricCard title="Roles" value={directoryTotals.roles} note="Scoped" icon={FiKey} tone="green" />
        <MetricCard title="Users" value={directoryTotals.users} note="Search" icon={FiUsers} tone="amber" />
        <MetricCard title="Page size" value={pageSize} note="Rows" icon={FiGrid} tone="gray" />
      </section>

      <PageCard
        title="Access management"
        action={
          <button type="button" className="rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1765CC]">
            New assignment
          </button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {(['users', 'organizations', 'roles'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setEntityTab(tab)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      entityTab === tab ? 'bg-[#1A73E8] text-white shadow-sm' : 'border border-white/70 bg-white/60 text-[#5F6368] hover:bg-white'
                    }`}
                  >
                    {entityMeta[tab].title}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Badge tone="gray">Total {activeMeta.total}</Badge>
                <Badge tone={hasQuery ? 'green' : 'amber'}>{hasQuery ? 'Ready' : 'Type 3+ chars'}</Badge>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_180px_120px_auto]">
              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">Search</span>
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F6368]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={activeMeta.placeholder}
                    className="h-12 w-full rounded-2xl border border-white/70 bg-white/75 pl-11 pr-4 text-sm font-medium text-[#202124] outline-none shadow-sm backdrop-blur-md transition placeholder:text-[#9AA0A6] focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#D2E3FC]/70"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">Scope</span>
                <select
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/70 bg-white/75 px-4 text-sm font-medium text-[#202124] outline-none shadow-sm backdrop-blur-md focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#D2E3FC]/70"
                >
                  <option>All tenants</option>
                  <option>Global only</option>
                  <option>tenant-a.example.com</option>
                  <option>eu.example.com</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">Limit</span>
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/70 bg-white/75 px-4 text-sm font-medium text-[#202124] outline-none shadow-sm backdrop-blur-md focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#D2E3FC]/70"
                >
                  <option>25</option>
                  <option>50</option>
                  <option>100</option>
                </select>
              </label>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="h-12 rounded-full border border-white/70 bg-white/70 px-4 text-sm font-medium text-[#5F6368] hover:bg-white"
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={!hasQuery}
                  className={`h-12 rounded-full px-5 text-sm font-medium shadow-sm ${
                    hasQuery ? 'bg-[#1A73E8] text-white hover:bg-[#1765CC]' : 'cursor-not-allowed bg-[#F1F3F4] text-[#9AA0A6]'
                  }`}
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white/50 shadow-sm backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/70 bg-white/45 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#202124]">{activeMeta.title}</p>
                <p className="mt-1 text-xs text-[#5F6368]">Page 1 · {pageSize} rows · Cursor <span className="font-mono">eyJwYWdlIjoxfQ</span></p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-full border border-white/70 bg-white/70 px-3 py-2 text-xs font-medium text-[#5F6368] hover:bg-white">
                  Columns
                </button>
                <button type="button" className="rounded-full border border-white/70 bg-white/70 px-3 py-2 text-xs font-medium text-[#5F6368] hover:bg-white">
                  Export page
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {entityTab === 'users' ? (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/55 text-[#5F6368]">
                    <tr>{activeMeta.columns.map((column) => <th key={column} className="px-4 py-3 font-medium">{column}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-white/70 text-[#202124]">
                    {accessRows.map((row) => (
                      <tr key={`${row.user}-${row.role}`} className="bg-white/30 hover:bg-white/50">
                        <td className="px-4 py-3 font-medium">{row.user}</td>
                        <td className="px-4 py-3 text-[#5F6368]">{row.org}</td>
                        <td className="px-4 py-3"><Badge tone="blue">{row.role}</Badge></td>
                        <td className="px-4 py-3"><Badge tone={row.status === 'Active' ? 'green' : 'amber'}>{row.status}</Badge></td>
                        <td className="px-4 py-3 text-[#5F6368]">{row.lastSeen}</td>
                        <td className="px-4 py-3 text-right"><button type="button" className="text-sm font-medium text-[#1A73E8] hover:underline">Manage</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}

              {entityTab === 'organizations' ? (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/55 text-[#5F6368]">
                    <tr>{activeMeta.columns.map((column) => <th key={column} className="px-4 py-3 font-medium">{column}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-white/70 text-[#202124]">
                    {organizationRows.map((row) => (
                      <tr key={row.org} className="bg-white/30 hover:bg-white/50">
                        <td className="px-4 py-3 font-medium">{row.org}</td>
                        <td className="px-4 py-3 text-[#5F6368]">{row.scope}</td>
                        <td className="px-4 py-3 text-[#5F6368]">{row.members}</td>
                        <td className="px-4 py-3"><Badge tone={row.status === 'Active' ? 'green' : row.status === 'Protected' ? 'blue' : 'amber'}>{row.status}</Badge></td>
                        <td className="px-4 py-3 text-[#5F6368]">{row.updated}</td>
                        <td className="px-4 py-3 text-right"><button type="button" className="text-sm font-medium text-[#1A73E8] hover:underline">Open</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}

              {entityTab === 'roles' ? (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/55 text-[#5F6368]">
                    <tr>{activeMeta.columns.map((column) => <th key={column} className="px-4 py-3 font-medium">{column}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-white/70 text-[#202124]">
                    {roleRows.map((row) => (
                      <tr key={row.role} className="bg-white/30 hover:bg-white/50">
                        <td className="px-4 py-3 font-medium">{row.role}</td>
                        <td className="px-4 py-3 text-[#5F6368]">{row.scope}</td>
                        <td className="px-4 py-3"><Badge tone={row.privilege === 'High' ? 'red' : row.privilege === 'Admin' ? 'blue' : 'green'}>{row.privilege}</Badge></td>
                        <td className="px-4 py-3"><Badge tone={row.status === 'Protected' ? 'blue' : 'green'}>{row.status}</Badge></td>
                        <td className="px-4 py-3 text-[#5F6368]">{row.updated}</td>
                        <td className="px-4 py-3 text-right"><button type="button" className="text-sm font-medium text-[#1A73E8] hover:underline">Manage</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/70 bg-white/45 px-4 py-3">
              <p className="text-xs text-[#5F6368]">Showing {Math.min(Number(pageSize), 50)} of {activeMeta.total}</p>
              <div className="flex gap-2">
                <button type="button" disabled className="cursor-not-allowed rounded-full border border-white/70 bg-white/50 px-3 py-2 text-xs font-medium text-[#9AA0A6]">
                  Previous
                </button>
                <button type="button" className="rounded-full border border-white/70 bg-white/70 px-3 py-2 text-xs font-medium text-[#1A73E8] hover:bg-white">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageCard>
    </div>
  );
}

function ProfilePage() {
  return (
    <PageCard
      title="Admin profile"
      description="Current administrator identity and control-panel session state."
      action={<button type="button" className="inline-flex items-center gap-2 rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1765CC]"><FiEdit2 className="h-4 w-4" />Edit</button>}
    >
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="rounded-[24px] border border-white/70 bg-gradient-to-br from-white/75 via-white/55 to-[#E8F0FE]/70 p-5 text-center shadow-sm backdrop-blur-md">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/70 bg-white/65 text-2xl font-semibold text-[#1A73E8] shadow-sm">
            {initials()}
          </div>
          <h3 className="mt-4 text-lg font-medium text-[#202124]">{adminProfile.firstName} {adminProfile.lastName}</h3>
          <p className="mt-1 break-all text-xs leading-5 text-[#5F6368]">{adminProfile.email}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Badge tone="green">Active</Badge>
            <Badge tone="blue">Admin</Badge>
          </div>
        </div>

        <div className="space-y-3">
          <SettingRow icon={FiUser} title="Role" description={adminProfile.role} badge="Protected" badgeTone="blue" />
          <SettingRow icon={FiClock} title="Last seen" description={adminProfile.lastSeen} badge="Normal" badgeTone="green" />
          <SettingRow icon={FiShield} title="Admin protection" description="Control panel access requires elevated privileges." badge="Enabled" badgeTone="green" />
          <SettingRow icon={FiLock} title="Session policy" description="Sensitive operations should require confirmation." badge="Recommended" badgeTone="amber" />
        </div>
      </div>
    </PageCard>
  );
}

function TopBar({
  activeItem,
  onNavigate,
}: {
  activeItem: NavItem;
  onNavigate: (key: AdminPageKey) => void;
}) {
  const [openPanel, setOpenPanel] = useState<'search' | 'language' | 'notifications' | 'profile' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const panelClass =
    'absolute right-0 top-[52px] w-[320px] rounded-[28px] border border-white/60 bg-white/80 p-3 shadow-[0_18px_44px_rgba(60,64,67,.22)] ring-1 ring-white/35 backdrop-blur-xl';

  const togglePanel = (panel: 'language' | 'notifications' | 'profile') => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = searchItems
    .filter((item) => {
      if (!normalizedQuery) return true;
      return [item.title, item.description, item.category, ...item.keywords].join(' ').toLowerCase().includes(normalizedQuery);
    })
    .slice(0, normalizedQuery ? 6 : 4);

  const openSearchResult = (key: AdminPageKey) => {
    onNavigate(key);
    setOpenPanel(null);
    setSearchQuery('');
  };

  return (
    <header className="fixed left-4 right-4 top-4 z-40 rounded-[28px] border border-white/60 bg-white/65 px-4 py-2.5 shadow-[0_12px_32px_rgba(60,64,67,.12)] ring-1 ring-white/35 backdrop-blur-xl md:left-[320px] md:right-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 px-1">
          <p className="text-xs font-medium text-[#5F6368]">ADA Admin</p>
          <h1 className="truncate text-lg font-normal text-[#202124] md:text-xl">{activeItem.label}</h1>
        </div>

        <div className="relative hidden min-w-[280px] max-w-[440px] flex-1 lg:block">
          <div
            className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition ${
              openPanel === 'search' ? 'border-[#D2E3FC] bg-white shadow-sm' : 'border-transparent bg-[#F1F3F4] text-[#5F6368]'
            }`}
          >
            <FiSearch className="h-4 w-4 shrink-0 text-[#5F6368]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setOpenPanel('search');
              }}
              onFocus={() => setOpenPanel('search')}
              placeholder="Search tenants, roles, users..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#80868B]"
            />
          </div>

          {openPanel === 'search' ? (
            <div className="absolute left-0 right-0 top-[52px] rounded-[28px] border border-white/60 bg-white/80 p-3 shadow-[0_18px_44px_rgba(60,64,67,.22)] ring-1 ring-white/35 backdrop-blur-xl">
              <div className="px-2 pb-3 pt-1">
                <p className="text-sm font-medium text-[#202124]">Search</p>
                <p className="mt-1 text-xs text-[#5F6368]">{normalizedQuery ? `Results for “${searchQuery}”` : 'Quick access to admin sections.'}</p>
              </div>

              <div className="space-y-1">
                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => openSearchResult(item.key)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left hover:bg-[#F8F9FA]"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1F3F4] text-[#5F6368]">
                          <FiSearch className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[#202124]">{item.title}</span>
                          <span className="block truncate text-xs text-[#5F6368]">{item.description}</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge tone="blue">{item.category}</Badge>
                        <FiChevronRight className="h-4 w-4 text-[#9AA0A6]" />
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#F8F9FA] px-3 py-4 text-center">
                    <p className="text-sm font-medium text-[#202124]">No results found</p>
                    <p className="mt-1 text-xs text-[#5F6368]">Try tenant, role, user, access, or dashboard.</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => togglePanel('language')}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                openPanel === 'language' ? 'border-[#D2E3FC] bg-[#E8F0FE] text-[#1A73E8]' : 'border-[#DADCE0] bg-white text-[#5F6368] hover:bg-[#F8F9FA]'
              }`}
            >
              <FiGlobe className="h-4 w-4" />
              English
              <FiChevronDown className="h-4 w-4" />
            </button>

            {openPanel === 'language' ? (
              <div className={panelClass}>
                <div className="px-2 pb-3 pt-1">
                  <p className="text-sm font-medium text-[#202124]">Language</p>
                  <p className="mt-1 text-xs text-[#5F6368]">Choose the admin panel display language.</p>
                </div>
                {['English', 'فارسی', 'Deutsch', 'العربية'].map((language, index) => (
                  <button key={language} type="button" className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left ${index === 0 ? 'bg-[#E8F0FE]' : 'hover:bg-[#F8F9FA]'}`}>
                    <span className="text-sm font-medium text-[#202124]">{language}</span>
                    {index === 0 ? <FiCheckCircle className="h-5 w-5 text-[#1A73E8]" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button type="button" aria-label="Help" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5F6368] hover:bg-[#F1F3F4]">
            <FiHelpCircle className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => togglePanel('notifications')}
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
                openPanel === 'notifications' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368] hover:bg-[#F1F3F4]'
              }`}
            >
              <FiBell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#B3261E] ring-2 ring-white" />
            </button>

            {openPanel === 'notifications' ? (
              <div className={panelClass}>
                <div className="flex items-start justify-between gap-4 px-2 pb-3 pt-1">
                  <div>
                    <p className="text-sm font-medium text-[#202124]">Admin alerts</p>
                    <p className="mt-1 text-xs text-[#5F6368]">Tenant and access events.</p>
                  </div>
                  <Badge tone="red">2 new</Badge>
                </div>
                {adminActivity.map((item) => (
                  <button key={item.title} type="button" className="flex w-full gap-3 rounded-2xl px-3 py-3 text-left hover:bg-[#F8F9FA]">
                    <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border ${toneClasses(item.tone)}`} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[#202124]">{item.title}</span>
                      <span className="block truncate text-xs text-[#5F6368]">{item.meta}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => togglePanel('profile')}
              className={`inline-flex h-10 items-center gap-2 rounded-full pl-1.5 pr-2 transition ${openPanel === 'profile' ? 'bg-[#E8F0FE]' : 'hover:bg-[#F1F3F4]'}`}
              aria-label="Account menu"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F0FE] text-sm font-semibold text-[#1A73E8]">{initials()}</span>
              <FiChevronDown className="hidden h-4 w-4 text-[#5F6368] sm:block" />
            </button>

            {openPanel === 'profile' ? (
              <div className={panelClass}>
                <div className="rounded-[22px] bg-[#F8F9FA] p-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0FE] text-lg font-semibold text-[#1A73E8]">{initials()}</div>
                  <p className="mt-3 text-sm font-medium text-[#202124]">{adminProfile.firstName} {adminProfile.lastName}</p>
                  <p className="mt-1 break-all text-xs text-[#5F6368]">{adminProfile.email}</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <Badge tone="green">Active</Badge>
                    <Badge tone="blue">Admin</Badge>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('profile');
                      setOpenPanel(null);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm text-[#202124] hover:bg-[#F8F9FA]"
                  >
                    <span className="flex items-center gap-3"><FiUser className="h-5 w-5 text-[#5F6368]" />Admin profile</span>
                    <FiChevronRight className="h-4 w-4 text-[#9AA0A6]" />
                  </button>
                  <button type="button" className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[#B3261E] hover:bg-[#FDECEA]">
                    <FiLogOut className="h-5 w-5" />Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ activePage, onNavigate }: { activePage: AdminPageKey; onNavigate: (key: AdminPageKey) => void }) {
  return (
    <aside className="hidden md:block md:w-0 md:shrink-0">
      <nav className="fixed bottom-4 left-4 top-4 z-30 flex w-[288px] flex-col rounded-[28px] border border-white/60 bg-white/65 p-3 shadow-[0_12px_32px_rgba(60,64,67,.12)] ring-1 ring-white/35 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#202124] text-sm font-semibold text-white shadow-sm">ADA</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#202124]">ADA Admin</p>
            <p className="text-xs text-[#5F6368]">Control panel</p>
          </div>
        </div>

        <div className="mt-3 rounded-[22px] border border-white/60 bg-white/45 p-3 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F0FE] text-sm font-semibold text-[#1A73E8]">{initials()}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#202124]">{adminProfile.firstName} {adminProfile.lastName}</p>
              <p className="truncate text-xs text-[#5F6368]">{adminProfile.role}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Badge tone="green">Active</Badge>
            <span className="text-xs text-[#5F6368]">Admin</span>
          </div>
        </div>

        <div className="mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9AA0A6]">Control</div>

        <ul className="mt-2 flex-1 space-y-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.key === activePage;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onNavigate(item.key)}
                  className={`group relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-3 py-2.5 text-sm transition-all duration-300 ease-out ${
                    active
                      ? 'bg-[#EEF4FF] text-[#1A73E8] shadow-[inset_0_0_0_1px_rgba(26,115,232,.08)]'
                      : 'text-[#5F6368] hover:bg-[#F8F9FA] hover:text-[#202124]'
                  }`}
                >
                  <span className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#1A73E8] transition-all duration-300 ease-out ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`} />
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ease-out ${active ? 'bg-white text-[#1A73E8] shadow-sm' : 'bg-transparent text-[#5F6368] group-hover:bg-white group-hover:text-[#202124]'}`}>
                      <Icon className={`h-5 w-5 transition-transform duration-300 ease-out ${active ? 'scale-105' : 'group-hover:scale-105'}`} />
                    </span>
                    <span className="min-w-0 text-left">
                      <span className={`block truncate font-medium transition-all duration-300 ease-out ${active ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'}`}>{item.label}</span>
                      <span className="block truncate text-[11px] opacity-70">{item.description}</span>
                    </span>
                  </span>
                  <span className={`h-2 w-2 shrink-0 rounded-full bg-[#1A73E8] transition-all duration-300 ease-out ${active ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 border-t border-white/60 pt-3">
          <div className="rounded-2xl border border-white/60 bg-white/45 px-3 py-2 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-[#202124]">Session</span>
              <Badge tone="green">Secure</Badge>
            </div>
            <p className="mt-1 text-xs text-[#5F6368]">Last seen: {adminProfile.lastSeen}</p>
          </div>
        </div>
      </nav>
    </aside>
  );
}

export function AdminPanelExportTemplate() {
  const [activePage, setActivePage] = useState<AdminPageKey>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeItem = useMemo(() => navItems.find((item) => item.key === activePage) || navItems[0], [activePage]);

  const navigate = (key: AdminPageKey) => {
    setActivePage(key);
    setMobileMenuOpen(false);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#F6F8FC] pb-24 pt-24 text-[#202124] md:pb-8" dir="ltr">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_14%_18%,rgba(59,130,246,.34),transparent_34%),radial-gradient(circle_at_86%_10%,rgba(71,85,105,.26),transparent_32%),radial-gradient(circle_at_72%_84%,rgba(96,165,250,.20),transparent_36%),linear-gradient(135deg,#CBD5E1_0%,#B8C7DA_38%,#AEBED2_68%,#D6DEE8_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,.18),rgba(255,255,255,.04)_45%,rgba(15,23,42,.12))]" />
        <div className="absolute left-[12%] top-[18%] h-64 w-64 rounded-full bg-sky-500/18 blur-3xl" />
        <div className="absolute right-[8%] top-[14%] h-72 w-72 rounded-full bg-slate-700/16 blur-3xl" />
        <div className="absolute bottom-[6%] left-[42%] h-80 w-80 rounded-full bg-blue-400/14 blur-3xl" />
      </div>

      <TopBar activeItem={activeItem} onNavigate={navigate} />

      <div className="relative z-10 flex min-h-[calc(100vh-5rem)] w-full items-stretch px-4 md:pl-[320px] md:pr-4">
        <Sidebar activePage={activePage} onNavigate={navigate} />

        <section className="min-w-0 flex w-full flex-1 flex-col gap-6 pt-2 md:pt-4">
          <div className="flex w-full max-w-[1120px] flex-1 flex-col gap-6">
            {activePage === 'dashboard' ? <DashboardPage navigate={navigate} /> : null}
            {activePage === 'tenants' ? <TenantsPage /> : null}
            {activePage === 'access' ? <AccessPage /> : null}
            {activePage === 'profile' ? <ProfilePage /> : null}
          </div>
        </section>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed bottom-[76px] left-3 right-3 z-50 rounded-[24px] border border-white/60 bg-white/80 p-2 shadow-[0_18px_44px_rgba(60,64,67,.22)] ring-1 ring-white/35 backdrop-blur-xl md:hidden">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.key)}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm text-[#202124] hover:bg-[#F8F9FA]"
            >
              <span>{item.label}</span>
              <FiChevronRight className="h-4 w-4 text-[#9AA0A6]" />
            </button>
          ))}
        </div>
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/60 bg-white/75 px-2 py-2 shadow-[0_-10px_30px_rgba(60,64,67,.10)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-[640px] grid-cols-4 gap-1">
          <button type="button" onClick={() => navigate('tenants')} className={`rounded-xl px-1 py-2 text-[11px] ${activePage === 'tenants' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}>
            <FiLayers className="mx-auto mb-1 h-4 w-4" />
            <span>Tenants</span>
          </button>

          <button type="button" onClick={() => navigate('dashboard')} className="rounded-xl px-1 py-2" aria-label="Dashboard">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1A73E8] text-white shadow-[0_6px_14px_rgba(26,115,232,.35)]">
              <FiHome className="h-5 w-5" />
            </span>
          </button>

          <button type="button" onClick={() => navigate('access')} className={`rounded-xl px-1 py-2 text-[11px] ${activePage === 'access' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}>
            <FiUsers className="mx-auto mb-1 h-4 w-4" />
            <span>Access</span>
          </button>

          <button type="button" onClick={() => setMobileMenuOpen((prev) => !prev)} className={`rounded-xl px-1 py-2 text-[11px] ${mobileMenuOpen ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}>
            <FiMoreHorizontal className="mx-auto mb-1 h-4 w-4" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </main>
  );
}

export default AdminPanelExportTemplate;
