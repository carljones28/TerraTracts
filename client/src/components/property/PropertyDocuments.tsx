import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Download, Eye, Image as ImageIcon, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface Document {
  url: string;
  name: string;
  type: string;
}

interface PropertyDocumentsProps {
  propertyId?: number;
}

export function PropertyDocuments({ propertyId }: PropertyDocumentsProps) {
  // State to store documents
  const [documents, setDocuments] = useState<Document[]>([]);
  
  // Fetch property data directly to ensure we get the documents
  const { data: property, isLoading } = useQuery({
    queryKey: ['/api/properties', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      console.log('📄 PropertyDocuments - Fetching property data for ID:', propertyId);
      const res = await fetch(`/api/properties/${propertyId}`);
      if (!res.ok) throw new Error('Failed to fetch property data');
      const data = await res.json();
      console.log('📄 PropertyDocuments - Fetched property data:', data);
      return data;
    },
    enabled: !!propertyId
  });
  
  // Update documents when property data changes
  useEffect(() => {
    console.log('📄 PropertyDocuments - Property data received:', property);
    if (property && property.documents && Array.isArray(property.documents)) {
      console.log('📄 PropertyDocuments - Documents found in property data:', property.documents);
      setDocuments(property.documents);
    } else if (property) {
      console.log('📄 PropertyDocuments - No documents found in property data or invalid format', {
        hasProperty: !!property,
        hasDocumentsField: property && 'documents' in property,
        documentsValue: property?.documents,
        isArray: property?.documents && Array.isArray(property.documents)
      });
    }
  }, [property]);
  
  // Get an appropriate icon based on the document type
  const getDocumentIcon = (type: string) => {
    if (!type) return <FileIcon className="h-5 w-5 text-slate-400" />;
    
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) 
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (type.includes('word') || type.includes('doc')) return <FileText className="h-5 w-5 text-blue-700" />;
    
    return <FileText className="h-5 w-5 text-slate-400" />;
  };
  
  // Create a full URL for a document
  const getFullDocumentUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return window.location.origin + (url.startsWith('/') ? '' : '/') + url;
  };
  
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle>Property Documents & Resources</CardTitle>
        <CardDescription>Legal documents, surveys, permits, and other files</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
                <div className="flex items-center space-x-3">
                  {getDocumentIcon(doc.type)}
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.type}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => window.open(getFullDocumentUrl(doc.url), '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    <span>Preview</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = getFullDocumentUrl(doc.url);
                      link.download = doc.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-slate-900">No documents available</h3>
            <p className="text-xs text-slate-500 mt-1">
              This property doesn't have any documents attached
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}