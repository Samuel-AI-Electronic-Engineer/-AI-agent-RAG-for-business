import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ModalProvider } from './context/ModalContext.jsx';
import Starfield from './components/Starfield';
import Navbar from './components/layout/Navbar';
import AuthModal from './components/ModalAuth';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import useAuthStore from './store/authStore';

const queryClient = new QueryClient();

function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);

  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ModalProvider>
        <Starfield />

        <BrowserRouter>
          <Navbar />

          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          <AuthModal />
        </BrowserRouter>
      </ModalProvider>
    </QueryClientProvider>
  );
}

export default App;
