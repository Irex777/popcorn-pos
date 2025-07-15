import { ReactNode } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useTheme } from '@/lib/theme';

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { steps, isOnboardingComplete, completeOnboarding } = useOnboarding();
  const { theme } = useTheme();

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      completeOnboarding();
    }
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={!isOnboardingComplete && steps.length > 0}
        continuous
        showProgress
        showSkipButton
        styles={{
          options: {
            primaryColor: 'hsl(var(--primary))',
            textColor: 'hsl(var(--foreground))',
            backgroundColor: 'hsl(var(--background))',
          }
        }}
        callback={handleJoyrideCallback}
      />
      {children}
    </>
  );
}
