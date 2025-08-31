"use client";

import React, { createContext, useState, useEffect, useContext, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

interface AuthContextType {
  user: any | null;
  userId: string | null;
  isLoading: boolean;
  error: Error | null;
  getUser: () => any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<{
    user: any | null;
    userId: string | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    user: null,
    userId: null,
    isLoading: true,
    error: null
  });
  useEffect(() => {
    let mounted = true;

    // Controllo iniziale della sessione

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setAuthState(prev => ({
          ...prev,
          user: session?.user || null,
          userId: session?.user?.id || null,
          isLoading: false
        }));
      }
    });

    // Ascolta i cambiamenti di stato dell'autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setAuthState(prev => ({
          ...prev,
          user: session?.user || null,
          userId: session?.user?.id || null,
          isLoading: false
        }));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const getUser = () => authState.user;
  const value = useMemo(() => ({
    user: authState.user,
    userId: authState.userId,
    isLoading: authState.isLoading,
    error: authState.error,
    getUser
  }), [authState.user, authState.userId, authState.isLoading, authState.error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      "useAuthContext deve essere utilizzato all'interno di un AuthProvider"
    );
  }
  return context;
}

export function useQueryWithAuth() {
  const { userId, isLoading } = useAuthContext();

  const safeQuery = async (queryFn: (userId: string) => Promise<any>) => {
    if (isLoading) return null;
    if (!userId) {
      console.error("User not authenticated");
      return null;
    }
    return await queryFn(userId);
  };

  return { safeQuery, userId };
}
