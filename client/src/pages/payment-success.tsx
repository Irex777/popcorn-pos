import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

interface PaymentVerificationResponse {
  success: boolean;
  paymentIntent?: string;
}

export default function PaymentSuccess() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('session_id');

  // Redirect if no session ID is present
  useEffect(() => {
    if (!sessionId) {
      toast({
        title: t('checkout.error'),
        description: t('checkout.invalidSession'),
        variant: 'destructive'
      });
      navigate('/');
    }
  }, [sessionId, navigate, toast, t]);

  const { isLoading, error, data }: UseQueryResult<PaymentVerificationResponse, Error> = useQuery({
    queryKey: ['verifyPayment', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('No session ID provided');
      
      const response = await fetch(`/api/verify-payment/${sessionId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment verification failed');
      }
      return response.json();
    },
    enabled: !!sessionId,
    retry: false,
    staleTime: Infinity
  });

  // Show success message when payment is verified
  useEffect(() => {
    if (data?.success) {
      toast({
        title: t('checkout.paymentSuccessful'),
        description: t('checkout.orderProcessed')
      });
    }
  }, [data, toast, t]);

  // Redirect on error after showing error message
  useEffect(() => {
    if (error) {
      toast({
        title: t('checkout.paymentFailed'),
        description: error instanceof Error ? error.message : t('checkout.unexpectedError'),
        variant: 'destructive'
      });
      const timer = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(timer);
    }
  }, [error, navigate, toast, t]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <LoadingAnimation />
        <p className="mt-4 text-muted-foreground">
          {t('checkout.verifyingPayment')}
        </p>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl font-bold text-destructive">
            {t('checkout.paymentFailed')}
          </h1>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : t('checkout.unexpectedError')}
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            {t('common.returnToPOS')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-bold">
          {t('checkout.paymentSuccessful')} 🎉
        </h1>
        <p className="text-muted-foreground">
          {t('checkout.orderProcessed')}
        </p>
        <Button onClick={() => navigate('/')} className="w-full">
          {t('common.returnToPOS')}
        </Button>
      </div>
    </div>
  );
}