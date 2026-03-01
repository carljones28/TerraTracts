import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Loader2, Send, MessageSquare, Mail, ArrowLeft } from 'lucide-react';

interface Message {
  id: number;
  propertyId: number;
  subject: string;
  message: string;
  fromUserId: number;
  toUserId: number;
  status: string;
  createdAt: string;
  property?: {
    title: string;
    location: string;
    state: string;
  };
  fromUser?: {
    username: string;
    email: string;
  };
  toUser?: {
    username: string;
    email: string;
  };
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MessageCard({ message, isSent, onReply }: { message: Message; isSent: boolean; onReply: (message: Message) => void }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const getStatusBadge = () => {
    switch (message.status) {
      case 'new':
        return <Badge className="bg-blue-500">New</Badge>;
      case 'read':
        return <Badge variant="outline">Read</Badge>;
      case 'replied':
        return <Badge className="bg-green-500">Replied</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge>{message.status}</Badge>;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-medium">{message.subject}</CardTitle>
            <CardDescription>
              {isSent ? `To: ${message.toUser?.username || 'Unknown user'}` : `From: ${message.fromUser?.username || 'Unknown user'}`}
              {' • '}{formatDate(message.createdAt)}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-line">{message.message}</p>
        
        {message.property && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <div className="text-sm font-medium">Property: {message.property.title}</div>
            <div className="text-xs text-gray-500">
              {message.property.location}, {message.property.state}
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs"
              onClick={() => setLocation(`/properties/${message.propertyId}`)}
            >
              View Property
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end pt-2">
        {!isSent && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => onReply(message)}
          >
            <MessageSquare className="mr-1 h-4 w-4" />
            Reply
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function MessagesContent() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [activeTab, setActiveTab] = useState('received');
  
  // Fetch messages
  const { 
    data: inquiries = [], 
    isLoading: isLoadingInquiries,
    isError: isInquiriesError,
    error: inquiriesError
  } = useQuery({
    queryKey: ['/api/inquiries'],
    enabled: !!user,
  });

  // Separate received and sent messages
  const receivedMessages = inquiries.filter((m: Message) => m.toUserId === user?.id);
  const sentMessages = inquiries.filter((m: Message) => m.fromUserId === user?.id);

  // Update message status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest('PATCH', `/api/inquiries/${id}`, { status });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to update message status');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async (data: { propertyId: number; toUserId: number; subject: string; message: string }) => {
      const response = await apiRequest('POST', '/api/inquiries', {
        ...data,
        fromUserId: user?.id,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to send reply');
      }
      return await response.json();
    },
    onSuccess: () => {
      // Close reply dialog and clear fields
      setReplyTo(null);
      setReplyText('');
      
      // Update original message status to 'replied'
      if (replyTo) {
        updateStatusMutation.mutate({ id: replyTo.id, status: 'replied' });
      }
      
      // Show success toast
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully",
      });
      
      // Refetch inquiries
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle opening reply dialog
  const handleReply = (message: Message) => {
    // Mark as read if it's new
    if (message.status === 'new') {
      updateStatusMutation.mutate({ id: message.id, status: 'read' });
    }
    
    setReplyTo(message);
    setReplyText('');
  };

  // Handle sending reply
  const handleSendReply = () => {
    if (!replyTo || !replyText.trim()) return;
    
    sendReplyMutation.mutate({
      propertyId: replyTo.propertyId,
      toUserId: replyTo.fromUserId,
      subject: `Re: ${replyTo.subject}`,
      message: replyText.trim(),
    });
  };

  // Handle closing reply dialog
  const handleCloseReply = () => {
    // Mark as read if it was new
    if (replyTo && replyTo.status === 'new') {
      updateStatusMutation.mutate({ id: replyTo.id, status: 'read' });
    }
    
    setReplyTo(null);
    setReplyText('');
  };

  // Loading state
  if (isLoadingInquiries) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading messages...</span>
      </div>
    );
  }

  // Error state
  if (isInquiriesError) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Messages</CardTitle>
            <CardDescription>
              We encountered an error while loading your messages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              {(inquiriesError as Error)?.message || 'Please try again later.'}
            </p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No messages state
  const noMessagesContent = (
    <Card className="text-center py-12">
      <CardContent>
        <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No messages yet</h3>
        <p className="text-gray-500 mb-6">
          {activeTab === 'received' 
            ? "When someone contacts you about a property, the messages will appear here."
            : "When you contact property owners, your sent messages will appear here."}
        </p>
        {activeTab === 'sent' && (
          <Button 
            onClick={() => setLocation('/properties')}
            className="mx-auto"
          >
            Browse Properties
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Messages</h1>
            <p className="text-gray-500">View and manage your property inquiries</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <Tabs
          defaultValue="received"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="received">
              Received
              {receivedMessages.length > 0 && (
                <Badge className="ml-2">{receivedMessages.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent
              {sentMessages.length > 0 && (
                <Badge className="ml-2">{sentMessages.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="received">
            {receivedMessages.length > 0 ? (
              <div>
                {receivedMessages.map((message: Message) => (
                  <MessageCard 
                    key={message.id} 
                    message={message} 
                    isSent={false}
                    onReply={handleReply}
                  />
                ))}
              </div>
            ) : (
              noMessagesContent
            )}
          </TabsContent>
          
          <TabsContent value="sent">
            {sentMessages.length > 0 ? (
              <div>
                {sentMessages.map((message: Message) => (
                  <MessageCard 
                    key={message.id} 
                    message={message} 
                    isSent={true}
                    onReply={() => {}} // No reply for sent messages
                  />
                ))}
              </div>
            ) : (
              noMessagesContent
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reply Dialog */}
      <Dialog open={!!replyTo} onOpenChange={(open) => !open && handleCloseReply()}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Reply to Inquiry</DialogTitle>
            <DialogDescription>
              Responding to: {replyTo?.subject}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-4">
            <div className="p-3 bg-gray-100 rounded-md text-sm mb-2">
              <p className="font-medium">Original message:</p>
              <p className="text-gray-700 mt-1">{replyTo?.message}</p>
            </div>
            <div className="text-xs text-gray-500">
              From: {replyTo?.fromUser?.username} ({replyTo?.fromUser?.email})
            </div>
          </div>
          
          <Separator />
          
          <div className="mb-4 mt-2">
            <label className="text-sm font-medium">Your Reply</label>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              className="mt-1 min-h-[150px]"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseReply}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendReply}
              disabled={!replyText.trim() || sendReplyMutation.isPending}
            >
              {sendReplyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main component
export default function MessagesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to sign in to access your messages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/auth')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <MessagesContent />;
}