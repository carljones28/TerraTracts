import React, { useState } from 'react';
import { Send, Mail, MessageSquare, X, CheckCircle2, AlertCircle, User } from 'lucide-react';
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
import { apiRequest } from '@/lib/queryClient';

interface DirectAgentContactModalProps {
  agent: {
    id: number;
    user?: {
      firstName: string;
      lastName: string;
      email?: string;
    };
    phoneNumber?: string;
    specialties?: string[];
    location?: string;
  };
  triggerButton?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export function DirectAgentContactModal({ agent, triggerButton, isOpen, onClose }: DirectAgentContactModalProps) {
  const [activeTab, setActiveTab] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const agentName = `${agent.user?.firstName || ''} ${agent.user?.lastName || ''}`.trim();
  
  // Form states
  const [emailForm, setEmailForm] = useState({
    recipientEmail: agent.user?.email || '',
    senderName: '',
    senderEmail: '',
    subject: `Real Estate Inquiry - ${agentName}`,
    message: `Hi ${agent.user?.firstName || 'there'},

I'm looking for a real estate agent in ${agent.location || 'your area'} and came across your profile. I'm interested in discussing my property needs with you.

${agent.specialties && agent.specialties.length > 0 
  ? `I noticed you specialize in ${agent.specialties.join(', ')}, which aligns with what I'm looking for.` 
  : ''
}

Could we schedule a time to discuss my requirements?

Thank you,`
  });

  const [smsForm, setSmsForm] = useState({
    recipientPhone: agent.phoneNumber || '',
    senderName: '',
    senderPhone: '',
    message: `Hi ${agent.user?.firstName || 'there'}, I found your real estate profile and I'm interested in discussing property options in ${agent.location || 'your area'}. Could we schedule a call? Thanks!`
  });

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://terranova.replit.app';
  const agentUrl = `${baseUrl}/agents/${agent.id}`;

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
          message: `${emailForm.message}\n\nAgent Profile: ${agentUrl}`,
          agentId: agent.id
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
          message: `${smsForm.message}\n\nAgent profile: ${agentUrl}`,
          agentId: agent.id
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
          Contact Agent
        </DialogTitle>
        <DialogDescription className="text-center text-sm text-muted-foreground">
          Send email or SMS directly to this agent
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
        {/* Agent Preview */}
        <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{agentName}</h3>
                <p className="text-sm text-gray-600">{agent.location}</p>
                {agent.specialties && agent.specialties.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    {agent.specialties.slice(0, 2).join(', ')}
                  </p>
                )}
              </div>
            </div>
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
                <Label htmlFor="recipientEmail" className="text-sm font-medium">Agent Email</Label>
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
                <Label htmlFor="recipientPhone" className="text-sm font-medium">Agent Phone</Label>
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
            Contact Agent
          </Button>
        )}
      </DialogTrigger>
      {modalContent}
    </Dialog>
  );
}