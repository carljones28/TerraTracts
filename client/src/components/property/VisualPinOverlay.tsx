import React, { useState } from 'react';
import { MapPin, X, Edit, Trash2 } from 'lucide-react';
import { VisualPin, UpdateVisualPinInput } from '@/hooks/use-visual-pins';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export interface VisualPinOverlayProps {
  pins: VisualPin[];
  currentImageIndex: number;
  containerWidth: number;
  containerHeight: number;
  isEditable: boolean;
  isPinMode: boolean;
  onPinAdd?: (x: number, y: number) => void;
  onPinUpdate?: (id: number, data: UpdateVisualPinInput) => void;
  onPinDelete?: (id: number) => void;
}

// Array of predefined pin colors
const PIN_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

const VisualPinOverlay: React.FC<VisualPinOverlayProps> = ({
  pins,
  currentImageIndex,
  containerWidth,
  containerHeight,
  isEditable,
  isPinMode,
  onPinAdd,
  onPinUpdate,
  onPinDelete,
}) => {
  const [selectedPin, setSelectedPin] = useState<VisualPin | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    label: string;
    note: string;
    pinColor: string;
  }>({
    label: '',
    note: '',
    pinColor: PIN_COLORS[0],
  });

  // Filter pins for the current image
  const visiblePins = pins.filter(pin => pin.imageIndex === currentImageIndex);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPinMode || !isEditable || !onPinAdd) return;

    // Get click coordinates relative to the container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / containerWidth);
    const y = ((e.clientY - rect.top) / containerHeight);

    // Add a new pin at the clicked position (using relative coordinates 0-1)
    onPinAdd(x, y);
  };

  const handlePinClick = (e: React.MouseEvent, pin: VisualPin) => {
    e.stopPropagation(); // Prevent container click
    if (isEditable) {
      setSelectedPin(pin);
      setEditForm({
        label: pin.label || '',
        note: pin.note || '',
        pinColor: pin.pinColor || PIN_COLORS[0],
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleSavePin = () => {
    if (selectedPin && onPinUpdate) {
      onPinUpdate(selectedPin.id, {
        label: editForm.label || null,
        note: editForm.note || null,
        pinColor: editForm.pinColor,
      });
      setIsEditDialogOpen(false);
    }
  };

  const handleDeletePin = () => {
    if (selectedPin && onPinDelete) {
      onPinDelete(selectedPin.id);
      setIsEditDialogOpen(false);
    }
  };

  return (
    <>
      <div 
        className={`absolute inset-0 ${isPinMode ? 'cursor-crosshair' : ''}`} 
        onClick={handleContainerClick}
      >
        {visiblePins.map((pin) => (
          <div
            key={pin.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{
              left: `${pin.xPosition * 100}%`,
              top: `${pin.yPosition * 100}%`,
              zIndex: 5,
            }}
            onClick={(e) => handlePinClick(e, pin)}
          >
            <div className="relative">
              <MapPin 
                size={28} 
                className="cursor-pointer hover:scale-125 transition-transform" 
                fill={pin.pinColor || PIN_COLORS[0]} 
                color="white" 
                strokeWidth={2} 
              />
              
              {pin.label && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white text-sm px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  {pin.label}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pin Details</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={editForm.label}
                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                placeholder="Add a short label (optional)"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={editForm.note}
                onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                placeholder="Add more detailed notes (optional)"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Pin Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PIN_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full ${editForm.pinColor === color ? 'ring-2 ring-black ring-offset-2' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditForm({ ...editForm, pinColor: color })}
                    aria-label={`Select ${color} pin color`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeletePin}
              className="flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSavePin}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VisualPinOverlay;