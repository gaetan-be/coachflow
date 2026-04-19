import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-[--color-navy] text-white hover:bg-[--color-teal] hover:-translate-y-px',
        secondary:
          'bg-transparent text-[--color-navy] border border-[--color-border] hover:border-[--color-navy]',
        teal: 'border border-[--color-teal] text-[--color-teal] hover:bg-[rgba(64,162,192,0.08)] hover:-translate-y-0.5',
        dark: 'bg-[--color-navy] text-white hover:bg-[--color-teal] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(64,162,192,0.35)] tracking-widest uppercase text-xs font-bold',
        ghost: 'hover:bg-[rgba(64,162,192,0.06)] text-[--color-muted]',
        destructive: 'bg-transparent border border-[#EAEDEF] text-[--color-muted] hover:border-red-300 hover:text-red-400 hover:bg-red-50',
      },
      size: {
        default: 'px-7 py-4 min-h-[52px] text-[15px]',
        sm: 'px-[14px] py-1.5 text-xs min-h-[30px]',
        md: 'px-6 py-3.5 min-h-[48px] text-[11px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
