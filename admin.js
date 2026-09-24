/**
 * ESPACIO SEGURO - Lógica del Panel de Moderación
 */

const ADMIN_PIN_STORAGE_KEY = 'espacio_seguro_admin_auth';
const DEFAULT_PIN = 'moderador2026';
const DEMO_EXPERIENCIAS_KEY = 'espacio_seguro_local_stories';

let supabaseClient = null;
let isUsingSupabase = false;
let currentTab = 'pendiente';
let allStories = [];

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

const safeSession = {
  getItem: function(key) {
    try { return window.sessionStorage ? window.sessionStorage.getItem(key) : null; }
    catch (e) { return null; }
  },
  setItem: function(key, val) {
    try { if (window.sessionStorage) window.sessionStorage.setItem(key, val); }
    catch (e) {}
  },
  removeItem: function(key) {
    try { if (window.sessionStorage) window.sessionStorage.removeItem(key); }
    catch (e) {}
  }
};

function getLocalStories() {
  const stored = safeStorage.getItem(DEMO_EXPERIENCIAS_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch (e) { return []; }
}

function saveLocalStories(stories) {
  safeStorage.setItem(DEMO_EXPERIENCIAS_KEY, JSON.stringify(stories));
}

function initDatabase() {
  const config = window.SUPABASE_CONFIG;
  const sourceBadge = document.getElementById('adminSourceBadge');

  if (config && config.isConfigured() && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(config.url, config.anonKey);
      isUsingSupabase = true;
      if (sourceBadge) sourceBadge.innerHTML = '🟢 Origen: <strong>Supabase (PostgreSQL)</strong>';
    } catch (err) {
      console.warn('Error inicializando Supabase en Admin:', err);
      isUsingSupabase = false;
      if (sourceBadge) sourceBadge.innerHTML = '💡 Origen: <strong>Modo Local</strong>';
    }
  } else {
    isUsingSupabase = false;
    if (sourceBadge) sourceBadge.innerHTML = '💡 Origen: <strong>Modo Local</strong>';
  }
}

async function loadAdminData() {
  const listContainer = document.getElementById('adminListContainer');
  if (listContainer) {
    listContainer.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--color-text-muted);">Cargando registros...</div>';
  }

  try {
    if (isUsingSupabase && supabaseClient) {
      console.log('🔌 Consultando Supabase — tabla: experiencias, sin filtro de estado');
      const { data, error } = await supabaseClient
        .from('experiencias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error Supabase al cargar admin:', JSON.stringify(error));
        // Mostrar el error en pantalla para diagnóstico
        if (listContainer) {
          listContainer.innerHTML = `
            <div style="padding:1.5rem; background:#fff3cd; border:1px solid #ffc107; border-radius:8px; margin:1rem;">
              <strong>⚠️ Error de Supabase:</strong><br>
              <code style="font-size:0.85rem; word-break:break-all;">${escapeHtml(JSON.stringify(error))}</code>
              <br><br>
              <small>Revisa que ejecutaste el <strong>schema.sql</strong> completo en Supabase SQL Editor.</small>
            </div>`;
        }
        allStories = getLocalStories();
      } else {
        console.log(`✅ Supabase devolvió ${data ? data.length : 0} registros:`, data);
        allStories = data || [];
      }
    } else {
      console.log('💡 Modo local — Supabase no configurado o no disponible');
      allStories = getLocalStories();
    }
  } catch (err) {
    console.error('❌ Excepción al cargar datos en Admin:', err);
    if (listContainer) {
      listContainer.innerHTML = `
        <div style="padding:1.5rem; background:#f8d7da; border:1px solid #f5c2c7; border-radius:8px; margin:1rem;">
          <strong>❌ Error de conexión:</strong><br>
          <code style="font-size:0.85rem;">${escapeHtml(err.message || String(err))}</code>
        </div>`;
    }
    allStories = getLocalStories();
  } finally {
    updateStats();
    renderMainView();
  }
}

function updateStats() {
  const pending = allStories.filter(s => s.estado === 'pendiente').length;
  const published = allStories.filter(s => s.estado === 'publicado').length;
  const rejected = allStories.filter(s => s.estado === 'rechazado').length;

  const sp = document.getElementById('statPendingCount');
  const spu = document.getElementById('statPublishedCount');
  const sr = document.getElementById('statRejectedCount');

  if (sp) sp.textContent = pending;
  if (spu) spu.textContent = published;
  if (sr) sr.textContent = rejected;

  const tcp = document.getElementById('tabCountPending');
  const tcpu = document.getElementById('tabCountPublished');
  const tcr = document.getElementById('tabCountRejected');

  if (tcp) tcp.textContent = pending;
  if (tcpu) tcpu.textContent = published;
  if (tcr) tcr.textContent = rejected;
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function renderMainView() {
  const listContainer = document.getElementById('adminListContainer');
  if (!listContainer) return;

  const filtered = allStories.filter(s => s.estado === currentTab);

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--color-text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✨</div>
        <h3 style="color: var(--color-text-main);">No hay relatos en estado "${currentTab}"</h3>
        <p style="font-size: 0.88rem;">Todos los registros en esta sección se encuentran al día.</p>
      </div>
    `;
    return;
  }

  const categoryLabels = {
    escolar: { label: 'Acoso Escolar', badgeClass: 'badge-escolar', icon: '🎒' },
    laboral: { label: 'Acoso Laboral', badgeClass: 'badge-laboral', icon: '💼' },
    cibernetico: { label: 'Ciberacoso', badgeClass: 'badge-cibernetico', icon: '💻' },
    otro: { label: 'Otro tipo', badgeClass: 'badge-otro', icon: '🕊️' }
  };

  listContainer.innerHTML = filtered.map(story => {
    const cat = categoryLabels[story.tipo_acoso] || categoryLabels.otro;
    const authorText = story.anonimo || !story.alias 
      ? '<span class="author-anon">🔒 Anónimo</span>' 
      : `<span class="author-alias">👤 ${escapeHtml(story.alias)}</span>`;

    return `
      <div class="admin-story-item" data-id="${story.id}">
        <div class="admin-item-header">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
              <span class="badge-type ${cat.badgeClass}">${cat.icon} ${escapeHtml(cat.label)}</span>
              <span style="font-size: 0.78rem; color: var(--color-text-muted);">ID: ${story.id}</span>
              <span style="font-size: 0.78rem; color: var(--color-text-muted);">📅 ${escapeHtml(story.fecha || '')}</span>
            </div>
            <h4 class="admin-item-title">${escapeHtml(story.titulo)}</h4>
            <div style="font-size: 0.82rem; margin-top: 0.2rem;">${authorText}</div>
          </div>
          <div>
            <span class="badge-type ${story.estado === 'publicado' ? 'badge-escolar' : story.estado === 'rechazado' ? 'badge-otro' : 'badge-laboral'}">
              ${story.estado.toUpperCase()}
            </span>
          </div>
        </div>

        <div class="admin-item-text">${escapeHtml(story.relato)}</div>

        <div class="admin-item-actions">
          ${story.estado !== 'publicado' ? `
            <button class="btn btn-sm btn-approve" onclick="updateStoryStatus(${story.id}, 'publicado')">
              ✅ Aprobar y Publicar
            </button>
          ` : ''}

          ${story.estado !== 'rechazado' ? `
            <button class="btn btn-sm btn-reject" onclick="updateStoryStatus(${story.id}, 'rechazado')">
              🚫 Rechazar
            </button>
          ` : ''}

          ${story.estado !== 'pendiente' ? `
            <button class="btn btn-sm btn-outline" onclick="updateStoryStatus(${story.id}, 'pendiente')">
              ⏳ Mover a Pendiente
            </button>
          ` : ''}

          <button class="btn btn-sm btn-delete" style="margin-left: auto;" onclick="deleteStory(${story.id})">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function updateStoryStatus(storyId, newStatus) {
  // Actualización local
  const target = allStories.find(s => s.id == storyId);
  if (target) target.estado = newStatus;

  // Actualizar en localStorage
  const localStories = getLocalStories();
  const localTarget = localStories.find(s => s.id == storyId);
  if (localTarget) {
    localTarget.estado = newStatus;
    saveLocalStories(localStories);
  }

  // Actualizar en Supabase si está disponible
  if (isUsingSupabase && supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('experiencias')
        .update({ estado: newStatus })
        .eq('id', storyId);

      if (error) console.warn('Supabase update warning:', error);
    } catch (err) {
      console.warn('Error en Supabase, estado guardado localmente:', err);
    }
  }

  updateStats();
  renderMainView();
  showToast(`Relato marcado como "${newStatus}".`, 'success');
}

async function deleteStory(storyId) {
  if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este registro?')) {
    return;
  }

  allStories = allStories.filter(s => s.id != storyId);

  // Eliminar en localStorage
  const localStories = getLocalStories().filter(s => s.id != storyId);
  saveLocalStories(localStories);

  // Eliminar en Supabase
  if (isUsingSupabase && supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('experiencias')
        .delete()
        .eq('id', storyId);

      if (error) console.warn('Supabase delete warning:', error);
    } catch (err) {
      console.warn('Error eliminando de Supabase:', err);
    }
  }

  updateStats();
  renderMainView();
  showToast('Registro eliminado definitivamente.', 'info');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}

// Control de Acceso por PIN
function checkAdminAuth() {
  const isAuth = safeSession.getItem(ADMIN_PIN_STORAGE_KEY) === 'true';
  const authSection = document.getElementById('authSection');
  const mainContent = document.getElementById('adminMainContent');

  if (isAuth) {
    if (authSection) authSection.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
    initDatabase();
    loadAdminData();
  } else {
    if (authSection) authSection.style.display = 'block';
    if (mainContent) mainContent.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();

  // Formulario de autenticación por PIN
  const pinForm = document.getElementById('adminAuthForm');
  if (pinForm) {
    pinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pinInput = document.getElementById('adminPin');
      if (pinInput && pinInput.value.trim() === DEFAULT_PIN) {
        safeSession.setItem(ADMIN_PIN_STORAGE_KEY, 'true');
        checkAdminAuth();
        showToast('Sesión de moderación iniciada con éxito.', 'success');
      } else {
        showToast('PIN de acceso incorrecto.', 'error');
        if (pinInput) {
          pinInput.value = '';
          pinInput.focus();
        }
      }
    });
  }

  // Pestañas de estado (Pendientes, Publicados, Rechazados)
  const tabs = document.querySelectorAll('.filter-pill[data-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.getAttribute('data-tab');
      renderMainView();
    });
  });

  // Botón cerrar sesión
  const btnLogout = document.getElementById('btnLogoutAdmin');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      safeSession.removeItem(ADMIN_PIN_STORAGE_KEY);
      location.reload();
    });
  }

  // Botón recargar
  const btnRefresh = document.getElementById('btnRefreshAdmin');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      loadAdminData();
      showToast('Datos sincronizados.', 'info');
    });
  }
});
