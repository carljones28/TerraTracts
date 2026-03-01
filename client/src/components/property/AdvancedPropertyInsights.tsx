import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface AdvancedPropertyInsightsProps {
  propertyId: number;
}

export function AdvancedPropertyInsights({ propertyId }: AdvancedPropertyInsightsProps) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch advanced insights on mount or when propertyId changes
  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/ai/property/${propertyId}/advanced-insights`);
        
        if (!response.ok) {
          throw new Error(`Error fetching insights: ${response.statusText}`);
        }
        
        const data = await response.json();
        setInsights(data);
      } catch (error) {
        console.error("Failed to fetch advanced insights:", error);
        setError("Failed to load advanced insights. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load advanced insights. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (propertyId) {
      fetchInsights();
    }
  }, [propertyId, toast]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-3/4" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-1/2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-destructive/10">
        <CardHeader>
          <CardTitle>Advanced Insights Unavailable</CardTitle>
          <CardDescription>We couldn't retrieve advanced insights for this property.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  const { 
    sustainabilityScore, 
    recommendedDevelopment,
    potentialUses,
    investmentOutlook,
    comparableProperties,
    conservationPotential
  } = insights;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-5 h-5 mr-2 text-primary"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          Advanced Property Insights
        </CardTitle>
        <CardDescription>
          AI-powered detailed analysis of this property's potential
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sustainability">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
            <TabsTrigger value="investment">Investment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sustainability" className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Sustainability Score</span>
                <span className="text-sm font-bold">{sustainabilityScore}/100</span>
              </div>
              <Progress value={sustainabilityScore} className="h-2" />
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Conservation Potential</h4>
              <Badge 
                variant={
                  conservationPotential === "High" ? "default" : 
                  conservationPotential === "Moderate" ? "secondary" : 
                  "outline"
                }
              >
                {conservationPotential}
              </Badge>
            </div>
          </TabsContent>
          
          <TabsContent value="development" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Recommended Development Approaches</h4>
              <div className="flex flex-wrap gap-1">
                {recommendedDevelopment.map((approach: string, index: number) => (
                  <Badge key={index} variant="outline">{approach}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Potential Land Uses</h4>
              <div className="flex flex-wrap gap-1">
                {potentialUses.map((use: string, index: number) => (
                  <Badge key={index} variant="secondary">{use}</Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="investment" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Investment Outlook (5-year)</h4>
              <p className="text-sm bg-muted/50 p-2 rounded">{investmentOutlook}</p>
            </div>
            
            {comparableProperties && comparableProperties.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Comparable Properties</h4>
                <div className="grid grid-cols-1 gap-2">
                  {comparableProperties.map((comp: any, index: number) => (
                    <div key={index} className="text-xs p-2 border rounded">
                      {comp}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 text-xs text-muted-foreground">
          Powered by Claude 3 Sonnet
        </div>
      </CardContent>
    </Card>
  );
}