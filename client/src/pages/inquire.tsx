import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Form, 
  FormControl,
  FormDescription,
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Form schema
const inquirySchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'Price on request';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'Price on request';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(numValue);
}

function InquireContent() {
  const { id } = useParams<{ id: string }>();
  const propertyId = parseInt(id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to contact the seller",
        variant: "destructive"
      });
      setLocation("/auth");
    }
  }, [user, toast, setLocation]);

  // Fetch property data
  const { 
    data: property, 
    isLoading: isLoadingProperty, 
    error: propertyError,
    isError: isPropertyError 
  } = useQuery({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: !isNaN(propertyId)
  });

  // Setup form
  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      subject: property ? `Inquiry about ${property.title}` : '',
      message: '',
    },
  });

  // Update subject when property loads
  useEffect(() => {
    if (property) {
      form.setValue('subject', `Inquiry about ${property.title}`);
    }
  }, [property, form]);

  // Submit inquiry mutation
  const submitMutation = useMutation({
    mutationFn: async (data: InquiryFormValues) => {
      // Add property ID and recipient to the inquiry
      const inquiryData = {
        ...data,
        propertyId,
        toUserId: property?.ownerId || 0,
        fromUserId: user?.id || 0,
      };

      const response = await apiRequest('POST', '/api/inquiries', inquiryData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to send inquiry');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Inquiry sent",
        description: "Your message has been sent to the property owner",
      });
      // Redirect to property page
      setLocation(`/properties/${propertyId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send inquiry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: InquiryFormValues) => {
    submitMutation.mutate(data);
  };

  // Loading state
  if (isLoadingProperty) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading property details...</span>
      </div>
    );
  }

  // Error state
  if (isPropertyError || !property) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Property</CardTitle>
            <CardDescription>
              We couldn't find the property you're inquiring about. It may have been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/')}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prevent inquiring about your own property
  if (user?.id === property.ownerId) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>This is Your Property</CardTitle>
            <CardDescription>
              You cannot send an inquiry about your own property.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation(`/properties/${propertyId}`)}>
              Return to Property
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="outline"
        size="sm"
        className="mb-6"
        onClick={() => window.history.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Contact the Seller</CardTitle>
            <CardDescription>
              Send a message about this property to the owner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-medium">Property Details</h3>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Property</p>
                  <p>{property.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p>{property.location}, {property.state}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p>{formatCurrency(property.price)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Size</p>
                  <p>{property.acreage} acres</p>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your message here. Include any questions or specific information you'd like about the property."
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Be clear about what information you're looking for.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Inquiry
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex-col items-start text-sm text-gray-500">
            <p>Your contact information will be shared with the seller.</p>
            <p>All communication will be available in your messages.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Main component
export default function InquirePage() {
  return <InquireContent />;
}