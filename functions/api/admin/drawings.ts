import type { CloudflareContext } from '../../types';
import { requireAdmin } from '../../lib/is-admin';

// GET - Liste tous les dessins (tous utilisateurs)
export async function onRequestGet(context: CloudflareContext) {
    try {
        const { env } = context;
        await requireAdmin(context);

        const { results } = await env.DB.prepare(`
            SELECT 
                d.id,
                d.title,
                d.image_r2_key,
                d.created_at,
                d.user_id,
                u.name as user_name
            FROM drawings d
            LEFT JOIN users u ON d.user_id = u.id
            ORDER BY d.created_at DESC
        `).all();

        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        const status = error.message.includes('Accès refusé') ? 403 :
            error.message.includes('authentifié') ? 401 : 500;
        return new Response(JSON.stringify({ error: error.message }), {
            status,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// DELETE - Supprimer un dessin (n'importe quel utilisateur)
export async function onRequestDelete(context: CloudflareContext) {
    try {
        const { env } = context;
        await requireAdmin(context);

        const url = new URL(context.request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            throw new Error('ID du dessin requis');
        }

        // Récupérer la clé R2 pour supprimer l'image
        const drawing = await env.DB.prepare(
            "SELECT image_r2_key FROM drawings WHERE id = ?"
        ).bind(id).first();

        if (drawing?.image_r2_key && env.IMAGES) {
            try {
                await env.IMAGES.delete(drawing.image_r2_key);
            } catch (e) {
                console.error('Erreur suppression R2:', e);
            }
        }

        // Supprimer les associations et le dessin
        await env.DB.batch([
            env.DB.prepare("DELETE FROM drawing_pencils WHERE drawing_id = ?").bind(id),
            env.DB.prepare("DELETE FROM drawings WHERE id = ?").bind(id)
        ]);

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        const status = error.message.includes('Accès refusé') ? 403 :
            error.message.includes('authentifié') ? 401 : 400;
        return new Response(JSON.stringify({ error: error.message }), {
            status,
            headers: { "Content-Type": "application/json" }
        });
    }
}
