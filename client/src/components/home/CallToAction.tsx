import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Calendar } from 'lucide-react';

const CallToAction = () => {
  const { toast } = useToast();
  
  const handleGetStarted = () => {
    toast({
      title: "Get Started",
      description: "Registration functionality will be available soon!",
    });
  };
  
  const handleScheduleDemo = () => {
    toast({
      title: "Demo Request",
      description: "Thank you for your interest! Demo scheduling will be available soon.",
    });
  };
  
  return (
    <section className="clickup-section relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-slate-50"></div>
      <div className="absolute top-0 right-0 w-full h-full">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-purple-100 -mr-24 -mt-24 opacity-70"></div>
        <div className="absolute right-1/3 bottom-0 h-40 w-40 rounded-full bg-blue-100 mb-10 opacity-70"></div>
        <div className="absolute left-0 top-1/3 h-52 w-52 rounded-full bg-pink-100 -ml-24 opacity-70"></div>
      </div>
      
      <div className="clickup-container relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center">
            <div className="w-full md:w-3/5 md:pr-8 text-center md:text-left mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                Ready to find your perfect 
                <span className="clickup-gradient-bg text-white px-2 mx-1 rounded">piece of land</span>?
              </h2>
              <p className="text-slate-600 mb-6 text-lg">
                Join TerraTracts today and experience the future of land discovery with our AI-powered platform.
              </p>
              <ul className="mb-6 space-y-2 text-slate-700">
                <li className="flex items-center">
                  <div className="rounded-full bg-emerald-100 p-1 mr-3">
                    <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <span>AI-powered search and matching</span>
                </li>
                <li className="flex items-center">
                  <div className="rounded-full bg-emerald-100 p-1 mr-3">
                    <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <span>Immersive 3D property visualization</span>
                </li>
                <li className="flex items-center">
                  <div className="rounded-full bg-emerald-100 p-1 mr-3">
                    <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <span>Predictive valuation and risk analysis</span>
                </li>
              </ul>
            </div>
            
            <div className="w-full md:w-2/5 bg-slate-50 p-6 md:p-8 rounded-xl border border-slate-100">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Join TerraTracts Today</h3>
              <p className="text-slate-600 mb-6 text-sm">
                Create your free account to start exploring properties and unlock AI-powered insights.
              </p>
              <div className="space-y-3">
                <button 
                  className="w-full clickup-gradient-bg hover:opacity-90 transition-opacity rounded-md py-3 px-4 text-white font-medium shadow-sm flex items-center justify-center"
                  onClick={handleGetStarted}
                >
                  <span>Get Started for Free</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
                <button 
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 transition-colors rounded-md py-3 px-4 text-slate-700 font-medium shadow-sm flex items-center justify-center"
                  onClick={handleScheduleDemo}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Schedule a Demo</span>
                </button>
                <div className="text-xs text-center text-slate-500 mt-4">
                  No credit card required • 14-day free trial
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
