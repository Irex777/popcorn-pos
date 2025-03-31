import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { wsClient } from "@/lib/websocket";

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

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async (): Promise<User | null> => {
      try {
        const res = await apiRequest("GET", "/api/user");
        if (!res.ok) {
          if (res.status === 401) return null;
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
    }
  });

  // Update WebSocket authentication state when user data changes
  useEffect(() => {
    wsClient.setAuthenticated(!!user);
  }, [user]);

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
    wsClient.setAuthenticated(false);
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
