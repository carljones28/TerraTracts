import React from 'react';

interface MapLegendProps {
  isVisible: boolean;
  type: 'flood' | 'fire' | 'wind' | 'heat' | 'air' | 'price' | 'growth' | 'activity' | 'time' | null;
  legendType?: 'climate' | 'market';
}

const MapLegend: React.FC<MapLegendProps> = ({ isVisible, type, legendType = 'climate' }) => {
  if (!isVisible || !type) return null;

  const renderLegendContent = () => {
    // Market trend legend types
    if (legendType === 'market') {
      switch (type) {
        case 'price':
          return (
            <div className="flex flex-col">
              <h3 className="text-sm font-medium mb-2">Price Trends (12-Month)</h3>
              <div className="flex items-center mb-2">
                <div className="w-full h-4 bg-gradient-to-r from-[#FEE2E2] via-[#EF4444] to-[#7F1D1D] rounded-sm mr-2" />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>-15%</span>
                <span>-5%</span>
                <span>+5%</span>
                <span>+15%+</span>
              </div>
            </div>
          );
        case 'growth':
          return (
            <div className="flex flex-col">
              <h3 className="text-sm font-medium mb-2">Market Growth Rate</h3>
              <div className="flex items-center mb-2">
                <div className="w-full h-4 bg-gradient-to-r from-[#DBEAFE] via-[#3B82F6] to-[#1E3A8A] rounded-sm mr-2" />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Slow</span>
                <span>Steady</span>
                <span>Growing</span>
                <span>Hot</span>
              </div>
            </div>
          );
        case 'activity':
          return (
            <div className="flex flex-col">
              <h3 className="text-sm font-medium mb-2">Sales Activity</h3>
              <div className="flex items-center mb-2">
                <div className="w-full h-4 bg-gradient-to-r from-[#ECFCCB] via-[#84CC16] to-[#365314] rounded-sm mr-2" />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
                <span>Very High</span>
              </div>
            </div>
          );
        case 'time':
          return (
            <div className="flex flex-col">
              <h3 className="text-sm font-medium mb-2">Time on Market</h3>
              <div className="flex items-center mb-2">
                <div className="w-full h-4 bg-gradient-to-r from-[#FFEDD5] via-[#F97316] to-[#9A3412] rounded-sm mr-2" />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{"< 30 days"}</span>
                <span>60 days</span>
                <span>90 days</span>
                <span>120+ days</span>
              </div>
            </div>
          );
        default:
          return null;
      }
    }
    
    // Climate risk legend types
    switch (type) {
      case 'flood':
        return (
          <div className="flex flex-col">
            <h3 className="text-sm font-medium mb-2">Depth of flooding</h3>
            <div className="flex items-center mb-2">
              <div className="w-full h-4 bg-gradient-to-r from-[#EFF3FF] via-[#6B8FF7] to-[#1E3A8A] rounded-sm mr-2" />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>0.5ft</span>
              <span>1</span>
              <span>2</span>
              <span>3+</span>
            </div>
            <div className="flex items-center mt-2">
              <img src="https://firststreet.org/flood-lab/wp-content/uploads/2020/06/cropped-first-street-logo.png" 
                   alt="First Street" 
                   className="h-4 mr-1" />
              <span className="text-xs">First Street®</span>
            </div>
          </div>
        );
      case 'fire':
        return (
          <div className="flex flex-col">
            <h3 className="text-sm font-medium mb-2">Fire risk</h3>
            <div className="flex items-center mb-2">
              <div className="w-full h-4 bg-gradient-to-r from-[#FFEDD5] via-[#F97316] to-[#9A3412] rounded-sm mr-2" />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Low</span>
              <span>Moderate</span>
              <span>High</span>
              <span>Extreme</span>
            </div>
          </div>
        );
      case 'wind':
        return (
          <div className="flex flex-col">
            <h3 className="text-sm font-medium mb-2">Wind risk</h3>
            <div className="flex items-center mb-2">
              <div className="w-full h-4 bg-gradient-to-r from-[#DBEAFE] via-[#3B82F6] to-[#1E3A8A] rounded-sm mr-2" />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Low</span>
              <span>Moderate</span>
              <span>High</span>
              <span>Extreme</span>
            </div>
          </div>
        );
      case 'heat':
        return (
          <div className="flex flex-col">
            <h3 className="text-sm font-medium mb-2">Heat risk</h3>
            <div className="flex items-center mb-2">
              <div className="w-full h-4 bg-gradient-to-r from-[#FEE2E2] via-[#EF4444] to-[#7F1D1D] rounded-sm mr-2" />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Low</span>
              <span>Moderate</span>
              <span>High</span>
              <span>Extreme</span>
            </div>
          </div>
        );
      case 'air':
        return (
          <div className="flex flex-col">
            <h3 className="text-sm font-medium mb-2">Air quality risk</h3>
            <div className="flex items-center mb-2">
              <div className="w-full h-4 bg-gradient-to-r from-[#ECFCCB] via-[#84CC16] to-[#365314] rounded-sm mr-2" />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Good</span>
              <span>Fair</span>
              <span>Poor</span>
              <span>Hazardous</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute bottom-4 left-4 bg-white p-3 rounded-md shadow-md z-20 w-64">
      {renderLegendContent()}
    </div>
  );
};

export default MapLegend;