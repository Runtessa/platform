import { FormEvent } from 'react';
import { FiClock, FiLock, FiMonitor, FiPhone, FiShield } from 'react-icons/fi';
import { ProfilePasswordFormState, formatDateTime } from '../config';
import { Badge, PageCard, SettingRow } from './DesignPrimitives';
import { ProfileCopy, ProfileState } from './types';

type SecuritySectionProps = {
  copy: ProfileCopy;
  profile: ProfileState;
  cardClass: string;
  inputClass: string;
  primaryBtnClass: string;
  passwordForm: ProfilePasswordFormState;
  setPasswordForm: (updater: (prev: ProfilePasswordFormState) => ProfilePasswordFormState) => void;
  passwordSaving: boolean;
  currentSessionRandId: string | null;
  currentSession: {
    randId: string;
    ipAddress: string | null;
    userAgent: string | null;
    lastSeenAt: string | null;
  } | null;
  onRevokeSession: (sessionRandId: string) => Promise<boolean>;
  onChangePassword: (event: FormEvent) => void;
};

export const SecuritySection = ({
  copy,
  profile,
  inputClass,
  primaryBtnClass,
  passwordForm,
  setPasswordForm,
  passwordSaving,
  currentSessionRandId,
  currentSession,
  onRevokeSession,
  onChangePassword,
}: SecuritySectionProps) => {
  const dbSessions = profile.sessions || [];
  const sessions = (() => {
    if (dbSessions.length > 0) {
      if (
        currentSession &&
        !dbSessions.some((session) => session.randId === currentSession.randId)
      ) {
        return [
          {
            randId: currentSession.randId,
            ipAddress: currentSession.ipAddress,
            userAgent: currentSession.userAgent,
            lastSeenAt: currentSession.lastSeenAt,
            createdAt: null,
            expiresAt: null,
            synthetic: true,
          },
          ...dbSessions.map((session) => ({ ...session, synthetic: false })),
        ];
      }
      return dbSessions.map((session) => ({ ...session, synthetic: false }));
    }

    if (currentSession) {
      return [
        {
          randId: currentSession.randId || '__current__',
          ipAddress: currentSession.ipAddress,
          userAgent: currentSession.userAgent,
          lastSeenAt: currentSession.lastSeenAt || profile.audit.lastSeenAt,
          createdAt: null,
          expiresAt: null,
          synthetic: true,
        },
      ];
    }

    return [];
  })();

  const classifySession = (userAgent: string | null) => {
    const raw = String(userAgent || '').toLowerCase();
    const isMobile = /android|iphone|ipad|mobile/.test(raw);
    return {
      icon: isMobile ? FiPhone : FiMonitor,
      deviceLabel: isMobile ? copy.securitySection.mobileSession : copy.securitySection.currentBrowser,
    };
  };

  return (
    <section id="section-security" className="grid w-full grid-cols-1 gap-6 xl:grid-cols-2">
      <PageCard title={copy.security} description={copy.securitySection.description}>
        <div className="space-y-3">
          <SettingRow
            icon={FiLock}
            title={copy.passwordSettings}
            description={profile.security.hasPassword ? copy.securitySection.passwordConfigured : copy.securitySection.passwordUnset}
            badge={profile.security.hasPassword ? copy.status.configured : copy.status.unset}
            badgeTone={profile.security.hasPassword ? 'green' : 'amber'}
          />
          <SettingRow
            icon={FiShield}
            title={copy.twoFactor.title}
            description={copy.securitySection.twoFactorDescription}
            badge={profile.security.twoFactorEnabled ? copy.twoFactor.enabled : copy.status.recommended}
            badgeTone={profile.security.twoFactorEnabled ? 'green' : 'amber'}
          />
          <SettingRow
            icon={FiClock}
            title={copy.lastLogin}
            description={formatDateTime(profile.audit.lastLoginAt, copy.notSet)}
            badge={profile.audit.lastLoginAt ? copy.status.normal : copy.status.unknown}
            badgeTone={profile.audit.lastLoginAt ? 'green' : 'amber'}
          />
        </div>

        <form className="mt-5 space-y-3 rounded-2xl border border-[#E8EAED] bg-white/70 p-4" onSubmit={onChangePassword}>
          {profile.security.hasPassword ? (
            <div>
              <label className="mb-1 block text-sm font-normal text-[#202124]">{copy.currentPassword}</label>
              <input
                type="password"
                className={`${inputClass} text-left`}
                dir="ltr"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                autoComplete="current-password"
                required
              />
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-normal text-[#202124]">{copy.newPassword}</label>
            <input
              type="password"
              className={`${inputClass} text-left`}
              dir="ltr"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              autoComplete="new-password"
              minLength={10}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-normal text-[#202124]">{copy.confirmNewPassword}</label>
            <input
              type="password"
              className={`${inputClass} text-left`}
              dir="ltr"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              autoComplete="new-password"
              minLength={10}
              required
            />
          </div>
          <button type="submit" className={primaryBtnClass} disabled={passwordSaving}>
            {passwordSaving ? copy.updating : profile.security.hasPassword ? copy.updatePassword : copy.setPassword}
          </button>
        </form>
      </PageCard>

      <PageCard title={copy.securitySection.activeSessionsTitle} description={copy.securitySection.activeSessionsDescription}>
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-[#E8EAED] bg-white/70 p-4 text-sm text-[#5F6368]">
              {copy.securitySection.noActiveSessions}
            </div>
          ) : null}
          {sessions.map((session) => {
            const { icon: Icon, deviceLabel } = classifySession(session.userAgent);
            const isCurrent =
              session.synthetic ||
              Boolean(currentSessionRandId && session.randId === currentSessionRandId);
            const meta = isCurrent
              ? copy.securitySection.thisDevice
              : session.ipAddress || copy.securitySection.sessionUnknownDevice;
            const time = isCurrent
              ? copy.securitySection.activeNow
              : formatDateTime(session.lastSeenAt, copy.notSet);
            return (
              <div key={session.randId} className="flex items-center justify-between gap-4 rounded-2xl border border-[#E8EAED] p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1F3F4] text-[#5F6368]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#202124]">{deviceLabel}</p>
                    <p className="mt-1 truncate text-xs text-[#5F6368]">{session.userAgent || copy.securitySection.sessionUnknownAgent}</p>
                    <p className="mt-1 text-xs text-[#5F6368]">
                      {meta} · {time}
                    </p>
                  </div>
                </div>
                {isCurrent ? (
                  <Badge tone="green">{copy.status.current}</Badge>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      void onRevokeSession(session.randId);
                    }}
                    className="text-sm font-medium text-[#B3261E] hover:underline"
                  >
                    {copy.actions.revoke}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </PageCard>
    </section>
  );
};
