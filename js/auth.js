/**
 * SUMAK IT - "Tu aliado tecnológico, pensando en ti."
 * Módulo de Autenticación, Perfil, Historial y Recuperación de Contraseña del Cliente
 */

const Auth = {
  CURRENT_USER_KEY: "sumak_current_user",
  USERS_LIST_KEY: "sumak_registered_users",
  pendingCheckoutAction: false,

  init() {
    this.updateUserNavUI();
    this.bindEvents();
    this.setupInputMasks();
  },

  setupInputMasks() {
    const inputs = ["reg-phone", "forgot-phone", "checkout-phone", "edit-client-phone", "contact-phone"];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", (e) => {
          let val = e.target.value.replace(/\D/g, "");
          if (val.length > 10) val = val.substring(0, 10);
          e.target.value = val;
        });
      }
    });
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem(this.CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Error reading current user", e);
      return null;
    }
  },

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  getRegisteredUsers() {
    try {
      const data = localStorage.getItem(this.USERS_LIST_KEY);
      if (!data) {
        const initialUsers = [
          {
            id: "usr-demo-01",
            name: "Juan Fernando Morales",
            email: "juan.morales@gmail.com",
            phone: "0987654321",
            city: "Guaranda",
            province: "Bolívar",
            address: "Av. Guayaquil y Manabí, diagonal al Parque Central",
            password: "Password123",
            active: true,
            registeredAt: "2026-08-24T10:00:00.000Z"
          }
        ];
        localStorage.setItem(this.USERS_LIST_KEY, JSON.stringify(initialUsers));
        return initialUsers;
      }
      let list = JSON.parse(data);
      if (!Array.isArray(list)) return [];
      
      list = list.map(u => ({
        ...u,
        active: u.active !== undefined ? u.active : true
      }));
      this.saveAllUsers(list);
      return list;
    } catch (e) {
      return [];
    }
  },

  saveUserToStorage(user) {
    const users = this.getRegisteredUsers();
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(this.USERS_LIST_KEY, JSON.stringify(users));
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
  },

  saveAllUsers(users) {
    localStorage.setItem(this.USERS_LIST_KEY, JSON.stringify(users));
  },

  deleteUser(userId) {
    let users = this.getRegisteredUsers();
    const beforeCount = users.length;
    users = users.filter(u => u.id !== userId);
    if (users.length < beforeCount) {
      this.saveAllUsers(users);
      const cur = this.getCurrentUser();
      if (cur && cur.id === userId) {
        this.logout();
      }
      return { success: true, message: "Cliente eliminado correctamente del sistema." };
    }
    return { success: false, message: "Cliente no encontrado." };
  },

  toggleActive(userId) {
    const users = this.getRegisteredUsers();
    const found = users.find(u => u.id === userId);
    if (!found) {
      return { success: false, message: "Cliente no encontrado." };
    }

    found.active = !found.active;
    this.saveAllUsers(users);

    const cur = this.getCurrentUser();
    if (cur && cur.id === userId) {
      if (!found.active) {
        this.logout();
      } else {
        cur.active = true;
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(cur));
      }
    }

    return { 
      success: true, 
      active: found.active, 
      message: `Cliente "${found.name}" ha sido ${found.active ? 'ACTIVADO' : 'INACTIVADO'} correctamente.` 
    };
  },

  updateUser(userId, updatedData) {
    const users = this.getRegisteredUsers();
    const found = users.find(u => u.id === userId);
    if (!found) {
      return { success: false, message: "Cliente no encontrado." };
    }

    if (updatedData.name) found.name = updatedData.name.trim();
    if (updatedData.email) {
      const cleanEmail = updatedData.email.trim().toLowerCase();
      if (!this.validateEmail(cleanEmail)) {
        return { success: false, message: "Correo electrónico no válido." };
      }
      const otherExists = users.some(u => u.id !== userId && u.email.toLowerCase() === cleanEmail);
      if (otherExists) {
        return { success: false, message: "Ya existe otro cliente con este correo." };
      }
      found.email = cleanEmail;
    }
    if (updatedData.phone) {
      if (!this.validatePhone(updatedData.phone)) {
        return { success: false, message: "El teléfono debe tener 10 dígitos numéricos." };
      }
      found.phone = updatedData.phone.trim();
    }
    if (updatedData.city) found.city = updatedData.city.trim();
    if (updatedData.province) found.province = updatedData.province.trim();
    if (updatedData.address) found.address = updatedData.address.trim();
    if (updatedData.active !== undefined) found.active = !!updatedData.active;

    this.saveAllUsers(users);

    const cur = this.getCurrentUser();
    if (cur && cur.id === userId) {
      const merged = { ...cur, ...found };
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(merged));
      this.updateUserNavUI();
    }

    return { success: true, user: found, message: `Datos del cliente "${found.name}" actualizados correctamente.` };
  },

  resetUserPassword(userId, newPassword) {
    const passValidation = this.validatePassword(newPassword);
    if (!passValidation.valid) {
      return { success: false, message: passValidation.message };
    }

    const users = this.getRegisteredUsers();
    const found = users.find(u => u.id === userId);
    if (!found) {
      return { success: false, message: "Cliente no encontrado." };
    }

    found.password = newPassword.trim();
    this.saveAllUsers(users);

    const cur = this.getCurrentUser();
    if (cur && cur.id === userId) {
      cur.password = newPassword.trim();
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(cur));
    }

    return { success: true, message: `Contraseña restablecida exitosamente para ${found.name}.` };
  },

  recoverCustomerPassword(email, phone, newPassword) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPhone = (phone || "").trim();
    const cleanPass = (newPassword || "").trim();

    if (!cleanEmail || !cleanPhone || !cleanPass) {
      return { success: false, message: "Por favor completa todos los campos de recuperación." };
    }

    if (!this.validateEmail(cleanEmail)) {
      return { success: false, message: "Correo electrónico no válido." };
    }

    if (!this.validatePhone(cleanPhone)) {
      return { success: false, message: "El teléfono debe tener 10 dígitos (ej. 0959736854)." };
    }

    const passVal = this.validatePassword(cleanPass);
    if (!passVal.valid) {
      return { success: false, message: passVal.message };
    }

    const users = this.getRegisteredUsers();
    const found = users.find(u => 
      u.email.toLowerCase().trim() === cleanEmail && 
      (u.phone || "").trim() === cleanPhone
    );

    if (!found) {
      return { 
        success: false, 
        message: "No encontramos una cuenta que coincida con ese correo y número de teléfono." 
      };
    }

    found.password = cleanPass;
    found.active = true;
    this.saveAllUsers(users);

    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(found));
    this.updateUserNavUI();

    return { 
      success: true, 
      user: found, 
      message: `¡Contraseña restablecida con éxito! Bienvenido, ${found.name}.` 
    };
  },

  validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase().trim());
  },

  validatePhone(phone) {
    const re = /^\d{10}$/;
    return re.test(String(phone).trim());
  },

  validatePassword(password) {
    if (password.length < 8) {
      return { valid: false, message: "La contraseña debe tener al menos 8 caracteres." };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "La contraseña debe contener al menos una letra mayúscula." };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "La contraseña debe contener al menos un número." };
    }
    return { valid: true };
  },

  register(formData) {
    const { name, email, phone, city, province, address, password } = formData;
    
    if (!name || !email || !password || !phone) {
      return { success: false, message: "Por favor completa todos los campos obligatorios." };
    }

    if (!this.validateEmail(email)) {
      return { success: false, message: "Por favor ingresa un correo electrónico válido (ej. usuario@gmail.com)." };
    }

    if (!this.validatePhone(phone)) {
      return { success: false, message: "El número de teléfono debe tener exactamente 10 dígitos (ej. 0959736854)." };
    }

    const passValidation = this.validatePassword(password);
    if (!passValidation.valid) {
      return { success: false, message: passValidation.message };
    }

    const users = this.getRegisteredUsers();
    const emailExists = users.some(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (emailExists) {
      return { success: false, message: "Ya existe una cuenta con este correo. Por favor inicia sesión o recupera tu contraseña." };
    }

    const newUser = {
      id: "usr-" + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      city: city ? city.trim() : "Guaranda",
      province: province || "Bolívar",
      address: address ? address.trim() : "",
      password: password.trim(),
      active: true,
      registeredAt: new Date().toISOString()
    };

    this.saveUserToStorage(newUser);
    this.updateUserNavUI();
    return { success: true, user: newUser, message: `¡Bienvenido a SUMAK IT, ${newUser.name}!` };
  },

  login(email, password) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, message: "Ingresa tu correo y contraseña." };
    }

    if (!this.validateEmail(cleanEmail)) {
      return { success: false, message: "Formato de correo electrónico inválido." };
    }

    const users = this.getRegisteredUsers();
    const user = users.find(u => 
      u.email.toLowerCase().trim() === cleanEmail && 
      u.password.trim() === cleanPass
    );

    if (!user) {
      return { success: false, message: "Correo o contraseña incorrectos. Si olvidaste tu clave, pulsa '¿Olvidaste tu contraseña?'." };
    }

    if (user.active === false) {
      return { success: false, message: "Esta cuenta de cliente se encuentra INACTIVA. Comunícate al WhatsApp 0959736854 para reactivarla." };
    }

    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    this.updateUserNavUI();
    return { success: true, user, message: `¡Hola de nuevo, ${user.name}!` };
  },

  changeUserPassword(currentPass, newPass) {
    const user = this.getCurrentUser();
    if (!user) {
      return { success: false, message: "No hay sesión activa." };
    }

    if (user.password.trim() !== (currentPass || "").trim()) {
      return { success: false, message: "Tu contraseña actual es incorrecta." };
    }

    const passVal = this.validatePassword(newPass);
    if (!passVal.valid) {
      return { success: false, message: passVal.message };
    }

    user.password = newPass.trim();
    this.saveUserToStorage(user);
    return { success: true, message: "¡Tu contraseña se ha actualizado correctamente!" };
  },

  logout() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.updateUserNavUI();
    this.closeProfileModal();
    showToast("Has cerrado sesión en tu cuenta.", "info");
  },

  updateUserNavUI() {
    const user = this.getCurrentUser();
    const navText = document.getElementById("user-nav-text");
    if (navText) {
      if (user) {
        navText.textContent = user.name.split(" ")[0];
      } else {
        navText.textContent = "Iniciar Sesión";
      }
    }
  },

  openAuthModal(intent = "login", isCheckout = false) {
    this.pendingCheckoutAction = isCheckout;
    const modal = document.getElementById("auth-modal");
    if (!modal) return;

    const notice = document.getElementById("auth-checkout-notice");
    if (notice) {
      if (isCheckout) {
        notice.classList.remove("hidden");
      } else {
        notice.classList.add("hidden");
      }
    }

    this.switchAuthTab(intent);
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
  },

  closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
    this.pendingCheckoutAction = false;
  },

  switchAuthTab(tab) {
    const loginBtn = document.getElementById("tab-login-btn");
    const registerBtn = document.getElementById("tab-register-btn");
    const tabsHeader = document.getElementById("auth-tabs-header");
    const loginForm = document.getElementById("login-form-container");
    const registerForm = document.getElementById("register-form-container");
    const forgotForm = document.getElementById("forgot-form-container");

    if (tab === "login") {
      tabsHeader?.classList.remove("hidden");
      loginBtn?.classList.add("border-b-2", "border-blue-600", "text-blue-600", "font-bold");
      loginBtn?.classList.remove("text-slate-500", "font-semibold");
      registerBtn?.classList.remove("border-b-2", "border-blue-600", "text-blue-600", "font-bold");
      registerBtn?.classList.add("text-slate-500", "font-semibold");
      loginForm?.classList.remove("hidden");
      registerForm?.classList.add("hidden");
      forgotForm?.classList.add("hidden");
    } else if (tab === "register") {
      tabsHeader?.classList.remove("hidden");
      registerBtn?.classList.add("border-b-2", "border-blue-600", "text-blue-600", "font-bold");
      registerBtn?.classList.remove("text-slate-500", "font-semibold");
      loginBtn?.classList.remove("border-b-2", "border-blue-600", "text-blue-600", "font-bold");
      loginBtn?.classList.add("text-slate-500", "font-semibold");
      registerForm?.classList.remove("hidden");
      loginForm?.classList.add("hidden");
      forgotForm?.classList.add("hidden");
    } else if (tab === "forgot") {
      tabsHeader?.classList.add("hidden");
      loginForm?.classList.add("hidden");
      registerForm?.classList.add("hidden");
      forgotForm?.classList.remove("hidden");
    }
  },

  openProfileModal() {
    const user = this.getCurrentUser();
    if (!user) {
      this.openAuthModal("login");
      return;
    }

    const modal = document.getElementById("user-profile-modal");
    if (!modal) return;

    document.getElementById("profile-name").textContent = user.name;
    document.getElementById("profile-email").textContent = user.email;
    document.getElementById("profile-phone").textContent = user.phone || "-";
    document.getElementById("profile-city").textContent = `${user.city || 'Guaranda'}, ${user.province || 'Bolívar'}`;
    document.getElementById("profile-address").textContent = user.address || "Dirección no registrada";

    this.renderUserOrders(user.email);

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
  },

  closeProfileModal() {
    const modal = document.getElementById("user-profile-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
  },

  renderUserOrders(userEmail) {
    const container = document.getElementById("user-orders-list");
    if (!container) return;

    const orders = OrdersManager.getByCustomerEmail(userEmail);

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200">
          <p class="text-xs text-slate-500 font-semibold">Aún no has realizado compras con esta cuenta.</p>
        </div>
      `;
      return;
    }

    let html = "";
    orders.forEach(order => {
      html += `
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div class="flex items-center justify-between border-b border-slate-200 pb-2">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-blue-600">${order.orderId}</span>
              <span class="text-slate-400">• ${order.date}</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
              order.status === 'Entregado' ? 'bg-emerald-100 text-emerald-800' :
              order.status === 'Enviado' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
            }">${order.status || 'Pendiente'}</span>
          </div>

          <div class="space-y-1">
            ${order.items.map(item => `
              <div class="flex justify-between text-slate-600">
                <span>${item.quantity}x ${item.name}</span>
                <span class="font-bold text-slate-800">$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-200">
            <span class="font-bold text-slate-700">Total: <strong class="text-blue-600 text-sm">$${order.totals.total} USD</strong></span>
            <button onclick="openInvoiceModal('${order.orderId}')" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Ver Factura</span>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  bindEvents() {
    document.getElementById("user-nav-btn")?.addEventListener("click", () => {
      if (this.isLoggedIn()) {
        this.openProfileModal();
      } else {
        this.openAuthModal("login");
      }
    });

    document.getElementById("close-auth-modal-btn")?.addEventListener("click", () => this.closeAuthModal());
    document.getElementById("auth-modal-backdrop")?.addEventListener("click", () => this.closeAuthModal());
    document.getElementById("close-profile-modal-btn")?.addEventListener("click", () => this.closeProfileModal());
    document.getElementById("profile-modal-backdrop")?.addEventListener("click", () => this.closeProfileModal());
    document.getElementById("profile-logout-btn")?.addEventListener("click", () => this.logout());

    document.getElementById("tab-login-btn")?.addEventListener("click", () => this.switchAuthTab("login"));
    document.getElementById("tab-register-btn")?.addEventListener("click", () => this.switchAuthTab("register"));
    
    document.getElementById("goto-register-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.switchAuthTab("register");
    });
    document.getElementById("goto-login-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.switchAuthTab("login");
    });
    document.getElementById("goto-forgot-pass-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.switchAuthTab("forgot");
    });
    document.getElementById("back-to-login-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.switchAuthTab("login");
    });

    // Login submit
    document.getElementById("login-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const pass = document.getElementById("login-password").value;

      const res = this.login(email, pass);
      if (res.success) {
        showToast(res.message, "success");
        this.closeAuthModal();
        if (this.pendingCheckoutAction) {
          Checkout.openCheckoutModal();
        }
      } else {
        showToast(res.message, "error");
      }
    });

    // Register submit
    document.getElementById("register-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = {
        name: document.getElementById("reg-name").value,
        email: document.getElementById("reg-email").value,
        phone: document.getElementById("reg-phone").value,
        province: document.getElementById("reg-province").value,
        city: document.getElementById("reg-city").value,
        address: document.getElementById("reg-address").value,
        password: document.getElementById("reg-password").value
      };

      const res = this.register(formData);
      if (res.success) {
        showToast(res.message, "success");
        this.closeAuthModal();
        if (this.pendingCheckoutAction) {
          Checkout.openCheckoutModal();
        }
      } else {
        showToast(res.message, "error");
      }
    });

    // Forgot password customer submit
    document.getElementById("forgot-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("forgot-email").value;
      const phone = document.getElementById("forgot-phone").value;
      const newPass = document.getElementById("forgot-new-pass").value;
      const confPass = document.getElementById("forgot-conf-pass").value;

      if (newPass !== confPass) {
        showToast("Las contraseñas no coinciden.", "warning");
        return;
      }

      const res = this.recoverCustomerPassword(email, phone, newPass);
      if (res.success) {
        showToast(res.message, "success");
        document.getElementById("forgot-form").reset();
        this.closeAuthModal();
      } else {
        showToast(res.message, "error");
      }
    });

    // Change client password from profile modal
    document.getElementById("user-change-pass-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const cur = document.getElementById("user-current-pass").value;
      const nPass = document.getElementById("user-new-pass").value;

      const res = this.changeUserPassword(cur, nPass);
      if (res.success) {
        showToast(res.message, "success");
        document.getElementById("user-change-pass-form").reset();
      } else {
        showToast(res.message, "error");
      }
    });
  }
};
