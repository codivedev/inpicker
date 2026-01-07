import type { CloudflareContext } from '../../types';
import { generateToken } from '../../lib/auth';

// Configuration des utilisateurs avec leurs PINs (fallback si table users n'existe pas encore)
const USERS: Record<string, { pin: string; name: string; isAdmin?: boolean }> = {
    "yaelle": { pin: "141116", name: "Yaëlle" },
    "renaud": { pin: "246809", name: "Renaud", isAdmin: true },
};

export async function onRequestPost(context: CloudflareContext) {
    const { request, env } = context;
    const { pin } = await request.json();

    try {
        // Essayer d'abord avec la table users (si elle existe)
        const user = await env.DB.prepare(
            "SELECT id, name, is_admin FROM users WHERE pin = ?"
        ).bind(pin).first();

        if (user) {
            // Mettre à jour last_login_at
            await env.DB.prepare(
                "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?"
            ).bind(user.id).run();

            const token = await generateToken(user.id as string);

            return new Response(JSON.stringify({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    isAdmin: !!user.is_admin
                }
            }), {
                headers: {
                    "Set-Cookie": `auth_token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`,
                    "Content-Type": "application/json"
                }
            });
        }
    } catch {
        // Table users n'existe pas encore, fallback sur hardcode
        console.log('[Auth] Fallback sur utilisateurs hardcodés');
    }

    // Fallback: Rechercher l'utilisateur par son PIN dans le hardcode
    const userEntry = Object.entries(USERS).find(([, user]) => user.pin === pin);

    if (userEntry) {
        const [userId, user] = userEntry;
        const token = await generateToken(userId);

        return new Response(JSON.stringify({
            success: true,
            user: {
                id: userId,
                name: user.name,
                isAdmin: !!user.isAdmin
            }
        }), {
            headers: {
                "Set-Cookie": `auth_token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`,
                "Content-Type": "application/json"
            }
        });
    }

    return new Response(JSON.stringify({ success: false, error: "PIN invalide" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
    });
}
