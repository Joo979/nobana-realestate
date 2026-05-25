let properties = [];
let settings = {};
let currentImageIndex = 0;
let propertyMap = null;
let currentPropertyImages = [];

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadProperties(), loadSettings()]);
  initNavbar();
  initScrollTop();
  initAnimations();
  initHeroSearch();

  const path = window.location.pathname;
  if (path.endsWith('index.html') || path.endsWith('/') || path === '' || path.endsWith('nobana-realestate\\') || path.endsWith('nobana-realestate/')) {
    renderSettings();
    renderFeatured();
    renderAgents();
    animateStats();
  } else if (path.includes('listings.html')) {
    renderListings();
    applyFilters();
  } else if (path.includes('property-detail.html')) {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    if (id) renderPropertyDetail(id);
  } else if (path.includes('contact.html')) {
    renderSettings();
    initContactMap();
    initContactForm();
  }
});

async function loadProperties() {
  try {
    const res = await fetch('data/properties.json');
    properties = await res.json();
  } catch {
    properties = [];
  }
}

async function loadSettings() {
  try {
    const res = await fetch('data/settings.json');
    settings = await res.json();
  } catch {
    settings = {};
  }
}

function renderSettings() {
  const s = settings.business;
  if (!s) return;

  const badge = document.getElementById('heroBadgeText');
  if (badge) badge.textContent = s.tagline || 'Premium Real Estate';

  const desc = document.getElementById('heroDescription');
  if (desc) desc.textContent = s.description || desc.textContent;

  const addr = document.getElementById('contactAddress');
  if (addr) addr.innerHTML = s.address + '<br>' + s.city;

  const phone = document.getElementById('contactPhone');
  if (phone) phone.innerHTML = s.phone + '<br>' + s.phone2;

  const email = document.getElementById('contactEmail');
  if (email) email.innerHTML = s.email + '<br>' + s.email2;

  const hours = document.getElementById('contactHours');
  if (hours) hours.innerHTML = (s.hours || '').replace(/\n/g, '<br>');

  const footerText = document.getElementById('footerAboutText');
  if (footerText) footerText.textContent = s.name + '. ' + (s.description || '').split('.')[0] + '.';

  const footerSocial = document.getElementById('footerSocial');
  if (footerSocial && settings.social) {
    const soc = settings.social;
    const icons = { facebook: 'fa-facebook-f', instagram: 'fa-instagram', twitter: 'fa-twitter', linkedin: 'fa-linkedin-in' };
    footerSocial.innerHTML = Object.entries(icons).map(([key, cls]) =>
      `<a href="${soc[key] || '#'}" aria-label="${key}" target="_blank" rel="noopener"><i class="fab ${cls}"></i></a>`
    ).join('');
  }

  const heroImgs = document.getElementById('heroImages');
  if (heroImgs && settings.hero && settings.hero.images) {
    heroImgs.innerHTML = settings.hero.images.map(img =>
      `<img src="${img}" alt="" loading="lazy" onerror="this.style.display='none'">`
    ).join('');
  }

  const featuresEl = document.getElementById('featuresContainer');
  if (featuresEl && settings.features) {
    featuresEl.innerHTML = settings.features.map(f =>
      `<div class="feature-card fade-in">
        <div class="feature-icon"><i class="fas ${f.icon}"></i></div>
        <h3>${f.title}</h3>
        <p>${f.text}</p>
      </div>`
    ).join('');
    initAnimations();
  }

  const testContainer = document.getElementById('testimonialsContainer');
  if (testContainer && settings.testimonials) {
    testContainer.innerHTML = settings.testimonials.map(t =>
      `<div class="testimonial-card fade-in">
        <div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
        <p>${t.text}</p>
        <div class="testimonial-author">
          <img src="${t.image}" alt="${t.name}" onerror="this.src='https://i.pravatar.cc/150?img=1'">
          <div>
            <h4>${t.name}</h4>
            <small>${t.role}</small>
          </div>
        </div>
      </div>`
    ).join('');
    initAnimations();
  }
}

/* ---- Navbar ---- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });
  }

  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }
}

/* ---- Scroll Top ---- */
function initScrollTop() {
  const btn = document.getElementById('scrollTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });
}

let animationObserver = null;

function initAnimations() {
  if (!animationObserver) {
    animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          animationObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  }
  document.querySelectorAll('.fade-in:not(.visible)').forEach(el => animationObserver.observe(el));
}

/* ---- Toast ---- */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;
  toast.className = `toast ${type}`;
  toastMsg.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ---- Currency Format ---- */
function formatPrice(price) {
  if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
  return `$${price.toLocaleString()}`;
}

/* ---- Property Card HTML ---- */
function propertyCardHTML(property) {
  const img = property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80';
  return `
    <div class="property-card fade-in" onclick="window.location.href='property-detail.html?id=${property.id}'">
      <div class="card-image">
        <img src="${img}" alt="${property.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'">
        <span class="card-status">${property.status || 'For Sale'}</span>
        <button class="card-favorite ${isFavorite(property.id) ? 'active' : ''}" onclick="event.stopPropagation();toggleFavorite(${property.id})">
          <i class="fa${isFavorite(property.id) ? 's' : 'r'} fa-heart"></i>
        </button>
      </div>
      <div class="card-body">
        <div class="card-price">${formatPrice(property.price)}</div>
        <div class="card-title">${property.title}</div>
        <div class="card-location"><i class="fas fa-map-marker-alt" style="color:var(--accent)"></i> ${property.location}</div>
        <div class="card-details">
          <span><i class="fas fa-bed"></i> ${property.beds} Beds</span>
          <span><i class="fas fa-bath"></i> ${property.baths} Baths</span>
          <span><i class="fas fa-vector-square"></i> ${property.sqft.toLocaleString()} sqft</span>
        </div>
        <div class="card-agent">
          <img src="${property.agentImage}" alt="${property.agent}" onerror="this.src='https://i.pravatar.cc/150?img=1'">
          <div class="card-agent-info">
            <small>Agent</small>
            <span>${property.agent}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ---- Featured Properties (Home) ---- */
function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const featured = properties.filter(p => p.featured);
  grid.innerHTML = featured.map(propertyCardHTML).join('');
  initAnimations();
}

/* ---- Agents (Home) ---- */
function renderAgents() {
  const grid = document.getElementById('agentGrid');
  if (!grid) return;
  const agentMap = {};
  properties.forEach(p => {
    if (!agentMap[p.agent]) {
      agentMap[p.agent] = { name: p.agent, title: p.agentTitle, phone: p.agentPhone, email: p.agentEmail, image: p.agentImage };
    }
  });
  const agents = Object.values(agentMap);
  grid.innerHTML = agents.map(a => `
    <div class="agent-card fade-in">
      <img src="${a.image}" alt="${a.name}" onerror="this.src='https://i.pravatar.cc/150?img=1'">
      <h4>${a.name}</h4>
      <div class="title">${a.title}</div>
      <p><i class="fas fa-envelope" style="color:var(--accent)"></i> ${a.email}</p>
      <div class="phone"><i class="fas fa-phone" style="color:var(--accent)"></i> ${a.phone}</div>
    </div>
  `).join('');
  initAnimations();
}

/* ---- Stats Counter (Home) ---- */
function animateStats() {
  const counters = [
    { el: document.getElementById('statProperties'), target: properties.length },
    { el: document.getElementById('statSold'), target: 124 },
    { el: document.getElementById('statClients'), target: 580 }
  ];

  counters.forEach(({ el, target }) => {
    if (!el) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        el.textContent = target;
        clearInterval(timer);
      } else {
        el.textContent = Math.round(current);
      }
    }, duration / steps);
  });
}

/* ---- Hero Quick Search ---- */
function initHeroSearch() {
  const inputs = ['heroSearchLocation', 'heroSearchType', 'heroSearchPrice'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') quickSearch(); });
  });
}

function quickSearch() {
  const location = document.getElementById('heroSearchLocation')?.value || '';
  const type = document.getElementById('heroSearchType')?.value || '';
  const maxPrice = document.getElementById('heroSearchPrice')?.value || '';

  const params = new URLSearchParams();
  if (location) params.set('search', location);
  if (type) params.set('type', type);
  if (maxPrice) params.set('maxPrice', maxPrice);

  window.location.href = `listings.html?${params.toString()}`;
}

/* ---- Listings Page ---- */
function renderListings(filtered) {
  const grid = document.getElementById('listingsGrid');
  const count = document.getElementById('resultCount');
  const empty = document.getElementById('emptyState');
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const urlSearch = params.get('search') || '';
  const urlType = params.get('type') || '';

  if (urlSearch && document.getElementById('filterSearch')) document.getElementById('filterSearch').value = urlSearch;
  if (urlType && document.getElementById('filterType')) document.getElementById('filterType').value = urlType;

  if (!filtered) filtered = properties;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (count) count.textContent = '0';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (count) count.textContent = filtered.length;
  grid.innerHTML = filtered.map(propertyCardHTML).join('');
  initAnimations();
}

function applyFilters() {
  const search = (document.getElementById('filterSearch')?.value || '').toLowerCase();
  const type = document.getElementById('filterType')?.value || '';
  const minPrice = parseFloat(document.getElementById('filterMinPrice')?.value) || 0;
  const maxPrice = parseFloat(document.getElementById('filterMaxPrice')?.value) || Infinity;
  const minBeds = parseInt(document.getElementById('filterBeds')?.value) || 0;
  const minBaths = parseInt(document.getElementById('filterBaths')?.value) || 0;
  const sort = document.getElementById('filterSort')?.value || 'featured';

  let filtered = properties.filter(p => {
    if (search && !p.title.toLowerCase().includes(search) && !p.location.toLowerCase().includes(search)) return false;
    if (type && p.type !== type) return false;
    if (minPrice && p.price < minPrice) return false;
    if (maxPrice !== Infinity && p.price > maxPrice) return false;
    if (minBeds && p.beds < minBeds) return false;
    if (minBaths && p.baths < minBaths) return false;
    return true;
  });

  switch (sort) {
    case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
    case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
    case 'beds-desc': filtered.sort((a, b) => b.beds - a.beds); break;
    default: filtered.sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
  }

  renderListings(filtered);
}

function resetFilters() {
  ['filterSearch', 'filterType', 'filterMinPrice', 'filterMaxPrice', 'filterBeds', 'filterBaths'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  applyFilters();
}

/* ---- Property Detail Page ---- */
function renderPropertyDetail(id) {
  const property = properties.find(p => p.id === id);
  if (!property) {
    document.getElementById('propertyContent').innerHTML = '<div class="empty-state"><div class="icon"><i class="fas fa-exclamation-triangle"></i></div><h3>Property not found</h3><p>This property may have been removed.</p><a href="listings.html" class="btn btn-outline" style="margin-top:16px;display:inline-flex">View All Listings</a></div>';
    return;
  }

  document.title = `${property.title} - Nobana Real Estate`;
  currentImageIndex = 0;
  const content = document.getElementById('propertyContent');

  const imgs = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'];

  const thumbsHTML = imgs.map((img, i) =>
    `<div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="setGalleryImage(${i})">
      <img src="${img}" alt="" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'">
    </div>`
  ).join('');

  content.innerHTML = `
    <div class="property-gallery">
      <div class="gallery-main">
        <button class="gallery-nav gallery-prev" onclick="changeImage(-1)"><i class="fas fa-chevron-left"></i></button>
        <img id="galleryMain" src="${imgs[0]}" alt="${property.title}" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'">
        <button class="gallery-nav gallery-next" onclick="changeImage(1)"><i class="fas fa-chevron-right"></i></button>
      </div>
      <div class="gallery-thumbs" id="galleryThumbs">${thumbsHTML}</div>
    </div>
    <div class="property-layout">
      <div class="property-info">
        <h1>${property.title}</h1>
        <div class="card-location"><i class="fas fa-map-marker-alt" style="color:var(--accent)"></i> ${property.location}</div>
        <div class="property-meta">
          <div class="property-meta-item">
            <div class="value">${property.beds}</div>
            <div class="label">Bedrooms</div>
          </div>
          <div class="property-meta-item">
            <div class="value">${property.baths}</div>
            <div class="label">Bathrooms</div>
          </div>
          <div class="property-meta-item">
            <div class="value">${property.sqft.toLocaleString()}</div>
            <div class="label">Sq Ft</div>
          </div>
          <div class="property-meta-item">
            <div class="value">${property.yearBuilt}</div>
            <div class="label">Year Built</div>
          </div>
        </div>
        <div class="property-description">
          <h2>About This Property</h2>
          <p>${property.description}</p>
        </div>
        <div class="property-features">
          <h2>Amenities & Features</h2>
          <div class="feature-tags">
            ${property.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="property-sidebar">
        <div class="sidebar-card">
          <div class="price">${formatPrice(property.price)}</div>
          <div class="sidebar-agent">
            <img src="${property.agentImage}" alt="${property.agent}" onerror="this.src='https://i.pravatar.cc/150?img=1'">
            <h4>${property.agent}</h4>
            <div class="title">${property.agentTitle}</div>
            <div class="contact-item"><i class="fas fa-phone" style="color:var(--accent)"></i> ${property.agentPhone}</div>
            <div class="contact-item"><i class="fas fa-envelope" style="color:var(--accent)"></i> ${property.agentEmail}</div>
          </div>
        </div>
        <div class="sidebar-card">
          <h4 style="margin-bottom:16px;">Schedule a Viewing</h4>
          <div class="inquiry-form">
            <input type="text" id="inquiryName" placeholder="Your Name" required>
            <input type="email" id="inquiryEmail" placeholder="Your Email" required>
            <input type="tel" id="inquiryPhone" placeholder="Your Phone">
            <textarea id="inquiryMessage" placeholder="I'd like to schedule a viewing for this property...">I'm interested in ${property.title} (${formatPrice(property.price)})</textarea>
            <button class="btn btn-primary" onclick="submitInquiry(${property.id})"><i class="fas fa-paper-plane"></i> Send Inquiry</button>
          </div>
        </div>
      </div>
    </div>
    <div class="property-map">
      <h2>Location</h2>
      <div id="map"></div>
    </div>
  `;

  currentPropertyImages = imgs;
  setTimeout(() => initPropertyMap(property.lat, property.lng, property.title), 300);
}

function setGalleryImage(index) {
  const main = document.getElementById('galleryMain');
  const thumbs = document.querySelectorAll('.gallery-thumb');
  if (!main || !thumbs.length || !currentPropertyImages.length) return;
  if (index < 0 || index >= currentPropertyImages.length) return;
  currentImageIndex = index;
  main.src = currentPropertyImages[index];
  thumbs.forEach((t, i) => t.classList.toggle('active', i === index));
}

function changeImage(delta) {
  if (!currentPropertyImages.length) return;
  let newIndex = currentImageIndex + delta;
  if (newIndex < 0) newIndex = currentPropertyImages.length - 1;
  if (newIndex >= currentPropertyImages.length) newIndex = 0;
  setGalleryImage(newIndex);
}

/* ---- Map ---- */
function initPropertyMap(lat, lng, title) {
  const mapEl = document.getElementById('map');
  if (!mapEl || typeof L === 'undefined') return;
  if (propertyMap) propertyMap.remove();

  propertyMap = L.map('map', { zoomControl: false }).setView([lat, lng], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(propertyMap);
  L.control.zoom({ position: 'bottomright' }).addTo(propertyMap);

  const icon = L.divIcon({
    html: '<div style="background:var(--accent);width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
    iconSize: [16, 16],
    className: ''
  });
  L.marker([lat, lng], { icon }).addTo(propertyMap).bindPopup(`<b>${title}</b>`);
}

function initContactMap() {
  const mapEl = document.getElementById('contactMap');
  if (!mapEl || typeof L === 'undefined') return;
  const lat = parseFloat(mapEl.dataset.lat) || (settings.coordinates ? settings.coordinates.lat : 25.7743);
  const lng = parseFloat(mapEl.dataset.lng) || (settings.coordinates ? settings.coordinates.lng : -80.1937);
  const biz = settings.business || {};
  const addr = biz.address ? biz.address + ', ' + biz.city : '123 Ocean Drive, Suite 200, Nobana';

  propertyMap = L.map('contactMap', { zoomControl: false }).setView([lat, lng], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(propertyMap);
  L.control.zoom({ position: 'bottomright' }).addTo(propertyMap);

  const icon = L.divIcon({
    html: '<div style="background:var(--accent);width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
    iconSize: [20, 20],
    className: ''
  });
  L.marker([lat, lng], { icon }).addTo(propertyMap).bindPopup(`<b>${biz.name || 'Nobana Real Estate'}</b><br>${addr}`);
}

/* ---- Favorites (localStorage) ---- */
function getFavorites() {
  try { return JSON.parse(localStorage.getItem('nobana_favorites')) || []; } catch { return []; }
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function toggleFavorite(id) {
  let favs = getFavorites();
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }
  localStorage.setItem('nobana_favorites', JSON.stringify(favs));
  const hearts = document.querySelectorAll(`.card-favorite[onclick*="${id}"] i`);
  hearts.forEach(icon => {
    icon.className = favs.includes(id) ? 'fas fa-heart' : 'far fa-heart';
  });
  const btns = document.querySelectorAll(`.card-favorite[onclick*="${id}"]`);
  btns.forEach(btn => btn.classList.toggle('active', favs.includes(id)));
  showToast(favs.includes(id) ? 'Added to favorites' : 'Removed from favorites');
}

/* ---- Contact Form ---- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const fields = [
      { id: 'formName', validate: (v) => v.trim().length >= 2 },
      { id: 'formEmail', validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
      { id: 'formSubject', validate: (v) => v !== '' },
      { id: 'formMessage', validate: (v) => v.trim().length >= 10 }
    ];

    fields.forEach(({ id, validate }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const group = el.closest('.form-group');
      if (!validate(el.value)) {
        group.classList.add('error');
        valid = false;
      } else {
        group.classList.remove('error');
      }
    });

    if (valid) {
      showToast('Message sent successfully! We\'ll be in touch within 24 hours.', 'success');
      form.reset();
    } else {
      showToast('Please fill in all required fields correctly.', 'error');
    }
  });
}

function submitInquiry(propertyId) {
  const name = document.getElementById('inquiryName')?.value;
  const email = document.getElementById('inquiryEmail')?.value;
  const message = document.getElementById('inquiryMessage')?.value;

  if (!name || !email) {
    showToast('Please fill in your name and email.', 'error');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }

  showToast('Inquiry sent! The agent will contact you shortly.', 'success');
  if (document.getElementById('inquiryName')) {
    document.getElementById('inquiryName').value = '';
    document.getElementById('inquiryEmail').value = '';
    document.getElementById('inquiryPhone').value = '';
    document.getElementById('inquiryMessage').value = '';
  }
}

/* ---- Newsletter ---- */
function subscribeNewsletter() {
  const email = document.getElementById('newsletterEmail')?.value;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }
  showToast('Subscribed to newsletter successfully!', 'success');
  document.getElementById('newsletterEmail').value = '';
}