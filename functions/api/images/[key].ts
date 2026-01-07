export async function onRequestGet(context) {
    const { env, params } = context;
    const key = params.key;

    if (!key) return new Response("Key manquante", { status: 400 });

    const object = await env.IMAGES.get(key);

    if (object === null) {
        return new Response("Image non trouvée", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);

    return new Response(object.body, {
        headers
    });
}
