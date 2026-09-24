/**
 * API Endpoint: /api/moderacion
 * Compatible con Vercel Serverless (Node 18+ nativo sin dependencias externas)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://snvnosvrzicppqgncikk.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudm5vc3ZyemljcHBxZ25jaWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODExNDEsImV4cCI6MjEwMzg1NzE0MX0.FNglpiUoyHJMn9mt5_GeWxO-ehlr-guyFLyTY4wa5KM';
const adminSecret = (process.env.ADMIN_SECRET_KEY || 'moderador2026').trim().toLowerCase();

function getHeaders() {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim().toLowerCase();
  const queryPin = (req.query.pin || '').trim().toLowerCase();

  const isAuthorized = (token === adminSecret || queryPin === adminSecret);

  if (!isAuthorized) {
    return res.status(401).json({ success: false, error: 'Clave de moderador incorrecta o no proporcionada.' });
  }

  if (req.method === 'GET') {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/experiencias?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: getHeaders()
      });
      const data = await response.json();
      return res.status(200).json({ success: true, data: Array.isArray(data) ? data : [] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, estado } = body || {};

      if (!id || !['pendiente', 'publicado', 'rechazado'].includes(estado)) {
        return res.status(400).json({ success: false, error: 'Estado o ID inválido.' });
      }

      await fetch(`${SUPABASE_URL}/rest/v1/experiencias?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ estado })
      });

      return res.status(200).json({ success: true, message: `Estado actualizado a ${estado}` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const id = (body && body.id) || req.query.id;

      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requerido para eliminar.' });
      }

      await fetch(`${SUPABASE_URL}/rest/v1/experiencias?id=eq.${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      return res.status(200).json({ success: true, message: 'Registro eliminado definitivamente.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}
