// frontend/src/pages/ReportsPage.tsx
// Reports page

import { useState } from 'react';
import { 
  FileText, Plus, Calendar, TrendingUp, MoreHorizontal
} from 'lucide-react';
import { useReports, useRunPrebuiltReport, useDashboardWidgets } from '../api/reports';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { cn, formatDateTime } from '../utils/helpers';
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
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('prebuilt');
  const [format, setFormat] = useState<'json' | 'csv' | 'xlsx'>('csv');

  // KPI cards config (reused from Dashboard)
  const kpiCards = [
    { 
      label: 'Total Assets', 
      icon: FileText, 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      trendIcon: TrendingUp,
      trendColor: 'text-green-600',
    },
    { 
      label: 'Assigned', 
      icon: FileText, 
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      trendIcon: TrendingUp,
      trendColor: 'text-amber-600',
    },
    { 
      label: 'In Repair', 
      icon: FileText, 
      color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      trendIcon: TrendingUp,
      trendColor: 'text-red-600',
    },
    { 
      label: 'Overdue Checkouts', 
      icon: FileText, 
      color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      trendIcon: TrendingUp,
      trendColor: 'text-red-600',
    },
  ];

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
        {dashboard?.kpis?.slice(0, 4).map((kpi, index) => {
          const config = kpiCards[index];
          const Icon = config.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                    <p className="text-3xl font-bold mt-1">{kpi.value?.toLocaleString() || 0}</p>
                    <p className={cn('text-xs mt-1 flex items-center gap-1', config.trendColor)}>
                      <TrendingUp className="h-3 w-3" />
                      {kpi.trend}
                    </p>
                  </div>
                  <div className={cn('p-3 rounded-xl', config.color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
                            className="flex-1"
                          >
                            Run
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
                <div className="overflow-x-auto">
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
                </div>
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