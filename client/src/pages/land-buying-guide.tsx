import React, { useState } from 'react';
import { BookOpen, CheckCircle, Clock, MapPin, DollarSign, FileText, Users, Shield, Lightbulb, AlertTriangle, ArrowRight, ChevronDown, ChevronUp, PlayCircle, Download, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const LandBuyingGuidePage = () => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  const steps = [
    {
      id: 1,
      title: 'Define Your Goals',
      description: 'Determine your purpose for buying land',
      timeEstimate: '1-2 hours',
      difficulty: 'Easy',
      icon: DollarSign,
      color: 'bg-blue-500',
      details: [
        'Identify primary use: residential, recreational, investment, or agricultural',
        'Set budget range including purchase price and development costs',
        'Consider timeline for purchase and potential development',
        'Research zoning requirements for intended use'
      ]
    },
    {
      id: 2,
      title: 'Research Locations',
      description: 'Find areas that match your criteria',
      timeEstimate: '2-4 weeks',
      difficulty: 'Medium',
      icon: MapPin,
      color: 'bg-green-500',
      details: [
        'Study local market trends and property values',
        'Research infrastructure: roads, utilities, internet access',
        'Check local regulations and building codes',
        'Evaluate climate, natural disasters, and environmental factors',
        'Consider proximity to amenities and services'
      ]
    },
    {
      id: 3,
      title: 'Secure Financing',
      description: 'Arrange funding for your land purchase',
      timeEstimate: '2-6 weeks',
      difficulty: 'Hard',
      icon: DollarSign,
      color: 'bg-purple-500',
      details: [
        'Get pre-approved for land loans or financing',
        'Compare interest rates from multiple lenders',
        'Understand down payment requirements (typically 20-50%)',
        'Consider alternative financing: owner financing, cash',
        'Factor in closing costs and additional fees'
      ]
    },
    {
      id: 4,
      title: 'Property Due Diligence',
      description: 'Thoroughly investigate potential properties',
      timeEstimate: '1-3 weeks',
      difficulty: 'Hard',
      icon: Shield,
      color: 'bg-orange-500',
      details: [
        'Order professional land survey',
        'Conduct soil and environmental testing',
        'Verify property boundaries and easements',
        'Check for liens, taxes, and legal issues',
        'Review deed restrictions and HOA requirements'
      ]
    },
    {
      id: 5,
      title: 'Make an Offer',
      description: 'Submit a competitive purchase offer',
      timeEstimate: '1-2 weeks',
      difficulty: 'Medium',
      icon: FileText,
      color: 'bg-red-500',
      details: [
        'Analyze comparable sales in the area',
        'Include appropriate contingencies in offer',
        'Negotiate terms and conditions',
        'Set reasonable inspection and financing deadlines',
        'Work with experienced real estate attorney'
      ]
    },
    {
      id: 6,
      title: 'Close the Deal',
      description: 'Complete the purchase transaction',
      timeEstimate: '2-4 weeks',
      difficulty: 'Medium',
      icon: CheckCircle,
      color: 'bg-emerald-500',
      details: [
        'Complete final property inspection',
        'Secure title insurance',
        'Review all closing documents carefully',
        'Conduct final walkthrough',
        'Transfer funds and receive deed'
      ]
    }
  ];

  const checklists = {
    financial: [
      'Credit score check and improvement if needed',
      'Down payment savings (20-50% of purchase price)',
      'Pre-approval letter from lender',
      'Proof of income and employment',
      'Bank statements and financial records',
      'Budget for closing costs (2-5% of purchase price)',
      'Reserve funds for immediate property needs'
    ],
    legal: [
      'Property deed and title search',
      'Survey and boundary verification',
      'Zoning compliance and restrictions',
      'Easements and right-of-way documentation',
      'Environmental assessments',
      'Tax records and assessment',
      'Insurance requirements and options'
    ],
    physical: [
      'Soil quality and composition testing',
      'Water source availability and quality',
      'Utility access and connection costs',
      'Road access and maintenance agreements',
      'Flood zone and natural disaster risks',
      'Topography and drainage assessment',
      'Vegetation and wildlife considerations'
    ]
  };

  const commonMistakes = [
    {
      mistake: 'Skipping the land survey',
      impact: 'High',
      description: 'Not knowing exact boundaries can lead to neighbor disputes and legal issues',
      prevention: 'Always order a professional survey before closing'
    },
    {
      mistake: 'Ignoring utility costs',
      impact: 'High',
      description: 'Connecting utilities to raw land can cost $50,000+ in rural areas',
      prevention: 'Get quotes for utility connections before making an offer'
    },
    {
      mistake: 'Not checking zoning restrictions',
      impact: 'High',
      description: 'Zoning may prevent your intended use of the property',
      prevention: 'Verify zoning allows your intended use before purchasing'
    },
    {
      mistake: 'Overlooking access rights',
      impact: 'Medium',
      description: 'Property may be landlocked or have limited access',
      prevention: 'Ensure legal access to public roads is documented'
    },
    {
      mistake: 'Inadequate financing planning',
      impact: 'High',
      description: 'Land loans have different terms than home mortgages',
      prevention: 'Research land-specific financing options early'
    },
    {
      mistake: 'Rushing due diligence',
      impact: 'High',
      description: 'Missing critical issues that could be costly later',
      prevention: 'Take time for thorough inspections and research'
    }
  ];

  const resources = [
    {
      title: 'Land Loan Calculator',
      description: 'Calculate monthly payments and total costs',
      type: 'Tool',
      action: 'Use Calculator'
    },
    {
      title: 'Zoning Guide by State',
      description: 'Understand zoning laws in your target area',
      type: 'Guide',
      action: 'Download PDF'
    },
    {
      title: 'Due Diligence Checklist',
      description: 'Printable checklist for property research',
      type: 'Checklist',
      action: 'Download PDF'
    },
    {
      title: 'Video: Land Buying Basics',
      description: '15-minute overview of the land buying process',
      type: 'Video',
      action: 'Watch Now'
    },
    {
      title: 'Connect with Local Agents',
      description: 'Find experienced land specialists in your area',
      type: 'Directory',
      action: 'Find Agents'
    },
    {
      title: 'Legal Document Templates',
      description: 'Sample contracts and agreement templates',
      type: 'Templates',
      action: 'Download'
    }
  ];

  const toggleStepCompletion = (stepId: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const progressPercentage = (completedSteps.length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl mb-6">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Complete Land Buying Guide</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master the land buying process with our comprehensive step-by-step guide
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Progress</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {completedSteps.length} of {steps.length} completed
              </Badge>
            </div>
            <Progress value={progressPercentage} className="mb-4" />
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>{completedSteps.length} steps completed</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{steps.length - completedSteps.length} steps remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experience Level Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/70 backdrop-blur rounded-xl p-2 shadow-sm">
            <div className="flex gap-2">
              {[
                { level: 'beginner', label: 'First-Time Buyer' },
                { level: 'intermediate', label: 'Some Experience' },
                { level: 'advanced', label: 'Experienced Investor' }
              ].map(({ level, label }) => (
                <button
                  key={level}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    userLevel === level
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setUserLevel(level as any)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Tabs defaultValue="process" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-2/3 mx-auto">
            <TabsTrigger value="process" className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">Process</span>
            </TabsTrigger>
            <TabsTrigger value="checklists" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Checklists</span>
            </TabsTrigger>
            <TabsTrigger value="mistakes" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Mistakes</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Resources</span>
            </TabsTrigger>
          </TabsList>

          {/* Step-by-Step Process */}
          <TabsContent value="process">
            <div className="space-y-6">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isCompleted = completedSteps.includes(step.id);
                const isExpanded = expandedSection === `step-${step.id}`;
                
                return (
                  <Card key={step.id} className={`shadow-lg border-0 bg-white/80 backdrop-blur transition-all ${isCompleted ? 'ring-2 ring-green-500' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-12 h-12 ${step.color} rounded-lg flex items-center justify-center relative`}>
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : (
                              <IconComponent className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-500 mt-2">Step {step.id}</div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-semibold">{step.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {step.difficulty}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleStepCompletion(step.id)}
                              >
                                {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{step.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {step.timeEstimate}
                            </div>
                          </div>
                          
                          <button
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            onClick={() => setExpandedSection(isExpanded ? null : `step-${step.id}`)}
                          >
                            {isExpanded ? 'Hide Details' : 'Show Details'}
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          {isExpanded && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium mb-3">Detailed Steps:</h4>
                              <ul className="space-y-2">
                                {step.details.map((detail, detailIndex) => (
                                  <li key={detailIndex} className="flex items-start gap-2 text-sm">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                    {detail}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Checklists */}
          <TabsContent value="checklists">
            <div className="grid lg:grid-cols-3 gap-6">
              {Object.entries(checklists).map(([category, items]) => (
                <Card key={category} className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader className={`${
                    category === 'financial' ? 'bg-gradient-to-r from-green-600 to-emerald-600' :
                    category === 'legal' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' :
                    'bg-gradient-to-r from-purple-600 to-pink-600'
                  } text-white rounded-t-lg`}>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      {category === 'financial' ? <DollarSign className="w-5 h-5" /> :
                       category === 'legal' ? <Shield className="w-5 h-5" /> :
                       <MapPin className="w-5 h-5" />}
                      {category} Checklist
                    </CardTitle>
                    <CardDescription className={`${
                      category === 'financial' ? 'text-green-100' :
                      category === 'legal' ? 'text-blue-100' :
                      'text-purple-100'
                    }`}>
                      Essential {category} considerations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => alert(`${category.charAt(0).toUpperCase() + category.slice(1)} checklist would be downloaded as a PDF`)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Common Mistakes */}
          <TabsContent value="mistakes">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Common Mistakes to Avoid
                </CardTitle>
                <CardDescription className="text-red-100">
                  Learn from others' experiences and avoid costly errors
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {commonMistakes.map((mistake, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg">{mistake.mistake}</h3>
                        <Badge 
                          variant={mistake.impact === 'High' ? 'destructive' : 'secondary'}
                          className={mistake.impact === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}
                        >
                          {mistake.impact} Impact
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-3">{mistake.description}</p>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-green-800">Prevention: </span>
                            <span className="text-green-700">{mistake.prevention}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources */}
          <TabsContent value="resources">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource, index) => (
                <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur hover:shadow-xl transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        {resource.type === 'Video' ? <PlayCircle className="w-6 h-6 text-white" /> :
                         resource.type === 'Tool' ? <Users className="w-6 h-6 text-white" /> :
                         <FileText className="w-6 h-6 text-white" />}
                      </div>
                      <Badge variant="outline">{resource.type}</Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-blue-50 group-hover:border-blue-200"
                      onClick={() => {
                        if (resource.type === 'Tool') {
                          alert('Land loan calculator would open here. Currently in demo mode.');
                        } else if (resource.type === 'Video') {
                          alert('Video tutorial would play here. Currently in demo mode.');
                        } else {
                          alert(`${resource.title} would be downloaded as a PDF. Currently in demo mode.`);
                        }
                      }}
                    >
                      {resource.action}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LandBuyingGuidePage;