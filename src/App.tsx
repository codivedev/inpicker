import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LandingPage } from '@/features/landing/components/LandingPage';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { Dashboard } from '@/features/dashboard/components/Dashboard';
import { InventoryManager } from '@/features/inventory/components/InventoryManager';
import { PickerCanvas } from '@/features/picker/components/PickerCanvas';
import { DrawingsManager } from '@/features/drawings/components/DrawingsManager';
import { DrawingDetail } from '@/features/drawings/components/DrawingDetail';
import { PaletteGenerator } from '@/features/ai/components/PaletteGenerator';
import { ProfilePage } from '@/features/profile/components/ProfilePage';
import { AdminDashboard } from '@/features/admin/components/AdminDashboard';
import { SavedColors } from '@/features/favorites/components/SavedColors';
import { ThemeProvider } from '@/components/theme-provider';

function App() {
  // Session persistante
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('inpicker_auth') === 'true';
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('inpicker_is_admin') === 'true';
  });
  const navigate = useNavigate();

  const handleLoginSuccess = (user: { id: string, name: string, isAdmin?: boolean }) => {
    localStorage.setItem('inpicker_auth', 'true');
    localStorage.setItem('inpicker_user_name', user.name);
    localStorage.setItem('inpicker_is_admin', user.isAdmin ? 'true' : 'false');
    setIsAuthenticated(true);
    setIsAdmin(!!user.isAdmin);
    navigate('/tableau-de-bord');
  };

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/connexion" replace />;
    }
    return children as React.ReactElement;
  };

  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/connexion" replace />;
    }
    if (!isAdmin) {
      return <Navigate to="/tableau-de-bord" replace />;
    }
    return children as React.ReactElement;
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="inpicker-theme">
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/connexion" element={
          isAuthenticated ? <Navigate to="/tableau-de-bord" replace /> : <LoginPage onSuccess={handleLoginSuccess} />
        } />

        {/* Protégé */}
        <Route path="/tableau-de-bord" element={<ProtectedRoute><Dashboard isAdmin={isAdmin} /></ProtectedRoute>} />
        <Route path="/ma-collection" element={<ProtectedRoute><InventoryManager /></ProtectedRoute>} />
        <Route path="/scanner-couleur" element={<ProtectedRoute><PickerCanvas /></ProtectedRoute>} />
        <Route path="/mes-dessins" element={<ProtectedRoute><DrawingsManager /></ProtectedRoute>} />
        <Route path="/dessins/:id" element={<ProtectedRoute><DrawingDetail /></ProtectedRoute>} />
        <Route path="/generateur-ia" element={<ProtectedRoute><PaletteGenerator /></ProtectedRoute>} />
        <Route path="/mon-profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/couleurs-sauvegardees" element={<ProtectedRoute><SavedColors /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/administration" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;

