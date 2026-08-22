// frontend/src/components/EmptyStates.tsx
// Empty state components for better UX when data is empty

import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'outline' | 'secondary';
  };
  className?: string;
  illustration?: React.ReactNode;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  illustration 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {illustration || (
        <div className="mb-6 flex flex-col items-center">
          {icon && <div className="mb-4 text-muted-foreground/50">{icon}</div>}
        </div>
      )}
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <Button 
          variant={action.variant || 'primary'} 
          onClick={action.onClick}
          className="w-auto"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Predefined empty states for common scenarios
export function EmptyAssets({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="p-12 text-center">
      <div className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-full w-full">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">No assets found</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Get started by adding your first asset to the inventory.
      </p>
      <Button 
        onClick={onAdd || (() => window.location.href = '/assets/new')}
        className="btn-primary"
      >
        Add Your First Asset
      </Button>
    </div>
  );
}

export function EmptyAudits({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="p-12 text-center">
      <div className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-full w-full">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">No audits found</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Create your first audit session to start tracking inventory.
      </p>
      <Button 
        onClick={onCreate || (() => window.location.href = '/audits/new')}
        className="btn-primary"
      >
        Create Audit Session
      </Button>
    </div>
  );
}

export function EmptyMaintenance({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="p-12 text-center">
      <div className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-full w-full">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">No work orders found</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Create your first work order to start tracking maintenance tasks.
      </p>
      <Button 
        onClick={onCreate || (() => window.location.href = '/maintenance/new')}
        className="btn-primary"
      >
        Create Work Order
      </Button>
    </div>
  );
}

export function EmptyUsers({ onInvite }: { onInvite?: () => void }) {
  return (
    <div className="p-12 text-center">
      <div className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-full w-full">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">No users found</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Invite your first team member to start collaborating.
      </p>
      <Button 
        onClick={onInvite || (() => window.location.href = '/users/new')}
        className="btn-primary"
      >
        Invite User
      </Button>
    </div>
  );
}

export function EmptyReports({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <svg className="h-12 w-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
      <p>No custom reports yet</p>
      <Button className="mt-4 btn-outline" onClick={onCreate}>
        Create Custom Report
      </Button>
    </div>
  );
}

export function EmptyAuditsResults() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <svg className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11" />
      </svg>
      <p>No discrepancies found</p>
    </div>
  );
}

export function EmptySearchResults({ query }: { query?: string }) {
  return (
    <div className="p-12 text-center">
      <svg className="h-12 w-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <h3 className="text-lg font-medium mb-2">No results found</h3>
      <p className="text-muted-foreground mb-4">
        {query ? `No results for "${query}"` : 'No matching records found'}
      </p>
      <p className="text-xs text-muted-foreground">
        Try adjusting your search or filters
      </p>
    </div>
  );
}

export function EmptyNotifications() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <svg className="h-12 w-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-3-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <p>No notifications</p>
      <p className="text-sm mt-1">You're all caught up!</p>
    </div>
  );
}

export function GenericEmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'outline' | 'secondary';
  };
}) {
  return (
    <div className="p-12 text-center">
      {icon && <div className="h-12 w-12 mx-auto mb-4 opacity-50">{icon}</div>}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>}
      {action && (
        <Button 
          onClick={action.onClick}
          variant={action.variant || 'primary'}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}