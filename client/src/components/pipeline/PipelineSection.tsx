import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PipelineSectionProps {
  number?: string;
  title: string;
  accent?: 'pink' | 'teal' | 'slate' | 'default';
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const accentMap = {
  pink: {
    tag: 'bg-[#EA226C]',
    border: 'focus-within:border-[rgba(234,34,108,0.25)] focus-within:border-l-[#EA226C]',
    headerBg: 'bg-[rgba(234,34,108,0.025)] hover:bg-[rgba(234,34,108,0.05)]',
    bodyBg: 'bg-[rgba(234,34,108,0.02)]',
    shadow: 'focus-within:shadow-[0_4px_24px_rgba(234,34,108,0.10),0_1px_4px_rgba(0,0,0,0.04)]',
  },
  teal: {
    tag: 'bg-[#40A2C0]',
    border: 'focus-within:border-[rgba(64,162,192,0.3)] focus-within:border-l-[#40A2C0]',
    headerBg: 'bg-[rgba(64,162,192,0.04)] hover:bg-[rgba(64,162,192,0.06)]',
    bodyBg: 'bg-[rgba(64,162,192,0.035)]',
    shadow: 'focus-within:shadow-[0_4px_24px_rgba(64,162,192,0.12),0_1px_4px_rgba(0,0,0,0.04)]',
  },
  slate: {
    tag: 'bg-[#6B9DB5]',
    border: 'focus-within:border-[rgba(107,157,181,0.3)] focus-within:border-l-[#6B9DB5]',
    headerBg: 'bg-[rgba(107,157,181,0.03)] hover:bg-[rgba(107,157,181,0.06)]',
    bodyBg: 'bg-[rgba(107,157,181,0.02)]',
    shadow: 'focus-within:shadow-[0_4px_24px_rgba(107,157,181,0.10),0_1px_4px_rgba(0,0,0,0.04)]',
  },
  default: {
    tag: 'bg-[#40A2C0]',
    border: 'focus-within:border-[rgba(64,162,192,0.3)] focus-within:border-l-[#40A2C0]',
    headerBg: 'bg-[#FAFBFC] hover:bg-[#EEF0F2]',
    bodyBg: '',
    shadow: 'focus-within:shadow-[0_4px_24px_rgba(64,162,192,0.12),0_1px_4px_rgba(0,0,0,0.04)]',
  },
};

export function PipelineSection({
  number,
  title,
  accent = 'default',
  defaultOpen = false,
  children,
}: PipelineSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const a = accentMap[accent];

  return (
    <div
      className={cn(
        'bg-white border border-[#EAEDEF] border-l-[3px] border-l-transparent rounded-2xl overflow-hidden mb-4',
        'shadow-[0_1px_4px_rgba(32,44,52,0.04)] hover:shadow-[0_2px_12px_rgba(32,44,52,0.06)]',
        'transition-all animate-fade-up',
        a.border,
        a.shadow,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-3 px-6 py-4 border-b border-[#EAEDEF]',
          'cursor-pointer select-none transition-colors text-left',
          a.headerBg,
        )}
      >
        {number && (
          <span
            className={cn(
              'text-[10px] font-bold tracking-[1.5px] uppercase text-white px-3 py-1.5 rounded-full min-w-[32px] text-center',
              a.tag,
            )}
          >
            {number}
          </span>
        )}
        <span className="flex-1 text-[15px] font-semibold text-[#202C34] tracking-[0.2px]">
          {title}
        </span>
        <span
          className={cn(
            'text-[11px] text-[#6B7580] transition-transform duration-300',
            !open && '-rotate-90',
          )}
        >
          ▼
        </span>
      </button>

      <div
        className={cn(
          'transition-all overflow-hidden',
          open ? 'max-h-none opacity-100' : 'max-h-0 opacity-0',
          a.bodyBg,
        )}
        style={open ? { padding: '24px' } : { padding: '0 24px' }}
      >
        {open && children}
      </div>
    </div>
  );
}
