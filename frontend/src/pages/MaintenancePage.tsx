// frontend/src/pages/MaintenancePage.tsx
// Maintenance work orders page

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Plus, Search, Filter, Download, Wrench, 
  ChevronLeft, ChevronRight, Loader2, MoreHorizontal, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { useMaintenanceWorkOrders, useStartMaintenance, useCompleteMaintenance } from '../api/maintenance';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { cn, formatDate, getStatusColor, getPriorityColor, getPriorityLabel } from '../utils/helpers';
import { useToast } from '../components/ui/useToast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/DropdownMenu';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'PREVENTIVE', label: 'Preventive' },
  { value: 'CORRECTIVE', label: 'Corrective' },
  { value: 'CALIBRATION', label: 'Calibration' },
  { value: 'INSPECTION', label: 'Inspection' },
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: '1', label: 'Critical (1)' },
  { value: '2', label: 'High (2)' },
  { value: '3', label: 'Medium (3)' },
  { value: '4', label: 'Low (4)' },
];

export function MaintenancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const status = searchParams.get('status') || '';
  const type = searchParams.get('type') || '';
  const priority = searchParams.get('priority') || '';
  const overdue = searchParams.get('overdue') === 'true';

  const { data, isLoading, error, refetch } = useMaintenanceWorkOrders({
    page,
    limit,
    status: status || undefined,
    type: type || undefined,
    priority: priority ? parseInt(priority) : undefined,
    overdue: overdue || undefined,
  });

  const startMaintenance = useStartMaintenance();
  const completeMaintenance = useCompleteMaintenance();

  const updateParams = (newParams: Record<string, string | number | boolean | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null && value !== false) {
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

  const handleFilterChange = (key: string, value: string) => {
    updateParams({ [key]: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage });
  };

  const handleStart = async (id: string) => {
    await startMaintenance.mutateAsync(id);
    toast.success('Work order started');
    refetch();
  };

  const handleComplete = async (id: string) => {
    // For now just mark complete - in reality would open a modal
    await completeMaintenance.mutateAsync({ 
      id, 
      data: { condition_after: 'SERVICEABLE', resolution: 'Completed via quick action' } 
    });
    toast.success('Work order completed');
    refetch();
  };

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-destructive">Failed to load work orders</p>
        <button onClick={refetch} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">Manage work orders and maintenance tasks</p>
        </div>
        <Link to="/maintenance/new" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Work Order
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input name="search" type="search" placeholder="Search work orders..." className="input pl-10" />
            </div>
            <Select value={status} onValueChange={(v) => handleFilterChange('status', v)} options={statusOptions} placeholder="Status" className="w-full sm:w-40" />
            <Select value={type} onValueChange={(v) => handleFilterChange('type', v)} options={typeOptions} placeholder="Type" className="w-full sm:w-40" />
            <Select value={priority} onValueChange={(v) => handleFilterChange('priority', v)} options={priorityOptions} placeholder="Priority" className="w-full sm:w-40" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={overdue} onChange={(e) => handleFilterChange('overdue', e.target.checked.toString())} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
              <span className="text-sm text-muted-foreground">Overdue only</span>
            </label>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Loading work orders...</p>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <h3 className="mt-4 text-lg font-medium">No work orders found</h3>
              <p className="text-muted-foreground mt-1">Create your first work order</p>
              <Link to="/maintenance/new" className="btn-primary mt-4 inline-flex">
                <Plus className="h-4 w-4 mr-2" />
                New Work Order
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>WO Number</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell className="font-mono font-medium">{wo.wo_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{wo.asset?.asset_tag || '—'}</p>
                          <p className="text-xs text-muted-foreground">{wo.asset?.make || ''} {wo.asset?.model || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{wo.type}</Badge></TableCell>
                      <TableCell><Badge variant={getStatusColor(wo.status) as any}>{wo.status.replace('_', ' ')}</Badge></TableCell>
                      <TableCell><Badge variant={getPriorityColor(wo.priority) as any}>{getPriorityLabel(wo.priority)}</Badge></TableCell>
                      <TableCell>{wo.technician ? `${wo.technician.first_name} ${wo.technician.last_name}` : 'Unassigned'}</TableCell>
                      <TableCell className={wo.due_date && new Date(wo.due_date) < new Date() && !['COMPLETED', 'CANCELLED'].includes(wo.status) ? 'text-destructive' : ''}>
                        {wo.due_date ? formatDate(wo.due_date) : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(wo.created_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-accent transition-colors">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/maintenance/${wo.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/maintenance/${wo.id}`}>Edit</Link>
                            </DropdownMenuItem>
                            {wo.status === 'OPEN' && (
                              <DropdownMenuItem onClick={() => handleStart(wo.id)}>
                                <Wrench className="h-4 w-4 mr-2" />
                                Start Work
                              </DropdownMenuItem>
                            )}
                            {wo.status === 'IN_PROGRESS' && (
                              <DropdownMenuItem onClick={() => handleComplete(wo.id)}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Complete
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Add Note
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
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data?.pagination.total || 0)} of {data?.pagination.total || 0} work orders
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

import { Search, Wrench, ChevronLeft, ChevronRight, MoreHorizontal, AlertTriangle, CheckCircle2 } from 'lucide-react';