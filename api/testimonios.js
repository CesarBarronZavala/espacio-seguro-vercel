/**
 * API Endpoint: /api/testimonios
 * Compatible con Vercel Serverless (Node 18+ nativo sin dependencias externas)
 */

function getSupabaseBaseUrl() {
  let url = (process.env.SUPABASE_URL || 'https://snvnosvrzicppqgncikk.supabase.co').trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1$/, '');
  return url;
}

function getSupabaseKey() {
  return (process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudm5vc3ZyemljcHBxZ25jaWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODExNDEsImV4cCI6MjEwMzg1NzE0MX0.FNglpiUoyHJMn9mt5_GeWxO-ehlr-guyFLyTY4wa5KM').trim();
}

function getHeaders() {
  const key = getSupabaseKey();
  return {
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const baseUrl = getSupabaseBaseUrl();

  // 1. GET: Obtener testimonios publicados
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${baseUrl}/rest/v1/experiencias?estado=eq.publicado&select=*&order=created_at.desc`, {
        method: 'GET',
        headers: getHeaders()
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(502).json({ success: false, error: 'Supabase respondió con error', detail: data });
      }
      return res.status(200).json({ success: true, data: Array.isArray(data) ? data : [] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. POST: Enviar nuevo testimonio
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { titulo, tipo_acoso, relato, fecha, anonimo, alias } = body || {};

      if (!titulo || !tipo_acoso || !fecha || !relato) {
        return res.status(400).json({ success: false, error: 'Campos requeridos incompletos.' });
      }

      const newStory = {
        titulo: String(titulo).trim(),
        tipo_acoso: String(tipo_acoso).trim(),
        relato: String(relato).trim(),
        fecha: fecha,
        anonimo: Boolean(anonimo),
        alias: anonimo ? null : (alias ? String(alias).trim() : 'Participante'),
        estado: 'pendiente',
        apoyos_count: 0
      };

      const response = await fetch(`${baseUrl}/rest/v1/experiencias`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newStory)
      });

      const text = await response.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch(e){}

      if (!response.ok) {
        return res.status(502).json({ success: false, error: 'Supabase rechazó la inserción', detail: data || text });
      }

      return res.status(201).json({ success: true, message: 'Testimonio recibido con respeto.', data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 3. PUT: Actualizar apoyos
  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, apoyos_count } = body || {};

      if (!id || typeof apoyos_count !== 'number') {
        return res.status(400).json({ success: false, error: 'Parámetros inválidos.' });
      }

      const response = await fetch(`${baseUrl}/rest/v1/experiencias?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ apoyos_count })
      });
      if (!response.ok) {
        return res.status(502).json({ success: false, error: 'Supabase rechazó la actualización' });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}
