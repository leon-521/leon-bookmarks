'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn, getInitials } from '@/lib/utils';

const avatarSizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: keyof typeof avatarSizes;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, src, alt, fallback, size = 'md', ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex shrink-0 overflow-hidden rounded-full',
      avatarSizes[size],
      className
    )}
    {...props}
  >
    <AvatarPrimitive.Image
      className="aspect-square h-full w-full object-cover"
      src={src}
      alt={alt || ''}
    />
    <AvatarPrimitive.Fallback
      className="flex h-full w-full items-center justify-center rounded-full bg-accent-muted text-accent font-semibold"
      delayMs={300}
    >
      {fallback ? getInitials(fallback) : '?'}
    </AvatarPrimitive.Fallback>
  </AvatarPrimitive.Root>
));
Avatar.displayName = 'Avatar';

export { Avatar };
