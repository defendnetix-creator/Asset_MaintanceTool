// frontend/src/components/ui/Badge.tsx
// Reusable badge component

import { cn } from '../../utils/helpers';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        {
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80': variant === 'default',
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80': variant === 'destructive',
          'text-foreground': variant === 'outline',
          'border-transparent bg-green-500 text-white': variant === 'success',
          'border-transparent bg-amber-500 text-white': variant === 'warning',
          'border-transparent bg-blue-500 text-white': variant === 'info',
        },
        className
      )}
      {...props}
    />
  );
}