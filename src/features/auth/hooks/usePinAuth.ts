import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

// Constantes de sécurité (Stockées en dur pour l'instant ou DB chiffrée plus tard)
const ADMIN_PIN = '975310'; // PIN par défaut (Inpix style)

export function usePinAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [lockedUntil, setLockedUntil] = useState<Date | null>(null);

    // Observer les tentatives échouées récentes (moins de 30 min)
    const recentFailures = useLiveQuery(async () => {
        const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
        return await db.loginAttempts
            .where('id')
            .above(thirtyMinutesAgo)
            .filter(attempt => !attempt.success)
            .toArray();
    }, []);

    // Calcul du blocage
    useEffect(() => {
        if (!recentFailures) return;

        const fails = recentFailures.length;
        let lockoutDuration = 0;

        if (fails >= 9) lockoutDuration = 30 * 60 * 1000; // 30 min
        else if (fails >= 6) lockoutDuration = 5 * 60 * 1000; // 5 min
        else if (fails >= 3) lockoutDuration = 30 * 1000; // 30 sec

        if (lockoutDuration > 0) {
            // Le dernier échec détermine le début du blocage
            const lastFail = recentFailures[recentFailures.length - 1];
            const unlockTime = new Date(lastFail.id + lockoutDuration);

            if (unlockTime > new Date()) {
                setLockedUntil(unlockTime);
            } else {
                setLockedUntil(null);
            }
        } else {
            setLockedUntil(null);
        }
    }, [recentFailures]);

    const verifyPin = async (pin: string): Promise<boolean> => {
        if (lockedUntil && new Date() < lockedUntil) {
            return false; // Toujours bloqué
        }

        if (pin === ADMIN_PIN) {
            // Succès
            await db.loginAttempts.add({
                id: Date.now(),
                ip: 'local',
                success: true
            });
            setIsAuthenticated(true);
            return true;
        } else {
            // Échec
            await db.loginAttempts.add({
                id: Date.now(),
                ip: 'local',
                success: false
            });
            return false;
        }
    };

    return {
        isAuthenticated,
        lockedUntil,
        verifyPin,
        failuresCount: recentFailures?.length || 0
    };
}
