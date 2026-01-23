import type { CloudflareContext } from '../types';

// Utilitaires pour l'authentification
export async function generateToken(userId: string): Promise<string> {
    // Simple token basé sur timestamp + userId (pour MVP)
    // En production, utiliser JWT avec secret
    const payload = `${userId}:${Date.now()}`;
    return btoa(payload);
}

export async function verifyToken(token: string): Promise<string | null> {
    try {
        const decoded = atob(token);
        const [userId, timestamp] = decoded.split(':');

        // Vérifier que le token n'est pas expiré (24h)
        const tokenAge = Date.now() - parseInt(timestamp);
        if (tokenAge > 24 * 60 * 60 * 1000) {
            return null;
        }

        return userId;
    } catch {
        return null;
    }
}

export async function getUserFromContext(context: CloudflareContext): Promise<string> {
    const cookieHeader = context.request.headers.get('Cookie');
    if (!cookieHeader) {
        throw new Error('Non authentifié');
    }

    const cookies = Object.fromEntries(
        cookieHeader.split(';').map((c: string) => {
            const [key, ...value] = c.split('=');
            return [key.trim(), value.join('=').trim()];
        })
    );

    const token = cookies.auth_token;
    if (!token) {
        throw new Error('Non authentifié');
    }

    const userId = await verifyToken(token);
    if (!userId) {
        throw new Error('Token invalide ou expiré');
    }

    return userId;
}
