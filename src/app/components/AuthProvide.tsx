'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  User,
  IdTokenResult
} from 'firebase/auth';

// Define custom user type with claims
interface CustomUser extends User {
  customClaims?: {
    role?: string;
    hospitalId?: string;
    [key: string]: any;
  };
  // Add getIdToken as a method (it exists on User but TypeScript needs it explicit)
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  getIdTokenResult: (forceRefresh?: boolean) => Promise<IdTokenResult>;
}

// Define the context type
interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  logout: async () => {},
  login: async () => {},
  refreshUser: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch and attach custom claims
  const attachCustomClaims = async (currentUser: User): Promise<CustomUser> => {
    try {
      // Force refresh to get latest claims (important after role changes!)
      const token: IdTokenResult = await currentUser.getIdTokenResult(true);
      
      // Create custom user object with claims
      const customUser = currentUser as CustomUser;
      
      // Attach custom claims to user object for easy access
      customUser.customClaims = token.claims;

      console.log('✅ User custom claims loaded:', token.claims);
      console.log('User role:', token.claims.role);
      console.log('Hospital ID:', token.claims.hospitalId);
      
      return customUser;
    } catch (err) {
      console.error('❌ Error fetching custom claims:', err);
      return currentUser as CustomUser;
    }
  };

  // Refresh user data and claims (useful after role updates)
  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('🔄 Refreshing user claims...');
      const updatedUser = await attachCustomClaims(currentUser);
      setUser(updatedUser);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('🔐 Auth state changed:', currentUser ? 'User logged in' : 'No user');
      
      try {
        if (currentUser && isMounted) {
          console.log('👤 User ID:', currentUser.uid);
          console.log('📧 User email:', currentUser.email);
          
          // Fetch and attach custom claims
          const userWithClaims = await attachCustomClaims(currentUser);
          
          if (isMounted) {
            setUser(userWithClaims);
            setError(null);
          }
        } else if (isMounted) {
          setUser(null);
          setError(null);
        }
      } catch (err: any) {
        console.error('❌ Auth state change error:', err);
        if (isMounted) {
          setError(err.message || 'Authentication error occurred');
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    // Cleanup function
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔑 Attempting login for:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('✅ Login successful!');
      
      // Fetch custom claims after login
      const userWithClaims = await attachCustomClaims(userCredential.user);
      
      setUser(userWithClaims);
      console.log('✅ User logged in successfully with role:', userWithClaims.customClaims?.role);
    } catch (err: any) {
      console.error('❌ Login error:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👋 Logging out...');
      
      await signOut(auth);
      setUser(null);
      
      console.log('✅ User logged out successfully');
    } catch (err: any) {
      console.error('❌ Logout error:', err);
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    logout,
    login,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Export types for use in other components
export type { CustomUser, AuthContextType };