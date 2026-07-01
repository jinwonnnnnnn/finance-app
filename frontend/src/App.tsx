import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import OAuthCallback from './pages/auth/OAuthCallback';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import StockPage from './pages/stock/StockPage';
import GlossaryPage from './pages/glossary/GlossaryPage';
import NewsPage from './pages/news/NewsPage';
import FloatingChatBot from './components/ui/FloatingChatBot';
import CoinPage from './pages/coin/CoinPage';
import SettingsPage from './pages/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function SurveyGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!user.surveyDone) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />

          <Route path="/onboarding" element={
            <PrivateRoute><OnboardingPage /></PrivateRoute>
          } />

          <Route path="/dashboard" element={
            <SurveyGuard><DashboardPage /></SurveyGuard>
          } />
          <Route path="/stock/us" element={
            <SurveyGuard><StockPage market="US" /></SurveyGuard>
          } />
          <Route path="/stock/kr" element={
            <SurveyGuard><StockPage market="KR" /></SurveyGuard>
          } />
          <Route path="/coin" element={
            <SurveyGuard><CoinPage /></SurveyGuard>
          } />
          <Route path="/settings" element={
            <SurveyGuard><SettingsPage /></SurveyGuard>
          } />
          <Route path="/glossary" element={
            <SurveyGuard><GlossaryPage /></SurveyGuard>
          } />
          <Route path="/news" element={
            <SurveyGuard><NewsPage /></SurveyGuard>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <FloatingChatBot />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
