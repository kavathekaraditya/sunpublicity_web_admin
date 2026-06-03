import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ManageUsers from './pages/ManageUsers';
import ManageHoardings from './pages/ManageHoardings';
import ManageBookings from './pages/ManageBookings';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ContactMessages from './pages/ContactMessages';
import AdminHero from './pages/AdminHero';
import ManageWorkers from './pages/ManageWorkers';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <ThemeProvider>
            <Router basename="/admin">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />

                {/* Admin Routes - Protected */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/home" replace />} />
                  <Route path="home" element={<Home />} />
                  <Route path="users" element={<ManageUsers />} />
                  <Route path="hoardings" element={<ManageHoardings />} />
                  <Route path="bookings" element={<ManageBookings />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="contacts" element={<ContactMessages />} />
                  <Route path="hero" element={<AdminHero />} />
                  <Route path="workers" element={<ManageWorkers />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Default Redirect */}
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </Router>
          </ThemeProvider>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
