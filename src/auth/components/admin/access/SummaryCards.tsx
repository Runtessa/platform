import { FiGrid, FiKey, FiLayers, FiUsers } from 'react-icons/fi';
import { AccessCopy } from './types';

type SummaryCardsProps = {
  copy: AccessCopy;
  cardClass: string;
  loading: boolean;
  loadingUsers: boolean;
  organizationsCount: number;
  rolesCount: number;
  mappedTenantsCount: number;
  usersTotal: number;
};

export const SummaryCards = ({
  copy,
  cardClass,
  loading,
  loadingUsers,
  organizationsCount,
  rolesCount,
  mappedTenantsCount,
  usersTotal,
}: SummaryCardsProps) => {
  const metricClass =
    'rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_12px_32px_rgba(60,64,67,.10)] ring-1 ring-white/35 backdrop-blur-xl';

  const badgeClass = (tone: 'blue' | 'green' | 'amber' | 'gray') => {
    if (tone === 'blue') return 'border-[#D2E3FC] bg-[#E8F0FE] text-[#1A73E8]';
    if (tone === 'green') return 'border-[#CEEAD6] bg-[#E6F4EA] text-[#137333]';
    if (tone === 'amber') return 'border-[#FDE293] bg-[#FEF7E0] text-[#B06000]';
    return 'border-[#DADCE0] bg-[#F1F3F4] text-[#5F6368]';
  };

  const Badge = ({ tone, text }: { tone: 'blue' | 'green' | 'amber' | 'gray'; text: string }) => (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(tone)}`}>{text}</span>
  );

  return (
    <section className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      <article className={metricClass}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-[#5F6368] shadow-sm">
            <FiLayers className="h-5 w-5" />
          </span>
          <Badge tone="blue" text={loading ? '...' : String(organizationsCount)} />
        </div>
        <h2 className="text-sm font-medium text-[#5F6368]">{copy.summary.organizations}</h2>
        <p className="mt-2 text-3xl font-normal tracking-tight text-[#202124]">{loading ? '...' : organizationsCount}</p>
      </article>
      <article className={metricClass}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-[#5F6368] shadow-sm">
            <FiKey className="h-5 w-5" />
          </span>
          <Badge tone="green" text={loading ? '...' : String(rolesCount)} />
        </div>
        <h2 className="text-sm font-medium text-[#5F6368]">{copy.summary.roles}</h2>
        <p className="mt-2 text-3xl font-normal tracking-tight text-[#202124]">{loading ? '...' : rolesCount}</p>
      </article>
      <article className={metricClass}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-[#5F6368] shadow-sm">
            <FiGrid className="h-5 w-5" />
          </span>
          <Badge tone="amber" text={loading ? '...' : String(mappedTenantsCount)} />
        </div>
        <h2 className="text-sm font-medium text-[#5F6368]">{copy.summary.mappedTenants}</h2>
        <p className="mt-2 text-3xl font-normal tracking-tight text-[#202124]">{loading ? '...' : mappedTenantsCount}</p>
      </article>
      <article className={metricClass}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-[#5F6368] shadow-sm">
            <FiUsers className="h-5 w-5" />
          </span>
          <Badge tone="gray" text={loadingUsers ? '...' : String(usersTotal)} />
        </div>
        <h2 className="text-sm font-medium text-[#5F6368]">{copy.summary.totalUsers}</h2>
        <p className="mt-2 text-3xl font-normal tracking-tight text-[#202124]">{loadingUsers ? '...' : usersTotal}</p>
      </article>
    </section>
  );
};
