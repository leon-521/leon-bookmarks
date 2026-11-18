'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, helperText, error, iconLeft, iconRight, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-tertiary">
              {iconLeft}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              'flex h-10 w-full rounded-lg border bg-bg-primary px-3.5 py-2 text-sm text-text-primary',
              'placeholder:text-text-tertiary',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              error
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-border hover:border-border-hover focus:border-accent focus:ring-accent/20',
              iconLeft && 'pl-10',
              iconRight && 'pr-10',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-bg-secondary',
              className
            )}
            ref={ref}
            {...props}
          />
          {iconRight && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-tertiary">
              {iconRight}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={cn(
              'mt-1.5 text-xs',
              error ? 'text-danger' : 'text-text-tertiary'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
