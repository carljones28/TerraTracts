import React, { useState } from 'react';
import { Calculator, TrendingUp, PieChart, DollarSign, MapPin, Calendar, Target, ArrowRight, Percent, Home, BarChart3, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const InvestmentToolsPage = () => {
  const [roiInputs, setRoiInputs] = useState({
    purchasePrice: '',
    downPayment: '',
    loanTerm: '15',
    interestRate: '',
    expectedAppreciation: '',
    annualIncome: '',
    propertyTaxes: '',
    insurance: '',
    maintenanceCosts: '',
    managementFees: ''
  });

  const [roiResults, setRoiResults] = useState<any>(null);
  const [selectedComparison, setSelectedComparison] = useState('');

  const calculateROI = () => {
    const purchase = parseFloat(roiInputs.purchasePrice);
    const down = parseFloat(roiInputs.downPayment);
    const rate = parseFloat(roiInputs.interestRate) / 100 / 12;
    const term = parseInt(roiInputs.loanTerm) * 12;
    const appreciation = parseFloat(roiInputs.expectedAppreciation) / 100;
    const income = parseFloat(roiInputs.annualIncome) || 0;
    const taxes = parseFloat(roiInputs.propertyTaxes) || 0;
    const insurance = parseFloat(roiInputs.insurance) || 0;
    const maintenance = parseFloat(roiInputs.maintenanceCosts) || 0;
    const management = parseFloat(roiInputs.managementFees) || 0;

    const loanAmount = purchase - down;
    const monthlyPayment = rate > 0 ? (loanAmount * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1) : 0;
    const totalExpenses = (monthlyPayment * 12) + taxes + insurance + maintenance + management;
    const totalCashFlow = income - totalExpenses;
    const futureValue = purchase * Math.pow(1 + appreciation, parseInt(roiInputs.loanTerm));
    const totalReturn = (futureValue - purchase + (totalCashFlow * parseInt(roiInputs.loanTerm))) / down;
    const annualizedReturn = (Math.pow(totalReturn + 1, 1 / parseInt(roiInputs.loanTerm)) - 1) * 100;
    const capRate = income > 0 ? (income / purchase) * 100 : 0;
    const cashOnCash = totalCashFlow > 0 ? (totalCashFlow / down) * 100 : 0;

    setRoiResults({
      monthlyPayment: monthlyPayment.toFixed(2),
      annualCashFlow: totalCashFlow.toFixed(2),
      projectedValue: futureValue.toFixed(0),
      totalROI: (totalReturn * 100).toFixed(1),
      annualizedROI: annualizedReturn.toFixed(1),
      capRate: capRate.toFixed(2),
      cashOnCashReturn: cashOnCash.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2)
    });
  };

  const marketComparisons = [
    { state: 'Texas', avgPrice: 8500, roi: 12.5, appreciation: 8.2, growth: '+15%' },
    { state: 'Florida', avgPrice: 12000, roi: 10.8, appreciation: 9.1, growth: '+22%' },
    { state: 'North Carolina', avgPrice: 7200, roi: 14.2, appreciation: 7.8, growth: '+18%' },
    { state: 'Tennessee', avgPrice: 6800, roi: 15.1, appreciation: 8.9, growth: '+25%' },
    { state: 'Georgia', avgPrice: 5900, roi: 16.3, appreciation: 7.5, growth: '+12%' },
    { state: 'Arizona', avgPrice: 11500, roi: 11.7, appreciation: 10.2, growth: '+28%' }
  ];

  const riskFactors = [
    { factor: 'Market Volatility', level: 'Medium', description: 'Land values can fluctuate with economic conditions' },
    { factor: 'Liquidity Risk', level: 'High', description: 'Land can take longer to sell than other investments' },
    { factor: 'Development Risk', level: 'Low', description: 'Zoning changes could affect property value' },
    { factor: 'Income Generation', level: 'Medium', description: 'Limited income potential without development' }
  ];

  const portfolioProperties = [
    { id: 1, name: '25 Acres - Austin, TX', value: 487000, roi: 14.2, status: 'Performing' },
    { id: 2, name: '50 Acres - Nashville, TN', value: 320000, roi: 18.5, status: 'Performing' },
    { id: 3, name: '15 Acres - Raleigh, NC', value: 245000, roi: 12.8, status: 'Under Review' },
    { id: 4, name: '35 Acres - Phoenix, AZ', value: 580000, roi: 16.1, status: 'Performing' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl mb-6">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Investment Analysis Tools</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Make informed land investment decisions with professional-grade calculators and market analysis
          </p>
        </div>

        <Tabs defaultValue="calculator" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-1/2 mx-auto">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Markets</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Risk</span>
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Portfolio</span>
            </TabsTrigger>
          </TabsList>

          {/* ROI Calculator */}
          <TabsContent value="calculator">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Form */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Investment Calculator
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Enter your property details to calculate potential returns
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice" className="text-sm font-medium text-gray-700">Purchase Price</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="purchasePrice"
                          type="number"
                          placeholder="500000"
                          className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={roiInputs.purchasePrice}
                          onChange={(e) => setRoiInputs({...roiInputs, purchasePrice: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="downPayment" className="text-sm font-medium text-gray-700">Down Payment</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="downPayment"
                          type="number"
                          placeholder="100000"
                          className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={roiInputs.downPayment}
                          onChange={(e) => setRoiInputs({...roiInputs, downPayment: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interestRate" className="text-sm font-medium text-gray-700">Interest Rate (%)</Label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="interestRate"
                          type="number"
                          step="0.1"
                          placeholder="6.5"
                          className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={roiInputs.interestRate}
                          onChange={(e) => setRoiInputs({...roiInputs, interestRate: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loanTerm" className="text-sm font-medium text-gray-700">Loan Term</Label>
                      <Select value={roiInputs.loanTerm} onValueChange={(value) => setRoiInputs({...roiInputs, loanTerm: value})}>
                        <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 years</SelectItem>
                          <SelectItem value="15">15 years</SelectItem>
                          <SelectItem value="20">20 years</SelectItem>
                          <SelectItem value="30">30 years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expectedAppreciation" className="text-sm font-medium text-gray-700">Expected Appreciation (%)</Label>
                      <div className="relative">
                        <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="expectedAppreciation"
                          type="number"
                          step="0.1"
                          placeholder="5.0"
                          className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={roiInputs.expectedAppreciation}
                          onChange={(e) => setRoiInputs({...roiInputs, expectedAppreciation: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="annualIncome" className="text-sm font-medium text-gray-700">Annual Income</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="annualIncome"
                          type="number"
                          placeholder="25000"
                          className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={roiInputs.annualIncome}
                          onChange={(e) => setRoiInputs({...roiInputs, annualIncome: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="propertyTaxes" className="text-sm font-medium text-gray-700">Property Taxes</Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="propertyTaxes"
                          type="number"
                          placeholder="5000"
                          className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={roiInputs.propertyTaxes}
                          onChange={(e) => setRoiInputs({...roiInputs, propertyTaxes: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurance" className="text-sm font-medium text-gray-700">Insurance</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="insurance"
                          type="number"
                          placeholder="2000"
                          className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={roiInputs.insurance}
                          onChange={(e) => setRoiInputs({...roiInputs, insurance: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceCosts" className="text-sm font-medium text-gray-700">Maintenance Costs</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="maintenanceCosts"
                          type="number"
                          placeholder="3000"
                          className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={roiInputs.maintenanceCosts}
                          onChange={(e) => setRoiInputs({...roiInputs, maintenanceCosts: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="managementFees" className="text-sm font-medium text-gray-700">Management Fees</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="managementFees"
                          type="number"
                          placeholder="1500"
                          className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={roiInputs.managementFees}
                          onChange={(e) => setRoiInputs({...roiInputs, managementFees: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={calculateROI} 
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Investment Returns
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Investment Analysis
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Your projected returns and key metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {roiResults ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                          <div className="text-sm text-blue-600 font-medium mb-1">Monthly Payment</div>
                          <div className="text-2xl font-bold text-blue-900">${roiResults.monthlyPayment}</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                          <div className="text-sm text-green-600 font-medium mb-1">Annual Cash Flow</div>
                          <div className="text-2xl font-bold text-green-900">${roiResults.annualCashFlow}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                          <div className="text-sm text-purple-600 font-medium mb-1">Cap Rate</div>
                          <div className="text-2xl font-bold text-purple-900">{roiResults.capRate}%</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                          <div className="text-sm text-orange-600 font-medium mb-1">Cash-on-Cash Return</div>
                          <div className="text-2xl font-bold text-orange-900">{roiResults.cashOnCashReturn}%</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Projected Property Value</span>
                          <span className="font-bold text-xl">${parseInt(roiResults.projectedValue).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total ROI</span>
                          <span className="font-bold text-xl text-green-600">{roiResults.totalROI}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Annualized ROI</span>
                          <span className="font-bold text-xl text-blue-600">{roiResults.annualizedROI}%</span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-yellow-800 mb-1">Investment Summary</div>
                            <div className="text-sm text-yellow-700">
                              Based on your inputs, this investment shows a {roiResults.annualizedROI}% annualized return 
                              with ${roiResults.annualCashFlow} in annual cash flow. Consider market conditions and risk factors.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">Ready to Calculate</h3>
                      <p className="text-sm">Fill in the investment details and click calculate to see your projected returns</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Market Comparison */}
          <TabsContent value="comparison">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Market Comparison Analysis
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Compare land investment opportunities across different states
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4">
                  {marketComparisons.map((market, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedComparison === market.state 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => setSelectedComparison(selectedComparison === market.state ? '' : market.state)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{market.state}</h3>
                            <p className="text-gray-600">Avg. ${market.avgPrice.toLocaleString()}/acre</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {market.roi}% ROI
                            </Badge>
                            <Badge variant="outline" className="border-blue-200 text-blue-800">
                              {market.growth}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{market.appreciation}% appreciation</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedComparison && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-semibold text-blue-900 mb-2">Market Insights: {selectedComparison}</h4>
                    <p className="text-blue-800 text-sm">
                      {selectedComparison} shows strong fundamentals with consistent growth patterns. 
                      Consider factors like population growth, infrastructure development, and zoning regulations 
                      when evaluating specific properties in this market.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Assessment */}
          <TabsContent value="risk">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Risk Assessment
                </CardTitle>
                <CardDescription className="text-red-100">
                  Understand potential risks and mitigation strategies
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {riskFactors.map((risk, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{risk.factor}</h3>
                        <Badge 
                          variant={risk.level === 'High' ? 'destructive' : risk.level === 'Medium' ? 'default' : 'secondary'}
                          className={
                            risk.level === 'High' ? 'bg-red-100 text-red-800' :
                            risk.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }
                        >
                          {risk.level} Risk
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm">{risk.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Risk Mitigation Tips
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Diversify across multiple markets and property types</li>
                    <li>• Conduct thorough due diligence on zoning and development potential</li>
                    <li>• Maintain adequate cash reserves for unexpected expenses</li>
                    <li>• Consider professional property management for income-generating land</li>
                    <li>• Stay informed about local market conditions and regulations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tracking */}
          <TabsContent value="portfolio">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Portfolio Overview
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Track your land investment portfolio performance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                    <div className="text-sm text-blue-600 font-medium mb-1">Total Portfolio Value</div>
                    <div className="text-3xl font-bold text-blue-900">$1,632,000</div>
                    <div className="text-sm text-blue-600 mt-1">+12.5% this year</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                    <div className="text-sm text-green-600 font-medium mb-1">Annual Cash Flow</div>
                    <div className="text-3xl font-bold text-green-900">$89,400</div>
                    <div className="text-sm text-green-600 mt-1">5.5% yield</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                    <div className="text-sm text-purple-600 font-medium mb-1">Average ROI</div>
                    <div className="text-3xl font-bold text-purple-900">15.4%</div>
                    <div className="text-sm text-purple-600 mt-1">Above market avg</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Your Properties</h3>
                  {portfolioProperties.map((property) => (
                    <div key={property.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                            <Home className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{property.name}</h4>
                            <p className="text-gray-600">${property.value.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={property.status === 'Performing' ? 'default' : 'secondary'}
                            className={property.status === 'Performing' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                          >
                            {property.status}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">{property.roi}% ROI</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-4">
                  <Button className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Add New Property
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InvestmentToolsPage;