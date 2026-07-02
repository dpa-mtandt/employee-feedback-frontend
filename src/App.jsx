import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './routes/ProtectedRoute';
import './index.css';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CompanyManagementPage = lazy(() => import('./pages/CompanyManagementPage'));
const DepartmentManagementPage = lazy(() => import('./pages/DepartmentManagementPage'));
const EmployeeManagementPage = lazy(() => import('./pages/EmployeeManagementPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
    Loading workspace...
  </div>
);

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  }, [theme]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === 'theme' && event.newValue) setTheme(event.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage theme={theme} setTheme={setTheme} />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage theme={theme} setTheme={setTheme} />} />
            <Route path="/reset-password" element={<ResetPasswordPage theme={theme} setTheme={setTheme} />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route element={<ProtectedRoute allowedRoles={['super_admin', 'company_admin']} />}>
                <Route path="/employees" element={<EmployeeManagementPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/departments" element={<DepartmentManagementPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                <Route path="/users" element={<UserManagementPage />} />
                <Route path="/companies" element={<CompanyManagementPage />} />
              </Route>
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
