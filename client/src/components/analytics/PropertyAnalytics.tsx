import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, MapPin, BarChart3, PieChart } from 'lucide-react';

interface Property {
  id: number;
  price: string | number;
  acreage: string | number;
  state: string;
  propertyType: string;
  createdAt: string;
}

interface PropertyAnalyticsProps {
  properties: Property[];
}

interface MarketMetrics {
  averagePrice: number;
  medianPrice: number;
  pricePerAcre: number;
  totalListings: number;
  priceChange: number;
  hotStates: Array<{ state: string; count: number; avgPrice: number }>;
  propertyTypeDistribution: Array<{ type: string; count: number; percentage: number }>;
  priceRanges: Array<{ range: string; count: number; percentage: number }>;
}

export const PropertyAnalytics: React.FC<PropertyAnalyticsProps> = ({ properties }) => {
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  const [timeframe, setTimeframe] = useState('30d');

  const calculateMetrics = useMemo(() => {
    if (!properties.length) return null;

    // Filter properties based on timeframe
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeframe) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        cutoffDate.setFullYear(now.getFullYear() - 1);
    }

    const filteredProperties = properties.filter(prop => {
      const propDate = new Date(prop.createdAt || now);
      return propDate >= cutoffDate;
    });

    // Calculate prices
    const prices = filteredProperties.map(prop => {
      const price = typeof prop.price === 'string' 
        ? parseFloat(prop.price.replace(/[^0-9.]/g, '')) 
        : prop.price;
      return price || 0;
    }).filter(price => price > 0);

    const acreages = filteredProperties.map(prop => {
      const acreage = typeof prop.acreage === 'string' 
        ? parseFloat(prop.acreage.toString()) 
        : prop.acreage;
      return acreage || 0;
    }).filter(acreage => acreage > 0);

    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
    
    const totalAcreage = acreages.reduce((sum, acreage) => sum + acreage, 0);
    const pricePerAcre = totalAcreage > 0 ? prices.reduce((sum, price) => sum + price, 0) / totalAcreage : 0;

    // Calculate state distribution
    const stateData = filteredProperties.reduce((acc, prop) => {
      if (!prop.state) return acc;
      if (!acc[prop.state]) {
        acc[prop.state] = { count: 0, totalPrice: 0 };
      }
      acc[prop.state].count++;
      const price = typeof prop.price === 'string' 
        ? parseFloat(prop.price.replace(/[^0-9.]/g, '')) 
        : prop.price;
      if (price) acc[prop.state].totalPrice += price;
      return acc;
    }, {} as Record<string, { count: number; totalPrice: number }>);

    const hotStates = Object.entries(stateData)
      .map(([state, data]) => ({
        state,
        count: data.count,
        avgPrice: data.totalPrice / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Property type distribution
    const typeData = filteredProperties.reduce((acc, prop) => {
      const type = prop.propertyType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const propertyTypeDistribution = Object.entries(typeData)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / filteredProperties.length) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Price range distribution using actual data
    const priceRanges = [
      { range: 'Under $50K', min: 0, max: 50000 },
      { range: '$50K - $100K', min: 50000, max: 100000 },
      { range: '$100K - $250K', min: 100000, max: 250000 },
      { range: '$250K - $500K', min: 250000, max: 500000 },
      { range: '$500K - $1M', min: 500000, max: 1000000 },
      { range: 'Over $1M', min: 1000000, max: Infinity }
    ];

    const priceRangeDistribution = priceRanges.map(range => {
      const count = prices.filter(price => price >= range.min && price < range.max).length;
      return {
        range: range.range,
        count,
        percentage: prices.length > 0 ? (count / prices.length) * 100 : 0
      };
    });

    // Calculate price change based on actual listing dates
    const recentPrices = filteredProperties
      .filter(prop => new Date(prop.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .map(prop => typeof prop.price === 'string' ? parseFloat(prop.price.replace(/[^0-9.]/g, '')) : prop.price)
      .filter(price => price > 0);

    const olderPrices = filteredProperties
      .filter(prop => {
        const date = new Date(prop.createdAt);
        return date < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && 
               date >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      })
      .map(prop => typeof prop.price === 'string' ? parseFloat(prop.price.replace(/[^0-9.]/g, '')) : prop.price)
      .filter(price => price > 0);

    const recentAvg = recentPrices.length ? recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length : 0;
    const olderAvg = olderPrices.length ? olderPrices.reduce((sum, p) => sum + p, 0) / olderPrices.length : 0;
    const priceChange = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    return {
      averagePrice,
      medianPrice,
      pricePerAcre,
      totalListings: filteredProperties.length,
      priceChange,
      hotStates,
      propertyTypeDistribution,
      priceRanges: priceRangeDistribution
    };
  }, [properties, timeframe]);

  useEffect(() => {
    setMetrics(calculateMetrics);
  }, [calculateMetrics]);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    } else {
      return `$${price.toFixed(0)}`;
    }
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Market Analytics</h2>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Price</p>
              <p className="text-2xl font-bold">{formatPrice(metrics.averagePrice)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
          <div className="flex items-center mt-2">
            {metrics.priceChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${metrics.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.priceChange >= 0 ? '+' : ''}{metrics.priceChange.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Median Price</p>
              <p className="text-2xl font-bold">{formatPrice(metrics.medianPrice)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Price per Acre</p>
              <p className="text-2xl font-bold">{formatPrice(metrics.pricePerAcre)}</p>
            </div>
            <MapPin className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Listings</p>
              <p className="text-2xl font-bold">{metrics.totalListings.toLocaleString()}</p>
            </div>
            <PieChart className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hot States */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Top States by Listings</h3>
          <div className="space-y-3">
            {metrics.hotStates.map((state, index) => (
              <div key={state.state} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </span>
                  <span className="font-medium">{state.state}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{state.count} listings</div>
                  <div className="text-sm text-gray-600">{formatPrice(state.avgPrice)} avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Property Types */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Property Type Distribution</h3>
          <div className="space-y-3">
            {metrics.propertyTypeDistribution.slice(0, 6).map((type) => (
              <div key={type.type} className="flex items-center justify-between">
                <span className="font-medium capitalize">{type.type}</span>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${type.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12">
                    {type.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Ranges */}
        <div className="bg-white p-6 rounded-lg border shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Price Range Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {metrics.priceRanges.filter(range => range.count > 0).map((range) => (
              <div key={range.range} className="text-center">
                <div className="text-sm text-gray-600 mb-1">{range.range}</div>
                <div className="text-2xl font-bold text-blue-600">{range.count}</div>
                <div className="text-xs text-gray-500">{range.percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyAnalytics;