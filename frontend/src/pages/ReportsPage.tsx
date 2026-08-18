// frontend/src/pages/ReportsPage.tsx
// Reports page

import { useState } from 'react';
import { 
  Download, BarChart2, FileText, Plus, Search, Filter, 
  ChevronLeft, ChevronRight, Loader2, MoreHorizontal, Calendar, Clock
} from 'lucide-react';
import { useReports, useRunPrebuiltReport, useDashboardWidgets } from '../api/reports';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { cn, formatDate } from '../utils/helpers';
import { useToast } from '../components/ui/useToast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/DropdownMenu';

const reportCategories = [
  { id: 'inventory', name: 'Asset Inventory' },
  { id: 'lifecycle', name: 'Lifecycle' },
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'audits', name: 'Audits' },
  { id: 'contracts', name: 'Contracts' },
  { id: 'warranty', name: 'Warranty & Compliance' },
  { id: 'financial', name: 'Financial' },
];

const formatOptions = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel' },
];

export function ReportsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('prebuilt');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [format, setFormat] = useState<'json' | 'csv' | 'xlsx'>('csv');

  const { data: reports } = useReports();
  const { data: dashboard } = useDashboardWidgets();
  const runPrebuiltReport = useRunPrebuiltReport();

  const prebuiltReports = [
    { id: 'assets-by-tag', name: 'Assets by Asset Tag', category: 'Asset Inventory', description: 'List assets filtered by tag' },
    { id: 'assets-by-category', name: 'Assets by Category', category: 'Asset Inventory', description: 'Assets grouped by category' },
    { id: 'assets-by-department', name: 'Assets by Department', category: 'Asset Inventory', description: 'Assets grouped by department' },
    { id: 'assets-by-site', name: 'Assets by Site/Location', category: 'Asset Inventory', description: 'Assets grouped by site/location' },
    { id: 'assets-by-custodian', name: 'Assets by Custodian', category: 'Asset Inventory', description: 'Assets grouped by assigned custodian' },
    { id: 'assets-by-status', name: 'Assets by Status', category: 'Asset Inventory', description: 'Assets grouped by status' },
    { id: 'assets-by-warranty', name: 'Assets by Warranty Expiry', category: 'Warranty & Compliance', description: 'Assets with expiring warranties' },
    { id: 'checkouts-by-person', name: 'Checkouts by Person', category: 'Lifecycle', description: 'Current checkouts grouped by person' },
    { id: 'checkouts-overdue', name: 'Overdue Checkouts', category: 'Lifecycle', description: 'Assets past due for return' },
    { id: 'checkouts-by-date', name: 'Checkouts by Date Range', category: 'Lifecycle', description: 'Checkouts within date range' },
    { id: 'maintenance-open', name: 'Open Work Orders', category: 'Maintenance', description: 'Open and in-progress work orders' },
    { id: 'maintenance-overdue', name: 'Overdue Maintenance', category: 'Maintenance', description: 'Overdue work orders' },
    { id: 'maintenance-costs', name: 'Maintenance Costs', category: 'Maintenance', description: 'Maintenance costs by asset/category' },
    { id: 'audit-summary', name: 'Audit Summary', category: 'Audits', description: 'Audit session summary with discrepancies' },
    { id: 'audit-discrepancies', name: 'Audit Discrepancies', category: 'Audits', description: 'Detailed discrepancy report' },
    { id: 'contracts-expiring', name: 'Expiring Contracts', category: 'Contracts', description: 'Contracts expiring within 90 days' },
    { id: 'warranty-expiring', name: 'Warranty Expiring', category: 'Warranty & Compliance', description: 'Assets with warranty expiring within 90 days' },
    { id: 'asset-value', name: 'Asset Value Report', category: 'Financial', description: 'Total asset value by category/department' },
    { id: 'depreciation', name: 'Depreciation Schedule', category: 'Financial', description: 'Asset depreciation over time' },
  ];

  const handleRunReport = async (reportId: string) => {
    setSelectedReport(reportId);
    try {
      const data = await runPrebuiltReport.mutateAsync({ 
        id: reportId, 
        data: { format } 
      });
      
      if (format === 'csv') {
        // Handle CSV download
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportId}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      toast.success('Report generated successfully');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setSelectedReport(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate and manage reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={format} onValueChange={(v) => setFormat(v as any)} options={formatOptions} placeholder="Format" className="w-36" />
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Custom Report
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboard?.kpis?.slice(0, 4).map((kpi, index) => (
          <Card key={kpi.label}>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
              <p className="text-3xl font-bold mt-1">{kpi.value?.toLocaleString() || 0}</p>
              <p className={cn('text-xs mt-1 flex items-center gap-1', kpi.color === 'green' ? 'text-green-600' : kpi.color === 'red' ? 'text-red-600' : kpi.color === 'amber' ? 'text-amber-600' : 'text-blue-600')}>
                <TrendingUp className="h-3 w-3" />
                {kpi.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="prebuilt">Prebuilt Reports ({prebuiltReports.length})</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports ({reports?.pagination?.total || 0})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="prebuilt" className="space-y-4">
          {reportCategories.map(category => (
            <Card key={category.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg capitalize">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {prebuiltReports
                    .filter(r => r.category === category.name)
                    .map(report => (
                      <div key={report.id} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{report.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                          </div>
                          <Badge variant="outline">{report.category}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                          <Select value={format} onValueChange={(v) => setFormat(v as any)} options={formatOptions} placeholder="Format" className="w-28" />
                          <Button 
                            size="sm" 
                            onClick={() => handleRunReport(report.id)} 
                            disabled={selectedReport === report.id}
                            className="flex-1"
                          >
                            {selectedReport === report.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                            ) : 'Run'}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {reports?.data?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.data.map(report => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell className="text-muted-foreground">{report.description || '—'}</TableCell>
                        <TableCell><Badge variant="outline">{report.type}</Badge></TableCell>
                        <TableCell>{report.last_run ? formatDateTime(report.last_run) : 'Never'}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded hover:bg-accent"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Run Report</DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Duplicate</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No custom reports yet</p>
                  <Button className="mt-4" variant="outline"><Plus className="h-4 w-4 mr-2" />Create Custom Report</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled reports yet</p>
                <Button className="mt-4" variant="outline"><Plus className="h-4 w-4 mr-2" />Schedule Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { TrendingUp, MoreHorizontal, Loader2 } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';