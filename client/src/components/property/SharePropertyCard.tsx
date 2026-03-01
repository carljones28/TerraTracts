import React, { useState, useEffect } from 'react';
import { Share2, Copy, X, Facebook, Twitter, Linkedin, Mail, CheckCircle2, QrCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import QRCode from 'qrcode';

interface SharePropertyCardProps {
  property: {
    id: number;
    title: string;
    price: number | string;
    location?: string;
    state: string;
    size: number;
    propertyType: string;
    images: string[];
  };
  isSidebarButton?: boolean;
  isDropdownItem?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const SharePropertyCard: React.FC<SharePropertyCardProps> = ({ property, isSidebarButton, isDropdownItem, isOpen, onClose }) => {
  const { copy, copied } = useCopyToClipboard();
  const [activeTab, setActiveTab] = useState<string>('social');
  const [showShareConfirmation, setShowShareConfirmation] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [qrCodeError, setQrCodeError] = useState(false);

  const baseUrl = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : 'https://terranova.replit.app';
  const propertyUrl = `${baseUrl}/properties/${property.id}`;
  
  const shareText = `Check out this ${property.size} acre ${property.propertyType.toLowerCase()} property in ${property.location || property.state} - ${formatPrice(property.price)}`;
  
  const handleCopyLink = () => {
    copy(propertyUrl);
  };

  const handleSocialShare = (platform: string) => {
    let url = '';
    if (platform === 'facebook') url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`;
    else if (platform === 'twitter') url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(propertyUrl)}`;
    else if (platform === 'linkedin') url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(propertyUrl)}`;
    else if (platform === 'email') url = `mailto:?subject=${encodeURIComponent(`Property Listing: ${property.title}`)}&body=${encodeURIComponent(`${shareText}\n\nView the property: ${propertyUrl}`)}`;

    if (url) {
      if (platform === 'email') window.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
      
      setShowShareConfirmation(platform);
      setTimeout(() => setShowShareConfirmation(null), 2000);
    }
  };

  useEffect(() => {
    if (activeTab === 'link' && !qrCodeUrl && !qrCodeLoading && !qrCodeError) {
      setQrCodeLoading(true);
      QRCode.toDataURL(propertyUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 200,
        color: { dark: '#000000', light: '#FFFFFF' }
      })
      .then(url => {
        setQrCodeUrl(url);
        setQrCodeLoading(false);
      })
      .catch(err => {
        setQrCodeError(true);
        setQrCodeLoading(false);
      });
    }
  }, [activeTab, propertyUrl, qrCodeUrl, qrCodeLoading, qrCodeError]);

  const modalContent = (
    <div className="p-4">
      <div className="mb-6 border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={property.images && property.images.length > 0 ? property.images[0] : 'https://via.placeholder.com/800x600?text=No+Image'}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-4 left-4 text-white font-bold text-2xl">
            {formatPrice(property.price)}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-1 text-lg mb-1">{property.title}</h3>
          <p className="text-gray-500 text-sm mb-3">{property.location || property.state}</p>
          <div className="flex gap-2">
            <span className="text-xs bg-gray-100 text-gray-600 rounded-lg px-3 py-1.5 font-medium">
              {property.size} acres
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 rounded-lg px-3 py-1.5 font-medium capitalize">
              {property.propertyType}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="social" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100/50 p-1 rounded-xl h-12">
          <TabsTrigger value="social" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Social Media</TabsTrigger>
          <TabsTrigger value="link" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Link & QR Code</TabsTrigger>
        </TabsList>

        <TabsContent value="social">
          <div className="grid grid-cols-4 gap-4">
            {[
              { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
              { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'text-sky-500' },
              { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
              { id: 'email', name: 'Email', icon: Mail, color: 'text-gray-600' }
            ].map(platform => (
              <Button 
                key={platform.id}
                variant="outline" 
                className="flex flex-col items-center justify-center p-4 h-auto gap-3 relative hover:bg-gray-50 border-gray-200 rounded-xl"
                onClick={() => handleSocialShare(platform.id)}
              >
                <platform.icon className={`h-6 w-6 ${platform.color}`} />
                <span className="text-xs font-medium text-gray-700">{platform.name}</span>
                {showShareConfirmation === platform.id && (
                  <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center animate-in fade-in zoom-in duration-200">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                )}
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="link" className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">Property Link</p>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className={`h-8 rounded-lg ${copied ? "text-green-600 bg-green-50 border-green-200" : "bg-white"}`}
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 break-all leading-relaxed">
              {propertyUrl}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col items-center">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-3">
              {qrCodeLoading ? <Loader2 className="h-8 w-8 animate-spin text-gray-300" /> : <img src={qrCodeUrl || ''} className="w-32 h-32" alt="QR" />}
            </div>
            <p className="text-xs text-gray-500">Scan to view on mobile</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const trigger = isDropdownItem ? (
    <div className="flex items-center gap-2 text-sm w-full px-2 py-1.5 cursor-pointer hover:bg-gray-100 rounded-sm">
      <Share2 className="h-4 w-4" /> Share
    </div>
  ) : isSidebarButton ? (
    <Button variant="outline" className="h-12 w-full border-gray-200 hover:bg-gray-50 rounded-xl gap-2 text-gray-700 font-semibold shadow-sm">
      <Share2 className="h-4 w-4" /> Share
    </Button>
  ) : (
    <button className="p-2.5 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all text-gray-700">
      <Share2 className="w-5 h-5" />
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      {isOpen === undefined && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none gap-0 shadow-2xl z-[100]">
        <DialogHeader className="p-6 pb-2 relative">
          <DialogTitle className="text-center text-xl font-bold text-gray-900">Share This Property</DialogTitle>
          <DialogDescription className="text-center text-gray-500 mt-1">
            Share this property with friends, family, or clients
          </DialogDescription>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
};

export default SharePropertyCard;
