import React from 'react';
import { MapPin, PlusCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VisualPin } from '@/hooks/use-visual-pins';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface PinControlPanelProps {
  favoriteId?: number;
  pins: VisualPin[];
  isPinMode: boolean;
  isLoggedIn: boolean;
  isFavorited: boolean;
  setIsPinMode: (isPinMode: boolean) => void;
  onFavoriteToggle: () => void;
}

const PinControlPanel: React.FC<PinControlPanelProps> = ({
  favoriteId,
  pins,
  isPinMode,
  isLoggedIn,
  isFavorited,
  setIsPinMode,
  onFavoriteToggle,
}) => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <TooltipProvider>
        {!isLoggedIn ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled
                className="flex items-center"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Smart Bookmarking
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Log in to use Smart Bookmarking</p>
            </TooltipContent>
          </Tooltip>
        ) : !isFavorited ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onFavoriteToggle}
                className="flex items-center"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Enable Smart Bookmarking
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add to favorites to enable Smart Bookmarking</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant={isPinMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPinMode(!isPinMode)}
              className="flex items-center"
            >
              {isPinMode ? (
                <>
                  <MapPin className="h-4 w-4 mr-2" fill="currentColor" />
                  Exit Pin Mode
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Pin
                </>
              )}
            </Button>

            <Sheet>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={pins.length === 0}
                    >
                      <MapPin className="h-4 w-4" />
                      <span className="ml-1">{pins.length}</span>
                    </Button>
                  </SheetTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View all pins</p>
                </TooltipContent>
              </Tooltip>
              
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Your Visual Pins</SheetTitle>
                  <SheetDescription>
                    View and manage your saved pins for this property
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                  {pins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <MapPin className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        No pins created yet. Click "Add Pin" to start creating visual bookmarks.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pins.map((pin) => (
                        <div
                          key={pin.id}
                          className="flex items-start gap-3 p-3 rounded-lg border"
                        >
                          <MapPin 
                            className="h-5 w-5 mt-0.5 flex-shrink-0" 
                            fill={pin.pinColor || "#ef4444"} 
                            color="white"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium truncate">
                                {pin.label || `Pin on image ${pin.imageIndex + 1}`}
                              </h4>
                              <span className="text-xs text-muted-foreground ml-2">
                                Image {pin.imageIndex + 1}
                              </span>
                            </div>
                            {pin.note && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {pin.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Smart Bookmarking lets you add visual pins to specific locations on property images. 
                  Click "Add Pin" to start, then click on the image where you want to place a pin.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </TooltipProvider>
    </div>
  );
};

export default PinControlPanel;