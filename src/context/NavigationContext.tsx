import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppView, NavTab } from '../types';

interface NavigationContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  navigateToTab: (tab: NavTab) => void;
  quickActionModal: 'meal' | 'weight' | 'activity' | 'workout' | null;
  openQuickAction: (type: 'meal' | 'weight' | 'activity' | 'workout') => void;
  closeQuickAction: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const NAV_TAB_STORAGE_KEY = 'ai_fitness_os_active_tab';
const NAV_VIEW_STORAGE_KEY = 'ai_fitness_os_active_view';

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<NavTab>(() => {
    try {
      const saved = localStorage.getItem(NAV_TAB_STORAGE_KEY) as NavTab;
      if (['home', 'workouts', 'nutrition', 'analytics', 'coach', 'profile'].includes(saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'home';
  });

  const [activeView, setActiveViewState] = useState<AppView>(() => {
    try {
      const saved = localStorage.getItem(NAV_VIEW_STORAGE_KEY) as AppView;
      if (['landing', 'onboarding', 'dashboard', 'auth', 'settings', 'history'].includes(saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'landing';
  });

  const [quickActionModal, setQuickActionModal] = useState<'meal' | 'weight' | 'activity' | 'workout' | null>(null);

  const setActiveTab = useCallback((tab: NavTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem(NAV_TAB_STORAGE_KEY, tab);
    } catch (e) {
      console.error('Error saving active tab:', e);
    }
  }, []);

  const setActiveView = useCallback((view: AppView) => {
    setActiveViewState(view);
    try {
      localStorage.setItem(NAV_VIEW_STORAGE_KEY, view);
    } catch (e) {
      console.error('Error saving active view:', e);
    }
  }, []);

  const navigateToTab = useCallback((tab: NavTab) => {
    setActiveTab(tab);
    setActiveView('dashboard');
  }, [setActiveTab, setActiveView]);

  const openQuickAction = useCallback((type: 'meal' | 'weight' | 'activity' | 'workout') => {
    setQuickActionModal(type);
  }, []);

  const closeQuickAction = useCallback(() => {
    setQuickActionModal(null);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeView,
        setActiveView,
        navigateToTab,
        quickActionModal,
        openQuickAction,
        closeQuickAction,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
