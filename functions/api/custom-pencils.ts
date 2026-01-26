import type { CloudflareContext } from '../types';
import { getUserFromContext } from '../lib/auth';

// GET - Liste des crayons personnalisés
export async function onRequestGet(context: CloudflareContext) {
    try {
        const { env } = context;
        const userId = await getUserFromContext(context);

        const { results } = await env.DB.prepare(
            "SELECT * FROM custom_pencils WHERE user_id = ?"
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

// POST - Ajouter un crayon personnalisé
export async function onRequestPost(context: CloudflareContext) {
    try {
        const { request, env } = context;
        const userId = await getUserFromContext(context);
        const { brand, name, number, hex } = await request.json();

        // Conversion hex -> RGB
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        const id = `${brand}|${number}`;

        await env.DB.prepare(
            "INSERT INTO custom_pencils (id, brand, name, number, hex, r, g, b, user_id) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(id, brand, name, number, hex, r, g, b, userId).run();

        // Marquer automatiquement comme possédé
        await env.DB.prepare(
            "INSERT INTO inventory (id, brand, number, is_owned, user_id) VALUES (?, ?, ?, 1, ?)"
        ).bind(id, brand, number, userId).run();

        return new Response(JSON.stringify({ success: true, id }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: error.message.includes('authentifié') ? 401 : 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// PUT - Modifier un crayon personnalisé
export async function onRequestPut(context: CloudflareContext) {
    try {
        const { request, env } = context;
        const userId = await getUserFromContext(context);
        const { oldId, brand, name, number, hex } = await request.json();

        // Conversion hex -> RGB
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        const newId = `${brand}|${number}`;

        if (oldId !== newId) {
            // Si l'ID a changé, on met à jour toutes les tables liées
            // On utilise une série de batch pour garantir la cohérence (D1 batch est atomique)
            await env.DB.batch([
                env.DB.prepare("UPDATE custom_pencils SET id = ?, brand = ?, name = ?, number = ?, hex = ?, r = ?, g = ?, b = ? WHERE id = ? AND user_id = ?")
                    .bind(newId, brand, name, number, hex, r, g, b, oldId, userId),
                env.DB.prepare("UPDATE inventory SET id = ?, brand = ?, number = ? WHERE id = ? AND user_id = ?")
                    .bind(newId, brand, number, oldId, userId),
                env.DB.prepare("UPDATE drawing_pencils SET pencil_id = ? WHERE pencil_id = ? AND drawing_id IN (SELECT id FROM drawings WHERE user_id = ?)")
                    .bind(newId, oldId, userId)
            ]);
        } else {
            // Simple mise à jour des infos
            await env.DB.prepare(
                "UPDATE custom_pencils SET name = ?, hex = ?, r = ?, g = ?, b = ? WHERE id = ? AND user_id = ?"
            ).bind(name, hex, r, g, b, oldId, userId).run();
        }

        return new Response(JSON.stringify({ success: true, id: newId }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: error.message.includes('authentifié') ? 401 : 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// DELETE - Supprimer un crayon personnalisé
export async function onRequestDelete(context: CloudflareContext) {
    try {
        const { env } = context;
        const userId = await getUserFromContext(context);
        const url = new URL(context.request.url);
        const id = url.searchParams.get('id');

        if (!id) throw new Error("ID manquant");

        await env.DB.batch([
            env.DB.prepare("DELETE FROM custom_pencils WHERE id = ? AND user_id = ?").bind(id, userId),
            env.DB.prepare("DELETE FROM inventory WHERE id = ? AND user_id = ?").bind(id, userId),
            env.DB.prepare("DELETE FROM drawing_pencils WHERE pencil_id = ? AND drawing_id IN (SELECT id FROM drawings WHERE user_id = ?)")
                .bind(id, userId)
        ]);

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

