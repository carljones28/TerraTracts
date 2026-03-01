import React, { useState } from 'react';
import { Search, Phone, Mail, MessageCircle, Clock, User, FileText, ArrowRight, CheckCircle, AlertCircle, HelpCircle, Book, Video, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const HelpCenterPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [supportTicket, setSupportTicket] = useState({
    name: '',
    email: '',
    category: '',
    priority: '',
    subject: '',
    description: ''
  });

  const categories = [
    { id: 'all', name: 'All Topics', icon: HelpCircle, count: 48 },
    { id: 'account', name: 'Account & Billing', icon: User, count: 12 },
    { id: 'property', name: 'Property Listings', icon: FileText, count: 15 },
    { id: 'search', name: 'Search & Filters', icon: Search, count: 8 },
    { id: 'technical', name: 'Technical Issues', icon: AlertCircle, count: 7 },
    { id: 'investment', name: 'Investment Tools', icon: Book, count: 6 }
  ];

  const faqs = [
    {
      category: 'account',
      q: 'How do I create an account?',
      a: 'Click the "Sign Up" button in the top right corner, enter your email and create a password. You\'ll receive a confirmation email to verify your account.'
    },
    {
      category: 'account',
      q: 'How do I reset my password?',
      a: 'Click "Forgot Password" on the login page, enter your email address, and follow the instructions in the reset email.'
    },
    {
      category: 'account',
      q: 'How do I update my billing information?',
      a: 'Go to Account Settings > Billing to update your payment method and billing address.'
    },
    {
      category: 'property',
      q: 'How do I list my property for sale?',
      a: 'Click "List Property" in your dashboard, fill out the property details form, upload photos, and submit for review. Listings typically go live within 24 hours.'
    },
    {
      category: 'property',
      q: 'What information do I need to list a property?',
      a: 'You\'ll need property details (acreage, location, price), high-quality photos, legal description, and any relevant documents like surveys or deeds.'
    },
    {
      category: 'property',
      q: 'How do I edit my property listing?',
      a: 'Go to "My Listings" in your dashboard, select the property you want to edit, make your changes, and save.'
    },
    {
      category: 'search',
      q: 'How do I use the advanced search filters?',
      a: 'Click the filter icon on the properties page to access options like price range, acreage, property type, and location filters.'
    },
    {
      category: 'search',
      q: 'Can I save my search preferences?',
      a: 'Yes, create a free account and use the "Save Search" feature to bookmark your preferred filters and get email alerts for new matching properties.'
    },
    {
      category: 'technical',
      q: 'The map is not loading properly',
      a: 'Try refreshing the page or clearing your browser cache. Ensure JavaScript is enabled and you\'re using an up-to-date browser.'
    },
    {
      category: 'technical',
      q: 'I\'m having trouble uploading photos',
      a: 'Make sure your images are under 10MB each and in JPG or PNG format. Try using a different browser if the issue persists.'
    },
    {
      category: 'investment',
      q: 'How accurate are the ROI calculations?',
      a: 'Our calculations use standard financial formulas and current market data. Results are estimates and should be verified with a financial advisor.'
    },
    {
      category: 'investment',
      q: 'Can I export investment analysis reports?',
      a: 'Yes, premium users can export detailed PDF reports from the Investment Tools section.'
    }
  ];

  const supportChannels = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      availability: 'Available 9 AM - 6 PM EST',
      action: 'Start Chat',
      color: 'bg-blue-500',
      available: true
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak directly with a support specialist',
      availability: '1-800-LAND-123',
      action: 'Call Now',
      color: 'bg-green-500',
      available: true
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us a detailed message',
      availability: 'Response within 24 hours',
      action: 'Send Email',
      color: 'bg-purple-500',
      available: true
    }
  ];

  const quickLinks = [
    { title: 'Getting Started Guide', icon: Book, url: '#', type: 'internal' },
    { title: 'Video Tutorials', icon: Video, url: '#', type: 'internal' },
    { title: 'API Documentation', icon: FileText, url: '#', type: 'external' },
    { title: 'Download Mobile App', icon: Download, url: '#', type: 'external' },
    { title: 'Community Forum', icon: MessageCircle, url: '#', type: 'external' },
    { title: 'Feature Requests', icon: HelpCircle, url: '#', type: 'internal' }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSupportTicket = () => {
    if (supportTicket.name && supportTicket.email && supportTicket.subject && supportTicket.description) {
      alert(`Support ticket submitted successfully! Ticket ID: #${Math.random().toString(36).substr(2, 9).toUpperCase()}\n\nWe'll respond within 24 hours.`);
      setSupportTicket({
        name: '',
        email: '',
        category: '',
        priority: '',
        subject: '',
        description: ''
      });
    } else {
      alert('Please fill in all required fields');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to your questions or get in touch with our support team
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for help articles, tutorials, or common questions..."
              className="pl-12 pr-4 py-4 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="faq" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-1/2 mx-auto">
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">FAQ</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Contact</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Book className="w-4 h-4" />
              <span className="hidden sm:inline">Resources</span>
            </TabsTrigger>
          </TabsList>

          {/* FAQ Section */}
          <TabsContent value="faq">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Categories Sidebar */}
              <div className="lg:col-span-1">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-1">
                      {categories.map((category) => {
                        const IconComponent = category.icon;
                        return (
                          <button
                            key={category.id}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                              selectedCategory === category.id
                                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                            onClick={() => setSelectedCategory(category.id)}
                          >
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              <span className="text-sm font-medium">{category.name}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {category.count}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* FAQ Content */}
              <div className="lg:col-span-3">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Frequently Asked Questions
                    </CardTitle>
                    <CardDescription>
                      {filteredFaqs.length} articles found
                      {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                      {filteredFaqs.map((faq, index) => (
                        <AccordionItem
                          key={index}
                          value={`item-${index}`}
                          className="border border-gray-200 rounded-lg px-4"
                        >
                          <AccordionTrigger className="text-left hover:no-underline py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <HelpCircle className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="font-medium">{faq.q}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4 pl-11 text-gray-600">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>

                    {filteredFaqs.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">No articles found</h3>
                        <p className="text-sm">Try adjusting your search terms or browse a different category</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Contact Section */}
          <TabsContent value="contact">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Support Channels */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Contact Support
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Choose your preferred way to get help
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {supportChannels.map((channel, index) => {
                    const IconComponent = channel.icon;
                    return (
                      <div key={index} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 ${channel.color} rounded-lg flex items-center justify-center`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{channel.title}</h3>
                            <p className="text-gray-600 text-sm mb-1">{channel.description}</p>
                            <p className="text-xs text-gray-500">{channel.availability}</p>
                          </div>
                          <Button 
                            className={channel.available ? '' : 'opacity-50 cursor-not-allowed'}
                            onClick={() => {
                              if (channel.title === 'Live Chat') {
                                alert('Chat widget would open here. Currently in demo mode.');
                              } else if (channel.title === 'Phone Support') {
                                window.open('tel:1-800-526-3123');
                              } else {
                                alert('Email client would open here. Currently in demo mode.');
                              }
                            }}
                          >
                            {channel.action}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Support Ticket Form */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Submit a Ticket
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Send us a detailed message about your issue
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={supportTicket.name}
                        onChange={(e) => setSupportTicket({...supportTicket, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={supportTicket.email}
                        onChange={(e) => setSupportTicket({...supportTicket, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={supportTicket.category} onValueChange={(value) => setSupportTicket({...supportTicket, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="account">Account & Billing</SelectItem>
                          <SelectItem value="property">Property Listings</SelectItem>
                          <SelectItem value="technical">Technical Issues</SelectItem>
                          <SelectItem value="investment">Investment Tools</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={supportTicket.priority} onValueChange={(value) => setSupportTicket({...supportTicket, priority: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      value={supportTicket.subject}
                      onChange={(e) => setSupportTicket({...supportTicket, subject: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide detailed information about your issue..."
                      rows={4}
                      value={supportTicket.description}
                      onChange={(e) => setSupportTicket({...supportTicket, description: e.target.value})}
                    />
                  </div>

                  <Button 
                    onClick={handleSupportTicket}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Submit Support Ticket
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resources Section */}
          <TabsContent value="resources">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickLinks.map((link, index) => {
                const IconComponent = link.icon;
                return (
                  <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur hover:shadow-xl transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">{link.title}</h3>
                          {link.type === 'external' && (
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full group-hover:bg-blue-50 group-hover:border-blue-200"
                        onClick={() => {
                          if (link.type === 'external') {
                            window.open(link.url, '_blank');
                          } else {
                            alert(`${link.title} would open here. Currently in demo mode.`);
                          }
                        }}
                      >
                        Access Resource
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Status Dashboard */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Current operational status of our services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { service: 'Website', status: 'Operational', color: 'text-green-600' },
                    { service: 'Search Engine', status: 'Operational', color: 'text-green-600' },
                    { service: 'Map Services', status: 'Operational', color: 'text-green-600' },
                    { service: 'Payment System', status: 'Operational', color: 'text-green-600' }
                  ].map((item, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.service}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className={`text-sm ${item.color}`}>{item.status}</span>
                        </div>
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

export default HelpCenterPage;