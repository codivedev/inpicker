import type { CloudflareContext } from '../../types';
import { requireAdmin } from '../../lib/is-admin';

// GET - Liste tous les utilisateurs
export async function onRequestGet(context: CloudflareContext) {
    try {
        const { env } = context;
        await requireAdmin(context);

        const { results } = await env.DB.prepare(`
            SELECT 
                u.id,
                u.name,
                u.is_admin,
                u.created_at,
                u.last_login_at,
                (SELECT COUNT(*) FROM drawings WHERE user_id = u.id) as drawings_count,
                (SELECT COUNT(*) FROM inventory WHERE user_id = u.id AND is_owned = 1) as pencils_count
            FROM users u
            ORDER BY u.created_at DESC
        `).all();

        return new Response(JSON.stringify(results), {
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

// POST - Créer un nouvel utilisateur
export async function onRequestPost(context: CloudflareContext) {
    try {
        const { request, env } = context;
        await requireAdmin(context);

        const { id, name, pin, isAdmin } = await request.json();

        // Validation
        if (!id || !name || !pin) {
            throw new Error('ID, nom et PIN requis');
        }
        if (!/^\d{6}$/.test(pin)) {
            throw new Error('Le PIN doit contenir exactement 6 chiffres');
        }

        // Vérifier que l'ID n'existe pas déjà
        const existing = await env.DB.prepare(
            "SELECT id FROM users WHERE id = ?"
        ).bind(id).first();

        if (existing) {
            throw new Error('Cet identifiant existe déjà');
        }

        // Créer l'utilisateur
        await env.DB.prepare(
            "INSERT INTO users (id, name, pin, is_admin) VALUES (?, ?, ?, ?)"
        ).bind(id, name, pin, isAdmin ? 1 : 0).run();

        return new Response(JSON.stringify({ success: true, id }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        console.error('[Admin API Error]', error);
        const errorMsg = error.message || 'Erreur inconnue';
        const isAuthError = errorMsg.includes('authentifié') || errorMsg.includes('invalide') || errorMsg.includes('expiré');
        const status = errorMsg.includes('Accès refusé') ? 403 : isAuthError ? 401 : 400;

        return new Response(JSON.stringify({ error: errorMsg }), {
            status,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// PUT - Modifier un utilisateur
export async function onRequestPut(context: CloudflareContext) {
    try {
        const { request, env } = context;
        await requireAdmin(context);

        const { id, name, pin, isAdmin } = await request.json();

        if (!id) {
            throw new Error('ID utilisateur requis');
        }

        // Construire la requête de mise à jour dynamiquement
        const updates: string[] = [];
        const values: any[] = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (pin !== undefined) {
            if (!/^\d{6}$/.test(pin)) {
                throw new Error('Le PIN doit contenir exactement 6 chiffres');
            }
            updates.push('pin = ?');
            values.push(pin);
        }
        if (isAdmin !== undefined) {
            updates.push('is_admin = ?');
            values.push(isAdmin ? 1 : 0);
        }

        if (updates.length === 0) {
            throw new Error('Aucune modification fournie');
        }

        values.push(id);

        await env.DB.prepare(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...values).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        console.error('[Admin API Error]', error);
        const errorMsg = error.message || 'Erreur inconnue';
        const isAuthError = errorMsg.includes('authentifié') || errorMsg.includes('invalide') || errorMsg.includes('expiré');
        const status = errorMsg.includes('Accès refusé') ? 403 : isAuthError ? 401 : 400;

        return new Response(JSON.stringify({ error: errorMsg }), {
            status,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// DELETE - Supprimer un utilisateur et ses données
export async function onRequestDelete(context: CloudflareContext) {
    try {
        const { env } = context;
        const { userId: adminId } = await requireAdmin(context);

        const url = new URL(context.request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            throw new Error('ID utilisateur requis');
        }

        // Empêcher la suppression de soi-même
        if (id === adminId) {
            throw new Error('Impossible de supprimer votre propre compte');
        }

        // Supprimer les données associées
        await env.DB.batch([
            env.DB.prepare("DELETE FROM drawing_pencils WHERE drawing_id IN (SELECT id FROM drawings WHERE user_id = ?)").bind(id),
            env.DB.prepare("DELETE FROM drawings WHERE user_id = ?").bind(id),
            env.DB.prepare("DELETE FROM inventory WHERE user_id = ?").bind(id),
            env.DB.prepare("DELETE FROM custom_pencils WHERE user_id = ?").bind(id),
            env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id)
        ]);

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        console.error('[Admin API Error]', error);
        const errorMsg = error.message || 'Erreur inconnue';
        const isAuthError = errorMsg.includes('authentifié') || errorMsg.includes('invalide') || errorMsg.includes('expiré');
        const status = errorMsg.includes('Accès refusé') ? 403 : isAuthError ? 401 : 400;
        return new Response(JSON.stringify({ error: errorMsg }), {
            status,
            headers: { "Content-Type": "application/json" }
        });
    }
}
