/**
 * SUMAK IT - "Tu aliado tecnológico, pensando en ti."
 * Módulo de Carrito de Compras, Cupones Dinámicos y Cálculo de Envíos
 */

const Cart = {
  STORAGE_KEY: "sumak_cart",
  appliedCoupon: null,

  init() {
    this.updateBadge();
    this.bindEvents();
  },

  getCart() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
    this.updateBadge();
    this.render();
  },

  add(productId, quantity = 1) {
    const product = ProductsManager.getById(productId);
    if (!product) {
      showToast("Producto no encontrado", "error");
      return;
    }

    const cart = this.getCart();
    const existing = cart.find(item => item.product.id === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: (product.images && product.images.length > 0) ? product.images[0] : product.image,
          categoryName: product.categoryName
        },
        quantity: quantity
      });
    }

    this.saveCart(cart);
    showToast(`¡"${product.name}" agregado al carrito!`, "success");
    this.open();
  },

  updateQuantity(productId, newQty) {
    let cart = this.getCart();
    if (newQty <= 0) {
      this.remove(productId);
      return;
    }
    const item = cart.find(i => i.product.id === productId);
    if (item) {
      item.quantity = newQty;
      this.saveCart(cart);
    }
  },

  remove(productId) {
    let cart = this.getCart();
    cart = cart.filter(i => i.product.id !== productId);
    this.saveCart(cart);
    showToast("Producto removido del carrito", "info");
  },

  clearCart() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.appliedCoupon = null;
    this.updateBadge();
    this.render();
  },

  getTotals() {
    const cart = this.getCart();
    const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    
    let discount = 0;
    if (this.appliedCoupon) {
      if (this.appliedCoupon.type === "percent") {
        discount = (subtotal * (this.appliedCoupon.value / 100));
      } else {
        discount = Math.min(this.appliedCoupon.value, subtotal);
      }
    }

    const user = Auth.getCurrentUser();
    let shipping = 0;
    if (cart.length > 0) {
      if (user && user.city && user.city.toLowerCase().trim() === "guaranda") {
        shipping = COMPANY_INFO.shippingGuaranda;
      } else {
        shipping = COMPANY_INFO.shippingNational;
      }
    }

    const total = Math.max(0, subtotal - discount + shipping);

    return {
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      shipping: shipping.toFixed(2),
      total: total.toFixed(2)
    };
  },

  updateBadge() {
    const cart = this.getCart();
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const badge = document.getElementById("cart-total-badge");
    if (badge) {
      badge.textContent = count;
      if (count > 0) {
        badge.classList.remove("hidden");
      }
    }
  },

  render() {
    const container = document.getElementById("cart-items-list");
    if (!container) return;

    const cart = this.getCart();
    const totals = this.getTotals();

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center text-slate-400 space-y-3">
          <svg class="w-16 h-16 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          <p class="text-sm font-semibold text-slate-600">Tu carrito de compras está vacío</p>
          <p class="text-xs text-slate-400">Descubre nuestros productos destacados en el catálogo.</p>
        </div>
      `;
    } else {
      container.innerHTML = cart.map(item => `
        <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <img src="${item.product.image}" alt="${item.product.name}" class="w-14 h-14 object-contain rounded-xl bg-white p-1 border border-slate-100 flex-shrink-0">
          
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-bold text-slate-800 truncate" title="${item.product.name}">${item.product.name}</h4>
            <span class="text-xs font-black text-blue-600">$${item.product.price.toFixed(2)} USD</span>
            
            <div class="flex items-center gap-2 mt-1">
              <div class="flex items-center border border-slate-200 rounded-lg bg-white">
                <button onclick="Cart.updateQuantity('${item.product.id}', ${item.quantity - 1})" class="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 rounded-l">-</button>
                <span class="px-2 text-xs font-bold text-slate-800">${item.quantity}</span>
                <button onclick="Cart.updateQuantity('${item.product.id}', ${item.quantity + 1})" class="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 rounded-r">+</button>
              </div>
              <button onclick="Cart.remove('${item.product.id}')" class="text-[11px] text-rose-500 hover:underline font-semibold ml-auto">Eliminar</button>
            </div>
          </div>
        </div>
      `).join("");
    }

    document.getElementById("cart-subtotal-val").textContent = `$${totals.subtotal}`;
    document.getElementById("cart-shipping-val").textContent = `$${totals.shipping}`;
    document.getElementById("cart-total-val").textContent = `$${totals.total} USD`;

    const discRow = document.getElementById("cart-discount-row");
    const discVal = document.getElementById("cart-discount-val");
    if (parseFloat(totals.discount) > 0) {
      discRow?.classList.remove("hidden");
      if (discVal) discVal.textContent = `-$${totals.discount}`;
    } else {
      discRow?.classList.add("hidden");
    }
  },

  open() {
    this.render();
    const drawer = document.getElementById("cart-drawer");
    if (drawer) {
      drawer.classList.remove("hidden");
      document.body.classList.add("overflow-hidden");
    }
  },

  close() {
    const drawer = document.getElementById("cart-drawer");
    if (drawer) {
      drawer.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
    }
  },

  applyCoupon(code) {
    const totals = this.getTotals();
    const subtotal = parseFloat(totals.subtotal);
    if (subtotal <= 0) {
      showToast("Agrega productos antes de aplicar un cupón.", "warning");
      return;
    }

    const res = CouponsManager.validate(code, subtotal);
    if (res.valid) {
      this.appliedCoupon = res.coupon;
      this.render();
      showToast(res.message, "success");
    } else {
      showToast(res.message, "error");
    }
  },

  bindEvents() {
    document.getElementById("open-cart-btn")?.addEventListener("click", () => this.open());
    document.getElementById("close-cart-btn")?.addEventListener("click", () => this.close());
    document.getElementById("cart-backdrop")?.addEventListener("click", () => this.close());

    document.getElementById("apply-coupon-btn")?.addEventListener("click", () => {
      const input = document.getElementById("coupon-input");
      if (input && input.value.trim() !== "") {
        this.applyCoupon(input.value.trim());
      }
    });
  }
};
