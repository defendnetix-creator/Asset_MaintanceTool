// frontend/src/pages/AdminPage.tsx
// Admin page for tenant settings

import { useState } from 'react';
import { 
  Shield, 
  Loader2, 
} from 'lucide-react';
import { 
  useTenantSettings, useBranding, useSubscription, 
  useAuditLog, useUpdateTenantSettings, useUpdateBranding, useVerifyAuditLog
} from '../api/admin';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Switch } from '../components/ui/Switch';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { cn, formatDate, formatDateTime } from '../utils/helpers';
import { useToast } from '../components/ui/useToast';
import { useAuth } from '../hooks/useAuth';

const ssoProviderOptions = [
  { value: '', label: 'None' },
  { value: 'azure-ad', label: 'Azure AD' },
  { value: 'okta', label: 'Okta' },
  { value: 'google', label: 'Google Workspace' },
  { value: 'custom', label: 'Custom SAML/OIDC' },
];

const mfaMethodOptions = [
  { value: 'totp', label: 'TOTP (Authenticator App)' },
  { value: 'passkey', label: 'Passkeys (WebAuthn)' },
  { value: 'sms', label: 'SMS' },
];

export function AdminPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const { data: settings, refetch: refetchSettings } = useTenantSettings();
  const { data: branding, refetch: refetchBranding } = useBranding();
  const { data: subscription } = useSubscription();
  const { data: auditLogs } = useAuditLog({ page: 1, limit: 50 });
  const updateSettings = useUpdateTenantSettings();
  const updateBranding = useUpdateBranding();
  const verifyAuditLog = useVerifyAuditLog();

  const [settingsForm, setSettingsForm] = useState({
    asset_tag_prefix: settings?.asset_tag_prefix || 'AST',
    asset_tag_format: settings?.asset_tag_format || '{prefix}-{number:06d}',
    password_min_length: settings?.password_min_length || 12,
    password_require_upper: settings?.password_require_upper ?? true,
    password_require_lower: settings?.password_require_lower ?? true,
    password_require_number: settings?.password_require_number ?? true,
    password_require_symbol: settings?.password_require_symbol ?? true,
    password_max_age_days: settings?.password_max_age_days || 90,
    password_history_count: settings?.password_history_count || 5,
    mfa_required_for_admins: settings?.mfa_required_for_admins ?? true,
    mfa_required_for_all: settings?.mfa_required_for_all ?? false,
    mfa_methods: settings?.mfa_methods || ['totp', 'passkey'],
    session_absolute_timeout_minutes: settings?.session_absolute_timeout_minutes || 15,
    session_idle_timeout_minutes: settings?.session_idle_timeout_minutes || 5,
    max_concurrent_sessions: settings?.max_concurrent_sessions || 5,
    ip_allowlist_enabled: settings?.ip_allowlist_enabled ?? false,
    ip_allowlist_cidrs: settings?.ip_allowlist_cidrs?.join('\n') || '',
    sso_enabled: settings?.sso_enabled ?? false,
    sso_provider: settings?.sso_provider || '',
    sso_entity_id: settings?.sso_entity_id || '',
    sso_sso_url: settings?.sso_sso_url || '',
    sso_slo_url: settings?.sso_slo_url || '',
    sso_certificate: settings?.sso_certificate || '',
    sso_jit_provisioning: settings?.sso_jit_provisioning ?? true,
    audit_log_retention_days: settings?.audit_log_retention_days || 730,
    asset_history_retention_days: settings?.asset_history_retention_days || 2555,
    deleted_user_retention_days: settings?.deleted_user_retention_days || 30,
    export_retention_days: settings?.export_retention_days || 90,
    backup_retention_days: settings?.backup_retention_days || 30,
  });

  const [brandingForm, setBrandingForm] = useState({
    primary_color: branding?.primary_color || '#2563EB',
  });

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...settingsForm };
      if (payload.ip_allowlist_cidrs) {
        payload.ip_allowlist_cidrs = payload.ip_allowlist_cidrs.split('\n').filter(Boolean);
      }
      if (payload.mfa_methods && typeof payload.mfa_methods === 'string') {
        payload.mfa_methods = payload.mfa_methods.split(',').map(s => s.trim());
      }
      await updateSettings.mutateAsync(payload);
      toast.success('Settings saved successfully');
      refetchSettings();
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateBranding.mutateAsync(brandingForm);
      toast.success('Branding updated successfully');
      refetchBranding();
    } catch (err) {
      toast.error('Failed to update branding');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    setVerifyLoading(true);
    try {
      const result = await verifyAuditLog.mutateAsync();
      if (result.verified) {
        toast.success(`Audit log verified: ${result.checked} entries checked, no tampering detected`);
      } else {
        toast.error(`Tampering detected in ${result.tampered.length} entries`);
      }
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Check permissions
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';
  if (!isAdmin) {
    return (
      <div className="card p-12 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto" />
        <h3 className="mt-4 text-lg font-medium">Access Denied</h3>
        <p className="text-muted-foreground mt-1">You need admin permissions to access this page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">Manage tenant settings, branding, and audit logs</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="sso">SSO</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Tag Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Prefix" value={settingsForm.asset_tag_prefix} onChange={(e) => setSettingsForm({...settingsForm, asset_tag_prefix: e.target.value})} />
                <Input label="Format" value={settingsForm.asset_tag_format} onChange={(e) => setSettingsForm({...settingsForm, asset_tag_format: e.target.value})} />
              </div>
              <p className="text-sm text-muted-foreground">Example: {settingsForm.asset_tag_format.replace('{prefix}', settingsForm.asset_tag_prefix).replace('{number:06d}', '000001')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Absolute Timeout (min)" type="number" value={settingsForm.session_absolute_timeout_minutes} onChange={(e) => setSettingsForm({...settingsForm, session_absolute_timeout_minutes: parseInt(e.target.value)})} />
                <Input label="Idle Timeout (min)" type="number" value={settingsForm.session_idle_timeout_minutes} onChange={(e) => setSettingsForm({...settingsForm, session_idle_timeout_minutes: parseInt(e.target.value)})} />
                <Input label="Max Concurrent Sessions" type="number" value={settingsForm.max_concurrent_sessions} onChange={(e) => setSettingsForm({...settingsForm, max_concurrent_sessions: parseInt(e.target.value)})} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Audit Log (days)" type="number" value={settingsForm.audit_log_retention_days} onChange={(e) => setSettingsForm({...settingsForm, audit_log_retention_days: parseInt(e.target.value)})} />
                <Input label="Asset History (days)" type="number" value={settingsForm.asset_history_retention_days} onChange={(e) => setSettingsForm({...settingsForm, asset_history_retention_days: parseInt(e.target.value)})} />
                <Input label="Deleted User (days)" type="number" value={settingsForm.deleted_user_retention_days} onChange={(e) => setSettingsForm({...settingsForm, deleted_user_retention_days: parseInt(e.target.value)})} />
                <Input label="Export (days)" type="number" value={settingsForm.export_retention_days} onChange={(e) => setSettingsForm({...settingsForm, export_retention_days: parseInt(e.target.value)})} />
                <Input label="Backup (days)" type="number" value={settingsForm.backup_retention_days} onChange={(e) => setSettingsForm({...settingsForm, backup_retention_days: parseInt(e.target.value)})} />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSettingsSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ''}
            Save Settings
          </Button>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Min Length" type="number" value={settingsForm.password_min_length} onChange={(e) => setSettingsForm({...settingsForm, password_min_length: parseInt(e.target.value)})} />
                <Input label="Max Age (days)" type="number" value={settingsForm.password_max_age_days} onChange={(e) => setSettingsForm({...settingsForm, password_max_age_days: parseInt(e.target.value)})} />
                <Input label="History Count" type="number" value={settingsForm.password_history_count} onChange={(e) => setSettingsForm({...settingsForm, password_history_count: parseInt(e.target.value)})} />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={settingsForm.password_require_upper} onChange={(e) => setSettingsForm({...settingsForm, password_require_upper: e.target.checked})} className="h-4 w-4" />
                  <span>Require Uppercase</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={settingsForm.password_require_lower} onChange={(e) => setSettingsForm({...settingsForm, password_require_lower: e.target.checked})} className="h-4 w-4" />
                  <span>Require Lowercase</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={settingsForm.password_require_number} onChange={(e) => setSettingsForm({...settingsForm, password_require_number: e.target.checked})} className="h-4 w-4" />
                  <span>Require Number</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={settingsForm.password_require_symbol} onChange={(e) => setSettingsForm({...settingsForm, password_require_symbol: e.target.checked})} className="h-4 w-4" />
                  <span>Require Symbol</span>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Multi-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require MFA for Admins</p>
                  <p className="text-sm text-muted-foreground">Enforce MFA for all admin users</p>
                </div>
                <Switch checked={settingsForm.mfa_required_for_admins} onCheckedChange={(v) => setSettingsForm({...settingsForm, mfa_required_for_admins: v})} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require MFA for All Users</p>
                  <p className="text-sm text-muted-foreground">Enforce MFA for all users in the tenant</p>
                </div>
                <Switch checked={settingsForm.mfa_required_for_all} onCheckedChange={(v) => setSettingsForm({...settingsForm, mfa_required_for_all: v})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Allowed MFA Methods</label>
                <div className="flex flex-wrap gap-2">
                  {mfaMethodOptions.map(method => (
                    <label key={method.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={settingsForm.mfa_methods?.includes(method.value)} onChange={(e) => {
                        const methods = settingsForm.mfa_methods || [];
                        if (e.target.checked) {
                          setSettingsForm({...settingsForm, mfa_methods: [...methods, method.value]});
                        } else {
                          setSettingsForm({...settingsForm, mfa_methods: methods.filter((m: string) => m !== method.value)});
                        }
                      }} className="h-4 w-4" />
                      <span>{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>IP Allowlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable IP Allowlist</p>
                  <p className="text-sm text-muted-foreground">Restrict access to allowed IP ranges</p>
                </div>
                <Switch checked={settingsForm.ip_allowlist_enabled} onCheckedChange={(v) => setSettingsForm({...settingsForm, ip_allowlist_enabled: v})} />
              </div>
              {settingsForm.ip_allowlist_enabled && (
                <Input 
                  label="Allowed CIDRs (one per line)" 
                  value={settingsForm.ip_allowlist_cidrs} 
                  onChange={(e) => setSettingsForm({...settingsForm, ip_allowlist_cidrs: e.target.value})}
                  placeholder="192.168.1.0/24\n10.0.0.0/8"
                />
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSettingsSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ''}
            Save Security Settings
          </Button>
        </TabsContent>

        <TabsContent value="sso" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Single Sign-On (SSO)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable SSO</p>
                  <p className="text-sm text-muted-foreground">Allow users to sign in via identity provider</p>
                </div>
                <Switch checked={settingsForm.sso_enabled} onCheckedChange={(v) => setSettingsForm({...settingsForm, sso_enabled: v})} />
              </div>
              {settingsForm.sso_enabled && (
                <div className="space-y-4">
                  <Select value={settingsForm.sso_provider} onValueChange={(v) => setSettingsForm({...settingsForm, sso_provider: v})} options={ssoProviderOptions} placeholder="Select Provider" />
                  <Input label="Entity ID" value={settingsForm.sso_entity_id} onChange={(e) => setSettingsForm({...settingsForm, sso_entity_id: e.target.value})} />
                  <Input label="SSO URL" value={settingsForm.sso_sso_url} onChange={(e) => setSettingsForm({...settingsForm, sso_sso_url: e.target.value})} />
                  <Input label="SLO URL" value={settingsForm.sso_slo_url} onChange={(e) => setSettingsForm({...settingsForm, sso_slo_url: e.target.value})} />
                  <Input label="Certificate" value={settingsForm.sso_certificate} onChange={(e) => setSettingsForm({...settingsForm, sso_certificate: e.target.value})} />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Just-in-Time Provisioning</p>
                      <p className="text-sm text-muted-foreground">Automatically create users on first login</p>
                    </div>
                    <Switch checked={settingsForm.sso_jit_provisioning} onCheckedChange={(v) => setSettingsForm({...settingsForm, sso_jit_provisioning: v})} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSettingsSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ''}
            Save SSO Settings
          </Button>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Primary Color" type="color" value={brandingForm.primary_color} onChange={(e) => setBrandingForm({...brandingForm, primary_color: e.target.value})} />
                <div className="flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-lg border', brandingForm.primary_color)} />
                  <span>Preview</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Logo (Light)" placeholder="URL or base64" />
                <Input label="Logo (Dark)" placeholder="URL or base64" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Favicon" placeholder="URL" />
                <Input label="Login Background" placeholder="URL" />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleBrandingSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ''}
            Save Branding
          </Button>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold capitalize">{subscription?.plan || 'free'}</p>
                <p className="text-sm text-muted-foreground mt-1">Status: {subscription?.status || 'active'}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Assets</span>
                    <span>{subscription?.assets_used || 0} / {subscription?.assets_limit || 1000}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Users</span>
                    <span>{subscription?.users_used || 0} / {subscription?.users_limit || 50}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Storage</span>
                    <span>{subscription?.storage_used_gb || 0} / {subscription?.storage_limit_gb || 10} GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Next billing: {subscription?.next_billing_date ? formatDate(subscription.next_billing_date) : 'N/A'}</p>
                <p className="text-sm text-muted-foreground mt-1">Cycle: {subscription?.billing_cycle || 'monthly'}</p>
                <Button variant="outline" className="mt-4">Manage Billing</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                {subscription?.payment_method ? (
                  <p>{subscription.payment_method.type} ending in {subscription.payment_method.last4}</p>
                ) : (
                  <p className="text-muted-foreground">No payment method on file</p>
                )}
                <Button variant="outline" className="mt-4">Update Payment</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit-log" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Audit Log</h2>
              <p className="text-muted-foreground">View and verify system audit trail</p>
            </div>
            <Button onClick={handleVerify} disabled={verifyLoading}>
              {verifyLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ''}
              Verify Integrity
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {auditLogs?.data?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.data.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDateTime(log.created_at)}</TableCell>
                        <TableCell>{log.user?.first_name} {log.user?.last_name}</TableCell>
                        <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                        <TableCell>{log.resource_type}: {log.resource_id || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{log.ip_address || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  No audit logs found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}