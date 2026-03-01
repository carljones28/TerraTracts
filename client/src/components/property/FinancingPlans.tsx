import React, { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';

interface FinancingPlan {
  id: string;
  name: string;
  downPaymentPercentage: number;
  termYears: number;
  interestRate: number;
  featured?: boolean;
}

interface FinancingPlansProps {
  propertyPrice: number;
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

const FinancingPlans: React.FC<FinancingPlansProps> = ({ 
  propertyPrice, 
  plans = DEFAULT_PLANS,
  isAgentProperty = true
}) => {
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  if (!isAgentProperty) {
    return null;
  }
  
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
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
      <div className="flex items-center mb-6">
        <div className="h-10 w-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-3">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Our Financing Plans</h2>
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
                    {plan.downPaymentPercentage}% down (${formatPrice(downPayment).slice(1)})
                  </p>
                </div>
                
                <ul className="space-y-2 mb-5">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">
                      {plan.termYears} year term
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">
                      {plan.interestRate}% fixed interest rate
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">
                      No pre-payment penalties
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">
                      Simple qualification process
                    </span>
                  </li>
                </ul>
                
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
};

export default FinancingPlans;