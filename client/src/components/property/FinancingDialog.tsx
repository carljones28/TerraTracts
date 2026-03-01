import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle, 
  DialogClose
} from '@/components/ui/dialog';
import { 
  CreditCard, 
  CheckCircle, 
  ArrowRight,
  DollarSign,
  X,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import { FinancingPlan } from '@/types';

interface FinancingDialogProps {
  propertyPrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans?: FinancingPlan[];
  isAgentProperty?: boolean;
}

const DEFAULT_PLANS: FinancingPlan[] = [
  {
    id: 'plan1',
    name: 'Standard Plan',
    downPaymentPercentage: 20,
    termYears: 5,
    interestRate: 7.99,
  },
  {
    id: 'plan2',
    name: 'Premium Plan',
    downPaymentPercentage: 25,
    termYears: 10,
    interestRate: 6.99,
    featured: true,
  },
  {
    id: 'plan3',
    name: 'Custom Plan',
    downPaymentPercentage: 15,
    termYears: 15,
    interestRate: 8.49,
  }
];

const EXTERNAL_FINANCING_OPTIONS = [
  {
    name: 'Farm Credit Services',
    description: 'Specialized lending for agricultural and rural properties',
    link: 'https://farmcredit.com'
  },
  {
    name: 'Land Watch Financing Network',
    description: 'Connect with multiple land loan specialists',
    link: 'https://www.landwatch.com/financing'
  },
  {
    name: 'Community Banks',
    description: 'Local banks often have specialized land loan programs',
    link: '#'
  }
];

const FinancingDialog: React.FC<FinancingDialogProps> = ({ 
  propertyPrice, 
  open,
  onOpenChange,
  plans = DEFAULT_PLANS,
  isAgentProperty = false
}) => {
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  // Calculate monthly payment using amortization formula
  const calculateMonthlyPayment = (price: number, downPercentage: number, interestRate: number, termYears: number) => {
    const loanAmount = price * (1 - downPercentage / 100);
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = termYears * 12;
    
    if (monthlyRate === 0) return loanAmount / numPayments;
    
    const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                    (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    return payment;
  };
  
  const handleApplyClick = (planId: string) => {
    setSelectedPlanId(planId);
    
    toast({
      title: "Financing Application",
      description: "Our team will contact you about financing options for this property.",
    });
  };
  
  // Content for when agent doesn't offer financing
  const noFinancingContent = (
    <div className="space-y-6">
      <div className="text-center py-4">
        <CreditCard className="h-12 w-12 text-primary/30 mx-auto mb-3" />
        <h3 className="text-xl font-medium mb-2">No In-House Financing Available</h3>
        <p className="text-gray-500 mb-6">
          The seller of this property doesn't currently offer in-house financing options.
          However, you may explore these alternative financing sources.
        </p>
      </div>
      
      <div className="space-y-4">
        <h4 className="font-medium text-lg">External Financing Options</h4>
        
        {EXTERNAL_FINANCING_OPTIONS.map((option, idx) => (
          <Card key={idx} className="border border-gray-200 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex justify-between">
                <div>
                  <h5 className="font-medium">{option.name}</h5>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
                
                <a href={option.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <div className="pt-2">
          <p className="text-sm text-gray-500">
            <span className="font-medium">Pro Tip:</span> Contact your local bank or credit union as they may offer competitive rates for land loans, especially if you are already a customer.
          </p>
        </div>
      </div>
    </div>
  );
  
  // Content for agent financing plans
  const financingPlansContent = (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <div className="h-10 w-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-3">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Owner Financing Plans</h3>
          <p className="text-gray-500 text-sm">
            Simple owner financing options for this property
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {plans.map((plan) => {
          const downPayment = propertyPrice * (plan.downPaymentPercentage / 100);
          const monthlyPayment = calculateMonthlyPayment(propertyPrice, plan.downPaymentPercentage, plan.interestRate, plan.termYears);
          const isSelected = selectedPlanId === plan.id;
          
          return (
            <Card 
              key={plan.id} 
              className={`border ${plan.featured ? 'border-primary shadow-md' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.featured && (
                <div className="bg-primary text-white text-xs font-medium text-center py-1">
                  RECOMMENDED
                </div>
              )}
              
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-1">{plan.name}</h3>
                
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900 flex items-center">
                    {formatPrice(Math.round(monthlyPayment))}
                    <span className="text-sm font-normal text-gray-500 ml-1">/mo</span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    for {plan.termYears} years at {plan.interestRate}% interest
                  </p>
                </div>
                
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Down Payment:</span>
                    <span className="font-medium">{formatPrice(downPayment)} ({plan.downPaymentPercentage}%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Term:</span>
                    <span className="font-medium">{plan.termYears} years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Interest Rate:</span>
                    <span className="font-medium">{plan.interestRate}%</span>
                  </div>
                </div>
                
                <Button 
                  variant={plan.featured ? "default" : "outline"} 
                  className="w-full"
                  onClick={() => handleApplyClick(plan.id)}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" /> 
                      Applied
                    </>
                  ) : (
                    <>
                      Apply Now <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-500 text-sm">
          <span className="font-medium">Disclaimer:</span> Financing is subject to approval. Rates shown are examples and subject to change. 
          Contact us for full terms and conditions. No bank qualification for owner financing.
        </p>
      </div>
    </div>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Financing Options</DialogTitle>
          <DialogDescription>
            Explore financing options for purchasing this property
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {isAgentProperty ? financingPlansContent : noFinancingContent}
        </div>
        
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default FinancingDialog;