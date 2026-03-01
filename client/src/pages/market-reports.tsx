import React, { useState } from 'react';
import { BarChart3, TrendingUp, Download, Filter, Calendar, MapPin, DollarSign, Users, Home, Target, ArrowUp, ArrowDown, Eye, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const MarketReportsPage = () => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('12m');
  const [selectedReportType, setSelectedReportType] = useState('overview');

  const regions = [
    { id: 'all', name: 'All Regions', properties: 15420 },
    { id: 'texas', name: 'Texas', properties: 3240 },
    { id: 'florida', name: 'Florida', properties: 2890 },
    { id: 'california', name: 'California', properties: 2156 },
    { id: 'north-carolina', name: 'North Carolina', properties: 1890 },
    { id: 'tennessee', name: 'Tennessee', properties: 1567 },
    { id: 'georgia', name: 'Georgia', properties: 1234 },
    { id: 'arizona', name: 'Arizona', properties: 1098 },
    { id: 'colorado', name: 'Colorado', properties: 987 }
  ];

  const marketMetrics = [
    {
      title: 'Average Price per Acre',
      value: '$12,450',
      change: '+8.3%',
      trend: 'up',
      description: 'Compared to last quarter',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Total Properties Listed',
      value: '15,420',
      change: '+12.7%',
      trend: 'up',
      description: 'New listings this month',
      icon: Home,
      color: 'text-blue-600'
    },
    {
      title: 'Average Days on Market',
      value: '42 days',
      change: '-6.2%',
      trend: 'down',
      description: 'Faster sales velocity',
      icon: Calendar,
      color: 'text-purple-600'
    },
    {
      title: 'Market Activity Index',
      value: '89.4',
      change: '+15.1%',
      trend: 'up',
      description: 'Based on views and inquiries',
      icon: Activity,
      color: 'text-orange-600'
    }
  ];

  const regionalPerformance = [
    { region: 'Texas', avgPrice: 8500, growth: 15.2, volume: 3240, hotness: 95 },
    { region: 'Florida', avgPrice: 14200, growth: 22.1, volume: 2890, hotness: 88 },
    { region: 'California', avgPrice: 28500, growth: 8.7, volume: 2156, hotness: 82 },
    { region: 'North Carolina', avgPrice: 7200, growth: 18.4, volume: 1890, hotness: 79 },
    { region: 'Tennessee', avgPrice: 6800, growth: 25.3, volume: 1567, hotness: 91 },
    { region: 'Georgia', avgPrice: 5900, growth: 12.6, volume: 1234, hotness: 76 },
    { region: 'Arizona', avgPrice: 18900, growth: 28.7, volume: 1098, hotness: 93 },
    { region: 'Colorado', avgPrice: 22100, growth: 19.8, volume: 987, hotness: 85 }
  ];

  const priceHistory = [
    { month: 'Jan', price: 10200, volume: 890 },
    { month: 'Feb', price: 10800, volume: 920 },
    { month: 'Mar', price: 11200, volume: 1150 },
    { month: 'Apr', price: 11600, volume: 1340 },
    { month: 'May', price: 11900, volume: 1420 },
    { month: 'Jun', price: 12100, volume: 1380 },
    { month: 'Jul', price: 12350, volume: 1290 },
    { month: 'Aug', price: 12450, volume: 1450 },
    { month: 'Sep', price: 12380, volume: 1520 },
    { month: 'Oct', price: 12420, volume: 1480 },
    { month: 'Nov', price: 12450, volume: 1390 },
    { month: 'Dec', price: 12450, volume: 1320 }
  ];

  const propertyTypes = [
    { type: 'Recreational Land', percentage: 35, avgPrice: 8500, growth: 18.2 },
    { type: 'Agricultural Land', percentage: 28, avgPrice: 6200, growth: 12.8 },
    { type: 'Residential Lots', percentage: 22, avgPrice: 22500, growth: 15.9 },
    { type: 'Commercial Land', percentage: 10, avgPrice: 45800, growth: 8.3 },
    { type: 'Industrial Land', percentage: 5, avgPrice: 18900, growth: 22.1 }
  ];

  const marketInsights = [
    {
      title: 'Rising Demand for Recreational Land',
      impact: 'High',
      description: 'Outdoor recreation trends driving 25% increase in rural property interest',
      category: 'Demand'
    },
    {
      title: 'Infrastructure Development Impact',
      impact: 'Medium',
      description: 'New highway projects increasing land values by average 12% in affected areas',
      category: 'Development'
    },
    {
      title: 'Climate Migration Patterns',
      impact: 'High',
      description: 'Population shifts toward climate-resilient regions affecting pricing',
      category: 'Demographics'
    },
    {
      title: 'Interest Rate Sensitivity',
      impact: 'Medium',
      description: 'Lower rates correlating with 15% increase in land financing applications',
      category: 'Finance'
    }
  ];

  const generateReport = () => {
    const reportData = {
      region: selectedRegion,
      timeframe: selectedTimeframe,
      type: selectedReportType,
      generatedAt: new Date().toLocaleDateString()
    };
    
    alert(`Custom report generated successfully!\n\nReport Details:\n- Region: ${regions.find(r => r.id === selectedRegion)?.name || 'All Regions'}\n- Timeframe: ${selectedTimeframe}\n- Type: ${selectedReportType}\n- Generated: ${reportData.generatedAt}\n\nThis would normally download as a PDF file.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl mb-6">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Market Intelligence Reports</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive land market analysis with real-time data and predictive insights
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-6 mb-8 px-6 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <Filter className="w-3.5 h-3.5" />
              Region
            </label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-52 h-10 border-gray-300 bg-gray-50 font-medium text-gray-800 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map(region => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name} ({region.properties.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-px h-10 bg-gray-200 self-end mb-0.5 hidden sm:block" />

          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <Calendar className="w-3.5 h-3.5" />
              Time Period
            </label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-40 h-10 border-gray-300 bg-gray-50 font-medium text-gray-800 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="12m">12 Months</SelectItem>
                <SelectItem value="24m">24 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={generateReport}
            className="ml-auto h-10 px-5 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 font-semibold shadow-md"
          >
            <Download className="w-4 h-4 mr-2" />
            Generate Custom Report
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-2/3 mx-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="regional" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Regional</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Market Overview */}
          <TabsContent value="overview">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {marketMetrics.map((metric, index) => {
                const IconComponent = metric.icon;
                return (
                  <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center`}>
                          <IconComponent className={`w-6 h-6 ${metric.color}`} />
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {metric.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                          {metric.change}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                      <div className="text-sm text-gray-600">{metric.description}</div>
                      <div className="text-lg font-semibold text-gray-800 mt-2">{metric.title}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Price History Chart Simulation */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Price History & Market Volume
                </CardTitle>
                <CardDescription>
                  12-month price trends and transaction volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-12 gap-2 h-64">
                  {priceHistory.map((data, index) => (
                    <div key={index} className="flex flex-col justify-end items-center space-y-2">
                      <div className="flex flex-col items-center space-y-1">
                        <div 
                          className="w-6 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm"
                          style={{ 
                            height: `${(data.price / 12450) * 180}px`,
                            minHeight: '20px'
                          }}
                          title={`$${data.price.toLocaleString()}`}
                        />
                        <div 
                          className="w-6 bg-gradient-to-t from-green-600 to-green-400 rounded-t-sm"
                          style={{ 
                            height: `${(data.volume / 1520) * 60}px`,
                            minHeight: '8px'
                          }}
                          title={`${data.volume} transactions`}
                        />
                      </div>
                      <div className="text-xs text-gray-600 transform -rotate-45 origin-bottom-left">
                        {data.month}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-gradient-to-t from-blue-600 to-blue-400 rounded"></div>
                    <span>Average Price per Acre</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-gradient-to-t from-green-600 to-green-400 rounded"></div>
                    <span>Transaction Volume</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Types Distribution */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Property Types Market Share
                </CardTitle>
                <CardDescription>
                  Distribution and performance by property category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {propertyTypes.map((type, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{type.type}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">${type.avgPrice.toLocaleString()}/acre</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            +{type.growth}%
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={type.percentage} className="flex-1" />
                        <span className="text-sm text-gray-600 w-12">{type.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Regional Analysis */}
          <TabsContent value="regional">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Regional Market Performance
                </CardTitle>
                <CardDescription>
                  Comparative analysis across major land markets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regionalPerformance.map((region, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{region.region}</h3>
                            <p className="text-gray-600 text-sm">{region.volume.toLocaleString()} properties</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">${region.avgPrice.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">per acre</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Growth Rate</div>
                          <div className="flex items-center gap-2">
                            <Progress value={(region.growth / 30) * 100} className="flex-1" />
                            <span className="text-sm font-medium text-green-600">+{region.growth}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Market Hotness</div>
                          <div className="flex items-center gap-2">
                            <Progress value={region.hotness} className="flex-1" />
                            <span className="text-sm font-medium">{region.hotness}/100</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Trends */}
          <TabsContent value="trends">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Emerging Trends
                  </CardTitle>
                  <CardDescription>
                    Key market movements and future indicators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowUp className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-800">Rising Trend</span>
                    </div>
                    <h4 className="font-medium mb-1">Rural Connectivity Demand</h4>
                    <p className="text-sm text-gray-700">High-speed internet access driving 34% premium for connected rural properties</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-800">Watch Trend</span>
                    </div>
                    <h4 className="font-medium mb-1">Sustainable Development Focus</h4>
                    <p className="text-sm text-gray-700">Eco-friendly development restrictions affecting 22% of rural markets</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold text-orange-800">Opportunity</span>
                    </div>
                    <h4 className="font-medium mb-1">Climate Migration Markets</h4>
                    <p className="text-sm text-gray-700">Population shifts creating new hotspots in climate-resilient regions</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Buyer Demographics
                  </CardTitle>
                  <CardDescription>
                    Who's buying land and why
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Remote Workers</span>
                      <span className="text-sm text-gray-600">42%</span>
                    </div>
                    <Progress value={42} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Investors</span>
                      <span className="text-sm text-gray-600">28%</span>
                    </div>
                    <Progress value={28} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Retirees</span>
                      <span className="text-sm text-gray-600">18%</span>
                    </div>
                    <Progress value={18} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Developers</span>
                      <span className="text-sm text-gray-600">12%</span>
                    </div>
                    <Progress value={12} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Market Insights */}
          <TabsContent value="insights">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Strategic Market Insights
                </CardTitle>
                <CardDescription>
                  Expert analysis and actionable intelligence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {marketInsights.map((insight, index) => (
                    <div key={index} className="p-6 border border-gray-200 rounded-xl">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{insight.title}</h3>
                          <p className="text-gray-700 mb-3">{insight.description}</p>
                        </div>
                        <div className="ml-4">
                          <Badge 
                            variant={insight.impact === 'High' ? 'destructive' : 'secondary'}
                            className={
                              insight.impact === 'High' ? 'bg-red-100 text-red-800' :
                              insight.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }
                          >
                            {insight.impact} Impact
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{insight.category}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketReportsPage;