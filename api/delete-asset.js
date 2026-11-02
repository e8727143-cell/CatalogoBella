// POST /api/delete-asset  { publicId: "carpeta/nombre" }
// Firma el borrado con la API secret del servidor: el navegador no puede hacerlo.
import crypto from 'node:crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Usar POST' });
    return;
  }

  const publicId = String(req.body?.publicId || '').trim();
  if (!publicId) {
    res.status(400).json({ error: 'Falta publicId' });
    return;
  }

  const cloud = process.env.CLOUDINARY_CLOUD_NAME || 'nudnxkcm';
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!key || !secret) {
    res.status(500).json({ error: 'Faltan CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en Vercel' });
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${secret}`)
    .digest('hex');

  const body = new URLSearchParams({
    public_id: publicId,
    api_key: key,
    timestamp: String(timestamp),
    signature
  });

  const respuesta = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, {
    method: 'POST',
    body
  });
  const data = await respuesta.json().catch(() => ({}));

  res.status(respuesta.ok ? 200 : 502).json(data);
}
