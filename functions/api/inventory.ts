export async function onRequest(context) {
    const { env } = context;
    const { results } = await env.DB.prepare(
        "SELECT * FROM inventory"
    ).all();

    return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" }
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const { id, brand, number, isOwned, userId } = await request.json();

    await env.DB.prepare(
        "INSERT INTO inventory (id, brand, number, is_owned, user_id) VALUES (?, ?, ?, ?, ?) " +
        "ON CONFLICT(id) DO UPDATE SET is_owned = excluded.is_owned"
    ).bind(id, brand, number, isOwned ? 1 : 0, userId).run();

    return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
    });
}
