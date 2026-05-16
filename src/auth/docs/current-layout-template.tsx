import { useMemo, useState } from 'react';
import {
  FiCamera,
  FiGlobe,
  FiHome,
  FiKey,
  FiLogOut,
  FiMoreHorizontal,
  FiPhone,
  FiShield,
  FiUser,
} from 'react-icons/fi';

type RailKey = 'home' | 'personal-info' | 'contact-info' | 'security' | 'two-factor';

const railItems: Array<{ key: RailKey; label: string; icon: typeof FiHome }> = [
  { key: 'home', label: 'Home', icon: FiHome },
  { key: 'personal-info', label: 'Personal Info', icon: FiUser },
  { key: 'contact-info', label: 'Contact Info', icon: FiPhone },
  { key: 'security', label: 'Security', icon: FiShield },
  { key: 'two-factor', label: '2FA Settings', icon: FiKey },
];

const profile = {
  firstName: 'Alireza',
  lastName: 'Dadras',
  email: 'phone-989197675877@auth.local',
  nationalId: 'PHONE-989197675877',
  phone: '+989197675877',
  lastLogin: 'Not set',
  lastSeen: '5/15/2026, 12:39 PM',
  avatar: '',
};

export function CurrentLayoutTemplate() {
  const [activeRail, setActiveRail] = useState<RailKey>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initials = useMemo(
    () => `${profile.firstName[0] || ''}${profile.lastName[0] || ''}`.toUpperCase() || 'U',
    [],
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F6F8FC] pb-20 pt-6 text-[#202124] md:pb-8" dir="ltr">
      <div className="fixed right-4 top-4 z-[60]">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-[#DADCE0] bg-white px-4 py-2 text-sm text-[#5F6368]"
        >
          <FiGlobe className="h-4 w-4" />
          English
        </button>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[1400px] items-stretch gap-6 px-3 sm:px-4">
        <aside className="hidden w-[280px] shrink-0 md:block">
          <div className="fixed left-3 top-3 z-[60] hidden md:block">
            <img src="/images/lw_dark.png" alt="ADA" className="h-12 w-auto" />
          </div>

          <nav className="fixed left-3 top-1/2 z-20 max-h-[calc(100vh-2rem)] w-[280px] -translate-y-1/2 overflow-y-auto rounded-[24px] p-3">
            <ul className="space-y-1">
              {railItems.map((item) => {
                const Icon = item.icon;
                const active = item.key === activeRail;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRail(item.key);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-all duration-200 ${
                        active ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
              <li className="pt-2">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-[#B3261E] transition-all duration-200 hover:bg-[#FDECEA]"
                >
                  <FiLogOut className="h-6 w-6" />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <section className="min-w-0 flex w-full max-w-full flex-1 flex-col justify-center gap-6">
          <div className="mx-auto flex w-full max-w-[85%] flex-1 flex-col justify-center gap-6">
            {activeRail === 'home' ? (
              <section className="w-full rounded-[24px] bg-white px-6 py-10 text-center shadow-[0_1px_2px_0_rgba(60,64,67,.3),0_1px_3px_1px_rgba(60,64,67,.08)] sm:w-[75%]">
                <div className="relative mx-auto h-[120px] w-[120px]">
                  <div className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full border border-[#DADCE0] bg-[#F1F3F4] text-3xl text-[#1A73E8]">
                    {profile.avatar ? <img src={profile.avatar} alt="Profile avatar" className="h-full w-full object-cover" /> : initials}
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#DADCE0] bg-white text-[#1A73E8]"
                  >
                    <FiCamera className="h-4 w-4" />
                  </button>
                </div>
                <h1 className="mt-5 text-[28px]">{`Welcome, ${profile.firstName}`}</h1>
                <p className="mx-auto mt-2 max-w-3xl text-sm text-[#5F6368]">
                  Manage your info, privacy, and security to make ADA work better for you.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-[#5F6368]">
                  <span className="rounded-full bg-[#F1F3F4] px-3 py-1">{`Last login: ${profile.lastLogin}`}</span>
                  <span className="rounded-full bg-[#F1F3F4] px-3 py-1">{`Last seen: ${profile.lastSeen}`}</span>
                  <span className="max-w-full break-all rounded-full bg-[#F1F3F4] px-3 py-1">{profile.email}</span>
                </div>
              </section>
            ) : null}

            {activeRail === 'personal-info' ? (
              <section className="w-full rounded-[24px] bg-white p-6 shadow-[0_1px_2px_0_rgba(60,64,67,.3),0_1px_3px_1px_rgba(60,64,67,.08)] sm:w-[75%]">
                <h2 className="text-xl">Personal Info</h2>
                <p className="mt-2 text-sm text-[#5F6368]">Static template: replace with your form fields and bindings.</p>
              </section>
            ) : null}

            {activeRail === 'contact-info' ? (
              <section className="w-full rounded-[24px] bg-white p-6 shadow-[0_1px_2px_0_rgba(60,64,67,.3),0_1px_3px_1px_rgba(60,64,67,.08)] sm:w-[75%]">
                <h2 className="text-xl">Contact Info</h2>
                <p className="mt-2 text-sm text-[#5F6368]">{`Email: ${profile.email}`}</p>
                <p className="mt-1 text-sm text-[#5F6368]">{`Phone: ${profile.phone}`}</p>
              </section>
            ) : null}

            {activeRail === 'security' ? (
              <section className="w-full rounded-[24px] bg-white p-6 shadow-[0_1px_2px_0_rgba(60,64,67,.3),0_1px_3px_1px_rgba(60,64,67,.08)] sm:w-[75%]">
                <h2 className="text-xl">Security</h2>
                <p className="mt-2 text-sm text-[#5F6368]">Password and session UI placeholder.</p>
              </section>
            ) : null}

            {activeRail === 'two-factor' ? (
              <section className="w-full rounded-[24px] bg-white p-6 shadow-[0_1px_2px_0_rgba(60,64,67,.3),0_1px_3px_1px_rgba(60,64,67,.08)] sm:w-[75%]">
                <h2 className="text-xl">2FA Settings</h2>
                <p className="mt-2 text-sm text-[#5F6368]">Authenticator setup UI placeholder.</p>
              </section>
            ) : null}
          </div>
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E8EAED] bg-white px-2 py-2 md:hidden">
        <div className="mx-auto grid max-w-[640px] grid-cols-5 gap-1">
          {railItems.slice(1, 3).map((item) => {
            const Icon = item.icon;
            const active = item.key === activeRail;
            return (
              <button key={item.key} type="button" onClick={() => setActiveRail(item.key)} className={`rounded-xl px-1 py-2 text-[11px] ${active ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}>
                <Icon className="mx-auto mb-1 h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => setActiveRail('home')} className="rounded-xl px-1 py-2">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1A73E8] text-white shadow-[0_6px_14px_rgba(26,115,232,.35)]">
              <FiHome className="h-5 w-5" />
            </span>
          </button>
          <button type="button" onClick={() => setActiveRail('two-factor')} className={`rounded-xl px-1 py-2 text-[11px] ${activeRail === 'two-factor' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}>
            <FiKey className="mx-auto mb-1 h-4 w-4" />
            <span>2FA</span>
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

export default CurrentLayoutTemplate;
