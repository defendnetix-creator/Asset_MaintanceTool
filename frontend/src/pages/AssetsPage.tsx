// frontend/src/pages/AssetsPage.tsx
// Assets list page with table view

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Plus, Search, Filter, Download, Upload, Columns, 
  ChevronLeft, ChevronRight, Loader2, MoreHorizontal
} from 'lucide-react';
import { useAssets, useDeleteAsset, useBulkAssetOperation, useExportAssets } from '../api/assets';
import { useAssets as useAssetsHook, useDeleteAsset as useDeleteAssetHook } from '../api/assets';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { cn, formatDate, getStatusColor, formatCurrency } from '../utils/helpers';
import { useToast } from '../components/ui/useToast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/DropdownMenu';
import { useAuth } from '../hooks/useAuth';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_REPAIR', label: 'In Repair' },
  { value: 'ON_LOAN', label: 'On Loan' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'DISPOSED', label: 'Disposed' },
];

const sortOptions = [
  { value: 'created_at', label: 'Created Date' },
  { value: 'asset_tag', label: 'Asset Tag' },
  { value: 'make', label: 'Make' },
  { value: 'model', label: 'Model' },
  { value: 'status', label: 'Status' },
  { value: 'updated_at', label: 'Last Updated' },
];

export function AssetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'desc';
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const { data, isLoading, error, refetch } = useAssets({
    page,
    limit,
    sort,
    order,
    search,
    status: status || undefined,
  });

  const deleteAsset = useDeleteAsset();
  const bulkOperation = useBulkAssetOperation();
  const exportAssets = useExportAssets();

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

  const handleStatusChange = (value: string) => {
    updateParams({ status: value, page: 1 });
  };

  const handleSortChange = (field: string) => {
    const newOrder = sort === field && order === 'desc' ? 'asc' : 'desc';
    updateParams({ sort: field, order: newOrder });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(data?.data.map(a => a.id) || []);
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectAsset = (id: string) => {
    setSelectedAssets(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedAssets.length === 0) return;
    
    if (!confirm(`Delete ${selectedAssets.length} asset(s)? This cannot be undone.`)) return;

    const result = await bulkOperation.mutateAsync({
      action: 'delete',
      asset_ids: selectedAssets,
    });

    if (result.failed === 0) {
      toast.success(`Deleted ${result.processed} asset(s)`);
      setSelectedAssets([]);
      setSelectAll(false);
      refetch();
    } else {
      toast.error(`${result.failed} asset(s) failed to delete`);
    }
  };

  const handleExport = async () => {
    try {
      const response = await exportAssets.mutateAsync({ format: 'csv', status: status || undefined });
      // Handle blob download
      const blob = new Blob([response], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assets-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset? This cannot be undone.')) return;
    
    await deleteAsset.mutateAsync(id);
    toast.success('Asset deleted');
    refetch();
  };

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-destructive">Failed to load assets</p>
        <button onClick={refetch} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">Manage your asset inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/assets/new" className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="search"
                type="search"
                placeholder="Search assets, tags, serial numbers..."
                defaultValue={search}
                className="input pl-10"
              />
            </div>
            <Select
              value={status}
              onValueChange={handleStatusChange}
              options={statusOptions}
              placeholder="Filter by status"
              className="w-full sm:w-48"
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExport} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={handleBulkDelete} disabled={selectedAssets.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Delete Selected ({selectedAssets.length})
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Loading assets...</p>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="p-12 text-center">
              <Box className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <h3 className="mt-4 text-lg font-medium">No assets found</h3>
              <p className="text-muted-foreground mt-1">Get started by adding your first asset</p>
              <Link to="/assets/new" className="btn-primary mt-4 inline-flex">
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        aria-label="Select all assets"
                      />
                    </TableHead>
                    <TableHead onClick={() => handleSortChange('asset_tag')} className="cursor-pointer select-none">
                      Asset Tag {sort === 'asset_tag' && (order === 'asc' ? <ChevronUp /> : <ChevronDown />)}
                    </TableHead>
                    <TableHead onClick={() => handleSortChange('make')} className="cursor-pointer select-none">
                      Make {sort === 'make' && (order === 'asc' ? <ChevronUp /> : <ChevronDown />)}
                    </TableHead>
                    <TableHead onClick={() => handleSortChange('model')} className="cursor-pointer select-none">
                      Model {sort === 'model' && (order === 'asc' ? <ChevronUp /> : <ChevronDown />)}
                    </TableHead>
                    <TableHead onClick={() => handleSortChange('status')} className="cursor-pointer select-none hidden md:table-cell">
                      Status {sort === 'status' && (order === 'asc' ? <ChevronUp /> : <ChevronDown />)}
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead className="hidden lg:table-cell">Custodian</TableHead>
                    <TableHead onClick={() => handleSortChange('created_at')} className="cursor-pointer select-none">
                      Created {sort === 'created_at' && (order === 'asc' ? <ChevronUp /> : <ChevronDown />)}
                    </TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((asset) => (
                    <TableRow key={asset.id} data-state={selectedAssets.includes(asset.id) ? 'selected' : undefined}>
                      <TableCell className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={() => toggleSelectAsset(asset.id)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          aria-label={`Select asset ${asset.asset_tag}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-medium">{asset.asset_tag}</TableCell>
                      <TableCell>{asset.make || '—'}</TableCell>
                      <TableCell>{asset.model || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={getStatusColor(asset.status) as any}>{asset.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {asset.location?.name || asset.site?.name || '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {asset.custodian_user ? `${asset.custodian_user.first_name} ${asset.custodian_user.last_name}` : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(asset.created_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-accent transition-colors" aria-label={`Actions for ${asset.asset_tag}`}>
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/assets/${asset.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/assets/${asset.id}`}>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(asset.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border p-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data?.pagination.total || 0)} of {data?.pagination.total || 0} assets
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(page - 1)} 
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-sm">
                    Page {page} of {data?.pagination.total_pages || 1}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(page + 1)} 
                    disabled={page >= (data?.pagination.total_pages || 1)}
                  >
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

// Add ChevronUp import
import { ChevronUp } from 'lucide-react';