import { FormEvent } from 'react';
import { FiCheckCircle, FiKey, FiPhone, FiShield } from 'react-icons/fi';
import { TwoFactorSetupState, formatDateTime } from '../config';
import { Badge, PageCard, SettingRow } from './DesignPrimitives';
import { ProfileCopy, ProfileState } from './types';

type TwoFactorSectionProps = {
  copy: ProfileCopy;
  profile: ProfileState;
  cardClass: string;
  secondaryBtnClass: string;
  primaryBtnClass: string;
  inputClass: string;
  twoFaSaving: boolean;
  twoFaSetup: TwoFactorSetupState | null;
  twoFaCode: string;
  setTwoFaCode: (value: string) => void;
  twoFaQrDataUrl: string;
  twoFaQrLoading: boolean;
  twoFaQrError: string;
  onGenerateSetup: () => void;
  onEnable: (event: FormEvent) => void;
  onDisable: () => void;
};

export const TwoFactorSection = ({
  copy,
  profile,
  secondaryBtnClass,
  primaryBtnClass,
  inputClass,
  twoFaSaving,
  twoFaSetup,
  twoFaCode,
  setTwoFaCode,
  twoFaQrDataUrl,
  twoFaQrLoading,
  twoFaQrError,
  onGenerateSetup,
  onEnable,
  onDisable,
}: TwoFactorSectionProps) => {
  return (
    <section id="section-two-factor" className="grid w-full grid-cols-1 gap-6">
      <PageCard title={copy.twoFactor.title} description={copy.twoFactorSection.description}>
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            <SettingRow
              icon={FiKey}
              title={copy.twoFactor.methodAuthenticator}
              description={copy.twoFactorSection.authenticatorDescription}
              badge={profile.security.twoFactorEnabled ? copy.twoFactor.enabled : copy.twoFactor.disabled}
              badgeTone={profile.security.twoFactorEnabled ? 'green' : 'amber'}
            />
            <SettingRow
              icon={FiPhone}
              title={copy.phoneNumber}
              description={copy.twoFactorSection.phoneRecoveryDescription}
              badge={profile.user.phoneNumber ? copy.status.available : copy.status.notSet}
              badgeTone={profile.user.phoneNumber ? 'blue' : 'gray'}
            />
            <SettingRow
              icon={FiCheckCircle}
              title={copy.twoFactorSection.recoveryCodesTitle}
              description={copy.twoFactorSection.recoveryCodesDescription}
              badge={profile.security.twoFactorEnabled ? copy.status.available : copy.status.locked}
              badgeTone={profile.security.twoFactorEnabled ? 'green' : 'gray'}
            />
          </div>

          <div className="rounded-2xl border border-[#D2E3FC] bg-[#E8F0FE] p-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#1A73E8]">
              <FiShield className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-medium text-[#202124]">{copy.twoFactorSection.protectTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-[#5F6368]">
              {copy.twoFactorSection.protectDescription}
            </p>
            {!profile.security.twoFactorEnabled ? (
              <button
                type="button"
                className="mt-4 rounded-full bg-[#1A73E8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1765CC]"
                onClick={onGenerateSetup}
                disabled={twoFaSaving}
              >
                {twoFaSaving ? copy.twoFactor.preparing : copy.twoFactor.generateSetupSecret}
              </button>
            ) : (
              <button
                type="button"
                className="mt-4 rounded-full border border-[#DADCE0] bg-white px-5 py-2.5 text-sm font-medium text-[#B3261E] hover:bg-[#FDECEA]"
                onClick={onDisable}
                disabled={twoFaSaving}
              >
                {twoFaSaving ? copy.twoFactor.disabling : copy.twoFactor.disableAction}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#DADCE0] bg-white p-4">
          <p className="text-sm text-[#5F6368]">
            {copy.twoFactor.status}:{' '}
            <span className="font-medium text-[#202124]">
              {profile.security.twoFactorEnabled ? copy.twoFactor.enabled : copy.twoFactor.disabled}
            </span>{' '}
            · {copy.twoFactor.updated}:{' '}
            <span className="font-medium text-[#202124]">{formatDateTime(profile.security.updatedAt, copy.notSet)}</span>
          </p>
        </div>

        {twoFaSetup ? (
          <div className="mt-4 space-y-4 rounded-2xl border border-[#DADCE0] bg-white p-4">
            <div className="grid gap-4 md:grid-cols-[240px,1fr] md:items-start">
              <div className="rounded-2xl border border-[#E8EAED] bg-white p-3">
                <div className="grid place-items-center rounded-xl bg-[#F8F9FA] p-2">
                  {twoFaQrDataUrl ? (
                    <img src={twoFaQrDataUrl} alt={copy.twoFactor.qrAlt} className="h-[220px] w-[220px]" />
                  ) : (
                    <div className="grid h-[220px] w-[220px] place-items-center text-center text-xs text-[#5F6368]">
                      {twoFaQrLoading ? copy.twoFactor.qrGenerating : twoFaQrError || copy.twoFactor.qrNotReady}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-[#202124]">{copy.twoFactor.scanHelp}</p>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#5F6368]">{copy.twoFactor.manualSetupKey}</p>
                  <p className="mt-1 break-all font-mono text-sm text-[#202124]">{twoFaSetup.secret}</p>
                </div>
              </div>
            </div>
            <form className="space-y-3 border-t border-[#ECEFF3] pt-4" onSubmit={onEnable}>
              <div>
                <label className="mb-1 block text-sm font-normal text-[#202124]">{copy.twoFactor.verificationCode}</label>
                <input
                  className={`${inputClass} text-center font-mono tracking-[0.2em]`}
                  dir="ltr"
                  value={twoFaCode}
                  onChange={(event) => setTwoFaCode(event.target.value.replace(/\D+/g, '').slice(0, 6))}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  required
                />
              </div>
              <button type="submit" className={primaryBtnClass} disabled={twoFaSaving}>
                {twoFaSaving ? copy.twoFactor.enabling : copy.twoFactor.enableAction}
              </button>
            </form>
          </div>
        ) : null}
      </PageCard>
    </section>
  );
};
