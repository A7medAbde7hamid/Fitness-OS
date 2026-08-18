import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthService } from '../services/auth';
import { AppStorageRepository } from '../db/storage';
import { AuthState, Language, User, UserProfile } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, pass?: string) => Promise<boolean>;
  signup: (name: string, email: string, pass?: string, lang?: Language) => Promise<User>;
  loginDemo: (lang?: Language) => void;
  logout: () => void;
  updateProfile: (profile: UserProfile) => void;
  completeOnboarding: (profile: UserProfile) => void;
  refreshProfile: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const session = AuthService.getSession();
    const profile = session ? AuthService.getProfile(session.user.id) : null;
    return {
      user: session?.user || null,
      profile,
      isAuthenticated: !!session?.user,
      isLoading: false,
      isDemoMode: session?.user?.id.startsWith('demo_') || false,
      error: null,
    };
  });

  // Listen to auth state updates from AuthService
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((user, profile) => {
      setAuthState({
        user,
        profile,
        isAuthenticated: !!user,
        isLoading: false,
        isDemoMode: user?.id.startsWith('demo_') || false,
        error: null,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, pass?: string): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { user, profile } = await AuthService.signIn({ email, password: pass });
      setAuthState({
        user,
        profile,
        isAuthenticated: true,
        isLoading: false,
        isDemoMode: false,
        error: null,
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setAuthState((prev) => ({ ...prev, isLoading: false, error: msg }));
      return false;
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, pass?: string, lang?: Language): Promise<User> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { user } = await AuthService.signUp({
        displayName: name,
        email,
        password: pass,
        preferredLanguage: lang,
      });

      setAuthState({
        user,
        profile: null,
        isAuthenticated: true,
        isLoading: false,
        isDemoMode: false,
        error: null,
      });

      return user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setAuthState((prev) => ({ ...prev, isLoading: false, error: msg }));
      throw err;
    }
  }, []);

  const loginDemo = useCallback((lang: Language = 'en') => {
    const { user, profile } = AuthService.signInDemo(lang);
    setAuthState({
      user,
      profile,
      isAuthenticated: true,
      isLoading: false,
      isDemoMode: true,
      error: null,
    });
  }, []);

  const logout = useCallback(async () => {
    await AuthService.signOut();
    setAuthState({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      isDemoMode: false,
      error: null,
    });
  }, []);

  const updateProfile = useCallback((profile: UserProfile) => {
    AuthService.saveProfile(profile);
    setAuthState((prev) => ({
      ...prev,
      profile,
    }));
  }, []);

  const completeOnboarding = useCallback((profile: UserProfile) => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      displayName: profile.displayName || currentUser.displayName,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    AppStorageRepository.setCurrentUser(updatedUser);
    AuthService.saveProfile(profile);

    // Record initial weight measurement
    AppStorageRepository.addMeasurement(updatedUser.id, {
      id: 'meas_initial_' + Date.now(),
      userId: updatedUser.id,
      weightKg: profile.currentWeightKg,
      measuredAt: new Date().toISOString(),
      notes: 'Initial onboarding measurement',
    });

    setAuthState((prev) => ({
      ...prev,
      user: updatedUser,
      profile,
    }));
  }, []);

  const refreshProfile = useCallback(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      const profile = AuthService.getProfile(currentUser.id);
      setAuthState((prev) => ({ ...prev, profile }));
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return AuthService.resetPassword(email);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        loginDemo,
        logout,
        updateProfile,
        completeOnboarding,
        refreshProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
