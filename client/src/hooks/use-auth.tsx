import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { apiFetch, logPortInfo } from "@/lib/api";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Log port information for debugging
  useEffect(() => {
    logPortInfo();
  }, []);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async (): Promise<User | null> => {
      try {
        const res = await apiFetch("api/user", {
          method: "GET",
        });
        
        if (res.status === 401) {
          return null;
        }
        
        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }
        
        const data = await res.json();
        return {
          ...data,
          isAdmin: !!data.isAdmin,
          shopIds: data.shopIds || []
        };
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });



  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return res.json();
    },
    onSuccess: (data: User) => {
      // Ensure isAdmin and shopIds are properly set in the cache
      const user = {
        ...data,
        isAdmin: !!data.isAdmin,
        shopIds: data.shopIds || []
      };
      queryClient.setQueryData(["/api/user"], user);
      // Refetch user data to ensure we have the latest
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      // Prefetch user preferences after successful login
      queryClient.prefetchQuery({
        queryKey: ['/api/user/preferences'],
        queryFn: async () => {
          const response = await apiRequest('GET', '/api/user/preferences');
          if (!response.ok) {
            if (response.status === 404) {
              return { language: 'cs', currency: 'CZK' };
            }
            throw new Error('Failed to fetch user preferences');
          }
          return response.json();
        },
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      // Clear user preferences cache on logout
      queryClient.removeQueries({ queryKey: ['/api/user/preferences'] });

    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return res.json();
    },
    onSuccess: (data: User) => {
      // Ensure isAdmin and shopIds are properly set in the cache
      const user = {
        ...data,
        isAdmin: !!data.isAdmin,
        shopIds: data.shopIds || []
      };
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
