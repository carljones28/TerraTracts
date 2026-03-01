import React, { useState } from 'react';
import { 
  FileText, 
  Download,
  Eye,
  X,
  FileImage,
  FileSpreadsheet,
  FileArchive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'spreadsheet' | 'archive' | 'other';
  url: string;
  size?: string;
  dateAdded?: string;
}

interface PropertyResourcesProps {
  resources?: Resource[];
}

const PropertyResources: React.FC<PropertyResourcesProps> = ({ resources = [] }) => {
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  
  // Returns the appropriate icon based on file type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'image':
        return <FileImage className="h-5 w-5 text-blue-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'archive':
        return <FileArchive className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Handle resource preview
  const handlePreview = (resource: Resource) => {
    if (resource.type === 'image') {
      setPreviewResource(resource);
    } else {
      // For non-image files, open in a new tab
      window.open(resource.url, '_blank');
    }
  };
  
  // Handle resource download
  const handleDownload = (resource: Resource) => {
    const link = document.createElement('a');
    link.href = resource.url;
    link.download = resource.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Close preview modal
  const closePreview = () => {
    setPreviewResource(null);
  };
  
  if (resources.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Property Documents & Resources</h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No documents available for this property</p>
          <p className="text-gray-400 text-sm">
            The owner has not uploaded any resources yet.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Property Documents & Resources</h2>
        
        <div className="space-y-4">
          {resources.map((resource) => (
            <div 
              key={resource.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                {getResourceIcon(resource.type)}
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{resource.name}</p>
                  <div className="flex text-sm text-gray-500 space-x-2">
                    {resource.size && <span>{resource.size}</span>}
                    {resource.size && resource.dateAdded && <span>•</span>}
                    {resource.dateAdded && <span>Added {resource.dateAdded}</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(resource)}
                  className="text-gray-600 hover:text-primary"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(resource)}
                  className="text-gray-600 hover:text-primary"
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Image Preview Modal */}
      {previewResource && previewResource.type === 'image' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={closePreview}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 z-10"
            >
              <X className="h-5 w-5" />
            </Button>
            
            <img
              src={previewResource.url}
              alt={previewResource.name}
              className="max-w-full max-h-[90vh] object-contain"
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
              <p className="font-medium">{previewResource.name}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyResources;