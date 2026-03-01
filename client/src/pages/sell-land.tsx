import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Check, MapPin, MousePointerClick, BarChart2, TrendingUp, RotateCcw, Image, MessageSquare, ChevronDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Mock seller testimonials
const testimonials = [
  {
    id: 1,
    name: "Michael Johnson",
    role: "Ranch Owner, Texas",
    quote: "TerraTracts made selling my 120-acre ranch incredibly simple. Their AI tools helped me understand my property's true value and attracted serious buyers within weeks.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
  },
  {
    id: 2,
    name: "Sarah Williams",
    role: "Forest Land Owner, Oregon",
    quote: "The AI-powered DroneFly™ technology showcased my forested property perfectly, highlighting features I didn't even realize were selling points. Sold for 15% above my asking price!",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
  },
  {
    id: 3,
    name: "Robert Garcia",
    role: "Investment Property Seller, Colorado",
    quote: "As someone who's sold multiple properties, I can say TerraTracts' analytics platform is revolutionary. I made data-driven decisions that maximized my investment returns.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
  },
];

// FAQ data
const faqs = [
  {
    question: "How does TerraTracts' AI technology help me sell my land?",
    answer: "Our AI-powered platform offers several unique advantages: automated property valuation based on comparable sales and market trends, DroneFly™ virtual tours that showcase your property's best features, data-driven recommendations for optimal pricing, and targeted marketing to interested buyers based on search patterns."
  },
  {
    question: "What types of land can I sell on TerraTracts?",
    answer: "TerraTracts specializes in all types of land including recreational, agricultural, ranches, wooded lots, waterfront properties, mountain land, development parcels, and more. Our platform is designed to highlight the unique aspects of any land type."
  },
  {
    question: "How much does it cost to list my property?",
    answer: "We offer several listing packages to suit different needs. Our basic package is free and includes standard listing features. Premium packages include enhanced AI tools, featured placement, and advanced analytics starting at competitive rates. You can see detailed pricing on our seller dashboard after registration."
  },
  {
    question: "Can I work with my own real estate agent?",
    answer: "Absolutely! TerraTracts works with licensed real estate professionals. Your agent can manage your listing through our agent portal, giving them access to all our AI tools while maintaining their client relationship with you."
  },
  {
    question: "How long does it typically take to sell land on TerraTracts?",
    answer: "While selling timeframes vary depending on property type, location, and market conditions, our data shows that properties using our AI-enhanced listings sell 35% faster than traditional land listings. Our platform provides real-time analytics on viewer engagement to help you adjust your strategy as needed."
  },
];

export default function SellLandPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyDetails, setPropertyDetails] = useState('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      setLocation('/seller/dashboard');
    } else {
      setLocation('/auth?tab=register&role=seller');
    }
  };

  const handleContactRequest = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the contact request to the server
    toast({
      title: "Request Submitted",
      description: "A TerraTracts specialist will contact you soon about your property.",
    });
    // Clear form
    setName('');
    setEmail('');
    setPhone('');
    setPropertyAddress('');
    setPropertyDetails('');
  };

  return (
    <div className="bg-white text-slate-800">
      {/* Hero Section */}
      <section className="relative">
        <div className="container mx-auto px-4 py-20 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Sell Your Land with <span className="text-primary">AI-Powered</span> Insights
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Leverage cutting-edge artificial intelligence to showcase your property's true potential, 
              attract qualified buyers, and maximize your selling price.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={handleGetStarted}>
                Get Started Now
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#connect">Talk to a Specialist</a>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: <BarChart2 className="h-6 w-6 text-primary" />, text: "35% faster sales on average" },
                { icon: <TrendingUp className="h-6 w-6 text-primary" />, text: "12% higher selling prices" },
                { icon: <MousePointerClick className="h-6 w-6 text-primary" />, text: "3x more qualified leads" },
              ].map((item, i) => (
                <div key={i} className="flex items-center">
                  <div className="mr-3">{item.icon}</div>
                  <p className="text-sm text-slate-700">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1506102383123-c8ef1e872756?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80" 
                alt="Beautiful landscape property" 
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <div className="text-white">
                  <div className="text-sm font-semibold text-primary mb-1">Featured Property</div>
                  <h3 className="text-xl font-bold mb-1">Mountain Vista Acreage</h3>
                  <p className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> Colorado Springs, CO</p>
                  <div className="flex items-center mt-2">
                    <p className="text-lg font-bold mr-4">$450,000</p>
                    <p className="text-sm opacity-90">40 Acres</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-6 -left-6 w-64 h-64 bg-primary/10 rounded-full -z-10"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full -z-10"></div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How TerraTracts Works for Sellers</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Our AI-powered platform makes selling your land simple, transparent, and profitable
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Image className="h-10 w-10 text-primary" />,
                title: "Showcase Your Property",
                description: "Our DroneFly™ technology creates stunning virtual tours and 3D visualizations that highlight your property's best features.",
              },
              {
                icon: <BarChart2 className="h-10 w-10 text-primary" />,
                title: "AI-Powered Analytics",
                description: "Get instant valuation insights, pricing recommendations, and market analysis based on real-time data.",
              },
              {
                icon: <MessageSquare className="h-10 w-10 text-primary" />,
                title: "Connect with Buyers",
                description: "Our SmartMatch™ technology connects your property with qualified buyers actively searching for land like yours.",
              },
            ].map((step, index) => (
              <Card key={index} className="border-none shadow-lg">
                <CardContent className="pt-6">
                  <div className="rounded-full bg-primary/10 p-3 w-16 h-16 flex items-center justify-center mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Success Stories from Land Sellers</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Hear from property owners who achieved exceptional results with TerraTracts
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="border-none shadow-lg">
                <CardContent className="pt-6">
                  <div className="mb-6">
                    <div className="flex text-primary">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-700 italic mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <h4 className="font-bold">{testimonial.name}</h4>
                      <p className="text-sm text-slate-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">AI-Powered Tools for Sellers</h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">
              Exclusive technology that sets your property apart from traditional listings
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center">
              <div className="mb-6 md:mb-0 md:mr-6 shrink-0">
                <div className="rounded-full bg-primary/20 p-4 w-20 h-20 flex items-center justify-center">
                  <RotateCcw className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">DroneFly™ Virtual Tours</h3>
                <p className="text-slate-300 mb-4">
                  Our AI generates immersive aerial footage and virtual tours of your property, 
                  highlighting topography, natural features, and views that photos alone can't capture.
                </p>
                <ul className="space-y-2">
                  {["360° property visualization", "Seasonal view simulations", "Interactive boundary markers"].map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center">
              <div className="mb-6 md:mb-0 md:mr-6 shrink-0">
                <div className="rounded-full bg-secondary/20 p-4 w-20 h-20 flex items-center justify-center">
                  <Image className="h-10 w-10 text-secondary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">LandCanvas™ Property Visualizer</h3>
                <p className="text-slate-300 mb-4">
                  Help buyers envision the potential of your land with AI-generated development concepts,
                  from cabins and homes to recreational and commercial uses.
                </p>
                <ul className="space-y-2">
                  {["Custom development mockups", "Multiple usage scenarios", "Seasonal visualizations"].map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-5 w-5 text-secondary mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center">
              <div className="mb-6 md:mb-0 md:mr-6 shrink-0">
                <div className="rounded-full bg-green-500/20 p-4 w-20 h-20 flex items-center justify-center">
                  <BarChart2 className="h-10 w-10 text-green-500" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">MarketPulse™ Analytics</h3>
                <p className="text-slate-300 mb-4">
                  Access real-time market data, demand trends, and pricing recommendations to position
                  your property competitively and maximize returns.
                </p>
                <ul className="space-y-2">
                  {["Comparative market analysis", "Price optimization algorithms", "Buyer demand tracking"].map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center">
              <div className="mb-6 md:mb-0 md:mr-6 shrink-0">
                <div className="rounded-full bg-amber-500/20 p-4 w-20 h-20 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-amber-500" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">SmartMatch™ Technology</h3>
                <p className="text-slate-300 mb-4">
                  Our AI analyzes buyer search patterns and preferences to match your property with
                  the most likely purchasers, reducing time on market.
                </p>
                <ul className="space-y-2">
                  {["Targeted buyer matching", "Proactive lead generation", "Interest prediction algorithms"].map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-5 w-5 text-amber-500 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Everything you need to know about selling your land with TerraTracts
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible>
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Connect With Us Section */}
      <section id="connect" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Ready to Sell Your Land?</h2>
              <p className="text-lg text-slate-600 mb-6">
                Take the first step towards a successful sale. Fill out the form and a TerraTracts 
                specialist will contact you to discuss your property and our AI-powered selling process.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="mr-4 bg-primary/10 rounded-full p-2">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Personalized Strategy</h4>
                    <p className="text-slate-600">Get a customized selling plan tailored to your property type and goals</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-4 bg-primary/10 rounded-full p-2">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">AI Value Assessment</h4>
                    <p className="text-slate-600">Discover your property's true market value with our advanced AI analysis</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-4 bg-primary/10 rounded-full p-2">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">No Obligation</h4>
                    <p className="text-slate-600">Learn about our process with zero commitment or pressure</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Button size="lg" onClick={handleGetStarted} className="mr-4">
                  Create Account
                </Button>
                <span className="text-slate-600">or</span>
                <Button size="lg" variant="link" asChild>
                  <Link href="/properties">
                    Browse Properties
                  </Link>
                </Button>
              </div>
            </div>
            
            <div>
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Tell Us About Your Property</CardTitle>
                  <CardDescription>
                    Complete the form below and we'll reach out to discuss your options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactRequest} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                          Your Name
                        </label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Smith"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                            Email
                          </label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                            Phone (optional)
                          </label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="propertyAddress" className="block text-sm font-medium text-slate-700 mb-1">
                          Property Location
                        </label>
                        <Input
                          id="propertyAddress"
                          value={propertyAddress}
                          onChange={(e) => setPropertyAddress(e.target.value)}
                          placeholder="Address or general location (e.g., county, state)"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="propertyDetails" className="block text-sm font-medium text-slate-700 mb-1">
                          Property Details
                        </label>
                        <Textarea
                          id="propertyDetails"
                          value={propertyDetails}
                          onChange={(e) => setPropertyDetails(e.target.value)}
                          placeholder="Tell us about your property (acreage, features, etc.)"
                          rows={4}
                          required
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full">
                      Request Information
                    </Button>
                    
                    <p className="text-xs text-slate-500 text-center">
                      By submitting this form, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}