import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AgronomistLogin from './pages/AgronomistLogin';
import AgronomistDashboard from './pages/AgronomistDashboard';
import LinkedClientsPage from './pages/LinkedClientsPage';
import SubmitJobPage from './pages/SubmitJobPage';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AgronomistLogin />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<AgronomistDashboard />} />
            <Route path="clients" element={<LinkedClientsPage />} />
            <Route path="submit-job" element={<SubmitJobPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
