import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Layers,
  Edit,
  Trash2,
  Save,
  X,
  Scissors,
  ChevronRight,
  MapPin,
  TreeDeciduous,
  Home,
  Droplets,
  Mountain,
  Wheat,
} from 'lucide-react';
import type { LandTract } from '@shared/schema';

interface TractManagementPanelProps {
  propertyId: number;
  selectedTract?: LandTract | null;
  onTractSelect?: (tract: LandTract | null) => void;
  isEditable?: boolean;
}

const TRACT_TYPE_INFO: Record<string, { label: string; icon: any; color: string }> = {
  primary: { label: 'Primary Tract', icon: Layers, color: '#3b82f6' },
  subdivision: { label: 'Subdivision', icon: ChevronRight, color: '#22c55e' },
  easement: { label: 'Easement', icon: MapPin, color: '#f59e0b' },
  buildable: { label: 'Buildable Area', icon: Home, color: '#10b981' },
  restricted: { label: 'Restricted', icon: X, color: '#ef4444' },
  wetland: { label: 'Wetland', icon: Droplets, color: '#06b6d4' },
  timber: { label: 'Timber', icon: TreeDeciduous, color: '#65a30d' },
  pasture: { label: 'Pasture', icon: Mountain, color: '#84cc16' },
  cropland: { label: 'Cropland', icon: Wheat, color: '#fbbf24' },
  custom: { label: 'Custom', icon: Edit, color: '#8b5cf6' },
};

export default function TractManagementPanel({
  propertyId,
  selectedTract,
  onTractSelect,
  isEditable = false,
}: TractManagementPanelProps) {
  const { toast } = useToast();
  const [editingTract, setEditingTract] = useState<LandTract | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [expandedTract, setExpandedTract] = useState<string>('');

  const { data: tracts = [], isLoading } = useQuery<LandTract[]>({
    queryKey: ['/api/properties', propertyId, 'tracts'],
    enabled: !!propertyId,
  });

  const updateTractMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LandTract> }) => {
      return apiRequest('PUT', `/api/tracts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', propertyId, 'tracts'] });
      setEditingTract(null);
      toast({ title: 'Tract updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update tract', description: String(error), variant: 'destructive' });
    },
  });

  const deleteTractMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/tracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', propertyId, 'tracts'] });
      setDeleteConfirmId(null);
      onTractSelect?.(null);
      toast({ title: 'Tract deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete tract', description: String(error), variant: 'destructive' });
    },
  });

  const handleSaveEdit = () => {
    if (!editingTract) return;
    
    updateTractMutation.mutate({
      id: editingTract.id,
      data: {
        name: editingTract.name,
        description: editingTract.description,
        tractType: editingTract.tractType,
        fillColor: editingTract.fillColor,
        strokeColor: editingTract.strokeColor,
        metadata: editingTract.metadata,
      },
    });
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteTractMutation.mutate(deleteConfirmId);
    }
  };

  const getTractTypeInfo = (type: string) => {
    return TRACT_TYPE_INFO[type] || TRACT_TYPE_INFO.custom;
  };

  const activeTracts = tracts.filter(t => t.isActive);
  const totalAcreage = activeTracts.reduce((sum, t) => sum + Number(t.acreage || 0), 0);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500" data-testid="tracts-loading">
        Loading tracts...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm" data-testid="tract-management-panel">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Land Tracts</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {activeTracts.length} tract{activeTracts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        {totalAcreage > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            Total mapped area: <span className="font-medium">{totalAcreage.toFixed(2)} acres</span>
          </div>
        )}
      </div>

      {activeTracts.length === 0 ? (
        <div className="p-6 text-center text-gray-500" data-testid="no-tracts-message">
          <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tracts defined yet</p>
          {isEditable && (
            <p className="text-xs mt-1">Use the map drawing tools to create boundary tracts</p>
          )}
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          value={expandedTract}
          onValueChange={setExpandedTract}
          className="divide-y"
        >
          {activeTracts.map((tract) => {
            const typeInfo = getTractTypeInfo(tract.tractType);
            const Icon = typeInfo.icon;
            const isSelected = selectedTract?.id === tract.id;

            return (
              <AccordionItem 
                key={tract.id} 
                value={String(tract.id)}
                className="border-0"
              >
                <AccordionTrigger
                  className={`px-4 py-3 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  onClick={() => onTractSelect?.(tract)}
                  data-testid={`tract-accordion-${tract.id}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: tract.fillColor || typeInfo.color }}
                    />
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">{tract.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <Icon className="h-3 w-3" />
                        <span>{typeInfo.label}</span>
                        {tract.acreage && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span>{Number(tract.acreage).toFixed(2)} ac</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 pt-2">
                    {tract.description && (
                      <p className="text-sm text-gray-600">{tract.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {tract.centroidLat && tract.centroidLng && (
                        <div>
                          <span className="text-gray-500">Center:</span>
                          <span className="ml-1">
                            {Number(tract.centroidLat).toFixed(4)}, {Number(tract.centroidLng).toFixed(4)}
                          </span>
                        </div>
                      )}
                      {tract.metadata && (
                        <>
                          {tract.metadata.zoning && (
                            <div>
                              <span className="text-gray-500">Zoning:</span>
                              <span className="ml-1">{tract.metadata.zoning}</span>
                            </div>
                          )}
                          {tract.metadata.soilType && (
                            <div>
                              <span className="text-gray-500">Soil:</span>
                              <span className="ml-1">{tract.metadata.soilType}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {isEditable && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setEditingTract(tract)}
                          data-testid={`button-edit-tract-${tract.id}`}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => setDeleteConfirmId(tract.id)}
                          data-testid={`button-delete-tract-${tract.id}`}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {editingTract && (
        <Dialog open={true} onOpenChange={() => setEditingTract(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Tract</DialogTitle>
              <DialogDescription>
                Update the details for this tract
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="tract-name">Name</Label>
                <Input
                  id="tract-name"
                  value={editingTract.name}
                  onChange={(e) => setEditingTract({ ...editingTract, name: e.target.value })}
                  placeholder="Tract name"
                  data-testid="input-edit-tract-name"
                />
              </div>
              <div>
                <Label htmlFor="tract-description">Description</Label>
                <Textarea
                  id="tract-description"
                  value={editingTract.description || ''}
                  onChange={(e) => setEditingTract({ ...editingTract, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                  data-testid="input-edit-tract-description"
                />
              </div>
              <div>
                <Label htmlFor="tract-type">Type</Label>
                <Select
                  value={editingTract.tractType}
                  onValueChange={(value) => setEditingTract({ ...editingTract, tractType: value as any })}
                >
                  <SelectTrigger id="tract-type" data-testid="select-edit-tract-type">
                    <SelectValue placeholder="Select tract type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRACT_TYPE_INFO).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: info.color }}
                          />
                          {info.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fill-color">Fill Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="fill-color"
                      value={editingTract.fillColor || '#3b82f6'}
                      onChange={(e) => setEditingTract({ ...editingTract, fillColor: e.target.value })}
                      className="w-10 h-10 rounded border cursor-pointer"
                      data-testid="input-edit-tract-fill-color"
                    />
                    <Input
                      value={editingTract.fillColor || '#3b82f6'}
                      onChange={(e) => setEditingTract({ ...editingTract, fillColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="stroke-color">Border Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="stroke-color"
                      value={editingTract.strokeColor || '#1d4ed8'}
                      onChange={(e) => setEditingTract({ ...editingTract, strokeColor: e.target.value })}
                      className="w-10 h-10 rounded border cursor-pointer"
                      data-testid="input-edit-tract-stroke-color"
                    />
                    <Input
                      value={editingTract.strokeColor || '#1d4ed8'}
                      onChange={(e) => setEditingTract({ ...editingTract, strokeColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingTract(null)}
                data-testid="button-cancel-edit-tract"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateTractMutation.isPending}
                data-testid="button-save-edit-tract"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateTractMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tract?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tract? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              data-testid="button-cancel-delete-tract"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTractMutation.isPending}
              data-testid="button-confirm-delete-tract"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteTractMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
