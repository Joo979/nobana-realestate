let adminData = { properties: [], settings: {} };
let editingPropertyId = null;
let heroImageCount = 0;

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([fetchProperties(), fetchSettings()]);
  initTabs();
  initSettingsTabs();
  renderDashboard();
  renderPropertiesTable();
  renderAgentsTable();
  populateSettingsForms();
  populateSocialForm();
  populateSeoForm();
  renderHeroImageInputs();
  document.getElementById('settingsForm').addEventListener('submit', saveBusinessInfo);
  document.getElementById('socialForm').addEventListener('submit', saveSocialLinks);
  document.getElementById('seoForm').addEventListener('submit', saveSeo);
});

async function fetchProperties() {
  try {
    const res = await fetch('../data/properties.json');
    adminData.properties = await res.json();
  } catch { adminData.properties = []; }
}

async function fetchSettings() {
  try {
    const res = await fetch('../data/settings.json');
    adminData.settings = await res.json();
  } catch { adminData.settings = {}; }
}

/* Tab Navigation */
function initTabs() {
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      const tabEl = document.getElementById('tab-' + tab);
      if (tabEl) tabEl.classList.add('active');
      if (tab === 'dashboard') renderDashboard();
      if (tab === 'properties') renderPropertiesTable();
      if (tab === 'agents') renderAgentsTable();
    });
  });
}

function initSettingsTabs() {
  document.querySelectorAll('.settings-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const stab = btn.dataset.stab;
      document.querySelectorAll('.settings-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.settings-content').forEach(c => c.classList.remove('active'));
      const el = document.getElementById('stab-' + stab);
      if (el) el.classList.add('active');
    });
  });
  document.querySelectorAll('.quick-action-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = card.dataset.tab;
      document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
      document.querySelector(`.sidebar-nav a[data-tab="${tab}"]`)?.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      const tabEl = document.getElementById('tab-' + tab);
      if (tabEl) tabEl.classList.add('active');
    });
  });
}

/* Toast */
function adminToast(msg, type = 'success') {
  const t = document.getElementById('adminToast');
  const m = document.getElementById('adminToastMsg');
  if (!t || !m) return;
  t.className = 'toast ' + (type === 'error' ? 'error' : '');
  m.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* Format Price */
function fmtPrice(p) {
  if (p >= 1000000) return `$${(p / 1000000).toFixed(1)}M`;
  if (p >= 1000) return `$${(p / 1000).toFixed(0)}K`;
  return `$${p.toLocaleString()}`;
}

/* === DASHBOARD === */
function renderDashboard() {
  const grid = document.getElementById('dashboardStats');
  if (!grid) return;
  const p = adminData.properties;
  const b = adminData.settings.business || {};
  grid.innerHTML = `
    <div class="stat-card">
      <div class="icon"><i class="fas fa-building"></i></div>
      <div class="value">${p.length}</div>
      <div class="label">Total Properties</div>
    </div>
    <div class="stat-card">
      <div class="icon"><i class="fas fa-star"></i></div>
      <div class="value">${p.filter(x => x.featured).length}</div>
      <div class="label">Featured</div>
    </div>
    <div class="stat-card">
      <div class="icon"><i class="fas fa-home"></i></div>
      <div class="value">${p.filter(x => x.type === 'House').length}</div>
      <div class="label">Houses</div>
    </div>
    <div class="stat-card">
      <div class="icon"><i class="fas fa-user-tie"></i></div>
      <div class="value">${countUniqueAgents()}</div>
      <div class="label">Agents</div>
    </div>
  `;
}

function countUniqueAgents() {
  const names = new Set(adminData.properties.map(p => p.agent));
  return names.size;
}

/* === PROPERTIES === */
function renderPropertiesTable() {
  const tbody = document.getElementById('propertiesBody');
  if (!tbody) return;
  tbody.innerHTML = adminData.properties.map(p => `
    <tr>
      <td><strong>${p.title}</strong></td>
      <td>${fmtPrice(p.price)}</td>
      <td>${p.type}</td>
      <td>${p.beds}</td>
      <td>${p.baths}</td>
      <td>${p.location}</td>
      <td><span class="featured-badge ${p.featured ? 'yes' : 'no'}">${p.featured ? 'Yes' : 'No'}</span></td>
      <td class="actions">
        <button class="btn-edit" onclick="editProperty(${p.id})"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn-delete" onclick="deleteProperty(${p.id})"><i class="fas fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');
}

function openPropertyModal(data) {
  const modal = document.getElementById('propertyModal');
  const form = document.getElementById('propertyForm');
  form.reset();
  editingPropertyId = null;
  document.getElementById('modalTitle').textContent = 'Add Property';

  if (data) {
    editingPropertyId = data.id;
    document.getElementById('modalTitle').textContent = 'Edit Property';
    document.getElementById('prop_id').value = data.id;
    document.getElementById('prop_title').value = data.title || '';
    document.getElementById('prop_price').value = data.price || '';
    document.getElementById('prop_type').value = data.type || 'House';
    document.getElementById('prop_status').value = data.status || 'For Sale';
    document.getElementById('prop_beds').value = data.beds || '';
    document.getElementById('prop_baths').value = data.baths || '';
    document.getElementById('prop_sqft').value = data.sqft || '';
    document.getElementById('prop_location').value = data.location || '';
    document.getElementById('prop_description').value = data.description || '';
    document.getElementById('prop_features').value = (data.features || []).join(', ');
    document.getElementById('prop_images').value = (data.images || []).join('\n');
    document.getElementById('prop_lat').value = data.lat || '';
    document.getElementById('prop_lng').value = data.lng || '';
    document.getElementById('prop_year').value = data.yearBuilt || '';
    document.getElementById('prop_agent').value = data.agent || '';
    document.getElementById('prop_agentTitle').value = data.agentTitle || '';
    document.getElementById('prop_agentPhone').value = data.agentPhone || '';
    document.getElementById('prop_agentEmail').value = data.agentEmail || '';
    document.getElementById('prop_agentImage').value = data.agentImage || '';
    document.getElementById('prop_featured').checked = !!data.featured;
  }
  modal.classList.add('active');
}

function closePropertyModal() {
  document.getElementById('propertyModal').classList.remove('active');
}

function saveProperty() {
  const id = editingPropertyId || Math.max(0, ...adminData.properties.map(p => p.id)) + 1;
  const features = document.getElementById('prop_features').value.split(',').map(f => f.trim()).filter(Boolean);
  const images = document.getElementById('prop_images').value.split('\n').map(u => u.trim()).filter(Boolean);

  const prop = {
    id,
    title: document.getElementById('prop_title').value,
    price: parseFloat(document.getElementById('prop_price').value) || 0,
    beds: parseInt(document.getElementById('prop_beds').value) || 0,
    baths: parseFloat(document.getElementById('prop_baths').value) || 0,
    sqft: parseInt(document.getElementById('prop_sqft').value) || 0,
    type: document.getElementById('prop_type').value,
    status: document.getElementById('prop_status').value,
    location: document.getElementById('prop_location').value,
    description: document.getElementById('prop_description').value,
    features,
    images,
    agent: document.getElementById('prop_agent').value,
    agentTitle: document.getElementById('prop_agentTitle').value,
    agentPhone: document.getElementById('prop_agentPhone').value,
    agentEmail: document.getElementById('prop_agentEmail').value,
    agentImage: document.getElementById('prop_agentImage').value,
    lat: parseFloat(document.getElementById('prop_lat').value) || 0,
    lng: parseFloat(document.getElementById('prop_lng').value) || 0,
    featured: document.getElementById('prop_featured').checked,
    yearBuilt: parseInt(document.getElementById('prop_year').value) || new Date().getFullYear()
  };

  if (!prop.title || !prop.price) {
    adminToast('Title and Price are required.', 'error');
    return;
  }

  if (editingPropertyId) {
    const idx = adminData.properties.findIndex(p => p.id === id);
    if (idx >= 0) adminData.properties[idx] = prop;
  } else {
    adminData.properties.push(prop);
  }

  savePropertiesToLocal();
  closePropertyModal();
  renderPropertiesTable();
  adminToast('Property saved!');
}

function editProperty(id) {
  const prop = adminData.properties.find(p => p.id === id);
  if (prop) openPropertyModal(prop);
}

function deleteProperty(id) {
  if (!confirm('Delete this property?')) return;
  adminData.properties = adminData.properties.filter(p => p.id !== id);
  savePropertiesToLocal();
  renderPropertiesTable();
  renderDashboard();
  adminToast('Property deleted.');
}

function savePropertiesToLocal() {
  localStorage.setItem('nobana_admin_properties', JSON.stringify(adminData.properties));
}

function getStoredProperties() {
  const stored = localStorage.getItem('nobana_admin_properties');
  if (stored) {
    try { adminData.properties = JSON.parse(stored); } catch {}
  }
}

/* === AGENTS === */
function getAgentsList() {
  const map = {};
  adminData.properties.forEach(p => {
    if (p.agent && !map[p.agent]) {
      map[p.agent] = { name: p.agent, title: p.agentTitle || '', phone: p.agentPhone || '', email: p.agentEmail || '', image: p.agentImage || '' };
    }
  });
  return Object.values(map);
}

function renderAgentsTable() {
  const tbody = document.getElementById('agentsBody');
  if (!tbody) return;
  const stored = localStorage.getItem('nobana_admin_agents');
  let agents = [];
  if (stored) {
    try { agents = JSON.parse(stored); } catch { agents = getAgentsList(); }
  } else {
    agents = getAgentsList();
  }

  tbody.innerHTML = agents.map((a, i) => `
    <tr>
      <td><strong>${a.name}</strong></td>
      <td>${a.title}</td>
      <td>${a.phone}</td>
      <td>${a.email}</td>
      <td class="actions">
        <button class="btn-edit" onclick="editAgent(${i})"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn-delete" onclick="deleteAgent(${i})"><i class="fas fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');
}

function addAgent() {
  const name = prompt('Agent name:');
  if (!name) return;
  let agents = getStoredAgents();
  agents.push({ name, title: '', phone: '', email: '', image: '' });
  localStorage.setItem('nobana_admin_agents', JSON.stringify(agents));
  renderAgentsTable();
  adminToast('Agent added.');
}

function editAgent(index) {
  let agents = getStoredAgents();
  const a = agents[index];
  const name = prompt('Name:', a.name);
  if (!name) return;
  const title = prompt('Title:', a.title);
  const phone = prompt('Phone:', a.phone);
  const email = prompt('Email:', a.email);
  const image = prompt('Image URL:', a.image);
  agents[index] = { name, title: title || '', phone: phone || '', email: email || '', image: image || '' };
  localStorage.setItem('nobana_admin_agents', JSON.stringify(agents));
  renderAgentsTable();
  adminToast('Agent updated.');
}

function deleteAgent(index) {
  if (!confirm('Delete this agent?')) return;
  let agents = getStoredAgents();
  agents.splice(index, 1);
  localStorage.setItem('nobana_admin_agents', JSON.stringify(agents));
  renderAgentsTable();
  adminToast('Agent deleted.');
}

function getStoredAgents() {
  const stored = localStorage.getItem('nobana_admin_agents');
  if (stored) { try { return JSON.parse(stored); } catch {} }
  return getAgentsList();
}

/* === SETTINGS === */
function populateSettingsForms() {
  const b = adminData.settings.business || {};
  document.getElementById('set_name').value = b.name || '';
  document.getElementById('set_tagline').value = b.tagline || '';
  document.getElementById('set_description').value = b.description || '';
  document.getElementById('set_address').value = b.address || '';
  document.getElementById('set_city').value = b.city || '';
  document.getElementById('set_phone').value = b.phone || '';
  document.getElementById('set_phone2').value = b.phone2 || '';
  document.getElementById('set_email').value = b.email || '';
  document.getElementById('set_email2').value = b.email2 || '';
  document.getElementById('set_hours').value = b.hours || '';
  document.getElementById('set_lat').value = (adminData.settings.coordinates?.lat) || '';
  document.getElementById('set_lng').value = (adminData.settings.coordinates?.lng) || '';
  document.getElementById('set_sold').value = (b.stats?.sold) || '';
  document.getElementById('set_clients').value = (b.stats?.clients) || '';
}

function saveBusinessInfo(e) {
  e.preventDefault();
  const s = adminData.settings;
  if (!s.business) s.business = {};
  const b = s.business;
  b.name = document.getElementById('set_name').value;
  b.tagline = document.getElementById('set_tagline').value;
  b.description = document.getElementById('set_description').value;
  b.address = document.getElementById('set_address').value;
  b.city = document.getElementById('set_city').value;
  b.phone = document.getElementById('set_phone').value;
  b.phone2 = document.getElementById('set_phone2').value;
  b.email = document.getElementById('set_email').value;
  b.email2 = document.getElementById('set_email2').value;
  b.hours = document.getElementById('set_hours').value;
  b.stats = b.stats || {};
  b.stats.sold = parseInt(document.getElementById('set_sold').value) || 0;
  b.stats.clients = parseInt(document.getElementById('set_clients').value) || 0;
  if (!s.coordinates) s.coordinates = {};
  s.coordinates.lat = parseFloat(document.getElementById('set_lat').value) || 0;
  s.coordinates.lng = parseFloat(document.getElementById('set_lng').value) || 0;
  localStorage.setItem('nobana_admin_settings', JSON.stringify(s));
  adminToast('Business info saved!');
}

/* Social */
function populateSocialForm() {
  const soc = adminData.settings.social || {};
  document.getElementById('soc_facebook').value = soc.facebook || '';
  document.getElementById('soc_instagram').value = soc.instagram || '';
  document.getElementById('soc_twitter').value = soc.twitter || '';
  document.getElementById('soc_linkedin').value = soc.linkedin || '';
}

function saveSocialLinks(e) {
  e.preventDefault();
  const s = adminData.settings;
  s.social = {
    facebook: document.getElementById('soc_facebook').value,
    instagram: document.getElementById('soc_instagram').value,
    twitter: document.getElementById('soc_twitter').value,
    linkedin: document.getElementById('soc_linkedin').value
  };
  localStorage.setItem('nobana_admin_settings', JSON.stringify(s));
  adminToast('Social links saved!');
}

/* Hero Images */
function renderHeroImageInputs() {
  const container = document.getElementById('heroImagesList');
  if (!container) return;
  const imgs = adminData.settings.hero?.images || ['', '', ''];
  heroImageCount = imgs.length;
  container.innerHTML = imgs.map((url, i) => `
    <div class="hero-img-row">
      <input type="url" class="hero-img-input" value="${url}" placeholder="https://images.unsplash.com/..." data-idx="${i}">
      <button onclick="removeHeroImage(this)"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
}

function addHeroImage() {
  const container = document.getElementById('heroImagesList');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'hero-img-row';
  row.innerHTML = `<input type="url" class="hero-img-input" value="" placeholder="https://images.unsplash.com/..."><button onclick="removeHeroImage(this)"><i class="fas fa-times"></i></button>`;
  container.appendChild(row);
  heroImageCount++;
}

function removeHeroImage(btn) {
  const row = btn.closest('.hero-img-row');
  if (row) { row.remove(); heroImageCount--; }
}

function saveHeroImages() {
  const inputs = document.querySelectorAll('.hero-img-input');
  const images = Array.from(inputs).map(inp => inp.value).filter(Boolean);
  if (!adminData.settings.hero) adminData.settings.hero = {};
  adminData.settings.hero.images = images;
  localStorage.setItem('nobana_admin_settings', JSON.stringify(adminData.settings));
  adminToast('Hero images saved!');
}

/* SEO */
function populateSeoForm() {
  const seo = adminData.settings.seo || {};
  document.getElementById('seo_title').value = seo.title || '';
  document.getElementById('seo_description').value = seo.description || '';
}

function saveSeo(e) {
  e.preventDefault();
  adminData.settings.seo = {
    title: document.getElementById('seo_title').value,
    description: document.getElementById('seo_description').value
  };
  localStorage.setItem('nobana_admin_settings', JSON.stringify(adminData.settings));
  adminToast('SEO settings saved!');
}

/* === EXPORT === */
function getCurrentProperties() {
  const stored = localStorage.getItem('nobana_admin_properties');
  if (stored) { try { return JSON.parse(stored); } catch {} }
  return adminData.properties;
}

function getCurrentSettings() {
  const stored = localStorage.getItem('nobana_admin_settings');
  if (stored) { try { return JSON.parse(stored); } catch {} }
  return adminData.settings;
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportProperties() {
  downloadJSON(getCurrentProperties(), 'properties.json');
  adminToast('properties.json downloaded. Replace data/properties.json with this file.');
}

function exportSettings() {
  downloadJSON(getCurrentSettings(), 'settings.json');
  adminToast('settings.json downloaded. Replace data/settings.json with this file.');
}

function exportAll() {
  exportProperties();
  setTimeout(() => exportSettings(), 500);
  adminToast('Exporting all data files...');
}

function resetToOriginal() {
  if (!confirm('Reset all changes to original data? This will reload from the server files.')) return;
  localStorage.removeItem('nobana_admin_properties');
  localStorage.removeItem('nobana_admin_settings');
  localStorage.removeItem('nobana_admin_agents');
  location.reload();
}