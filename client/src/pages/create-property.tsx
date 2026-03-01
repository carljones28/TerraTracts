import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { insertLandPropertySchema } from '@shared/schema';
import { Upload, MapPin, ArrowLeft, ChevronUp, ChevronDown, Plus, X, FileText, Trash2 } from 'lucide-react';
import PropertyMapCreator from '@/components/property/PropertyMapCreator';

// Create extended schema for form validation
const createPropertySchema = insertLandPropertySchema.extend({
  // Required fields
  title: z.string().min(1, "Property title is required"),
  description: z.string().min(1, "Property description is required"),
  location: z.string().min(1, "Location is required"),
  state: z.string().min(1, "State is required"),
  propertyType: z.string().min(1, "Property type is required"),
  
  price: z.preprocess(
    (val) => (typeof val === 'number' ? val : parseFloat(val as string) || 0),
    z.union([z.number(), z.string()])
  ).refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Price must be a valid positive number',
  }),
  acreage: z.preprocess(
    (val) => (typeof val === 'number' ? val : parseFloat(val as string) || 0),
    z.union([z.number(), z.string()])
  ).refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Acreage must be a valid positive number',
  }),
  
  // Optional fields with nullable values
  latitude: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().nullable().optional()
  ),
  longitude: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().nullable().optional()
  ),
  coordinates: z.any().optional().nullable(),
  boundary: z.any().optional().nullable(),
  terrainType: z.string().optional().nullable(),
  vegetation: z.string().optional().nullable(),
  waterResources: z.string().optional().nullable(),
  roadAccess: z.string().optional().nullable(),
  zoning: z.string().optional().nullable(),
  utilities: z.array(z.string()).optional().default([]),
  amenities: z.array(z.string()).optional().default([]),
  features: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  videoUrl: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(), // Adding snake_case version for DB compatibility
  documents: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string()
  })).optional().default([]),
});

// Define form type
type PropertyFormValues = z.infer<typeof createPropertySchema>;

// Property types data
const propertyTypes = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'recreational', label: 'Recreational' },
  { value: 'agricultural', label: 'Agricultural' },
  { value: 'conservation', label: 'Conservation' },
  { value: 'land', label: 'Land' },
  { value: 'farm', label: 'Farm' },
  { value: 'ranch', label: 'Ranch' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'waterfront', label: 'Waterfront' },
  { value: 'investment', label: 'Investment' },
];

// US States data
const states = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

// Common utility options
const utilityOptions = [
  { id: 'electricity', label: 'Electricity' },
  { id: 'water', label: 'Water' },
  { id: 'sewer', label: 'Sewer' },
  { id: 'natural-gas', label: 'Natural Gas' },
  { id: 'internet', label: 'Internet' },
  { id: 'phone', label: 'Phone Line' },
  { id: 'cable', label: 'Cable' },
];

// Common amenity options
const amenityOptions = [
  { id: 'hiking-trails', label: 'Hiking Trails' },
  { id: 'fishing', label: 'Fishing' },
  { id: 'hunting', label: 'Hunting' },
  { id: 'swimming', label: 'Swimming' },
  { id: 'boating', label: 'Boating' },
  { id: 'camping', label: 'Camping' },
  { id: 'wildlife-viewing', label: 'Wildlife Viewing' },
  { id: 'scenic-views', label: 'Scenic Views' },
];

// Terrain types
const terrainTypes = [
  { value: 'flat', label: 'Flat' },
  { value: 'rolling', label: 'Rolling' },
  { value: 'hilly', label: 'Hilly' },
  { value: 'mountainous', label: 'Mountainous' },
  { value: 'canyon', label: 'Canyon' },
  { value: 'valley', label: 'Valley' },
  { value: 'plateau', label: 'Plateau' },
  { value: 'desert', label: 'Desert' },
  { value: 'wetland', label: 'Wetland' },
  { value: 'mixed', label: 'Mixed' },
];

export default function CreatePropertyPage() {
  return (
    <ProtectedRoute requiredRole="seller">
      <CreatePropertyContent />
    </ProtectedRoute>
  );
}

function CreatePropertyContent() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [customUtility, setCustomUtility] = useState('');
  const [customAmenity, setCustomAmenity] = useState('');
  const [customFeature, setCustomFeature] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Setup form with default values
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      acreage: '',
      location: '',
      state: '',
      latitude: '',
      longitude: '',
      coordinates: null,
      boundary: null,
      propertyType: 'land',
      utilities: [],
      amenities: [],
      features: [],
      images: [],
      videoUrl: null,
      video_url: null, // Add snake_case version to default values
      documents: [], // Add documents array
      isWaterfront: false,
      isMountainView: false,
      featured: false,
      status: 'active',
      ownerId: user?.id,
    },
  });

  // Set the owner ID when user data is available
  useEffect(() => {
    if (user?.id) {
      form.setValue('ownerId', user.id);
    }
  }, [user, form]);

  // Handle the form submission
  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      // Ensure all fields that need to be strings are strings
      const formattedData = {
        ...data,
        price: String(data.price),
        acreage: String(data.acreage),
        latitude: String(data.latitude || ''),
        longitude: String(data.longitude || ''),
      };
      
      // Video URL processing with extensive logging
      console.log('🎥 CREATE - Initial video URLs:', {
        videoUrl: formattedData.videoUrl,
        video_url: formattedData.video_url
      });
      
      // Fix the video URL to use the /api/videos endpoint directly
      // First, determine the best video URL to use (prioritize videoUrl, fallback to video_url)
      let finalVideoUrl = null;
      
      if (formattedData.videoUrl) {
        finalVideoUrl = formattedData.videoUrl;
        console.log('🎥 CREATE - Using videoUrl (camelCase):', finalVideoUrl);
      } else if (formattedData.video_url) {
        finalVideoUrl = formattedData.video_url;
        console.log('🎥 CREATE - Using video_url (snake_case):', finalVideoUrl);
      }
      
      // Process the video URL if it exists
      if (finalVideoUrl) {
        console.log('🎥 CREATE - Processing video URL:', finalVideoUrl);
        
        // Already in the correct format
        if (finalVideoUrl.startsWith('/api/videos/')) {
          console.log('🎥 CREATE - Video URL already in correct format:', finalVideoUrl);
        }
        // Handle /uploads/ format URLs
        else if (finalVideoUrl.includes('/uploads/')) {
          const videoFilenameParts = finalVideoUrl.split('/uploads/');
          if (videoFilenameParts.length > 1 && videoFilenameParts[1]) {
            // Use the relative URL path for consistency
            finalVideoUrl = `/api/videos/${videoFilenameParts[1]}`;
            console.log('🎥 CREATE - Transformed video URL to API endpoint:', finalVideoUrl);
          } else {
            // Fallback method to extract filename
            const parts = finalVideoUrl.split('/');
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.length > 0) {
              finalVideoUrl = `/api/videos/${lastPart}`;
              console.log('🎥 CREATE - Used fallback method for filename extraction:', finalVideoUrl);
            } else {
              console.error('🎥 CREATE - Could not extract filename from video URL:', finalVideoUrl);
              // Keep original URL in this case
            }
          }
        } else {
          // For external videos, use as-is
          console.log('🎥 CREATE - Using external video URL as-is:', finalVideoUrl);
        }
        
        // IMPORTANT: Only set camelCase version to avoid duplicate column errors
        // The snake_case will be handled properly by the storage layer
        formattedData.videoUrl = finalVideoUrl;
        
        // Remove snake_case version to prevent duplicate column errors
        if ('video_url' in formattedData) {
          delete formattedData.video_url;
        }
        
        console.log('🎥 CREATE - Final processed video URLs:', {
          videoUrl: formattedData.videoUrl,
          video_url: formattedData.video_url
        });
      } else {
        console.log('🎥 CREATE - No video URL provided');
        // IMPORTANT: Only set camelCase version to avoid duplicate column errors
        // The snake_case will be handled properly by the storage layer
        formattedData.videoUrl = null;
        
        // Remove snake_case version to prevent duplicate column errors
        if ('video_url' in formattedData) {
          delete formattedData.video_url;
        }
      }
      
      console.log('🎥 CREATE - Final property data before submission:', formattedData);
      
      const response = await apiRequest('POST', '/api/properties', formattedData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties/my-properties'] });
      toast({
        title: 'Property Created',
        description: 'Your property listing has been created successfully.',
      });
      setLocation('/seller/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Property',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: PropertyFormValues) => {
    // Validate required fields first
    if (!data.title || !data.description || !data.location || !data.state || !data.propertyType || 
        !data.price || !data.acreage) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields before submitting.',
        variant: 'destructive',
      });
      return;
    }
    
    // Get the video URL from camelCase version (preferred) or snake_case version
    let finalVideoUrl = data.videoUrl;
    
    // If we have video_url (snake_case) but no videoUrl (camelCase), copy the value
    if (data.video_url && !data.videoUrl) {
      finalVideoUrl = data.video_url;
      console.log('🎥 SUBMIT - Using video_url (snake_case) value:', finalVideoUrl);
    }
    
    // Create a new data object with only the camelCase version
    const formData = { ...data, videoUrl: finalVideoUrl };
    
    // Remove snake_case version to prevent duplicate column errors
    if ('video_url' in formData) {
      delete formData.video_url;
    }
    
    console.log('🎥 SUBMIT - Final form data to submit:', {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      state: formData.state,
      propertyType: formData.propertyType,
      price: formData.price,
      acreage: formData.acreage,
      videoUrl: formData.videoUrl
    });
    
    // Submit the form data
    createPropertyMutation.mutate(formData);
  };

  // Add a custom utility to the list
  const addCustomUtility = () => {
    if (customUtility.trim() === '') return;
    
    const currentUtilities = form.getValues('utilities') || [];
    if (!currentUtilities.includes(customUtility)) {
      form.setValue('utilities', [...currentUtilities, customUtility]);
      setCustomUtility('');
    }
  };

  // Add a custom amenity to the list
  const addCustomAmenity = () => {
    if (customAmenity.trim() === '') return;
    
    const currentAmenities = form.getValues('amenities') || [];
    if (!currentAmenities.includes(customAmenity)) {
      form.setValue('amenities', [...currentAmenities, customAmenity]);
      setCustomAmenity('');
    }
  };

  // Add a custom feature to the list
  const addCustomFeature = () => {
    if (customFeature.trim() === '') return;
    
    const currentFeatures = form.getValues('features') || [];
    if (!currentFeatures.includes(customFeature)) {
      form.setValue('features', [...currentFeatures, customFeature]);
      setCustomFeature('');
    }
  };

  // Handle image URL input
  const handleAddImageUrl = (imageUrl: string) => {
    if (!imageUrl.trim()) return;
    
    const currentImages = form.getValues('images') || [];
    if (!currentImages.includes(imageUrl)) {
      const newImages = [...currentImages, imageUrl];
      form.setValue('images', newImages);
      setPreviewImages(newImages);
    }
  };

  // Remove image from the list
  const handleRemoveImage = (index: number) => {
    const currentImages = form.getValues('images') || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    form.setValue('images', newImages);
    setPreviewImages(newImages);
  };

  // Upload images to the server and get back URLs
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Use FormData to upload the images
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('image', file);

        // Show loading state
        toast({
          title: 'Uploading image...',
          description: `Uploading ${file.name}`,
        });

        // Upload the image using fetch
        const response = await fetch('/api/upload/property-image', {
          method: 'POST',
          body: formData,
          credentials: 'include' // Important for auth
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Add the image URL to the form
        handleAddImageUrl(result.imageUrl);
        
        toast({
          title: 'Upload successful',
          description: 'Image was uploaded successfully',
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Failed to upload image',
          variant: 'destructive',
        });
      }
    }

    // Clear the input
    e.target.value = '';
  };
  
  // Upload video to the server and get back URL
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Only use the first file - we only want one video per property
    const file = files[0];
    
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      // Show loading state
      toast({
        title: 'Uploading video...',
        description: `Uploading ${file.name} (this may take a while)`,
        duration: 10000, // Longer toast for larger files
      });
      
      // Upload the video using fetch
      const response = await fetch('/api/upload/property-video', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Important for auth
      });
      
      if (!response.ok) {
        throw new Error(`Video upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Transform the video URL to consistent /api/videos/ format
      let videoUrl = result.videoUrl;
      
      console.log('🎥 UPLOAD - Original video URL from server:', videoUrl);
      
      if (videoUrl) {
        // Already in correct format
        if (videoUrl.startsWith('/api/videos/')) {
          console.log('🎥 UPLOAD - Video URL already in correct format:', videoUrl);
        }
        // Handle /uploads/ format URLs
        else if (videoUrl.includes('/uploads/')) {
          const videoFilenameParts = videoUrl.split('/uploads/');
          if (videoFilenameParts.length > 1 && videoFilenameParts[1]) {
            // Use the relative URL path for consistency
            videoUrl = `/api/videos/${videoFilenameParts[1]}`;
            console.log('🎥 UPLOAD - Transformed video URL to API endpoint:', videoUrl);
          } else {
            // Fallback method to extract filename
            const parts = videoUrl.split('/');
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.length > 0) {
              videoUrl = `/api/videos/${lastPart}`;
              console.log('🎥 UPLOAD - Used fallback method for filename extraction:', videoUrl);
            } else {
              console.error('🎥 UPLOAD - Could not extract filename from video URL:', videoUrl);
              // Keep original URL in this case
            }
          }
        } else {
          // For external videos, use as-is
          console.log('🎥 UPLOAD - Using external video URL as-is:', videoUrl);
        }
      } else {
        console.log('🎥 UPLOAD - No video URL provided in the response');
      }
      
      // Log final video URL for debugging
      console.log('🎥 UPLOAD - Final video URL to be saved in form:', videoUrl);
      
      // IMPORTANT: Only store in camelCase format to avoid duplicate column errors
      // The snake_case will be handled properly by the storage layer
      form.setValue('videoUrl', videoUrl);  // camelCase version for the form
      
      // Remove snake_case version to prevent duplicate column errors
      if (form.getValues('video_url')) {
        form.setValue('video_url', undefined);
      }
      
      // Add debugging
      console.log('🎥 UPLOAD - Video URL set in form (camelCase):', form.getValues('videoUrl'));
      console.log('🎥 UPLOAD - Video URL set in form (snake_case):', form.getValues('video_url'));
      console.log('🎥 UPLOAD - Current form values:', form.getValues());
      
      toast({
        title: 'Video upload successful',
        description: 'Your property video tour has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: 'Video upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload video',
        variant: 'destructive',
      });
    }
    
    // Clear the input
    e.target.value = '';
  };
  
  // Upload document to the server and get back URL
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Process each file uploaded
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('document', file);
        
        // Show loading state
        toast({
          title: 'Uploading document...',
          description: `Uploading ${file.name}`,
          duration: 5000, 
        });
        
        // Upload the document using fetch
        const response = await fetch('/api/upload/property-document', {
          method: 'POST',
          body: formData,
          credentials: 'include' // Important for auth
        });
        
        if (!response.ok) {
          throw new Error(`Document upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Server returns document info in result.document object
        if (!result.document || !result.document.url) {
          throw new Error('No document URL returned from server');
        }
        
        console.log('📄 UPLOAD - Document response from server:', result);
        console.log('📄 UPLOAD - Document URL from server:', result.document.url);
        
        // Get document name and type from file
        const documentName = file.name;
        const documentType = file.type; 
        
        // Add document to the form's documents array
        const currentDocuments = form.getValues('documents') || [];
        const newDocument = {
          name: documentName,
          url: result.document.url, // Use document.url from the server response
          type: documentType
        };
        
        const updatedDocuments = [...currentDocuments, newDocument];
        form.setValue('documents', updatedDocuments);
        
        console.log('📄 UPLOAD - Documents array updated:', updatedDocuments);
        
        toast({
          title: 'Document upload successful',
          description: `${documentName} has been uploaded successfully.`,
        });
      } catch (error) {
        console.error('Error uploading document:', error);
        toast({
          title: 'Document upload failed',
          description: error instanceof Error ? error.message : 'Failed to upload document',
          variant: 'destructive',
        });
      }
    }
    
    // Clear the input
    e.target.value = '';
  };
  
  // Remove document from the documents array
  const handleRemoveDocument = (index: number) => {
    const currentDocuments = form.getValues('documents') || [];
    const updatedDocuments = currentDocuments.filter((_, i) => i !== index);
    form.setValue('documents', updatedDocuments);
    console.log('📄 REMOVE - Document removed, updated documents:', updatedDocuments);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button 
          variant="outline" 
          className="mb-4"
          onClick={() => setLocation('/seller/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-slate-800">Create Property Listing</h1>
        <p className="text-slate-600 mt-1">Fill out the details to list your property on TerraNova</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                  <CardDescription>Basic details about your property</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Scenic Mountain Land with Creek" {...field} />
                        </FormControl>
                        <FormDescription>
                          Create a compelling title that highlights key features
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your property in detail..." 
                            className="min-h-32" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include terrain features, views, potential uses, and any other selling points
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              placeholder="e.g. 125000" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="acreage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Acreage</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              placeholder="e.g. 10.5" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                            <SelectContent>
                              {propertyTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location/Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. 123 Mountain View Rd or 'Near Lake Tahoe'" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state.value} value={state.value}>
                                  {state.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="mt-4">
                    <PropertyMapCreator
                      initialLatitude={form.getValues("latitude") || null}
                      initialLongitude={form.getValues("longitude") || null}
                      onLatLongChange={(lat, lng) => {
                        form.setValue("latitude", lat);
                        form.setValue("longitude", lng);
                      }}
                      onCoordinatesChange={(coordinates) => {
                        // Store coordinates in form if needed
                        form.setValue("coordinates", coordinates);
                      }}
                      onBoundaryChange={(boundary) => {
                        // Store boundary in form if needed
                        form.setValue("boundary", boundary);
                      }}
                      className="mb-6"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-500">
                      Tip: You can get coordinates by right-clicking on Google Maps
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Property Features</CardTitle>
                    <CardDescription>Highlight what makes your land special</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 gap-1"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {showAdvanced ? 'Less Details' : 'More Details'}
                  </Button>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left column - checkboxes */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isWaterfront"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={(checked) => field.onChange(!!checked)}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Waterfront Property</FormLabel>
                              <FormDescription>
                                Property includes or borders a body of water
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isMountainView"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={(checked) => field.onChange(!!checked)}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Mountain View</FormLabel>
                              <FormDescription>
                                Property has views of mountains
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Right column - Utilities */}
                    <div>
                      <FormField
                        control={form.control}
                        name="utilities"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel>Utilities</FormLabel>
                              <FormDescription>
                                Select available utilities
                              </FormDescription>
                            </div>
                            {utilityOptions.map((item) => (
                              <FormField
                                key={item.id}
                                control={form.control}
                                name="utilities"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={item.id}
                                      className="flex flex-row items-start space-x-3 space-y-0 mb-2"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(item.id)}
                                          onCheckedChange={(checked) => {
                                            const currentValues = field.value || [];
                                            return checked
                                              ? field.onChange([...currentValues, item.id])
                                              : field.onChange(
                                                  currentValues.filter(
                                                    (value) => value !== item.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {item.label}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                            
                            <div className="flex items-center mt-3 gap-2">
                              <Input
                                value={customUtility}
                                onChange={(e) => setCustomUtility(e.target.value)}
                                placeholder="Add other utility..."
                                className="flex-1"
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={addCustomUtility}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Amenities */}
                  <FormField
                    control={form.control}
                    name="amenities"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Amenities</FormLabel>
                          <FormDescription>
                            Select recreational and lifestyle amenities
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                          {amenityOptions.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="amenities"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                          const currentValues = field.value || [];
                                          return checked
                                            ? field.onChange([...currentValues, item.id])
                                            : field.onChange(
                                                currentValues.filter(
                                                  (value) => value !== item.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {item.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        
                        <div className="flex items-center mt-3 gap-2">
                          <Input
                            value={customAmenity}
                            onChange={(e) => setCustomAmenity(e.target.value)}
                            placeholder="Add other amenity..."
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={addCustomAmenity}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {/* Advanced Details Section */}
                  {showAdvanced && (
                    <>
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="font-medium mb-4">Additional Details</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="terrainType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Terrain Type</FormLabel>
                                <FormControl>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value || ""}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select terrain type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {terrainTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="roadAccess"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Road Access</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. Paved road, Dirt road, No direct access" 
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name="vegetation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Vegetation</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. Forest, Grassland, Desert" 
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="waterResources"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Water Resources</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. Creek, Pond, Well, Spring" 
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="zoning"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>Zoning</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. Agricultural, Residential, Mixed Use" 
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                              </FormControl>
                              <FormDescription>
                                Specify current zoning or allowable uses
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Additional Features */}
                      <FormField
                        control={form.control}
                        name="features"
                        render={({ field }) => (
                          <FormItem>
                            <div className="mb-3">
                              <FormLabel>Additional Features</FormLabel>
                              <FormDescription>
                                Add any other special features of your property
                              </FormDescription>
                            </div>
                            
                            {/* Display the features */}
                            {field.value && field.value.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {field.value.map((feature, index) => (
                                  <div 
                                    key={index}
                                    className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm flex items-center"
                                  >
                                    {feature}
                                    <X
                                      className="ml-2 h-3 w-3 cursor-pointer hover:text-red-500"
                                      onClick={() => {
                                        const newFeatures = field.value?.filter((_, i) => i !== index);
                                        field.onChange(newFeatures);
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-500 text-sm mb-3">No features added yet</p>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <Input
                                value={customFeature}
                                onChange={(e) => setCustomFeature(e.target.value)}
                                placeholder="Add a feature..."
                                className="flex-1"
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={addCustomFeature}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column - Images and Status */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Images</CardTitle>
                  <CardDescription>Add photos of your property</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add('border-primary');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-primary');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-primary');
                      
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        // Process each dropped file using the existing upload function
                        const fileList = e.dataTransfer.files;
                        if (fileList && fileList.length > 0) {
                          // Upload each image file
                          Array.from(fileList).forEach(async (file) => {
                            if (file.type.startsWith('image/')) {
                              try {
                                const formData = new FormData();
                                formData.append('image', file);
                                
                                // Show loading state
                                toast({
                                  title: 'Uploading image...',
                                  description: `Uploading ${file.name}`,
                                });
                                
                                // Upload the image using fetch
                                const response = await fetch('/api/upload/property-image', {
                                  method: 'POST',
                                  body: formData,
                                  credentials: 'include' // Important for auth
                                });
                                
                                if (!response.ok) {
                                  throw new Error(`Upload failed: ${response.statusText}`);
                                }
                                
                                const result = await response.json();
                                
                                // Add the image URL to the form
                                handleAddImageUrl(result.imageUrl);
                                
                                toast({
                                  title: 'Upload successful',
                                  description: 'Image was uploaded successfully',
                                });
                              } catch (error) {
                                console.error('Error uploading dropped image:', error);
                                toast({
                                  title: 'Upload failed',
                                  description: error instanceof Error ? error.message : 'Failed to upload image',
                                  variant: 'destructive',
                                });
                              }
                            }
                          });
                        }
                      }
                    }}
                  >
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 mb-2">Drag and drop images or</p>
                    <div className="flex justify-center">
                      <label className="cursor-pointer text-primary hover:underline text-sm">
                        Browse files
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          multiple 
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div className="text-center text-sm text-slate-500">or</div>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter image URL"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousSibling as HTMLInputElement;
                        handleAddImageUrl(input.value);
                        input.value = '';
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Image Preview */}
                  {previewImages.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {previewImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`Property image ${index + 1}`} 
                            className="w-full h-24 object-contain bg-slate-50 rounded-md"
                          />
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Property Video Tour</CardTitle>
                  <CardDescription>Add a video walkthrough of your property</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center"
                  >
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 mb-2">Upload a video tour of your property</p>
                    <div className="flex justify-center">
                      <label className="cursor-pointer text-primary hover:underline text-sm">
                        Browse files
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="video/*" 
                          onChange={handleVideoUpload}
                        />
                      </label>
                    </div>
                  </div>
                  
                  {/* Video Preview */}
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        {field.value ? (
                          <div className="mt-4">
                            <video 
                              src={field.value}
                              controls
                              className="w-full h-auto max-h-64 rounded-md bg-slate-50 object-contain"
                            />
                            <div className="flex justify-end mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-red-500"
                                onClick={() => {
                                  // FIXED: Set the snake_case version to null
                                  form.setValue('video_url', null);
                                  // Clear the CamelCase version too to prevent accidental use
                                  form.setValue('videoUrl', null);
                                }}
                              >
                                <X className="h-3 w-3 mr-1" /> Remove Video
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-center text-sm text-slate-500 mt-2">
                            No video uploaded yet. Upload a video tour to showcase your property.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="text-sm text-slate-500 mt-2">
                    <p>💡 Tips for great property videos:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Walk the property boundaries to show the full extent</li>
                      <li>Highlight key features and amenities</li>
                      <li>Show different views and perspectives</li>
                      <li>Keep the video between 1-3 minutes for optimal engagement</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Property Documents</CardTitle>
                  <CardDescription>Add legal documents, surveys, permits, or other relevant files</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center"
                  >
                    <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 mb-2">Upload property documents</p>
                    <div className="flex justify-center">
                      <label className="cursor-pointer text-primary hover:underline text-sm">
                        Browse files
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.jpg,.jpeg,.png"
                          onChange={handleDocumentUpload}
                          multiple
                        />
                      </label>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="documents"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="mt-2">
                            {field.value && field.value.length > 0 ? (
                              <div className="space-y-2">
                                {field.value.map((doc, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                                    <div className="flex items-center space-x-3">
                                      <FileText className="h-5 w-5 text-slate-400" />
                                      <div>
                                        <p className="text-sm font-medium">{doc.name}</p>
                                        <p className="text-xs text-slate-500">{doc.type}</p>
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveDocument(index)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 text-center py-2">
                                No documents uploaded yet. Upload property documents such as surveys, permits, or legal files.
                              </p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="text-sm text-slate-500 mt-2">
                    <p>💡 Recommended documents:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Property survey</li>
                      <li>Zoning certificates</li>
                      <li>Soil or environmental reports</li>
                      <li>Utility access documents</li>
                      <li>Permits or approvals</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Listing Status</CardTitle>
                  <CardDescription>Manage your listing availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value || "active"}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="sold">Sold</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Active listings are visible to all users
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                        <FormControl>
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={(checked) => field.onChange(!!checked)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Featured Listing</FormLabel>
                          <FormDescription>
                            Highlight your property in search results (premium)
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="lg" 
              disabled={createPropertyMutation.isPending}
              className="px-8"
            >
              {createPropertyMutation.isPending ? 'Creating...' : 'Create Listing'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}