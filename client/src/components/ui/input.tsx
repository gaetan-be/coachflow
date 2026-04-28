import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'w-full bg-white border border-[#EAEDEF] rounded-xl px-[14px] py-[10px]',
          'font-[DM_Sans,sans-serif] text-[13px] text-[#202C34]',
          'outline-none transition-all placeholder:text-[#BFC5CC]',
          'focus:border-[#40A2C0] focus:shadow-[0_0_0_3px_rgba(64,162,192,0.08)]',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
