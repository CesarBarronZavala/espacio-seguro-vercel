/**
 * Configuración de Supabase para Espacio Seguro
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

window.SUPABASE_CONFIG = {
    url: safeStorage.getItem('espacio_seguro_supabase_url') || DEFAULT_URL,
    anonKey: safeStorage.getItem('espacio_seguro_supabase_anon_key') || DEFAULT_ANON_KEY,
    
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