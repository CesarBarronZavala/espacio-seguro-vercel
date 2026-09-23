import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://snvnosvrzicppqgncikk.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudm5vc3ZyemljcHBxZ25jaWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODExNDEsImV4cCI6MjEwMzg1NzE0MX0.FNglpiUoyHJMn9mt5_GeWxO-ehlr-guyFLyTY4wa5KM';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET: Obtener todos los testimonios publicados
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('experiencias')
        .select('*')
        .eq('estado', 'publicado')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. POST: Enviar un nuevo testimonio (queda como pendiente)
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { titulo, tipo_acoso, relato, fecha, anonimo, alias } = body;

      if (!titulo || !tipo_acoso || !fecha || !relato) {
        return res.status(400).json({ success: false, error: 'Campos requeridos incompletos.' });
      }

      const newStory = {
        titulo: titulo.trim(),
        tipo_acoso: tipo_acoso,
        relato: relato.trim(),
        fecha: fecha,
        anonimo: Boolean(anonimo),
        alias: anonimo ? null : (alias ? alias.trim() : 'Participante'),
        estado: 'pendiente',
        apoyos_count: 0
      };

      const { data, error } = await supabase
        .from('experiencias')
        .insert([newStory])
        .select();

      if (error) throw error;
      return res.status(201).json({ success: true, message: 'Testimonio recibido con respeto.', data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 3. PUT: Sumar apoyo / empatía a un testimonio
  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, apoyos_count } = body;

      if (!id || typeof apoyos_count !== 'number') {
        return res.status(400).json({ success: false, error: 'Parámetros inválidos.' });
      }

      const { data, error } = await supabase
        .from('experiencias')
        .update({ apoyos_count })
        .eq('id', id)
        .select();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}
