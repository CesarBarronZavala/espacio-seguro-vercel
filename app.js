/**
 * ESPACIO SEGURO - Lógica de Cliente y Conexión Supabase
 */

// =========================================================================
// 1. DATOS DE DEMOSTRACIÓN / FALLBACK LOCAL
// =========================================================================
const DEMO_EXPERIENCIAS_KEY = 'espacio_seguro_local_stories';

const INITIAL_DEMO_STORIES = [
  {
    id: 1,
    titulo: 'Aprender a poner límites en la preparatoria',
    tipo_acoso: 'escolar',
    relato: 'Durante mi primer año de preparatoria, un grupo de compañeros comenzó a burlarse de mi forma de vestir y a esconder mis útiles todos los días. Al principio guardé silencio por miedo a que fuera peor, pero el estrés empezó a afectar mi salud. Un día decidí contárselo a una profesora de confianza y a mi madre. Juntas acudimos con la dirección escolar. Aunque el proceso tomó tiempo, la intervención de los docentes y el apoyo de mi familia me devolvieron la tranquilidad. Comparto esto para recordarte que pedir ayuda no te hace débil; es el primer paso para proteger tu bienestar.',
    fecha: '2024-03-15',
    anonimo: true,
    alias: null,
    estado: 'publicado',
    apoyos_count: 14,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    titulo: 'Superando el ciberacoso y recuperando mi espacio digital',
    tipo_acoso: 'cibernetico',
    relato: 'Crearon un perfil falso en redes sociales usando mis fotos para difundir rumores falsos. Me sentí profundamente vulnerable y aislada. Decidí no responder a las provocaciones, guardé capturas de pantalla de todo como evidencia y reporté la cuenta en la plataforma. Además, hablé con la Línea de la Vida para recibir contención emocional porque la ansiedad no me dejaba dormir. Me ayudó mucho desconectarme por unos días y rodearme de amigos reales. Hoy sé que lo que otros digan en una pantalla no define quién soy.',
    fecha: '2024-05-20',
    anonimo: false,
    alias: 'Camila R.',
    estado: 'publicado',
    apoyos_count: 28,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    titulo: 'Hacer frente a la intimidación y sobrecarga laboral',
    tipo_acoso: 'laboral',
    relato: 'En mi trabajo anterior, un supervisor utilizaba comentarios despectivos y me excluía de reuniones importantes de manera deliberada. Empecé a registrar cada incidente con fecha, hora y correos de respaldo. Cuando la situación fue insostenible, presenté el reporte ante Recursos Humanos con las pruebas organizadas. Aunque decidí cambiar de empleo meses después, el proceso me enseñó a reconocer el acoso laboral a tiempo y a no normalizar ningún tipo de maltrato en el entorno profesional.',
    fecha: '2024-08-10',
    anonimo: true,
    alias: null,
    estado: 'publicado',
    apoyos_count: 9,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Helper seguro para localStorage
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

function getLocalStories() {
  const stored = safeStorage.getItem(DEMO_EXPERIENCIAS_KEY);
  if (!stored) {
    safeStorage.setItem(DEMO_EXPERIENCIAS_KEY, JSON.stringify(INITIAL_DEMO_STORIES));
    return [...INITIAL_DEMO_STORIES];
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...INITIAL_DEMO_STORIES];
  } catch (e) {
    return [...INITIAL_DEMO_STORIES];
  }
}

function saveLocalStories(stories) {
  safeStorage.setItem(DEMO_EXPERIENCIAS_KEY, JSON.stringify(stories));
}

// =========================================================================
// 2. ESTADO GLOBAL
// =========================================================================
let supabaseClient = null;
let allPublishedStories = getLocalStories().filter(s => s.estado === 'publicado');
let activeFilter = 'todos';
let searchQuery = '';
let isUsingSupabase = false;

// =========================================================================
// 3. INICIALIZACIÓN
// =========================================================================
function initDatabase() {
  const config = window.SUPABASE_CONFIG;
  const statusBanner = document.getElementById('dbStatusBanner');
  const statusIcon = document.getElementById('dbStatusIcon');
  const statusText = document.getElementById('dbStatusText');

  // Detectar si se está abriendo desde file:// (causa problemas de CORS con Supabase)
  const isFileProtocol = window.location.protocol === 'file:';

  if (config && config.isConfigured() && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(config.url, config.anonKey);
      isUsingSupabase = true;

      if (statusBanner) {
        statusBanner.style.display = 'flex';

        if (isFileProtocol) {
          // Advertir que file:// puede bloquear peticiones de red
          statusBanner.className = 'db-status-banner warning';
          statusIcon.textContent = '⚠️';
          statusText.innerHTML =
            '<strong>Supabase configurado</strong>, pero abriste el archivo directo desde tu PC (<code>file://</code>). ' +
            'Para que funcione correctamente, <strong>usa el servidor local</strong>: ejecuta <code>iniciar-servidor.bat</code> y abre <code>http://localhost:8080</code> en tu navegador.';
        } else {
          statusBanner.className = 'db-status-banner connected';
          statusIcon.textContent = '🟢';
          statusText.innerHTML = 'Conectado a <strong>Supabase (PostgreSQL)</strong>.';
        }
      }
    } catch (err) {
      console.error('Error inicializando Supabase:', err);
      isUsingSupabase = false;
    }
  } else {
    isUsingSupabase = false;
    if (statusBanner) {
      statusBanner.style.display = 'flex';
      statusBanner.className = 'db-status-banner';
      statusIcon.textContent = '💡';
      statusText.innerHTML =
        'Operando en <strong>Modo Local</strong> (sin Supabase). Los testimonios se guardarán solo en este dispositivo.' +
        ' <button onclick="openConfigModal()" style="background:none;border:none;color:var(--color-primary-dark);font-weight:600;cursor:pointer;text-decoration:underline;padding:0;">Configurar Supabase</button>';
    }
  }
}

// =========================================================================
// 4. CARGA DE EXPERIENCIAS
// =========================================================================
async function fetchPublishedStories() {
  renderFeed();
  if (!isUsingSupabase || !supabaseClient) return;

  try {
    const fetchPromise = supabaseClient
      .from('experiencias')
      .select('*')
      .eq('estado', 'publicado')
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout Supabase')), 5000)
    );

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.warn('Error al cargar testimonios de Supabase:', error.message, error);
    } else if (Array.isArray(data) && data.length > 0) {
      allPublishedStories = data;
      renderFeed();
    }
  } catch (err) {
    console.log('Usando datos locales de respaldo. Error Supabase:', err.message);
  }
}

// =========================================================================
// 5. RENDERIZADO DEL FEED
// =========================================================================
function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

function renderFeed() {
  const feedGrid = document.getElementById('feedGrid');
  const feedCountBadge = document.getElementById('feedCountBadge');
  if (!feedGrid) return;

  const filtered = allPublishedStories.filter(story => {
    const matchesFilter = (activeFilter === 'todos') || (story.tipo_acoso === activeFilter);
    const matchesSearch = !searchQuery ||
      story.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.relato.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (story.alias && story.alias.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (feedCountBadge) {
    feedCountBadge.textContent = `${filtered.length} ${filtered.length === 1 ? 'relato' : 'relatos'}`;
  }

  if (filtered.length === 0) {
    feedGrid.innerHTML = `
      <div class="empty-feed-card">
        <div class="empty-icon">🕊️</div>
        <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem; color: var(--color-text-main);">No se encontraron relatos en esta categoría</h3>
        <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto 1.25rem auto;">
          Sé la primera persona en compartir una experiencia o testimonio para inspirar a otros.
        </p>
        <button class="btn btn-primary btn-sm" onclick="openStoryModal('${activeFilter !== 'todos' ? activeFilter : ''}')">✍️ Compartir mi experiencia</button>
      </div>
    `;
    return;
  }

  const categoryLabels = {
    escolar:    { label: 'Acoso Escolar',    badgeClass: 'badge-escolar',    icon: '🎒' },
    laboral:    { label: 'Acoso Laboral',    badgeClass: 'badge-laboral',    icon: '💼' },
    cibernetico:{ label: 'Ciberacoso',       badgeClass: 'badge-cibernetico',icon: '💻' },
    otro:       { label: 'Otro tipo de acoso',badgeClass: 'badge-otro',      icon: '🕊️' }
  };

  feedGrid.innerHTML = filtered.map(story => {
    const cat = categoryLabels[story.tipo_acoso] || categoryLabels.otro;
    const authorText = story.anonimo || !story.alias
      ? '<span class="author-anon">🔒 Testimonio Anónimo</span>'
      : `<span class="author-alias">👤 ${escapeHtml(story.alias)}</span>`;
    const formattedDate = formatDate(story.fecha || story.created_at);
    const supports = story.apoyos_count || 0;
    const isSupported = safeStorage.getItem(`espacio_apoyo_${story.id}`) === 'true';

    return `
      <article class="story-card" data-id="${story.id}">
        <div class="story-card-header">
          <div class="story-meta-top">
            <span class="badge-type ${cat.badgeClass}">${cat.icon} ${escapeHtml(cat.label)}</span>
            <span class="story-date" title="Fecha del testimonio">📅 ${formattedDate}</span>
          </div>
          <h3 class="story-title">${escapeHtml(story.titulo)}</h3>
          <div class="story-author">${authorText}</div>
        </div>
        <div class="story-body">${escapeHtml(story.relato)}</div>
        <div class="story-footer">
          <button
            type="button"
            class="btn-empathy ${isSupported ? 'active' : ''}"
            onclick="toggleEmpathy(${story.id})"
            title="Mostrar solidaridad y apoyo"
            aria-label="Dar apoyo a este testimonio"
          >
            <span class="heart-icon">${isSupported ? '❤️' : '🤍'}</span>
            <span>Te escuchamos</span>
            <strong style="margin-left: 0.2rem;">${supports}</strong>
          </button>
          <span style="font-size: 0.75rem; color: var(--color-text-light);">Espacio seguro</span>
        </div>
      </article>
    `;
  }).join('');
}

// =========================================================================
// 6. FILTRADO
// =========================================================================
function filterFeedFromCard(category) {
  activeFilter = category;
  const pills = document.querySelectorAll('.filter-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-filter') === category) {
      p.classList.add('active');
      p.setAttribute('aria-selected', 'true');
    } else {
      p.classList.remove('active');
      p.setAttribute('aria-selected', 'false');
    }
  });
  renderFeed();
  const feedSection = document.getElementById('feed-section');
  if (feedSection) feedSection.scrollIntoView({ behavior: 'smooth' });
}

// =========================================================================
// 7. ENVÍO DE TESTIMONIO — Con manejo de errores real
// =========================================================================
async function handleStorySubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('btnSubmitStory');
  const originalBtnText = submitBtn.innerHTML;

  const titulo    = document.getElementById('inputTitulo').value.trim();
  const tipoAcoso = document.getElementById('selectTipoAcoso').value;
  const fecha     = document.getElementById('inputFecha').value;
  const relato    = document.getElementById('textareaRelato').value.trim();
  const anonimo   = document.getElementById('checkAnonimo').checked;
  const alias     = anonimo ? null : (document.getElementById('inputAlias').value.trim() || 'Participante');

  if (!titulo || !tipoAcoso || !fecha || !relato) {
    showToast('Por favor completa todos los campos requeridos (*).', 'error');
    return;
  }

  if (relato.length < 20) {
    showToast('Por favor comparte un relato de al menos 20 caracteres.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>Enviando con cuidado...</span>';

  const newStoryPayload = {
    titulo:       titulo,
    tipo_acoso:   tipoAcoso,
    relato:       relato,
    fecha:        fecha,
    anonimo:      anonimo,
    alias:        alias,
    estado:       'pendiente',
    apoyos_count: 0
    // created_at se genera automáticamente en Supabase con DEFAULT
  };

  let supabaseOk = false;
  let supabaseErrorMsg = null;

  // 1. Intentar guardar en Supabase
  if (isUsingSupabase && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('experiencias')
        .insert([newStoryPayload])
        .select(); // .select() para confirmar que se guardó

      if (error) {
        supabaseErrorMsg = error.message || JSON.stringify(error);
        console.error('Error Supabase al insertar:', error);
      } else {
        supabaseOk = true;
        console.log('Testimonio guardado en Supabase:', data);
      }
    } catch (err) {
      supabaseErrorMsg = err.message || String(err);
      console.error('Excepción al insertar en Supabase:', err);
    }
  }

  // 2. Siempre guardar localmente como respaldo
  try {
    const local = getLocalStories();
    const newLocalStory = {
      ...newStoryPayload,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    local.unshift(newLocalStory);
    saveLocalStories(local);
  } catch (localErr) {
    console.warn('Error al guardar localmente:', localErr);
  }

  // 3. Resetear formulario
  document.getElementById('storyForm').reset();
  document.getElementById('checkAnonimo').checked = true;
  document.getElementById('aliasWrapper').classList.remove('visible');
  const charCounter = document.getElementById('charCounter');
  if (charCounter) charCounter.textContent = '0 / 5000';
  closeStoryModal();

  // 4. Mostrar mensaje adecuado según resultado
  if (isUsingSupabase && !supabaseOk) {
    // Supabase configurado pero falló
    const isFileProtocol = window.location.protocol === 'file:';
    if (isFileProtocol) {
      showToast(
        '⚠️ Tu historia se guardó localmente, pero no pudo enviarse a la base de datos porque estás abriendo el archivo directamente. ' +
        'Usa el servidor local (iniciar-servidor.bat) para que funcione.',
        'error', 9000
      );
    } else {
      showToast(
        '⚠️ No se pudo guardar en Supabase: ' + (supabaseErrorMsg || 'error desconocido') +
        '. Verifica que ejecutaste el schema.sql en Supabase y que las políticas RLS están activas.',
        'error', 10000
      );
    }
  } else if (supabaseOk) {
    showToast(
      '¡Gracias por tu valentía! Tu experiencia ha sido recibida con respeto y enviada a la base de datos. ' +
      'Pasará por una breve revisión antes de publicarse.',
      'success', 8000
    );
  } else {
    // Modo local
    showToast(
      '¡Gracias por compartir! Tu experiencia se guardó en este dispositivo. ' +
      'Configura Supabase (⚙️) para que quede en la base de datos compartida.',
      'info', 7000
    );
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = originalBtnText;
}

// =========================================================================
// 8. REACCIONES DE APOYO
// =========================================================================
async function toggleEmpathy(storyId) {
  const isAlreadySupported = safeStorage.getItem(`espacio_apoyo_${storyId}`) === 'true';
  const targetStory = allPublishedStories.find(s => s.id == storyId);
  if (!targetStory) return;

  const currentCount = targetStory.apoyos_count || 0;
  const newCount = isAlreadySupported ? Math.max(0, currentCount - 1) : currentCount + 1;
  const newStatus = !isAlreadySupported;

  targetStory.apoyos_count = newCount;
  safeStorage.setItem(`espacio_apoyo_${storyId}`, newStatus ? 'true' : 'false');
  renderFeed();

  const local = getLocalStories();
  const foundIndex = local.findIndex(s => s.id == storyId);
  if (foundIndex !== -1) {
    local[foundIndex].apoyos_count = newCount;
    saveLocalStories(local);
  }

  if (isUsingSupabase && supabaseClient) {
    try {
      await supabaseClient
        .from('experiencias')
        .update({ apoyos_count: newCount })
        .eq('id', storyId);
    } catch (e) {
      console.warn('Error sincronizando apoyo con Supabase:', e);
    }
  }
}

// =========================================================================
// 9. MODALES
// =========================================================================
function openStoryModal(prefillCategory) {
  const modal = document.getElementById('storyModal');
  if (modal) {
    modal.classList.add('open');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    const dateInput = document.getElementById('inputFecha');
    if (dateInput && !dateInput.value) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }
    if (prefillCategory) {
      const select = document.getElementById('selectTipoAcoso');
      if (select) select.value = prefillCategory;
    }
  }
}

function closeStoryModal() {
  const modal = document.getElementById('storyModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function openConfigModal() {
  const modal = document.getElementById('configModal');
  if (modal) {
    const config = window.SUPABASE_CONFIG;
    if (config) {
      const urlInput = document.getElementById('inputSupabaseUrl');
      const keyInput = document.getElementById('inputSupabaseAnonKey');
      if (urlInput) urlInput.value = config.url || '';
      if (keyInput) keyInput.value = config.anonKey || '';
    }
    modal.classList.add('open');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeConfigModal() {
  const modal = document.getElementById('configModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function toggleMobileMenu() {
  const drawer = document.getElementById('mobileNavDrawer');
  if (drawer) drawer.classList.toggle('open');
}

function closeMobileMenu() {
  const drawer = document.getElementById('mobileNavDrawer');
  if (drawer) drawer.classList.remove('open');
}

function toggleFaq(buttonElement) {
  const faqItem = buttonElement.closest('.faq-item');
  if (faqItem) faqItem.classList.toggle('active');
}

// =========================================================================
// 10. TOASTS
// =========================================================================
function showToast(message, type = 'info', duration = 5000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const iconMap = { success: '✅', error: '⚠️', info: 'ℹ️' };

  // Para mensajes de error largos con info técnica, no escapar HTML
  const safeMsg = type === 'error'
    ? message.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    : escapeHtml(message);

  toast.innerHTML = `
    <span>${iconMap[type] || 'ℹ️'}</span>
    <span style="flex-grow: 1;">${safeMsg}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:1rem;padding:0 0 0 0.5rem;opacity:0.6;" aria-label="Cerrar">✕</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// =========================================================================
// 11. EVENT LISTENERS Y ARRANQUE
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initDatabase();
  fetchPublishedStories();

  // Modal de testimonio
  const btnStoryHeader = document.getElementById('btnOpenStoryModalHeader');
  const btnStoryHero   = document.getElementById('btnOpenStoryModalHero');
  const btnStoryBanner = document.getElementById('btnOpenStoryModalBanner');
  const btnStoryClose  = document.getElementById('btnCloseStoryModal');
  const btnStoryCancel = document.getElementById('btnCancelStoryModal');
  const storyForm      = document.getElementById('storyForm');

  if (btnStoryHeader) btnStoryHeader.addEventListener('click', () => openStoryModal());
  if (btnStoryHero)   btnStoryHero.addEventListener('click',   () => openStoryModal());
  if (btnStoryBanner) btnStoryBanner.addEventListener('click', () => openStoryModal());
  if (btnStoryClose)  btnStoryClose.addEventListener('click',  closeStoryModal);
  if (btnStoryCancel) btnStoryCancel.addEventListener('click', closeStoryModal);
  if (storyForm)      storyForm.addEventListener('submit',     handleStorySubmit);

  // Contador de caracteres
  const textareaRelato = document.getElementById('textareaRelato');
  const charCounter    = document.getElementById('charCounter');
  if (textareaRelato && charCounter) {
    textareaRelato.addEventListener('input', () => {
      charCounter.textContent = `${textareaRelato.value.length} / 5000`;
    });
  }

  // Toggle de anonimato
  const checkAnonimo  = document.getElementById('checkAnonimo');
  const aliasWrapper  = document.getElementById('aliasWrapper');
  if (checkAnonimo && aliasWrapper) {
    checkAnonimo.addEventListener('change', () => {
      if (checkAnonimo.checked) {
        aliasWrapper.classList.remove('visible');
      } else {
        aliasWrapper.classList.add('visible');
        const aliasInput = document.getElementById('inputAlias');
        if (aliasInput) aliasInput.focus();
      }
    });
  }

  // Modal de configuración Supabase
  const btnConfig       = document.getElementById('btnOpenConfigModal');
  const btnPromptConfig = document.getElementById('btnDbConfigurePrompt');
  const btnCloseConfig  = document.getElementById('btnCloseConfigModal');
  const btnSaveCreds    = document.getElementById('btnSaveCredentials');
  const btnClearCreds   = document.getElementById('btnClearCredentials');

  if (btnConfig)       btnConfig.addEventListener('click',       openConfigModal);
  if (btnPromptConfig) btnPromptConfig.addEventListener('click', openConfigModal);
  if (btnCloseConfig)  btnCloseConfig.addEventListener('click',  closeConfigModal);

  if (btnSaveCreds) {
    btnSaveCreds.addEventListener('click', () => {
      const url = document.getElementById('inputSupabaseUrl').value.trim();
      const key = document.getElementById('inputSupabaseAnonKey').value.trim();
      if (!url || !key) {
        showToast('Por favor introduce la URL y el anon key de Supabase.', 'error');
        return;
      }
      if (window.SUPABASE_CONFIG) {
        window.SUPABASE_CONFIG.saveCredentials(url, key);
        initDatabase();
        fetchPublishedStories();
        closeConfigModal();
        showToast('Conexión con Supabase configurada con éxito.', 'success');
      }
    });
  }

  if (btnClearCreds) {
    btnClearCreds.addEventListener('click', () => {
      if (window.SUPABASE_CONFIG) {
        window.SUPABASE_CONFIG.clearCredentials();
        initDatabase();
        fetchPublishedStories();
        closeConfigModal();
        showToast('Se restableció la configuración a Modo Local.', 'info');
      }
    });
  }

  // Filtros de categoría
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');
      activeFilter = pill.getAttribute('data-filter') || 'todos';
      renderFeed();
    });
  });

  // Búsqueda en vivo
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderFeed();
    });
  }

  // Menú móvil
  const btnMobileMenu = document.getElementById('btnMobileMenu');
  if (btnMobileMenu) btnMobileMenu.addEventListener('click', toggleMobileMenu);

  // Cerrar con Escape o clic fuera
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeStoryModal();
      closeConfigModal();
      closeMobileMenu();
    }
  });

  const modals = [document.getElementById('storyModal'), document.getElementById('configModal')];
  modals.forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeStoryModal();
          closeConfigModal();
        }
      });
    }
  });
});

// Exposición explícita de funciones en el ámbito global window
window.openStoryModal = openStoryModal;
window.closeStoryModal = closeStoryModal;
window.openConfigModal = openConfigModal;
window.closeConfigModal = closeConfigModal;
window.filterFeedFromCard = filterFeedFromCard;
window.toggleEmpathy = toggleEmpathy;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.toggleFaq = toggleFaq;
