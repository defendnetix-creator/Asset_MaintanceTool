// frontend/src/pages/AuditDetailPage.tsx
// Audit detail page with scanning interface

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, CheckCircle2, Download, Loader2, ScanBarcode, 
  Camera, AlertTriangle, Check, X, Package, MapPin
} from 'lucide-react';
import { useAudit, useStartAudit, useCompleteAudit, useSubmitScan, useReconcileDiscrepancy } from '../api/audits';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { cn, formatDate, getStatusColor } from '../utils/helpers';
import { useToast } from '../components/ui/useToast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/DropdownMenu';

const itemStatusOptions = [
  { value: 'FOUND', label: 'Found' },
  { value: 'MISSING', label: 'Missing' },
  { value: 'MISMATCHED', label: 'Mismatched' },
  { value: 'DAMAGED', label: 'Damaged' },
];

export function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [scanning, setScanning] = useState(false);
  const [scanInput, setScanInput] = useState('');

  const { data: audit, isLoading, error, refetch } = useAudit(id!);
  const startAudit = useStartAudit();
  const completeAudit = useCompleteAudit();
  const submitScan = useSubmitScan();
  const reconcileDiscrepancy = useReconcileDiscrepancy();

  const handleStart = async () => {
    await startAudit.mutateAsync(id!);
    toast.success('Audit session started');
    refetch();
  };

  const handleComplete = async () => {
    await completeAudit.mutateAsync(id!);
    toast.success('Audit session completed');
    refetch();
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    
    try {
      await submitScan.mutateAsync({
        id: id!,
        data: { asset_tag: scanInput, status: 'FOUND' },
      });
      toast.success(`Scanned: ${scanInput}`);
      setScanInput('');
      refetch();
    } catch (err) {
      toast.error('Scan failed');
    }
  };

  const handleReconcile = async (discrepancyId: string, action: 'confirm_match' | 'mark_missing' | 'mark_damaged' | 'ignore') => {
    try {
      await reconcileDiscrepancy.mutateAsync({ id: id!, discrepancyId, data: { action } });
      toast.success('Discrepancy resolved');
      refetch();
    } catch (err) {
      toast.error('Failed to resolve discrepancy');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <Card><CardContent className="p-6"><div className="h-8 w-24 bg-muted rounded" /></CardContent></Card>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="card p-12 text-center">
        <h3 className="text-lg font-medium">Audit not found</h3>
        <Button onClick={() => navigate('/audits')} className="mt-4">Back to Audits</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <a href="/audits" className="hover:text-foreground">Audits</a>
            <span>/</span>
            <span className="text-foreground font-medium">{audit.name}</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{audit.name}</h1>
            <Badge variant={getStatusColor(audit.status) as any}>{audit.status.replace('_', ' ')}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">Scope: {audit.scope_type} - {audit.scope_name || 'Custom'}</p>
        </div>
        <div className="flex items-center gap-2">
          {audit.status === 'SCHEDULED' && (
            <Button onClick={handleStart} disabled={startAudit.isPending}>
              <Play className="h-4 w-4 mr-2" />
              Start Audit
            </Button>
          )}
          {audit.status === 'IN_PROGRESS' && (
            <Button onClick={handleComplete} variant="secondary" disabled={completeAudit.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}
          {audit.status === 'COMPLETED' && (
            <Button variant="outline" onClick={() => {}}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
            <p className="text-3xl font-bold mt-1">{audit.total_assets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Scanned</p>
            <p className="text-3xl font-bold text-primary mt-1">{audit.scanned_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Found</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{audit.found_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Missing</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{audit.missing_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Discrepancies</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">
              {audit.mismatched_count + audit.damaged_count}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {audit.total_assets > 0
                ? `${Math.round((audit.scanned_count / audit.total_assets) * 100)}%`
                : '0%'}
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${audit.total_assets > 0 ? (audit.scanned_count / audit.total_assets) * 100 : 0}%` }}
          />
        </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="items">Items ({audit.items?.length || 0})</TabsTrigger>
          <TabsTrigger value="discrepancies">Discrepancies ({audit.discrepancies?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Session Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="text-muted-foreground">Status</dt><dd><Badge variant={getStatusColor(audit.status) as any}>{audit.status.replace('_', ' ')}</Badge></dd></div>
                  <div><dt className="text-muted-foreground">Scope</dt><dd>{audit.scope_type}: {audit.scope_name || 'Custom'}</dd></div>
                  <div><dt className="text-muted-foreground">Lead Auditor</dt><dd>{audit.lead_auditor ? `${audit.lead_auditor.first_name} ${audit.lead_auditor.last_name}` : 'Unassigned'}</dd></div>
                  <div><dt className="text-muted-foreground">Auditors</dt><dd>{audit.auditors?.map(a => `${a.first_name} ${a.last_name}`).join(', ') || 'None'}</dd></div>
                  <div><dt className="text-muted-foreground">Started</dt><dd>{audit.start_at ? formatDateTime(audit.start_at) : 'Not started'}</dd></div>
                  <div><dt className="text-muted-foreground">Completed</dt><dd>{audit.completed_at ? formatDateTime(audit.completed_at) : 'Not completed'}</dd></div>
                  <div><dt className="text-muted-foreground">Due Date</dt><dd>{audit.due_at ? formatDate(audit.due_at) : '—'}</dd></div>
                  <div><dt className="text-muted-foreground">Timezone</dt><dd>{audit.timezone}</dd></div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Require Signature</span>
                  <Badge variant={audit.require_signature ? 'success' : 'secondary'}>
                    {audit.require_signature ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Require Photo</span>
                  <Badge variant={audit.require_photo ? 'success' : 'secondary'}>
                    {audit.require_photo ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Offline Enabled</span>
                  <Badge variant={audit.offline_enabled ? 'success' : 'secondary'}>
                    {audit.offline_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notify Assignees</span>
                  <Badge variant={audit.notify_assignees ? 'success' : 'secondary'}>
                    {audit.notify_assignees ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scanner" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Asset Scanner</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleScan} className="space-y-4">
                <div>
                  <label className="label">Scan Asset Tag / Barcode</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      placeholder="Enter or scan asset tag (e.g., LPT-0042)"
                      className="input text-lg"
                      autoFocus
                    />
                  </div>
                </div>
                <Button type="submit" size="lg" disabled={submitScan.isPending} className="w-full">
                  <ScanBarcode className="h-4 w-4 mr-2" />
                  {submitScan.isPending ? 'Scanning...' : 'Submit Scan'}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Or use camera: <Button variant="outline" size="sm"><Camera className="h-4 w-4 mr-2" />Open Camera</Button>
                </p>
              </form>

              <div className="border-t border-border pt-6">
                <h3 className="font-medium mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  {itemStatusOptions.map(status => (
                    <Button
                      variant="outline"
                      onClick={() => submitScan.mutate({ 
                        id: id!, 
                        data: { asset_tag: scanInput, status: status.value } 
                      })}
                      disabled={!scanInput.trim() || submitScan.isPending}
                    >
                      {status.value === 'FOUND' && <Check className="h-4 w-4 mr-2" />}
                      {status.value === 'MISSING' && <X className="h-4 w-4 mr-2" />}
                      {status.value === 'MISMATCHED' && <AlertTriangle className="h-4 w-4 mr-2" />}
                      {status.value === 'DAMAGED' && <Package className="h-4 w-4 mr-2" />}
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Audit Items
                <Badge variant="outline">{audit.items?.length || 0} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {audit.items?.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset Tag</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Expected Location</TableHead>
                        <TableHead>Scanned Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Scanned At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {audit.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono font-medium">{item.asset.asset_tag}</TableCell>
                          <TableCell>{item.asset.make || ''} {item.asset.model || ''}</TableCell>
                          <TableCell>{item.expected_location?.name || '—'}</TableCell>
                          <TableCell>{item.scanned_location?.name || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(item.status) as any}>{item.status}</Badge>
                          </TableCell>
                          <TableCell>{item.scanned_at ? formatDateTime(item.scanned_at) : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items in this audit session</p>
                  {audit.status === 'SCHEDULED' && <p className="text-sm">Start the audit to populate items</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discrepancies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Discrepancies
                <Badge variant="destructive">{audit.discrepancies?.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {audit.discrepancies?.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Expected</TableHead>
                        <TableHead>Found</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {audit.discrepancies.map(disc => (
                        <TableRow key={disc.id}>
                          <TableCell className="font-mono font-medium">{disc.asset.asset_tag}</TableCell>
                          <TableCell><Badge variant="outline">{disc.type}</Badge></TableCell>
                          <TableCell>{disc.expected_location?.name || '—'}</TableCell>
                          <TableCell>{disc.found_location?.name || '—'}</TableCell>
                          <TableCell><Badge variant={disc.severity === 'HIGH' ? 'destructive' : disc.severity === 'MEDIUM' ? 'warning' : 'secondary'}>{disc.severity}</Badge></TableCell>
                          <TableCell><Badge variant={getStatusColor(disc.status) as any}>{disc.status}</Badge></TableCell>
                          <TableCell>
                            {disc.status === 'OPEN' && (
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleReconcile(disc.id, 'confirm_match')}>Confirm Match</Button>
                                <Button variant="outline" size="sm" onClick={() => handleReconcile(disc.id, 'update_location')}>Update Location</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleReconcile(disc.id, 'ignore')}>Ignore</Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                  <p>No discrepancies found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}