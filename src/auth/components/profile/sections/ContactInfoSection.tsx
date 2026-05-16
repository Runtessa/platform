import { Dispatch, SetStateAction, useState } from 'react';
import { FiAlertTriangle, FiEdit2, FiMail, FiPhone, FiShield } from 'react-icons/fi';
import { Badge, PageCard } from './DesignPrimitives';
import { ProfileCopy, ProfileState } from './types';

type ContactInfoSectionProps = {
  copy: ProfileCopy;
  profile: ProfileState;
  cardClass: string;
  isRtl: boolean;
  contactEmail: string;
  setContactEmail: Dispatch<SetStateAction<string>>;
  contactSaving: boolean;
  onSaveContactEmail: (emailValue: string) => Promise<boolean>;
};

export const ContactInfoSection = ({
  copy,
  profile,
  contactEmail,
  setContactEmail,
  contactSaving,
  onSaveContactEmail,
}: ContactInfoSectionProps) => {
  const [editing, setEditing] = useState(false);
  const [draftEmail, setDraftEmail] = useState(contactEmail || '');

  const resetForm = () => {
    setDraftEmail(contactEmail || '');
    setEditing(false);
  };

  return (
    <section id="section-contact-info" className="grid w-full grid-cols-1 gap-6">
      <PageCard
        title={copy.contactInfo}
        description={copy.contactSection.description}
        action={
          editing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                disabled={contactSaving}
                className="rounded-full border border-white/70 bg-white/65 px-4 py-2 text-sm font-medium text-[#5F6368] shadow-sm backdrop-blur-md hover:bg-white"
              >
                {copy.actions.cancel}
              </button>
              <button
                type="button"
                disabled={contactSaving}
                onClick={async () => {
                  const ok = await onSaveContactEmail(draftEmail);
                  if (ok) {
                    setContactEmail(draftEmail.trim());
                    setEditing(false);
                  }
                }}
                className="rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1765CC]"
              >
                {contactSaving ? copy.updating : copy.actions.saveChanges}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraftEmail(contactEmail || profile.user.email || '');
                setEditing(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1765CC]"
            >
              <FiEdit2 className="h-4 w-4" />
              {copy.actions.editContact}
            </button>
          )
        }
      >
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="rounded-[24px] border border-white/70 bg-gradient-to-br from-white/75 via-white/55 to-[#E6F4EA]/70 p-5 shadow-sm backdrop-blur-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/75 text-[#137333] shadow-sm">
              <FiMail className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-lg font-medium text-[#202124]">{copy.contactSection.methodsTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-[#5F6368]">
              {copy.contactSection.methodsDescription}
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/70 bg-white/55 p-3 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[#5F6368]">{copy.primaryEmail}</span>
                  <Badge tone="green">{copy.status.verified}</Badge>
                </div>
                <p className="mt-2 break-all text-sm font-medium text-[#202124]">{profile.user.email || copy.notSet}</p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/55 p-3 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[#5F6368]">{copy.phoneNumber}</span>
                  <Badge tone="green">{copy.status.protected}</Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-[#202124]">{profile.user.phoneNumber || copy.notSet}</p>
              </div>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-md">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-medium text-[#202124]">{copy.contactSection.editMethodsTitle}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#5F6368]">{copy.contactSection.editMethodsDescription}</p>
                  </div>
                  <Badge tone="blue">{copy.status.draft}</Badge>
                </div>

                <div className="grid gap-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">{copy.primaryEmail}</span>
                    <div className="relative">
                      <FiMail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F6368]" />
                      <input
                        type="email"
                        value={draftEmail}
                        onChange={(event) => setDraftEmail(event.target.value)}
                        className="h-12 w-full rounded-2xl border border-white/70 bg-white/75 pl-11 pr-4 text-sm font-medium text-[#202124] outline-none shadow-sm backdrop-blur-md transition focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#D2E3FC]/70"
                      />
                    </div>
                    <span className="mt-2 block text-xs text-[#5F6368]">{copy.contactSection.primaryEmailHelp}</span>
                  </label>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/70 bg-white/45 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-[#202124]">{copy.contactSection.managedIdentityTitle}</h3>
                    <p className="mt-1 text-xs text-[#5F6368]">{copy.contactSection.managedIdentityDescription}</p>
                  </div>
                  <Badge tone="green">{copy.status.protected}</Badge>
                </div>

                <div className="rounded-2xl border border-white/70 bg-white/50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">{copy.phoneNumber}</p>
                    <Badge>{copy.status.locked}</Badge>
                  </div>
                  <p className="break-words text-sm font-medium text-[#202124]">{profile.user.phoneNumber || copy.notSet}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[#D2E3FC]/80 bg-[#E8F0FE]/75 p-4 backdrop-blur-md">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#1A73E8]">
                    <FiShield className="h-4 w-4" />
                  </span>
                  <div>
                      <p className="text-sm font-medium text-[#202124]">{copy.contactSection.verificationMayBeRequiredTitle}</p>
                      <p className="mt-1 text-xs leading-5 text-[#5F6368]">{copy.contactSection.verificationMayBeRequiredDescription}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={resetForm} className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-[#5F6368] hover:bg-white">
                      {copy.actions.cancel}
                    </button>
                    <button
                      type="button"
                      disabled={contactSaving}
                      onClick={async () => {
                        const ok = await onSaveContactEmail(draftEmail);
                        if (ok) {
                          setContactEmail(draftEmail.trim());
                          setEditing(false);
                        }
                      }}
                      className="rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1765CC] disabled:opacity-60"
                    >
                      {contactSaving ? copy.updating : copy.actions.save}
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
                    <Badge tone="green">{copy.status.verified}</Badge>
                  </div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">{copy.primaryEmail}</p>
                  <p className="mt-2 break-all text-sm font-medium text-[#202124]">{profile.user.email || copy.notSet}</p>
                  <p className="mt-2 text-xs leading-5 text-[#5F6368]">{copy.contactSection.primaryEmailHelp}</p>
                </div>

                <div className="rounded-[20px] border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-md transition hover:bg-white/70">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E6F4EA] text-[#137333]">
                      <FiPhone className="h-5 w-5" />
                    </span>
                    <Badge tone="green">{copy.status.protected}</Badge>
                  </div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">{copy.phoneNumber}</p>
                  <p className="mt-2 text-sm font-medium text-[#202124]">{profile.user.phoneNumber || copy.notSet}</p>
                  <p className="mt-2 text-xs leading-5 text-[#5F6368]">{copy.contactSection.phoneHelp}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-white/70 bg-white/45 p-4 backdrop-blur-md">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/75 text-[#5F6368]">
                      <FiShield className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#202124]">{copy.contactSection.securityAlertsTitle}</p>
                      <p className="mt-1 text-xs leading-5 text-[#5F6368]">{copy.contactSection.securityAlertsDescription}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-[#FDE293]/80 bg-[#FEF7E0]/70 p-4 backdrop-blur-md">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#B06000]">
                      <FiAlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#202124]">{copy.contactSection.recoveryEmailMissingTitle}</p>
                      <p className="mt-1 text-xs leading-5 text-[#5F6368]">{copy.contactSection.recoveryEmailMissingDescription}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageCard>
    </section>
  );
};
