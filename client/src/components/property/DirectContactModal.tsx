import React, { useState } from 'react';
import { Send, Mail, MessageSquare, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface DirectContactModalProps {
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
  triggerButton?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export function DirectContactModal({ property, triggerButton, isOpen, onClose }: DirectContactModalProps) {
  const [activeTab, setActiveTab] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [emailForm, setEmailForm] = useState({
    recipientEmail: '',
    senderName: '',
    senderEmail: '',
    subject: `Property Inquiry: ${property.title}`,
    message: `Hi,

I'm interested in the ${property.size} acre ${property.propertyType.toLowerCase()} property in ${property.location || property.state} listed at ${formatPrice(property.price)}.

Could you please provide more information about this property?

Thank you,`
  });

  const [smsForm, setSmsForm] = useState({
    recipientPhone: '',
    senderName: '',
    senderPhone: '',
    message: `Hi, I'm interested in your ${property.size} acre ${property.propertyType.toLowerCase()} property in ${property.location || property.state} listed at ${formatPrice(property.price)}. Could you provide more details? Thanks!`
  });

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://terranova.replit.app';
  const propertyUrl = `${baseUrl}/properties/${property.id}`;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailForm.recipientEmail,
          from: emailForm.senderEmail,
          senderName: emailForm.senderName,
          subject: emailForm.subject,
          message: `${emailForm.message}\n\nProperty Link: ${propertyUrl}`,
          propertyId: property.id
        })
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose?.();
        }, 2000);
      } else {
        setError(result.message || 'Failed to send email');
      }
    } catch (err) {
      setError('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: smsForm.recipientPhone,
          from: smsForm.senderPhone,
          senderName: smsForm.senderName,
          message: `${smsForm.message}\n\nView property: ${propertyUrl}`,
          propertyId: property.id
        })
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose?.();
        }, 2000);
      } else {
        setError(result.message || 'Failed to send SMS');
      }
    } catch (err) {
      setError('Failed to send SMS. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="text-center flex items-center justify-center gap-2">
          <Send className="h-5 w-5" />
          Contact About Property
        </DialogTitle>
        <DialogDescription className="text-center text-sm text-muted-foreground">
          Send email or SMS directly about this property
        </DialogDescription>
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </DialogHeader>

      <div className="p-4">
        {/* Property Preview */}
        <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="relative h-32 overflow-hidden">
            <img 
              src={property.images && property.images.length > 0 
                ? property.images[0] 
                : 'https://via.placeholder.com/800x400?text=No+Image+Available'}
              alt={property.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Image+Error';
              }}
            />
            <div className="absolute bottom-2 left-2 text-white font-semibold text-sm drop-shadow-md">
              {formatPrice(property.price)}
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{property.title}</h3>
            <p className="text-gray-500 text-xs">{property.location || property.state}</p>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Message sent successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-0">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="senderName" className="text-sm font-medium">Your Name</Label>
                  <Input
                    id="senderName"
                    type="text"
                    value={emailForm.senderName}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, senderName: e.target.value }))}
                    placeholder="John Doe"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="senderEmail" className="text-sm font-medium">Your Email</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={emailForm.senderEmail}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, senderEmail: e.target.value }))}
                    placeholder="john@email.com"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="recipientEmail" className="text-sm font-medium">Recipient Email</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={emailForm.recipientEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  placeholder="agent@email.com"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                <Input
                  id="subject"
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                <Textarea
                  id="message"
                  value={emailForm.message}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={6}
                  required
                  className="mt-1"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="sms" className="mt-0">
            <form onSubmit={handleSmsSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="senderNameSms" className="text-sm font-medium">Your Name</Label>
                  <Input
                    id="senderNameSms"
                    type="text"
                    value={smsForm.senderName}
                    onChange={(e) => setSmsForm(prev => ({ ...prev, senderName: e.target.value }))}
                    placeholder="John Doe"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="senderPhone" className="text-sm font-medium">Your Phone</Label>
                  <Input
                    id="senderPhone"
                    type="tel"
                    value={smsForm.senderPhone}
                    onChange={(e) => setSmsForm(prev => ({ ...prev, senderPhone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="recipientPhone" className="text-sm font-medium">Recipient Phone</Label>
                <Input
                  id="recipientPhone"
                  type="tel"
                  value={smsForm.recipientPhone}
                  onChange={(e) => setSmsForm(prev => ({ ...prev, recipientPhone: e.target.value }))}
                  placeholder="+1 (555) 987-6543"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="smsMessage" className="text-sm font-medium">Message</Label>
                <Textarea
                  id="smsMessage"
                  value={smsForm.message}
                  onChange={(e) => setSmsForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  maxLength={160}
                  required
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {smsForm.message.length}/160 characters
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending SMS...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send SMS
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </DialogContent>
  );

  // When controlled externally (isOpen prop provided), only render the modal without trigger
  if (isOpen !== undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        {modalContent}
      </Dialog>
    );
  }

  // Default trigger behavior
  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Contact
          </Button>
        )}
      </DialogTrigger>
      {modalContent}
    </Dialog>
  );
}