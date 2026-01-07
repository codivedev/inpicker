import type { CloudflareContext } from '../types';
import { getUserFromContext } from '../lib/auth';

// GET - Liste des dessins de l'utilisateur
export async function onRequestGet(context: CloudflareContext) {
    try {
        const { env } = context;
        const userId = await getUserFromContext(context);

        const { results } = await env.DB.prepare(
            "SELECT id, title, image_r2_key, created_at FROM drawings WHERE user_id = ? ORDER BY created_at DESC"
        ).bind(userId).all();

        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// POST - Créer un nouveau dessin avec upload R2
export async function onRequestPost(context: CloudflareContext) {
    try {
        const { request, env } = context;
        const userId = await getUserFromContext(context);
        const formData = await request.formData();

        const title = formData.get('title');
        const file = formData.get('image');

        if (!title) {
            return new Response(JSON.stringify({ error: "Titre requis" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        let imageKey = null;
        if (file && file instanceof File) {
            imageKey = `${userId}/${crypto.randomUUID()}-${file.name}`;
            await env.IMAGES.put(imageKey, file.stream(), {
                httpMetadata: { contentType: file.type }
            });
        }

        const result = await env.DB.prepare(
            "INSERT INTO drawings (title, image_r2_key, user_id) VALUES (?, ?, ?) RETURNING id, created_at"
        ).bind(title, imageKey, userId).first();

        return new Response(JSON.stringify({
            id: result.id,
            title,
            image_r2_key: imageKey,
            created_at: result.created_at
        }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: error.message.includes('authentifié') ? 401 : 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// DELETE - Supprimer un dessin
export async function onRequestDelete(context: CloudflareContext) {
    try {
        const { request, env } = context;
        const userId = await getUserFromContext(context);
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: "ID requis" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Récupérer l'image key avant suppression
        const drawing = await env.DB.prepare(
            "SELECT image_r2_key FROM drawings WHERE id = ? AND user_id = ?"
        ).bind(id, userId).first();

        if (drawing && drawing.image_r2_key) {
            await env.IMAGES.delete(drawing.image_r2_key);
        }

        await env.DB.prepare(
            "DELETE FROM drawings WHERE id = ? AND user_id = ?"
        ).bind(id, userId).run();

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
