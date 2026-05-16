import { FormEvent, RefObject, useState } from 'react';
import { FiAlertTriangle, FiCamera, FiEdit2, FiShield } from 'react-icons/fi';
import { ProfileDetailsFormState } from '../config';
import { BirthdayPickerField } from './BirthdayPickerField';
import { Badge, PageCard } from './DesignPrimitives';
import { ProfileCopy, ProfileState } from './types';

type PersonalInfoSectionProps = {
  copy: ProfileCopy;
  profile: ProfileState;
  isRtl: boolean;
  cardClass: string;
  inputClass: string;
  primaryBtnClass: string;
  detailsForm: ProfileDetailsFormState;
  setDetailsForm: (updater: (prev: ProfileDetailsFormState) => ProfileDetailsFormState) => void;
  detailsSaving: boolean;
  onSaveDetails: (event: FormEvent) => void;
  onAvatarClick: () => void;
  birthdayPickerRef: RefObject<HTMLDivElement | null>;
  birthdayPickerOpen: boolean;
  birthdayDisplay: string;
  birthdayMonth: Date;
  calendarMonthOptions: Array<{ value: number; label: string }>;
  birthdayYearOptions: number[];
  monthLabelFormatter: Intl.DateTimeFormat;
  calendarWeekdays: readonly string[];
  birthdayCells: Array<Date | null>;
  selectedBirthday: Date | null;
  today: Date;
  onToggleBirthdayPicker: () => void;
  onSetBirthdayPickerOpen: (open: boolean) => void;
  onSetBirthdayMonthValue: (month: number) => void;
  onSetBirthdayYearValue: (year: number) => void;
  onChangeBirthdayMonth: (delta: number) => void;
  onSelectBirthday: (value: Date) => void;
};

export const PersonalInfoSection = ({
  copy,
  profile,
  isRtl,
  inputClass,
  primaryBtnClass,
  detailsForm,
  setDetailsForm,
  detailsSaving,
  onSaveDetails,
  onAvatarClick,
  birthdayPickerRef,
  birthdayPickerOpen,
  birthdayDisplay,
  birthdayMonth,
  calendarMonthOptions,
  birthdayYearOptions,
  monthLabelFormatter,
  calendarWeekdays,
  birthdayCells,
  selectedBirthday,
  today,
  onToggleBirthdayPicker,
  onSetBirthdayPickerOpen,
  onSetBirthdayMonthValue,
  onSetBirthdayYearValue,
  onChangeBirthdayMonth,
  onSelectBirthday,
}: PersonalInfoSectionProps) => {
  const initials = `${(detailsForm.firstName || profile.user.firstName || '').charAt(0)}${(detailsForm.lastName || profile.user.lastName || '').charAt(0)}`.toUpperCase() || 'U';
  const avatarUrl = detailsForm.avatarUrl || profile.user.avatarUrl || '';
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(
    `${detailsForm.firstName || profile.user.firstName || ''} ${detailsForm.lastName || profile.user.lastName || ''}`.trim(),
  );

  const resetForm = () => {
    setDetailsForm(() => ({
      firstName: profile.user.firstName || '',
      lastName: profile.user.lastName || '',
      nationalId: profile.user.nationalId || '',
      phoneNumber: profile.user.phoneNumber || '',
      avatarUrl: profile.user.avatarUrl || '',
      birthday: profile.user.birthday || '',
      gender: profile.user.gender || '',
    }));
    setDisplayName(`${profile.user.firstName || ''} ${profile.user.lastName || ''}`.trim());
    setEditing(false);
  };

  return (
    <section id="section-personal-info-form" className="grid w-full grid-cols-1 gap-6">
      <PageCard
        title={copy.personalInfo}
        description={copy.personalSection.description}
        action={
          editing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-white/70 bg-white/65 px-4 py-2 text-sm font-medium text-[#5F6368] shadow-sm backdrop-blur-md hover:bg-white"
              >
                {copy.actions.cancel}
              </button>
              <button type="submit" form="personal-edit-form" className={primaryBtnClass} disabled={detailsSaving}>
                {detailsSaving ? copy.updating : copy.actions.saveChanges}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1765CC]"
            >
              <FiEdit2 className="h-4 w-4" />
              {copy.actions.editProfile}
            </button>
          )
        }
      >
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <div className="rounded-[24px] border border-white/70 bg-gradient-to-br from-white/75 via-white/55 to-[#E8F0FE]/70 p-5 text-center shadow-sm backdrop-blur-md">
            <div className="relative mx-auto h-24 w-24">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/65 text-2xl font-semibold text-[#1A73E8] shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={copy.profileAvatar} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#1A73E8] shadow-sm hover:bg-white"
                aria-label={copy.changeAvatarAria}
                onClick={onAvatarClick}
              >
                <FiCamera className="h-4 w-4" />
              </button>
            </div>

            <h3 className="mt-4 text-lg font-medium text-[#202124]">
              {editing ? displayName || `${detailsForm.firstName} ${detailsForm.lastName}` : `${profile.user.firstName || ''} ${profile.user.lastName || ''}`}
            </h3>
            <p className="mt-1 break-all text-xs leading-5 text-[#5F6368]">{profile.user.email || copy.notSet}</p>

            <div className="mt-4 flex justify-center gap-2">
              <Badge tone="green">{copy.status.active}</Badge>
              <Badge tone="blue">{copy.status.sso}</Badge>
            </div>

            <div className={`mt-5 rounded-2xl border border-white/70 bg-white/50 p-3 backdrop-blur-md ${isRtl ? 'text-right' : 'text-left'}`}>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">{copy.personalSection.identitySourceLabel}</p>
              <p className="mt-2 text-sm font-medium text-[#202124]">{copy.personalSection.identitySourceValue}</p>
              <p className="mt-1 text-xs leading-5 text-[#5F6368]">
                {editing
                  ? copy.personalSection.identitySourceEditingHelp
                  : copy.personalSection.identitySourceReadOnlyHelp}
              </p>
            </div>
          </div>

          {editing ? (
            <form id="personal-edit-form" className="space-y-4" onSubmit={onSaveDetails}>
              <div className="rounded-[24px] border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-md">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-medium text-[#202124]">{copy.personalSection.editDetailsTitle}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#5F6368]">{copy.personalSection.editDetailsDescription}</p>
                  </div>
                  <Badge tone="blue">{copy.status.draft}</Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">{copy.firstName}</span>
                    <input
                      type="text"
                      value={detailsForm.firstName}
                      onChange={(event) =>
                        setDetailsForm((prev) => ({
                          ...prev,
                          firstName: event.target.value,
                        }))
                      }
                      className={`${inputClass} h-12 rounded-2xl border-white/70 bg-white/75 px-4 shadow-sm backdrop-blur-md focus:ring-4 focus:ring-[#D2E3FC]/70`}
                    />
                    <span className="mt-2 block text-xs text-[#5F6368]">{copy.personalSection.firstNameHelp}</span>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">{copy.lastName}</span>
                    <input
                      type="text"
                      value={detailsForm.lastName}
                      onChange={(event) =>
                        setDetailsForm((prev) => ({
                          ...prev,
                          lastName: event.target.value,
                        }))
                      }
                      className={`${inputClass} h-12 rounded-2xl border-white/70 bg-white/75 px-4 shadow-sm backdrop-blur-md focus:ring-4 focus:ring-[#D2E3FC]/70`}
                    />
                    <span className="mt-2 block text-xs text-[#5F6368]">{copy.personalSection.lastNameHelp}</span>
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">{copy.personalSection.displayNameLabel}</span>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      className={`${inputClass} h-12 rounded-2xl border-white/70 bg-white/75 px-4 shadow-sm backdrop-blur-md focus:ring-4 focus:ring-[#D2E3FC]/70`}
                    />
                    <span className="mt-2 block text-xs text-[#5F6368]">{copy.personalSection.displayNameHelp}</span>
                  </label>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/70 bg-white/45 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-[#202124]">{copy.personalSection.managedFieldsTitle}</h3>
                    <p className="mt-1 text-xs text-[#5F6368]">{copy.personalSection.managedFieldsDescription}</p>
                  </div>
                  <Badge tone="green">{copy.status.protected}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/70 bg-white/50 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">{copy.nationalId}</p>
                      <Badge>{copy.status.locked}</Badge>
                    </div>
                    <p className="break-words text-sm font-medium text-[#202124]">{profile.user.nationalId || copy.notSet}</p>
                  </div>

                  <div className="rounded-2xl border border-white/70 bg-white/50 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">{copy.primaryEmail}</p>
                      <Badge>{copy.status.locked}</Badge>
                    </div>
                    <p className="break-words text-sm font-medium text-[#202124]">{profile.user.email || copy.notSet}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-md">
                <div className="grid gap-4 md:grid-cols-2">
                  <BirthdayPickerField
                    copy={copy}
                    inputClass={inputClass}
                    isRtl={isRtl}
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
                    onTogglePicker={onToggleBirthdayPicker}
                    onSetPickerOpen={onSetBirthdayPickerOpen}
                    onSetBirthdayMonthValue={onSetBirthdayMonthValue}
                    onSetBirthdayYearValue={onSetBirthdayYearValue}
                    onChangeBirthdayMonth={onChangeBirthdayMonth}
                    onSelectBirthday={onSelectBirthday}
                    onClearBirthday={() => {
                      setDetailsForm((prev) => ({ ...prev, birthday: '' }));
                      onSetBirthdayPickerOpen(false);
                    }}
                  />

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#9AA0A6]">{copy.gender}</span>
                    <select
                      className={`${inputClass} h-12 appearance-none rounded-2xl border-white/70 bg-white/75 px-4 shadow-sm backdrop-blur-md focus:ring-4 focus:ring-[#D2E3FC]/70`}
                      value={detailsForm.gender}
                      onChange={(event) => setDetailsForm((prev) => ({ ...prev, gender: event.target.value }))}
                    >
                      {copy.genderOptions.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[#FDE293]/80 bg-[#FEF7E0]/75 p-4 backdrop-blur-md">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#B06000]">
                    <FiAlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#202124]">{copy.personalSection.reviewBeforeSaveTitle}</p>
                    <p className="mt-1 text-xs leading-5 text-[#5F6368]">{copy.personalSection.reviewBeforeSaveDescription}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={resetForm} className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-[#5F6368] hover:bg-white">
                    {copy.actions.cancel}
                  </button>
                  <button type="submit" className={primaryBtnClass} disabled={detailsSaving}>
                    {detailsSaving ? copy.updating : copy.actions.save}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: copy.firstName, value: profile.user.firstName || copy.notSet, status: copy.status.editable, tone: 'blue' as const },
                  { label: copy.lastName, value: profile.user.lastName || copy.notSet, status: copy.status.editable, tone: 'blue' as const },
                  { label: copy.personalSection.displayNameLabel, value: `${profile.user.firstName || ''} ${profile.user.lastName || ''}`.trim() || copy.notSet, status: copy.status.generated, tone: 'gray' as const },
                  { label: copy.nationalId, value: profile.user.nationalId || copy.notSet, status: copy.status.managed, tone: 'green' as const },
                ].map((field) => (
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
                    <p className="text-sm font-medium text-[#202124]">{copy.personalSection.verifiedIdentityTitle}</p>
                    <p className="mt-1 text-xs leading-5 text-[#5F6368]">
                      {copy.personalSection.verifiedIdentityDescription}
                    </p>
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
