export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return Response.json({ ok: true, app: 'hangar24' });
    }

    if (request.method === 'GET' && url.pathname === '/api/photos') {
      const { results } = await env.DB.prepare(
        'SELECT id, r2_key, original_filename, uploaded_at FROM photos ORDER BY uploaded_at DESC, id DESC'
      ).all();
      return Response.json({ photos: results });
    }

    return env.ASSETS.fetch(request);
  },
};
