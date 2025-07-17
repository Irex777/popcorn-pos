import { useEffect } from 'react';
import { Route, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ 
  path, 
  component: Component 
}: { 
  path: string; 
  component: () => JSX.Element; 
}) {
  const [, navigate] = useLocation();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const res = await fetch('/api/user');
      if (!res.ok) {
        throw new Error('Not authenticated');
      }
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (!user || error)) {
      navigate('/auth');
    }
  }, [user, isLoading, error, navigate]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return null;
  }

  return <Route path={path} component={Component} />;
}
