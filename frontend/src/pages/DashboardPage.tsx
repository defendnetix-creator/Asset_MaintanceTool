// frontend/src/pages/DashboardPage.tsx
// Dashboard page with KPI cards and charts

import { 
  Box, User, Wrench, Shield, TrendingUp, TrendingDown, 
  ClipboardCheck, BarChart2, AlertTriangle, Package
} from 'lucide-react';
import { useDashboardWidgets } from '../api/reports';
import { cn } from '../utils/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

// Recharts imports for charts
import {
  PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, LineChart, Line, ResponsiveContainer
} from 'recharts';

const kpiCards = [
  { 
    label: 'Total Assets', 
    icon: Box, 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    trendIcon: TrendingUp,
    trendColor: 'text-green-600',
  },
  { 
    label: 'Assigned', 
    icon: User, 
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    trendIcon: AlertTriangle,
    trendColor: 'text-amber-600',
  },
  { 
    label: 'In Repair', 
    icon: Wrench, 
    color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    trendIcon: AlertTriangle,
    trendColor: 'text-red-600',
  },
  { 
    label: 'Overdue Checkouts', 
    icon: ClipboardCheck, 
    color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    trendIcon: TrendingUp,
    trendColor: 'text-red-600',
  },
  { 
    label: 'Warranty Expiring (30d)', 
    icon: Shield, 
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    trendIcon: TrendingUp,
    trendColor: 'text-amber-600',
  },
  { 
    label: 'Open Work Orders', 
    icon: Wrench, 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    trendIcon: TrendingDown,
    trendColor: 'text-green-600',
  },
  { 
    label: 'Overdue Maintenance', 
    icon: AlertTriangle, 
    color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    trendIcon: TrendingUp,
    trendColor: 'text-red-600',
  },
  { 
    label: 'Audit Discrepancies', 
    icon: Package, 
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    trendIcon: TrendingDown,
    trendColor: 'text-green-600',
  },
];

export function DashboardPage() {
  const { data: dashboard, isLoading } = useDashboardWidgets();

  const kpis = dashboard?.kpis || [
    { label: 'Total Assets', value: 1247, trend: '+12 this month' },
    { label: 'Assigned', value: 892, trend: '12 overdue' },
    { label: 'In Repair', value: 23, trend: '3 critical' },
    { label: 'Overdue Checkouts', value: 8, trend: '+2' },
    { label: 'Warranty Expiring (30d)', value: 8, trend: 'Expiring soon' },
    { label: 'Open Work Orders', value: 45, trend: '-3' },
    { label: 'Overdue Maintenance', value: 12, trend: '+1' },
    { label: 'Audit Discrepancies', value: 3, trend: '0' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded mt-2" />
          </div>
          <div className="h-10 w-32 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="h-8 w-12 bg-muted rounded" />
              <div className="h-12 w-24 bg-muted rounded mt-4" />
              <div className="h-4 w-32 bg-muted rounded mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your asset portfolio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline">
            <BarChart2 className="h-4 w-4 mr-2" />
            Custom Report
          </button>
          <button className="btn-primary">
            <Package className="h-4 w-4 mr-2" />
            Add Asset
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {kpis.map((kpi, index) => {
          const config = kpiCards[index];
          const Icon = config.icon;
          const TrendIcon = config.trendIcon;
          return (
            <Card key={kpi.label} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{kpi.value.toLocaleString()}</p>
                    <p className={cn('text-xs mt-1 flex items-center gap-1', config.trendColor)}>
                      <TrendIcon className="h-3 w-3" />
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {dashboard?.charts?.assetsByStatus?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboard.charts.assetsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                      label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {/* {dashboard.charts.assetsByStatus.map((entry, index) => ( */}
                      {dashboard.charts.assetsByStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value.toLocaleString(), 'Assets']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assets by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {dashboard?.charts?.assetsByCategory?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.charts.assetsByCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Work Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {dashboard?.charts?.workOrdersByStatus?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboard.charts.workOrdersByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                      label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {/* {dashboard.charts.workOrdersByStatus.map((entry, index) => ( */}
                      {dashboard.charts.workOrdersByStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60 + 120}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value.toLocaleString(), 'Work Orders']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audit Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Trends (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {dashboard?.charts?.auditTrends?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboard.charts.auditTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="scanned" stroke="#3b82f6" strokeWidth={2} dot={false} name="Scanned" />
                    <Line type="monotone" dataKey="found" stroke="#22c55e" strokeWidth={2} dot={false} name="Found" />
                    <Line type="monotone" dataKey="missing" stroke="#ef4444" strokeWidth={2} dot={false} name="Missing" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">
              <Package className="h-4 w-4 mr-2" />
              Add Asset
            </button>
            <button className="btn-secondary">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Start Audit
            </button>
            <button className="btn-secondary">
              <BarChart2 className="h-4 w-4 mr-2" />
              Run Report
            </button>
            <button className="btn-secondary">
              <Wrench className="h-4 w-4 mr-2" />
              Create Work Order
            </button>
            <button className="btn-outline">
              <Shield className="h-4 w-4 mr-2" />
              Check Warranties
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}