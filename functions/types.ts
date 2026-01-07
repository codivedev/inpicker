// Types pour Cloudflare Pages Functions
// Les types D1Database et R2Bucket sont fournis par @cloudflare/workers-types
export interface CloudflareContext {
    request: Request;
    env: {
        DB: any; // D1Database
        IMAGES: any; // R2Bucket
    };
    params?: Record<string, string>;
}
