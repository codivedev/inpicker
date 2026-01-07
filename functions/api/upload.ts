import { v4 as uuidv4 } from 'uuid'; // Si non dispo dans workers, on utilisera crypto.randomUUID()

export async function onRequestPost(context) {
    const { request, env } = context;
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
        return new Response("Aucun fichier fourni", { status: 400 });
    }

    const key = `${crypto.randomUUID()}-${file.name}`;

    // Upload vers R2
    await env.IMAGES.put(key, file.stream(), {
        httpMetadata: { contentType: file.type }
    });

    return new Response(JSON.stringify({ key, url: `/api/images/${key}` }), {
        headers: { "Content-Type": "application/json" }
    });
}
