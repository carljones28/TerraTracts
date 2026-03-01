import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Box, 
  ArrowRight, 
  Brain, 
  Search, 
  PlaneTakeoff, 
  LineChart, 
  Layers3
} from 'lucide-react';

interface AIFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  accentColor: string;
  index: number;
}

const AIFeatureCard = ({ icon, title, description, buttonText, accentColor, index }: AIFeatureCardProps) => {
  const { toast } = useToast();
  
  const handleFeatureClick = () => {
    toast({
      title: title,
      description: `${title} feature will be available soon!`,
      duration: 3000,
    });
  };
  
  // Add a staggered animation delay based on the index
  const animationDelay = `${index * 150}ms`;
  
  return (
    <div 
      className="light-card group hover:translate-y-[-5px] transition-all duration-300 relative"
      style={{ animationDelay }}
    >
      <div 
        className={`rounded-lg ${accentColor} h-14 w-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-slate-800 text-xl mb-3">{title}</h3>
      <p className="text-slate-600 mb-5 text-sm leading-relaxed">{description}</p>
      <button 
        className="flex items-center text-primary hover:text-primary/80 transition-colors font-medium group"
        onClick={handleFeatureClick}
      >
        <span className="text-sm">{buttonText}</span>
        <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
      </button>
      
      {/* Subtle hover effect with border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0 bg-gradient-to-r from-primary/40 to-primary/80 group-hover:h-1 transition-all duration-300"></div>
    </div>
  );
};

const AIFeatures = () => {
  const features = [
    {
      icon: <Box className="h-6 w-6 text-blue-500" />,
      title: '3D Parcel Visualization',
      description: 'Explore land in immersive 3D with topography, vegetation, and boundary overlays powered by WebGL.',
      buttonText: 'Experience in 3D',
      accentColor: 'bg-blue-50'
    },
    {
      icon: <Brain className="h-6 w-6 text-purple-500" />,
      title: 'Predictive Land Valuation',
      description: 'AI analyzes soil quality, zoning changes, climate data, and market trends to forecast land value.',
      buttonText: 'View Sample Report',
      accentColor: 'bg-purple-50'
    },
    {
      icon: <Search className="h-6 w-6 text-emerald-500" />,
      title: 'SmartMatch™ Technology',
      description: 'Our NLP-powered search understands natural language queries like "cheap land for tiny home off-grid."',
      buttonText: 'Try SmartMatch',
      accentColor: 'bg-emerald-50'
    },
    {
      icon: <PlaneTakeoff className="h-6 w-6 text-amber-500" />,
      title: 'DroneFly™ Footage',
      description: 'AI-generated drone footage lets you experience properties from above without physical site visits.',
      buttonText: 'Watch Demo',
      accentColor: 'bg-amber-50'
    },
    {
      icon: <Layers3 className="h-6 w-6 text-rose-500" />,
      title: 'Virtual Development Studio',
      description: 'Visualize buildings, landscaping and development concepts directly on your potential property.',
      buttonText: 'Try It Out',
      accentColor: 'bg-rose-50'
    },
    {
      icon: <LineChart className="h-6 w-6 text-indigo-500" />,
      title: 'Risk Analysis',
      description: 'Comprehensive AI risk assessment for natural hazards, regulatory changes, and market fluctuations.',
      buttonText: 'Generate Analysis',
      accentColor: 'bg-indigo-50'
    }
  ];
  
  return (
    <section className="clickup-section bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute left-0 top-0 w-full h-24 bg-gradient-to-b from-white to-transparent"></div>
      <div className="absolute -left-16 top-1/3 w-32 h-32 bg-purple-50 rounded-full filter blur-3xl opacity-60"></div>
      <div className="absolute -right-16 bottom-1/4 w-40 h-40 bg-blue-50 rounded-full filter blur-3xl opacity-60"></div>
      
      <div className="clickup-container relative z-10">
        <div className="text-center mb-16">
          <div className="light-badge inline-flex px-3 py-1 text-sm mb-4">
            <span className="font-medium">AI-Powered Features</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Discover Land With <span className="clickup-gradient-bg text-white px-2 rounded">Intelligent AI</span>
          </h2>
          
          <p className="text-slate-600 max-w-2xl mx-auto">
            Our AI-powered platform helps you find, visualize, and evaluate land with unprecedented accuracy and insight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <AIFeatureCard 
              key={index} 
              {...feature} 
              index={index} 
            />
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <button className="light-button-primary py-3 px-6 flex items-center gap-2 mx-auto">
            <span>Explore All AI Features</span>
            <svg 
              className="w-5 h-5 text-white" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z" 
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default AIFeatures;
