import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Instruments from './pages/Instruments';
import InstrumentForm from './pages/InstrumentForm';
import Reports from './pages/Reports';
import ReportForm from './pages/ReportForm';
import ReportView from './pages/ReportView';
import OimlRulesManager from './pages/OimlRulesManager';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <BrowserRouter>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/instruments"
                  element={
                    <ProtectedRoute>
                      <Instruments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instruments/new"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'engineer']}>
                      <InstrumentForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instruments/edit/:id"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'engineer']}>
                      <InstrumentForm />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/new"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'engineer']}>
                      <ReportForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/:id"
                  element={
                    <ProtectedRoute>
                      <ReportView />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/oiml-rules"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <OimlRulesManager />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </OfflineProvider>
    </AuthProvider>
  );
}
