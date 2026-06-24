const MIME_TO_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

function toThumbKey(originalKey) {
  const basename = originalKey.replace(/^photos\//, '').replace(/\.[^.]+$/, '');
  return `thumbs/${basename}.webp`;
}

function toPreviewKey(originalKey) {
  const basename = originalKey.replace(/^photos\//, '').replace(/\.[^.]+$/, '');
  return `previews/${basename}.webp`;
}

// ── Image metadata parser (EXIF + XMP, hand-rolled, fully defensive) ─────────

function parseImageMetadata(bytes) {
  const empty = {
    title: null, description: null, keywords: null,
    taken_at: null, camera: null, lens: null,
    aperture: null, shutter: null, iso: null,
    focal_length: null, flash: null, white_balance: null,
  };

  try {
    const view = new DataView(bytes);
    const u8 = new Uint8Array(bytes);
    const len = u8.length;

    // Only attempt EXIF on JPEG (FF D8)
    if (len < 4 || view.getUint16(0) !== 0xFFD8) return empty;

    // ── Scan JPEG segments for APP1 Exif ──────────────────────────────
    let tiffBase = -1;
    let pos = 2;
    while (pos + 4 <= len) {
      if (u8[pos] !== 0xFF) break;
      const marker = u8[pos + 1];
      const segLen = view.getUint16(pos + 2, false); // JPEG segment lengths are big-endian
      if (segLen < 2) break;

      if (marker === 0xE1 && pos + 10 <= len &&
          u8[pos + 4] === 0x45 && u8[pos + 5] === 0x78 && u8[pos + 6] === 0x69 &&
          u8[pos + 7] === 0x66 && u8[pos + 8] === 0x00 && u8[pos + 9] === 0x00) {
        tiffBase = pos + 10; // start of TIFF block inside APP1
        break;
      }
      pos += 2 + segLen;
    }

    // ── TIFF / EXIF ──────────────────────────────────────────────────
    const rawExif = {};

    if (tiffBase >= 0 && tiffBase + 8 <= len) {
      const bo = u8[tiffBase] === 0x49; // "II" = little-endian; "MM" = big-endian
      const end = len - tiffBase;       // safe upper bound for offsets from tiffBase

      function g16(o) { return (o + 2 <= end) ? view.getUint16(tiffBase + o, bo) : 0; }
      function g32(o) { return (o + 4 <= end) ? view.getUint32(tiffBase + o, bo) : 0; }

      function readAscii(o, cnt) {
        let s = '';
        for (let i = 0; i < cnt && o + i < end; i++) {
          const c = u8[tiffBase + o + i];
          if (c === 0) break;
          s += String.fromCharCode(c);
        }
        return s.trim();
      }

      function readRat(o) {
        if (o + 8 > end) return null;
        const num = g32(o);
        const den = g32(o + 4);
        return den === 0 ? null : num / den;
      }

      // Byte size per element for types we care about: BYTE=1,ASCII=1,SHORT=2,LONG=4,RATIONAL=8
      const TS = [0, 1, 1, 2, 4, 8];

      function readIFD(ifdOff, wantTags) {
        if (ifdOff + 2 > end) return;
        const cnt = g16(ifdOff);
        for (let i = 0; i < cnt; i++) {
          const e = ifdOff + 2 + i * 12;
          if (e + 12 > end) break;
          const tag = g16(e);
          if (!wantTags.has(tag)) continue;
          const type = g16(e + 2);
          const count = g32(e + 4);
          const ts = TS[type] || 1;
          const vs = ts * count; // total byte size of value
          // Values fitting in 4 bytes are stored inline in the offset field; larger ones are pointers
          const vo = vs <= 4 ? e + 8 : g32(e + 8);

          if (type === 2) {        // ASCII
            rawExif[tag] = readAscii(vo, count);
          } else if (type === 3) { // SHORT
            rawExif[tag] = vs <= 4 ? g16(e + 8) : g16(vo);
          } else if (type === 4) { // LONG
            rawExif[tag] = vs <= 4 ? g32(e + 8) : g32(vo);
          } else if (type === 5) { // RATIONAL
            rawExif[tag] = readRat(vo);
          }
        }
      }

      // IFD0: Make (0x010F), Model (0x0110), ExifIFD pointer (0x8769)
      readIFD(g32(4), new Set([0x010F, 0x0110, 0x8769]));

      // SubIFD (ExifIFD): photo-specific tags
      if (rawExif[0x8769] != null) {
        readIFD(rawExif[0x8769], new Set([
          0x9003, // DateTimeOriginal (ASCII)
          0x829A, // ExposureTime     (RATIONAL)
          0x829D, // FNumber          (RATIONAL)
          0x8827, // ISOSpeedRatings  (SHORT)
          0x920A, // FocalLength      (RATIONAL)
          0x9209, // Flash            (SHORT)
          0xA403, // WhiteBalance     (SHORT)
          0xA434, // LensModel        (ASCII)
        ]));
      }
    }

    // ── Format EXIF values ───────────────────────────────────────────
    let camera = null;
    {
      const make = (rawExif[0x010F] || '').trim();
      const model = (rawExif[0x0110] || '').trim();
      if (make || model) {
        // First word of make is the brand (e.g. "NIKON" from "NIKON CORPORATION")
        const brand = make.split(/\s+/)[0].toLowerCase();
        if (model.toLowerCase().startsWith(brand)) {
          // Model already contains the brand — title-case first word only, preserve rest
          const ws = model.split(/\s+/);
          camera = ws[0].charAt(0).toUpperCase() + ws[0].slice(1).toLowerCase() +
            (ws.length > 1 ? ' ' + ws.slice(1).join(' ') : '');
        } else if (make) {
          const makeTitled = make.split(/\s+/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          camera = model ? makeTitled + ' ' + model : makeTitled;
        } else {
          camera = model;
        }
      }
    }

    let aperture = null;
    if (rawExif[0x829D] != null) aperture = 'f/' + rawExif[0x829D].toFixed(1);

    let iso = null;
    if (rawExif[0x8827] != null) iso = String(rawExif[0x8827]);

    let shutter = null;
    if (rawExif[0x829A] != null) {
      const t = rawExif[0x829A];
      shutter = t >= 1 ? Math.round(t) + '"' : '1/' + Math.round(1 / t);
    }

    let focal_length = null;
    if (rawExif[0x920A] != null) focal_length = rawExif[0x920A].toFixed(0) + ' mm';

    let flash = null;
    if (rawExif[0x9209] != null) flash = (rawExif[0x9209] & 1) ? 'Flash' : 'No Flash';

    let white_balance = null;
    if (rawExif[0xA403] != null) white_balance = rawExif[0xA403] === 0 ? 'Auto' : 'Manual';

    let taken_at = null;
    if (rawExif[0x9003]) {
      const m = rawExif[0x9003].match(/^(\d{4}):(\d{2}):(\d{2})/);
      if (m) taken_at = `${m[1]}-${m[2]}-${m[3]}`;
    }

    const lens = rawExif[0xA434] || null;

    // ── XMP: title, description, keywords ────────────────────────────
    let title = null, description = null, keywords = null;
    try {
      const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      const xs = text.indexOf('<x:xmpmeta');
      const xe = text.indexOf('</x:xmpmeta>');
      if (xs >= 0 && xe > xs) {
        const xmp = text.slice(xs, xe + 12);

        const titleM = xmp.match(/<dc:title[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/);
        if (titleM) title = titleM[1].trim();

        const descM = xmp.match(/<dc:description[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/);
        if (descM) description = descM[1].trim();

        const subjM = xmp.match(/<dc:subject[\s\S]*?<rdf:Bag[^>]*>([\s\S]*?)<\/rdf:Bag>/);
        if (subjM) {
          const kws = [...subjM[1].matchAll(/<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/g)]
            .map(m => m[1].trim()).filter(Boolean);
          if (kws.length > 0) keywords = JSON.stringify(kws);
        }
      }
    } catch (_) { /* XMP parse failure is non-fatal */ }

    return { title, description, keywords, taken_at, camera, lens, aperture, shutter, iso, focal_length, flash, white_balance };
  } catch (_) {
    return empty;
  }
}

// ── Worker ────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return Response.json({ ok: true, app: 'hangar24' });
    }

    if (request.method === 'GET' && url.pathname === '/api/photos') {
      const { results } = await env.DB.prepare(
        `SELECT id, r2_key, original_filename, uploaded_at,
           title, description, keywords, taken_at, camera, lens,
           aperture, shutter, iso, focal_length, flash, white_balance
         FROM photos ORDER BY id DESC`
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

        // Parse metadata defensively — failure must never block the upload
        let meta = {
          title: null, description: null, keywords: null,
          taken_at: null, camera: null, lens: null,
          aperture: null, shutter: null, iso: null,
          focal_length: null, flash: null, white_balance: null,
        };
        try { meta = parseImageMetadata(bytes); } catch (_) {}

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

        try {
          const previewKey = toPreviewKey(key);
          const previewResponse = await env.IMG
            .input(bytes)
            .transform({ width: 1600, height: 1600, fit: 'scale-down' })
            .output({ format: 'image/webp' })
            .response();
          await env.IMAGES.put(previewKey, previewResponse.body, { httpMetadata: { contentType: 'image/webp' } });
        } catch (_e) {
          // preview generation failed — thumbnail and original unaffected
        }

        const now = new Date().toISOString();
        const result = await env.DB.prepare(
          `INSERT INTO photos
             (r2_key, original_filename, uploaded_at,
              title, description, keywords, taken_at, camera, lens,
              aperture, shutter, iso, focal_length, flash, white_balance)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          key, filename, now,
          meta.title, meta.description, meta.keywords, meta.taken_at,
          meta.camera, meta.lens, meta.aperture, meta.shutter,
          meta.iso, meta.focal_length, meta.flash, meta.white_balance
        ).run();

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

      if (size === 'preview') {
        const previewKey = toPreviewKey(key);
        const preview = await env.IMAGES.get(previewKey);
        if (preview) {
          return new Response(preview.body, {
            headers: {
              'Content-Type': 'image/webp',
              'Cache-Control': 'public, max-age=31536000',
            },
          });
        }
        // fall through to original if no preview
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
