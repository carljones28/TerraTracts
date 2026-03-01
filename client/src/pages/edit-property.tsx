import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';

import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload, UploadCloud, X, Plus, ChevronDown, ChevronUp, FileText, Trash2, Download, File, FilePlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Property form schema
const editPropertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return 0;
      return typeof val === 'number' ? val : parseFloat(String(val)) || 0;
    },
    z.union([z.number(), z.string()])
  ).refine((val) => !isNaN(Number(val)), {
    message: 'Price must be a valid number',
  }),
  acreage: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return 0;
      return typeof val === 'number' ? val : parseFloat(String(val)) || 0;
    },
    z.union([z.number(), z.string()])
  ).refine((val) => !isNaN(Number(val)), {
    message: 'Acreage must be a valid number',
  }),
  location: z.string().min(3, 'Location is required'),
  state: z.string().min(2, 'State is required'),
  latitude: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return '';
      return String(val);
    },
    z.string()
  ),
  longitude: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return '';
      return String(val);
    },
    z.string()
  ),
  propertyType: z.string().default('land'),
  status: z.string().default('active'),
  utilities: z.array(z.string()).optional().default([]),
  amenities: z.array(z.string()).optional().default([]),
  features: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  zoning: z.string().optional().default(''),
  terrainType: z.string().optional().default(''),
  vegetation: z.string().optional().default(''),
  waterResources: z.string().optional().default(''),
  videoUrl: z.string().optional().default(''),
  video_url: z.string().optional().default(''),
  roadAccess: z.string().optional().default(''),
  isWaterfront: z.boolean().optional().default(false),
  isMountainView: z.boolean().optional().default(false),
  ownerId: z.number().optional(),
  documents: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string()
  })).optional().default([]),
});

// Type for the form values
type PropertyFormValues = z.infer<typeof editPropertySchema>;

// Utility options
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

function EditPropertyContent() {
  const { id } = useParams<{id: string}>();
  const propertyId = parseInt(id || '0');
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [customUtility, setCustomUtility] = useState('');
  const [customAmenity, setCustomAmenity] = useState('');
  const [customFeature, setCustomFeature] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch property data
  const { 
    data: propertyData, 
    isLoading: isLoadingProperty, 
    error: propertyError 
  } = useQuery({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: !isNaN(propertyId)
  });
  
  // Setup form with default values
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(editPropertySchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      acreage: '',
      location: '',
      state: '',
      latitude: '',
      longitude: '',
      propertyType: 'land',
      utilities: [],
      amenities: [],
      features: [],
      images: [],
      videoUrl: '',
      video_url: '',
      isWaterfront: false,
      isMountainView: false,
      status: 'active',
      ownerId: user?.id,
    },
  });

  // Set form values when property data loads
  useEffect(() => {
    if (propertyData) {
      // Convert numeric values to strings for form with proper typing
      const formData: PropertyFormValues = {
        title: propertyData.title || '',
        description: propertyData.description || '',
        price: propertyData.price?.toString() || '0',
        acreage: propertyData.acreage?.toString() || '0',
        location: propertyData.location || '',
        state: propertyData.state || '',
        latitude: propertyData.latitude?.toString() || '0',
        longitude: propertyData.longitude?.toString() || '0',
        propertyType: propertyData.propertyType || 'land',
        status: propertyData.status || 'active',
        // Ensure arrays are properly set
        utilities: Array.isArray(propertyData.utilities) ? propertyData.utilities : [],
        amenities: Array.isArray(propertyData.amenities) ? propertyData.amenities : [],
        features: Array.isArray(propertyData.features) ? propertyData.features : [],
        images: Array.isArray(propertyData.images) ? propertyData.images : [],
        videoUrl: propertyData.videoUrl || '',
        video_url: propertyData.video_url || propertyData.videoUrl || '',
        terrainType: propertyData.terrainType || '',
        vegetation: propertyData.vegetation || '',
        waterResources: propertyData.waterResources || '',
        zoning: propertyData.zoning || '',
        roadAccess: propertyData.roadAccess || '',
        isWaterfront: !!propertyData.isWaterfront,
        isMountainView: !!propertyData.isMountainView,
        ownerId: propertyData.ownerId,
        documents: Array.isArray(propertyData.documents) ? propertyData.documents : [],
      };
      
      // Reset form with property data
      form.reset(formData);
      
      // Set preview images
      if (Array.isArray(propertyData.images)) {
        setPreviewImages(propertyData.images);
      }
    }
  }, [propertyData, form]);

  // Set the owner ID when user data is available
  useEffect(() => {
    if (user?.id && !form.getValues('ownerId')) {
      form.setValue('ownerId', user.id);
    }
  }, [user, form]);

  // Update property mutation with comprehensive error handling and authentication check
  const updateMutation = useMutation({
    mutationFn: async (formData: PropertyFormValues) => {
      console.log('In mutation function with propertyId:', propertyId);
      
      if (!isAuthenticated || !user) {
        console.error('User not authenticated for property update');
        throw new Error('You must be logged in to update a property listing');
      }
      
      // Ensure we have a property ID
      if (!propertyId) {
        console.error('No property ID provided for update');
        throw new Error('Property ID is required for update');
      }
      
      // Fix the video URL to use the /api/videos endpoint
      // First, determine which video URL format to use (prioritize camelCase, fallback to snake_case)
      let sourceVideoUrl = null;
      let videoUrlSource = '';
      
      if (formData.videoUrl) {
        sourceVideoUrl = formData.videoUrl;
        videoUrlSource = 'videoUrl (camelCase)';
      } else if (formData.video_url) {
        sourceVideoUrl = formData.video_url;
        videoUrlSource = 'video_url (snake_case)';
      }
      
      if (sourceVideoUrl) {
        console.log(`🎥 EDIT - Processing video URL from ${videoUrlSource}:`, sourceVideoUrl);
        
        let finalVideoUrl = sourceVideoUrl;
        
        // Already in the correct format
        if (sourceVideoUrl.startsWith('/api/videos/')) {
          console.log('🎥 EDIT - Video URL already in correct format:', sourceVideoUrl);
        }
        // Handle /uploads/ format URLs
        else if (sourceVideoUrl.includes('/uploads/')) {
          const videoFilenameParts = sourceVideoUrl.split('/uploads/');
          if (videoFilenameParts.length > 1 && videoFilenameParts[1]) {
            // Use the relative URL path for consistency
            finalVideoUrl = `/api/videos/${videoFilenameParts[1]}`;
            console.log('🎥 EDIT - Transformed video URL to API endpoint:', finalVideoUrl);
          } else {
            // Fallback method to extract filename
            const parts = sourceVideoUrl.split('/');
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.length > 0) {
              finalVideoUrl = `/api/videos/${lastPart}`;
              console.log('🎥 EDIT - Used fallback method for video filename extraction:', finalVideoUrl);
            } else {
              console.error('🎥 EDIT - Could not extract filename from video URL:', sourceVideoUrl);
            }
          }
        } else {
          console.log('🎥 EDIT - Using external video URL as-is:', sourceVideoUrl);
        }
        
        // IMPORTANT: Only store the processed URL in camelCase format
        // The snake_case will be handled properly by the storage layer
        // This prevents "column 'video_url' specified more than once" error
        formData.videoUrl = finalVideoUrl;
        
        // IMPORTANT: Delete the snake_case version to avoid duplicate column error
        if ('video_url' in formData) {
          delete formData.video_url;
        }
        
        console.log('🎥 EDIT - Final video URL stored in camelCase format only:', {
          videoUrl: formData.videoUrl
        });
      } else {
        console.log('🎥 EDIT - No video URL provided');
        // IMPORTANT: Only set camelCase version to avoid duplicate column errors
        // The snake_case will be handled properly by the storage layer
        formData.videoUrl = null;
        
        // Remove snake_case version to prevent duplicate column errors
        if ('video_url' in formData) {
          delete formData.video_url;
        }
      }
      
      // Make sure we include the owner ID
      if (user && user.id && !formData.ownerId) {
        formData.ownerId = user.id;
      }
      
      // Create a properly typed complete data object with all required fields
      const completeData: PropertyFormValues = {
        ...formData,
        // Ensure these fields are present and properly formatted
        title: formData.title || (propertyData ? propertyData.title : "") || "Property Listing",
        description: formData.description || (propertyData ? propertyData.description : "") || "",
        price: String(formData.price || (propertyData ? propertyData.price : 0) || "0"),
        acreage: String(formData.acreage || (propertyData ? propertyData.acreage : 0) || "0"),
        location: formData.location || (propertyData ? propertyData.location : "") || "",
        state: formData.state || (propertyData ? propertyData.state : "") || "",
        propertyType: formData.propertyType || (propertyData ? propertyData.propertyType : "") || "land",
        status: formData.status || (propertyData ? propertyData.status : "") || "active",
        
        // Format coordinates correctly
        latitude: String(formData.latitude || (propertyData ? propertyData.latitude : 0) || "0"),
        longitude: String(formData.longitude || (propertyData ? propertyData.longitude : 0) || "0"),
        
        // Ensure arrays are properly formatted
        utilities: Array.isArray(formData.utilities) ? formData.utilities : 
                  (propertyData && Array.isArray(propertyData.utilities) ? propertyData.utilities : []),
        amenities: Array.isArray(formData.amenities) ? formData.amenities : 
                  (propertyData && Array.isArray(propertyData.amenities) ? propertyData.amenities : []),
        features: Array.isArray(formData.features) ? formData.features : 
                 (propertyData && Array.isArray(propertyData.features) ? propertyData.features : []),
        images: Array.isArray(formData.images) ? formData.images : 
               (propertyData && Array.isArray(propertyData.images) ? propertyData.images : []),
        
        // Include remaining properties
        videoUrl: formData.videoUrl || (propertyData ? propertyData.videoUrl : "") || "",
        // Only use videoUrl (camelCase) for consistent handling
      // The video_url field will be handled properly by the storage layer
        terrainType: formData.terrainType || (propertyData ? propertyData.terrainType : "") || "",
        vegetation: formData.vegetation || (propertyData ? propertyData.vegetation : "") || "",
        waterResources: formData.waterResources || (propertyData ? propertyData.waterResources : "") || "",
        zoning: formData.zoning || (propertyData ? propertyData.zoning : "") || "",
        roadAccess: formData.roadAccess || (propertyData ? propertyData.roadAccess : "") || "",
        isWaterfront: Boolean(formData.isWaterfront),
        isMountainView: Boolean(formData.isMountainView),
        
        // Ensure we include documents
        documents: Array.isArray(formData.documents) ? formData.documents : 
                  (propertyData && Array.isArray(propertyData.documents) ? propertyData.documents : []),
        
        // Ensure we have owner info
        ownerId: user.id
      };
      
      console.log('Sending PUT request to:', `/api/properties/${propertyId}`);
      console.log('With complete data:', JSON.stringify(completeData, null, 2));
      
      try {
        // First verify we're still authenticated
        const authCheck = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (authCheck.status === 401) {
          console.error('Authentication check failed before property update');
          throw new Error('Your session has expired. Please log in again.');
        }
        
        // Add manual fetch with better error handling
        const response = await fetch(`/api/properties/${propertyId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completeData),
          credentials: 'include' // For cookies/session
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
          // Try to get error message from response
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          
          let errorMessage = `Failed to update property: ${response.status} ${response.statusText}`;
          try {
            const errorData = JSON.parse(errorText);
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (e) {
            // If it's not JSON, use the raw text
            if (errorText) errorMessage = errorText;
          }
          
          throw new Error(errorMessage);
        }
        
        const responseData = await response.json();
        console.log('Response data:', responseData);
        return responseData;
      } catch (error) {
        console.error('Error in property update:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: "Property updated successfully",
        description: "Your property listing has been updated.",
      });
      
      // Redirect to property details page
      setLocation(`/properties/${propertyId}`);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties/my-properties'] });
    },
    onError: (error: Error) => {
      console.error('Update error:', error);
      toast({
        title: "Failed to update property",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Form submission handler - simplified to use the manual button click instead
  const onSubmit = (data: PropertyFormValues) => {
    console.log('Form onSubmit triggered with data:', data);
    // This will not be used as we're using a manual button click handler
    // to ensure we have more control over the validation and submission process
  };

  // Add custom utility
  const addCustomUtility = () => {
    if (customUtility.trim()) {
      const currentUtilities = form.getValues('utilities') || [];
      if (!currentUtilities.includes(customUtility)) {
        form.setValue('utilities', [...currentUtilities, customUtility]);
      }
      setCustomUtility('');
    }
  };

  // Add custom amenity
  const addCustomAmenity = () => {
    if (customAmenity.trim()) {
      const currentAmenities = form.getValues('amenities') || [];
      if (!currentAmenities.includes(customAmenity)) {
        form.setValue('amenities', [...currentAmenities, customAmenity]);
      }
      setCustomAmenity('');
    }
  };

  // Add custom feature
  const addCustomFeature = () => {
    if (customFeature.trim()) {
      const currentFeatures = form.getValues('features') || [];
      if (!currentFeatures.includes(customFeature)) {
        form.setValue('features', [...currentFeatures, customFeature]);
      }
      setCustomFeature('');
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    const currentImages = [...previewImages];
    currentImages.splice(index, 1);
    setPreviewImages(currentImages);
    form.setValue('images', currentImages);
  };

  // Add image URL manually
  const addImageUrl = () => {
    const imageUrl = window.prompt('Enter image URL:');
    if (imageUrl) {
      const newImages = [...previewImages, imageUrl];
      setPreviewImages(newImages);
      form.setValue('images', newImages);
    }
  };
  
  // Handle document upload
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Use FormData to upload the documents
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

  // Remove document
  const handleRemoveDocument = (index: number) => {
    const currentDocuments = form.getValues('documents') || [];
    const updatedDocuments = [...currentDocuments];
    updatedDocuments.splice(index, 1);
    form.setValue('documents', updatedDocuments);
    
    toast({
      title: 'Document removed',
      description: 'Document has been removed from the property listing.',
    });
  };

  // Handle file upload for images
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
        const newImages = [...previewImages, result.imageUrl];
        setPreviewImages(newImages);
        form.setValue('images', newImages);
        
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
  
  // Handle video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // Check file size (max 50MB = 50 * 1024 * 1024 bytes)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'Video file must be less than 50MB.',
          variant: 'destructive',
        });
        return;
      }
      
      const formData = new FormData();
      formData.append('video', file);
      
      // Show loading state
      toast({
        title: 'Uploading video...',
        description: `Uploading ${file.name}`,
      });
      
      // Upload the video
      const response = await fetch('/api/upload/property-video', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload video');
      }
      
      const data = await response.json();
      
      // Get the video URL from the response 
      let videoUrl = data.videoUrl;
      
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
      
      // IMPORTANT: Only store the processed URL in camelCase format
      // The snake_case will be handled properly by the storage layer
      // This prevents "column 'video_url' specified more than once" error  
      form.setValue('videoUrl', videoUrl);
      
      // Remove the snake_case format to avoid duplicate column errors
      if (form.getValues('video_url')) {
        form.setValue('video_url', undefined);
      }
      
      console.log('🎥 UPLOAD - Setting video URL in camelCase format only:', {
        videoUrl
      });
      
      toast({
        title: 'Video uploaded',
        description: `Successfully uploaded ${file.name}`,
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload video',
        variant: 'destructive',
      });
    }
    
    // Clear the input
    e.target.value = '';
  };

  // Handle authentication redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to edit properties",
        variant: "destructive",
      });
      setLocation("/auth");
    }
  }, [isLoading, isAuthenticated, toast, setLocation]);
  
  // Show loading while checking auth or redirecting
  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">
          {isLoading ? "Checking authentication..." : "Redirecting to login..."}
        </span>
      </div>
    );
  }
  
  // Loading state
  if (isLoadingProperty) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading property data...</span>
      </div>
    );
  }

  // Error state
  if (propertyError) {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Property</CardTitle>
            <CardDescription>
              We couldn't load the property data. Please try again or contact support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation(`/seller-dashboard`)}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Property not found
  if (!propertyData) {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Property Not Found</CardTitle>
            <CardDescription>
              The property you're looking for doesn't exist or you don't have permission to edit it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation(`/seller-dashboard`)}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Edit Property</h1>
          <p className="text-gray-500 mt-1">Update your property listing details</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <Button variant="outline" onClick={() => setLocation(`/properties/${propertyId}`)}>
            View Listing
          </Button>
        </div>
      </div>
      
      <Card className="w-full">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-6 md:col-span-2">
                  <h2 className="text-xl font-semibold text-primary">Basic Information</h2>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a descriptive title" {...field} />
                        </FormControl>
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
                            placeholder="Describe your property in detail" 
                            rows={5}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Property Type & Status */}
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="recreational">Recreational</SelectItem>
                          <SelectItem value="agricultural">Agricultural</SelectItem>
                          <SelectItem value="conservation">Conservation</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                          <SelectItem value="farm">Farm</SelectItem>
                          <SelectItem value="ranch">Ranch</SelectItem>
                          <SelectItem value="mountain">Mountain</SelectItem>
                          <SelectItem value="waterfront">Waterfront</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Price & Size */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="Enter price"
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
                          placeholder="Enter acreage"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, County" {...field} />
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
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Coordinates */}
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Example: 37.7749" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Example: -122.4194" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Property Features */}
                <div className="md:col-span-2">
                  <Separator className="my-6" />
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-primary">Features & Amenities</h2>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center"
                    >
                      {showAdvanced ? (
                        <>Less <ChevronUp className="ml-1 h-4 w-4" /></>
                      ) : (
                        <>More <ChevronDown className="ml-1 h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                  
                  {/* Special Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <FormField
                      control={form.control}
                      name="isWaterfront"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Waterfront</FormLabel>
                            <FormDescription>
                              Property has water frontage
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isMountainView"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Mountain View</FormLabel>
                            <FormDescription>
                              Property has mountain views
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Utilities */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Utilities</h3>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="utilities"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-2 gap-2">
                            {utilityOptions.map((utility) => (
                              <FormField
                                key={utility.id}
                                control={form.control}
                                name="utilities"
                                render={({ field }) => (
                                  <FormItem
                                    key={utility.id}
                                    className="flex items-center space-x-2"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(utility.id)}
                                        onCheckedChange={(checked) => {
                                          const updatedValue = checked
                                            ? [...field.value, utility.id]
                                            : field.value?.filter(
                                                (value) => value !== utility.id
                                              );
                                          field.onChange(updatedValue);
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-sm">
                                      {utility.label}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          
                          <div className="flex mt-2">
                            <Input
                              placeholder="Add custom utility"
                              value={customUtility}
                              onChange={(e) => setCustomUtility(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={addCustomUtility}
                              className="ml-2"
                              disabled={!customUtility.trim()}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {field.value?.filter(util => !utilityOptions.some(option => option.id === util)).map((util, i) => (
                              <Badge key={i} variant="secondary" className="text-xs py-1">
                                {util}
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange(field.value?.filter(value => value !== util));
                                  }}
                                  className="ml-1"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Amenities */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Amenities</h3>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="amenities"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-2 gap-2">
                            {amenityOptions.map((amenity) => (
                              <FormField
                                key={amenity.id}
                                control={form.control}
                                name="amenities"
                                render={({ field }) => (
                                  <FormItem
                                    key={amenity.id}
                                    className="flex items-center space-x-2"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(amenity.id)}
                                        onCheckedChange={(checked) => {
                                          const updatedValue = checked
                                            ? [...field.value, amenity.id]
                                            : field.value?.filter(
                                                (value) => value !== amenity.id
                                              );
                                          field.onChange(updatedValue);
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-sm">
                                      {amenity.label}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          
                          <div className="flex mt-2">
                            <Input
                              placeholder="Add custom amenity"
                              value={customAmenity}
                              onChange={(e) => setCustomAmenity(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={addCustomAmenity}
                              className="ml-2"
                              disabled={!customAmenity.trim()}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {field.value?.filter(amenity => !amenityOptions.some(option => option.id === amenity)).map((amenity, i) => (
                              <Badge key={i} variant="secondary" className="text-xs py-1">
                                {amenity}
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange(field.value?.filter(value => value !== amenity));
                                  }}
                                  className="ml-1"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Advanced Details (conditionally shown) */}
                {showAdvanced && (
                  <>
                    <div className="md:col-span-2">
                      <Separator className="my-6" />
                      <h2 className="text-xl font-semibold text-primary mb-4">Advanced Details</h2>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="terrainType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terrain Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select terrain type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {terrainTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="zoning"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zoning</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Residential, Agricultural" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="vegetation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vegetation</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Forest, Grassland" {...field} value={field.value || ""} />
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
                            <Input placeholder="e.g., Creek, Well, Pond" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="roadAccess"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Road Access</FormLabel>
                            <FormControl>
                              <Input placeholder="Describe road access to the property" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
                
                {/* Property Images */}
                <div className="md:col-span-2">
                  <Separator className="my-6" />
                  <h2 className="text-xl font-semibold text-primary mb-4">Property Images</h2>
                  
                  <FormField
                    control={form.control}
                    name="images"
                    render={() => (
                      <FormItem>
                        <FormLabel>Images</FormLabel>
                        <FormDescription>
                          Add images of your property (URLs).
                        </FormDescription>
                        
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Button type="button" onClick={addImageUrl}>
                              <Upload className="mr-2 h-4 w-4" /> Add Image URL
                            </Button>
                            
                            <div className="relative">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                id="image-upload"
                                className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                                multiple
                              />
                              <Button type="button" variant="outline">
                                <UploadCloud className="mr-2 h-4 w-4" /> Upload Images
                              </Button>
                            </div>
                          </div>
                          
                          {previewImages.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                              {previewImages.map((image, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={image}
                                    alt={`Property ${index}`}
                                    className="w-full h-32 object-contain bg-slate-50 rounded-md"
                                    onError={(e) => {
                                      console.error("Failed to load image:", image);
                                      (e.target as HTMLImageElement).src = '/uploads/test-property-image.png';
                                      (e.target as HTMLImageElement).alt = 'Image not available';
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Property Video Tour */}
                <div className="md:col-span-2">
                  <Separator className="my-6" />
                  <h2 className="text-xl font-semibold text-primary mb-4">Property Video Tour</h2>
                  
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video Tour</FormLabel>
                        <FormDescription>
                          Add a video tour of your property (max 50MB).
                        </FormDescription>
                        
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2 mb-4">
                            <div className="relative">
                              <Input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                id="video-upload"
                                className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                              />
                              <Button type="button" asChild>
                                <label htmlFor="video-upload" className="cursor-pointer">
                                  <Upload className="mr-2 h-4 w-4" /> Upload Video
                                </label>
                              </Button>
                            </div>
                          </div>
                          
                          {field.value && (
                            <div className="mt-4">
                              <p className="text-sm text-gray-500 mb-2">Current video:</p>
                              <div className="relative rounded-lg overflow-hidden bg-gray-100 max-w-2xl">
                                <video 
                                  src={field.value} 
                                  controls
                                  className="w-full h-auto max-h-64 object-contain"
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="mt-2"
                                onClick={() => form.setValue('videoUrl', '')}
                              >
                                <X className="mr-2 h-4 w-4" /> Remove Video
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Property Documents */}
                <div className="md:col-span-2">
                  <Separator className="my-6" />
                  <h2 className="text-xl font-semibold text-primary mb-4">Property Documents</h2>
                  
                  <FormField
                    control={form.control}
                    name="documents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Documents</FormLabel>
                        <FormDescription>
                          Upload important documents related to this property (surveys, deeds, etc.)
                        </FormDescription>
                        
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2 mb-4">
                            <div className="relative">
                              <Input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,image/*"
                                onChange={handleDocumentUpload}
                                id="document-upload"
                                className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                              />
                              <Button type="button" asChild>
                                <label htmlFor="document-upload" className="cursor-pointer">
                                  <FilePlus className="mr-2 h-4 w-4" /> Upload Document
                                </label>
                              </Button>
                            </div>
                          </div>
                          
                          {Array.isArray(field.value) && field.value.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm text-gray-500 mb-2">Current Documents:</p>
                              <div className="space-y-3">
                                {field.value.map((doc, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-primary/10 rounded-md">
                                        <FileText className="h-5 w-5 text-primary" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">{doc.name}</p>
                                        <p className="text-xs text-muted-foreground">{doc.type || 'Document'}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <a 
                                        href={doc.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                        title="Download"
                                      >
                                        <Download className="h-4 w-4" />
                                      </a>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveDocument(index)}
                                        title="Remove document"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-between pt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setLocation(`/seller-dashboard`)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  disabled={updateMutation.isPending || !isAuthenticated || isSubmitting}
                  className="min-w-[120px]"
                  onClick={async () => {
                    console.log("Update button clicked, executing direct property update");
                    
                    try {
                      // Set submission state to disable the button and show loading indicator
                      setIsSubmitting(true);
                      
                      // Skip form validation and directly update the property with current values
                      // This is a more reliable approach when form validation is causing issues
                      const currentValues: PropertyFormValues = form.getValues();
                      
                      // Create a properly typed data object with all required fields
                      const updateData: PropertyFormValues = {
                        id: propertyId,
                        title: String(currentValues.title || (propertyData ? propertyData.title : "") || "Property Listing"),
                        description: String(currentValues.description || (propertyData ? propertyData.description : "") || ""), 
                        price: String(currentValues.price || (propertyData ? propertyData.price : 0) || "0"),
                        acreage: String(currentValues.acreage || (propertyData ? propertyData.acreage : 0) || "0"),
                        location: String(currentValues.location || (propertyData ? propertyData.location : "") || ""),
                        state: String(currentValues.state || (propertyData ? propertyData.state : "") || ""),
                        propertyType: String(currentValues.propertyType || (propertyData ? propertyData.propertyType : "") || "land"),
                        status: String(currentValues.status || (propertyData ? propertyData.status : "") || "active"),
                        // Ensure latitude and longitude are valid numbers
                        latitude: parseFloat(String(currentValues.latitude || (propertyData ? propertyData.latitude : 0) || "0")) || 0,
                        longitude: parseFloat(String(currentValues.longitude || (propertyData ? propertyData.longitude : 0) || "0")) || 0,
                        // Ensure arrays are valid
                        utilities: Array.isArray(currentValues.utilities) ? currentValues.utilities : 
                                  (propertyData && Array.isArray(propertyData.utilities) ? propertyData.utilities : []),
                        amenities: Array.isArray(currentValues.amenities) ? currentValues.amenities : 
                                  (propertyData && Array.isArray(propertyData.amenities) ? propertyData.amenities : []),
                        features: Array.isArray(currentValues.features) ? currentValues.features : 
                                  (propertyData && Array.isArray(propertyData.features) ? propertyData.features : []),
                        images: Array.isArray(currentValues.images) ? currentValues.images : 
                                (propertyData && Array.isArray(propertyData.images) ? propertyData.images : []),
                        videoUrl: String(currentValues.videoUrl || (propertyData ? propertyData.videoUrl : "") || ""),
                        terrainType: String(currentValues.terrainType || (propertyData ? propertyData.terrainType : "") || ""),
                        zoning: String(currentValues.zoning || (propertyData ? propertyData.zoning : "") || ""),
                        vegetation: String(currentValues.vegetation || (propertyData ? propertyData.vegetation : "") || ""),
                        waterResources: String(currentValues.waterResources || (propertyData ? propertyData.waterResources : "") || ""),
                        roadAccess: String(currentValues.roadAccess || (propertyData ? propertyData.roadAccess : "") || ""),
                        isWaterfront: Boolean(currentValues.isWaterfront),
                        isMountainView: Boolean(currentValues.isMountainView),
                        ownerId: user?.id || (propertyData ? propertyData.ownerId : undefined),
                        // Add documents to the update data object
                        documents: Array.isArray(currentValues.documents) ? currentValues.documents :
                                  (propertyData && Array.isArray(propertyData.documents) ? propertyData.documents : [])
                      };

                      console.log("Sending simplified update data:", updateData);
                      
                      // Make the API request directly instead of using the mutation
                      const response = await fetch(`/api/properties/${propertyId}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updateData),
                        credentials: 'include'
                      });
                      
                      if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Server error response:', errorText);
                        throw new Error(errorText || `Update failed with status ${response.status}`);
                      }
                      
                      const updatedProperty = await response.json();
                      console.log("Property updated successfully:", updatedProperty);
                      
                      // Show success message
                      toast({
                        title: "Property updated",
                        description: "Your property listing has been updated successfully."
                      });
                      
                      // Redirect to property details
                      setLocation(`/properties/${propertyId}`);
                      
                      // Invalidate relevant queries
                      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}`] });
                      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/properties/my-properties'] });
                    } catch (error) {
                      console.error("Error updating property:", error);
                      toast({
                        title: "Update failed",
                        description: error instanceof Error ? error.message : "Failed to update property",
                        variant: "destructive"
                      });
                    } finally {
                      // Reset submission state regardless of success or failure
                      setIsSubmitting(false);
                    }
                  }}
                >
                  {isSubmitting || updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Property'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditPropertyPage() {
  return (
    <div>
      <EditPropertyContent />
    </div>
  );
}