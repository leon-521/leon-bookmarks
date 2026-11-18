'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-white shadow-sm hover:bg-accent-hover hover:shadow-md active:shadow-sm focus-visible:ring-accent',
        secondary:
          'bg-bg-tertiary text-text-primary shadow-xs hover:bg-border hover:shadow-sm focus-visible:ring-accent',
        outline:
          'border border-border bg-transparent text-text-primary hover:bg-bg-secondary hover:border-border-hover focus-visible:ring-accent',
        ghost:
          'text-text-secondary hover:bg-bg-secondary hover:text-text-primary focus-visible:ring-accent',
        danger:
          'bg-danger text-white shadow-sm hover:bg-red-600 hover:shadow-md focus-visible:ring-danger',
      },
      size: {
        sm: 'h-8 rounded-md px-3 text-xs',
        md: 'h-9 rounded-lg px-4 text-sm',
        lg: 'h-11 rounded-lg px-6 text-base',
        icon: 'h-9 w-9 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
