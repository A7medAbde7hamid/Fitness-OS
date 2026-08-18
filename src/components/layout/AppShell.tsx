import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from './AppHeader';
import { BottomNavigation } from './BottomNavigation';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const showNav = isAuthenticated && user?.onboardingCompleted;

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col relative overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#FF4E00] focus:text-white focus:rounded-lg focus:text-sm focus:font-bold"
      >
        Skip to main content
      </a>

      <div className="fixed top-0 left-1/4 -translate-x-1/2 w-[520px] h-[340px] bg-[#FF4E00]/5 rounded-full blur-[140px] pointer-events-none -z-10" aria-hidden="true" />
      <div className="fixed bottom-10 right-1/4 translate-x-1/2 w-[480px] h-[320px] bg-white/[0.02] rounded-full blur-[160px] pointer-events-none -z-10" aria-hidden="true" />

      <AppHeader />

      <main
        id="main-content"
        className={`flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 ${showNav ? 'pb-24' : 'pb-8'}`}
      >
        {children}
      </main>

      {showNav && <BottomNavigation />}
    </div>
  );
};
