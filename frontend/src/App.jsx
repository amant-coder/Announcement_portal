import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PublicFeed from './pages/PublicFeed';
import AdminLogin from './pages/AdminLogin';
import AdminSignUp from './pages/AdminSignUp';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export function App() {
  const location = useLocation();
  // Clerk controls these sub-routes entirely — hide app shell to avoid hook conflicts
  const isClerkInternalRoute = location.pathname.includes('/tasks/');
  return (
    <div className="min-h-screen flex flex-col bg-college-lightBg">
      {!isClerkInternalRoute && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<PublicFeed />} />
          <Route path="/admin/login/*" element={<AdminLogin />} />
          <Route path="/admin/sign-up/*" element={<AdminSignUp />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isClerkInternalRoute && <Footer />}
    </div>
  );
}

export default App;
