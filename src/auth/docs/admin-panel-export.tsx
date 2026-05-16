import { useMemo, useState } from 'react';
import {
  FiChevronRight,
  FiGlobe,
  FiGrid,
  FiHome,
  FiLayers,
  FiLogOut,
  FiMoreHorizontal,
  FiUser,
  FiUsers,
} from 'react-icons/fi';

type AdminPageKey = 'dashboard' | 'tenants' | 'access' | 'profile';

type NavItem = {
  key: AdminPageKey;
  label: string;
  icon: typeof FiGrid;
};

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: FiGrid },
  { key: 'tenants', label: 'Tenants', icon: FiLayers },
  { key: 'access', label: 'Access', icon: FiUsers },
  { key: 'profile', label: 'Profile', icon: FiUser },
];

const cardClass =
  'rounded-[28px] border border-white/60 bg-white/70 p-6 shadow-[0_12px_32px_rgba(60,64,67,.10)] ring-1 ring-white/35 backdrop-blur-xl';

const profileBackgroundStyle = {
  background: `
    radial-gradient(circle at 14% 18%, rgba(59, 130, 246, 0.34), transparent 34%),
    radial-gradient(circle at 86% 10%, rgba(71, 85, 105, 0.26), transparent 32%),
    radial-gradient(circle at 72% 84%, rgba(96, 165, 250, 0.20), transparent 36%),
    linear-gradient(135deg, #CBD5E1 0%, #B8C7DA 38%, #AEBED2 68%, #D6DEE8 100%)
  `,
};

const profileBackgroundOverlayStyle = {
  background: `
    linear-gradient(
      120deg,
      rgba(15, 23, 42, 0.18),
      rgba(255, 255, 255, 0.04) 45%,
      rgba(15, 23, 42, 0.12)
    )
  `,
};

function DashboardSection() {
  return (
    <div className="space-y-6">
      <section className="grid w-full grid-cols-1 gap-6 xl:grid-cols-3">
        <article className={cardClass}>
          <h2 className="text-lg text-[#202124]">Tenant whitelist entries</h2>
          <p className="mt-2 text-sm text-[#5F6368]">32</p>
        </article>
        <article className={cardClass}>
          <h2 className="text-lg text-[#202124]">Active tenants</h2>
          <p className="mt-2 text-sm text-[#5F6368]">27</p>
        </article>
        <article className={cardClass}>
          <h2 className="text-lg text-[#202124]">Auth admin user</h2>
          <p className="mt-2 truncate text-sm text-[#5F6368]">admin@example.com</p>
        </article>
      </section>

      <section className={cardClass}>
        <h2 className="text-xl text-[#202124]">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="inline-flex items-center justify-center rounded-full bg-[#1A73E8] px-5 py-2.5 text-sm font-medium text-white">
            Open tenant panel
          </button>
          <button type="button" className="inline-flex items-center justify-center rounded-full border border-[#DADCE0] bg-white px-5 py-2.5 text-sm font-medium text-[#1A73E8]">
            Access management
          </button>
        </div>
      </section>
    </div>
  );
}

function TenantsSection() {
  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <h2 className="text-xl text-[#202124]">Create or update tenant entry</h2>
        <p className="mt-1 text-sm text-[#5F6368]">Whitelist controls for tenant host and SSO token validation.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {['Tenant name', 'Tenant rand id', 'Tenant display name', 'Custom SSO token'].map((label) => (
            <label key={label} className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#5F6368]">{label}</span>
              <input
                type="text"
                className="w-full rounded-xl border border-[#DADCE0] bg-white px-3 py-2.5 text-sm text-[#202124] outline-none"
                placeholder={label}
              />
            </label>
          ))}
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-xl text-[#202124]">Current whitelist</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#E8EAED]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8F9FA] text-[#5F6368]">
              <tr>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Allow Reg</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="bg-white text-[#202124]">
              <tr className="border-t border-[#E8EAED]">
                <td className="px-4 py-3">tenant-a.example.com</td>
                <td className="px-4 py-3">yes</td>
                <td className="px-4 py-3">yes</td>
                <td className="px-4 py-3">2026-05-16</td>
              </tr>
              <tr className="border-t border-[#E8EAED]">
                <td className="px-4 py-3">tenant-b.example.com</td>
                <td className="px-4 py-3">no</td>
                <td className="px-4 py-3">yes</td>
                <td className="px-4 py-3">2026-05-15</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AccessSection() {
  return (
    <div className="space-y-6">
      <section className="grid w-full grid-cols-1 gap-6 xl:grid-cols-2">
        <article className={cardClass}>
          <h2 className="text-xl text-[#202124]">Organizations</h2>
          <ul className="mt-4 space-y-2 text-sm text-[#5F6368]">
            <li>Root Organization</li>
            <li>Sales Department</li>
            <li>Operations Unit</li>
          </ul>
        </article>
        <article className={cardClass}>
          <h2 className="text-xl text-[#202124]">Roles</h2>
          <ul className="mt-4 space-y-2 text-sm text-[#5F6368]">
            <li>ORG_ADMIN</li>
            <li>TENANT_MANAGER</li>
            <li>VIEWER</li>
          </ul>
        </article>
      </section>

      <section className={cardClass}>
        <h2 className="text-xl text-[#202124]">Users</h2>
        <p className="mt-1 text-sm text-[#5F6368]">Static template for user-to-org and user-to-role assignment table.</p>
      </section>
    </div>
  );
}

export function AdminPanelExportTemplate() {
  const [activePage, setActivePage] = useState<AdminPageKey>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTitle = useMemo(
    () => navItems.find((item) => item.key === activePage)?.label || 'Dashboard',
    [activePage],
  );

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#F6F8FC] pb-24 pt-24 text-[#202124]" dir="ltr">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0" style={profileBackgroundStyle} />
        <div className="absolute inset-0" style={profileBackgroundOverlayStyle} />
      </div>

      <header className="fixed left-4 right-4 top-4 z-40 rounded-[28px] border border-white/60 bg-white/65 px-4 py-2.5 shadow-[0_12px_32px_rgba(60,64,67,.12)] ring-1 ring-white/35 backdrop-blur-xl md:left-[320px]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 px-1">
            <p className="text-xs font-medium text-[#5F6368]">ADA Account</p>
            <h1 className="truncate text-lg text-[#202124] md:text-xl">{activeTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-2 text-sm text-[#5F6368]">
              <FiGlobe className="h-4 w-4" />
              English
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/70 text-[#5F6368]"
              aria-label="Logout"
            >
              <FiLogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-[calc(100vh-5rem)] w-full items-stretch px-4 md:pl-[320px] md:pr-4">
        <aside className="hidden md:block md:w-0 md:shrink-0">
          <nav className="fixed bottom-4 left-3 top-4 z-30 flex w-[288px] flex-col rounded-[28px] border border-white/60 bg-white/65 p-3 shadow-[0_12px_32px_rgba(60,64,67,.12)] ring-1 ring-white/35 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#202124] text-sm font-semibold text-white">ADA</div>
              <div>
                <p className="text-sm font-semibold text-[#202124]">ADA Account</p>
                <p className="text-xs text-[#5F6368]">Control Panel</p>
              </div>
            </div>

            <ul className="mt-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.key === activePage;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => setActivePage(item.key)}
                      className={`group relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-3 py-2.5 text-sm transition-all ${
                        active
                          ? 'bg-[#EEF4FF] text-[#1A73E8] shadow-[inset_0_0_0_1px_rgba(26,115,232,.08)]'
                          : 'text-[#5F6368] hover:bg-[#F8F9FA] hover:text-[#202124]'
                      }`}
                    >
                      <span className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#1A73E8] ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`} />
                      <span className="flex items-center gap-3">
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-white text-[#1A73E8]' : ''}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="font-medium">{item.label}</span>
                      </span>
                      <span className={`h-2 w-2 rounded-full bg-[#1A73E8] ${active ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <section className="min-w-0 flex w-full flex-1 flex-col gap-6 pt-2 md:pt-4">
          {activePage === 'dashboard' ? <DashboardSection /> : null}
          {activePage === 'tenants' ? <TenantsSection /> : null}
          {activePage === 'access' ? <AccessSection /> : null}
          {activePage === 'profile' ? (
            <section className={cardClass}>
              <h2 className="text-xl text-[#202124]">Profile</h2>
              <p className="mt-2 text-sm text-[#5F6368]">Profile page entry point template.</p>
            </section>
          ) : null}
        </section>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed bottom-[76px] left-3 right-3 z-50 rounded-[24px] border border-white/60 bg-white/80 p-2 shadow-[0_18px_44px_rgba(60,64,67,.22)] ring-1 ring-white/35 backdrop-blur-xl md:hidden">
          {navItems.slice(0, 3).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setActivePage(item.key);
                setMobileMenuOpen(false);
              }}
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
          <button
            type="button"
            onClick={() => {
              setActivePage('tenants');
              setMobileMenuOpen(false);
            }}
            className={`rounded-xl px-1 py-2 text-[11px] ${activePage === 'tenants' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}
          >
            <FiLayers className="mx-auto mb-1 h-4 w-4" />
            <span>Tenants</span>
          </button>

          <button type="button" onClick={() => setActivePage('dashboard')} className="rounded-xl px-1 py-2">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1A73E8] text-white shadow-[0_6px_14px_rgba(26,115,232,.35)]">
              <FiHome className="h-5 w-5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('access');
              setMobileMenuOpen(false);
            }}
            className={`rounded-xl px-1 py-2 text-[11px] ${activePage === 'access' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}
          >
            <FiUsers className="mx-auto mb-1 h-4 w-4" />
            <span>Access</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`rounded-xl px-1 py-2 text-[11px] ${mobileMenuOpen ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}
          >
            <FiMoreHorizontal className="mx-auto mb-1 h-4 w-4" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </main>
  );
}

export default AdminPanelExportTemplate;
