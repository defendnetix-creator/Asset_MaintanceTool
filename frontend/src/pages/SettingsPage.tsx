// frontend/src/pages/SettingsPage.tsx
// Settings page

import { useState } from 'react';
import { 
  User, Bell, Shield, Palette, Globe, Database, 
  Save, Loader2, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Switch } from '../components/ui/Switch';
import { cn } from '../utils/helpers';
import { useToast } from '../components/ui/useToast';

const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

const dateFormatOptions = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (UK/EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

const timeFormatOptions = [
  { value: '12h', label: '12 Hour (AM/PM)' },
  { value: '24h', label: '24 Hour' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
];

export function SettingsPage() {
  const { user, updateProfile, changePassword } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    phone: user?.phone || '',
    title: user?.title || '',
    timezone: user?.timezone || 'UTC',
    dateFormat: user?.date_format || 'MM/DD/YYYY',
    timeFormat: user?.time_format || '12h',
    language: user?.language || 'en',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    sms: false,
    in_app: true,
    push: false,
    channels: {
      asset_overdue: true,
      maintenance_due: true,
      warranty_expiring: true,
      audit_discrepancy: true,
      agent_offline: true,
    },
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(profileForm);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 12) {
      toast.error('Password must be at least 12 characters');
      return;
    }
    setIsSaving(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password changed. Please log in again.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    if (key.startsWith('channels.')) {
      const channel = key.replace('channels.', '');
      setNotificationPrefs(prev => ({
        ...prev,
        channels: { ...prev.channels, [channel]: value },
      }));
    } else {
      setNotificationPrefs(prev => ({ ...prev, [key]: value }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="regional">Regional</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" value={profileForm.firstName} onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})} required />
                  <Input label="Last Name" value={profileForm.lastName} onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})} required />
                </div>
                <Input label="Email" value={user?.email || ''} disabled />
                <Input label="Phone" type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} />
                <Input label="Job Title" value={profileForm.title} onChange={(e) => setProfileForm({...profileForm, title: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={profileForm.timezone} onValueChange={(v) => setProfileForm({...profileForm, timezone: v})} options={timezoneOptions} placeholder="Timezone" />
                  <Select value={profileForm.language} onValueChange={(v) => setProfileForm({...profileForm, language: v})} options={languageOptions} placeholder="Language" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select value={profileForm.dateFormat} onValueChange={(v) => setProfileForm({...profileForm, dateFormat: v})} options={dateFormatOptions} placeholder="Date Format" />
                  <Select value={profileForm.timeFormat} onValueChange={(v) => setProfileForm({...profileForm, timeFormat: v})} options={timeFormatOptions} placeholder="Time Format" />
                </div>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ''}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <Input label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} required />
                <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} required />
                <p className="text-sm text-muted-foreground">Must be at least 12 characters</p>
                <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required />
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ''}
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Authenticator App</p>
                    <p className="text-sm text-muted-foreground">Use an authenticator app like Google Authenticator or Authy</p>
                  </div>
                  {user?.mfa_enabled ? (
                    <Badge variant="success">Enabled</Badge>
                  ) : (
                    <Button variant="outline">Enable</Button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Passkeys</p>
                    <p className="text-sm text-muted-foreground">Use Face ID, Touch ID, or Windows Hello</p>
                  </div>
                  <Button variant="outline">Add Passkey</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Backup Codes</p>
                    <p className="text-sm text-muted-foreground">One-time codes for account recovery</p>
                  </div>
                  <Button variant="outline">View Codes</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage your active login sessions across devices</p>
              <Button variant="outline" className="mt-4">View Sessions</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch checked={notificationPrefs.email} onCheckedChange={(v) => handleNotificationChange('email', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via text message</p>
                </div>
                <Switch checked={notificationPrefs.sms} onCheckedChange={(v) => handleNotificationChange('sms', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">In-App</p>
                  <p className="text-sm text-muted-foreground">Show notifications in the app</p>
                </div>
                <Switch checked={notificationPrefs.in_app} onCheckedChange={(v) => handleNotificationChange('in_app', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push</p>
                  <p className="text-sm text-muted-foreground">Receive push notifications on mobile</p>
                </div>
                <Switch checked={notificationPrefs.push} onCheckedChange={(v) => handleNotificationChange('push', v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notificationPrefs.channels).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">Receive alerts for this type</p>
                  </div>
                  <Switch checked={value} onCheckedChange={(v) => handleNotificationChange(`channels.${key}`, v)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <button className={cn('p-4 rounded-lg border-2 transition-colors', 'border-primary bg-primary/5')}>
                  <Sun className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Light</p>
                </button>
                <button className={cn('p-4 rounded-lg border-2 transition-colors', 'border-primary bg-primary/5')}>
                  <Monitor className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">System</p>
                </button>
                <button className={cn('p-4 rounded-lg border-2 transition-colors', 'border-primary bg-primary/5')}>
                  <Moon className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Dark</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Density</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="density" className="h-4 w-4" />
                  <span>Compact</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="density" className="h-4 w-4" checked />
                  <span>Comfortable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="density" className="h-4 w-4" />
                  <span>Spacious</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Date & Time Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select value={profileForm.dateFormat} onValueChange={(v) => setProfileForm({...profileForm, dateFormat: v})} options={dateFormatOptions} placeholder="Date Format" />
                <Select value={profileForm.timeFormat} onValueChange={(v) => setProfileForm({...profileForm, timeFormat: v})} options={timeFormatOptions} placeholder="Time Format" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select value={profileForm.timezone} onValueChange={(v) => setProfileForm({...profileForm, timezone: v})} options={timezoneOptions} placeholder="Timezone" />
                <Select value={profileForm.language} onValueChange={(v) => setProfileForm({...profileForm, language: v})} options={languageOptions} placeholder="Language" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Number & Currency Format</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Based on your locale settings</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Loader2 } from 'lucide-react';