// frontend/src/pages/UsersPage.tsx
// Users management page

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Plus, Search, Filter, Download, Users, 
  ChevronLeft, ChevronRight, Loader2, MoreHorizontal, Mail, Shield, Key, UserX
} from 'lucide-react';
import { useUsers, useInviteUser, useDeleteUser, useResetUserPassword, useResetUserMfa, useRevokeUserSessions } from '../api/users';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { cn, formatDate, getStatusColor } from '../utils/helpers';
import { useToast } from '../components/ui/useToast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/DropdownMenu';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'IT_ASSET_MANAGER', label: 'IT Asset Manager' },
  { value: 'FIELD_TECHNICIAN', label: 'Field Technician' },
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'AUDITOR', label: 'Auditor' },
  { value: 'READ_ONLY', label: 'Read Only' },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'INVITED', label: 'Invited' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', first_name: '', last_name: '', role: 'EMPLOYEE' });
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const status = searchParams.get('status') || '';

  const { data, isLoading, error, refetch } = useUsers({
    page,
    limit,
    search,
    role: role || undefined,
    status: status || undefined,
  });

  const inviteUser = useInviteUser();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetUserPassword();
  const resetMfa = useResetUserMfa();
  const revokeSessions = useRevokeUserSessions();

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

  const handleRoleChange = (value: string) => updateParams({ role: value, page: 1 });
  const handleStatusChange = (value: string) => updateParams({ status: value, page: 1 });
  const handlePageChange = (newPage: number) => updateParams({ page: newPage });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteUser.mutateAsync(inviteForm);
      toast.success('User invited successfully');
      setInviteDialogOpen(false);
      setInviteForm({ email: '', first_name: '', last_name: '', role: 'EMPLOYEE' });
      refetch();
    } catch (err) {
      toast.error('Failed to invite user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await deleteUser.mutateAsync(id);
      toast.success('User deleted');
      refetch();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleResetPassword = async (id: string) => {
    const newPassword = prompt('Enter new password (min 12 chars):');
    if (!newPassword || newPassword.length < 12) {
      toast.error('Password must be at least 12 characters');
      return;
    }
    try {
      await resetPassword.mutateAsync({ id, data: { new_password: newPassword, send_email: true } });
      toast.success('Password reset email sent');
    } catch (err) {
      toast.error('Failed to reset password');
    }
  };

  const handleResetMfa = async (id: string) => {
    if (!confirm('Reset MFA for this user? They will need to re-enroll.')) return;
    try {
      const result = await resetMfa.mutateAsync(id);
      toast.success('MFA reset. Backup codes generated.');
      alert('Backup codes (save these!):\n' + result.backup_codes.join('\n'));
    } catch (err) {
      toast.error('Failed to reset MFA');
    }
  };

  const handleRevokeSessions = async (id: string) => {
    if (!confirm('Revoke all sessions for this user? They will be logged out.')) return;
    try {
      await revokeSessions.mutateAsync({ id, data: { exclude_current: true } });
      toast.success('Sessions revoked');
    } catch (err) {
      toast.error('Failed to revoke sessions');
    }
  };

  const openInviteDialog = () => setInviteDialogOpen(true);

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-destructive">Failed to load users</p>
        <button onClick={refetch} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Button onClick={openInviteDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input name="search" type="search" placeholder="Search users..." defaultValue={search} className="input pl-10" />
            </div>
            <Select value={role} onValueChange={handleRoleChange} options={roleOptions} placeholder="Filter by role" className="w-full sm:w-48" />
            <Select value={status} onValueChange={handleStatusChange} options={statusOptions} placeholder="Filter by status" className="w-full sm:w-48" />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Loading users...</p>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <h3 className="mt-4 text-lg font-medium">No users found</h3>
              <p className="text-muted-foreground mt-1">Invite your first team member</p>
              <Button onClick={openInviteDialog} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MFA</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.first_name} {user.last_name}</p>
                          {user.group && <p className="text-xs text-muted-foreground">{user.group.name}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${user.email}`} className="text-primary hover:underline">{user.email}</a>
                      </TableCell>
                      <TableCell><Badge variant="outline">{user.role.replace('_', ' ')}</Badge></TableCell>
                      <TableCell><Badge variant={getStatusColor(user.status) as any}>{user.status}</Badge></TableCell>
                      <TableCell>
                        {user.mfa_enabled ? (
                          <Badge variant="success"><Shield className="h-3 w-3 mr-1" />Enabled</Badge>
                        ) : (
                          <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-accent transition-colors">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/users/${user.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/users/${user.id}`}>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                              <Key className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetMfa(user.id)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Reset MFA
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRevokeSessions(user.id)}>
                              <UserX className="h-4 w-4 mr-2" />
                              Revoke Sessions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
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
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data?.pagination.total || 0)} of {data?.pagination.total || 0} users
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

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>Enter the user's details to send an invitation</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={inviteForm.first_name} onChange={(e) => setInviteForm({...inviteForm, first_name: e.target.value})} required />
                <Input label="Last Name" value={inviteForm.last_name} onChange={(e) => setInviteForm({...inviteForm, last_name: e.target.value})} required />
              </div>
              <Input label="Email" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})} required />
              <Select 
                value={inviteForm.role} 
                onValueChange={(v) => setInviteForm({...inviteForm, role: v})} 
                options={roleOptions.filter(r => r.value)} 
                placeholder="Select role"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inviteUser.isPending}>
                {inviteUser.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ''}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}