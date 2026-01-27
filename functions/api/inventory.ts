import type { CloudflareContext } from '../types';
import { getUserFromContext } from '../lib/auth';

// GET - Liste de l'inventaire de l'utilisateur
export async function onRequestGet(context: CloudflareContext) {
    try {
        const { env } = context;
        const userId = await getUserFromContext(context);

        const { results } = await env.DB.prepare(
            "SELECT * FROM inventory WHERE user_id = ?"
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

// POST - Mettre à jour l'inventaire (owned ou hidden)
export async function onRequestPost(context: CloudflareContext) {
    try {
        const { request, env } = context;
        const userId = await getUserFromContext(context);
        const { id, brand, number, isOwned, isHidden } = await request.json();

        // On gère les deux flags de manière flexible
        await env.DB.prepare(
            "INSERT INTO inventory (id, brand, number, is_owned, is_hidden, user_id) VALUES (?, ?, ?, ?, ?, ?) " +
            "ON CONFLICT(id, user_id) DO UPDATE SET " +
            "is_owned = COALESCE(?, is_owned), " +
            "is_hidden = COALESCE(?, is_hidden)"
        ).bind(
            id, 
            brand, 
            number, 
            isOwned !== undefined ? (isOwned ? 1 : 0) : 0, 
            isHidden !== undefined ? (isHidden ? 1 : 0) : 0, 
            userId,
            isOwned !== undefined ? (isOwned ? 1 : 0) : null,
            isHidden !== undefined ? (isHidden ? 1 : 0) : null
        ).run();

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
