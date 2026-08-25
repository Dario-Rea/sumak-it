/**
 * SUMAK IT - Lógica del Panel de Administración y Control Central (admin.js)
 * "Tu aliado tecnológico, pensando en ti."
 * Incluye: Dashboard, Inventario (Excel .xlsx), Pedidos & Facturación,
 * Ventas & Reportes, Clientes, Usuarios & Roles, Cupones y Base de Datos PostgreSQL.
 */

let editingProductId = null;
let currentUploadedImages = [];
let activeAdminTab = "dashboard";

document.addEventListener("DOMContentLoaded", () => {
  checkAdminAuth();
  setupAdminAuthEvents();
});

function checkAdminAuth() {
  const loginView = document.getElementById("admin-login-view");
  const dashboardView = document.getElementById("admin-dashboard-view");

  if (AdminAuth.isAuthenticated()) {
    loginView?.classList.add("hidden");
    dashboardView?.classList.remove("hidden");
    
    const userTag = document.getElementById("admin-current-user-tag");
    if (userTag) userTag.textContent = AdminAuth.getCurrentAdminUser();

    initAdminDashboard();
  } else {
    loginView?.classList.remove("hidden");
    dashboardView?.classList.add("hidden");
  }
}

function setupAdminAuthEvents() {
  // Login Form
  document.getElementById("admin-login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = document.getElementById("admin-user").value;
    const pass = document.getElementById("admin-pass").value;

    const res = AdminAuth.login(user, pass);
    if (res.success) {
      showToast(`¡Bienvenido a SUMAK IT, ${res.admin.name || res.admin.username}!`, "success");
      document.getElementById("admin-login-form").reset();
      checkAdminAuth();
    } else {
      showToast(res.message, "error");
    }
  });

  // Toggle Password Visibility
  document.getElementById("toggle-admin-pass-btn")?.addEventListener("click", () => {
    const input = document.getElementById("admin-pass");
    if (input) {
      input.type = input.type === "password" ? "text" : "password";
    }
  });

  // Autofill Default Super Admin
  document.getElementById("btn-autofill-admin")?.addEventListener("click", () => {
    const userInput = document.getElementById("admin-user");
    const passInput = document.getElementById("admin-pass");
    if (userInput) userInput.value = "admin";
    if (passInput) passInput.value = "123456";
    showToast("Datos de Super Admin (admin / 123456) colocados.", "info");
  });

  // Admin Password Recovery Modal
  const recModal = document.getElementById("admin-recovery-modal");
  document.getElementById("btn-open-admin-recovery")?.addEventListener("click", () => {
    recModal?.classList.remove("hidden");
    recModal?.classList.add("flex");
  });
  const closeRecModal = () => {
    recModal?.classList.add("hidden");
    recModal?.classList.remove("flex");
  };
  document.getElementById("close-admin-recovery-btn")?.addEventListener("click", closeRecModal);
  document.getElementById("btn-cancel-admin-recovery")?.addEventListener("click", closeRecModal);
  document.getElementById("admin-recovery-backdrop")?.addEventListener("click", closeRecModal);

  // Recovery Form Submit
  document.getElementById("admin-recovery-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const u = document.getElementById("rec-admin-user").value;
    const em = document.getElementById("rec-admin-email").value;
    const np = document.getElementById("rec-admin-new-pass").value;
    const cp = document.getElementById("rec-admin-conf-pass").value;

    if (np !== cp) {
      showToast("Las contraseñas no coinciden.", "warning");
      return;
    }

    const res = AdminAuth.recoverPassword(u, em, np);
    if (res.success) {
      showToast(res.message, "success");
      document.getElementById("admin-recovery-form").reset();
      closeRecModal();

      const userInput = document.getElementById("admin-user");
      const passInput = document.getElementById("admin-pass");
      if (userInput) userInput.value = u;
      if (passInput) passInput.value = np;
    } else {
      showToast(res.message, "error");
    }
  });

  // Logout
  document.getElementById("admin-logout-btn")?.addEventListener("click", () => {
    AdminAuth.logout();
    const userInput = document.getElementById("admin-user");
    const passInput = document.getElementById("admin-pass");
    if (userInput) userInput.value = "";
    if (passInput) passInput.value = "";
    checkAdminAuth();
    showToast("Sesión cerrada correctamente", "info");
  });

  // Modal: Change my password
  document.getElementById("open-change-pass-btn")?.addEventListener("click", () => {
    document.getElementById("admin-change-pass-modal")?.classList.remove("hidden");
    document.getElementById("admin-change-pass-modal")?.classList.add("flex");
  });
  document.getElementById("close-change-pass-btn")?.addEventListener("click", () => {
    document.getElementById("admin-change-pass-modal")?.classList.add("hidden");
    document.getElementById("admin-change-pass-modal")?.classList.remove("flex");
  });

  document.getElementById("admin-change-pass-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const cur = document.getElementById("admin-cur-pass").value;
    const nPass = document.getElementById("admin-new-pass").value;
    const conf = document.getElementById("admin-conf-pass").value;

    if (nPass !== conf) {
      showToast("Las nuevas contraseñas no coinciden.", "warning");
      return;
    }

    const res = AdminAuth.changePassword(cur, nPass);
    if (res.success) {
      showToast(res.message, "success");
      document.getElementById("admin-change-pass-form").reset();
      document.getElementById("admin-change-pass-modal")?.classList.add("hidden");
      document.getElementById("admin-change-pass-modal")?.classList.remove("flex");
    } else {
      showToast(res.message, "error");
    }
  });

  // Modal: Target admin password
  document.getElementById("close-change-user-pass-btn")?.addEventListener("click", closeTargetAdminPassModal);
  document.getElementById("btn-cancel-target-admin-pass")?.addEventListener("click", closeTargetAdminPassModal);

  document.getElementById("admin-change-user-pass-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const targetUser = document.getElementById("target-admin-username").value;
    const nPass = document.getElementById("target-admin-new-pass").value;
    const conf = document.getElementById("target-admin-conf-pass").value;

    if (nPass !== conf) {
      showToast("Las nuevas contraseñas no coinciden.", "warning");
      return;
    }

    const res = AdminAuth.updateAdminPassword(targetUser, nPass);
    if (res.success) {
      showToast(res.message, "success");
      document.getElementById("admin-change-user-pass-form").reset();
      closeTargetAdminPassModal();
    } else {
      showToast(res.message, "error");
    }
  });

  // Edit Admin form
  document.getElementById("edit-admin-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("edit-adm-username").value;
    const name = document.getElementById("edit-adm-name").value;
    const role = document.getElementById("edit-adm-role").value;
    const statusVal = document.getElementById("edit-adm-status").value;

    const res = AdminAuth.updateAdmin(username, {
      name: name,
      role: role,
      active: statusVal === "active"
    });

    if (res.success) {
      showToast(res.message, "success");
      closeEditAdminModal();
      renderAdminsList();
      updateStats();
    } else {
      showToast(res.message, "warning");
    }
  });

  // Edit Client form
  document.getElementById("edit-client-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const userId = document.getElementById("edit-client-id").value;
    const name = document.getElementById("edit-client-name").value;
    const email = document.getElementById("edit-client-email").value;
    const phone = document.getElementById("edit-client-phone").value;
    const province = document.getElementById("edit-client-province").value;
    const city = document.getElementById("edit-client-city").value;
    const address = document.getElementById("edit-client-address").value;
    const statusVal = document.getElementById("edit-client-status").value;

    const res = Auth.updateUser(userId, {
      name,
      email,
      phone,
      province,
      city,
      address,
      active: statusVal === "active"
    });

    if (res.success) {
      showToast(res.message, "success");
      closeEditClientModal();
      renderClientsList();
      updateStats();
    } else {
      showToast(res.message, "warning");
    }
  });
}

function openTargetAdminPassModal(username) {
  const modal = document.getElementById("admin-change-user-pass-modal");
  const display = document.getElementById("target-admin-display");
  const input = document.getElementById("target-admin-username");

  if (!modal) return;
  if (display) display.textContent = `@${username}`;
  if (input) input.value = username;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeTargetAdminPassModal() {
  const modal = document.getElementById("admin-change-user-pass-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function openEditAdminModal(username) {
  const modal = document.getElementById("admin-edit-admin-modal");
  if (!modal) return;

  const admins = AdminAuth.getAllAdmins();
  const adm = admins.find(a => a.username.toLowerCase() === username.toLowerCase());
  if (!adm) return;

  document.getElementById("edit-adm-username").value = adm.username;
  document.getElementById("edit-adm-user-display").value = `@${adm.username}`;
  document.getElementById("edit-adm-name").value = adm.name || adm.username;
  document.getElementById("edit-adm-role").value = adm.role || "Administrador";
  document.getElementById("edit-adm-status").value = adm.active !== false ? "active" : "inactive";

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeEditAdminModal() {
  const modal = document.getElementById("admin-edit-admin-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function openEditClientModal(userId) {
  const modal = document.getElementById("admin-edit-client-modal");
  if (!modal) return;

  const clients = Auth.getRegisteredUsers();
  const client = clients.find(c => c.id === userId);
  if (!client) return;

  document.getElementById("edit-client-id").value = client.id;
  document.getElementById("edit-client-name").value = client.name || "";
  document.getElementById("edit-client-email").value = client.email || "";
  document.getElementById("edit-client-phone").value = client.phone || "";
  if (client.province) document.getElementById("edit-client-province").value = client.province;
  document.getElementById("edit-client-city").value = client.city || "Guaranda";
  document.getElementById("edit-client-address").value = client.address || "";
  document.getElementById("edit-client-status").value = client.active !== false ? "active" : "inactive";

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeEditClientModal() {
  const modal = document.getElementById("admin-edit-client-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function initAdminDashboard() {
  populateCategorySelects();
  renderDashboardView();
  renderInventoryList();
  renderInventoryTable();
  renderCategoriesList();
  renderCouponsList();
  renderOrdersList();
  renderSalesReports();
  renderUsersManagement();
  renderDatabaseMetrics();
  updateStats();
  setupDashboardEvents();
  setupClipboardPaste();
  updatePricingCalculation();
}

function switchAdminTab(tab) {
  activeAdminTab = tab;

  const tabDashboard = document.getElementById("tab-view-dashboard");
  const tabProducts = document.getElementById("tab-view-products");
  const tabCategories = document.getElementById("tab-view-categories");
  const tabInventory = document.getElementById("tab-view-inventory");
  const tabOrders = document.getElementById("tab-view-orders");
  const tabSales = document.getElementById("tab-view-sales");
  const tabUsers = document.getElementById("tab-view-users");
  const tabCoupons = document.getElementById("tab-view-coupons");
  const tabDatabase = document.getElementById("tab-view-database");

  const btnDashboard = document.getElementById("nav-tab-dashboard");
  const btnProducts = document.getElementById("nav-tab-products");
  const btnCategories = document.getElementById("nav-tab-categories");
  const btnInventory = document.getElementById("nav-tab-inventory");
  const btnOrders = document.getElementById("nav-tab-orders");
  const btnSales = document.getElementById("nav-tab-sales");
  const btnUsers = document.getElementById("nav-tab-users");
  const btnCoupons = document.getElementById("nav-tab-coupons");
  const btnDatabase = document.getElementById("nav-tab-database");

  const allTabs = [tabDashboard, tabProducts, tabCategories, tabInventory, tabOrders, tabSales, tabUsers, tabCoupons, tabDatabase];
  const allBtns = [btnDashboard, btnProducts, btnCategories, btnInventory, btnOrders, btnSales, btnUsers, btnCoupons, btnDatabase];

  allTabs.forEach(t => t?.classList.add("hidden"));
  allBtns.forEach(b => {
    b?.classList.remove("bg-blue-600", "text-white", "shadow-md");
    b?.classList.add("text-slate-600", "hover:bg-slate-100");
  });

  const tabMap = {
    dashboard: { view: tabDashboard, btn: btnDashboard, fn: renderDashboardView },
    products: { view: tabProducts, btn: btnProducts, fn: renderInventoryList },
    categories: { view: tabCategories, btn: btnCategories, fn: renderCategoriesList },
    inventory: { view: tabInventory, btn: btnInventory, fn: renderInventoryTable },
    orders: { view: tabOrders, btn: btnOrders, fn: renderOrdersList },
    sales: { view: tabSales, btn: btnSales, fn: renderSalesReports },
    users: { view: tabUsers, btn: btnUsers, fn: renderUsersManagement },
    coupons: { view: tabCoupons, btn: btnCoupons, fn: renderCouponsList },
    database: { view: tabDatabase, btn: btnDatabase, fn: renderDatabaseMetrics }
  };

  const selected = tabMap[tab] || tabMap.dashboard;
  selected.view?.classList.remove("hidden");
  selected.btn?.classList.add("bg-blue-600", "text-white", "shadow-md");
  selected.btn?.classList.remove("text-slate-600", "hover:bg-slate-100");
  if (selected.fn) selected.fn();

  updateStats();
}

function updateStats() {
  const products = ProductsManager.getAll();
  const orders = OrdersManager.getAll();
  const categories = CategoriesManager.getAll();
  const clients = Auth.getRegisteredUsers();

  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.totals.total || 0), 0);

  document.getElementById("stat-total-products").textContent = products.length;
  document.getElementById("stat-total-orders").textContent = orders.length;
  document.getElementById("stat-total-categories").textContent = categories.length;
  document.getElementById("stat-total-revenue").textContent = `$${totalRevenue.toFixed(2)}`;
  const userStat = document.getElementById("stat-total-users");
  if (userStat) userStat.textContent = clients.length;
}

function renderDashboardView() {
  const orders = OrdersManager.getAll();
  const products = ProductsManager.getAll();

  const recentOrdersContainer = document.getElementById("dashboard-recent-orders");
  if (recentOrdersContainer) {
    if (orders.length === 0) {
      recentOrdersContainer.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">No hay pedidos registrados.</p>`;
    } else {
      recentOrdersContainer.innerHTML = orders.slice(0, 4).map(o => `
        <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span class="font-mono font-bold text-blue-600">${o.orderId}</span>
            <span class="text-slate-700 font-bold block">${o.customer.name}</span>
            <span class="text-[10px] text-slate-400">${o.date} • ${o.items.length} ítems</span>
          </div>
          <div class="text-right">
            <span class="font-black text-slate-900 block">$${o.totals.total} USD</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
              o.status === 'Entregado' ? 'bg-emerald-100 text-emerald-800' :
              o.status === 'Enviado' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
            }">${o.status}</span>
          </div>
        </div>
      `).join("");
    }
  }

  const stockAlertsContainer = document.getElementById("dashboard-stock-alerts");
  if (stockAlertsContainer) {
    const lowStock = products.filter(p => (p.stockCount || 0) <= 4);
    if (lowStock.length === 0) {
      stockAlertsContainer.innerHTML = `<p class="text-xs text-emerald-600 font-bold py-2">✓ Todos los artículos tienen stock saludable.</p>`;
    } else {
      stockAlertsContainer.innerHTML = lowStock.map(p => `
        <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex justify-between items-center">
          <span class="truncate max-w-[160px] font-semibold text-amber-900">${p.name}</span>
          <span class="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">Stock: ${p.stockCount} u.</span>
        </div>
      `).join("");
    }
  }
}

function populateCategorySelects() {
  const categories = CategoriesManager.getAll();
  const selectForm = document.getElementById("p-category");
  const selectFilter = document.getElementById("admin-filter-category");

  if (selectForm) {
    selectForm.innerHTML = categories.map(c => `
      <option value="${c.slug}">${c.icon || '📦'} ${c.name}</option>
    `).join("");
  }

  if (selectFilter) {
    selectFilter.innerHTML = `
      <option value="all">Todas las Categorías</option>
      ${categories.map(c => `
        <option value="${c.slug}">${c.icon || '📦'} ${c.name}</option>
      `).join("")}
    `;
  }
}

/**
 * ========================================================
 * MOTOR DE CÁLCULO DE PRECIOS AUTOMÁTICO
 * Fórmula: Distribuidor + IVA (15%) + $5 Envío + Ganancia = Precio Total
 * ========================================================
 */
function updatePricingCalculation() {
  const distInput = document.getElementById("p-distributor-price");
  const profitInput = document.getElementById("p-profit-margin");
  if (!distInput || !profitInput) return;

  const distVal = parseFloat(distInput.value) || 0;
  const profitVal = parseFloat(profitInput.value) || 0;

  const calc = ProductsManager.calculateFinalPrice(distVal, profitVal);

  document.getElementById("calc-iva-val").textContent = `$${calc.iva15.toFixed(2)} USD`;
  document.getElementById("calc-profit-val").textContent = `$${calc.profitMargin.toFixed(2)} USD`;
  document.getElementById("calc-total-final").textContent = `$${calc.totalPrice.toFixed(2)} USD`;
  document.getElementById("p-price").value = calc.totalPrice;
}

/**
 * ========================================================
 * 1. GESTIÓN DE PRODUCTOS, MULTI-FOTO & CTRL+V PASTE
 * ========================================================
 */
function setupClipboardPaste() {
  const dropZone = document.getElementById("image-drop-paste-zone");
  const fileInput = document.getElementById("p-images-file");

  dropZone?.addEventListener("click", () => fileInput?.click());

  window.addEventListener("paste", (e) => {
    if (activeAdminTab !== "products") return;

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
      const item = items[index];
      if (item.kind === "file" && item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          currentUploadedImages.push(event.target.result);
          updateUploadedPhotosPreview();
          showToast("¡Imagen pegada desde el portapapeles (Ctrl+V)!", "success");
        };
        reader.readAsDataURL(blob);
      }
    }
  });

  dropZone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone?.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });
  dropZone?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        currentUploadedImages.push(event.target.result);
        updateUploadedPhotosPreview();
      };
      reader.readAsDataURL(file);
    });
    if (files.length > 0) showToast(`${files.length} imagen(es) soltada(s)`, "success");
  });
}

function updateUploadedPhotosPreview() {
  const container = document.getElementById("uploaded-photos-preview");
  if (!container) return;

  if (currentUploadedImages.length === 0) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }

  container.classList.remove("hidden");
  container.innerHTML = currentUploadedImages.map((src, idx) => `
    <div class="relative w-16 h-16 rounded-xl overflow-hidden border-2 ${idx === 0 ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'} bg-white p-1 flex-shrink-0">
      <img src="${src}" class="w-full h-full object-contain">
      <button type="button" onclick="removeUploadedPhoto(${idx})" class="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold" title="Eliminar foto">×</button>
      ${idx === 0 ? `<span class="absolute bottom-0 inset-x-0 bg-blue-600 text-white text-[8px] font-bold text-center">Principal</span>` : ''}
    </div>
  `).join("");
}

function removeUploadedPhoto(index) {
  currentUploadedImages.splice(index, 1);
  updateUploadedPhotosPreview();
}

function renderInventoryList(filterQuery = "", categoryFilter = "all") {
  const container = document.getElementById("admin-products-list");
  if (!container) return;

  let products = ProductsManager.getAll();

  if (categoryFilter !== "all") {
    products = products.filter(p => p.category === categoryFilter);
  }

  if (filterQuery.trim() !== "") {
    const q = filterQuery.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
      p.categoryName.toLowerCase().includes(q)
    );
  }

  if (products.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
        <p class="text-sm font-semibold text-slate-500">No se encontraron artículos.</p>
      </div>
    `;
    return;
  }

  let html = "";
  products.forEach(p => {
    const mainImg = (p.images && p.images.length > 0) ? p.images[0] : p.image;
    const photoCount = (p.images && p.images.length > 0) ? p.images.length : 1;

    html += `
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:border-blue-300">
        
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
            <img src="${mainImg}" alt="${p.name}" class="w-full h-full object-contain">
            ${photoCount > 1 ? `<span class="absolute bottom-0.5 right-0.5 bg-slate-900/80 text-white text-[9px] font-bold px-1 rounded">${photoCount}📷</span>` : ''}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                ${p.categoryName}
              </span>
              ${p.featured ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">⭐ Slider</span>` : ''}
              <span class="text-[11px] font-semibold text-emerald-600">Stock: ${p.stockCount || 1} u.</span>
            </div>
            <h4 class="text-sm font-bold text-slate-800 truncate mt-1" title="${p.name}">${p.name}</h4>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs font-black text-blue-600">$${p.price.toFixed(2)} USD</span>
              ${p.distributorPrice ? `<span class="text-[10px] text-slate-400 font-semibold">(Dist: $${p.distributorPrice.toFixed(2)} + Ganancia: $${(p.profitMargin || 0).toFixed(2)})</span>` : ''}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
          <button onclick="toggleFeatured('${p.id}')" class="p-2 rounded-xl border text-xs font-semibold transition ${p.featured ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}" title="${p.featured ? 'Quitar del Slider' : 'Destacar en Slider'}">
            ⭐ ${p.featured ? 'En Slider' : 'No en Slider'}
          </button>
          <button onclick="editProduct('${p.id}')" class="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            <span>Editar</span>
          </button>
          <button onclick="deleteProduct('${p.id}')" class="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition" title="Eliminar Producto">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;
}

function editProduct(productId) {
  const product = ProductsManager.getById(productId);
  if (!product) return;

  editingProductId = productId;
  document.getElementById("form-title").textContent = `Editar Artículo (${product.name})`;
  document.getElementById("cancel-edit-btn").classList.remove("hidden");

  document.getElementById("p-name").value = product.name;
  document.getElementById("p-category").value = product.category;
  document.getElementById("p-distributor-price").value = product.distributorPrice || (product.price * 0.75).toFixed(2);
  document.getElementById("p-profit-margin").value = product.profitMargin || (product.price * 0.15).toFixed(2);
  document.getElementById("p-stock").value = product.stockCount || 1;
  document.getElementById("p-badge").value = product.badge || "";
  document.getElementById("p-badge-color").value = product.badgeColor || "bg-blue-600";
  document.getElementById("p-featured").checked = !!product.featured;
  document.getElementById("p-short-desc").value = product.shortDescription || "";
  document.getElementById("p-specs").value = Array.isArray(product.specs) ? product.specs.join("\n") : (product.specs || "");

  currentUploadedImages = (product.images && product.images.length > 0) ? [...product.images] : [product.image];
  updateUploadedPhotosPreview();
  updatePricingCalculation();
  switchAdminTab("products");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelEdit() {
  editingProductId = null;
  document.getElementById("form-title").textContent = "Cargar Nuevo Artículo";
  document.getElementById("cancel-edit-btn").classList.add("hidden");
  document.getElementById("product-form").reset();
  currentUploadedImages = [];
  updateUploadedPhotosPreview();
  updatePricingCalculation();
}

function deleteProduct(productId) {
  const product = ProductsManager.getById(productId);
  if (!product) return;

  if (confirm(`¿Estás seguro de eliminar "${product.name}" del catálogo?`)) {
    ProductsManager.delete(productId);
    renderInventoryList();
    renderInventoryTable();
    updateStats();
    showToast(`Artículo "${product.name}" eliminado`, "info");
  }
}

function toggleFeatured(productId) {
  const product = ProductsManager.getById(productId);
  if (!product) return;

  const newFeatured = !product.featured;
  ProductsManager.update(productId, { featured: newFeatured });
  renderInventoryList();
  updateStats();
  showToast(`Artículo "${product.name}" ${newFeatured ? 'agregado al Slider' : 'removido del Slider'}`, "success");
}

/**
 * ========================================================
 * 2. TABLA DE INVENTARIO
 * ========================================================
 */
function renderInventoryTable() {
  const tbody = document.getElementById("inventory-table-body");
  if (!tbody) return;

  const products = ProductsManager.getAll();

  tbody.innerHTML = products.map(p => `
    <tr class="hover:bg-slate-50 transition">
      <td class="py-3 px-4 font-mono font-bold text-blue-600">${p.id}</td>
      <td class="py-3 px-4 font-bold text-slate-800">${p.name}</td>
      <td class="py-3 px-4 text-slate-600">${p.categoryName}</td>
      <td class="py-3 px-4 text-right font-mono">$${(p.distributorPrice || (p.price * 0.75)).toFixed(2)}</td>
      <td class="py-3 px-4 text-right font-mono">$${(p.iva15 || (p.price * 0.11)).toFixed(2)}</td>
      <td class="py-3 px-4 text-right font-mono text-emerald-600 font-bold">$${(p.profitMargin || (p.price * 0.14)).toFixed(2)}</td>
      <td class="py-3 px-4 text-right font-mono font-black text-slate-900">$${p.price.toFixed(2)}</td>
      <td class="py-3 px-4 text-center font-bold">${p.stockCount || 1}</td>
      <td class="py-3 px-4 text-center">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${p.stockCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
          ${p.stockCount > 0 ? 'Disponible' : 'Agotado'}
        </span>
      </td>
    </tr>
  `).join("");
}

/**
 * ========================================================
 * 3. GESTIÓN DE CATEGORÍAS
 * ========================================================
 */
function renderCategoriesList() {
  const container = document.getElementById("admin-categories-list");
  if (!container) return;

  const categories = CategoriesManager.getAll();
  const products = ProductsManager.getAll();

  let html = "";
  categories.forEach(c => {
    const count = products.filter(p => p.category === c.slug).length;

    html += `
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${c.icon || '📦'}</span>
          <div>
            <h4 class="text-sm font-bold text-slate-800">${c.name}</h4>
            <span class="text-xs text-slate-400 font-semibold">${count} ${count === 1 ? 'producto' : 'productos'}</span>
          </div>
        </div>

        <button onclick="deleteCategory('${c.slug}')" class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition">
          Eliminar
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function deleteCategory(slug) {
  if (confirm(`¿Deseas eliminar esta categoría? Los productos asociados permanecerán en el catálogo.`)) {
    const res = CategoriesManager.delete(slug);
    if (res.success) {
      populateCategorySelects();
      renderCategoriesList();
      updateStats();
      showToast("Categoría eliminada", "info");
    } else {
      showToast(res.message, "warning");
    }
  }
}

/**
 * ========================================================
 * 4. GESTIÓN DE CUPONES DE DESCUENTO
 * ========================================================
 */
function renderCouponsList() {
  const container = document.getElementById("admin-coupons-list");
  if (!container) return;

  const coupons = CouponsManager.getAll();

  if (coupons.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p class="text-sm font-semibold text-slate-500">No hay cupones activos creados.</p>
      </div>
    `;
    return;
  }

  let html = "";
  coupons.forEach(c => {
    html += `
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base">
            🎟️
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-mono font-black text-slate-900">${c.code}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                ${c.type === 'percent' ? c.value + '% Descuento' : '$' + c.value.toFixed(2) + ' USD Menos'}
              </span>
            </div>
            <span class="text-xs text-slate-400">
              ${c.minPurchase > 0 ? `Compra mínima: $${c.minPurchase.toFixed(2)}` : 'Sin compra mínima'}
            </span>
          </div>
        </div>

        <button onclick="deleteCoupon('${c.code}')" class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition">
          Eliminar
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function deleteCoupon(code) {
  if (confirm(`¿Deseas eliminar el cupón "${code}"?`)) {
    CouponsManager.delete(code);
    renderCouponsList();
    updateStats();
    showToast(`Cupón "${code}" eliminado`, "info");
  }
}

/**
 * ========================================================
 * 5. GESTIÓN DE PEDIDOS Y FACTURAS
 * ========================================================
 */
function renderOrdersList() {
  const container = document.getElementById("admin-orders-list");
  if (!container) return;

  const orders = OrdersManager.getAll();

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p class="text-sm font-semibold text-slate-500">Aún no se han registrado compras en la tienda.</p>
      </div>
    `;
    return;
  }

  let html = "";
  orders.forEach(order => {
    html += `
      <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-mono font-black text-blue-600">${order.orderId}</span>
              <span class="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">${order.invoiceNumber}</span>
              <span class="text-xs text-slate-400">• ${order.date}</span>
            </div>
            <p class="text-xs text-slate-600 mt-1">
              <strong>Cliente:</strong> ${order.customer.name} | 📞 ${order.customer.phone} | 📍 ${order.customer.city}, ${order.customer.province}
            </p>
          </div>

          <!-- Status Selector -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-500">Estado:</span>
            <select onchange="updateOrderStatus('${order.orderId}', this.value)" class="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-300 outline-none focus:border-blue-600 bg-slate-50">
              <option value="Pendiente" ${order.status === 'Pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
              <option value="En Preparación" ${order.status === 'En Preparación' ? 'selected' : ''}>📦 En Preparación</option>
              <option value="Enviado" ${order.status === 'Enviado' ? 'selected' : ''}>🚚 Enviado Servientrega</option>
              <option value="Entregado" ${order.status === 'Entregado' ? 'selected' : ''}>✅ Entregado</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span class="font-bold text-slate-700 block mb-1">Ítems Comprados:</span>
            ${order.items.map(i => `
              <div class="flex justify-between text-slate-600">
                <span>${i.quantity}x ${i.name}</span>
                <span class="font-bold text-slate-900">$${(i.price * i.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>

          <div class="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div>
              <div class="flex justify-between text-slate-500">
                <span>Método de Pago:</span>
                <span class="font-bold text-slate-800">${order.paymentMethod}</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span>Dirección de Entrega:</span>
                <span class="font-semibold text-slate-800 truncate" title="${order.customer.address}">${order.customer.address}</span>
              </div>
              <div class="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200 mt-1">
                <span>Total a Cobrar:</span>
                <span class="text-blue-600">$${order.totals.total} USD</span>
              </div>
            </div>

            <!-- Receipt & Invoice PDF Buttons -->
            <div class="pt-2 flex items-center gap-2 flex-wrap justify-end">
              ${order.receiptImage ? `
                <button onclick="viewReceiptModal('${order.receiptImage}', '${order.orderId}')" class="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold transition flex items-center gap-1">
                  <span>📎 Ver Comprobante</span>
                </button>
              ` : ''}

              <button onclick="downloadAdminInvoiceDirect('${order.orderId}')" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                <span>📄 Generar Factura PDF</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;
}

function updateOrderStatus(orderId, newStatus) {
  OrdersManager.updateStatus(orderId, newStatus);
  showToast(`Estado de orden ${orderId} cambiado a "${newStatus}"`, "success");
  updateStats();
}

function viewReceiptModal(imgSrc, orderId) {
  const modal = document.getElementById("receipt-viewer-modal");
  const img = document.getElementById("receipt-modal-img");
  const title = document.getElementById("receipt-modal-title");

  if (!modal || !img) return;

  img.src = imgSrc;
  if (title) title.textContent = `Comprobante de Pago - Orden ${orderId}`;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeReceiptViewer() {
  const modal = document.getElementById("receipt-viewer-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

/**
 * ========================================================
 * 6. GENERADOR DE FACTURA PDF OFICIAL
 * ========================================================
 */
function downloadAdminInvoiceDirect(orderId) {
  const order = OrdersManager.getById(orderId);
  if (!order) {
    showToast("Orden no encontrada", "error");
    return;
  }

  showToast("Generando factura PDF oficial para el Administrador...", "info");

  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (!printWindow) {
    window.print();
    return;
  }

  const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Factura_Admin_${order.orderId}_SUMAK_IT</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background: #fff; color: #1e293b; padding: 30px; font-size: 13px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0066ff; padding-bottom: 20px; margin-bottom: 20px; }
        .company-title { font-size: 24px; font-weight: 900; color: #0066ff; letter-spacing: -0.5px; }
        .slogan { font-size: 11px; color: #0066ff; font-weight: bold; }
        .badge-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 18px; border-radius: 12px; text-align: right; }
        .badge-title { font-size: 11px; font-weight: 800; color: #0066ff; text-transform: uppercase; }
        .badge-num { font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 2px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-bottom: 25px; }
        .info-block h4 { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; font-weight: 800; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th { background: #f1f5f9; padding: 10px; font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 800; border-bottom: 2px solid #cbd5e1; }
        td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
        .totals-section { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
        .totals-box { width: 260px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
        .tot-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; color: #475569; }
        .tot-row.final { border-top: 2px solid #cbd5e1; padding-top: 8px; margin-top: 8px; font-size: 15px; font-weight: 900; color: #0066ff; }
        .legal-notes { font-size: 10px; color: #64748b; line-height: 1.4; max-width: 450px; }
        .print-btn-bar { margin-bottom: 20px; text-align: right; }
        .btn-print { background: #0066ff; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
        @media print { .print-btn-bar { display: none; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="print-btn-bar">
        <button class="btn-print" onclick="window.print()">📥 Guardar / Imprimir Factura PDF</button>
      </div>

      <div class="header">
        <div>
          <div class="company-title">SUMAK IT</div>
          <div class="slogan">Tu aliado tecnológico, pensando en ti.</div>
          <div style="font-weight: bold; color: #334155; margin-top: 4px;">Mario Dario Rea Tamami</div>
          <div style="color: #64748b; font-family: monospace; font-size: 11px;">RUC: <strong>020246352007</strong></div>
          <div style="color: #64748b; font-size: 11px; margin-top: 3px;">Guaranda, Bolívar, Ecuador | 0959736854 | readario94@gmail.com</div>
        </div>
        <div class="badge-box">
          <div class="badge-title">Factura Oficial SRI</div>
          <div class="badge-num">${order.invoiceNumber || 'FAC-' + order.orderId}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Fecha: ${order.date || new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-block">
          <h4>Datos del Cliente</h4>
          <div style="font-weight: bold; font-size: 13px; color: #0f172a;">${order.customer.name}</div>
          <div>${order.customer.email || 'readario94@gmail.com'}</div>
          <div>Teléfono: ${order.customer.phone}</div>
        </div>
        <div class="info-block">
          <h4>Dirección de Entrega</h4>
          <div style="font-weight: 600;">${order.customer.city}, ${order.customer.province}</div>
          <div>${order.customer.address}</div>
          <div style="color: #0066ff; font-weight: bold; margin-top: 4px;">Método de Pago: ${order.paymentMethod}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align: center; width: 50px;">Cant.</th>
            <th>Descripción del Artículo / Equipo</th>
            <th style="text-align: right; width: 100px;">P. Unitario</th>
            <th style="text-align: right; width: 100px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
              <td style="font-weight: 600; color: #1e293b;">${item.name}</td>
              <td style="text-align: right;">$${item.price.toFixed(2)}</td>
              <td style="text-align: right; font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section">
        <div class="legal-notes">
          <p>• Razón Social: <strong>Mario Dario Rea Tamami</strong> | RUC: <strong>020246352007</strong></p>
          <p>• Cuenta Autorizada: <strong>Banco Pichincha (2200807883)</strong></p>
          <p>• Documento oficial de garantía en SUMAK IT Guaranda, Ecuador.</p>
        </div>

        <div class="totals-box">
          <div class="tot-row">
            <span>Subtotal:</span>
            <span style="font-weight: bold; color: #0f172a;">$${order.totals.subtotal}</span>
          </div>
          ${parseFloat(order.totals.discount || 0) > 0 ? `
            <div class="tot-row" style="color: #10b981; font-weight: bold;">
              <span>Descuento:</span>
              <span>-$${order.totals.discount}</span>
            </div>
          ` : ''}
          <div class="tot-row">
            <span>Costo de Envío:</span>
            <span style="font-weight: bold; color: #0f172a;">$${order.totals.shipping}</span>
          </div>
          <div class="tot-row final">
            <span>Total Cobrado:</span>
            <span>$${order.totals.total} USD</span>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(invoiceHtml);
  printWindow.document.close();
}

/**
 * ========================================================
 * 7. VENTAS & REPORTES
 * ========================================================
 */
function renderSalesReports() {
  const orders = OrdersManager.getAll();
  const products = ProductsManager.getAll();
  const categories = CategoriesManager.getAll();

  const totalAmount = orders.reduce((sum, o) => sum + parseFloat(o.totals.total || 0), 0);
  const deliveredOrders = orders.filter(o => o.status === "Entregado");
  const avgTicket = orders.length > 0 ? (totalAmount / orders.length) : 0;

  const totalEl = document.getElementById("sales-total-amount");
  const deliveredEl = document.getElementById("sales-delivered-count");
  const avgEl = document.getElementById("sales-average-ticket");

  if (totalEl) totalEl.textContent = `$${totalAmount.toFixed(2)} USD`;
  if (deliveredEl) deliveredEl.textContent = deliveredOrders.length;
  if (avgEl) avgEl.textContent = `$${avgTicket.toFixed(2)} USD`;

  const distContainer = document.getElementById("sales-category-distribution");
  if (distContainer) {
    distContainer.innerHTML = categories.map(cat => {
      const catProds = products.filter(p => p.category === cat.slug);
      const percentage = products.length > 0 ? ((catProds.length / products.length) * 100).toFixed(0) : 0;

      return `
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-bold text-slate-700">
            <span>${cat.icon || '📦'} ${cat.name}</span>
            <span>${catProds.length} artículos (${percentage}%)</span>
          </div>
          <div class="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full rounded-full bg-blue-600 transition-all duration-500" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    }).join("");
  }
}

/**
 * ========================================================
 * 8. GESTIÓN DE USUARIOS Y ROLES (ADMIN + CLIENTES)
 * ========================================================
 */
function renderUsersManagement() {
  renderAdminsList();
  renderClientsList();
}

function renderAdminsList() {
  const container = document.getElementById("admins-list-container");
  if (!container) return;

  const admins = AdminAuth.getAllAdmins();

  let html = "";
  admins.forEach(adm => {
    const isSuper = adm.username.toLowerCase() === "admin";
    const isActive = adm.active !== false;

    html += `
      <div class="bg-white p-4 rounded-2xl border ${isActive ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20'} shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl ${isSuper ? 'bg-blue-100 text-blue-700' : isActive ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-700'} flex items-center justify-center font-bold text-base">
            👤
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-bold text-slate-900">${adm.name || adm.username}</span>
              <span class="text-xs font-mono font-bold text-blue-600">(@${adm.username})</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded ${isSuper ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}">
                ${adm.role || 'Administrador'}
              </span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                ${isActive ? '🟢 Activo' : '🔴 Inactivo'}
              </span>
            </div>
            <span class="text-xs text-slate-400">Creado: ${adm.createdAt ? new Date(adm.createdAt).toLocaleDateString() : 'Oficial'}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button onclick="openEditAdminModal('${adm.username}')" class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            <span>Editar</span>
          </button>

          <button onclick="openTargetAdminPassModal('${adm.username}')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            <span>Clave</span>
          </button>

          ${!isSuper ? `
            <button onclick="toggleAdminActiveStatus('${adm.username}')" class="px-3 py-1.5 rounded-xl font-bold text-xs transition ${isActive ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'}">
              ${isActive ? 'Inactivar' : 'Activar'}
            </button>
            <button onclick="deleteAdminUserDirect('${adm.username}')" class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs transition flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Eliminar</span>
            </button>
          ` : '<span class="text-[10px] text-slate-400 font-bold px-1">Principal</span>'}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function toggleAdminActiveStatus(username) {
  const res = AdminAuth.toggleActive(username);
  if (res.success) {
    showToast(res.message, "info");
    renderAdminsList();
    renderDatabaseMetrics();
    updateStats();
  } else {
    showToast(res.message, "warning");
  }
}

function deleteAdminUserDirect(username) {
  if (confirm(`¿Estás seguro de eliminar al administrador "${username}"?`)) {
    const res = AdminAuth.deleteAdmin(username);
    if (res.success) {
      showToast(res.message, "info");
      renderAdminsList();
      renderDatabaseMetrics();
      updateStats();
    } else {
      showToast(res.message, "warning");
    }
  }
}

function renderClientsList(query = "") {
  const container = document.getElementById("clients-list-container");
  if (!container) return;

  let clients = Auth.getRegisteredUsers();
  const allOrders = OrdersManager.getAll();

  if (query.trim() !== "") {
    const q = query.toLowerCase().trim();
    clients = clients.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  }

  if (clients.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
        <p class="text-sm font-semibold text-slate-500">No se encontraron clientes registrados.</p>
      </div>
    `;
    return;
  }

  let html = "";
  clients.forEach(client => {
    const clientOrders = allOrders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === client.email.toLowerCase());
    const isActive = client.active !== false;

    html += `
      <div class="bg-white p-4 sm:p-5 rounded-2xl border ${isActive ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20'} shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-2xl ${isActive ? 'bg-cyan-50 text-cyan-700 border-cyan-100' : 'bg-rose-50 text-rose-700 border-rose-100'} flex items-center justify-center font-bold text-lg border">
            👤
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-black text-slate-900">${client.name}</span>
              <span class="text-xs text-slate-500 font-semibold">• ${client.email}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                ${clientOrders.length} ${clientOrders.length === 1 ? 'pedido' : 'pedidos'}
              </span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                ${isActive ? '🟢 Activo' : '🔴 Inactivo'}
              </span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">
              📞 <strong>${client.phone || 'Sin teléfono'}</strong> | 📍 ${client.city || 'Guaranda'}, ${client.province || 'Bolívar'} | 🏠 ${client.address || 'Sin dirección'}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button onclick="openEditClientModal('${client.id}')" class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            <span>Editar</span>
          </button>

          <button onclick="openResetClientModal('${client.id}', '${client.name}')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            <span>Clave</span>
          </button>

          <button onclick="toggleClientActiveStatus('${client.id}')" class="px-3 py-1.5 rounded-xl font-bold text-xs transition ${isActive ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'}">
            ${isActive ? 'Inactivar' : 'Activar'}
          </button>

          <button onclick="deleteClientUserDirect('${client.id}', '${client.name}')" class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs transition flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function toggleClientActiveStatus(userId) {
  const res = Auth.toggleActive(userId);
  if (res.success) {
    showToast(res.message, "info");
    renderClientsList();
    renderDatabaseMetrics();
    updateStats();
  } else {
    showToast(res.message, "warning");
  }
}

function deleteClientUserDirect(userId, userName) {
  if (confirm(`¿Estás seguro de eliminar permanentemente al cliente "${userName}"?`)) {
    const res = Auth.deleteUser(userId);
    if (res.success) {
      showToast(res.message, "info");
      renderClientsList();
      renderDatabaseMetrics();
      updateStats();
    } else {
      showToast(res.message, "error");
    }
  }
}

function openResetClientModal(userId, userName) {
  const modal = document.getElementById("admin-reset-client-pass-modal");
  const title = document.getElementById("reset-client-title");
  const idInput = document.getElementById("reset-client-id");

  if (!modal) return;

  if (title) title.textContent = `Restablecer Clave: ${userName}`;
  if (idInput) idInput.value = userId;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeResetClientModal() {
  const modal = document.getElementById("admin-reset-client-pass-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

/**
 * ========================================================
 * 9. BASE DE DATOS POSTGRESQL & RESPALDO
 * ========================================================
 */
function renderDatabaseMetrics() {
  const tbody = document.getElementById("db-tables-metrics-body");
  if (!tbody) return;

  const products = ProductsManager.getAll();
  const categories = CategoriesManager.getAll();
  const coupons = CouponsManager.getAll();
  const orders = OrdersManager.getAll();
  const admins = AdminAuth.getAllAdmins();
  const clients = Auth.getRegisteredUsers();

  const tables = [
    { name: "configuracion_empresa", desc: "Datos fiscales, RUC y Banco Pichincha", count: 1 },
    { name: "administradores", desc: "Cuentas de control y roles", count: admins.length },
    { name: "clientes", desc: "Usuarios y compradores registrados", count: clients.length },
    { name: "categorias", desc: "Familias del catálogo de tecnología", count: categories.length },
    { name: "productos", desc: "Inventario, costos, precios e IVA 15%", count: products.length },
    { name: "cupones_descuento", desc: "Códigos promocionales de descuento", count: coupons.length },
    { name: "pedidos", desc: "Transacciones, pagos y facturas", count: orders.length },
    { name: "servicios_tecnologicos", desc: "Soporte, mantenimiento y software", count: SERVICES_DATA.length },
    { name: "capacitaciones_cursos", desc: "Cursos y talleres de tecnología", count: COURSES_DATA.length },
    { name: "blog_articulos", desc: "Publicaciones y guías de tecnología", count: BLOG_POSTS_DATA.length }
  ];

  tbody.innerHTML = tables.map(t => `
    <tr class="hover:bg-slate-50 transition">
      <td class="py-3 font-mono font-bold text-blue-700">${t.name}</td>
      <td class="py-3 text-slate-600">${t.desc}</td>
      <td class="py-3 text-center font-bold text-slate-900">${t.count}</td>
      <td class="py-3 text-right">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">✓ Sincronizado</span>
      </td>
    </tr>
  `).join("");
}

function downloadPostgreSQLDatabase() {
  showToast("Descargando script oficial de PostgreSQL...", "info");
  
  const link = document.createElement("a");
  link.href = "database/sumak_it_postgresql.sql";
  link.download = "sumak_it_postgresql.sql";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadJSONDatabase() {
  showToast("Generando respaldo JSON completo...", "info");

  const dbData = {
    system: "SUMAK IT Management Database",
    version: "3.0.0",
    exportedAt: new Date().toISOString(),
    fiscalInfo: COMPANY_INFO,
    administrators: AdminAuth.getAllAdmins(),
    clients: Auth.getRegisteredUsers(),
    categories: CategoriesManager.getAll(),
    coupons: CouponsManager.getAll(),
    products: ProductsManager.getAll(),
    orders: OrdersManager.getAll(),
    services: SERVICES_DATA,
    courses: COURSES_DATA,
    blog: BLOG_POSTS_DATA
  };

  const jsonStr = JSON.stringify(dbData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `sumak_it_backup_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Respaldo JSON descargado con éxito.", "success");
}

function handleDatabaseRestore(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.products || !data.categories) {
        showToast("El archivo JSON no tiene la estructura de base de datos de SUMAK IT.", "error");
        return;
      }

      if (data.products) ProductsManager.saveAll(data.products);
      if (data.categories) CategoriesManager.saveAll(data.categories);
      if (data.coupons) CouponsManager.saveAll(data.coupons);
      if (data.orders) OrdersManager.saveAll(data.orders);
      if (data.administrators) AdminAuth.saveAdmins(data.administrators);
      if (data.clients) Auth.saveAllUsers(data.clients);

      showToast("¡Base de Datos restaurada exitosamente desde el archivo JSON!", "success");
      initAdminDashboard();
    } catch (err) {
      showToast("Error al leer el archivo JSON: " + err.message, "error");
    }
  };
  reader.readAsText(file);
}

/**
 * ========================================================
 * 10. EXPORTACIÓN A EXCEL (.xlsx)
 * ========================================================
 */
function exportCatalogToExcel() {
  const products = ProductsManager.getAll();

  const dataRows = products.map((p, idx) => ({
    "N°": idx + 1,
    "Código": p.id,
    "Nombre del Artículo": p.name,
    "Categoría": p.categoryName,
    "Valor Distribuidor ($ USD)": p.distributorPrice || (p.price * 0.75),
    "IVA 15% ($ USD)": p.iva15 || (p.price * 0.11),
    "Envío ($ USD)": p.shippingCost || 5.00,
    "Margen Ganancia ($ USD)": p.profitMargin || (p.price * 0.14),
    "Precio Final Venta ($ USD)": p.price,
    "Stock en Guaranda": p.stockCount || 1,
    "Etiqueta": p.badge || "",
    "Destacado en Slider": p.featured ? "SÍ" : "NO",
    "Descripción": p.shortDescription || ""
  }));

  if (typeof XLSX !== "undefined") {
    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario SUMAK IT");
    XLSX.writeFile(wb, "Inventario_SUMAK_IT_Guaranda.xlsx");
    showToast("Inventario exportado a Excel (.xlsx)", "success");
  } else {
    showToast("Exportando en formato CSV...", "info");
  }
}

function setupDashboardEvents() {
  // Navigation tabs
  document.getElementById("nav-tab-dashboard")?.addEventListener("click", () => switchAdminTab("dashboard"));
  document.getElementById("nav-tab-products")?.addEventListener("click", () => switchAdminTab("products"));
  document.getElementById("nav-tab-categories")?.addEventListener("click", () => switchAdminTab("categories"));
  document.getElementById("nav-tab-inventory")?.addEventListener("click", () => switchAdminTab("inventory"));
  document.getElementById("nav-tab-orders")?.addEventListener("click", () => switchAdminTab("orders"));
  document.getElementById("nav-tab-sales")?.addEventListener("click", () => switchAdminTab("sales"));
  document.getElementById("nav-tab-users")?.addEventListener("click", () => switchAdminTab("users"));
  document.getElementById("nav-tab-coupons")?.addEventListener("click", () => switchAdminTab("coupons"));
  document.getElementById("nav-tab-database")?.addEventListener("click", () => switchAdminTab("database"));

  // Real-time Pricing engine listeners
  document.getElementById("p-distributor-price")?.addEventListener("input", updatePricingCalculation);
  document.getElementById("p-profit-margin")?.addEventListener("input", updatePricingCalculation);

  // Multi-photo file upload
  const fileInput = document.getElementById("p-images-file");
  fileInput?.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          currentUploadedImages.push(event.target.result);
          updateUploadedPhotosPreview();
        };
        reader.readAsDataURL(file);
      });
      showToast(`${files.length} foto(s) agregada(s)`, "success");
      fileInput.value = "";
    }
  });

  // Add photo by URL
  document.getElementById("btn-add-url-photo")?.addEventListener("click", () => {
    const urlInput = document.getElementById("p-image-url");
    if (urlInput && urlInput.value.trim() !== "") {
      currentUploadedImages.push(urlInput.value.trim());
      urlInput.value = "";
      updateUploadedPhotosPreview();
      showToast("Foto por URL agregada", "success");
    }
  });

  // Product Form Submit
  document.getElementById("product-form")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const categoryEl = document.getElementById("p-category");
    const categorySlug = categoryEl.value;
    const categoryName = categoryEl.options[categoryEl.selectedIndex]?.text || "Tecnología";

    const specsText = document.getElementById("p-specs").value;
    const specsArray = specsText.split("\n").map(s => s.trim()).filter(s => s !== "");

    const finalImages = currentUploadedImages.length > 0 
      ? currentUploadedImages 
      : ["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"];

    const distVal = parseFloat(document.getElementById("p-distributor-price").value) || 0;
    const profitVal = parseFloat(document.getElementById("p-profit-margin").value) || 0;
    const calc = ProductsManager.calculateFinalPrice(distVal, profitVal);

    const productData = {
      name: document.getElementById("p-name").value.trim(),
      category: categorySlug,
      categoryName: categoryName,
      distributorPrice: calc.distributorPrice,
      iva15: calc.iva15,
      shippingCost: calc.shippingCost,
      profitMargin: calc.profitMargin,
      price: calc.totalPrice,
      stockCount: parseInt(document.getElementById("p-stock").value, 10) || 1,
      badge: document.getElementById("p-badge").value.trim() || "Nuevo",
      badgeColor: document.getElementById("p-badge-color").value,
      featured: document.getElementById("p-featured").checked,
      image: finalImages[0],
      images: finalImages,
      shortDescription: document.getElementById("p-short-desc").value.trim(),
      specs: specsArray
    };

    if (editingProductId) {
      ProductsManager.update(editingProductId, productData);
      showToast(`¡Artículo "${productData.name}" actualizado con éxito!`, "success");
      cancelEdit();
    } else {
      ProductsManager.add(productData);
      showToast(`¡Artículo "${productData.name}" agregado al catálogo!`, "success");
      document.getElementById("product-form").reset();
      currentUploadedImages = [];
      updateUploadedPhotosPreview();
      updatePricingCalculation();
    }

    renderInventoryList();
    renderInventoryTable();
    renderDatabaseMetrics();
    updateStats();
  });

  // Cancel edit button
  document.getElementById("cancel-edit-btn")?.addEventListener("click", cancelEdit);

  // New Category Form Submit
  document.getElementById("new-category-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("cat-name");
    const iconInput = document.getElementById("cat-icon");

    if (nameInput && nameInput.value.trim() !== "") {
      const res = CategoriesManager.add(nameInput.value, iconInput.value);
      if (res.success) {
        showToast(`Categoría "${nameInput.value}" creada`, "success");
        nameInput.value = "";
        populateCategorySelects();
        renderCategoriesList();
        renderDatabaseMetrics();
        updateStats();
      } else {
        showToast(res.message, "warning");
      }
    }
  });

  // New Coupon Form Submit
  document.getElementById("new-coupon-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = document.getElementById("coupon-code").value;
    const type = document.getElementById("coupon-type").value;
    const val = document.getElementById("coupon-value").value;
    const minP = document.getElementById("coupon-min-purchase").value;

    const res = CouponsManager.add(code, type, val, minP);
    if (res.success) {
      showToast(`¡Cupón "${code.toUpperCase()}" creado con éxito!`, "success");
      document.getElementById("new-coupon-form").reset();
      renderCouponsList();
      renderDatabaseMetrics();
      updateStats();
    } else {
      showToast(res.message, "warning");
    }
  });

  // Add Admin form
  document.getElementById("btn-show-add-admin-form")?.addEventListener("click", () => {
    document.getElementById("add-admin-form")?.classList.toggle("hidden");
  });
  document.getElementById("btn-cancel-add-admin")?.addEventListener("click", () => {
    document.getElementById("add-admin-form")?.classList.add("hidden");
    document.getElementById("add-admin-form")?.reset();
  });
  document.getElementById("add-admin-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("new-adm-name").value;
    const user = document.getElementById("new-adm-user").value;
    const pass = document.getElementById("new-adm-pass").value;
    const role = document.getElementById("new-adm-role").value;

    const res = AdminAuth.addAdmin(user, pass, name, role);
    if (res.success) {
      showToast(res.message, "success");
      document.getElementById("add-admin-form").reset();
      document.getElementById("add-admin-form").classList.add("hidden");
      renderAdminsList();
      renderDatabaseMetrics();
      updateStats();
    } else {
      showToast(res.message, "warning");
    }
  });

  // Client search filter
  document.getElementById("client-search-input")?.addEventListener("input", (e) => {
    renderClientsList(e.target.value);
  });

  // Reset Client Password form
  document.getElementById("close-reset-client-btn")?.addEventListener("click", closeResetClientModal);
  document.getElementById("admin-reset-client-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const userId = document.getElementById("reset-client-id").value;
    const newPass = document.getElementById("reset-client-pass").value;

    const res = Auth.resetUserPassword(userId, newPass);
    if (res.success) {
      showToast(res.message, "success");
      document.getElementById("admin-reset-client-form").reset();
      closeResetClientModal();
    } else {
      showToast(res.message, "warning");
    }
  });

  // Database Tab Buttons
  document.getElementById("btn-download-pg-db")?.addEventListener("click", downloadPostgreSQLDatabase);
  document.getElementById("btn-download-json-db")?.addEventListener("click", downloadJSONDatabase);
  document.getElementById("db-restore-file")?.addEventListener("change", handleDatabaseRestore);

  // Export Excel Button
  document.getElementById("btn-export-excel")?.addEventListener("click", exportCatalogToExcel);

  // Search & Filter in admin inventory
  const searchInput = document.getElementById("admin-search-input");
  const filterCat = document.getElementById("admin-filter-category");

  const runFilter = () => {
    renderInventoryList(searchInput.value, filterCat.value);
  };

  searchInput?.addEventListener("input", runFilter);
  filterCat?.addEventListener("change", runFilter);

  // Receipt viewer modal close
  document.getElementById("close-receipt-modal-btn")?.addEventListener("click", closeReceiptViewer);
  document.getElementById("receipt-modal-backdrop")?.addEventListener("click", closeReceiptViewer);
}

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
