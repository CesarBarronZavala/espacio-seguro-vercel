/**
 * ESPACIO SEGURO - Lógica del Panel de Moderación
 */

const ADMIN_PIN_STORAGE_KEY = 'espacio_seguro_admin_auth';
const DEFAULT_PIN = 'moderador2026';
const DEMO_EXPERIENCIAS_KEY = 'espacio_seguro_local_stories';

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

async function loadAdminData() {
  const listContainer = document.getElementById('adminListContainer');
  const sourceBadge = document.getElementById('adminSourceBadge');

  if (listContainer) {
    listContainer.innerHTML = `
      <div class="loading-spinner" style="text-align: center; padding: 2.5rem 1rem;">
        <div class="spinner"></div>
        <p style="color: var(--color-text-muted); margin-top: 0.75rem;">Sincronizando con Supabase...</p>
      </div>
    `;
  }

  let data = null;
  if (window.SupabaseAPI) {
    data = await window.SupabaseAPI.getAllStories();
  }

  if (Array.isArray(data)) {
    allStories = data;
    if (sourceBadge) {
      sourceBadge.innerHTML = '🟢 Origen: <strong>Supabase (PostgreSQL)</strong>';
    }
  } else {
    // Si no se pudo conectar, usar respaldo local
    if (sourceBadge) {
      sourceBadge.innerHTML = '💡 Origen: <strong>Modo Local</strong>';
    }
    allStories = getLocalStories();
    
    // Alerta de protocolo file:// si aplica
    if (window.location.protocol === 'file:') {
      showToast('⚠️ Estás abriendo el archivo como file://. Usa iniciar-servidor.bat para conectar con Supabase sin bloqueos.', 'error');
    }
  }

  updateStats();
  renderMainView();
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

function switchAdminTab(tabName) {
  const tabs = document.querySelectorAll('.filter-pill[data-tab]');
  tabs.forEach(t => {
    if (t.getAttribute('data-tab') === tabName) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });
  currentTab = tabName;
  renderMainView();
}
window.switchAdminTab = switchAdminTab;

function renderMainView() {
  const listContainer = document.getElementById('adminListContainer');
  if (!listContainer) return;

  const filtered = allStories.filter(s => s.estado === currentTab);

  if (filtered.length === 0) {
    const publishedCount = allStories.filter(s => s.estado === 'publicado').length;
    const pendingCount = allStories.filter(s => s.estado === 'pendiente').length;

    let extraHint = '';
    if (currentTab === 'pendiente' && publishedCount > 0) {
      extraHint = `
        <p style="margin-top: 1rem;">
          <button type="button" class="btn btn-sm btn-primary" onclick="switchAdminTab('publicado')">
            Ver los ${publishedCount} relatos publicados en el feed →
          </button>
        </p>
      `;
    } else if (currentTab === 'publicado' && pendingCount > 0) {
      extraHint = `
        <p style="margin-top: 1rem;">
          <button type="button" class="btn btn-sm btn-primary" onclick="switchAdminTab('pendiente')">
            Ver los ${pendingCount} relatos pendientes de revisión →
          </button>
        </p>
      `;
    }

    listContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--color-text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✨</div>
        <h3 style="color: var(--color-text-main); margin-bottom: 0.4rem;">No hay relatos en estado "${currentTab}"</h3>
        <p style="font-size: 0.88rem; max-width: 480px; margin: 0 auto;">
          ${currentTab === 'pendiente' ? '¡Todo al día! No quedan testimonios pendientes de aprobación en este momento.' : 'No hay testimonios registrados en esta pestaña.'}
        </p>
        ${extraHint}
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
              ${story.apoyos_count ? `<span style="font-size: 0.78rem; color: var(--color-primary-dark); font-weight:600;">❤️ ${story.apoyos_count} apoyos</span>` : ''}
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
            <button type="button" class="btn btn-sm btn-approve" onclick="updateStoryStatus(${story.id}, 'publicado')">
              ✅ Aprobar y Publicar
            </button>
          ` : ''}

          ${story.estado !== 'rechazado' ? `
            <button type="button" class="btn btn-sm btn-reject" onclick="updateStoryStatus(${story.id}, 'rechazado')">
              🚫 Rechazar
            </button>
          ` : ''}

          ${story.estado !== 'pendiente' ? `
            <button type="button" class="btn btn-sm btn-outline" onclick="updateStoryStatus(${story.id}, 'pendiente')">
              ⏳ Mover a Pendiente
            </button>
          ` : ''}

          <button type="button" class="btn btn-sm btn-delete" style="margin-left: auto;" onclick="deleteStory(${story.id})">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function updateStoryStatus(storyId, newStatus) {
  // 1. Actualización optimista local en memoria
  const target = allStories.find(s => s.id == storyId);
  if (target) target.estado = newStatus;

  // 2. Actualizar en localStorage
  const localStories = getLocalStories();
  const localTarget = localStories.find(s => s.id == storyId);
  if (localTarget) {
    localTarget.estado = newStatus;
    saveLocalStories(localStories);
  }

  updateStats();
  renderMainView();

  // 3. Sincronizar con Supabase
  let success = false;
  if (window.SupabaseAPI) {
    const res = await window.SupabaseAPI.updateStatus(storyId, newStatus);
    success = res && res.success;
  }

  if (success) {
    showToast(`Relato marcado como "${newStatus}" en Supabase.`, 'success');
  } else {
    showToast(`Relato marcado como "${newStatus}" localmente.`, 'info');
  }
}

async function deleteStory(storyId) {
  if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este registro?')) {
    return;
  }

  // 1. Actualización local
  allStories = allStories.filter(s => s.id != storyId);
  const localStories = getLocalStories().filter(s => s.id != storyId);
  saveLocalStories(localStories);

  updateStats();
  renderMainView();

  // 2. Eliminar en Supabase
  let success = false;
  if (window.SupabaseAPI) {
    const res = await window.SupabaseAPI.deleteStory(storyId);
    success = res && res.success;
  }

  if (success) {
    showToast('Registro eliminado definitivamente de Supabase.', 'info');
  } else {
    showToast('Registro eliminado localmente.', 'info');
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</span><span>${escapeHtml(message)}</span>`;
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
      const val = pinInput ? pinInput.value.trim() : '';
      if (val === DEFAULT_PIN) {
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
      showToast('Sincronizando con la base de datos...', 'info');
    });
  }
});

// Exposición global
window.updateStoryStatus = updateStoryStatus;
window.deleteStory = deleteStory;
window.loadAdminData = loadAdminData;
window.showToast = showToast;
