import React, { useState, useRef } from 'react';
import { 
  File, 
  FileImage, 
  FileText, 
  Map, 
  Upload, 
  Plus, 
  X, 
  CheckCircle2, 
  Tag,
  Trash2,
  Eye,
  Download,
  FileEdit,
  ExternalLink
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Define asset types
type AssetType = 'document' | 'media' | 'landData' | 'map';

// Define asset categories for each asset type
const assetCategories = {
  document: [
    'Survey', 
    'Title', 
    'Deed', 
    'Tax Record', 
    'Covenant', 
    'Permit', 
    'Zoning Document',
    'Contract',
    'Other'
  ],
  media: [
    'Property Photo', 
    'Aerial Photo', 
    'Video Tour', 
    '360° Tour', 
    'Drone Footage',
    'Virtual Tour',
    'Other'
  ],
  landData: [
    'Soil Report', 
    'Environmental Assessment', 
    'Boundary Survey', 
    'Topographical Survey',
    'Flood Map',
    'Utility Map',
    'Other'
  ],
  map: [
    'Property Boundary', 
    'Access Map', 
    'Feature Map', 
    'Zoning Map',
    'Utility Map',
    'Annotated Map',
    'Other'
  ]
};

// Define property page sections for linking assets
const propertySections = [
  'Gallery',
  'Property Details',
  'Features',
  'Resources',
  'Location',
  'Amenities',
  'Documents',
  'Maps'
];

// Asset interface
interface Asset {
  id: string;
  name: string;
  type: AssetType;
  category: string;
  url: string;
  thumbnail?: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  propertyId?: number;
  tags: string[];
  linkedTo: string[];
}

interface AssetUploadHubProps {
  propertyId?: number;
  propertyTitle?: string;
  onAssetUploaded?: (asset: Asset) => void;
}

export function AssetUploadHub({ propertyId, propertyTitle, onAssetUploaded }: AssetUploadHubProps) {
  const [activeTab, setActiveTab] = useState<AssetType>('document');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [showDropzone, setShowDropzone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const [newTag, setNewTag] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLinkingAsset, setIsLinkingAsset] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('');
  
  // Filtered assets based on active tab, search query, and tags
  const filteredAssets = assets.filter(asset => {
    if (activeTab && asset.type !== activeTab) return false;
    if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTag !== 'all' && !asset.tags.includes(filterTag)) return false;
    return true;
  });

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Helper function to get file extension
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  // AI-assisted tag suggestion (mock function - would use actual AI API in production)
  const suggestTags = (fileName: string, fileType: string): string[] => {
    const tags: string[] = [];
    const lowerFileName = fileName.toLowerCase();

    // Extract property identifiers
    if (lowerFileName.includes('lot') || lowerFileName.includes('parcel')) {
      const matches = lowerFileName.match(/lot\s*(\d+)/i) || lowerFileName.match(/parcel\s*(\d+)/i);
      if (matches && matches[1]) {
        tags.push(`Lot ${matches[1]}`);
      }
    }

    // Categorize by file type
    if (fileType === 'application/pdf') {
      if (lowerFileName.includes('survey')) tags.push('Survey');
      if (lowerFileName.includes('deed')) tags.push('Deed');
      if (lowerFileName.includes('title')) tags.push('Title');
      if (lowerFileName.includes('tax')) tags.push('Tax Document');
    } else if (fileType.startsWith('image/')) {
      if (lowerFileName.includes('aerial')) tags.push('Aerial');
      if (lowerFileName.includes('photo')) tags.push('Photo');
      if (lowerFileName.includes('front')) tags.push('Front View');
    } else if (fileType.startsWith('video/')) {
      tags.push('Video Tour');
    } else if (fileType === 'application/vnd.google-earth.kml+xml') {
      tags.push('Boundary');
      tags.push('Map Data');
    }

    // Add generic property tag if we have a property ID
    if (propertyId) {
      tags.push(`Property #${propertyId}`);
    }

    return tags;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    handleFileUpload(Array.from(files));
  };

  // Handle dropping files
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    setShowDropzone(false);
    handleFileUpload(files);
  };

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = Math.round(((i + 1) / files.length) * 100);
      setUploadProgress(progress);
      
      // In a real implementation, you would upload the file to a server
      // For this demo, we'll simulate a successful upload
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a thumbnail for images
      let thumbnail = '';
      if (file.type.startsWith('image/')) {
        thumbnail = URL.createObjectURL(file);
      }
      
      // Create asset object
      const fileExtension = getFileExtension(file.name);
      const newAsset: Asset = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: determineAssetType(file.type, file.name),
        category: determineAssetCategory(file.type, file.name),
        url: URL.createObjectURL(file), // In production, this would be the actual URL from the server
        thumbnail: thumbnail,
        fileType: file.type,
        fileSize: file.size,
        uploadDate: new Date(),
        propertyId,
        tags: suggestTags(file.name, file.type),
        linkedTo: []
      };
      
      // Add asset to state
      setAssets(prevAssets => [...prevAssets, newAsset]);
      
      // Callback if provided
      if (onAssetUploaded) {
        onAssetUploaded(newAsset);
      }
    }
    
    setIsUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle URL submission
  const handleUrlSubmit = (url: string, name: string, type: AssetType) => {
    const newAsset: Asset = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: name,
      type: type,
      category: assetCategories[type][0],
      url: url,
      fileType: 'url',
      fileSize: 0,
      uploadDate: new Date(),
      propertyId,
      tags: propertyId ? [`Property #${propertyId}`] : [],
      linkedTo: []
    };
    
    setAssets(prevAssets => [...prevAssets, newAsset]);
    
    // Callback if provided
    if (onAssetUploaded) {
      onAssetUploaded(newAsset);
    }
  };

  // Determine asset type based on file type and name
  const determineAssetType = (fileType: string, fileName: string): AssetType => {
    const lowerFileName = fileName.toLowerCase();
    
    if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
      return 'media';
    }
    
    if (fileType === 'application/vnd.google-earth.kml+xml' || 
        fileType === 'application/json' || 
        lowerFileName.includes('map') || 
        lowerFileName.endsWith('.kml') || 
        lowerFileName.endsWith('.kmz') || 
        lowerFileName.endsWith('.gpx')) {
      return 'map';
    }
    
    if (lowerFileName.includes('soil') || 
        lowerFileName.includes('survey') || 
        lowerFileName.includes('boundary') || 
        lowerFileName.includes('environmental')) {
      return 'landData';
    }
    
    // Default to document
    return 'document';
  };

  // Determine asset category based on file type and name
  const determineAssetCategory = (fileType: string, fileName: string): string => {
    const lowerFileName = fileName.toLowerCase();
    
    // Check file name patterns to determine category
    if (lowerFileName.includes('survey')) return 'Survey';
    if (lowerFileName.includes('title')) return 'Title';
    if (lowerFileName.includes('deed')) return 'Deed';
    if (lowerFileName.includes('tax')) return 'Tax Record';
    if (lowerFileName.includes('covenant')) return 'Covenant';
    if (lowerFileName.includes('permit')) return 'Permit';
    if (lowerFileName.includes('soil')) return 'Soil Report';
    if (lowerFileName.includes('boundary')) return 'Boundary Survey';
    if (lowerFileName.includes('aerial')) return 'Aerial Photo';
    if (lowerFileName.includes('photo') && fileType.startsWith('image/')) return 'Property Photo';
    if (lowerFileName.includes('video') || fileType.startsWith('video/')) return 'Video Tour';
    
    // Default based on asset type
    const assetType = determineAssetType(fileType, fileName);
    return assetCategories[assetType][0];
  };

  // Toggle asset selection for bulk actions
  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prevSelected => {
      if (prevSelected.includes(assetId)) {
        return prevSelected.filter(id => id !== assetId);
      } else {
        return [...prevSelected, assetId];
      }
    });
  };

  // Select all visible assets
  const selectAllAssets = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map(asset => asset.id));
    }
  };

  // Delete selected assets
  const deleteSelectedAssets = () => {
    setAssets(prevAssets => 
      prevAssets.filter(asset => !selectedAssets.includes(asset.id))
    );
    setSelectedAssets([]);
  };

  // Add tag to asset
  const addTagToAsset = (assetId: string, tag: string) => {
    if (!tag.trim()) return;
    
    setAssets(prevAssets => 
      prevAssets.map(asset => {
        if (asset.id === assetId && !asset.tags.includes(tag)) {
          return {
            ...asset,
            tags: [...asset.tags, tag]
          };
        }
        return asset;
      })
    );
  };

  // Add tag to selected assets
  const addTagToSelectedAssets = (tag: string) => {
    if (!tag.trim()) return;
    
    setAssets(prevAssets => 
      prevAssets.map(asset => {
        if (selectedAssets.includes(asset.id) && !asset.tags.includes(tag)) {
          return {
            ...asset,
            tags: [...asset.tags, tag]
          };
        }
        return asset;
      })
    );
  };

  // Remove tag from asset
  const removeTagFromAsset = (assetId: string, tag: string) => {
    setAssets(prevAssets => 
      prevAssets.map(asset => {
        if (asset.id === assetId) {
          return {
            ...asset,
            tags: asset.tags.filter(t => t !== tag)
          };
        }
        return asset;
      })
    );
  };

  // Link asset to property section
  const linkAssetToSection = (assetId: string, section: string) => {
    if (!section) return;
    
    setAssets(prevAssets => 
      prevAssets.map(asset => {
        if (asset.id === assetId && !asset.linkedTo.includes(section)) {
          return {
            ...asset,
            linkedTo: [...asset.linkedTo, section]
          };
        }
        return asset;
      })
    );
    
    setIsLinkingAsset(false);
  };

  // Link selected assets to property section
  const linkSelectedAssetsToSection = (section: string) => {
    if (!section) return;
    
    setAssets(prevAssets => 
      prevAssets.map(asset => {
        if (selectedAssets.includes(asset.id) && !asset.linkedTo.includes(section)) {
          return {
            ...asset,
            linkedTo: [...asset.linkedTo, section]
          };
        }
        return asset;
      })
    );
    
    setIsLinkingAsset(false);
  };

  // Remove link from asset to property section
  const removeLinkFromAsset = (assetId: string, section: string) => {
    setAssets(prevAssets => 
      prevAssets.map(asset => {
        if (asset.id === assetId) {
          return {
            ...asset,
            linkedTo: asset.linkedTo.filter(s => s !== section)
          };
        }
        return asset;
      })
    );
  };

  // Get unique tags from all assets
  const getAllTags = (): string[] => {
    const allTags: string[] = [];
    assets.forEach(asset => {
      asset.tags.forEach(tag => {
        if (!allTags.includes(tag)) {
          allTags.push(tag);
        }
      });
    });
    return allTags.sort();
  };

  // Render upload dropzone
  const renderDropzone = () => (
    <div 
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${showDropzone ? 'bg-primary/5 border-primary/20' : 'border-gray-200 hover:border-primary/20 hover:bg-primary/5'}`}
      onDragOver={(e) => {
        e.preventDefault();
        setShowDropzone(true);
      }}
      onDragLeave={() => setShowDropzone(false)}
      onDrop={handleFileDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="flex flex-col items-center">
        <Upload className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Drag & drop files here</h3>
        <p className="text-sm text-gray-500 mb-4">or click to browse</p>
        <Button variant="outline" onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}>
          Select Files
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );

  // Render asset item in grid view
  const renderGridItem = (asset: Asset) => {
    const isSelected = selectedAssets.includes(asset.id);
    
    // Determine the icon based on the asset type and file type
    let Icon = FileText;
    if (asset.type === 'media') {
      if (asset.fileType.startsWith('image/')) {
        Icon = FileImage;
      } else if (asset.fileType.startsWith('video/')) {
        Icon = FileImage; // Could use a video specific icon
      }
    } else if (asset.type === 'map') {
      Icon = Map;
    } else if (asset.type === 'document') {
      Icon = FileText;
    } else {
      Icon = File;
    }
    
    return (
      <div 
        key={asset.id}
        className={`group relative border rounded-lg overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
      >
        {/* Selection checkbox */}
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleAssetSelection(asset.id)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </div>
        
        {/* Preview/thumbnail */}
        <div className="h-32 bg-gray-100 flex items-center justify-center p-2">
          {asset.thumbnail ? (
            <img 
              src={asset.url} 
              alt={asset.name} 
              className="h-full w-full object-cover"
              onClick={() => setPreviewAsset(asset)}
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400" onClick={() => setPreviewAsset(asset)}>
              <Icon className="h-12 w-12" />
              <span className="text-xs mt-1 uppercase">{getFileExtension(asset.name)}</span>
            </div>
          )}
        </div>
        
        {/* Details */}
        <div className="p-3">
          <h3 className="font-medium text-sm truncate" title={asset.name}>{asset.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {asset.fileType === 'url' ? 'External URL' : formatFileSize(asset.fileSize)}
            </span>
            <Badge variant="outline" className="text-xs">
              {asset.category}
            </Badge>
          </div>
          
          {/* Tags */}
          {asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {asset.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {asset.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{asset.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
          
          {/* Links */}
          {asset.linkedTo.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-gray-500">Linked to:</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {asset.linkedTo.slice(0, 1).map(section => (
                  <Badge key={section} className="text-xs bg-primary/10 text-primary">
                    {section}
                  </Badge>
                ))}
                {asset.linkedTo.length > 1 && (
                  <Badge className="text-xs bg-primary/10 text-primary">
                    +{asset.linkedTo.length - 1}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <FileEdit className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setPreviewAsset(asset)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(asset.url, '_blank')}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsLinkingAsset(true)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Link to Section
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  const tag = prompt('Enter tag:');
                  if (tag) addTagToAsset(asset.id, tag);
                }}
              >
                <Tag className="mr-2 h-4 w-4" />
                Add Tag
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  setAssets(prevAssets => prevAssets.filter(a => a.id !== asset.id));
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  // Render asset item in list view
  const renderListItem = (asset: Asset) => {
    const isSelected = selectedAssets.includes(asset.id);
    
    return (
      <div 
        key={asset.id}
        className={`group flex items-center p-3 border-b hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
      >
        <div className="flex-shrink-0 mr-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleAssetSelection(asset.id)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </div>
        
        <div className="flex-shrink-0 mr-4">
          {asset.thumbnail ? (
            <img 
              src={asset.url} 
              alt={asset.name} 
              className="h-10 w-10 object-cover rounded"
              onClick={() => setPreviewAsset(asset)}
            />
          ) : (
            <div 
              className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-400"
              onClick={() => setPreviewAsset(asset)}
            >
              <FileText className="h-5 w-5" />
            </div>
          )}
        </div>
        
        <div className="flex-grow min-w-0">
          <h3 className="font-medium text-sm truncate" title={asset.name}>{asset.name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              {asset.fileType === 'url' ? 'External URL' : formatFileSize(asset.fileSize)}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <Badge variant="outline" className="text-xs">
              {asset.category}
            </Badge>
            
            {asset.tags.length > 0 && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <div className="flex flex-wrap gap-1">
                  {asset.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {asset.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{asset.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </>
            )}
            
            {asset.linkedTo.length > 0 && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <div className="flex flex-wrap gap-1">
                  {asset.linkedTo.slice(0, 1).map(section => (
                    <Badge key={section} className="text-xs bg-primary/10 text-primary">
                      {section}
                    </Badge>
                  ))}
                  {asset.linkedTo.length > 1 && (
                    <Badge className="text-xs bg-primary/10 text-primary">
                      +{asset.linkedTo.length - 1}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0 ml-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <FileEdit className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setPreviewAsset(asset)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(asset.url, '_blank')}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsLinkingAsset(true)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Link to Section
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  const tag = prompt('Enter tag:');
                  if (tag) addTagToAsset(asset.id, tag);
                }}
              >
                <Tag className="mr-2 h-4 w-4" />
                Add Tag
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  setAssets(prevAssets => prevAssets.filter(a => a.id !== asset.id));
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  // Render asset preview dialog
  const renderAssetPreview = () => {
    if (!previewAsset) return null;
    
    return (
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewAsset.name}</DialogTitle>
            <DialogDescription>
              Uploaded on {previewAsset.uploadDate.toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              {previewAsset.fileType.startsWith('image/') ? (
                <img src={previewAsset.url} alt={previewAsset.name} className="max-h-96 max-w-full object-contain" />
              ) : previewAsset.fileType.startsWith('video/') ? (
                <video controls className="max-h-96 max-w-full">
                  <source src={previewAsset.url} type={previewAsset.fileType} />
                  Your browser does not support the video tag.
                </video>
              ) : previewAsset.fileType === 'application/pdf' ? (
                <iframe src={previewAsset.url} title={previewAsset.name} className="w-full h-96" />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p>Preview not available for this file type</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.open(previewAsset.url, '_blank')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-2">File Details</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Type</dt>
                  <dd>{previewAsset.category}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Size</dt>
                  <dd>{previewAsset.fileType === 'url' ? 'External URL' : formatFileSize(previewAsset.fileSize)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Uploaded</dt>
                  <dd>{previewAsset.uploadDate.toLocaleDateString()}</dd>
                </div>
              </dl>
              
              <div className="mt-6">
                <h3 className="font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {previewAsset.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <span className="mr-1">{tag}</span>
                      <button 
                        onClick={() => removeTagFromAsset(previewAsset.id, tag)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <div className="flex items-center mt-1">
                    <Input
                      placeholder="Add tag..."
                      className="h-7 text-xs"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTag) {
                          addTagToAsset(previewAsset.id, newTag);
                          setNewTag('');
                        }
                      }}
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2"
                      onClick={() => {
                        if (newTag) {
                          addTagToAsset(previewAsset.id, newTag);
                          setNewTag('');
                        }
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium mb-2">Linked to Property Sections</h3>
                <div className="flex flex-wrap gap-1">
                  {previewAsset.linkedTo.map(section => (
                    <Badge key={section} className="text-xs bg-primary/10 text-primary">
                      <span className="mr-1">{section}</span>
                      <button 
                        onClick={() => removeLinkFromAsset(previewAsset.id, section)}
                        className="text-primary/70 hover:text-primary"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 h-7 text-xs"
                    onClick={() => setIsLinkingAsset(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Link to Section
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Render link asset dialog
  const renderLinkAssetDialog = () => {
    return (
      <Dialog open={isLinkingAsset} onOpenChange={setIsLinkingAsset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link to Property Section</DialogTitle>
            <DialogDescription>
              Choose where to display this asset on the property page
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Property Page Sections</h4>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {propertySections.map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkingAsset(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedAssets.length > 0) {
                  linkSelectedAssetsToSection(selectedSection);
                } else if (previewAsset) {
                  linkAssetToSection(previewAsset.id, selectedSection);
                }
              }}
              disabled={!selectedSection}
            >
              Link to Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Asset Upload Hub</CardTitle>
          <CardDescription>
            {propertyTitle 
              ? `Upload and manage assets for ${propertyTitle}`
              : 'Upload and manage property assets'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="document" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AssetType)}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="document" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center">
                  <FileImage className="h-4 w-4 mr-2" />
                  Media
                </TabsTrigger>
                <TabsTrigger value="landData" className="flex items-center">
                  <File className="h-4 w-4 mr-2" />
                  Land Data
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center">
                  <Map className="h-4 w-4 mr-2" />
                  Maps
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="View Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid View</SelectItem>
                    <SelectItem value="list">List View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {getAllTags().map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Asset Upload Area */}
            <TabsContent value="document">
              {renderDropzone()}
            </TabsContent>
            
            <TabsContent value="media">
              {renderDropzone()}
            </TabsContent>
            
            <TabsContent value="landData">
              {renderDropzone()}
            </TabsContent>
            
            <TabsContent value="map">
              {renderDropzone()}
            </TabsContent>
            
            {/* Asset List */}
            {filteredAssets.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">
                    {selectedAssets.length > 0 
                      ? `${selectedAssets.length} selected` 
                      : `${filteredAssets.length} assets`}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    {selectedAssets.length > 0 ? (
                      <>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Tag className="h-4 w-4 mr-2" />
                              Tag
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Add Tag to Selected</DropdownMenuLabel>
                            <div className="p-2">
                              <Input
                                placeholder="Enter tag name"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                className="mb-2"
                              />
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={() => {
                                  if (newTag) {
                                    addTagToSelectedAssets(newTag);
                                    setNewTag('');
                                  }
                                }}
                              >
                                Add Tag
                              </Button>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsLinkingAsset(true)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Link
                        </Button>
                        
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={deleteSelectedAssets}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={selectAllAssets}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Select All
                      </Button>
                    )}
                  </div>
                </div>
                
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredAssets.map(renderGridItem)}
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    {filteredAssets.map(renderListItem)}
                  </div>
                )}
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Asset preview dialog */}
      {renderAssetPreview()}
      
      {/* Link asset dialog */}
      {renderLinkAssetDialog()}
    </div>
  );
}