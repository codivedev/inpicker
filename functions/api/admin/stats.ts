import type { CloudflareContext } from '../../types';
import { requireAdmin } from '../../lib/is-admin';

// GET - Statistiques globales pour l'admin
export async function onRequestGet(context: CloudflareContext) {
    try {
        const { env } = context;

        // Debug
        if (!env.DB) {
            console.error('[Admin stats] DB binding missing');
            throw new Error('Erreur critique: La base de données n\'est pas connectée (env.DB manquant)');
        }

        await requireAdmin(context);

        // Récupérer les statistiques globales
        const [usersResult, drawingsResult, inventoryResult, usersWithStats] = await Promise.all([
            // Total utilisateurs
            env.DB.prepare("SELECT COUNT(*) as count FROM users").first(),
            // Total dessins
            env.DB.prepare("SELECT COUNT(*) as count FROM drawings").first(),
            // Total crayons possédés
            env.DB.prepare("SELECT COUNT(*) as count FROM inventory WHERE is_owned = 1").first(),
            // Stats par utilisateur
            env.DB.prepare(`
                SELECT 
                    u.id,
                    u.name,
                    u.is_admin,
                    u.last_login_at,
                    (SELECT COUNT(*) FROM drawings WHERE user_id = u.id) as drawings_count,
                    (SELECT COUNT(*) FROM inventory WHERE user_id = u.id AND is_owned = 1) as pencils_count
                FROM users u
                ORDER BY u.name
            `).all()
        ]);

        // Dessins récents (tous utilisateurs)
        const recentDrawings = await env.DB.prepare(`
            SELECT d.*, u.name as user_name
            FROM drawings d
            LEFT JOIN users u ON d.user_id = u.id
            ORDER BY d.created_at DESC
            LIMIT 10
        `).all();

        // Statistiques d'activité par semaine (7 derniers jours)
        const weeklyActivity = await env.DB.prepare(`
            SELECT 
                date(created_at) as date,
                COUNT(*) as count
            FROM drawings
            WHERE created_at >= datetime('now', '-7 days')
            GROUP BY date(created_at)
            ORDER BY date
        `).all();

        return new Response(JSON.stringify({
            totals: {
                users: usersResult?.count || 0,
                drawings: drawingsResult?.count || 0,
                pencils: inventoryResult?.count || 0
            },
            userStats: usersWithStats?.results || [],
            recentDrawings: recentDrawings?.results || [],
            weeklyActivity: weeklyActivity?.results || []
        }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        console.error('[Admin API Error]', error);
        const errorMsg = error.message || 'Erreur inconnue';
        const isAuthError = errorMsg.includes('authentifié') || errorMsg.includes('invalide') || errorMsg.includes('expiré');
        const status = errorMsg.includes('Accès refusé') ? 403 : isAuthError ? 401 : 500;

        return new Response(JSON.stringify({ error: errorMsg }), {
            status,
            headers: { "Content-Type": "application/json" }
        });
    }
}
