// frontend/src/pages/AuditsPage.tsx
// Audits list page

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Plus, Search, Filter, Download, ClipboardCheck, 
  ChevronLeft, ChevronRight, Loader2, MoreHorizontal, Play, CheckCircle2
} from 'lucide-react';
import { useAudits, useStartAudit, useCompleteAudit } from '../api/audits';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { cn, formatDate, getStatusColor } from '../utils/helpers';
import { useToast } from '../components/ui/useToast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/DropdownMenu';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OVERDUE', label: 'Overdue' },
];

const scopeTypeOptions = [
  { value: '', label: 'All Scopes' },
  { value: 'site', label: 'Site' },
  { value: 'location', label: 'Location' },
  { value: 'department', label: 'Department' },
  { value: 'category', label: 'Category' },
  { value: 'custom', label: 'Custom' },
];

export function AuditsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [selectedAudits, setSelectedAudits] = useState<string[]>([]);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const status = searchParams.get('status') || '';
  const scope_type = searchParams.get('scope_type') || '';

  const { data, isLoading, error, refetch } = useAudits({
    page,
    limit,
    status: status || undefined,
    scope_type: scope_type || undefined,
  });

  const startAudit = useStartAudit();
  const completeAudit = useCompleteAudit();

  const updateParams = (newParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get('search') as string;
    updateParams({ search: searchValue, page: 1 });
  };

  const handleStatusChange = (value: string) => updateParams({ status: value, page: 1 });
  const handleScopeChange = (value: string) => updateParams({ scope_type: value, page: 1 });

  const handlePageChange = (newPage: number) => updateParams({ page: newPage });

  const handleStart = async (id: string) => {
    await startAudit.mutateAsync(id);
    toast.success('Audit session started');
    refetch();
  };

  const handleComplete = async (id: string) => {
    await completeAudit.mutateAsync(id);
    toast.success('Audit session completed');
    refetch();
  };

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-destructive">Failed to load audits</p>
        <button onClick={refetch} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audits</h1>
          <p className="text-muted-foreground">Manage inventory audit sessions</p>
        </div>
        <Link to="/audits/new" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Audit
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input name="search" type="search" placeholder="Search audits..." className="input pl-10" />
            </div>
            <Select value={status} onValueChange={handleStatusChange} options={statusOptions} placeholder="Filter by status" className="w-full sm:w-48" />
            <Select value={scope_type} onValueChange={handleScopeChange} options={scopeTypeOptions} placeholder="Filter by scope" className="w-full sm:w-48" />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Loading audits...</p>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <h3 className="mt-4 text-lg font-medium">No audits found</h3>
              <p className="text-muted-foreground mt-1">Create your first audit session</p>
              <Link to="/audits/new" className="btn-primary mt-4 inline-flex">
                <Plus className="h-4 w-4 mr-2" />
                New Audit
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Lead Auditor</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="font-medium">{audit.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{audit.scope_type}</Badge>
                        {audit.scope_name && <span className="ml-2 text-sm text-muted-foreground">{audit.scope_name}</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(audit.status) as any}>{audit.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all" 
                              style={{ width: `${audit.total_assets > 0 ? (audit.scanned_count / audit.total_assets) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-20 text-right">
                            {audit.scanned_count}/{audit.total_assets}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{audit.due_at ? formatDate(audit.due_at) : '—'}</TableCell>
                      <TableCell>{audit.lead_auditor ? `${audit.lead_auditor.first_name} ${audit.lead_auditor.last_name}` : '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(audit.created_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-accent transition-colors">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/audits/${audit.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            {audit.status === 'SCHEDULED' && (
                              <DropdownMenuItem onClick={() => handleStart(audit.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                Start Audit
                              </DropdownMenuItem>
                            )}
                            {audit.status === 'IN_PROGRESS' && (
                              <DropdownMenuItem onClick={() => handleComplete(audit.id)}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Complete Audit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to={`/audits/${audit.id}/report`}>Export Report</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between border-t border-border p-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data?.pagination.total || 0)} of {data?.pagination.total || 0} audits
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-sm">Page {page} of {data?.pagination.total_pages || 1}</span>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page >= (data?.pagination.total_pages || 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}