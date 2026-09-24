/**
 * Configuración y Servicio de Supabase para Espacio Seguro
 * Utiliza llamadas REST directas nativas (PostgREST) + Fallback a Serverless API y Fallback Local
 */

const DEFAULT_URL = 'https://snvnosvrzicppqgncikk.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudm5vc3ZyemljcHBxZ25jaWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODExNDEsImV4cCI6MjEwMzg1NzE0MX0.FNglpiUoyHJMn9mt5_GeWxO-ehlr-guyFLyTY4wa5KM';

// Almacenamiento seguro a prueba de errores en file:// o modo incógnito
const safeStorage = {
  getItem: function(key) {
    try { return window.localStorage ? window.localStorage.getItem(key) : null; }
    catch (e) { return null; }
  },
  setItem: function(key, val) {
    try { if (window.localStorage) window.localStorage.setItem(key, val); }
    catch (e) {}
  },
  removeItem: function(key) {
    try { if (window.localStorage) window.localStorage.removeItem(key); }
    catch (e) {}
  }
};

const savedUrl = safeStorage.getItem('espacio_seguro_supabase_url');
const savedKey = safeStorage.getItem('espacio_seguro_supabase_anon_key');

window.SUPABASE_CONFIG = {
  url: (savedUrl && savedUrl.startsWith('https://')) ? savedUrl.trim() : DEFAULT_URL,
  anonKey: (savedKey && savedKey.startsWith('eyJ')) ? savedKey.trim() : DEFAULT_ANON_KEY,
  
  saveCredentials: function(url, anonKey) {
    if (url) safeStorage.setItem('espacio_seguro_supabase_url', url.trim());
    if (anonKey) safeStorage.setItem('espacio_seguro_supabase_anon_key', anonKey.trim());
    this.url = url ? url.trim() : DEFAULT_URL;
    this.anonKey = anonKey ? anonKey.trim() : DEFAULT_ANON_KEY;
  },
  
  clearCredentials: function() {
    safeStorage.removeItem('espacio_seguro_supabase_url');
    safeStorage.removeItem('espacio_seguro_supabase_anon_key');
    this.url = DEFAULT_URL;
    this.anonKey = DEFAULT_ANON_KEY;
  },
  
  isConfigured: function() {
    return Boolean(this.url && this.anonKey && this.url.startsWith('https://') && this.anonKey.startsWith('eyJ'));
  }
};

/**
 * Cliente Universal SupabaseAPI: Funciona directamente mediante fetch REST
 * sin depender de si la librería UMD del CDN cargó o no.
 */
window.SupabaseAPI = {
  getHeaders: function() {
    return {
      'apikey': window.SUPABASE_CONFIG.anonKey,
      'Authorization': 'Bearer ' + window.SUPABASE_CONFIG.anonKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  },

  /**
   * Obtiene testimonios con estado = 'publicado' (para el feed público)
   */
  getPublishedStories: async function() {
    // 1. Intentar REST directo a Supabase
    try {
      const url = `${window.SUPABASE_CONFIG.url}/rest/v1/experiencias?estado=eq.publicado&select=*&order=created_at.desc`;
      const res = await fetch(url, { method: 'GET', headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      console.warn('Fallo en consulta directa REST Supabase:', err);
    }

    // 2. Intentar vía API de Vercel
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/testimonios');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) return json.data;
        }
      } catch (err) {
        console.warn('Fallo en consulta a /api/testimonios:', err);
      }
    }

    return null;
  },

  /**
   * Obtiene todos los testimonios (para el panel de administración / moderación)
   */
  getAllStories: async function() {
    // 1. Intentar REST directo a Supabase
    try {
      const url = `${window.SUPABASE_CONFIG.url}/rest/v1/experiencias?select=*&order=created_at.desc`;
      const res = await fetch(url, { method: 'GET', headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      console.warn('Fallo en consulta directa getAllStories REST:', err);
    }

    // 2. Intentar vía API de Vercel
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/moderacion', {
          headers: { 'Authorization': 'Bearer moderador2026' }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) return json.data;
        }
      } catch (err) {
        console.warn('Fallo en consulta a /api/moderacion:', err);
      }
    }

    return null;
  },

  /**
   * Inserta un nuevo testimonio
   */
  insertStory: async function(payload) {
    // 1. Intentar REST directo a Supabase
    try {
      const url = `${window.SUPABASE_CONFIG.url}/rest/v1/experiencias`;
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data: Array.isArray(data) ? data[0] : data };
      } else {
        const errText = await res.text();
        console.warn('Supabase REST error insert:', errText);
      }
    } catch (err) {
      console.warn('Fallo en inserción directa REST Supabase:', err);
    }

    // 2. Intentar vía API de Vercel
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/testimonios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const json = await res.json();
          return { success: true, data: json.data };
        }
      } catch (err) {
        console.warn('Fallo en inserción a /api/testimonios:', err);
      }
    }

    return { success: false };
  },

  /**
   * Actualiza el estado de moderación de un relato ('pendiente', 'publicado', 'rechazado')
   */
  updateStatus: async function(id, newStatus) {
    // 1. Intentar REST directo a Supabase
    try {
      const url = `${window.SUPABASE_CONFIG.url}/rest/v1/experiencias?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ estado: newStatus })
      });
      if (res.ok) return { success: true };
    } catch (err) {
      console.warn('Fallo en updateStatus REST Supabase:', err);
    }

    // 2. Intentar vía API de Vercel
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/moderacion', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer moderador2026'
          },
          body: JSON.stringify({ id, estado: newStatus })
        });
        if (res.ok) return { success: true };
      } catch (err) {
        console.warn('Fallo en updateStatus /api/moderacion:', err);
      }
    }

    return { success: false };
  },

  /**
   * Actualiza el contador de apoyos (reacciones de empatía)
   */
  updateApoyos: async function(id, count) {
    try {
      const url = `${window.SUPABASE_CONFIG.url}/rest/v1/experiencias?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ apoyos_count: count })
      });
      if (res.ok) return { success: true };
    } catch (err) {
      console.warn('Fallo en updateApoyos REST Supabase:', err);
    }

    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      try {
        await fetch('/api/testimonios', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, apoyos_count: count })
        });
      } catch (e) {}
    }
  },

  /**
   * Elimina un relato definitivamente
   */
  deleteStory: async function(id) {
    // 1. Intentar REST directo a Supabase
    try {
      const url = `${window.SUPABASE_CONFIG.url}/rest/v1/experiencias?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (res.ok) return { success: true };
    } catch (err) {
      console.warn('Fallo en deleteStory REST Supabase:', err);
    }

    // 2. Intentar vía API de Vercel
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/moderacion', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer moderador2026'
          },
          body: JSON.stringify({ id })
        });
        if (res.ok) return { success: true };
      } catch (err) {
        console.warn('Fallo en deleteStory /api/moderacion:', err);
      }
    }

    return { success: false };
  }
};