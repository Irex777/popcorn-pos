import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export default function PaymentCancel() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    toast({
      title: t('checkout.paymentCancelled'),
      description: t('checkout.paymentCancelledDescription'),
      variant: 'default'
    });
  }, [toast, t]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-bold">
          {t('checkout.paymentCancelled')}
        </h1>
        <p className="text-muted-foreground">
          {t('checkout.paymentCancelledDescription')}
        </p>
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/')} 
            className="w-full"
            variant="default"
          >
            {t('common.returnToPOS')}
          </Button>
          <Button 
            onClick={() => window.history.back()} 
            className="w-full"
            variant="outline"
          >
            {t('common.tryAgain')}
          </Button>
        </div>
      </div>
    </div>
  );
}