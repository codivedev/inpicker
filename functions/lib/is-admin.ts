import type { CloudflareContext } from '../types';
import { getUserFromContext } from './auth';

const HARDCODED_ADMINS = ['renaud'];

// Middleware: Vérifie que l'utilisateur est admin
export async function requireAdmin(context: CloudflareContext): Promise<{ userId: string; isAdmin: boolean }> {
    const userId = await getUserFromContext(context);
    const { env } = context;

    try {
        // Vérifier dans la table users si l'utilisateur est admin
        const user = await env.DB.prepare(
            "SELECT is_admin FROM users WHERE id = ?"
        ).bind(userId).first();

        if (user && user.is_admin) {
            return { userId, isAdmin: true };
        }
    } catch (e) {
        console.warn('[Admin] Erreur check DB, fallback hardcode:', e);
    }

    // Fallback pour le développement ou si la migration n'est pas faite
    if (HARDCODED_ADMINS.includes(userId)) {
        return { userId, isAdmin: true };
    }

    throw new Error('Accès refusé: droits administrateur requis');
}
