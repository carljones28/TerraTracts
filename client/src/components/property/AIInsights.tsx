import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateRiskAnalysis, generateValuationInsights } from '@/lib/openai';
import DroneFlySimulator from '@/components/drone-fly/DroneFlySimulator';
import VirtualDevelopmentStudio from '@/components/virtual-development/VirtualDevelopmentStudio';

interface AIInsightsProps {
  property: any;
}

/**
 * Displays AI-generated insights for a property including risk analysis 
 * and valuation trends
 */
const AIInsights = ({ property }: AIInsightsProps) => {
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
  const [valuationInsights, setValuationInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch AI insights when property changes
  useEffect(() => {
    async function fetchInsights() {
      setIsLoading(true);
      try {
        const [riskData, valuationData] = await Promise.all([
          generateRiskAnalysis(property),
          generateValuationInsights(property)
        ]);
        
        setRiskAnalysis(riskData);
        setValuationInsights(valuationData);
      } catch (error) {
        console.error('Error loading AI insights:', error);
        toast({
          title: 'Error',
          description: 'Failed to load AI insights for this property.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    if (property) {
      fetchInsights();
    }
  }, [property, toast]);

  if (isLoading) {
    return (
      <div className="bg-glass rounded-xl p-6 mb-6 min-h-[200px] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-secondary mb-3"></div>
          <p className="text-neutral-light">Analyzing property with AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* DroneFly™ Simulator Card */}
      <div className="bg-glass rounded-xl p-6">
        <div className="flex items-center mb-6">
          <div className="h-12 w-12 bg-primary-lighter rounded-full flex items-center justify-center mr-4">
            <i className="fas fa-plane text-secondary text-lg"></i>
          </div>
          <div>
            <h3 className="text-white font-medium text-lg">DroneFly™ Virtual Exploration</h3>
            <p className="text-neutral-light text-sm">
              Powered by GPT-4o
            </p>
          </div>
        </div>
        
        {property && (
          <DroneFlySimulator
            propertyId={property.id}
            propertyTitle={property.title}
            coordinates={property.coordinates}
            terrainType={property.propertyType?.toLowerCase() || 'mountain'}
            imageUrl={property.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'}
            property={property}
          />
        )}
      </div>

      {/* Risk Analysis Card */}
      <div className="bg-glass rounded-xl p-6">
        <div className="flex items-center mb-6">
          <div className="h-12 w-12 bg-primary-lighter rounded-full flex items-center justify-center mr-4">
            <i className="fas fa-shield-alt text-warning text-lg"></i>
          </div>
          <div>
            <h3 className="text-white font-medium text-lg">AI Risk Analysis</h3>
            <p className="text-neutral-light text-sm">
              Powered by GPT-4o
            </p>
          </div>
        </div>
        
        {riskAnalysis && (
          <>
            <p className="text-neutral-light mb-4">
              {riskAnalysis.summary}
            </p>
            
            <div className="space-y-3 mb-4">
              {riskAnalysis.risks.map((risk: any, index: number) => (
                <div key={index} className="flex items-start bg-primary rounded-lg px-4 py-3">
                  <i className={`fas fa-${risk.type === 'Flood' ? 'water' : risk.type === 'Slope' ? 'mountain' : risk.type === 'Fire' ? 'fire' : 'exclamation-circle'} ${riskAnalysis.getRiskColor(risk.level)} mr-3 mt-1`}></i>
                  <div>
                    <span className="font-medium">{risk.type}: <span className={riskAnalysis.getRiskColor(risk.level)}>{risk.level}</span> risk</span>
                    {risk.description && (
                      <p className="text-sm text-neutral-light mt-1">{risk.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {riskAnalysis.recommendations && (
              <div className="mt-4">
                <h4 className="text-white font-medium mb-2">Recommendations</h4>
                <ul className="list-disc list-inside text-neutral-light space-y-1">
                  {riskAnalysis.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* Virtual Development Studio Card */}
      <div className="bg-glass rounded-xl p-6">
        <div className="flex items-center mb-6">
          <div className="h-12 w-12 bg-primary-lighter rounded-full flex items-center justify-center mr-4">
            <i className="fas fa-building text-secondary text-lg"></i>
          </div>
          <div>
            <h3 className="text-white font-medium text-lg">Virtual Development Studio</h3>
            <p className="text-neutral-light text-sm">
              Powered by GPT-4o
            </p>
          </div>
        </div>
        
        {property && (
          <VirtualDevelopmentStudio
            propertyId={property.id}
            propertyTitle={property.title}
            coordinates={property.coordinates}
            terrainType={property.propertyType?.toLowerCase() || 'mountain'}
            imageUrl={property.images?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'}
            property={property}
          />
        )}
      </div>

      {/* Valuation Insights Card */}
      <div className="bg-glass rounded-xl p-6">
        <div className="flex items-center mb-6">
          <div className="h-12 w-12 bg-primary-lighter rounded-full flex items-center justify-center mr-4">
            <i className={`fas fa-chart-line ${valuationInsights?.color || 'text-secondary'} text-lg`}></i>
          </div>
          <div>
            <h3 className="text-white font-medium text-lg">AI Valuation Insights</h3>
            <p className="text-neutral-light text-sm">
              Powered by GPT-4o
            </p>
          </div>
        </div>
        
        {valuationInsights && (
          <>
            <div className="flex items-center mb-4">
              <div className={`text-2xl font-mono font-bold ${valuationInsights.color} mr-2`}>
                {valuationInsights.trend >= 0 ? '+' : ''}{valuationInsights.trend}%
              </div>
              <span className="text-neutral-light">projected value change</span>
            </div>
            
            <p className="text-neutral-light mb-6">
              {valuationInsights.forecast}
            </p>
            
            {valuationInsights.factors && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Value Drivers</h4>
                  <ul className="space-y-1">
                    {valuationInsights.factors.positive.map((factor: string, i: number) => (
                      <li key={i} className="flex items-center">
                        <i className="fas fa-plus-circle text-success mr-2 text-xs"></i>
                        <span className="text-sm">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-2">Risk Factors</h4>
                  <ul className="space-y-1">
                    {valuationInsights.factors.negative.map((factor: string, i: number) => (
                      <li key={i} className="flex items-center">
                        <i className="fas fa-minus-circle text-danger mr-2 text-xs"></i>
                        <span className="text-sm">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {valuationInsights.comparables && (
              <div className="bg-primary rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Comparable Properties</h4>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-light text-sm">Average price per acre</span>
                  <span className="font-mono font-medium">${valuationInsights.comparables.average.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-light text-sm">Price range</span>
                  <span className="font-mono">
                    ${valuationInsights.comparables.range.min.toLocaleString()} - ${valuationInsights.comparables.range.max.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIInsights;