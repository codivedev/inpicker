import type { CloudflareContext } from '../types';
import { getUserFromContext } from '../lib/auth';

// GET - Liste des marques personnalisées
export async function onRequestGet(context: CloudflareContext) {
    try {
        const { env } = context;
        const userId = await getUserFromContext(context);

        const { results } = await env.DB.prepare(
            "SELECT * FROM brands WHERE user_id = ?"
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

// POST - Ajouter une marque personnalisée
export async function onRequestPost(context: CloudflareContext) {
    try {
        const { request, env } = context;
        const userId = await getUserFromContext(context);
        const { name } = await request.json();

        if (!name) throw new Error("Nom de la marque manquant");

        const id = name.toLowerCase().replace(/\s+/g, '-');

        await env.DB.prepare(
            "INSERT INTO brands (id, name, user_id) VALUES (?, ?, ?) " +
            "ON CONFLICT(id, user_id) DO NOTHING"
        ).bind(id, name, userId).run();

        return new Response(JSON.stringify({ success: true, id, name }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: error.message.includes('authentifié') ? 401 : 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// DELETE - Supprimer une marque personnalisée
export async function onRequestDelete(context: CloudflareContext) {
    try {
        const { env } = context;
        const userId = await getUserFromContext(context);
        const url = new URL(context.request.url);
        const id = url.searchParams.get('id');

        if (!id) throw new Error("ID manquant");

        await env.DB.prepare(
            "DELETE FROM brands WHERE id = ? AND user_id = ?"
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
