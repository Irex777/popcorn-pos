import { useAtom } from "jotai";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { languageAtom, currencyAtom, currencies } from "@/lib/settings";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import i18n from "@/lib/i18n";

export interface UserPreferences {
  language: string;
  currency: string;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [language, setLanguage] = useAtom(languageAtom);
  const [currency, setCurrency] = useAtom(currencyAtom);

  // Get user preferences from server
  const { data: serverPreferences, isLoading, error } = useQuery({
    queryKey: ['/api/user/preferences'],
    queryFn: async (): Promise<UserPreferences> => {
      const response = await apiRequest('GET', 'api/user/preferences');
      if (!response.ok) {
        if (response.status === 404) {
          // User preferences not found, use defaults
          return { language: 'cs', currency: 'CZK' };
        }
        throw new Error('Failed to fetch user preferences');
      }
      return response.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Sync local atoms with server preferences when they're loaded
  useEffect(() => {
    if (serverPreferences && user) {
      if (serverPreferences.language !== language) {
        setLanguage(serverPreferences.language);
        i18n.changeLanguage(serverPreferences.language);
      }
      if (serverPreferences.currency !== currency.code) {
        const serverCurrency = currencies.find(c => c.code === serverPreferences.currency);
        if (serverCurrency) {
          setCurrency(serverCurrency);
        }
      }
    }
  }, [serverPreferences, user, language, currency.code, setLanguage, setCurrency]);

  // Mutation to update preferences on server
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      const response = await apiRequest('PATCH', 'api/user/preferences', preferences);
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating preferences',
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    
    // Sync with server if user is authenticated
    if (user) {
      updatePreferencesMutation.mutate({ language: newLanguage });
    }
  };

  const updateCurrency = (currencyCode: string) => {
    const selectedCurrency = currencies.find(c => c.code === currencyCode);
    if (selectedCurrency) {
      setCurrency(selectedCurrency);
      
      // Sync with server if user is authenticated
      if (user) {
        updatePreferencesMutation.mutate({ currency: currencyCode });
      }
    }
  };

  return {
    preferences: serverPreferences,
    isLoading,
    error,
    updateLanguage,
    updateCurrency,
    isUpdating: updatePreferencesMutation.isPending,
    // Current local values
    language,
    currency,
  };
}
