import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-block text-[9px] font-bold tracking-[1px] uppercase px-[10px] py-[3px] rounded-[20px] border',
  {
    variants: {
      variant: {
        new: 'bg-[rgba(64,162,192,0.08)] text-[#40A2C0] border-[rgba(64,162,192,0.2)]',
        queued: 'bg-[rgba(190,166,116,0.1)] text-[#BEA674] border-[rgba(190,166,116,0.3)]',
        processing: 'bg-[rgba(127,119,221,0.10)] text-[#7f77dd] border-[rgba(127,119,221,0.25)]',
        done: 'bg-[rgba(76,175,130,0.10)] text-[#4caf82] border-[rgba(76,175,130,0.25)]',
        error: 'bg-[rgba(234,34,108,0.08)] text-[#EA226C] border-[rgba(234,34,108,0.25)]',
      },
    },
    defaultVariants: {
      variant: 'new',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

export type ReportStatus = 'queued' | 'processing' | 'done' | 'error' | null | undefined;

export function ReportBadge({ status }: { status: ReportStatus }) {
  if (!status) return <Badge variant="new">Nouveau</Badge>;
  const labels: Record<string, string> = {
    queued: 'En attente',
    processing: 'En cours',
    done: 'Terminé',
    error: 'Erreur',
  };
  const variants: Record<string, 'queued' | 'processing' | 'done' | 'error'> = {
    queued: 'queued',
    processing: 'processing',
    done: 'done',
    error: 'error',
  };
  return (
    <Badge variant={variants[status] ?? 'new'}>
      {labels[status] ?? status}
    </Badge>
  );
}
