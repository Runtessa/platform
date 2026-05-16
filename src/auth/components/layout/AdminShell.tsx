import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  FiBell,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiGlobe,
  FiGrid,
  FiHelpCircle,
  FiHome,
  FiLayers,
  FiLogOut,
  FiMoreHorizontal,
  FiSearch,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { UI_LOCALE_OPTIONS, localeDir, useUiLocale } from '../../lib/ui/locale';
import { getAuthMessages } from '../../lib/ui/i18n';

type SessionPayload = {
  authenticated: boolean;
  csrfToken?: string;
  user?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    isAuthAdmin?: boolean;
  };
};

type AdminShellProps = {
  children: ReactNode;
};

type NavItem = {
  key: 'dashboard' | 'tenants' | 'access' | 'profile';
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const mobileBeforeKeys: Array<NavItem['key']> = ['tenants'];
const mobileAfterKeys: Array<NavItem['key']> = ['access'];
const mobileHomeKey: NavItem['key'] = 'dashboard';
const desktopRailLeft = '0.75rem';

const shellPanelClass =
  'rounded-[28px] border border-white/60 bg-white/65 shadow-[0_12px_32px_rgba(60,64,67,.12)] ring-1 ring-white/35 backdrop-blur-xl';

const backgroundRootClass =
  'pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_14%_18%,rgba(59,130,246,.34),transparent_34%),radial-gradient(circle_at_86%_10%,rgba(71,85,105,.26),transparent_32%),radial-gradient(circle_at_72%_84%,rgba(96,165,250,.20),transparent_36%),linear-gradient(135deg,#CBD5E1_0%,#B8C7DA_38%,#AEBED2_68%,#D6DEE8_100%)]';

const initialsFrom = (firstName?: string, lastName?: string, fallback = 'A'): string => {
  const first = String(firstName || '').trim().charAt(0);
  const last = String(lastName || '').trim().charAt(0);
  return `${first}${last || String(firstName || '').trim().charAt(1) || ''}`.toUpperCase() || fallback;
};

export const AdminShell = ({ children }: AdminShellProps) => {
  const router = useRouter();
  const { locale, isRtl, setLocale } = useUiLocale();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<'search' | 'language' | 'notifications' | 'profile' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const topBarRef = useRef<HTMLDivElement | null>(null);

  const messages = getAuthMessages(locale);
  const copy = messages.shell;
  const profileCopy = messages.profile;

  const adminNavItems: NavItem[] = useMemo(
    () => [
      { key: 'dashboard', href: '/admin', icon: FiGrid, description: 'System overview' },
      { key: 'tenants', href: '/admin/tenants', icon: FiLayers, description: 'Whitelist and SSO tokens' },
      { key: 'access', href: '/admin/access', icon: FiUsers, description: 'Organizations, roles, users' },
    ],
    [],
  );
  const profileNavItem: NavItem = useMemo(
    () => ({ key: 'profile', href: '/profile', icon: FiUser, description: profileCopy.title }),
    [profileCopy.title],
  );

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch('/api/session', { credentials: 'include' });
        const data = (await res.json()) as SessionPayload;
        setSession(data);
      } catch {
        setSession({ authenticated: false });
      }
    };

    void loadSession();
  }, [router.asPath]);

  useEffect(() => {
    const close = () => setMobileMenuOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (mobileMenuRef.current && target && !mobileMenuRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!openPanel) return;
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (topBarRef.current && target && !topBarRef.current.contains(target)) {
        setOpenPanel(null);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [openPanel]);

  const hasAdminPrivilege = Boolean(session?.authenticated && session.user?.isAuthAdmin);
  const navItems = useMemo(
    () => (hasAdminPrivilege ? [...adminNavItems, profileNavItem] : [profileNavItem]),
    [adminNavItems, hasAdminPrivilege, profileNavItem],
  );

  const isActive = (href: string): boolean => {
    if (href === '/admin') return router.pathname === '/admin';
    return router.pathname === href || router.pathname.startsWith(`${href}/`);
  };

  const navigate = (href: string) => {
    setMobileMenuOpen(false);
    setOpenPanel(null);
    void router.push(href);
  };

  const logout = async () => {
    try {
      if (session?.authenticated && session.csrfToken) {
        await fetch('/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: { 'X-CSRF-Token': session.csrfToken },
        });
      }
    } finally {
      void router.push('/login');
    }
  };

  const mobileBeforeItems = useMemo(() => {
    if (!hasAdminPrivilege) return [];
    return navItems.filter((item) => mobileBeforeKeys.includes(item.key));
  }, [hasAdminPrivilege, navItems]);
  const mobileAfterItems = useMemo(() => {
    if (!hasAdminPrivilege) return [];
    return navItems.filter((item) => mobileAfterKeys.includes(item.key));
  }, [hasAdminPrivilege, navItems]);
  const mobileHomeItem = useMemo(
    () =>
      navItems.find((item) => item.key === (hasAdminPrivilege ? mobileHomeKey : 'profile')) ||
      navItems[0] ||
      null,
    [hasAdminPrivilege, navItems],
  );
  const mobileOverflowItems = useMemo(
    () =>
      navItems.filter(
        (item) =>
          !mobileBeforeKeys.includes(item.key) &&
          !mobileAfterKeys.includes(item.key) &&
          item.key !== (hasAdminPrivilege ? mobileHomeKey : 'profile'),
      ),
    [hasAdminPrivilege, navItems],
  );

  const activeNavItem = navItems.find((item) => isActive(item.href)) || navItems[0] || null;
  const headerTitle = activeNavItem ? copy.nav[activeNavItem.key] : messages.topBar.panelName;
  const displayName = `${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`.trim();
  const userIdentity = displayName || session?.user?.email || messages.topBar.unknownUser;
  const userInitials = initialsFrom(session?.user?.firstName, session?.user?.lastName, 'A');

  const selectedLocale = UI_LOCALE_OPTIONS.find((item) => item.value === locale) || UI_LOCALE_OPTIONS[0];
  const headerOffsetClass = isRtl ? 'md:left-4 md:right-[320px]' : 'md:left-[320px] md:right-4';
  const bodyOffsetClass = isRtl ? 'md:pl-4 md:pr-[320px]' : 'md:pl-[320px] md:pr-4';
  const sidebarPositionStyle = isRtl ? { right: desktopRailLeft } : { left: desktopRailLeft };

  const searchItems = useMemo(
    () =>
      navItems.map((item) => ({
        key: item.key,
        href: item.href,
        title: copy.nav[item.key],
        description: item.description,
      })),
    [copy.nav, navItems],
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredSearchItems = searchItems.filter((item) =>
    !normalizedQuery
      ? true
      : `${item.title} ${item.description}`.toLowerCase().includes(normalizedQuery),
  );

  const panelClass =
    'absolute top-[52px] w-[320px] rounded-[28px] border border-white/60 bg-white/80 p-3 shadow-[0_18px_44px_rgba(60,64,67,.22)] ring-1 ring-white/35 backdrop-blur-xl';

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#F6F8FC] pb-24 pt-24 text-[#202124] md:pb-8" dir={localeDir(locale)}>
      <div className={backgroundRootClass}>
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,.18),rgba(255,255,255,.04)_45%,rgba(15,23,42,.12))]" />
        <div className="absolute left-[12%] top-[18%] h-64 w-64 rounded-full bg-sky-500/18 blur-3xl" />
        <div className="absolute right-[8%] top-[14%] h-72 w-72 rounded-full bg-slate-700/16 blur-3xl" />
        <div className="absolute bottom-[6%] left-[42%] h-80 w-80 rounded-full bg-blue-400/14 blur-3xl" />
      </div>

      <header className={`fixed left-4 right-4 top-4 z-40 px-4 py-2.5 ${shellPanelClass} ${headerOffsetClass}`} ref={topBarRef}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 px-1">
            <p className="text-xs font-medium text-[#5F6368]">ADA Admin</p>
            <h1 className={`truncate text-lg text-[#202124] md:text-xl ${isRtl ? 'text-right' : 'text-left'}`}>{headerTitle}</h1>
          </div>

          <div className="relative hidden min-w-[280px] max-w-[440px] flex-1 lg:block">
            <div
              className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition ${
                openPanel === 'search'
                  ? 'border-[#D2E3FC] bg-white shadow-sm'
                  : 'border-transparent bg-[#F1F3F4] text-[#5F6368]'
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
              <div className={`left-0 right-0 ${panelClass}`}>
                <div className="px-2 pb-3 pt-1">
                  <p className="text-sm font-medium text-[#202124]">Search</p>
                  <p className="mt-1 text-xs text-[#5F6368]">
                    {normalizedQuery ? `Results for "${searchQuery}"` : 'Quick access to admin sections.'}
                  </p>
                </div>
                <div className="space-y-1">
                  {filteredSearchItems.length > 0 ? (
                    filteredSearchItems.slice(0, normalizedQuery ? 6 : 4).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          navigate(item.href);
                          setSearchQuery('');
                        }}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 hover:bg-[#F8F9FA] ${isRtl ? 'text-right' : 'text-left'}`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[#202124]">{item.title}</span>
                          <span className="block truncate text-xs text-[#5F6368]">{item.description}</span>
                        </span>
                        <FiChevronRight className={`h-4 w-4 text-[#9AA0A6] ${isRtl ? 'rotate-180' : ''}`} />
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-[#F8F9FA] px-3 py-4 text-center">
                      <p className="text-sm font-medium text-[#202124]">No results found</p>
                      <p className="mt-1 text-xs text-[#5F6368]">Try dashboard, tenants, access, or profile.</p>
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
                onClick={() => setOpenPanel((current) => (current === 'language' ? null : 'language'))}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                  openPanel === 'language'
                    ? 'border-[#D2E3FC] bg-[#E8F0FE] text-[#1A73E8]'
                    : 'border-[#DADCE0] bg-white text-[#5F6368] hover:bg-[#F8F9FA]'
                }`}
              >
                <FiGlobe className="h-4 w-4" />
                {selectedLocale.label}
                <FiChevronDown className="h-4 w-4" />
              </button>

              {openPanel === 'language' ? (
                <div className={`${isRtl ? 'left-0' : 'right-0'} ${panelClass}`}>
                  <div className="px-2 pb-3 pt-1">
                    <p className="text-sm font-medium text-[#202124]">Language</p>
                    <p className="mt-1 text-xs text-[#5F6368]">Choose the admin panel display language.</p>
                  </div>
                  {UI_LOCALE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setLocale(option.value);
                        setOpenPanel(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 ${option.value === locale ? 'bg-[#E8F0FE]' : 'hover:bg-[#F8F9FA]'}`}
                    >
                      <span className="text-sm font-medium text-[#202124]">{option.label}</span>
                      {option.value === locale ? <FiCheckCircle className="h-5 w-5 text-[#1A73E8]" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button type="button" aria-label={profileCopy.layout.helpAria} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5F6368] hover:bg-[#F1F3F4]">
              <FiHelpCircle className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                type="button"
                aria-label={profileCopy.layout.notificationsAria}
                onClick={() => setOpenPanel((current) => (current === 'notifications' ? null : 'notifications'))}
                className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
                  openPanel === 'notifications' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368] hover:bg-[#F1F3F4]'
                }`}
              >
                <FiBell className="h-5 w-5" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#B3261E] ring-2 ring-white" />
              </button>

              {openPanel === 'notifications' ? (
                <div className={`${isRtl ? 'left-0' : 'right-0'} ${panelClass}`}>
                  <div className="px-2 pb-3 pt-1">
                    <p className="text-sm font-medium text-[#202124]">Admin alerts</p>
                    <p className="mt-1 text-xs text-[#5F6368]">Tenant and access events.</p>
                  </div>
                  <div className="space-y-1">
                    <div className="rounded-2xl px-3 py-3 text-left hover:bg-[#F8F9FA]">
                      <p className="text-sm font-medium text-[#202124]">Tenant whitelist updated</p>
                      <p className="mt-1 text-xs text-[#5F6368]">New host was added to whitelist.</p>
                    </div>
                    <div className="rounded-2xl px-3 py-3 text-left hover:bg-[#F8F9FA]">
                      <p className="text-sm font-medium text-[#202124]">Role assignment changed</p>
                      <p className="mt-1 text-xs text-[#5F6368]">Access rule was updated recently.</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenPanel((current) => (current === 'profile' ? null : 'profile'))}
                className={`inline-flex h-10 items-center gap-2 rounded-full pl-1.5 pr-2 transition ${openPanel === 'profile' ? 'bg-[#E8F0FE]' : 'hover:bg-[#F1F3F4]'}`}
                aria-label={profileCopy.layout.accountMenuAria}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F0FE] text-sm font-semibold text-[#1A73E8]">
                  {userInitials}
                </span>
                <FiChevronDown className="hidden h-4 w-4 text-[#5F6368] sm:block" />
              </button>

              {openPanel === 'profile' ? (
                <div className={`${isRtl ? 'left-0' : 'right-0'} ${panelClass}`}>
                  <div className="rounded-[22px] bg-[#F8F9FA] p-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0FE] text-lg font-semibold text-[#1A73E8]">
                      {userInitials}
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#202124]">{userIdentity}</p>
                    <p className="mt-1 break-all text-xs text-[#5F6368]">{session?.user?.email || messages.topBar.unknownUser}</p>
                  </div>

                  <div className="mt-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => navigate('/profile')}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm text-[#202124] hover:bg-[#F8F9FA] ${isRtl ? 'text-right' : 'text-left'}`}
                    >
                      <span className="flex items-center gap-3">
                        <FiUser className="h-5 w-5 text-[#5F6368]" />
                        {copy.nav.profile}
                      </span>
                      <FiChevronRight className={`h-4 w-4 text-[#9AA0A6] ${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenPanel(null);
                        void logout();
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[#B3261E] hover:bg-[#FDECEA] ${isRtl ? 'text-right' : 'text-left'}`}
                    >
                      <FiLogOut className="h-5 w-5" />
                      {copy.logout}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className={`relative z-10 flex min-h-[calc(100vh-5rem)] w-full items-stretch px-4 ${bodyOffsetClass}`}>
        <aside className="hidden md:block md:w-0 md:shrink-0">
          <nav
            className={`fixed bottom-4 top-4 z-30 flex w-[288px] flex-col p-3 md:hide-scrollbar ${shellPanelClass}`}
            style={sidebarPositionStyle}
          >
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#202124] text-sm font-semibold text-white shadow-sm">ADA</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#202124]">ADA Admin</p>
                <p className="text-xs text-[#5F6368]">{messages.topBar.panelName}</p>
              </div>
            </div>

            <div className="mt-3 rounded-[22px] border border-white/60 bg-white/45 p-3 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F0FE] text-sm font-semibold text-[#1A73E8]">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#202124]">{userIdentity}</p>
                  <p className="truncate text-xs text-[#5F6368]">{session?.user?.email || messages.topBar.noTeamScope}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9AA0A6]">
              Control
            </div>

            <ul className="mt-2 flex-1 space-y-1 overflow-y-auto pr-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      aria-current={active ? 'page' : undefined}
                      onClick={() => navigate(item.href)}
                      className={`group relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-3 py-2.5 text-sm transition-all duration-300 ease-out ${
                        active
                          ? 'bg-[#EEF4FF] text-[#1A73E8] shadow-[inset_0_0_0_1px_rgba(26,115,232,.08)]'
                          : 'text-[#5F6368] hover:bg-[#F8F9FA] hover:text-[#202124]'
                      } ${isRtl ? 'text-right' : 'text-left'}`}
                    >
                      <span className={`absolute ${isRtl ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'} top-1/2 h-7 w-1 -translate-y-1/2 bg-[#1A73E8] transition-all duration-300 ease-out ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`} />
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ease-out ${
                          active
                            ? 'bg-white text-[#1A73E8] shadow-sm'
                            : 'bg-transparent text-[#5F6368] group-hover:bg-white group-hover:text-[#202124]'
                        }`}>
                          <Icon className={`h-5 w-5 transition-transform duration-300 ease-out ${active ? 'scale-105' : 'group-hover:scale-105'}`} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{copy.nav[item.key]}</span>
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
                  <span className="inline-flex rounded-full border border-[#CEEAD6] bg-[#E6F4EA] px-2.5 py-1 text-xs font-medium text-[#137333]">
                    Secure
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5F6368]">{profileCopy.lastSeen}: {profileCopy.notSet}</p>
              </div>
            </div>
          </nav>
        </aside>

        <section className="min-w-0 flex w-full flex-1 flex-col gap-6 pt-2 md:pt-4">
          <div className="flex w-full flex-1 flex-col gap-6">{children}</div>
        </section>
      </div>

      {mobileMenuOpen && mobileOverflowItems.length > 0 ? (
        <div
          className="fixed bottom-[76px] left-3 right-3 z-50 rounded-[24px] border border-white/60 bg-white/80 p-2 shadow-[0_18px_44px_rgba(60,64,67,.22)] ring-1 ring-white/35 backdrop-blur-xl md:hidden"
          ref={mobileMenuRef}
        >
          {mobileOverflowItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.href)}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm text-[#202124] hover:bg-[#F8F9FA] ${isRtl ? 'text-right' : 'text-left'}`}
            >
              <span>{copy.nav[item.key]}</span>
              <FiChevronRight className={`h-4 w-4 text-[#9AA0A6] ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          ))}
        </div>
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/60 bg-white/75 px-2 py-2 shadow-[0_-10px_30px_rgba(60,64,67,.10)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-[640px] grid-cols-4 gap-1">
          {mobileBeforeItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.href)}
                className={`rounded-xl px-1 py-2 text-[11px] ${active ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}
              >
                <Icon className="mx-auto mb-1 h-4 w-4" />
                <span>{copy.nav[item.key]}</span>
              </button>
            );
          })}

          {mobileHomeItem ? (
            <button type="button" onClick={() => navigate(mobileHomeItem.href)} className="rounded-xl px-1 py-2" aria-label={copy.nav[mobileHomeItem.key]}>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1A73E8] text-white shadow-[0_6px_14px_rgba(26,115,232,.35)]">
                {hasAdminPrivilege ? <FiHome className="h-5 w-5" /> : <FiUser className="h-5 w-5" />}
              </span>
            </button>
          ) : (
            <span />
          )}

          {mobileAfterItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.href)}
                className={`rounded-xl px-1 py-2 text-[11px] ${active ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}
              >
                <Icon className="mx-auto mb-1 h-4 w-4" />
                <span>{copy.nav[item.key]}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              if (mobileOverflowItems.length === 0) return;
              setMobileMenuOpen((prev) => !prev);
            }}
            className={`rounded-xl px-1 py-2 text-[11px] ${
              mobileMenuOpen ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'
            } ${mobileOverflowItems.length === 0 ? 'opacity-40' : ''}`}
          >
            <FiMoreHorizontal className="mx-auto mb-1 h-4 w-4" />
            <span>{copy.more}</span>
          </button>
        </div>
      </nav>
    </main>
  );
};

export default AdminShell;
