import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  User, 
  MessageSquare,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface ContactAgentFormProps {
  propertyId: number;
  propertyTitle: string;
  propertyLocation: string;
  agentName?: string;
  agentPhoto?: string;
  agentBrokerage?: string;
}

const ContactAgentForm: React.FC<ContactAgentFormProps> = ({ 
  propertyId, 
  propertyTitle,
  propertyLocation,
  agentName = 'Land Specialist',
  agentPhoto = 'https://randomuser.me/api/portraits/men/32.jpg',
  agentBrokerage = 'TerraTracts'
}) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(`Hi ${agentName}, I'm interested in ${propertyTitle} in ${propertyLocation}. Please contact me to discuss further.`);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreeToTerms) {
      toast({
        title: "You must agree to the terms",
        description: "Please agree to the terms and conditions before submitting your inquiry.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      toast({
        title: "Inquiry Sent!",
        description: "Your message has been sent to the agent. They will contact you shortly.",
      });
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setName('');
        setEmail('');
        setPhone('');
        setMessage(`Hi ${agentName}, I'm interested in ${propertyTitle} in ${propertyLocation}. Please contact me to discuss further.`);
        setAgreeToTerms(false);
        setIsSubmitted(false);
      }, 3000);
    }, 1500);
  };
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center mb-6">
        <div className="h-14 w-14 bg-gray-100 rounded-full flex-shrink-0 mr-4 overflow-hidden">
          <img 
            src={agentPhoto} 
            alt={agentName} 
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://randomuser.me/api/portraits/men/32.jpg';
            }}
          />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">{agentName}</h3>
          <p className="text-gray-500 text-sm">{agentBrokerage}</p>
        </div>
      </div>
      
      {isSubmitted ? (
        <div className="text-center py-8">
          <div className="mx-auto bg-green-50 h-16 w-16 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Message Sent!</h3>
          <p className="text-gray-500">
            Your inquiry has been sent. {agentName} will get back to you shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="name"
                  type="text"
                  className="pl-10 text-gray-800"
                  placeholder="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  className="pl-10 text-gray-800"
                  placeholder="email@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  className="pl-10 text-gray-800"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                </div>
                <Textarea
                  id="message"
                  className="pl-10 min-h-[100px] text-gray-800"
                  placeholder="Write your message here..."
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox 
                id="agreeToTerms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              />
              <label htmlFor="agreeToTerms" className="text-sm text-gray-500 leading-tight">
                I agree to receive communications about this and other properties. I understand my data will be processed in accordance with the Privacy Policy.
              </label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-6 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Inquiry...
                </>
              ) : (
                "Send Inquiry"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ContactAgentForm;