import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SchemaUser } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type User = Omit<SchemaUser, 'password'>;

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'buyer' | 'seller' | 'agent';
};

type InitiateVerificationData = {
  userId: number;
  method: 'email' | 'sms';
  destination: string;
};

type VerifyOtpData = {
  userId: number;
  code: string;
  method: 'email' | 'sms';
};

type ResendOtpData = {
  userId: number;
  method: 'email' | 'sms';
};

type SwitchRoleData = {
  role: 'buyer' | 'seller' | 'agent';
};

type AuthContextType = {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  login: UseMutationResult<User, Error, LoginData>;
  register: UseMutationResult<User, Error, RegisterData>;
  logout: UseMutationResult<void, Error, void>;
  initiateVerification: UseMutationResult<void, Error, InitiateVerificationData>;
  verifyOtp: UseMutationResult<User, Error, VerifyOtpData>;
  resendOtp: UseMutationResult<void, Error, ResendOtpData>;
  switchRole: UseMutationResult<{message: string, user: User}, Error, SwitchRoleData>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch current user with better error handling
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Update authentication status based on user data
  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  // Login mutation
  const login = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',  // Important for auth cookie handling
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      return response.json();
    },
    onSuccess: (userData: User) => {
      // Update the query cache
      queryClient.setQueryData(['/api/auth/me'], userData);
      
      // Ensure the authentication state is updated
      setIsAuthenticated(true);
      
      // Invalidate and refetch all queries that depend on authentication
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Refresh user data
      refetchUser();
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.firstName || userData.username}!`,
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

  // Registration mutation
  const register = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',  // Important for auth cookie handling
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      return response.json();
    },
    onSuccess: (userData: User) => {
      // Update the query cache
      queryClient.setQueryData(['/api/auth/me'], userData);
      
      // Ensure the authentication state is updated
      setIsAuthenticated(true);
      
      // Invalidate and refetch all queries that depend on authentication
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] }); 
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Refresh user data
      refetchUser();
      
      toast({
        title: "Registration successful",
        description: `Welcome to TerraTracts, ${userData.firstName || userData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',  // Important for auth cookie handling
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Logout failed');
      }
    },
    onSuccess: () => {
      // Clear auth state in client
      queryClient.setQueryData(['/api/auth/me'], null);
      setIsAuthenticated(false);
      
      // Clear all auth-dependent queries from cache
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.removeQueries({ queryKey: ['/api/favorites'] });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initiate verification mutation
  const initiateVerification = useMutation({
    mutationFn: async (data: InitiateVerificationData) => {
      const response = await fetch('/api/auth/verify/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',  // Important for auth cookie handling
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate verification');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify OTP mutation
  const verifyOtp = useMutation({
    mutationFn: async (data: VerifyOtpData) => {
      const response = await fetch('/api/auth/verify/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',  // Important for auth cookie handling
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify code');
      }

      return response.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(['/api/auth/me'], userData);
      toast({
        title: "Verification successful",
        description: "Your account has been verified.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Resend OTP mutation
  const resendOtp = useMutation({
    mutationFn: async (data: ResendOtpData) => {
      const response = await fetch('/api/auth/verify/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',  // Important for auth cookie handling
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend code');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resend code",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Switch role mutation (Quick Profile Role Switching)
  const switchRole = useMutation({
    mutationFn: async (data: SwitchRoleData) => {
      const response = await fetch('/api/users/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',  // Important for auth cookie handling
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to switch role');
      }

      return response.json();
    },
    onSuccess: (data: {message: string, user: User}) => {
      // Update the user data in the cache with the new role
      queryClient.setQueryData(['/api/auth/me'], data.user);
      
      // Determine the dashboard path based on new role
      let dashboardPath = '/';
      switch (data.user.role) {
        case 'buyer':
          dashboardPath = '/buyer/dashboard';
          break;
        case 'seller':
          dashboardPath = '/seller/dashboard';
          break;
        case 'agent':
          dashboardPath = '/agent/dashboard';
          break;
      }
      
      toast({
        title: "Role switched successfully",
        description: `You are now in ${data.user.role} mode. Redirecting to your dashboard...`,
      });
      
      // Navigate after a short delay to allow the toast to be seen
      setTimeout(() => {
        window.location.href = dashboardPath;
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to switch role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        error,
        login,
        register,
        logout,
        initiateVerification,
        verifyOtp,
        resendOtp,
        switchRole,
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