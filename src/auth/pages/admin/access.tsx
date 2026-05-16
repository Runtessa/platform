import Head from 'next/head';
import { FiChevronRight } from 'react-icons/fi';
import { AdminAccessDenied } from '../../components/admin/access/AdminAccessDenied';
import { AdminAccessHeaderActions } from '../../components/admin/access/AdminAccessHeaderActions';
import { OrganizationsSection } from '../../components/admin/access/OrganizationsSection';
import { RolesSection } from '../../components/admin/access/RolesSection';
import { StatusBanners } from '../../components/admin/access/StatusBanners';
import { SummaryCards } from '../../components/admin/access/SummaryCards';
import { TenantsSection } from '../../components/admin/access/TenantsSection';
import { UsersSection } from '../../components/admin/access/UsersSection';
import { useAdminAccessPage } from '../../components/admin/access/hooks/useAdminAccessPage';
import {
  cardClass,
  checkboxClass,
  inputClass,
  labelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from '../../components/admin/access-config';
import { localeDir, useUiLocale } from '../../lib/ui/locale';
import { getAuthMessages } from '../../lib/ui/i18n';

export default function AdminAccessPage() {
  const { locale, isRtl } = useUiLocale();
  const copy = getAuthMessages(locale).access;

  const {
    session,
    loading,
    loadingUsers,
    error,
    success,
    organizations,
    roles,
    tenantMappings,
    usersPage,
    setUsersPage,
    usersTotal,
    users,
    search,
    setSearch,
    usersTenantFilter,
    setUsersTenantFilter,
    usersTenantOrgFilter,
    setUsersTenantOrgFilter,
    orgForm,
    setOrgForm,
    roleForm,
    setRoleForm,
    tenantOrgDraft,
    setTenantOrgDraft,
    savingTenantName,
    userDraft,
    setUserDraft,
    savingUserKey,
    csrfToken,
    canManage,
    orgTree,
    pageCount,
    userFilterTenantOptions,
    onSubmitOrganization,
    onSubmitRole,
    saveTenantMapping,
    assignOrganization,
    assignRole,
  } = useAdminAccessPage(copy);

  if (session?.authenticated && session.user && !session.user.isAuthAdmin) {
    return (
      <>
        <Head>
          <title>{copy.headTitle}</title>
        </Head>
        <div className="space-y-6" dir={localeDir(locale)}>
          <AdminAccessDenied copy={copy} />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{copy.headTitle}</title>
      </Head>

      <div className="space-y-6" dir={localeDir(locale)}>
        <AdminAccessHeaderActions copy={copy} secondaryBtnClass={secondaryBtnClass} />

        <StatusBanners error={error} success={success} />

        <SummaryCards
          copy={copy}
          cardClass={cardClass}
          loading={loading}
          loadingUsers={loadingUsers}
          organizationsCount={organizations.length}
          rolesCount={roles.length}
          mappedTenantsCount={tenantMappings.filter((item) => item.organizationRandId).length}
          usersTotal={usersTotal}
        />

        <article className={cardClass}>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-normal text-[#202124]">{copy.title}</h2>
              <p className="mt-1 text-sm leading-6 text-[#5F6368]">
                Manage organizations, roles, tenant mappings, and user assignments from one workflow.
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <a href="#access-orgs" className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm font-medium text-[#202124] shadow-sm backdrop-blur-md hover:bg-white/75">
              {copy.organizationsSectionTitle}
              <FiChevronRight className={`h-4 w-4 text-[#9AA0A6] ${isRtl ? 'rotate-180' : ''}`} />
            </a>
            <a href="#access-roles" className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm font-medium text-[#202124] shadow-sm backdrop-blur-md hover:bg-white/75">
              {copy.rolesSectionTitle}
              <FiChevronRight className={`h-4 w-4 text-[#9AA0A6] ${isRtl ? 'rotate-180' : ''}`} />
            </a>
            <a href="#access-tenants" className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm font-medium text-[#202124] shadow-sm backdrop-blur-md hover:bg-white/75">
              {copy.tenantsSectionTitle}
              <FiChevronRight className={`h-4 w-4 text-[#9AA0A6] ${isRtl ? 'rotate-180' : ''}`} />
            </a>
            <a href="#access-users" className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm font-medium text-[#202124] shadow-sm backdrop-blur-md hover:bg-white/75">
              {copy.usersSectionTitle}
              <FiChevronRight className={`h-4 w-4 text-[#9AA0A6] ${isRtl ? 'rotate-180' : ''}`} />
            </a>
          </div>
        </article>

        <div id="access-orgs">
          <OrganizationsSection
            copy={copy}
            cardClass={cardClass}
            labelClass={labelClass}
            inputClass={inputClass}
            checkboxClass={checkboxClass}
            primaryBtnClass={primaryBtnClass}
            orgForm={orgForm}
            setOrgForm={setOrgForm}
            organizations={organizations}
            orgTree={orgTree}
            onSubmitOrganization={onSubmitOrganization}
            csrfToken={csrfToken}
            canManage={canManage}
          />
        </div>

        <div id="access-roles">
          <RolesSection
            copy={copy}
            cardClass={cardClass}
            labelClass={labelClass}
            inputClass={inputClass}
            checkboxClass={checkboxClass}
            primaryBtnClass={primaryBtnClass}
            organizationsFirstRandId={organizations[0]?.randId || ''}
            roleForm={roleForm}
            setRoleForm={setRoleForm}
            roles={roles}
            orgTree={orgTree}
            onSubmitRole={onSubmitRole}
            csrfToken={csrfToken}
            canManage={canManage}
          />
        </div>

        <div id="access-tenants">
          <TenantsSection
            copy={copy}
            cardClass={cardClass}
            inputClass={inputClass}
            secondaryBtnClass={secondaryBtnClass}
            isRtl={isRtl}
            tenantMappings={tenantMappings}
            orgTree={orgTree}
            tenantOrgDraft={tenantOrgDraft}
            setTenantOrgDraft={setTenantOrgDraft}
            saveTenantMapping={(tenantName) => {
              void saveTenantMapping(tenantName);
            }}
            savingTenantName={savingTenantName}
            csrfToken={csrfToken}
            canManage={canManage}
          />
        </div>

        <div id="access-users">
          <UsersSection
            copy={copy}
            cardClass={cardClass}
            inputClass={inputClass}
            secondaryBtnClass={secondaryBtnClass}
            primaryBtnClass={primaryBtnClass}
            isRtl={isRtl}
            search={search}
            setSearch={setSearch}
            usersTenantFilter={usersTenantFilter}
            setUsersTenantFilter={setUsersTenantFilter}
            usersTenantOrgFilter={usersTenantOrgFilter}
            setUsersTenantOrgFilter={setUsersTenantOrgFilter}
            userFilterTenantOptions={userFilterTenantOptions}
            tenantMappings={tenantMappings}
            orgTree={orgTree}
            usersPage={usersPage}
            pageCount={pageCount}
            setUsersPage={setUsersPage}
            loadingUsers={loadingUsers}
            users={users}
            userDraft={userDraft}
            setUserDraft={setUserDraft}
            roles={roles}
            csrfToken={csrfToken}
            canManage={canManage}
            savingUserKey={savingUserKey}
            assignOrganization={(userRandId) => {
              void assignOrganization(userRandId);
            }}
            assignRole={(userRandId) => {
              void assignRole(userRandId);
            }}
          />
        </div>
      </div>
    </>
  );
}
