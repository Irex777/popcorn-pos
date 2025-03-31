import React from 'react';
import { useTheme } from './theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Only render children after component is mounted to prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flash of incorrect theme
  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
