import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OTPInput } from '@/components/auth/OTPInput';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface OTPVerificationProps {
  userId: number;
  method: 'email' | 'sms';
  destination: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const OTPVerification = ({
  userId,
  method,
  destination,
  onSuccess,
  onCancel
}: OTPVerificationProps) => {
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const { toast } = useToast();
  const { verifyOtp, resendOtp } = useAuth();

  // Set up countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a 6-digit verification code',
        variant: 'destructive',
      });
      return;
    }

    try {
      await verifyOtp.mutateAsync({
        userId,
        code,
        method
      });
      onSuccess();
    } catch (error: any) {
      // The error toast is already handled in the useMutation error handler
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp.mutateAsync({
        userId,
        method
      });
      setCountdown(60);
      toast({
        title: 'Code resent',
        description: `A new verification code has been sent to your ${method === 'email' ? 'email' : 'phone'}`,
      });
    } catch (error: any) {
      // The error toast is already handled in the useMutation error handler
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Enter verification code</CardTitle>
        <CardDescription>
          {method === 'email' 
            ? `We've sent a 6-digit code to ${destination}` 
            : `We've sent a 6-digit code to ${destination}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OTPInput 
          value={code} 
          onChange={setCode} 
          length={6}
          disabled={verifyOtp.isPending}
        />
        
        <div className="text-center text-sm text-muted-foreground mt-4">
          {countdown > 0 ? (
            <p>Resend code in {countdown} seconds</p>
          ) : (
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal"
              onClick={handleResend}
              disabled={resendOtp.isPending}
            >
              {resendOtp.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Resend verification code
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={verifyOtp.isPending}>
          Cancel
        </Button>
        <Button 
          onClick={handleVerify}
          disabled={code.length !== 6 || verifyOtp.isPending}
        >
          {verifyOtp.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Verify
        </Button>
      </CardFooter>
    </Card>
  );
};