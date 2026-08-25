/**
 * SUMAK IT - Lógica Principal de la Tienda y Módulos Públicos (app.js)
 * Incluye: Slider de productos destacados, Catálogo, Filtros por categoría,
 * Módulo de Servicios, Módulo de Capacitaciones & Cursos, Módulo de Blog y visor modal.
 */

let currentSlideIndex = 0;
let sliderInterval = null;
let activeCategoryFilter = "all";
let currentSearchQuery = "";
let currentSortOption = "featured";

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  renderHeroSlider();
  renderCategoryFilterPills();
  renderProductsCatalog();
  renderServices();
  renderCourses();
  renderBlog();
  setupEventListeners();
  Auth.init();
  Cart.init();
}

/**
 * ========================================================
 * 1. HERO SLIDER DE PRODUCTOS DESTACADOS
 * ========================================================
 */
function renderHeroSlider() {
  const track = document.getElementById("hero-slider-track");
  const dotsContainer = document.getElementById("slider-dots-container");
  if (!track) return;

  const featuredProducts = ProductsManager.getFeatured();

  if (featuredProducts.length === 0) {
    track.innerHTML = `
      <div class="w-full h-full flex items-center justify-center p-8 text-center bg-slate-900 text-white">
        <div>
          <h2 class="text-2xl font-black">SUMAK IT</h2>
          <p class="text-xs text-slate-400 mt-1">Tu aliado tecnológico, pensando en ti.</p>
        </div>
      </div>
    `;
    return;
  }

  track.innerHTML = featuredProducts.map((p, idx) => `
    <div class="hero-slide absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}" data-slide-index="${idx}">
      
      <div class="w-full h-full bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col md:flex-row items-center justify-between p-6 sm:p-10 md:p-14 gap-8">
        
        <!-- Left: Text & CTA -->
        <div class="flex-1 space-y-3.5 sm:space-y-4 max-w-xl text-center md:text-left z-10">
          
          <div class="flex items-center justify-center md:justify-start gap-2 flex-wrap">
            <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.badgeColor || 'bg-blue-600'} text-white shadow-md">
              ${p.badge || 'Destacado'}
            </span>
            <span class="text-xs font-bold text-cyan-400">
              ⭐ ${p.rating || 5.0} (${p.reviewsCount || 1} reseñas)
            </span>
          </div>

          <h2 class="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight line-clamp-2">
            ${p.name}
          </h2>

          <p class="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
            ${p.shortDescription || 'Equipamiento de alto rendimiento con garantía directa en SUMAK IT Guaranda.'}
          </p>

          <div class="pt-2 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4">
            <div class="text-center sm:text-left">
              <span class="text-[11px] text-slate-400 block font-semibold">Precio Oficial:</span>
              <span class="text-2xl sm:text-3xl font-black text-cyan-400">$${p.price.toFixed(2)} USD</span>
            </div>

            <div class="flex gap-2 w-full sm:w-auto">
              <button onclick="openProductDetailModal('${p.id}')" class="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs transition shadow-lg flex items-center justify-center gap-1.5">
                <span>Ver Ficha Técnica</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
              <button onclick="Cart.add('${p.id}')" class="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                <span>Comprar</span>
              </button>
            </div>
          </div>

        </div>

        <!-- Right: Image with Glow -->
        <div class="w-full sm:w-80 md:w-96 aspect-[4/3] relative flex items-center justify-center">
          <div class="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl"></div>
          <img src="${(p.images && p.images.length > 0) ? p.images[0] : p.image}" alt="${p.name}" class="relative max-h-64 sm:max-h-80 w-auto object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105">
        </div>

      </div>

    </div>
  `).join("");

  if (dotsContainer) {
    dotsContainer.innerHTML = featuredProducts.map((_, idx) => `
      <button onclick="goToSlide(${idx})" class="w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === 0 ? 'w-8 bg-cyan-400' : 'bg-white/40 hover:bg-white/70'}" title="Slide ${idx + 1}"></button>
    `).join("");
  }

  startSliderAutoplay(featuredProducts.length);
}

function startSliderAutoplay(count) {
  if (sliderInterval) clearInterval(sliderInterval);
  if (count <= 1) return;

  sliderInterval = setInterval(() => {
    goToSlide((currentSlideIndex + 1) % count);
  }, 5500);
}

function goToSlide(index) {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll("#slider-dots-container button");
  if (slides.length === 0) return;

  slides.forEach((slide, idx) => {
    if (idx === index) {
      slide.classList.remove("opacity-0", "z-0", "pointer-events-none");
      slide.classList.add("opacity-100", "z-10");
    } else {
      slide.classList.remove("opacity-100", "z-10");
      slide.classList.add("opacity-0", "z-0", "pointer-events-none");
    }
  });

  dots.forEach((dot, idx) => {
    if (idx === index) {
      dot.className = "w-8 h-2.5 rounded-full bg-cyan-400 transition-all duration-300";
    } else {
      dot.className = "w-2.5 h-2.5 rounded-full bg-white/40 hover:bg-white/70 transition-all duration-300";
    }
  });

  currentSlideIndex = index;
}

/**
 * ========================================================
 * 2. CATÁLOGO DE PRODUCTOS, BÚSQUEDA Y FILTROS
 * ========================================================
 */
function renderCategoryFilterPills() {
  const container = document.getElementById("category-filter-strip");
  if (!container) return;

  const categories = CategoriesManager.getAll();

  let html = `
    <button onclick="setCategoryFilter('all')" class="category-pill flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition ${activeCategoryFilter === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
      ✨ Todos los Productos
    </button>
  `;

  categories.forEach(cat => {
    const isSelected = activeCategoryFilter === cat.slug;
    html += `
      <button onclick="setCategoryFilter('${cat.slug}')" class="category-pill flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
        <span>${cat.icon || '📦'}</span>
        <span>${cat.name}</span>
      </button>
    `;
  });

  container.innerHTML = html;
}

function setCategoryFilter(slug) {
  activeCategoryFilter = slug;
  renderCategoryFilterPills();
  renderProductsCatalog();
}

function renderProductsCatalog() {
  const grid = document.getElementById("products-grid");
  const countBadge = document.getElementById("products-count-badge");
  if (!grid) return;

  let products = ProductsManager.getAll();

  if (activeCategoryFilter !== "all") {
    products = products.filter(p => p.category === activeCategoryFilter);
  }

  if (currentSearchQuery.trim() !== "") {
    const q = currentSearchQuery.toLowerCase().trim();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
      p.categoryName.toLowerCase().includes(q) ||
      (p.specs && p.specs.some(s => s.toLowerCase().includes(q)))
    );
  }

  if (currentSortOption === "price-asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (currentSortOption === "price-desc") {
    products.sort((a, b) => b.price - a.price);
  } else if (currentSortOption === "name-asc") {
    products.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  if (countBadge) {
    countBadge.textContent = `${products.length} ${products.length === 1 ? 'artículo disponible' : 'artículos disponibles'}`;
  }

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center bg-slate-50 rounded-3xl border border-slate-200">
        <span class="text-4xl block mb-2">🔍</span>
        <h3 class="text-base font-bold text-slate-800">No encontramos productos con ese criterio</h3>
        <p class="text-xs text-slate-500 mt-1">Prueba con otra palabra clave o selecciona otra categoría.</p>
        <button onclick="clearSearch()" class="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs transition">
          Ver Todo el Catálogo
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(p => {
    const mainImg = (p.images && p.images.length > 0) ? p.images[0] : p.image;
    const photoCount = (p.images && p.images.length > 0) ? p.images.length : 1;

    return `
      <div class="tech-card bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
        
        <div>
          <!-- Image Box with Badges -->
          <div class="relative w-full aspect-[4/3] rounded-2xl bg-slate-50 p-3 flex items-center justify-center overflow-hidden border border-slate-100">
            <img src="${mainImg}" alt="${p.name}" class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105">
            
            <div class="absolute top-2.5 left-2.5 flex flex-col gap-1">
              ${p.badge ? `
                <span class="text-[10px] font-black px-2.5 py-0.5 rounded-full text-white ${p.badgeColor || 'bg-blue-600'} shadow-sm">
                  ${p.badge}
                </span>
              ` : ''}
              ${p.featured ? `
                <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-sm flex items-center gap-1">
                  ⭐ Top
                </span>
              ` : ''}
            </div>

            <div class="absolute top-2.5 right-2.5 flex items-center gap-1">
              ${photoCount > 1 ? `
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/70 text-white backdrop-blur-xs">
                  ${photoCount} 📷
                </span>
              ` : ''}
            </div>
          </div>

          <!-- Category & Rating -->
          <div class="flex items-center justify-between mt-3 text-[11px]">
            <span class="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">${p.categoryName}</span>
            <span class="text-amber-500 font-bold">★ ${p.rating || 5.0}</span>
          </div>

          <!-- Product Title -->
          <h3 class="text-sm font-black text-slate-900 mt-2 line-clamp-2 group-hover:text-blue-600 transition" title="${p.name}">
            ${p.name}
          </h3>

          <!-- Short Description -->
          <p class="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            ${p.shortDescription || 'Garantía oficial y soporte técnico en SUMAK IT.'}
          </p>
        </div>

        <!-- Footer / Price & Actions -->
        <div class="pt-4 mt-3 border-t border-slate-100 space-y-2.5">
          <div class="flex items-baseline justify-between">
            <div>
              <span class="text-[10px] text-slate-400 block font-semibold">Precio Oficial:</span>
              <span class="text-lg font-black text-slate-900">$${p.price.toFixed(2)}</span>
            </div>
            <span class="text-[10px] font-bold ${p.stockCount > 0 ? 'text-emerald-600' : 'text-rose-600'}">
              ${p.stockCount > 0 ? `Stock: ${p.stockCount} u.` : 'Agotado'}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button onclick="openProductDetailModal('${p.id}')" class="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1">
              <span>Detalles</span>
            </button>
            <button onclick="Cart.add('${p.id}')" class="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-md shadow-blue-600/20">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              <span>Añadir</span>
            </button>
          </div>
        </div>

      </div>
    `;
  }).join("");
}

function clearSearch() {
  currentSearchQuery = "";
  activeCategoryFilter = "all";
  const input1 = document.getElementById("global-search-input");
  const input2 = document.getElementById("mobile-search-input");
  if (input1) input1.value = "";
  if (input2) input2.value = "";
  renderCategoryFilterPills();
  renderProductsCatalog();
}

/**
 * ========================================================
 * 3. FICHA TÉCNICA DEL PRODUCTO (MULTI-FOTO MODAL)
 * ========================================================
 */
function openProductDetailModal(productId) {
  const p = ProductsManager.getById(productId);
  if (!p) return;

  const modal = document.getElementById("product-detail-modal");
  const mainImg = document.getElementById("detail-main-img");
  const thumbnailsStrip = document.getElementById("detail-thumbnails-strip");
  const nameEl = document.getElementById("detail-name");
  const catEl = document.getElementById("detail-category");
  const priceEl = document.getElementById("detail-price");
  const stockEl = document.getElementById("detail-stock");
  const shortDescEl = document.getElementById("detail-short-desc");
  const specsList = document.getElementById("detail-specs-list");
  const addCartBtn = document.getElementById("detail-add-cart-btn");
  const whatsappBtn = document.getElementById("detail-whatsapp-btn");

  const images = (p.images && p.images.length > 0) ? p.images : [p.image];

  if (mainImg) mainImg.src = images[0];
  if (nameEl) nameEl.textContent = p.name;
  if (catEl) catEl.textContent = p.categoryName;
  if (priceEl) priceEl.textContent = `$${p.price.toFixed(2)} USD`;
  if (stockEl) stockEl.textContent = `Stock Disponible: ${p.stockCount || 1} unidades en Guaranda`;
  if (shortDescEl) shortDescEl.textContent = p.shortDescription || "";

  if (thumbnailsStrip) {
    thumbnailsStrip.innerHTML = images.map((src, idx) => `
      <button type="button" onclick="setDetailMainImage('${src}', this)" class="w-16 h-16 rounded-xl overflow-hidden border-2 ${idx === 0 ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'} bg-white p-1 flex-shrink-0">
        <img src="${src}" class="w-full h-full object-contain">
      </button>
    `).join("");
  }

  if (specsList) {
    const specs = Array.isArray(p.specs) ? p.specs : (p.specs ? p.specs.split("\n") : []);
    if (specs.length > 0) {
      specsList.innerHTML = specs.map(s => `
        <li class="flex items-start gap-2">
          <span class="text-blue-600 font-bold">✓</span>
          <span>${s}</span>
        </li>
      `).join("");
    } else {
      specsList.innerHTML = `<li class="text-slate-400">Garantía de 1 año y soporte en SUMAK IT.</li>`;
    }
  }

  if (addCartBtn) {
    addCartBtn.onclick = () => {
      Cart.add(p.id);
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    };
  }

  if (whatsappBtn) {
    const msg = encodeURIComponent(`Hola SUMAK IT, me interesa obtener más información sobre el producto: ${p.name} ($${p.price.toFixed(2)} USD).`);
    whatsappBtn.href = `https://wa.me/593959736854?text=${msg}`;
  }

  modal?.classList.remove("hidden");
  modal?.classList.add("flex");
  document.body.classList.add("overflow-hidden");
}

function setDetailMainImage(src, btn) {
  const mainImg = document.getElementById("detail-main-img");
  if (mainImg) mainImg.src = src;

  const buttons = document.querySelectorAll("#detail-thumbnails-strip button");
  buttons.forEach(b => b.className = "w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200 bg-white p-1 flex-shrink-0");
  if (btn) btn.className = "w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-600 ring-2 ring-blue-100 bg-white p-1 flex-shrink-0";
}

/**
 * ========================================================
 * 4. MÓDULO DE SERVICIOS TECNOLÓGICOS
 * ========================================================
 */
function renderServices() {
  const container = document.getElementById("services-grid");
  if (!container) return;

  container.innerHTML = SERVICES_DATA.map(s => `
    <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group">
      
      <div class="space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
          ${s.icon === 'wrench' ? '🛠️' : s.icon === 'code' ? '💻' : '📡'}
        </div>
        <span class="text-[10px] font-black uppercase text-blue-600 tracking-wider block">${s.tag}</span>
        <h3 class="text-lg font-black text-slate-900">${s.title}</h3>
        <p class="text-xs text-slate-500 leading-relaxed">${s.description}</p>

        <ul class="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          ${s.features.map(f => `
            <li class="flex items-start gap-2">
              <span class="text-blue-600 font-bold">✓</span>
              <span>${f}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div class="pt-4 border-t border-slate-100">
        <a href="https://wa.me/593959736854?text=${encodeURIComponent(s.whatsappMsg)}" target="_blank" class="w-full py-3 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs transition flex items-center justify-center gap-2">
          <span>${s.ctaText}</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </a>
      </div>

    </div>
  `).join("");
}

/**
 * ========================================================
 * 5. MÓDULO DE CAPACITACIONES & CURSOS [NUEVO]
 * ========================================================
 */
function renderCourses() {
  const container = document.getElementById("courses-grid");
  if (!container) return;

  container.innerHTML = COURSES_DATA.map(c => `
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group">
      
      <div>
        <div class="relative w-full aspect-[16/10] overflow-hidden bg-slate-100">
          <img src="${c.image}" alt="${c.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
          <div class="absolute top-3 left-3">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white shadow-md">
              ${c.level}
            </span>
          </div>
          <div class="absolute bottom-3 right-3">
            <span class="px-3 py-1 rounded-xl text-xs font-black bg-slate-900/90 text-cyan-400 backdrop-blur-md">
              $${c.price.toFixed(2)} USD
            </span>
          </div>
        </div>

        <div class="p-6 space-y-3">
          <div class="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
            <span>⏱️ ${c.duration}</span>
            <span>•</span>
            <span>📍 ${c.modality}</span>
          </div>

          <h3 class="text-base font-black text-slate-900 group-hover:text-blue-600 transition leading-snug">
            ${c.title}
          </h3>

          <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            ${c.description}
          </p>

          <div class="pt-2 border-t border-slate-100 space-y-1.5">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Temario Principal:</span>
            <ul class="space-y-1 text-xs text-slate-600">
              ${c.topics.slice(0, 3).map(t => `
                <li class="flex items-start gap-1.5">
                  <span class="text-amber-500 font-bold">›</span>
                  <span class="truncate">${t}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>

      <div class="p-6 pt-0">
        <a href="https://wa.me/593959736854?text=${encodeURIComponent(c.whatsappMsg)}" target="_blank" class="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2">
          <span>Inscribirme / Consultar</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </a>
      </div>

    </div>
  `).join("");
}

/**
 * ========================================================
 * 6. MÓDULO DE BLOG DE TECNOLOGÍA [NUEVO]
 * ========================================================
 */
function renderBlog() {
  const container = document.getElementById("blog-grid");
  if (!container) return;

  container.innerHTML = BLOG_POSTS_DATA.map(post => `
    <article class="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group">
      
      <div>
        <div class="relative w-full aspect-[16/10] overflow-hidden bg-slate-100">
          <img src="${post.image}" alt="${post.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
          <div class="absolute top-3 left-3">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white shadow-md">
              ${post.category}
            </span>
          </div>
        </div>

        <div class="p-6 space-y-3">
          <div class="flex items-center gap-2 text-[11px] text-slate-400">
            <span>📅 ${post.date}</span>
            <span>•</span>
            <span>⏱️ ${post.readTime}</span>
          </div>

          <h3 class="text-base font-black text-slate-900 group-hover:text-blue-600 transition leading-snug">
            ${post.title}
          </h3>

          <p class="text-xs text-slate-500 line-clamp-3 leading-relaxed">
            ${post.summary}
          </p>
        </div>
      </div>

      <div class="p-6 pt-0">
        <button onclick="openBlogModal('${post.id}')" class="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5">
          <span>Leer Artículo Completo</span>
          <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

    </article>
  `).join("");
}

function openBlogModal(postId) {
  const post = BLOG_POSTS_DATA.find(p => p.id === postId);
  if (!post) return;

  const modal = document.getElementById("blog-modal");
  document.getElementById("blog-modal-cat").textContent = post.category;
  document.getElementById("blog-modal-date").textContent = `• ${post.date} (${post.readTime})`;
  document.getElementById("blog-modal-title").textContent = post.title;
  document.getElementById("blog-modal-img").src = post.image;
  document.getElementById("blog-modal-content").textContent = post.content;
  document.getElementById("blog-modal-author").textContent = post.author;

  modal?.classList.remove("hidden");
  modal?.classList.add("flex");
  document.body.classList.add("overflow-hidden");
}

/**
 * ========================================================
 * 7. EVENT LISTENERS & CONTACT FORM
 * ========================================================
 */
function setupEventListeners() {
  // Mobile Nav Toggle
  document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
    document.getElementById("mobile-nav")?.classList.toggle("hidden");
  });

  // Global Search Inputs
  const search1 = document.getElementById("global-search-input");
  const search2 = document.getElementById("mobile-search-input");
  const searchBtn = document.getElementById("search-btn");

  const executeSearch = (val) => {
    currentSearchQuery = val;
    renderProductsCatalog();
    const catSection = document.getElementById("catalogo");
    if (catSection && val.trim() !== "") {
      catSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  search1?.addEventListener("input", (e) => executeSearch(e.target.value));
  search2?.addEventListener("input", (e) => executeSearch(e.target.value));
  searchBtn?.addEventListener("click", () => {
    if (search1) executeSearch(search1.value);
  });

  // Sorting
  document.getElementById("sort-select")?.addEventListener("change", (e) => {
    currentSortOption = e.target.value;
    renderProductsCatalog();
  });

  // Hero Slider Prev / Next
  document.getElementById("slider-prev-btn")?.addEventListener("click", () => {
    const count = ProductsManager.getFeatured().length;
    goToSlide((currentSlideIndex - 1 + count) % count);
  });

  document.getElementById("slider-next-btn")?.addEventListener("click", () => {
    const count = ProductsManager.getFeatured().length;
    goToSlide((currentSlideIndex + 1) % count);
  });

  // Product detail modal close
  const detailModal = document.getElementById("product-detail-modal");
  document.getElementById("close-detail-modal-btn")?.addEventListener("click", () => {
    detailModal?.classList.add("hidden");
    detailModal?.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
  });
  document.getElementById("product-detail-backdrop")?.addEventListener("click", () => {
    detailModal?.classList.add("hidden");
    detailModal?.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
  });

  // Blog modal backdrop
  document.getElementById("blog-modal-backdrop")?.addEventListener("click", () => {
    document.getElementById("blog-modal")?.classList.add("hidden");
    document.getElementById("blog-modal")?.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
  });

  // Contact Form Submit -> WhatsApp / Notification
  document.getElementById("contact-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("contact-name").value;
    const phone = document.getElementById("contact-phone").value;
    const email = document.getElementById("contact-email").value;
    const subject = document.getElementById("contact-subject").value;
    const message = document.getElementById("contact-message").value;

    const fullMsg = `Hola SUMAK IT,\nMi nombre es: ${name}\nTeléfono: ${phone}\nCorreo: ${email}\nAsunto: ${subject}\n\nConsulta:\n${message}`;
    const waUrl = `https://wa.me/593959736854?text=${encodeURIComponent(fullMsg)}`;

    showToast("¡Mensaje generado! Abriendo WhatsApp de SUMAK IT...", "success");
    window.open(waUrl, "_blank");
    document.getElementById("contact-form").reset();
  });
}

/**
 * Toast Notifications
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all transform duration-300 translate-y-3 opacity-0 pointer-events-auto border backdrop-blur-md ${
    type === "success"
      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
      : type === "warning"
      ? "bg-amber-50 border-amber-300 text-amber-800"
      : type === "error"
      ? "bg-rose-50 border-rose-300 text-rose-800"
      : "bg-blue-50 border-blue-300 text-blue-800"
  }`;

  toast.innerHTML = `<span class="flex-1">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.classList.remove("translate-y-3", "opacity-0"), 10);
  setTimeout(() => {
    toast.classList.add("translate-y-3", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
