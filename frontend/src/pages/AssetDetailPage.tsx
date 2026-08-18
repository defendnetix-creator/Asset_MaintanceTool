// frontend/src/pages/AssetDetailPage.tsx
// Asset detail page with tabs

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Edit, Trash2, Box, User, MapPin, Tag, FileText, 
  Image, History, Settings, Plus, Download, Loader2
} from 'lucide-react';
import { useAsset, useUpdateAsset, useDeleteAsset } from '../api/assets';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { cn, formatDate, getStatusColor, formatCurrency, formatDateTime } from '../utils/helpers';
import { useToast } from '../components/ui/useToast';
import { useAuth } from '../hooks/useAuth';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/DropdownMenu';

const statusOptions = [
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_REPAIR', label: 'In Repair' },
  { value: 'ON_LOAN', label: 'On Loan' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'DISPOSED', label: 'Disposed' },
];

const conditionOptions = [
  'New', 'Excellent', 'Good', 'Fair', 'Poor', 'Damaged',
];

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const { data: asset, isLoading, error, refetch } = useAsset(id!);
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const handleSave = async () => {
    try {
      await updateAsset.mutateAsync({ id: id!, data: editForm });
      toast.success('Asset updated successfully');
      setIsEditing(false);
      refetch();
    } catch (err) {
      toast.error('Failed to update asset');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this asset? This cannot be undone.')) return;
    try {
      await deleteAsset.mutateAsync(id!);
      toast.success('Asset deleted');
      navigate('/assets');
    } catch (err) {
      toast.error('Failed to delete asset');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-8 w-24 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="card p-12 text-center">
        <Box className="h-12 w-12 text-muted-foreground/50 mx-auto" />
        <h3 className="mt-4 text-lg font-medium">Asset not found</h3>
        <Button onClick={() => navigate('/assets')} className="mt-4">Back to Assets</Button>
      </div>
    );
  }

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN' || user?.role === 'IT_ASSET_MANAGER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <a href="/assets" className="hover:text-foreground">Assets</a>
            <span>/</span>
            <span className="text-foreground font-medium">{asset.asset_tag}</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{asset.asset_tag}</h1>
            <Badge variant={getStatusColor(asset.status) as any}>{asset.status.replace('_', ' ')}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{asset.make || ''} {asset.model || ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          )}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={`/assets/${asset.id}`} download>Export</a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Asset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Serial Number</p>
                <p className="text-xl font-bold mt-1">{asset.serial_number || '—'}</p>
              </div>
              <Box className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p className="text-xl font-bold mt-1">{asset.category?.name || '—'}</p>
              </div>
              <Tag className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-xl font-bold mt-1">{asset.location?.name || asset.site?.name || '—'}</p>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Custodian</p>
                <p className="text-xl font-bold mt-1">
                  {asset.custodian_user ? `${asset.custodian_user.first_name} ${asset.custodian_user.last_name}` : 'Unassigned'}
                </p>
              </div>
              <User className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="custom">Custom Fields</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Asset Tag</label>
                    <p className="font-mono font-medium">{asset.asset_tag}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Serial Number</label>
                    <p>{asset.serial_number || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Make</label>
                    <p>{asset.make || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Model</label>
                    <p>{asset.model || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Category</label>
                    <p>{asset.category?.name || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <Badge variant={getStatusColor(asset.status) as any}>{asset.status.replace('_', ' ')}</Badge>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Condition</label>
                    <p>{asset.condition || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">QR Code</label>
                    <p className="font-mono text-xs">{asset.qr_code_data || 'Not generated'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Location & Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Site</label>
                    <p>{asset.site?.name || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Location</label>
                    <p>{asset.location?.name || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Department</label>
                    <p>{asset.department?.name || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Custodian</label>
                    <p>
                      {asset.custodian_user ? (
                        <>
                          {asset.custodian_user.first_name} {asset.custodian_user.last_name}
                          <br />
                          <span className="text-sm text-muted-foreground">{asset.custodian_user.email}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Custodian Group</label>
                    <p>{asset.custodian_group?.name || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Purchase Date</label>
                    <p>{asset.purchase_date ? formatDate(asset.purchase_date) : '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Purchase Cost</label>
                    <p>{asset.purchase_cost ? formatCurrency(asset.purchase_cost, asset.currency) : '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Currency</label>
                    <p>{asset.currency}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Warranty Expires</label>
                    <p className={asset.warranty_expires && new Date(asset.warranty_expires) < new Date() ? 'text-destructive' : ''}>
                      {asset.warranty_expires ? formatDate(asset.warranty_expires) : '—'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Vendor</label>
                    <p>{asset.vendor?.name || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Tags
                  {canEdit && (
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tag
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {asset.tags?.map(tag => (
                    <Badge key={tag.id} variant="outline">{tag.tag}</Badge>
                  ))}
                  {!asset.tags?.length && <p className="text-muted-foreground text-sm">No tags</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Full Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-muted-foreground">ID</dt><dd className="font-mono">{asset.id}</dd></div>
                <div><dt className="text-muted-foreground">Normalized Tag</dt><dd className="font-mono">{asset.normalized_tag}</dd></div>
                <div><dt className="text-muted-foreground">Barcode</dt><dd className="font-mono">{asset.barcode_data || '—'}</dd></div>
                <div><dt className="text-muted-foreground">Created By</dt><dd>{asset.created_by?.first_name} {asset.created_by?.last_name}</dd></div>
                <div><dt className="text-muted-foreground">Created At</dt><dd>{formatDateTime(asset.created_at)}</dd></div>
                <div><dt className="text-muted-foreground">Updated By</dt><dd>{asset.updated_by?.first_name} {asset.updated_by?.last_name || ''}</dd></div>
                <div><dt className="text-muted-foreground">Updated At</dt><dd>{asset.updated_at ? formatDateTime(asset.updated_at) : '—'}</dd></div>
                <div><dt className="text-muted-foreground">Deleted At</dt><dd>{asset.deleted_at ? formatDateTime(asset.deleted_at) : '—'}</dd></div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Images
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {asset.images?.length ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {asset.images.map(image => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-video rounded-lg bg-muted overflow-hidden">
                        <img src={image.url} alt={image.caption || asset.asset_tag} className="w-full h-full object-cover" />
                        {image.is_primary && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="default">Primary</Badge>
                          </div>
                        )}
                      </div>
                      {image.caption && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">{image.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No images uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Documents
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {asset.documents?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {asset.documents.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.filename}</TableCell>
                        <TableCell><Badge variant="outline">{doc.mime_type}</Badge></TableCell>
                        <TableCell>{formatFileSize(doc.size)}</TableCell>
                        <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Performed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asset.events?.map(event => (
                    <TableRow key={event.id}>
                      <TableCell>{formatDateTime(event.occurred_at)}</TableCell>
                      <TableCell><Badge variant="outline">{event.event_type.replace('_', ' ')}</Badge></TableCell>
                      <TableCell>{event.description || '—'}</TableCell>
                      <TableCell>{event.performed_by?.first_name} {event.performed_by?.last_name}</TableCell>
                    </TableRow>
                  ))}
                  {!asset.events?.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No history available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Fields Tab */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Custom Fields
                {canEdit && (
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {asset.custom_fields?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {asset.custom_fields.map(cf => (
                      <TableRow key={cf.id}>
                        <TableCell className="font-medium">{cf.custom_field?.label || cf.name}</TableCell>
                        <TableCell><Badge variant="outline">{cf.custom_field?.type}</Badge></TableCell>
                        <TableCell>
                          {cf.value_text ?? cf.value_number ?? cf.value_boolean?.toString() ?? cf.value_date ? formatDate(cf.value_date) : cf.value_json ? JSON.stringify(cf.value_json) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No custom fields configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add missing imports
import { MoreHorizontal } from 'lucide-react';
import { formatFileSize } from '../utils/helpers';