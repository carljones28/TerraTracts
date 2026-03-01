import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Mail, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface VerificationMethodSelectorProps {
  userId: number;
  email: string;
  phone?: string;
  onMethodSelected: (method: 'email' | 'sms', destination: string) => void;
  onCancel: () => void;
}

export function VerificationMethodSelector({
  userId,
  email,
  phone,
  onMethodSelected,
  onCancel
}: VerificationMethodSelectorProps) {
  const [method, setMethod] = useState<'email' | 'sms'>('email');
  const { toast } = useToast();
  const { initiateVerification } = useAuth();

  const maskedEmail = email ? `${email.substring(0, 3)}...${email.substring(email.lastIndexOf('@'))}` : '';
  const maskedPhone = phone ? `${phone.substring(0, 3)}...${phone.substring(phone.length - 3)}` : '';

  const handleContinue = async () => {
    if (method === 'sms' && !phone) {
      toast({
        title: 'Phone number required',
        description: 'Please add a phone number to your account first.',
        variant: 'destructive',
      });
      return;
    }

    const destination = method === 'email' ? email : phone!;

    try {
      await initiateVerification.mutateAsync({
        userId,
        method,
        destination
      });
      
      // Pass the masked version for display purposes
      onMethodSelected(method, method === 'email' ? maskedEmail : maskedPhone);
    } catch (error: any) {
      toast({
        title: 'Verification failed to start',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Verify your account</CardTitle>
        <CardDescription>
          Choose how you'd like to receive your verification code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={method} 
          onValueChange={(value) => setMethod(value as 'email' | 'sms')}
          className="space-y-4"
        >
          <div className={`
            flex items-center space-x-2 border rounded-lg p-4 cursor-pointer
            ${method === 'email' ? 'border-primary bg-primary/5' : 'border-border'}
          `}
          onClick={() => setMethod('email')}
          >
            <RadioGroupItem value="email" id="email" />
            <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer flex-1">
              <Mail className="h-5 w-5" />
              <div className="flex flex-col">
                <span>Email</span>
                <span className="text-sm text-muted-foreground">{maskedEmail}</span>
              </div>
            </Label>
          </div>

          {phone && (
            <div className={`
              flex items-center space-x-2 border rounded-lg p-4 cursor-pointer
              ${method === 'sms' ? 'border-primary bg-primary/5' : 'border-border'}
            `}
            onClick={() => setMethod('sms')}
            >
              <RadioGroupItem value="sms" id="sms" />
              <Label htmlFor="sms" className="flex items-center gap-2 cursor-pointer flex-1">
                <Phone className="h-5 w-5" />
                <div className="flex flex-col">
                  <span>SMS</span>
                  <span className="text-sm text-muted-foreground">{maskedPhone}</span>
                </div>
              </Label>
            </div>
          )}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleContinue} disabled={initiateVerification.isPending}>
          {initiateVerification.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}