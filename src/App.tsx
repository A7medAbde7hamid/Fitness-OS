import React, { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { ConnectionProvider } from './context/ConnectionContext';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ConnectionStatus } from './components/common/ConnectionStatus';
import { LandingView } from './components/landing/LandingView';
import { AuthView } from './components/auth/AuthView';
import { WeightLogModal } from './components/modals/WeightLogModal';
import { ActivityLogModal } from './components/modals/ActivityLogModal';

const OnboardingWizard = lazy(() =>
  import('./components/onboarding/OnboardingWizard12').then((m) => ({ default: m.OnboardingWizard12 }))
);
const DashboardView = lazy(() =>
  import('./components/dashboard/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const CoachView = lazy(() =>
  import('./components/coach/CoachView').then((m) => ({ default: m.CoachView }))
);
const LogView = lazy(() =>
  import('./components/log/LogView').then((m) => ({ default: m.LogView }))
);
const ProgressView = lazy(() =>
  import('./components/progress/ProgressView').then((m) => ({ default: m.ProgressView }))
);
const ProfileView = lazy(() =>
  import('./components/profile/ProfileView').then((m) => ({ default: m.ProfileView }))
);
const DailyCheckInView = lazy(() =>
  import('./components/checkin/DailyCheckInView').then((m) => ({ default: m.DailyCheckInView }))
);
const WeeklyReportView = lazy(() =>
  import('./components/progress/WeeklyReportView').then((m) => ({ default: m.WeeklyReportView }))
);

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="w-8 h-8 border-2 border-[#FF4E00] border-t-transparent rounded-full animate-spin" />
  </div>
);

const QuickActionModals: React.FC = () => {
  const { quickActionModal, closeQuickAction } = useNavigation();

  return (
    <>
      <WeightLogModal
        isOpen={quickActionModal === 'weight'}
        onClose={closeQuickAction}
      />
      <ActivityLogModal
        isOpen={quickActionModal === 'activity'}
        onClose={closeQuickAction}
      />
    </>
  );
};

const MainRouter: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { activeView, activeTab } = useNavigation();

  if (!isAuthenticated) {
    if (activeView === 'auth') {
      return <AuthView />;
    }
    return <LandingView />;
  }

  if (!user?.onboardingCompleted) {
    return <Suspense fallback={<LoadingFallback />}><OnboardingWizard /></Suspense>;
  }

  switch (activeTab) {
    case 'coach':
      return <Suspense fallback={<LoadingFallback />}><CoachView /></Suspense>;
    case 'log':
      return <Suspense fallback={<LoadingFallback />}><LogView /></Suspense>;
    case 'progress':
      return <Suspense fallback={<LoadingFallback />}><ProgressView /></Suspense>;
    case 'profile':
      return <Suspense fallback={<LoadingFallback />}><ProfileView /></Suspense>;
    case 'home':
    default:
      return <Suspense fallback={<LoadingFallback />}><DashboardView /></Suspense>;
  }
};

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          <NavigationProvider>
            <ConnectionProvider>
              <AppShell>
                <ConnectionStatus />
                <ErrorBoundary>
                  <MainRouter />
                </ErrorBoundary>
                <QuickActionModals />
              </AppShell>
            </ConnectionProvider>
          </NavigationProvider>
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
