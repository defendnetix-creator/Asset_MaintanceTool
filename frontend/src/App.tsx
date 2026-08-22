// frontend/src/App.tsx
// Main App component with routing

import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/LoadingStates';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const AssetsPage = lazy(() => import('./pages/AssetsPage').then(module => ({ default: module.AssetsPage })));
const AssetDetailPage = lazy(() => import('./pages/AssetDetailPage').then(module => ({ default: module.AssetDetailPage })));
const AuditsPage = lazy(() => import('./pages/AuditsPage').then(module => ({ default: module.AuditsPage })));
const AuditDetailPage = lazy(() => import('./pages/AuditDetailPage').then(module => ({ default: module.AuditDetailPage })));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage').then(module => ({ default: module.MaintenancePage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(module => ({ default: module.ReportsPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(module => ({ default: module.UsersPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));
const ScanPage = lazy(() => import('./pages/ScanPage').then(module => ({ default: module.ScanPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(module => ({ default: module.NotFoundPage })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Suspense fallback={<LoadingSpinner label="Loading login..." />}>
            <LoginPage />
          </Suspense>
        </PublicRoute>
      } />
      
      {/* Protected routes */}
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/" element={
          <Suspense fallback={<LoadingSpinner label="Loading dashboard..." />}>
            <DashboardPage />
          </Suspense>
        } />
        <Route path="/assets" element={
          <Suspense fallback={<LoadingSpinner label="Loading assets..." />}>
            <AssetsPage />
          </Suspense>
        } />
        <Route path="/assets/new" element={
          <Suspense fallback={<LoadingSpinner label="Loading..." />}>
            <AssetDetailPage />
          </Suspense>
        } />
        <Route path="/assets/:id" element={
          <Suspense fallback={<LoadingSpinner label="Loading..." />}>
            <AssetDetailPage />
          </Suspense>
        } />
        <Route path="/audits" element={
          <Suspense fallback={<LoadingSpinner label="Loading audits..." />}>
            <AuditsPage />
          </Suspense>
        } />
        <Route path="/audits/new" element={
          <Suspense fallback={<LoadingSpinner label="Loading..." />}>
            <AuditDetailPage />
          </Suspense>
        } />
        <Route path="/audits/:id" element={
          <Suspense fallback={<LoadingSpinner label="Loading..." />}>
            <AuditDetailPage />
          </Suspense>
        } />
        <Route path="/maintenance" element={
          <Suspense fallback={<LoadingSpinner label="Loading maintenance..." />}>
            <MaintenancePage />
          </Suspense>
        } />
        <Route path="/reports" element={
          <Suspense fallback={<LoadingSpinner label="Loading reports..." />}>
            <ReportsPage />
          </Suspense>
        } />
        <Route path="/users" element={
          <Suspense fallback={<LoadingSpinner label="Loading users..." />}>
            <UsersPage />
          </Suspense>
        } />
        <Route path="/scan" element={
          <Suspense fallback={<LoadingSpinner label="Loading scanner..." />}>
            <ScanPage />
          </Suspense>
        } />
        <Route path="/settings" element={
          <Suspense fallback={<LoadingSpinner label="Loading settings..." />}>
            <SettingsPage />
          </Suspense>
        } />
        <Route path="/admin" element={
          <Suspense fallback={<LoadingSpinner label="Loading admin..." />}>
            <AdminPage />
          </Suspense>
        } />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={
        <Suspense fallback={<LoadingSpinner label="Loading..." />}>
          <NotFoundPage />
        </Suspense>
      } />
    </Routes>
  );
}