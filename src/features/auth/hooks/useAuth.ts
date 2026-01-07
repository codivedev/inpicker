import { useState } from 'react';
import { cloudflareApi } from '@/lib/cloudflare-api';

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        // Vérifier si l'utilisateur était authentifié (cookie existe)
        return localStorage.getItem('inpicker_auth') === 'true';
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const verifyPin = async (pin: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const success = await cloudflareApi.verifyPin(pin);

            if (success) {
                setIsAuthenticated(true);
                localStorage.setItem('inpicker_auth', 'true');
                return true;
            } else {
                setError('PIN invalide');
                return false;
            }
        } catch (err) {
            setError('Erreur de connexion');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('inpicker_auth');
        // Le cookie sera automatiquement expiré côté serveur
        window.location.href = '/';
    };

    return {
        isAuthenticated,
        isLoading,
        error,
        verifyPin,
        logout
    };
}
