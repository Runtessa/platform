import Link from 'next/link';
import { FiAlertTriangle, FiCamera, FiCheckCircle, FiClock, FiLock, FiShield } from 'react-icons/fi';
import { formatDateTime } from '../config';
import { Badge, PageCard, SettingRow } from './DesignPrimitives';
import { ProfileCopy, ProfileState } from './types';

type HomeSectionProps = {
  copy: ProfileCopy;
  profile: ProfileState;
  profileAvatar: string;
  avatarInitials: string;
  cardClass: string;
  secondaryBtnClass: string;
  isAuthAdmin: boolean;
  onAvatarClick: () => void;
};

export const HomeSection = ({
  copy,
  profile,
  profileAvatar,
  avatarInitials,
  cardClass,
  secondaryBtnClass,
  isAuthAdmin,
  onAvatarClick,
}: HomeSectionProps) => {
  const activity = [
    {
      title: copy.homeSection.activityProfileViewedTitle,
      meta: copy.homeSection.activityProfileViewedMeta,
      time: copy.homeSection.activityJustNow,
      tone: 'blue' as const,
      warn: false,
    },
    {
      title: copy.homeSection.activityLastSeenUpdatedTitle,
      meta: copy.homeSection.activityWebBrowser,
      time: formatDateTime(profile.audit.lastSeenAt, copy.notSet),
      tone: 'green' as const,
      warn: false,
    },
    {
      title: copy.homeSection.activityLoginUnavailableTitle,
      meta: copy.homeSection.activityNoPreviousLogin,
      time: profile.audit.lastLoginAt ? copy.homeSection.activityReview : copy.notSet,
      tone: 'amber' as const,
      warn: true,
    },
  ];

  return (
    <section id="section-hero" className="grid w-full gap-6 xl:grid-cols-[1fr_380px]">
      <PageCard className="text-center xl:text-left">
        <div className="flex flex-col items-center gap-5 xl:flex-row xl:items-center">
          <div className="relative h-[112px] w-[112px] shrink-0">
            <div className="flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full border border-[#DADCE0] bg-[#F1F3F4] text-3xl font-medium text-[#1A73E8]">
              {profileAvatar ? (
                <img src={profileAvatar} alt={copy.profileAvatar} className="h-full w-full object-cover" />
              ) : (
                avatarInitials
              )}
            </div>
            <button
              type="button"
              onClick={onAvatarClick}
              className="absolute bottom-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#DADCE0] bg-white text-[#1A73E8] shadow-sm"
              aria-label={copy.changeAvatarAria}
            >
              <FiCamera className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-center gap-2 xl:justify-start">
              <h1 className="text-[28px] font-normal leading-tight text-[#202124]">
                {copy.welcome}، {profile.user.firstName}
              </h1>
              <Badge tone="green">{copy.status.active}</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5F6368]">
              {copy.welcomeSubtitle}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[#5F6368] xl:justify-start">
              <span className="rounded-full bg-[#F1F3F4] px-3 py-1">
                {copy.lastLogin}: {formatDateTime(profile.audit.lastLoginAt, copy.notSet)}
              </span>
              <span className="rounded-full bg-[#F1F3F4] px-3 py-1">
                {copy.lastSeen}: {formatDateTime(profile.audit.lastSeenAt, copy.notSet)}
              </span>
              <span className="max-w-full break-all rounded-full bg-[#F1F3F4] px-3 py-1">
                {profile.user.email}
              </span>
            </div>
            {isAuthAdmin ? (
              <div className="mt-4 flex justify-center xl:justify-start">
                <Link href="/admin" className={secondaryBtnClass}>
                  {copy.openAuthAdmin}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </PageCard>

      <PageCard title={copy.homeSection.accountHealthTitle} description={copy.homeSection.accountHealthDescription}>
        <div className="space-y-3">
          <SettingRow
            icon={FiShield}
            title={copy.homeSection.twoFactorProtectionTitle}
            description={copy.homeSection.twoFactorProtectionDescription}
            badge={copy.status.recommended}
            badgeTone="amber"
          />
          <SettingRow
            icon={FiClock}
            title={copy.homeSection.recentActivityTitle}
            description={copy.homeSection.recentActivityDescription}
            badge={copy.status.normal}
            badgeTone="green"
          />
          <SettingRow
            icon={FiLock}
            title={copy.homeSection.managedIdentityTitle}
            description={copy.homeSection.managedIdentityDescription}
            badge={copy.status.sso}
            badgeTone="blue"
          />
        </div>
      </PageCard>

      <PageCard title={copy.homeSection.timelineTitle} description={copy.homeSection.timelineDescription} className="xl:col-span-2">
        <div className="grid gap-3 md:grid-cols-3">
          {activity.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#E8EAED] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge tone={item.tone}>{item.time}</Badge>
                {item.warn ? (
                  <FiAlertTriangle className="h-4 w-4 text-[#B06000]" />
                ) : (
                  <FiCheckCircle className="h-4 w-4 text-[#137333]" />
                )}
              </div>
              <p className="text-sm font-medium text-[#202124]">{item.title}</p>
              <p className="mt-1 text-xs text-[#5F6368]">{item.meta}</p>
            </div>
          ))}
        </div>
      </PageCard>
    </section>
  );
};
