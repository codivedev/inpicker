import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LandingPage } from '@/features/landing/components/LandingPage';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { Dashboard } from '@/features/dashboard/components/Dashboard';
import { InventoryManager } from '@/features/inventory/components/InventoryManager';
import { PickerCanvas } from '@/features/picker/components/PickerCanvas';
import { DrawingsManager } from '@/features/drawings/components/DrawingsManager';
import { PaletteGenerator } from '@/features/ai/components/PaletteGenerator';
import { ProfilePage } from '@/features/profile/components/ProfilePage';
import { ThemeProvider } from '@/components/theme-provider';

function App() {
  // Session persistante
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('inpicker_auth') === 'true';
  });
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    localStorage.setItem('inpicker_auth', 'true');
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children as React.ReactElement;
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="inpicker-theme">
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/connexion" element={
          isAuthenticated ? <Navigate to="/tableau-de-bord" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
        } />

        {/* Protégé */}
        <Route path="/tableau-de-bord" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/ma-collection" element={<ProtectedRoute><InventoryManager /></ProtectedRoute>} />
        <Route path="/scanner-couleur" element={<ProtectedRoute><PickerCanvas /></ProtectedRoute>} />
        <Route path="/mes-dessins" element={<ProtectedRoute><DrawingsManager /></ProtectedRoute>} />
        <Route path="/generateur-ia" element={<ProtectedRoute><PaletteGenerator /></ProtectedRoute>} />
        <Route path="/mon-profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
