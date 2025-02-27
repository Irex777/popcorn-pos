import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import type { Step } from 'react-joyride';

export const useOnboarding = () => {
  const { t } = useTranslation();
  const [location] = useLocation();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(() => {
    return localStorage.getItem('onboarding_complete') === 'true';
  });

  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    // Define steps based on current route
    switch (location) {
      case '/':
        setSteps([
          {
            target: '.pos-heading',
            content: t('onboarding.pos.welcome'),
            placement: 'bottom',
          },
          {
            target: '.categories-filter',
            content: t('onboarding.pos.categories'),
            placement: 'bottom',
          },
          {
            target: '.product-grid',
            content: t('onboarding.pos.products'),
            placement: 'left',
          },
          {
            target: '.cart-panel',
            content: t('onboarding.pos.cart'),
            placement: 'left',
          },
        ]);
        break;
      case '/inventory':
        setSteps([
          {
            target: '.inventory-heading',
            content: t('onboarding.inventory.welcome'),
            placement: 'bottom',
          },
          {
            target: '.add-product-button',
            content: t('onboarding.inventory.addProduct'),
            placement: 'bottom',
          },
          {
            target: '.stock-management',
            content: t('onboarding.inventory.stock'),
            placement: 'left',
          },
        ]);
        break;
      case '/analytics':
        setSteps([
          {
            target: '.analytics-heading',
            content: t('onboarding.analytics.welcome'),
            placement: 'bottom',
          },
          {
            target: '.time-filters',
            content: t('onboarding.analytics.timeFilters'),
            placement: 'bottom',
          },
          {
            target: '.export-buttons',
            content: t('onboarding.analytics.export'),
            placement: 'left',
          },
          {
            target: '.analytics-cards',
            content: t('onboarding.analytics.metrics'),
            placement: 'bottom',
          },
        ]);
        break;
    }
  }, [location, t]);

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_complete', 'true');
    setIsOnboardingComplete(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_complete');
    setIsOnboardingComplete(false);
  };

  return {
    steps,
    isOnboardingComplete,
    completeOnboarding,
    resetOnboarding,
  };
};
