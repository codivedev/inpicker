import { useState } from 'react';
import { cloudflareApi } from '@/lib/cloudflare-api';

export function usePinAuth() {
    const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);

    const verifyPin = async (pin: string): Promise<{ id: string, name: string, isAdmin?: boolean } | null> => {
        // Vérifier si verrouillé
        if (lockedUntil && lockedUntil > new Date()) {
            return null;
        }

        try {
            const userData = await cloudflareApi.verifyPin(pin);

            if (userData) {
                setIsAuthenticated(true);
                setAttemptCount(0);
                return userData;
            } else {
                // Échec - incrémenter les tentatives
                const newCount = attemptCount + 1;
                setAttemptCount(newCount);

                // Verrouiller après 3 tentatives
                if (newCount >= 3) {
                    const lockTime = new Date();
                    lockTime.setMinutes(lockTime.getMinutes() + 5);
                    setLockedUntil(lockTime);
                }

                return null;
            }
        } catch (error) {
            console.error('Erreur d\'authentification:', error);
            return null;
        }
    };

    return {
        verifyPin,
        lockedUntil,
        isAuthenticated
    };
}
