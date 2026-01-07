import { z } from 'zod';

const envSchema = z.object({
    // Ajoutez ici vos variables d'environnement futures
    // VITE_SUPABASE_URL: z.string().url(),
    // VITE_SUPABASE_ANON_KEY: z.string().min(1),
    MODE: z.enum(['development', 'production', 'test']).default('development'),
});

const _env = envSchema.safeParse(import.meta.env);

if (!_env.success) {
    console.error('❌ Environnement invalide :', _env.error.format());
    throw new Error('Variables d\'environnement invalides');
}

export const env = _env.data;
