import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Image as ImageIcon, ArrowLeft, FileIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Document {
  url: string;
  name: string;
  type: string;
}

export default function PropertyDocumentsPage() {
  const [, params] = useRoute("/properties/:id/documents");
  const propertyId = params?.id ? parseInt(params.id) : undefined;
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);

  // Fetch property data
  const { data: property, isLoading, error } = useQuery({
    queryKey: ['/api/properties', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      console.log('📄 PropertyDocumentsPage - Fetching property data for ID:', propertyId);
      const res = await fetch(`/api/properties/${propertyId}`);
      if (!res.ok) throw new Error('Failed to fetch property data');
      return res.json();
    },
    enabled: !!propertyId
  });

  // Extract documents from property data
  useEffect(() => {
    if (property && property.documents) {
      console.log('📄 PropertyDocumentsPage - Property data received:', property);
      console.log('📄 PropertyDocumentsPage - Documents:', property.documents);
      
      if (Array.isArray(property.documents)) {
        setDocuments(property.documents);
      } else {
        console.error('📄 PropertyDocumentsPage - Documents is not an array:', property.documents);
      }
    }
  }, [property]);

  // Determine document icon based on document type
  const getDocumentIcon = (type: string) => {
    if (type.includes('image')) {
      return <ImageIcon className="h-6 w-6 text-blue-500" />;
    } else if (type.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else {
      return <FileIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  // Format document URL to ensure it's absolute
  const formatDocumentUrl = (url: string) => {
    if (url.startsWith('http')) {
      return url;
    } else {
      return window.location.origin + (url.startsWith('/') ? '' : '/') + url;
    }
  };

  // View document in new tab
  const viewDocument = (doc: Document) => {
    const url = formatDocumentUrl(doc.url);
    window.open(url, '_blank');
  };

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <Link href={`/properties/${propertyId}`}>
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Property
            </Button>
          </Link>
        </div>
        
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was an error loading the property documents. Please try again later.</p>
            <pre className="bg-red-100 p-4 rounded-md mt-4 text-xs overflow-auto">
              {(error as Error).message}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <Link href={`/properties/${propertyId}`}>
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Property
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4">Loading property documents...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Debug information object
  const debugInfo = {
    propertyId,
    hasProperty: !!property,
    propertyHasDocuments: property && 'documents' in property,
    documentsIsArray: property && 'documents' in property && Array.isArray(property.documents),
    documentsLength: property && 'documents' in property && Array.isArray(property.documents) ? property.documents.length : 0,
    documentsState: documents,
    documentsStateLength: documents.length
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <Link href={`/properties/${propertyId}`}>
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Property
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold">
          Property Documents
        </h1>
      </div>

      {property && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">{property.title}</h2>
          <p className="text-gray-500">Property ID: {propertyId}</p>
        </div>
      )}
      
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {documents.map((doc, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="mr-4">
                    {getDocumentIcon(doc.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{doc.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{doc.type}</p>
                    <Button 
                      onClick={() => viewDocument(doc)}
                      className="mr-2"
                    >
                      <Eye className="h-4 w-4 mr-2" /> View Document
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium">No Documents Available</h3>
            <p className="text-gray-500 mt-2">This property doesn't have any documents attached.</p>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      <Card className="mt-8 bg-slate-900 text-white">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}