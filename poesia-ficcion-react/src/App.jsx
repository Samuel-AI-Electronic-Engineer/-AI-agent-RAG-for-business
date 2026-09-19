import { useEffect } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ModalProvider } from './context/ModalContext.jsx';
import { StoreProvider } from './context/StoreContext.jsx';
import Starfield from './components/Starfield';
import Navbar from './components/layout/Navbar';
import AuthModal from './components/ModalAuth';
import CartDrawer from './components/store/CartDrawer';
import ProtectedRoute from './components/ui/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProfilePublications from './pages/ProfilePublications';
import ProfileOrders from './pages/ProfileOrders';
import ProfileRecommendations from './pages/ProfileRecommendations';
import ProfileSettings from './pages/ProfileSettings';
import CreatePost from './pages/CreatePost';
import PoemDetail from './pages/PoemDetail';
import Store from './pages/Store';
import AdminStore from './pages/AdminStore';
import AdminPanel from './pages/AdminPanel';
import useAuthStore from './store/authStore';

const queryClient = new QueryClient();

function AdminRoute({ children }) {
  const { token, user } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  return user?.is_admin ? children : <Navigate to="/libreria" replace />;
}

function SessionExpiryHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpiry = () => navigate('/login', { replace: true });
    window.addEventListener('pf-auth-expired', handleSessionExpiry);
    return () => window.removeEventListener('pf-auth-expired', handleSessionExpiry);
  }, [navigate]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <ModalProvider>
          <Starfield />

          <BrowserRouter>
            <SessionExpiryHandler />
            <Navbar />

            <main className="app-main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/poema/:id" element={<PoemDetail />} />
                <Route path="/libreria" element={<Store />} />
                <Route
                  path="/libreria/edit/"
                  element={
                    <AdminRoute>
                      <AdminStore />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/publicaciones"
                  element={
                    <ProtectedRoute>
                      <ProfilePublications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/pedidos"
                  element={
                    <ProtectedRoute>
                      <ProfileOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/recomendados"
                  element={
                    <ProtectedRoute>
                      <ProfileRecommendations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/configuracion"
                  element={
                    <ProtectedRoute>
                      <ProfileSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <AdminRoute>
                      <AdminPanel />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/publicar"
                  element={
                    <ProtectedRoute>
                      <CreatePost />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>

            <AuthModal />
            <CartDrawer />
          </BrowserRouter>
        </ModalProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;
