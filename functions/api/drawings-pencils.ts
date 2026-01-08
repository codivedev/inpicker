import type { CloudflareContext } from '../types';
import { getUserFromContext } from '../lib/auth';

// POST - Ajouter un crayon à un dessin
export async function onRequestPost(context: CloudflareContext) {
    try {
        const { request, env } = context;
        const userId = await getUserFromContext(context);
        const { drawingId, pencilId } = await request.json();

        if (!drawingId || !pencilId) {
            return new Response(JSON.stringify({ error: "drawingId et pencilId requis" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Vérifier que le dessin appartient à l'utilisateur
        const drawing = await env.DB.prepare(
            "SELECT id FROM drawings WHERE id = ? AND user_id = ?"
        ).bind(drawingId, userId).first();

        if (!drawing) {
            return new Response(JSON.stringify({ error: "Dessin non trouvé" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Ajouter le crayon (INSERT OR IGNORE pour éviter les doublons)
        await env.DB.prepare(
            "INSERT OR IGNORE INTO drawing_pencils (drawing_id, pencil_id) VALUES (?, ?)"
        ).bind(drawingId, pencilId).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: error.message.includes('authentifié') ? 401 : 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// DELETE - Retirer un crayon d'un dessin
export async function onRequestDelete(context: CloudflareContext) {
    try {
        const { request, env } = context;
        const userId = await getUserFromContext(context);
        const url = new URL(request.url);
        const drawingId = url.searchParams.get('drawingId');
        const pencilId = url.searchParams.get('pencilId');

        if (!drawingId || !pencilId) {
            return new Response(JSON.stringify({ error: "drawingId et pencilId requis" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Vérifier que le dessin appartient à l'utilisateur
        const drawing = await env.DB.prepare(
            "SELECT id FROM drawings WHERE id = ? AND user_id = ?"
        ).bind(drawingId, userId).first();

        if (!drawing) {
            return new Response(JSON.stringify({ error: "Dessin non trouvé" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        await env.DB.prepare(
            "DELETE FROM drawing_pencils WHERE drawing_id = ? AND pencil_id = ?"
        ).bind(drawingId, pencilId).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: error.message.includes('authentifié') ? 401 : 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
