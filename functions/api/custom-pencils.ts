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
