import type { CloudflareContext } from '../../types';
import { generateToken } from '../../lib/auth';

export async function onRequestPost(context: CloudflareContext) {
    const { request } = context;
    const { pin } = await request.json();
    
    // PIN hardcodé pour MVP (même que l'actuel)
    const VALID_PIN = "123456";
    
    if (pin === VALID_PIN) {
        const userId = "default_user";
        const token = await generateToken(userId);
        
        return new Response(JSON.stringify({ success: true }), {
            headers: {
                "Set-Cookie": `auth_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
                "Content-Type": "application/json"
            }
        });
    }
    
    return new Response(JSON.stringify({ success: false, error: "PIN invalide" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
    });
}
