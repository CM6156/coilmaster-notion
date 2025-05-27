
import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  loading: boolean;
  logout: () => Promise<void>;
  userProfile: any | null;
}

const initialAuthContext: AuthContextType = {
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  loading: true,
  logout: async () => {},
  userProfile: null,
};

export const AuthContext = createContext<AuthContextType>(initialAuthContext);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Check if user is authenticated from localStorage and Supabase session
    const checkAuth = async () => {
      try {
        console.log("AuthProvider: Starting auth check");
        const storedAuth = localStorage.getItem('isAuthenticated');
        const storedProfile = localStorage.getItem('userProfile');
        
        // Also check Supabase session
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        
        console.log("AuthProvider: Checking auth status");
        console.log("Stored auth:", storedAuth);
        console.log("Session exists:", !!session);
        
        if ((storedAuth === 'true' || session)) {
          console.log("User is authenticated");
          setIsAuthenticated(true);
          
          if (storedProfile) {
            try {
              const profile = JSON.parse(storedProfile);
              setUserProfile(profile);
              console.log("User profile loaded:", profile);
            } catch (e) {
              console.error("Error parsing user profile:", e);
            }
          }
        } else {
          console.log("User is not authenticated");
          setIsAuthenticated(false);
          setUserProfile(null);
          
          // Clear localStorage if no session
          if (!session && storedAuth === 'true') {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('userProfile');
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        setUserProfile(null);
      } finally {
        console.log("Auth check complete, setting loading to false");
        setLoading(false);
      }
    };
    
    // Don't set an artificial timeout, let the actual auth check complete first
    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log("User signed in");
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        
        // Try to get user profile from metadata
        const userMeta = session.user.user_metadata;
        if (userMeta) {
          const profile = {
            name: userMeta.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            department: userMeta.department || null,
            loginMethod: 'email',
            provider: 'email'
          };
          setUserProfile(profile);
          localStorage.setItem('userProfile', JSON.stringify(profile));
        }
        
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out");
        setIsAuthenticated(false);
        setUserProfile(null);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userProfile');
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      console.log("Logging out user...");
      setLoading(true);
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUserProfile(null);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userProfile');
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, loading, logout, userProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
