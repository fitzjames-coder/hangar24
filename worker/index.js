const MIME_TO_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

function toThumbKey(originalKey) {
  const basename = originalKey.replace(/^photos\//, '').replace(/\.[^.]+$/, '');
  return `thumbs/${basename}.webp`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return Response.json({ ok: true, app: 'hangar24' });
    }

    if (request.method === 'GET' && url.pathname === '/api/photos') {
      const { results } = await env.DB.prepare(
        'SELECT id, r2_key, original_filename, uploaded_at FROM photos ORDER BY id DESC'
      ).all();
      return Response.json({ photos: results });
    }

    if (request.method === 'POST' && url.pathname === '/api/upload') {
      try {
        const mime = request.headers.get('Content-Type') || 'image/jpeg';
        const filename = request.headers.get('X-Filename') || 'photo.jpg';
        const ext = MIME_TO_EXT[mime] ?? 'jpg';
        const key = `photos/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

        const bytes = await request.arrayBuffer();

        await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: mime } });

        try {
          const thumbKey = toThumbKey(key);
          const thumbResponse = await env.IMG
            .input(bytes)
            .transform({ width: 600, height: 600, fit: 'cover' })
            .output({ format: 'image/webp' })
            .response();
          await env.IMAGES.put(thumbKey, thumbResponse.body, { httpMetadata: { contentType: 'image/webp' } });
        } catch (_e) {
          // thumbnail generation failed — original still stored, upload succeeds
        }

        const now = new Date().toISOString();
        const result = await env.DB.prepare(
          'INSERT INTO photos (r2_key, original_filename, uploaded_at) VALUES (?, ?, ?)'
        ).bind(key, filename, now).run();

        return Response.json({ ok: true, id: result.meta.last_row_id, r2_key: key });
      } catch (err) {
        return Response.json({ ok: false, error: err.message }, { status: 500 });
      }
    }

    if (request.method === 'GET' && url.pathname.startsWith('/img/')) {
      const key = decodeURIComponent(url.pathname.slice('/img/'.length));
      const size = url.searchParams.get('size');

      if (size === 'thumb') {
        const thumbKey = toThumbKey(key);
        const thumb = await env.IMAGES.get(thumbKey);
        if (thumb) {
          return new Response(thumb.body, {
            headers: {
              'Content-Type': 'image/webp',
              'Cache-Control': 'public, max-age=31536000',
            },
          });
        }
        // fall through to original if no thumb
      }

      const obj = await env.IMAGES.get(key);
      if (!obj) return new Response('Not found', { status: 404 });
      return new Response(obj.body, {
        headers: {
          'Content-Type': obj.httpMetadata?.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
