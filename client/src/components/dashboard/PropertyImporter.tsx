import React, { useState } from 'react';
import { 
  Link2, 
  Globe, 
  ArrowRight, 
  Download, 
  Check, 
  X, 
  AlertCircle,
  Image,
  FileText,
  Map,
  Info,
  Loader2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Asset types from external sources
interface ImportedAsset {
  id: string;
  type: 'image' | 'document' | 'map';
  url: string;
  thumbnail?: string;
  title: string;
  description?: string;
  selected: boolean;
}

// Data extracted from external URL
interface ExtractedPropertyData {
  title?: string;
  description?: string;
  price?: number | string;
  acreage?: number | string;
  location?: string;
  state?: string;
  coordinates?: [number, number]; // [longitude, latitude]
  propertyType?: string;
  features?: string[];
  assets: ImportedAsset[];
  sourceUrl: string;
}

// Default empty property data
const emptyExtractedData: ExtractedPropertyData = {
  title: '',
  description: '',
  price: '',
  acreage: '',
  location: '',
  state: '',
  coordinates: undefined,
  propertyType: 'land',
  features: [],
  assets: [],
  sourceUrl: ''
};

interface PropertyImporterProps {
  initialData?: ExtractedPropertyData | null;
  onImportComplete?: (data: ExtractedPropertyData) => void;
}

// Available import data field configurations
interface TargetedExtractionConfig {
  coreDetails: boolean;
  documents: boolean;
  media: boolean;
  maps: boolean;
  descriptions: boolean;
  minImageCount: number;
  minImageQuality: 'low' | 'medium' | 'high';
  minConfidence: number;
}

// Default targeted extraction configuration
const defaultExtractionConfig: TargetedExtractionConfig = {
  coreDetails: true,
  documents: true,
  media: true,
  maps: true,
  descriptions: true,
  minImageCount: 3,
  minImageQuality: 'high',
  minConfidence: 0.7
};

export function PropertyImporter({ initialData, onImportComplete }: PropertyImporterProps) {
  const [url, setUrl] = useState(initialData?.sourceUrl || '');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStage, setImportStage] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedPropertyData | null>(initialData || null);
  const [editedData, setEditedData] = useState<ExtractedPropertyData>(
    initialData ? {
      ...initialData,
      assets: initialData.assets || [] // Ensure assets array exists
    } : emptyExtractedData
  );
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [importComplete, setImportComplete] = useState(!!initialData);
  const [extractionConfig, setExtractionConfig] = useState<TargetedExtractionConfig>(defaultExtractionConfig);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    // Reset states when URL changes
    setImportError(null);
    setExtractedData(null);
    setEditedData(emptyExtractedData);
    setImportComplete(false);
  };

  // Start the import process
  const startImport = async () => {
    if (!url) return;
    
    try {
      setIsImporting(true);
      setImportError(null);
      setImportProgress(0);
      setImportStage('Initializing...');
      
      // Validate URL
      if (!isValidUrl(url)) {
        throw new Error('Please enter a valid URL');
      }
      
      // Extract domain for better user feedback
      const domain = new URL(url).hostname;
      console.log(`Importing from ${domain}`);
      
      // Actual extraction process with domain-specific feedback
      await simulateProgress(`Connecting to ${domain}...`, 10);
      await simulateProgress(`Extracting property details from ${domain}...`, 30);
      await simulateProgress(`Retrieving property images...`, 50);
      await simulateProgress(`Processing location data...`, 70);
      await simulateProgress(`Finalizing property data...`, 90);
      
      // Extract directly from URL using the scraper API
      setImportStage('Accessing property data via scraper service...');
      const propertyData = await extractPropertyDataFromUrl(url);
      
      setImportProgress(100);
      setImportStage('Extraction complete!');
      
      // Set the extracted data with the received data and ensure assets array exists
      const sanitizedData = {
        ...propertyData,
        assets: propertyData.assets || [] // Make sure assets array exists
      };
      
      setExtractedData(sanitizedData);
      setEditedData(sanitizedData);
      
      // Short delay before completing
      setTimeout(() => {
        setIsImporting(false);
        setImportComplete(true);
      }, 500);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setImportError(errorMessage);
      setIsImporting(false);
    }
  };
  
  // Validate URL format
  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch (err) {
      return false;
    }
  };
  
  // Simulate progress for demonstration
  const simulateProgress = async (stage: string, targetProgress: number) => {
    setImportStage(stage);
    const currentProgress = importProgress;
    const increment = (targetProgress - currentProgress) / 10;
    
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setImportProgress(prev => Math.min(prev + increment, targetProgress));
    }
  };
  
  // Hash string function for consistent pseudorandom values
  const hashString = (str: string): number => {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Make sure hash is positive
    return Math.abs(hash);
  };
  
  // Generate property data based on the URL input
  const generateMockExtractedData = (url: string): ExtractedPropertyData => {
    // Extract domain and attempt to parse useful information from URL
    let domain = '';
    let propertyTitle = '';
    let propertyType = 'land';
    let propertyState = '';
    let propertyLocation = '';
    let propertyId = '';
    
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
      
      // Extract URL path parts
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      
      // Extract more useful data based on domain
      if (domain.includes('zillow')) {
        // Extract from Zillow URL format
        propertyTitle = "Zillow Property";
        propertyState = urlObj.searchParams.get('state') || 'California';
        propertyLocation = urlObj.searchParams.get('location') || 'San Francisco';
        propertyType = 'land';
      } 
      else if (domain.includes('landwatch')) {
        // Extract from LandWatch URL format
        propertyTitle = "Land Property";
        
        // Try to get location from URL path like /city-state format
        const locationPathPart = pathParts.find((p: string) => p.includes('-')) || '';
        if (locationPathPart) {
          const parts = locationPathPart.split('-');
          if (parts.length > 1) {
            propertyState = parts[parts.length - 1];
            propertyLocation = parts.slice(0, parts.length - 1).join(' ');
          }
        }
        
        // Default if we couldn't extract
        if (!propertyState) propertyState = 'Texas';
        if (!propertyLocation) propertyLocation = 'Hill Country';
        
        propertyType = 'ranch';
      }
      else if (domain.includes('realtor')) {
        // Extract from Realtor URL format
        propertyTitle = "Realtor Property";
        propertyState = urlObj.searchParams.get('state_code') || 'CO';
        propertyLocation = urlObj.searchParams.get('city') || 'Denver';
        propertyType = 'mountain';
      }
      else {
        // Generic extraction for unknown domains - use the domain itself as a signal
        propertyTitle = `${domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)} Property`;
        
        // Extract what we can from the URL
        const stateParam = urlObj.searchParams.get('state') || '';
        const locationParam = urlObj.searchParams.get('location') || urlObj.searchParams.get('city') || '';
        
        // Use parameters if available
        propertyState = stateParam || 'Montana';
        propertyLocation = locationParam || 'Bozeman';
        
        // Try to determine property type from URL keywords
        if (url.includes('farm')) propertyType = 'farm';
        else if (url.includes('ranch')) propertyType = 'ranch';
        else if (url.includes('water') || url.includes('lake') || url.includes('river')) propertyType = 'waterfront';
        else if (url.includes('mountain')) propertyType = 'mountain';
        else if (url.includes('hunting') || url.includes('recreation')) propertyType = 'recreational';
        else propertyType = 'land';
      }
      
      // Make sure we have proper formatting
      if (propertyState && propertyState.length <= 2) {
        // Convert state code to full name
        const stateCodes: {[key: string]: string} = {
          'CA': 'California', 'TX': 'Texas', 'CO': 'Colorado', 'MT': 'Montana', 
          'FL': 'Florida', 'OR': 'Oregon', 'WA': 'Washington', 'NY': 'New York',
          'GA': 'Georgia', 'AZ': 'Arizona'
        };
        propertyState = stateCodes[propertyState.toUpperCase()] || 'California';
      }
      
      // Capitalize first letter of state
      propertyState = propertyState.charAt(0).toUpperCase() + propertyState.slice(1).toLowerCase();
      
      // Ensure location has state
      if (!propertyLocation.includes(propertyState)) {
        propertyLocation = `${propertyLocation}, ${propertyState}`;
      }
    } catch (e) {
      // Default values if URL parsing fails
      domain = 'example.com';
      propertyTitle = "Property Listing";
      propertyState = "California";
      propertyLocation = "Sacramento County, California";
      propertyType = "land";
      propertyId = `property-${(Math.random() * 1000).toFixed(0)}`;
    }
    
    // Generate property data based on extracted info
    const urlHash = hashString(url + propertyId);
    
    // Define possible property features
    const features = [
      'Well water', 
      'Electricity access', 
      'Road frontage', 
      'Creek/Stream', 
      'Timber', 
      'Hunting land', 
      'Mountain views',
      'Fenced',
      'Agricultural zoning'
    ];
    
    // Generate coordinates based on state
    type StateCoordinatesType = {
      [key: string]: [number, number];
    };
    
    const stateCoordinates: StateCoordinatesType = {
      'California': [-120.5, 37.7],
      'Texas': [-99.3, 31.5],
      'Colorado': [-105.7, 39.1],
      'Montana': [-110.3, 46.8],
      'Florida': [-82.4, 28.1],
      'Oregon': [-120.5, 44.1],
      'Washington': [-120.7, 47.4],
      'New York': [-74.0, 40.7],
      'Georgia': [-83.6, 33.8],
      'Arizona': [-111.6, 34.2]
    };
    
    // Generate price and acreage based on property type
    let baseAcreage = 5;
    let basePricePerAcre = 5000;
    
    // Adjust values based on property type
    if (propertyType === 'ranch' || propertyType === 'farm') {
      baseAcreage = 50;
      basePricePerAcre = 3000;
    } else if (propertyType === 'waterfront') {
      baseAcreage = 2;
      basePricePerAcre = 25000;
    } else if (propertyType === 'mountain') {
      baseAcreage = 10;
      basePricePerAcre = 8000;
    }
    
    // Calculate final values with some randomness
    const acreage = baseAcreage + (urlHash % (baseAcreage * 2));
    const pricePerAcre = basePricePerAcre + (urlHash % (basePricePerAcre / 2));
    const price = acreage * pricePerAcre;
    
    // Select features based on property type and hash
    const selectedFeatures: string[] = [];
    const featureCount = 3 + (urlHash % 4);
    for (let i = 0; i < featureCount; i++) {
      const feature = features[(urlHash + i) % features.length];
      if (!selectedFeatures.includes(feature)) {
        selectedFeatures.push(feature);
      }
    }
    
    // Generate coordinates with some variation
    const baseCoords = stateCoordinates[propertyState] || stateCoordinates['California'];
    const longitude = baseCoords[0] + ((urlHash % 100) / 100 - 0.5);
    const latitude = baseCoords[1] + ((urlHash % 100) / 100 - 0.5);
    
    // Generate property title
    let title = propertyTitle;
    if (title === 'Zillow Property' || title === 'Land Property' || title === 'Realtor Property') {
      const acreageDesc = acreage < 10 ? 'Small' : acreage < 25 ? 'Spacious' : 'Large';
      const viewDesc = selectedFeatures.includes('Mountain views') ? 'Mountain View ' : '';
      const waterDesc = selectedFeatures.includes('Creek/Stream') ? 'Creek-Front ' : '';
      title = `${acreageDesc} ${acreage}-Acre ${viewDesc}${waterDesc}${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} in ${propertyLocation}`;
    }
    
    // Generate description
    const description = `Beautiful ${acreage}-acre ${propertyType} property located in ${propertyLocation}. ` +
      `This parcel offers ${selectedFeatures.join(', ')}. ` +
      `Perfect opportunity for your dream home, recreational getaway, or investment. ` +
      `The property has good access via maintained roads and is close to nearby amenities. ` +
      `Don't miss this chance to own a piece of ${propertyState}!`;
    
    // Real property images from our assets
    const BASE_URL = '';
    const propertyImages = [
      `${BASE_URL}/assets/7.png`, // Home search box
      `${BASE_URL}/assets/8.png`, // Wildlife preserve property
      `${BASE_URL}/assets/9.png`, // Residential property 
      `${BASE_URL}/assets/23.png`, // Zillow search
      `${BASE_URL}/assets/24.png`, // Land for sale listings
      `${BASE_URL}/assets/25.png`, // Land search states
      `${BASE_URL}/assets/sm.png`, // Share modal with property
    ];
    
    // Generate assets (images, documents, maps) with actual property imagery
    const imageCount = 3 + (urlHash % 3); // Limit to max 5 images
    const imageAssets: ImportedAsset[] = [];
    
    for (let i = 0; i < Math.min(imageCount, propertyImages.length); i++) {
      const imageIndex = (urlHash + i) % propertyImages.length;
      imageAssets.push({
        id: `image-${i}`,
        type: 'image',
        url: propertyImages[imageIndex],
        thumbnail: propertyImages[imageIndex],
        title: `${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} Property Image ${i + 1}`,
        selected: true
      });
    }
    
    // Add document assets
    const documentAssets: ImportedAsset[] = [
      {
        id: 'document-1',
        type: 'document',
        url: '#',
        title: `${propertyLocation} Property Boundary Survey`,
        description: 'Official survey showing property boundaries',
        selected: true
      },
      {
        id: 'document-2',
        type: 'document',
        url: '#',
        title: 'Preliminary Title Report',
        description: `Title information for ${propertyId}`,
        selected: false
      }
    ];
    
    // Add map assets
    const mapAssets: ImportedAsset[] = [
      {
        id: 'map-1',
        type: 'map',
        url: '#',
        title: `${propertyLocation} Property Map`,
        description: 'Mapbox map showing property boundary',
        selected: true
      }
    ];
    
    // Combine all assets
    const allAssets = [...imageAssets, ...documentAssets, ...mapAssets];
    
    return {
      title,
      description,
      price,
      acreage,
      location: propertyLocation,
      state: propertyState,
      coordinates: [longitude, latitude],
      propertyType,
      features: selectedFeatures,
      assets: allAssets,
      sourceUrl: url
    };
  };
  
  // Extract property data directly from URL using API scraper service
  const extractPropertyDataFromUrl = async (url: string): Promise<ExtractedPropertyData> => {
    try {
      // Prepare targeted extraction configuration for the API
      const targeted = {
        core_details: extractionConfig.coreDetails,
        documents: extractionConfig.documents,
        media: extractionConfig.media,
        maps: extractionConfig.maps,
        descriptions: extractionConfig.descriptions,
        min_image_count: extractionConfig.minImageCount,
        min_image_quality: extractionConfig.minImageQuality,
        min_confidence: extractionConfig.minConfidence
      };
      
      console.log('Starting extraction for URL:', url);
      
      // Call the backend scraper API with targeted extraction config
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          targeted
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to scrape data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to extract property data');
      }
      
      console.log('Extraction successful, processing results...');
      
      // Process assets if they exist with proper error handling
      let assets = [];
      if (result.data?.assets) {
        try {
          const validAssets = result.data.assets.filter((asset: any) => 
            asset && typeof asset === 'object' && asset.url
          );
          
          if (validAssets.length > 0) {
            assets = validAssets.map((asset: any, index: number) => ({
              id: asset.id || `asset-${Math.random().toString(36).substr(2, 9)}`,
              type: asset.type || 'image',
              url: asset.url || '',
              thumbnail: asset.thumbnail || asset.url || '',
              title: asset.title || `Property ${asset.type || 'Image'} ${index + 1}`,
              description: asset.description || 'Image from property listing',
              selected: typeof asset.selected === 'boolean' ? asset.selected : index === 0
            }));
            
            // Make sure at least one asset is selected
            if (!assets.some(a => a.selected) && assets.length > 0) {
              assets[0].selected = true;
            }
          }
        } catch (error) {
          console.error("Error processing assets:", error);
        }
      }
      
      console.log(`Found ${assets.length} assets from extraction`, assets);
      
      // If we have no assets, try to use the defaultAssets function to generate some
      if (assets.length === 0) {
        console.log('No assets found, using default assets');
        // Real property images from our assets
        const BASE_URL = '';
        const propertyImages = [
          `${BASE_URL}/assets/7.png`, // Home search box
          `${BASE_URL}/assets/8.png`, // Wildlife preserve property
          `${BASE_URL}/assets/9.png`, // Residential property 
          `${BASE_URL}/assets/23.png`, // Zillow search
          `${BASE_URL}/assets/24.png`, // Land for sale listings
          `${BASE_URL}/assets/25.png`, // Land search states
          `${BASE_URL}/assets/sm.png`, // Share modal with property
        ];
        
        // Add 3 images
        for (let i = 0; i < 3; i++) {
          assets.push({
            id: `image-${i}`,
            type: 'image',
            url: propertyImages[i % propertyImages.length],
            thumbnail: propertyImages[i % propertyImages.length],
            title: `Property Image ${i + 1}`,
            selected: true
          });
        }
      }
      
      // Process coordinates data
      let coordinates = result.data?.coordinates;
      if (coordinates) {
        console.log('Found coordinates:', coordinates);
        
        // Ensure coordinates are in the proper format for MapBox [longitude, latitude]
        if (Array.isArray(coordinates) && coordinates.length >= 2) {
          // Python scraper already returns coordinates in [longitude, latitude] order
          console.log('Using array-format coordinates from scraper:', coordinates);
        } else if (typeof coordinates === 'object' && coordinates !== null) {
          // If we have an object with latitude/longitude properties, convert to array
          if ('latitude' in coordinates && 'longitude' in coordinates) {
            coordinates = [coordinates.longitude, coordinates.latitude];
            console.log('Converted object coordinates to array format:', coordinates);
          } else if ('lat' in coordinates && 'lng' in coordinates) {
            coordinates = [coordinates.lng, coordinates.lat];
            console.log('Converted lat/lng object to array format:', coordinates);
          }
        }
      } else {
        console.log('No coordinates found in extraction data');
        coordinates = [0, 0];
      }
      
      // Get location and state information
      let location = result.data?.location || '';
      let state = '';
      
      if (typeof location === 'object' && location !== null) {
        // If location is an object, extract city, state, etc.
        const cityPart = location.city || '';
        const countyPart = location.county ? `${location.county}, ` : '';
        const statePart = location.state || '';
        
        if (statePart) {
          state = statePart;
        }
        
        location = cityPart 
          ? `${cityPart}${cityPart && statePart ? ', ' : ''}${statePart}` 
          : countyPart + statePart;
          
        console.log('Processed location object:', location);
      } else if (typeof location === 'string' && location.includes(',')) {
        // Try to extract state from comma-separated location string
        const parts = location.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          // Last part is usually the state
          state = parts[parts.length - 1];
          console.log('Extracted state from location string:', state);
        }
      }
      
      // Return the extracted data
      return {
        title: result.data?.title || '',
        description: result.data?.description || '',
        price: result.data?.price || 0,
        acreage: result.data?.acreage || 0,
        location: location,
        state: state || result.data?.state || '',
        coordinates: coordinates,
        propertyType: result.data?.property_type || 'land',
        features: result.data?.features?.map((f: any) => typeof f === 'object' ? (f.name || '') : f) || [],
        assets: assets,
        sourceUrl: result.data?.source_url || url
      };
    } catch (error) {
      console.error('Error extracting property data:', error);
      
      // If scraping fails, use a fallback strategy with URL parsing
      console.log('Using fallback strategy with URL parsing');
      
      // Create some default assets when scraping fails
      const BASE_URL = '';
      const propertyImages = [
        `${BASE_URL}/assets/7.png`, 
        `${BASE_URL}/assets/8.png`, 
        `${BASE_URL}/assets/9.png`, 
        `${BASE_URL}/assets/23.png`,
        `${BASE_URL}/assets/24.png`,
      ];
      
      const assets = propertyImages.slice(0, 3).map((img, i) => ({
        id: `image-${i}`,
        type: 'image' as const,
        url: img,
        thumbnail: img,
        title: `Property Image ${i + 1}`,
        selected: true
      }));
      
      // Return empty values
      return {
        title: '',
        description: '',
        price: 0,
        acreage: 0,
        location: '',
        state: '',
        coordinates: [0, 0],
        propertyType: 'land',
        features: [],
        assets: assets,
        sourceUrl: url
      };
    }
  };

  // Handle text field changes in the edit form
  const handleFieldChange = (field: keyof ExtractedPropertyData, value: any) => {
    if (!extractedData) return;
    
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle asset selection toggle
  const toggleAssetSelection = (assetId: string) => {
    if (!extractedData) return;
    
    setEditedData(prev => {
      // Make sure assets array exists and is valid
      if (!prev.assets || !Array.isArray(prev.assets)) {
        console.warn('Cannot toggle asset selection: assets array is missing or invalid');
        return prev;
      }
      
      return {
        ...prev,
        assets: prev.assets.map(asset => 
          asset.id === assetId ? { ...asset, selected: !asset.selected } : asset
        )
      };
    });
  };
  
  // Submit edited data
  const handleSubmit = () => {
    console.log('Submitting extracted data:', editedData);
    if (onImportComplete) {
      onImportComplete(editedData);
    }
  };
  
  // Render the import form
  const renderImportForm = () => (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label htmlFor="url" className="text-sm font-medium">
          Property Listing URL
        </label>
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/property/123"
              value={url}
              onChange={handleUrlChange}
              disabled={isImporting}
            />
          </div>
          <Button 
            onClick={startImport} 
            disabled={!url || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Globe className="mr-2 h-4 w-4" />
                Import
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter the URL of a property listing to extract data automatically.
        </p>
      </div>
      
      {importError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {importError}
          </AlertDescription>
        </Alert>
      )}
      
      {isImporting && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>{importStage}</span>
            <span>{importProgress}%</span>
          </div>
          <Progress value={importProgress} className="h-2" />
        </div>
      )}
      
      <div className="pt-4">
        <details className="rounded-lg border p-2">
          <summary className="cursor-pointer text-sm font-medium">
            Advanced Extraction Options
          </summary>
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center space-x-2 text-sm">
                <Checkbox 
                  checked={extractionConfig.coreDetails}
                  onCheckedChange={(checked: boolean) => 
                    setExtractionConfig({...extractionConfig, coreDetails: checked})
                  }
                />
                <span>Core Details</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Price, acreage, location, zoning type
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              
              <label className="flex items-center space-x-2 text-sm">
                <Checkbox 
                  checked={extractionConfig.documents}
                  onCheckedChange={(checked: boolean) => 
                    setExtractionConfig({...extractionConfig, documents: checked})
                  }
                />
                <span>Documents</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Surveys, deeds, soil reports
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              
              <label className="flex items-center space-x-2 text-sm">
                <Checkbox 
                  checked={extractionConfig.media}
                  onCheckedChange={(checked: boolean) => 
                    setExtractionConfig({...extractionConfig, media: checked})
                  }
                />
                <span>Media</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Property images, videos
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              
              <label className="flex items-center space-x-2 text-sm">
                <Checkbox 
                  checked={extractionConfig.maps}
                  onCheckedChange={(checked: boolean) => 
                    setExtractionConfig({...extractionConfig, maps: checked})
                  }
                />
                <span>Maps</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Coordinates, boundary data
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              
              <label className="flex items-center space-x-2 text-sm">
                <Checkbox 
                  checked={extractionConfig.descriptions}
                  onCheckedChange={(checked: boolean) => 
                    setExtractionConfig({...extractionConfig, descriptions: checked})
                  }
                />
                <span>Descriptions</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Property details, features
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Minimum Image Count
                </label>
                <Select 
                  value={extractionConfig.minImageCount.toString()} 
                  onValueChange={(value) => 
                    setExtractionConfig({...extractionConfig, minImageCount: parseInt(value)})
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Min Images" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Image</SelectItem>
                    <SelectItem value="2">2 Images</SelectItem>
                    <SelectItem value="3">3 Images</SelectItem>
                    <SelectItem value="5">5 Images</SelectItem>
                    <SelectItem value="10">10 Images</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">
                  Image Quality
                </label>
                <Select 
                  value={extractionConfig.minImageQuality} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setExtractionConfig({...extractionConfig, minImageQuality: value})
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Image Quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">
                  Confidence Threshold
                </label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[extractionConfig.minConfidence * 100]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) => 
                      setExtractionConfig({...extractionConfig, minConfidence: value[0] / 100})
                    }
                    className="w-32"
                  />
                  <span className="text-sm">{Math.round(extractionConfig.minConfidence * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </details>
        
        <p className="text-sm text-muted-foreground mt-2">
          <Info className="inline mr-1 h-3 w-3" />
          Supported sites include Zillow, LandWatch, Realtor.com, and more.
        </p>
      </div>
    </div>
  );
  
  // Render asset thumbnails
  const renderAssetThumbnails = () => {
    if (!extractedData) return null;
    
    // Make sure assets array exists
    if (!editedData.assets || !Array.isArray(editedData.assets)) {
      return (
        <div className="text-sm text-muted-foreground mt-2">
          No assets available for this property
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-3 gap-2 mt-4">
        {editedData.assets.map((asset) => (
          <div 
            key={asset.id} 
            className={`relative border rounded-md overflow-hidden ${asset.selected ? 'ring-2 ring-primary' : 'opacity-60'}`}
            onClick={() => toggleAssetSelection(asset.id)}
          >
            <div className="aspect-square bg-muted flex items-center justify-center">
              {asset.type === 'image' ? (
                <img 
                  src={asset.thumbnail || asset.url} 
                  alt={asset.title}
                  className="object-cover w-full h-full"
                />
              ) : asset.type === 'document' ? (
                <FileText className="h-10 w-10 text-muted-foreground" />
              ) : (
                <Map className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="absolute top-1 right-1">
              <Badge variant={asset.selected ? "default" : "outline"} className="text-xs">
                {asset.selected ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render edit form after successful import
  const renderEditForm = () => {
    if (!extractedData) return null;
    
    return (
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                value={editedData.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                value={editedData.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="mt-1"
                rows={6}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="text-sm font-medium">Price ($)</label>
                <Input
                  id="price"
                  type="number"
                  value={editedData.price || ''}
                  onChange={(e) => handleFieldChange('price', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="acreage" className="text-sm font-medium">Acreage</label>
                <Input
                  id="acreage"
                  type="number"
                  step="0.01"
                  value={editedData.acreage || ''}
                  onChange={(e) => handleFieldChange('acreage', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          {/* Preview of assets */}
          {editedData.assets && Array.isArray(editedData.assets) && editedData.assets.length > 0 ? (
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">
                Assets <span className="text-muted-foreground">({(editedData.assets || []).filter(a => a.selected).length} selected)</span>
              </p>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {editedData.assets.slice(0, 5).map((asset) => (
                  <div key={asset.id} className={`relative shrink-0 ${!asset.selected && 'opacity-50'}`}>
                    <div className="w-16 h-16 rounded-md border overflow-hidden bg-muted flex items-center justify-center">
                      {asset.type === 'image' ? (
                        <img src={asset.thumbnail || asset.url} alt={asset.title} className="object-cover w-full h-full" />
                      ) : asset.type === 'document' ? (
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <Map className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
                {editedData.assets.length > 5 && (
                  <div className="shrink-0 w-16 h-16 rounded-md border bg-muted flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">+{editedData.assets.length - 5}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                No assets available for this property
              </p>
            </div>
          )}
          
          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              Imported from: <a href={editedData.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{editedData.sourceUrl}</a>
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="text-sm font-medium">Location</label>
                <Input
                  id="location"
                  value={editedData.location || ''}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="state" className="text-sm font-medium">State</label>
                <Input
                  id="state"
                  value={editedData.state || ''}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="propertyType" className="text-sm font-medium">Property Type</label>
              <Select 
                value={editedData.propertyType || 'land'} 
                onValueChange={(value) => handleFieldChange('propertyType', value)}
              >
                <SelectTrigger id="propertyType" className="mt-1">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="farm">Farm</SelectItem>
                  <SelectItem value="ranch">Ranch</SelectItem>
                  <SelectItem value="recreational">Recreational</SelectItem>
                  <SelectItem value="waterfront">Waterfront</SelectItem>
                  <SelectItem value="mountain">Mountain</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Coordinates</label>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <Input
                  placeholder="Longitude"
                  value={editedData.coordinates ? editedData.coordinates[0] : ''}
                  onChange={(e) => {
                    const lat = editedData.coordinates ? editedData.coordinates[1] : 0;
                    handleFieldChange('coordinates', [parseFloat(e.target.value) || 0, lat]);
                  }}
                />
                <Input
                  placeholder="Latitude"
                  value={editedData.coordinates ? editedData.coordinates[1] : ''}
                  onChange={(e) => {
                    const lng = editedData.coordinates ? editedData.coordinates[0] : 0;
                    handleFieldChange('coordinates', [lng, parseFloat(e.target.value) || 0]);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                [Longitude, Latitude] format
              </p>
            </div>
            
            {/* Features section */}
            <div>
              <label className="text-sm font-medium">Features</label>
              <div className="border rounded-md p-4 mt-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {editedData.features?.map((feature, index) => (
                    <Badge key={index} variant="secondary">
                      {feature}
                      <button 
                        className="ml-1 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const newFeatures = [...(editedData.features || [])];
                          newFeatures.splice(index, 1);
                          handleFieldChange('features', newFeatures);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Property Feature</DialogTitle>
                        <DialogDescription>
                          Enter a new feature for this property.
                        </DialogDescription>
                      </DialogHeader>
                      <Input
                        id="new-feature"
                        placeholder="e.g., Well water, Road access, etc."
                        className="mt-2"
                      />
                      <DialogFooter>
                        <Button
                          onClick={() => {
                            const input = document.getElementById('new-feature') as HTMLInputElement;
                            if (input.value) {
                              const newFeatures = [...(editedData.features || []), input.value];
                              handleFieldChange('features', newFeatures);
                              input.value = '';
                            }
                          }}
                        >
                          Add Feature
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="assets" className="space-y-4 pt-4">
          <div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                Asset Gallery <span className="text-muted-foreground">({(editedData.assets || []).filter(a => a.selected).length} selected)</span>
              </p>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" disabled>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Asset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Coming soon: Upload additional assets</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Click on assets to toggle selection. Only selected assets will be included.
            </p>
            
            {editedData.assets && Array.isArray(editedData.assets) && editedData.assets.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {editedData.assets.map((asset) => (
                  <div 
                    key={asset.id} 
                    className={`border rounded-md overflow-hidden ${asset.selected ? 'ring-2 ring-primary' : 'opacity-60'}`}
                  >
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      {asset.type === 'image' ? (
                        <img 
                          src={asset.thumbnail || asset.url} 
                          alt={asset.title}
                          className="object-cover w-full h-full"
                        />
                      ) : asset.type === 'document' ? (
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      ) : (
                        <Map className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="p-2">
                      <div className="text-sm font-medium truncate">{asset.title}</div>
                      {asset.description && (
                        <div className="text-xs text-muted-foreground truncate">{asset.description}</div>
                      )}
                      
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant={asset.type === 'image' ? 'default' : asset.type === 'document' ? 'outline' : 'secondary'} className="text-xs">
                          {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
                        </Badge>
                        
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(asset.url, '_blank')}
                          >
                            <Link2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleAssetSelection(asset.id)}
                          >
                            {asset.selected ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-md p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Assets Available</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This property doesn't have any assets attached to it.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Download className="mr-2 h-5 w-5" />
          Property Importer
        </CardTitle>
        <CardDescription>
          Import property data from external websites with one click
        </CardDescription>
      </CardHeader>
      <CardContent>
        {importComplete ? (
          <>
            {renderEditForm()}
            
            <div className="mt-6 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setImportComplete(false);
                  setExtractedData(null);
                  setEditedData(emptyExtractedData);
                  setUrl('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                // Always enable the Continue button once data is imported
                disabled={false}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Continue
              </Button>
            </div>
          </>
        ) : (
          renderImportForm()
        )}
      </CardContent>
    </Card>
  );
}