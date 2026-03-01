import { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocketSearch } from '@/lib/websocket';
import { useToast } from '@/hooks/use-toast';

interface RealTimeSearchInterpretationProps {
  query: string;
  onUpdateResults?: (properties: any[]) => void;
}

export function RealTimeSearchInterpretation({ 
  query, 
  onUpdateResults 
}: RealTimeSearchInterpretationProps) {
  const { searchInterpretation, isLoading, error, searchProperties } = useWebSocketSearch();
  const { toast } = useToast();
  
  // Send search query when the query changes
  useEffect(() => {
    if (query && query.trim().length > 2) {
      searchProperties(query);
    }
  }, [query, searchProperties]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Search Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  // Update results when interpretation changes
  useEffect(() => {
    if (searchInterpretation?.interpretation && onUpdateResults) {
      // Fetch properties based on the interpretation via REST API
      const fetchProperties = async () => {
        try {
          const response = await fetch('/api/ai/enhanced-search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query
            })
          });
          
          const data = await response.json();
          
          if (data.properties) {
            onUpdateResults(data.properties);
          }
        } catch (error) {
          console.error('Error fetching properties:', error);
        }
      };
      
      fetchProperties();
    }
  }, [searchInterpretation, onUpdateResults, query]);
  
  if (!query || query.trim().length <= 2) {
    return null;
  }
  
  if (isLoading) {
    return (
      <Card className="mt-4 bg-muted/30 border border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Analyzing your search...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted mt-2"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (!searchInterpretation?.interpretation) {
    return null;
  }
  
  const { intent, extractedCriteria, suggestedFilters } = searchInterpretation.interpretation;
  
  return (
    <Card className="mt-4 bg-primary-foreground border border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-4 h-4 mr-2 text-primary"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          SmartMatch™ Technology
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-2">
          <p><span className="font-semibold">We understand you're looking for:</span> {intent}</p>
          
          {extractedCriteria && Object.keys(extractedCriteria).length > 0 && (
            <div className="space-y-1">
              <p className="font-semibold text-xs">Detected Criteria:</p>
              <div className="flex flex-wrap gap-1">
                {extractedCriteria.priceRange && (
                  <Badge variant="outline" className="bg-primary-foreground">
                    Price: {extractedCriteria.priceRange}
                  </Badge>
                )}
                {extractedCriteria.location && (
                  <Badge variant="outline" className="bg-primary-foreground">
                    Location: {extractedCriteria.location}
                  </Badge>
                )}
                {extractedCriteria.propertyType && (
                  <Badge variant="outline" className="bg-primary-foreground">
                    Type: {extractedCriteria.propertyType}
                  </Badge>
                )}
                {extractedCriteria.size && (
                  <Badge variant="outline" className="bg-primary-foreground">
                    Size: {extractedCriteria.size}
                  </Badge>
                )}
                {extractedCriteria.features && extractedCriteria.features.map((feature: string) => (
                  <Badge key={feature} variant="outline" className="bg-primary-foreground">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {suggestedFilters && suggestedFilters.length > 0 && (
            <div className="space-y-1">
              <p className="font-semibold text-xs">Suggested Filters:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedFilters.map((filter: string, index: number) => (
                  <Badge key={index} className="bg-primary/10 hover:bg-primary/20 cursor-pointer">
                    {filter}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}