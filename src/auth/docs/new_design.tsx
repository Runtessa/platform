// Reference prototype; duplicate candidates D09, D16 are tracked in docs/release/code-integrity-audit.md.
import { useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiBell,
  FiCamera,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiGlobe,
  FiHelpCircle,
  FiHome,
  FiKey,
  FiLock,
  FiLogOut,
  FiMail,
  FiMonitor,
  FiMoreHorizontal,
  FiPhone,
  FiSearch,
  FiShield,
  FiSmartphone,
  FiUser,
} from 'react-icons/fi';

type RailKey = 'home' | 'personal-info' | 'contact-info' | 'security' | 'two-factor';
type Tone = 'blue' | 'green' | 'amber' | 'gray' | 'red';

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

const mountainBackgroundUrl =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80';

const activity = [
  { title: 'Profile viewed', meta: 'Current session', time: 'Just now', tone: 'blue' as Tone },
  { title: 'Last seen updated', meta: 'Web browser', time: profile.lastSeen, tone: 'green' as Tone },
  { title: 'Login status unavailable', meta: 'No previous login recorded', time: 'Review', tone: 'amber' as Tone },
];

const searchItems: Array<{ title: string; description: string; category: string; key: RailKey; keywords: string[] }> = [
  {
    title: 'Personal info',
    description: 'First name, last name, and national ID',
    category: 'Profile',
    key: 'personal-info',
    keywords: ['name', 'first name', 'last name', 'national id', 'identity'],
  },
  {
    title: 'Contact info',
    description: 'Email address and phone number',
    category: 'Profile',
    key: 'contact-info',
    keywords: ['email', 'phone', 'mobile', 'contact'],
  },
  {
    title: 'Security settings',
    description: 'Password, login status, and active sessions',
    category: 'Security',
    key: 'security',
    keywords: ['password', 'security', 'session', 'login', 'device'],
  },
  {
    title: 'Two-factor authentication',
    description: 'Authenticator app, phone verification, and recovery codes',
    category: 'Security',
    key: 'two-factor',
    keywords: ['2fa', 'mfa', 'authenticator', 'recovery codes', 'verification'],
  },
  {
    title: 'Account overview',
    description: 'Account health, recent activity, and profile summary',
    category: 'Overview',
    key: 'home',
    keywords: ['home', 'overview', 'activity', 'account health'],
  },
];

const sessions = [
  { device: 'Current browser', meta: 'This device', time: 'Active now', icon: FiMonitor, current: true },
  { device: 'Mobile session', meta: 'Phone sign-in identity', time: 'Recently used', icon: FiSmartphone, current: false },
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

function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses(tone)}`}>{children}</span>;
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
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_12px_32px_rgba(60,64,67,.10)] ring-1 ring-white/35 backdrop-blur-xl ${className}`}>
      {(title || description || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title ? <h2 className="text-xl font-normal text-[#202124]">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-6 text-[#5F6368]">{description}</p> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function InfoRow({
  label,
  value,
  note,
  icon: Icon,
  locked,
}: {
  label: string;
  value: string;
  note?: string;
  icon?: typeof FiUser;
  locked?: boolean;
}) {
  return (
    <div className="group flex items-center justify-between gap-4 border-b border-[#E8EAED] py-4 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1F3F4] text-[#5F6368]">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm text-[#5F6368]">{label}</p>
          <p className="mt-1 break-words text-sm font-medium text-[#202124]">{value}</p>
          {note ? <p className="mt-1 text-xs text-[#5F6368]">{note}</p> : null}
        </div>
      </div>
      <div className="shrink-0">
        {locked ? <Badge>Managed</Badge> : <FiChevronRight className="h-5 w-5 text-[#9AA0A6]" />}
      </div>
    </div>
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
  icon: typeof FiShield;
  title: string;
  description: string;
  badge?: string;
  badgeTone?: Tone;
  action?: React.ReactNode;
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

function HomePage({ initials }: { initials: string }) {
  return (
    <div className="grid w-full gap-6 xl:grid-cols-[1fr_380px]">
      <PageCard className="text-center xl:text-left">
        <div className="flex flex-col items-center gap-5 xl:flex-row xl:items-center">
          <div className="relative h-[112px] w-[112px] shrink-0">
            <div className="flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full border border-[#DADCE0] bg-[#F1F3F4] text-3xl font-medium text-[#1A73E8]">
              {profile.avatar ? <img src={profile.avatar} alt="Profile avatar" className="h-full w-full object-cover" /> : initials}
            </div>
            <button
              type="button"
              className="absolute bottom-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#DADCE0] bg-white text-[#1A73E8] shadow-sm"
              aria-label="Change profile photo"
            >
              <FiCamera className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-center gap-2 xl:justify-start">
              <h1 className="text-[28px] font-normal leading-tight text-[#202124]">Welcome, {profile.firstName}</h1>
              <Badge tone="green">Active</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5F6368]">
              Manage your profile, contact information, sign-in security, and two-factor authentication from one place.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[#5F6368] xl:justify-start">
              <span className="rounded-full bg-[#F1F3F4] px-3 py-1">Last login: {profile.lastLogin}</span>
              <span className="rounded-full bg-[#F1F3F4] px-3 py-1">Last seen: {profile.lastSeen}</span>
              <span className="max-w-full break-all rounded-full bg-[#F1F3F4] px-3 py-1">{profile.email}</span>
            </div>
          </div>
        </div>
      </PageCard>

      <PageCard title="Account health" description="A quick security summary.">
        <div className="space-y-3">
          <SettingRow icon={FiShield} title="2FA protection" description="Authenticator setup is ready to configure." badge="Recommended" badgeTone="amber" />
          <SettingRow icon={FiClock} title="Recent activity" description="Last seen timestamp is available." badge="Normal" badgeTone="green" />
          <SettingRow icon={FiLock} title="Managed identity" description="Some fields are controlled by SSO." badge="SSO" badgeTone="blue" />
        </div>
      </PageCard>

      <PageCard title="Recent activity" description="Latest visible account events." className="xl:col-span-2">
        <div className="grid gap-3 md:grid-cols-3">
          {activity.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#E8EAED] p-4">
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

function PersonalInfoPage() {
  const initials = `${profile.firstName[0] || ''}${profile.lastName[0] || ''}`.toUpperCase() || 'U';
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    displayName: `${profile.firstName} ${profile.lastName}`,
  });

  const personalFields = [
    { label: 'First name', value: profile.firstName, status: 'Editable', tone: 'blue' as Tone },
    { label: 'Last name', value: profile.lastName, status: 'Editable', tone: 'blue' as Tone },
    { label: 'Display name', value: `${profile.firstName} ${profile.lastName}`, status: 'Generated', tone: 'gray' as Tone },
    { label: 'National ID', value: profile.nationalId, status: 'Managed', tone: 'green' as Tone },
  ];

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      displayName: `${profile.firstName} ${profile.lastName}`,
    });
    setEditing(false);
  };

  return (
    <PageCard
      title="Personal info"
      description="Manage the identity details shown across ADA services. Sensitive identifiers are controlled by your SSO provider."
      action={
        editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-white/70 bg-white/65 px-4 py-2 text-sm font-medium text-[#5F6368] shadow-sm backdrop-blur-md hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1765CC]"
            >
              Save changes
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1765CC]"
          >
            <FiEdit2 className="h-4 w-4" />
            Edit profile
          </button>
        )
      }
    >
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div className="rounded-[24px] border border-white/70 bg-gradient-to-br from-white/75 via-white/55 to-[#E8F0FE]/70 p-5 text-center shadow-sm backdrop-blur-md">
          <div className="relative mx-auto h-24 w-24">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/70 bg-white/65 text-2xl font-semibold text-[#1A73E8] shadow-sm">
              {initials}
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#1A73E8] shadow-sm hover:bg-white"
              aria-label="Change profile photo"
            >
              <FiCamera className="h-4 w-4" />
            </button>
          </div>

          <h3 className="mt-4 text-lg font-medium text-[#202124]">{editing ? form.displayName || `${form.firstName} ${form.lastName}` : `${profile.firstName} ${profile.lastName}`}</h3>
          <p className="mt-1 break-all text-xs leading-5 text-[#5F6368]">{profile.email}</p>

          <div className="mt-4 flex justify-center gap-2">
            <Badge tone="green">Active</Badge>
            <Badge tone="blue">SSO</Badge>
          </div>

          <div className="mt-5 rounded-2xl border border-white/70 bg-white/50 p-3 text-left backdrop-blur-md">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">Identity source</p>
            <p className="mt-2 text-sm font-medium text-[#202124]">ADA Identity Provider</p>
            <p className="mt-1 text-xs leading-5 text-[#5F6368]">
              {editing
                ? 'Editable changes affect your visible profile. Managed identifiers stay locked.'
                : 'Name fields can be edited here. National ID remains locked for verification.'}
            </p>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-md">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-medium text-[#202124]">Edit profile details</h3>
                  <p className="mt-1 text-xs leading-5 text-[#5F6368]">Only editable identity fields can be changed from this page.</p>
                </div>
                <Badge tone="blue">Draft</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">First name</span>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(event) => updateForm('firstName', event.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/70 bg-white/75 px-4 text-sm font-medium text-[#202124] outline-none shadow-sm backdrop-blur-md transition focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#D2E3FC]/70"
                  />
                  <span className="mt-2 block text-xs text-[#5F6368]">Shown in greetings and profile summaries.</span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">Last name</span>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(event) => updateForm('lastName', event.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/70 bg-white/75 px-4 text-sm font-medium text-[#202124] outline-none shadow-sm backdrop-blur-md transition focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#D2E3FC]/70"
                  />
                  <span className="mt-2 block text-xs text-[#5F6368]">Used together with your first name.</span>
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">Display name</span>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(event) => updateForm('displayName', event.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/70 bg-white/75 px-4 text-sm font-medium text-[#202124] outline-none shadow-sm backdrop-blur-md transition focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#D2E3FC]/70"
                  />
                  <span className="mt-2 block text-xs text-[#5F6368]">This is the name other ADA services may show.</span>
                </label>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/45 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-[#202124]">Managed fields</h3>
                  <p className="mt-1 text-xs text-[#5F6368]">These values are locked by your SSO provider.</p>
                </div>
                <Badge tone="green">Protected</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/70 bg-white/50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">National ID</p>
                    <Badge>Locked</Badge>
                  </div>
                  <p className="break-words text-sm font-medium text-[#202124]">{profile.nationalId}</p>
                </div>

                <div className="rounded-2xl border border-white/70 bg-white/50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">Primary email</p>
                    <Badge>Locked</Badge>
                  </div>
                  <p className="break-words text-sm font-medium text-[#202124]">{profile.email}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[#FDE293]/80 bg-[#FEF7E0]/75 p-4 backdrop-blur-md">
              <div className="flex min-w-0 items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#B06000]">
                  <FiAlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-[#202124]">Review before saving</p>
                  <p className="mt-1 text-xs leading-5 text-[#5F6368]">Profile changes may be visible in connected ADA applications.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={resetForm} className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-[#5F6368] hover:bg-white">
                  Cancel
                </button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1765CC]">
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {personalFields.map((field) => (
                <div key={field.label} className="rounded-[20px] border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-md transition hover:bg-white/70">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">{field.label}</p>
                    <Badge tone={field.tone}>{field.status}</Badge>
                  </div>
                  <p className="break-words text-base font-medium text-[#202124]">{field.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[20px] border border-[#D2E3FC]/80 bg-[#E8F0FE]/70 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#1A73E8]">
                  <FiShield className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#202124]">Verified identity</p>
                  <p className="mt-1 text-xs leading-5 text-[#5F6368]">
                    Your personal identity is connected to SSO. Changes to protected fields may require administrator approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/70 bg-white/45 p-4 backdrop-blur-md">
              <div>
                <p className="text-sm font-medium text-[#202124]">Need to correct locked information?</p>
                <p className="mt-1 text-xs text-[#5F6368]">Request an identity review from your administrator.</p>
              </div>
              <button type="button" className="rounded-full border border-[#DADCE0] bg-white/70 px-4 py-2 text-sm font-medium text-[#1A73E8] hover:bg-white">
                Request review
              </button>
            </div>
          </div>
        )}
      </div>
    </PageCard>
  );
}

function ContactInfoPage() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    phone: profile.phone,
    recoveryEmail: '',
  });

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      phone: profile.phone,
      recoveryEmail: '',
    });
    setEditing(false);
  };

  return (
    <PageCard
      title="Contact info"
      description="Manage the contact methods used for sign-in, recovery, and security notifications."
      action={
        editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-white/70 bg-white/65 px-4 py-2 text-sm font-medium text-[#5F6368] shadow-sm backdrop-blur-md hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1765CC]"
            >
              Save changes
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1765CC]"
          >
            <FiEdit2 className="h-4 w-4" />
            Edit contact
          </button>
        )
      }
    >
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="rounded-[24px] border border-white/70 bg-gradient-to-br from-white/75 via-white/55 to-[#E6F4EA]/70 p-5 shadow-sm backdrop-blur-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/75 text-[#137333] shadow-sm">
            <FiMail className="h-6 w-6" />
          </div>

          <h3 className="mt-4 text-lg font-medium text-[#202124]">Contact methods</h3>
          <p className="mt-2 text-sm leading-6 text-[#5F6368]">
            Your email is used as the primary sign-in identity. Your phone can be used for verification, account recovery, and alerts.
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/70 bg-white/55 p-3 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-[#5F6368]">Primary email</span>
                <Badge tone="green">Verified</Badge>
              </div>
              <p className="mt-2 break-all text-sm font-medium text-[#202124]">{profile.email}</p>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/55 p-3 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-[#5F6368]">Phone number</span>
                <Badge tone="blue">Recovery</Badge>
              </div>
              <p className="mt-2 text-sm font-medium text-[#202124]">{editing ? form.phone : profile.phone}</p>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-md">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-medium text-[#202124]">Edit contact methods</h3>
                  <p className="mt-1 text-xs leading-5 text-[#5F6368]">Update editable recovery methods. Primary email is managed by SSO.</p>
                </div>
                <Badge tone="blue">Draft</Badge>
              </div>

              <div className="grid gap-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">Phone number</span>
                  <div className="relative">
                    <FiPhone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F6368]" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) => updateForm('phone', event.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/70 bg-white/75 pl-11 pr-4 text-sm font-medium text-[#202124] outline-none shadow-sm backdrop-blur-md transition focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#D2E3FC]/70"
                    />
                  </div>
                  <span className="mt-2 block text-xs text-[#5F6368]">Use international format, for example +989120000000.</span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">Recovery email</span>
                  <div className="relative">
                    <FiMail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F6368]" />
                    <input
                      type="email"
                      value={form.recoveryEmail}
                      onChange={(event) => updateForm('recoveryEmail', event.target.value)}
                      placeholder="Add recovery email"
                      className="h-12 w-full rounded-2xl border border-white/70 bg-white/75 pl-11 pr-4 text-sm font-medium text-[#202124] outline-none shadow-sm backdrop-blur-md transition placeholder:text-[#9AA0A6] focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#D2E3FC]/70"
                    />
                  </div>
                  <span className="mt-2 block text-xs text-[#5F6368]">Optional. Used only for recovery and security notifications.</span>
                </label>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/45 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-[#202124]">Managed contact identity</h3>
                  <p className="mt-1 text-xs text-[#5F6368]">This value is locked because it is your primary login identifier.</p>
                </div>
                <Badge tone="green">Protected</Badge>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/50 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">Primary email</p>
                  <Badge>Locked</Badge>
                </div>
                <p className="break-words text-sm font-medium text-[#202124]">{profile.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[#D2E3FC]/80 bg-[#E8F0FE]/75 p-4 backdrop-blur-md">
              <div className="flex min-w-0 items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#1A73E8]">
                  <FiShield className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-[#202124]">Verification may be required</p>
                  <p className="mt-1 text-xs leading-5 text-[#5F6368]">Changing recovery contact methods may trigger an OTP or confirmation step.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={resetForm} className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-[#5F6368] hover:bg-white">
                  Cancel
                </button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1765CC]">
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-md transition hover:bg-white/70">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0FE] text-[#1A73E8]">
                    <FiMail className="h-5 w-5" />
                  </span>
                  <Badge tone="green">Verified</Badge>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">Primary email</p>
                <p className="mt-2 break-all text-sm font-medium text-[#202124]">{profile.email}</p>
                <p className="mt-2 text-xs leading-5 text-[#5F6368]">Used for sign-in and important account notifications.</p>
              </div>

              <div className="rounded-[20px] border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-md transition hover:bg-white/70">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E6F4EA] text-[#137333]">
                    <FiPhone className="h-5 w-5" />
                  </span>
                  <Badge tone="blue">Recovery</Badge>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">Phone number</p>
                <p className="mt-2 text-sm font-medium text-[#202124]">{profile.phone}</p>
                <p className="mt-2 text-xs leading-5 text-[#5F6368]">Can be used for verification and account recovery.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-white/70 bg-white/45 p-4 backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/75 text-[#5F6368]">
                    <FiShield className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#202124]">Security alerts</p>
                    <p className="mt-1 text-xs leading-5 text-[#5F6368]">Login and recovery alerts are sent to your verified contact methods.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#FDE293]/80 bg-[#FEF7E0]/70 p-4 backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#B06000]">
                    <FiAlertTriangle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#202124]">Recovery email missing</p>
                    <p className="mt-1 text-xs leading-5 text-[#5F6368]">Add a backup email to make account recovery safer.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageCard>
  );
}

function SecurityPage() {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-2">
      <PageCard title="Security" description="Review sign-in and account protection settings.">
        <div className="space-y-3">
          <SettingRow icon={FiLock} title="Password" description="Password sign-in is managed by the identity provider." badge="Managed" badgeTone="blue" />
          <SettingRow icon={FiKey} title="Two-factor authentication" description="Add a second verification step to protect this account." badge="Recommended" badgeTone="amber" />
          <SettingRow icon={FiClock} title="Last login" description={profile.lastLogin} badge={profile.lastLogin === 'Not set' ? 'Unknown' : 'Normal'} badgeTone={profile.lastLogin === 'Not set' ? 'amber' : 'green'} />
        </div>
      </PageCard>

      <PageCard title="Active sessions" description="Devices that may be using this account.">
        <div className="space-y-3">
          {sessions.map((session) => {
            const Icon = session.icon;
            return (
              <div key={session.device} className="flex items-center justify-between gap-4 rounded-2xl border border-[#E8EAED] p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1F3F4] text-[#5F6368]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#202124]">{session.device}</p>
                    <p className="mt-1 text-xs text-[#5F6368]">{session.meta} · {session.time}</p>
                  </div>
                </div>
                {session.current ? <Badge tone="green">Current</Badge> : <button type="button" className="text-sm font-medium text-[#B3261E] hover:underline">Revoke</button>}
              </div>
            );
          })}
        </div>
      </PageCard>
    </div>
  );
}

function TwoFactorPage() {
  return (
    <PageCard title="2FA settings" description="Set up an authenticator app for stronger account protection.">
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <SettingRow icon={FiKey} title="Authenticator app" description="Use a time-based one-time password from your authenticator app." badge="Not enabled" badgeTone="amber" />
          <SettingRow icon={FiPhone} title="Phone verification" description="Use your phone number as a recovery method." badge="Available" badgeTone="blue" />
          <SettingRow icon={FiCheckCircle} title="Recovery codes" description="Generate backup codes after enabling authenticator app." badge="Locked" badgeTone="gray" />
        </div>

        <div className="rounded-2xl border border-[#D2E3FC] bg-[#E8F0FE] p-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#1A73E8]">
            <FiShield className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-medium text-[#202124]">Protect your account</h3>
          <p className="mt-2 text-sm leading-6 text-[#5F6368]">2FA helps prevent unauthorized access even if your password is exposed.</p>
          <button type="button" className="mt-4 rounded-full bg-[#1A73E8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1765CC]">
            Set up 2FA
          </button>
        </div>
      </div>
    </PageCard>
  );
}

function TopBar({
  activeItem,
  initials,
  onNavigate,
}: {
  activeItem: { label: string };
  initials: string;
  onNavigate: (key: RailKey) => void;
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

      const haystack = [item.title, item.description, item.category, ...item.keywords].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .slice(0, normalizedQuery ? 6 : 5);

  const openSearchResult = (key: RailKey) => {
    onNavigate(key);
    setOpenPanel(null);
    setSearchQuery('');
  };

  return (
    <header className="fixed left-4 right-4 top-4 z-40 rounded-[28px] border border-white/60 bg-white/65 px-4 py-2.5 shadow-[0_12px_32px_rgba(60,64,67,.12)] ring-1 ring-white/35 backdrop-blur-xl md:left-[320px] md:right-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 px-1">
          <p className="text-xs font-medium text-[#5F6368]">ADA Account</p>
          <h1 className="truncate text-lg font-normal text-[#202124] md:text-xl">{activeItem.label}</h1>
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
              placeholder="Search profile, security, activity..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#80868B]"
            />
          </div>

          {openPanel === 'search' ? (
            <div className="absolute left-0 right-0 top-[52px] rounded-[28px] border border-white/60 bg-white/80 p-3 shadow-[0_18px_44px_rgba(60,64,67,.22)] ring-1 ring-white/35 backdrop-blur-xl">
              <div className="px-2 pb-3 pt-1">
                <p className="text-sm font-medium text-[#202124]">Search</p>
                <p className="mt-1 text-xs text-[#5F6368]">
                  {normalizedQuery ? `Results for “${searchQuery}”` : 'Quick access to profile and security settings.'}
                </p>
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
                    <p className="mt-1 text-xs text-[#5F6368]">Try searching for email, password, session, or 2FA.</p>
                  </div>
                )}
              </div>

              <div className="mt-2 border-t border-[#E8EAED] px-2 pt-3">
                <p className="text-xs text-[#5F6368]">Popular: email, phone, security, sessions, 2FA</p>
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
                openPanel === 'language'
                  ? 'border-[#D2E3FC] bg-[#E8F0FE] text-[#1A73E8]'
                  : 'border-[#DADCE0] bg-white text-[#5F6368] hover:bg-[#F8F9FA]'
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
                  <p className="mt-1 text-xs text-[#5F6368]">Choose the display language for your account center.</p>
                </div>
                <div className="space-y-1">
                  {[
                    { label: 'English', region: 'United States', active: true },
                    { label: 'فارسی', region: 'Iran', active: false },
                    { label: 'Deutsch', region: 'Germany', active: false },
                    { label: 'العربية', region: 'Arabic', active: false },
                  ].map((language) => (
                    <button
                      key={language.label}
                      type="button"
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition ${
                        language.active ? 'bg-[#E8F0FE]' : 'hover:bg-[#F8F9FA]'
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-medium text-[#202124]">{language.label}</span>
                        <span className="block text-xs text-[#5F6368]">{language.region}</span>
                      </span>
                      {language.active ? <FiCheckCircle className="h-5 w-5 text-[#1A73E8]" /> : null}
                    </button>
                  ))}
                </div>
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
                    <p className="text-sm font-medium text-[#202124]">Notifications</p>
                    <p className="mt-1 text-xs text-[#5F6368]">Security and account updates.</p>
                  </div>
                  <Badge tone="red">2 new</Badge>
                </div>

                <div className="space-y-1">
                  {[
                    { title: 'Review failed login', meta: 'Unknown device · Yesterday', tone: 'amber' as Tone },
                    { title: '2FA is recommended', meta: 'Add another protection layer', tone: 'blue' as Tone },
                    { title: 'Profile activity updated', meta: profile.lastSeen, tone: 'green' as Tone },
                  ].map((item) => (
                    <button key={item.title} type="button" className="flex w-full gap-3 rounded-2xl px-3 py-3 text-left hover:bg-[#F8F9FA]">
                      <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border ${toneClasses(item.tone)}`} />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[#202124]">{item.title}</span>
                        <span className="block truncate text-xs text-[#5F6368]">{item.meta}</span>
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-2 border-t border-[#E8EAED] pt-2">
                  <button type="button" className="w-full rounded-2xl px-3 py-2.5 text-sm font-medium text-[#1A73E8] hover:bg-[#F8FAFF]">
                    View all notifications
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => togglePanel('profile')}
              className={`inline-flex h-10 items-center gap-2 rounded-full pl-1.5 pr-2 transition ${
                openPanel === 'profile' ? 'bg-[#E8F0FE]' : 'hover:bg-[#F1F3F4]'
              }`}
              aria-label="Account menu"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F0FE] text-sm font-semibold text-[#1A73E8]">
                {initials}
              </span>
              <FiChevronDown className="hidden h-4 w-4 text-[#5F6368] sm:block" />
            </button>

            {openPanel === 'profile' ? (
              <div className={panelClass}>
                <div className="rounded-[22px] bg-[#F8F9FA] p-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0FE] text-lg font-semibold text-[#1A73E8]">
                    {initials}
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#202124]">{profile.firstName} {profile.lastName}</p>
                  <p className="mt-1 break-all text-xs text-[#5F6368]">{profile.email}</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <Badge tone="green">Active</Badge>
                    <Badge tone="blue">SSO</Badge>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('personal-info');
                      setOpenPanel(null);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm text-[#202124] hover:bg-[#F8F9FA]"
                  >
                    <span className="flex items-center gap-3">
                      <FiUser className="h-5 w-5 text-[#5F6368]" />
                      Profile information
                    </span>
                    <FiChevronRight className="h-4 w-4 text-[#9AA0A6]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('security');
                      setOpenPanel(null);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm text-[#202124] hover:bg-[#F8F9FA]"
                  >
                    <span className="flex items-center gap-3">
                      <FiShield className="h-5 w-5 text-[#5F6368]" />
                      Security settings
                    </span>
                    <FiChevronRight className="h-4 w-4 text-[#9AA0A6]" />
                  </button>

                  <button type="button" className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[#B3261E] hover:bg-[#FDECEA]">
                    <FiLogOut className="h-5 w-5" />
                    Logout
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

export function CurrentLayoutTemplate() {
  const [activeRail, setActiveRail] = useState<RailKey>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initials = useMemo(
    () => `${profile.firstName[0] || ''}${profile.lastName[0] || ''}`.toUpperCase() || 'U',
    [],
  );

  const activeItem = railItems.find((item) => item.key === activeRail) || railItems[0];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#F6F8FC] pb-24 pt-24 text-[#202124] md:pb-8" dir="ltr">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          src={mountainBackgroundUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20" />
        <div className="absolute inset-0 bg-[#F6F8FC]/10" />
      </div>

      <TopBar activeItem={activeItem} initials={initials} onNavigate={setActiveRail} />

      <div className="relative z-10 flex min-h-[calc(100vh-5rem)] w-full items-stretch px-4 md:pl-[320px] md:pr-4">
        <aside className="hidden md:block md:w-0 md:shrink-0">
          <div className="fixed bottom-4 left-4 top-4 z-30 flex w-[288px] flex-col rounded-[28px] border border-white/60 bg-white/65 p-3 shadow-[0_12px_32px_rgba(60,64,67,.12)] ring-1 ring-white/35 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#202124] text-sm font-semibold text-white shadow-sm">
                ADA
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#202124]">ADA Account</p>
                <p className="text-xs text-[#5F6368]">SSO profile center</p>
              </div>
            </div>

            <div className="mt-3 rounded-[22px] border border-white/60 bg-white/45 p-3 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F0FE] text-sm font-semibold text-[#1A73E8]">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#202124]">{profile.firstName} {profile.lastName}</p>
                  <p className="truncate text-xs text-[#5F6368]">{profile.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <Badge tone="green">Active</Badge>
                <span className="text-xs text-[#5F6368]">SSO managed</span>
              </div>
            </div>

            <div className="mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9AA0A6]">
              Account
            </div>

            <nav className="mt-2 flex-1 overflow-y-auto pr-1">
              <ul className="space-y-1">
                {railItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.key === activeRail;
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        aria-current={active ? 'page' : undefined}
                        onClick={() => {
                          setActiveRail(item.key);
                          setMobileMenuOpen(false);
                        }}
                        className={`group relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-3 py-2.5 text-sm transition-all duration-300 ease-out ${
                          active
                            ? 'bg-[#EEF4FF] text-[#1A73E8] shadow-[inset_0_0_0_1px_rgba(26,115,232,.08)]'
                            : 'text-[#5F6368] hover:bg-[#F8F9FA] hover:text-[#202124]'
                        }`}
                      >
                        <span
                          className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#1A73E8] transition-all duration-300 ease-out ${
                            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'
                          }`}
                        />

                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ease-out ${
                              active
                                ? 'bg-white text-[#1A73E8] shadow-sm'
                                : 'bg-transparent text-[#5F6368] group-hover:bg-white group-hover:text-[#202124]'
                            }`}
                          >
                            <Icon className={`h-5 w-5 transition-transform duration-300 ease-out ${active ? 'scale-105' : 'group-hover:scale-105'}`} />
                          </span>
                          <span className={`truncate font-medium transition-all duration-300 ease-out ${active ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'}`}>
                            {item.label}
                          </span>
                        </span>

                        <span
                          className={`h-2 w-2 shrink-0 rounded-full bg-[#1A73E8] transition-all duration-300 ease-out ${
                            active ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-4 border-t border-[#E8EAED] pt-3">
              <div className="mb-2 rounded-2xl border border-white/60 bg-white/45 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[#202124]">Session</span>
                  <Badge tone="green">Secure</Badge>
                </div>
                <p className="mt-1 text-xs text-[#5F6368]">Last seen: {profile.lastSeen}</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex w-full flex-1 flex-col gap-6 pt-2 md:pt-4">
          <div className="flex w-full max-w-[980px] flex-1 flex-col gap-6">

            {activeRail === 'home' ? <HomePage initials={initials} /> : null}
            {activeRail === 'personal-info' ? <PersonalInfoPage /> : null}
            {activeRail === 'contact-info' ? <ContactInfoPage /> : null}
            {activeRail === 'security' ? <SecurityPage /> : null}
            {activeRail === 'two-factor' ? <TwoFactorPage /> : null}
          </div>
        </section>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed bottom-[76px] left-3 right-3 z-50 rounded-[24px] border border-white/60 bg-white/80 p-2 shadow-[0_18px_44px_rgba(60,64,67,.22)] ring-1 ring-white/35 backdrop-blur-xl md:hidden">
          <button
            type="button"
            onClick={() => {
              setActiveRail('security');
              setMobileMenuOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[#5F6368] hover:bg-[#F1F3F4]"
          >
            <FiShield className="h-5 w-5" />
            Security
          </button>
        </div>
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/60 bg-white/75 px-2 py-2 shadow-[0_-10px_30px_rgba(60,64,67,.10)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-[640px] grid-cols-5 gap-1">
          {railItems.slice(1, 3).map((item) => {
            const Icon = item.icon;
            const active = item.key === activeRail;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveRail(item.key);
                  setMobileMenuOpen(false);
                }}
                className={`rounded-xl px-1 py-2 text-[11px] ${active ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}
              >
                <Icon className="mx-auto mb-1 h-4 w-4" />
                <span>{item.label.replace(' Info', '')}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setActiveRail('home');
              setMobileMenuOpen(false);
            }}
            className="rounded-xl px-1 py-2"
            aria-label="Home"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1A73E8] text-white shadow-[0_6px_14px_rgba(26,115,232,.35)]">
              <FiHome className="h-5 w-5" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRail('two-factor');
              setMobileMenuOpen(false);
            }}
            className={`rounded-xl px-1 py-2 text-[11px] ${activeRail === 'two-factor' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}
          >
            <FiKey className="mx-auto mb-1 h-4 w-4" />
            <span>2FA</span>
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

export default CurrentLayoutTemplate;
