import { ReactNode } from 'react';
import { FiChevronRight, FiShield } from 'react-icons/fi';

type Tone = 'blue' | 'green' | 'amber' | 'gray' | 'red';

const toneClassMap: Record<Tone, string> = {
  blue: 'border-[#D2E3FC] bg-[#E8F0FE] text-[#1A73E8]',
  green: 'border-[#CEEAD6] bg-[#E6F4EA] text-[#137333]',
  amber: 'border-[#FDE293] bg-[#FEF7E0] text-[#B06000]',
  gray: 'border-[#DADCE0] bg-[#F1F3F4] text-[#5F6368]',
  red: 'border-[#FAD2CF] bg-[#FDECEA] text-[#B3261E]',
};

export const Badge = ({ children, tone = 'gray' }: { children: ReactNode; tone?: Tone }) => (
  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${toneClassMap[tone]}`}>
    {children}
  </span>
);

export const PageCard = ({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={`rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_12px_32px_rgba(60,64,67,.10)] ring-1 ring-white/35 backdrop-blur-xl ${className}`}
  >
    {title || description || action ? (
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {title ? <h2 className="text-xl font-normal text-[#202124]">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm leading-6 text-[#5F6368]">{description}</p> : null}
        </div>
        {action}
      </div>
    ) : null}
    {children}
  </section>
);

export const InfoRow = ({
  label,
  value,
  note,
  icon: Icon,
  locked,
  isRtl,
}: {
  label: string;
  value: string;
  note?: string;
  icon?: typeof FiShield;
  locked?: boolean;
  isRtl?: boolean;
}) => (
  <div className="group flex items-center justify-between gap-4 border-b border-[#E8EAED] py-4 last:border-b-0">
    <div className={`flex min-w-0 items-start gap-3 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
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
      {locked ? <Badge>Managed</Badge> : <FiChevronRight className={`h-5 w-5 text-[#9AA0A6] ${isRtl ? 'rotate-180' : ''}`} />}
    </div>
  </div>
);

export const SettingRow = ({
  icon: Icon,
  title,
  description,
  badge,
  badgeTone = 'gray',
  action,
  isRtl,
}: {
  icon: typeof FiShield;
  title: string;
  description: string;
  badge?: string;
  badgeTone?: Tone;
  action?: ReactNode;
  isRtl?: boolean;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-md">
    <div className={`flex min-w-0 items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
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

