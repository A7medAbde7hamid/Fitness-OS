import { AppStorageRepository } from '../db/storage';
import { supabase, isSupabaseConfigured } from '../db/supabase';
import { Language, User, UserProfile } from '../types';

export interface SignUpParams {
  email: string;
  password?: string;
  displayName: string;
  preferredLanguage?: Language;
}

export interface SignInParams {
  email: string;
  password?: string;
}

export interface AuthSession {
  user: User;
  token?: string;
  expiresAt?: string;
}

type AuthStateListener = (user: User | null, profile: UserProfile | null) => void;

/**
 * AI Fitness OS Authentication & Session Service Layer
 * Supabase-backed authentication with offline-first local persistence
 */
class AuthServiceClass {
  private listeners: Set<AuthStateListener> = new Set();
  private currentSession: AuthSession | null = null;
  private isInitialized = false;

  constructor() {
    this.initSession();
    this.initSupabaseListener();
  }

  private initSession(): void {
    try {
      const user = AppStorageRepository.getCurrentUser();
      if (user) {
        this.currentSession = {
          user,
          token: 'token_' + user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }
    } catch (e) {
      console.error('Error initializing auth session from local storage:', e);
    }
  }

  private initSupabaseListener(): void {
    if (!isSupabaseConfigured() || !supabase || this.isInitialized) return;
    this.isInitialized = true;

    try {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const supaUser = session.user;
          const user: User = {
            id: supaUser.id,
            email: supaUser.email || '',
            displayName: supaUser.user_metadata?.display_name || supaUser.email?.split('@')[0] || 'Athlete',
            avatarUrl: supaUser.user_metadata?.avatar_url,
            createdAt: supaUser.created_at,
            updatedAt: new Date().toISOString(),
            onboardingCompleted: supaUser.user_metadata?.onboarding_completed ?? false,
          };

          AppStorageRepository.setCurrentUser(user);
          this.currentSession = {
            user,
            token: session.access_token,
            expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
          };

          // Fetch profile from Supabase
          const remoteProfile = await this.fetchRemoteProfile(supaUser.id);
          const profile = remoteProfile || AppStorageRepository.getProfile(user.id);
          if (profile) {
            AppStorageRepository.saveProfile(profile);
          }

          this.notifyListeners(user, profile);
        } else if (event === 'SIGNED_OUT') {
          this.currentSession = null;
          AppStorageRepository.setCurrentUser(null);
          this.notifyListeners(null, null);
        }
      });
    } catch (err) {
      console.warn('Supabase auth listener initialization skipped:', err);
    }
  }

  /**
   * Fetch profile from Supabase database
   */
  private async fetchRemoteProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      const profile: UserProfile = {
        userId: data.user_id,
        displayName: data.display_name,
        preferredLanguage: data.preferred_language || 'en',
        unitSystem: data.unit_system || 'metric',
        currentWeightKg: Number(data.current_weight_kg),
        heightCm: Number(data.height_cm),
        targetWeightKg: Number(data.target_weight_kg),
        targetDate: data.target_date,
        primaryGoal: data.primary_goal,
        activityLevel: data.activity_level,
        trainingFrequency: data.training_frequency || 4,
        birthYear: data.birth_year,
        gender: data.gender,
        notificationPreference: data.notification_preference ?? true,
        timezone: data.timezone || 'UTC',
        dailyCalorieTarget: data.daily_calorie_target,
        dailyProteinTargetGrams: data.daily_protein_target_grams,
        dailyCarbsTargetGrams: data.daily_carbs_target_grams,
        dailyFatTargetGrams: data.daily_fat_target_grams,
        dailyStepTarget: data.daily_step_target || 10000,
        dailyWaterTargetMl: data.daily_water_target_ml || 2800,
      };

      return profile;
    } catch (e) {
      console.warn('Could not fetch remote profile:', e);
      return null;
    }
  }

  /**
   * Register a new user account with Supabase Auth or Local Storage fallback
   */
  async signUp(params: SignUpParams): Promise<{ user: User; session: AuthSession }> {
    const { email, displayName, password, preferredLanguage } = params;
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }
    if (!displayName.trim()) {
      throw new Error('Please provide a display name.');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              display_name: displayName.trim(),
              preferred_language: preferredLanguage || 'en',
            },
          },
        });

        if (error) throw error;
        if (data.user) {
          const now = new Date().toISOString();
          const newUser: User = {
            id: data.user.id,
            email: cleanEmail,
            displayName: displayName.trim(),
            createdAt: data.user.created_at || now,
            updatedAt: now,
            onboardingCompleted: false,
          };

          AppStorageRepository.setCurrentUser(newUser);

          const session: AuthSession = {
            user: newUser,
            token: data.session?.access_token,
            expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : undefined,
          };

          this.currentSession = session;
          this.notifyListeners(newUser, null);
          return { user: newUser, session };
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('User already registered')) {
          throw err;
        }
        throw err instanceof Error ? err : new Error('Registration failed. Please try again.');
      }
    }

    throw new Error('Online authentication is required. Please configure Supabase or check your connection.');
  }

  /**
   * Authenticate an existing user with email and password via Supabase or Local Storage
   */
  async signIn(params: SignInParams): Promise<{ user: User; profile: UserProfile | null; session: AuthSession }> {
    const { email, password } = params;
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }

    if (!password) {
      throw new Error('Password is required.');
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;
        if (data.user) {
          const user: User = {
            id: data.user.id,
            email: cleanEmail,
            displayName: data.user.user_metadata?.display_name || cleanEmail.split('@')[0],
            createdAt: data.user.created_at,
            updatedAt: new Date().toISOString(),
            onboardingCompleted: data.user.user_metadata?.onboarding_completed ?? false,
          };

          AppStorageRepository.setCurrentUser(user);
          const remoteProfile = await this.fetchRemoteProfile(data.user.id);
          const profile = remoteProfile || AppStorageRepository.getProfile(user.id);
          if (profile) {
            AppStorageRepository.saveProfile(profile);
          }

          const session: AuthSession = {
            user,
            token: data.session?.access_token,
            expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : undefined,
          };

          this.currentSession = session;
          this.notifyListeners(user, profile);
          return { user, profile, session };
        }
      } catch (err: unknown) {
        throw err instanceof Error ? err : new Error('Sign-in failed. Please try again.');
      }
    }

    throw new Error('Online authentication is required. Please configure Supabase or check your connection.');
  }

  /**
   * Quick-launch high-performance demo profile
   */
  signInDemo(lang: Language = 'en'): { user: User; profile: UserProfile; session: AuthSession } {
    const { user, profile } = AppStorageRepository.seedDemoUser(lang);
    const session: AuthSession = {
      user,
      token: 'demo_session_' + user.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };

    this.currentSession = session;
    this.notifyListeners(user, profile);

    return { user, profile, session };
  }

  /**
   * Terminate current session
   */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign-out error:', err);
      }
    }

    AppStorageRepository.setCurrentUser(null);
    this.currentSession = null;
    this.notifyListeners(null, null);
  }

  /**
   * Retrieve current user profile
   */
  getProfile(userId: string): UserProfile | null {
    return AppStorageRepository.getProfile(userId);
  }

  /**
   * Persist user profile modifications to Supabase and Local Storage
   */
  async saveProfile(profile: UserProfile): Promise<void> {
    // Save to local storage for immediate UI sync
    AppStorageRepository.saveProfile(profile);

    if (this.currentSession?.user) {
      this.notifyListeners(this.currentSession.user, profile);
    }

    // Persist to Supabase if configured and user is authenticated
    if (isSupabaseConfigured() && supabase && profile.userId && !profile.userId.startsWith('demo_') && !profile.userId.startsWith('usr_')) {
      try {
        const { error } = await supabase.from('profiles').upsert({
          user_id: profile.userId,
          display_name: profile.displayName,
          preferred_language: profile.preferredLanguage,
          unit_system: profile.unitSystem,
          current_weight_kg: profile.currentWeightKg,
          height_cm: profile.heightCm,
          target_weight_kg: profile.targetWeightKg,
          target_date: profile.targetDate,
          primary_goal: profile.primaryGoal,
          activity_level: profile.activityLevel,
          training_frequency: profile.trainingFrequency,
          birth_year: profile.birthYear,
          gender: profile.gender,
          notification_preference: profile.notificationPreference,
          timezone: profile.timezone,
          daily_calorie_target: profile.dailyCalorieTarget,
          daily_protein_target_grams: profile.dailyProteinTargetGrams,
          daily_carbs_target_grams: profile.dailyCarbsTargetGrams,
          daily_fat_target_grams: profile.dailyFatTargetGrams,
          daily_step_target: profile.dailyStepTarget,
          daily_water_target_ml: profile.dailyWaterTargetMl,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.warn('Supabase profile upsert error:', error.message);
        }
      } catch (err) {
        console.warn('Failed to upsert profile to Supabase:', err);
      }
    }
  }

  /**
   * Get current active session
   */
  getSession(): AuthSession | null {
    if (!this.currentSession) {
      this.initSession();
    }
    return this.currentSession;
  }

  /**
   * Get current active user
   */
  getCurrentUser(): User | null {
    return this.getSession()?.user || null;
  }

  /**
   * Request password reset link / email
   */
  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) throw error;
        return {
          success: true,
          message: `Password reset instructions sent to ${email}`,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to send password reset email.';
        throw new Error(msg);
      }
    }

    return {
      success: true,
      message: `Password reset instructions sent to ${email}`,
    };
  }

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChange(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(user: User | null, profile: UserProfile | null): void {
    this.listeners.forEach((listener) => {
      try {
        listener(user, profile);
      } catch (err) {
        console.error('Error executing auth state listener:', err);
      }
    });
  }
}

export const AuthService = new AuthServiceClass();
