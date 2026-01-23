import type { CloudflareContext } from '../types';
import { getUserFromContext } from '../lib/auth';

interface DrawingRow {
    id: number;
    title: string;
    image_r2_key: string | null;
    created_at: string;
}

interface DrawingPencilRow {
    pencil_id: string;
}

// GET - Liste des dessins de l'utilisateur avec leurs pencilIds
export async function onRequestGet(context: CloudflareContext) {
    try {
        const { env, request } = context;
        const userId = await getUserFromContext(context);
        const url = new URL(request.url);
        const drawingId = url.searchParams.get('id');

        // Si un ID est fourni, retourner un seul dessin
        if (drawingId) {
            const drawing = await env.DB.prepare(
                "SELECT id, title, image_r2_key, created_at FROM drawings WHERE id = ? AND user_id = ?"
            ).bind(drawingId, userId).first<DrawingRow>();

            if (!drawing) {
                return new Response(JSON.stringify({ error: "Dessin non trouvé" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                });
            }

            // Récupérer les pencilIds associés
            const { results: pencilRows } = await env.DB.prepare(
                "SELECT pencil_id FROM drawing_pencils WHERE drawing_id = ?"
            ).bind(drawing.id).all<DrawingPencilRow>();

            return new Response(JSON.stringify({
                ...drawing,
                pencilIds: pencilRows.map(r => r.pencil_id)
            }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        // Sinon, retourner tous les dessins
        const { results: drawings } = await env.DB.prepare(
            "SELECT id, title, image_r2_key, created_at FROM drawings WHERE user_id = ? ORDER BY created_at DESC"
        ).bind(userId).all<DrawingRow>();

        // Récupérer tous les pencilIds pour chaque dessin en une requête
        const drawingIds = drawings.map(d => d.id);
        let pencilsByDrawing: Record<number, string[]> = {};

        if (drawingIds.length > 0) {
            const placeholders = drawingIds.map(() => '?').join(',');
            const { results: allPencils } = await env.DB.prepare(
                `SELECT drawing_id, pencil_id FROM drawing_pencils WHERE drawing_id IN (${placeholders})`
            ).bind(...drawingIds).all<{ drawing_id: number; pencil_id: string }>();

            for (const row of allPencils) {
                if (!pencilsByDrawing[row.drawing_id]) {
                    pencilsByDrawing[row.drawing_id] = [];
                }
                pencilsByDrawing[row.drawing_id].push(row.pencil_id);
            }
        }

        const enrichedDrawings = drawings.map(d => ({
            ...d,
            pencilIds: pencilsByDrawing[d.id] || []
        }));

        return new Response(JSON.stringify(enrichedDrawings), {
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
            // Utiliser _ au lieu de / pour éviter les problèmes de routing avec [key].ts
            imageKey = `${userId}_${crypto.randomUUID()}-${file.name}`;
            await env.IMAGES.put(imageKey, file.stream(), {
                httpMetadata: { contentType: file.type }
            });
        }

        const result = await env.DB.prepare(
            "INSERT INTO drawings (title, image_r2_key, user_id) VALUES (?, ?, ?) RETURNING id, created_at"
        ).bind(title, imageKey, userId).first<{ id: number; created_at: string }>();

        return new Response(JSON.stringify({
            id: result!.id,
            title,
            image_r2_key: imageKey,
            created_at: result!.created_at,
            pencilIds: []
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

// PUT - Mettre à jour un dessin (titre, image)
export async function onRequestPut(context: CloudflareContext) {
    try {
        const { request, env } = context;
        const userId = await getUserFromContext(context);
        const formData = await request.formData();

        const id = formData.get('id');
        const title = formData.get('title');
        const file = formData.get('image');

        if (!id) {
            return new Response(JSON.stringify({ error: "ID requis" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Vérifier que le dessin appartient à l'utilisateur
        const existing = await env.DB.prepare(
            "SELECT id, image_r2_key FROM drawings WHERE id = ? AND user_id = ?"
        ).bind(id, userId).first<{ id: number; image_r2_key: string | null }>();

        if (!existing) {
            return new Response(JSON.stringify({ error: "Dessin non trouvé" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        let imageKey = existing.image_r2_key;

        // Upload nouvelle image si fournie
        if (file && file instanceof File) {
            // Supprimer l'ancienne image si elle existe
            if (existing.image_r2_key) {
                await env.IMAGES.delete(existing.image_r2_key);
            }
            imageKey = `${userId}_${crypto.randomUUID()}-${file.name}`;
            await env.IMAGES.put(imageKey, file.stream(), {
                httpMetadata: { contentType: file.type }
            });
        }

        // Mettre à jour le dessin
        if (title) {
            await env.DB.prepare(
                "UPDATE drawings SET title = ?, image_r2_key = ? WHERE id = ? AND user_id = ?"
            ).bind(title, imageKey, id, userId).run();
        } else if (imageKey !== existing.image_r2_key) {
            await env.DB.prepare(
                "UPDATE drawings SET image_r2_key = ? WHERE id = ? AND user_id = ?"
            ).bind(imageKey, id, userId).run();
        }

        return new Response(JSON.stringify({ success: true, image_r2_key: imageKey }), {
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
        ).bind(id, userId).first<{ image_r2_key: string | null }>();

        if (drawing && drawing.image_r2_key) {
            await env.IMAGES.delete(drawing.image_r2_key);
        }

        // Supprimer les pencils associés (cascade devrait le faire, mais on s'assure)
        await env.DB.prepare(
            "DELETE FROM drawing_pencils WHERE drawing_id = ?"
        ).bind(id).run();

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
