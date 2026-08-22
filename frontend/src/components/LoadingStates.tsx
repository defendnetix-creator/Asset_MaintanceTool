// frontend/src/components/LoadingStates.tsx
// Loading states and skeleton components for better UX

import { cn } from '@/utils/helpers';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height, ...props }: SkeletonProps) {
  const baseStyles = 'animate-pulse rounded bg-muted';
  
  const variantStyles = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl',
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], {
        'w-full': variant !== 'circular',
        'h-4': variant === 'text',
      })}
      style={{ width, height }}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className, ...props }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: { className?: string }) {
  return (
    <div className={cn('card animate-pulse', className)} {...props}>
      <div className="p-6 space-y-4">
        <Skeleton variant="rectangular" height="6" width="3/4" />
        <Skeleton variant="rectangular" height="6" width="1/2" />
        <div className="space-y-3">
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className, ...props }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)} {...props}>
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="h-12 px-4 text-left">
                <Skeleton variant="text" width="80%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="p-4">
                  <Skeleton variant="text" width={colIndex === 0 ? '40%' : '80%'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonList({ items = 5, className, ...props }: { items?: number; className?: string }) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-xl border animate-pulse">
          <Skeleton variant="circular" width="48" height="48" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading spinner component
export function LoadingSpinner({ 
  size = 'md', 
  className, 
  label 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string; 
  label?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-8">
      <svg
        className={cn('animate-spin text-primary', sizeClasses[size], className)}
        viewBox="0 0 24 24"
        aria-hidden="true"
        role="status"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && <p className="text-sm text-muted-foreground mt-2">{label}</p>}
    </div>
  );
}

// Page loading state
export function PageLoading({ className, label = 'Loading...' }: { className?: string; label?: string }) {
  return (
    <div className={cn('min-h-[400px] flex flex-col items-center justify-center gap-4 p-8', className)}>
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

// Inline loading state for buttons/actions
export function InlineLoading({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
  };

  return (
    <svg
      className={cn('animate-spin text-current', sizeClasses[size])}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}