import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useRef, useState } from 'react';
import {
  FiBell,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiGlobe,
  FiHelpCircle,
  FiHome,
  FiKey,
  FiLogOut,
  FiMoreHorizontal,
  FiSearch,
  FiSettings,
  FiShield,
} from 'react-icons/fi';
import { ProfileSectionContent } from '../components/profile/ProfileSectionContent';
import { ToastStack } from '../components/profile/ToastStack';
import { useBirthdayPicker } from '../components/profile/hooks/useBirthdayPicker';
import { useOutsideDismiss } from '../components/profile/hooks/useOutsideDismiss';
import { useProfileData } from '../components/profile/hooks/useProfileData';
import { useProfileNavigation } from '../components/profile/hooks/useProfileNavigation';
import { useProfileToasts } from '../components/profile/hooks/useProfileToasts';
import { UI_LOCALE_OPTIONS, localeDir, useUiLocale } from '../lib/ui/locale';
import { getAuthMessages } from '../lib/ui/i18n';
import {
  RailKey,
  cardClass,
  desktopRailLeft,
  initialsFrom,
  inputClass,
  primaryBtnClass,
  railItems,
  secondaryBtnClass,
} from '../components/profile/config';

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

export default function ProfilePage() {
  const router = useRouter();
  const { locale, isRtl, setLocale } = useUiLocale();
  const copy = getAuthMessages(locale).profile;
  const { toasts, pushToast } = useProfileToasts();
  const [openPanel, setOpenPanel] = useState<'search' | 'language' | 'notifications' | 'profile' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const topBarPanelRef = useRef<HTMLDivElement | null>(null);

  const {
    session,
    profile,
    loading,
    csrfToken,
    detailsSaving,
    contactSaving,
    passwordSaving,
    twoFaSaving,
    contactEmail,
    setContactEmail,
    detailsForm,
    setDetailsForm,
    passwordForm,
    setPasswordForm,
    twoFaCode,
    setTwoFaCode,
    twoFaSetup,
    twoFaQrDataUrl,
    twoFaQrLoading,
    twoFaQrError,
    handleAvatarFileChange,
    logout,
    handleSaveDetails,
    handleSaveContactEmail,
    handleChangePassword,
    handleRevokeSession,
    handleGenerateTwoFactorSetup,
    handleEnableTwoFactor,
    handleDisableTwoFactor,
  } = useProfileData({ copy, pushToast });

  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    activeRail,
    mobileMenuOpen,
    setMobileMenuOpen,
    mobileMenuRef,
    railLabels,
    handleSectionNav,
    closeMobileMenu,
    handleLogout,
  } = useProfileNavigation({
    copy,
    isRtl,
    logout,
  });

  const {
    birthdayPickerOpen,
    setBirthdayPickerOpen,
    birthdayMonth,
    birthdayPickerRef,
    monthLabelFormatter,
    calendarMonthOptions,
    selectedBirthday,
    birthdayCells,
    today,
    birthdayYearOptions,
    birthdayDisplay,
    calendarWeekdays,
    closeBirthdayPicker,
    toggleBirthdayPicker,
    changeBirthdayMonth,
    setBirthdayMonthValue,
    setBirthdayYearValue,
    selectBirthday,
  } = useBirthdayPicker({
    copy,
    birthdayValue: detailsForm.birthday,
    setDetailsForm,
  });

  const profileAvatar = detailsForm.avatarUrl || profile?.user.avatarUrl || '';
  const avatarInitials = useMemo(() => {
    if (!profile) return 'U';
    return initialsFrom(profile.user.firstName, profile.user.lastName);
  }, [profile]);

  const handleAvatarFabClick = () => {
    avatarFileInputRef.current?.click();
  };

  const navigateRail = (key: RailKey) => {
    const target = railItems.find((item) => item.key === key);
    if (!target) return;
    handleSectionNav(key, target.sectionId);
  };

  const activeRailItem = railItems.find((item) => item.key === activeRail) || railItems[0];
  const activeTitle = railLabels[activeRailItem.key];
  const selectedLocale = UI_LOCALE_OPTIONS.find((item) => item.value === locale) || UI_LOCALE_OPTIONS[0];
  const hasAdminPrivilege = Boolean(session?.authenticated && session.user?.isAuthAdmin);
  const openAdminPanel = () => {
    setMobileMenuOpen(false);
    setOpenPanel(null);
    void router.push('/admin');
  };

  const searchItems = useMemo(
    () =>
      railItems.map((item) => ({
        key: item.key,
        title: railLabels[item.key],
        description:
          item.key === 'home'
            ? copy.welcomeSubtitle
            : item.key === 'security'
              ? copy.lastLoginSession
              : item.key === 'two-factor'
                ? copy.twoFactor.title
                : railLabels[item.key],
      })),
    [copy.lastLoginSession, copy.twoFactor.title, copy.welcomeSubtitle, railLabels],
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredSearchItems = searchItems.filter((item) =>
    !normalizedQuery
      ? true
      : `${item.title} ${item.description}`.toLowerCase().includes(normalizedQuery),
  );

  useOutsideDismiss(mobileMenuOpen, mobileMenuRef, closeMobileMenu);
  useOutsideDismiss(birthdayPickerOpen, birthdayPickerRef, closeBirthdayPicker);
  useOutsideDismiss(Boolean(openPanel), topBarPanelRef, () => setOpenPanel(null));

  const headerOffsetClass = isRtl ? 'md:left-4 md:right-[320px]' : 'md:left-[320px] md:right-4';
  const bodyOffsetClass = isRtl ? 'md:pl-4 md:pr-[320px]' : 'md:pl-[320px] md:pr-4';
  const sidebarPositionStyle = isRtl ? { right: desktopRailLeft } : { left: desktopRailLeft };

  return (
    <>
      <Head>
        <title>{copy.title}</title>
      </Head>

      <main className="relative min-h-screen overflow-x-hidden bg-[#F6F8FC] pb-24 pt-24 text-[#202124] md:pb-8" dir={localeDir(locale)}>
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0" style={profileBackgroundStyle} />
          <div className="absolute inset-0" style={profileBackgroundOverlayStyle} />
        </div>

        <ToastStack toasts={toasts} />

        <header
          className={`fixed left-4 right-4 top-4 z-40 rounded-[28px] border border-white/60 bg-white/65 px-4 py-2.5 shadow-[0_12px_32px_rgba(60,64,67,.12)] ring-1 ring-white/35 backdrop-blur-xl ${headerOffsetClass}`}
          ref={topBarPanelRef}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 px-1">
              <p className="text-xs font-medium text-[#5F6368]">{copy.layout.brandTitle}</p>
              <h1 className={`truncate text-lg font-normal text-[#202124] md:text-xl ${isRtl ? 'text-right' : 'text-left'}`}>{activeTitle}</h1>
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
                  placeholder={copy.layout.searchPlaceholder}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#80868B]"
                />
              </div>

              {openPanel === 'search' ? (
                <div className="absolute left-0 right-0 top-[52px] rounded-[28px] border border-white/60 bg-white/80 p-3 shadow-[0_18px_44px_rgba(60,64,67,.22)] ring-1 ring-white/35 backdrop-blur-xl">
                  <div className="space-y-1">
                    {filteredSearchItems.slice(0, normalizedQuery ? 6 : 5).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          navigateRail(item.key);
                          setOpenPanel(null);
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
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setOpenPanel((prev) => (prev === 'language' ? null : 'language'))}
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
                  <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-[52px] w-[320px] rounded-[28px] border border-white/60 bg-white/80 p-3 shadow-[0_18px_44px_rgba(60,64,67,.22)] ring-1 ring-white/35 backdrop-blur-xl`}>
                    <div className="space-y-1">
                      {UI_LOCALE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setLocale(option.value);
                            setOpenPanel(null);
                          }}
                          className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 transition ${
                            locale === option.value ? 'bg-[#E8F0FE]' : 'hover:bg-[#F8F9FA]'
                          } ${isRtl ? 'text-right' : 'text-left'}`}
                        >
                          <span className="text-sm font-medium text-[#202124]">{`${option.flag} ${option.label}`}</span>
                          {locale === option.value ? <FiCheckCircle className="h-5 w-5 text-[#1A73E8]" /> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <button type="button" aria-label={copy.layout.helpAria} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5F6368] hover:bg-[#F1F3F4]">
                <FiHelpCircle className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  aria-label={copy.layout.notificationsAria}
                  onClick={() => setOpenPanel((prev) => (prev === 'notifications' ? null : 'notifications'))}
                  className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
                    openPanel === 'notifications' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368] hover:bg-[#F1F3F4]'
                  }`}
                >
                  <FiBell className="h-5 w-5" />
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#B3261E] ring-2 ring-white" />
                </button>
                {openPanel === 'notifications' ? (
                  <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-[52px] w-[320px] rounded-[28px] border border-white/60 bg-white/80 p-3 shadow-[0_18px_44px_rgba(60,64,67,.22)] ring-1 ring-white/35 backdrop-blur-xl`}>
                    <div className="rounded-2xl bg-[#F8F9FA] px-3 py-2 text-sm text-[#5F6368]">
                      {copy.lastSeen}: {profile ? profile.audit.lastSeenAt || copy.notSet : copy.notSet}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenPanel((prev) => (prev === 'profile' ? null : 'profile'))}
                  className={`inline-flex h-10 items-center gap-2 rounded-full pl-1.5 pr-2 transition ${
                    openPanel === 'profile' ? 'bg-[#E8F0FE]' : 'hover:bg-[#F1F3F4]'
                  }`}
                  aria-label={copy.layout.accountMenuAria}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#E8F0FE] text-sm font-semibold text-[#1A73E8]">
                    {profileAvatar ? (
                      <img src={profileAvatar} alt={copy.profileAvatar} className="h-full w-full object-cover" />
                    ) : (
                      avatarInitials
                    )}
                  </span>
                  <FiChevronDown className="hidden h-4 w-4 text-[#5F6368] sm:block" />
                </button>
                {openPanel === 'profile' ? (
                  <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-[52px] w-[320px] rounded-[28px] border border-white/60 bg-white/80 p-3 shadow-[0_18px_44px_rgba(60,64,67,.22)] ring-1 ring-white/35 backdrop-blur-xl`}>
                    <div className="rounded-[22px] bg-[#F8F9FA] p-4 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#E8F0FE] text-lg font-semibold text-[#1A73E8]">
                        {profileAvatar ? (
                          <img src={profileAvatar} alt={copy.profileAvatar} className="h-full w-full object-cover" />
                        ) : (
                          avatarInitials
                        )}
                      </div>
                      <p className="mt-3 text-sm font-medium text-[#202124]">{`${detailsForm.firstName || profile?.user.firstName || ''} ${detailsForm.lastName || profile?.user.lastName || ''}`.trim() || copy.notSet}</p>
                      <p className="mt-1 break-all text-xs text-[#5F6368]">{profile?.user.email || copy.notSet}</p>
                    </div>
                    <div className="mt-2 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigateRail('personal-info');
                          setOpenPanel(null);
                        }}
                        className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm text-[#202124] hover:bg-[#F8F9FA] ${isRtl ? 'text-right' : 'text-left'}`}
                      >
                        <span>{copy.personalInfo}</span>
                        <FiChevronRight className={`h-4 w-4 text-[#9AA0A6] ${isRtl ? 'rotate-180' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigateRail('security');
                          setOpenPanel(null);
                        }}
                        className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm text-[#202124] hover:bg-[#F8F9FA] ${isRtl ? 'text-right' : 'text-left'}`}
                      >
                        <span>{copy.security}</span>
                        <FiChevronRight className={`h-4 w-4 text-[#9AA0A6] ${isRtl ? 'rotate-180' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[#B3261E] hover:bg-[#FDECEA] ${isRtl ? 'text-right' : 'text-left'}`}
                      >
                        <FiLogOut className="h-5 w-5" />
                        {copy.nav.logout}
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
            <div
              className="fixed bottom-4 top-4 z-30 flex w-[288px] flex-col rounded-[28px] border border-white/60 bg-white/65 p-3 shadow-[0_12px_32px_rgba(60,64,67,.12)] ring-1 ring-white/35 backdrop-blur-xl"
              style={sidebarPositionStyle}
            >
              <div className="flex items-center gap-3 px-3 py-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#202124] text-sm font-semibold text-white shadow-sm">CW</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#202124]">{copy.layout.brandTitle}</p>
                  <p className="text-xs text-[#5F6368]">{copy.layout.brandSubtitle}</p>
                </div>
              </div>

              <div className="mt-3 rounded-[22px] border border-white/60 bg-white/45 p-3 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F0FE] text-sm font-semibold text-[#1A73E8]">
                    {avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#202124]">{`${detailsForm.firstName || profile?.user.firstName || ''} ${detailsForm.lastName || profile?.user.lastName || ''}`.trim() || copy.notSet}</p>
                    <p className="truncate text-xs text-[#5F6368]">{profile?.user.email || copy.notSet}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9AA0A6]">
                {copy.layout.accountGroup}
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
                          onClick={() => navigateRail(item.key)}
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
                            <span className={`truncate font-medium transition-all duration-300 ease-out ${active ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'}`}>
                              {railLabels[item.key]}
                            </span>
                          </span>

                          <span className={`h-2 w-2 shrink-0 rounded-full bg-[#1A73E8] transition-all duration-300 ease-out ${active ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
                        </button>
                      </li>
                    );
                  })}
                  {hasAdminPrivilege ? (
                    <li>
                      <button
                        type="button"
                        onClick={openAdminPanel}
                        className={`group relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-3 py-2.5 text-sm text-[#5F6368] transition-all duration-300 ease-out hover:bg-[#F8F9FA] hover:text-[#202124] ${isRtl ? 'text-right' : 'text-left'}`}
                      >
                        <span className={`absolute ${isRtl ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'} top-1/2 h-7 w-1 -translate-y-1/2 bg-[#1A73E8] opacity-0 transition-all duration-300 ease-out group-hover:opacity-30`} />
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-transparent text-[#5F6368] transition-all duration-300 ease-out group-hover:bg-white group-hover:text-[#202124]">
                            <FiSettings className="h-5 w-5 transition-transform duration-300 ease-out group-hover:scale-105" />
                          </span>
                          <span className="truncate font-medium transition-all duration-300 ease-out group-hover:translate-x-0.5">
                            {copy.openAuthAdmin}
                          </span>
                        </span>
                      </button>
                    </li>
                  ) : null}
                </ul>
              </nav>

              <div className="mt-4 border-t border-[#E8EAED] pt-3">
                <div className="mb-2 rounded-2xl border border-white/60 bg-white/45 px-3 py-2 shadow-sm backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[#202124]">{copy.layout.session}</span>
                    <span className="inline-flex rounded-full border border-[#CEEAD6] bg-[#E6F4EA] px-2.5 py-1 text-xs font-medium text-[#137333]">{copy.layout.secure}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#5F6368]">
                    {copy.lastSeen}: {profile?.audit.lastSeenAt || copy.notSet}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0 flex w-full flex-1 flex-col gap-6 pt-2 md:pt-4">
            <input
              ref={avatarFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
            
            <div className="flex w-full flex-1 flex-col gap-6">
              <ProfileSectionContent
                copy={copy}
                session={session}
                profile={profile}
                loading={loading}
                activeRail={activeRail}
                profileAvatar={profileAvatar}
                avatarInitials={avatarInitials}
                cardClass={cardClass}
                inputClass={inputClass}
                primaryBtnClass={primaryBtnClass}
                secondaryBtnClass={secondaryBtnClass}
                isRtl={isRtl}
                detailsSaving={detailsSaving}
                contactSaving={contactSaving}
                passwordSaving={passwordSaving}
                twoFaSaving={twoFaSaving}
                contactEmail={contactEmail}
                setContactEmail={setContactEmail}
                detailsForm={detailsForm}
                setDetailsForm={setDetailsForm}
                passwordForm={passwordForm}
                setPasswordForm={setPasswordForm}
                twoFaCode={twoFaCode}
                setTwoFaCode={setTwoFaCode}
                twoFaSetup={twoFaSetup}
                twoFaQrDataUrl={twoFaQrDataUrl}
                twoFaQrLoading={twoFaQrLoading}
                twoFaQrError={twoFaQrError}
                birthdayPickerRef={birthdayPickerRef}
                birthdayPickerOpen={birthdayPickerOpen}
                birthdayDisplay={birthdayDisplay}
                birthdayMonth={birthdayMonth}
                calendarMonthOptions={calendarMonthOptions}
                birthdayYearOptions={birthdayYearOptions}
                monthLabelFormatter={monthLabelFormatter}
                calendarWeekdays={calendarWeekdays}
                birthdayCells={birthdayCells}
                selectedBirthday={selectedBirthday}
                today={today}
                onAvatarClick={handleAvatarFabClick}
                onSaveDetails={handleSaveDetails}
                onSaveContactEmail={handleSaveContactEmail}
                onChangePassword={handleChangePassword}
                onRevokeSession={handleRevokeSession}
                onGenerateTwoFactorSetup={handleGenerateTwoFactorSetup}
                onEnableTwoFactor={handleEnableTwoFactor}
                onDisableTwoFactor={handleDisableTwoFactor}
                onToggleBirthdayPicker={toggleBirthdayPicker}
                onSetBirthdayPickerOpen={setBirthdayPickerOpen}
                onSetBirthdayMonthValue={setBirthdayMonthValue}
                onSetBirthdayYearValue={setBirthdayYearValue}
                onChangeBirthdayMonth={changeBirthdayMonth}
                onSelectBirthday={selectBirthday}
              />
            </div>
          </section>
        </div>

        {mobileMenuOpen ? (
          <div
            className="fixed bottom-[76px] left-3 right-3 z-50 rounded-[24px] border border-white/60 bg-white/80 p-2 shadow-[0_18px_44px_rgba(60,64,67,.22)] ring-1 ring-white/35 backdrop-blur-xl md:hidden"
            ref={mobileMenuRef}
          >
            {hasAdminPrivilege ? (
              <button
                type="button"
                onClick={openAdminPanel}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[#5F6368] hover:bg-[#F1F3F4] ${isRtl ? 'text-right' : 'text-left'}`}
              >
                <FiSettings className="h-5 w-5" />
                {copy.openAuthAdmin}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                navigateRail('security');
                setMobileMenuOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[#5F6368] hover:bg-[#F1F3F4] ${isRtl ? 'text-right' : 'text-left'}`}
            >
              <FiShield className="h-5 w-5" />
              {copy.security}
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
                    navigateRail(item.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded-xl px-1 py-2 text-[11px] ${active ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}
                >
                  <Icon className="mx-auto mb-1 h-4 w-4" />
                  <span>{railLabels[item.key]}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                navigateRail('home');
                setMobileMenuOpen(false);
              }}
              className="rounded-xl px-1 py-2"
              aria-label={copy.layout.homeAria}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1A73E8] text-white shadow-[0_6px_14px_rgba(26,115,232,.35)]">
                <FiHome className="h-5 w-5" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                navigateRail('two-factor');
                setMobileMenuOpen(false);
              }}
              className={`rounded-xl px-1 py-2 text-[11px] ${activeRail === 'two-factor' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}
            >
              <FiKey className="mx-auto mb-1 h-4 w-4" />
              <span>{copy.layout.twoFactorShort}</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`rounded-xl px-1 py-2 text-[11px] ${mobileMenuOpen ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'text-[#5F6368]'}`}
            >
              <FiMoreHorizontal className="mx-auto mb-1 h-4 w-4" />
              <span>{copy.more}</span>
            </button>
          </div>
        </nav>
      </main>
    </>
  );
}
