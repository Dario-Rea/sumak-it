/**
 * SUMAK IT - "Tu aliado tecnológico, pensando en ti."
 * Módulo de Checkout, Facturación Oficial SRI y Registro de Pedidos
 * Banco Pichincha: 2200807883 | Mario Dario Rea Tamami (RUC: 020246352007)
 */

const Checkout = {
  init() {
    this.bindEvents();
  },

  openCheckoutModal() {
    const cart = Cart.getCart();
    if (cart.length === 0) {
      showToast("Tu carrito está vacío.", "warning");
      return;
    }

    if (!Auth.isLoggedIn()) {
      Cart.close();
      Auth.openAuthModal("login", true);
      showToast("Por favor inicia sesión o crea tu cuenta para continuar con el pago.", "info");
      return;
    }

    const modal = document.getElementById("checkout-modal");
    if (!modal) return;

    Cart.close();

    const user = Auth.getCurrentUser();
    if (user) {
      document.getElementById("checkout-name").value = user.name || "";
      document.getElementById("checkout-phone").value = user.phone || "";
      if (user.province) document.getElementById("checkout-province").value = user.province;
      document.getElementById("checkout-city").value = user.city || "Guaranda";
      document.getElementById("checkout-address").value = user.address || "";
    }

    const totals = Cart.getTotals();
    document.getElementById("checkout-total-display").textContent = `$${totals.total} USD`;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
  },

  closeCheckoutModal() {
    const modal = document.getElementById("checkout-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
  },

  bindEvents() {
    document.getElementById("btn-proceed-checkout")?.addEventListener("click", () => this.openCheckoutModal());
    document.getElementById("close-checkout-btn")?.addEventListener("click", () => this.closeCheckoutModal());
    document.getElementById("checkout-backdrop")?.addEventListener("click", () => this.closeCheckoutModal());

    const receiptInput = document.getElementById("checkout-receipt-file");
    receiptInput?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById("checkout-receipt-base64").value = event.target.result;
          showToast("Comprobante cargado exitosamente.", "success");
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById("checkout-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.processOrder();
    });

    document.getElementById("btn-print-invoice")?.addEventListener("click", () => {
      window.print();
    });
  },

  processOrder() {
    const cart = Cart.getCart();
    if (cart.length === 0) {
      showToast("El carrito está vacío.", "error");
      return;
    }

    const name = document.getElementById("checkout-name").value.trim();
    const phone = document.getElementById("checkout-phone").value.trim();
    const province = document.getElementById("checkout-province").value;
    const city = document.getElementById("checkout-city").value.trim();
    const address = document.getElementById("checkout-address").value.trim();
    const receiptImage = document.getElementById("checkout-receipt-base64").value;

    if (!name || !phone || !city || !address) {
      showToast("Por favor completa todos los campos de entrega.", "warning");
      return;
    }

    if (!Auth.validatePhone(phone)) {
      showToast("El número de teléfono debe tener 10 dígitos (ej. 0959736854).", "warning");
      return;
    }

    const currentUser = Auth.getCurrentUser();
    const email = currentUser ? currentUser.email : "readario94@gmail.com";

    const totals = Cart.getTotals();
    const orderNum = Math.floor(100000 + Math.random() * 900000);
    const orderId = `ST-${orderNum}`;
    const invoiceNumber = `FAC-001-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const today = new Date().toLocaleDateString("es-EC", { day: '2-digit', month: '2-digit', year: 'numeric' });

    const newOrder = {
      orderId,
      invoiceNumber,
      date: today,
      customer: {
        name,
        email,
        phone,
        city,
        province,
        address
      },
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      totals: {
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        total: totals.total
      },
      paymentMethod: "Transferencia Bancaria (Banco Pichincha: 2200807883)",
      receiptImage: receiptImage || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
      status: "Pendiente",
      notes: "Transferencia realizada por el cliente"
    };

    OrdersManager.add(newOrder);

    cart.forEach(item => {
      const prod = ProductsManager.getById(item.product.id);
      if (prod && prod.stockCount) {
        const newStock = Math.max(0, prod.stockCount - item.quantity);
        ProductsManager.update(prod.id, { stockCount: newStock, inStock: newStock > 0 });
      }
    });

    Cart.clearCart();
    this.closeCheckoutModal();

    showToast("¡Pedido registrado exitosamente! Mostrando Factura Oficial...", "success");

    this.sendWhatsAppOrder(newOrder);
    openInvoiceModal(orderId);
  },

  sendWhatsAppOrder(order) {
    let msg = `🛍️ *NUEVO PEDIDO EN SUMAK IT*\n`;
    msg += `------------------------------------\n`;
    msg += `📄 *Factura:* ${order.invoiceNumber}\n`;
    msg += `🔖 *Orden:* ${order.orderId}\n`;
    msg += `👤 *Cliente:* ${order.customer.name}\n`;
    msg += `📞 *Teléfono:* ${order.customer.phone}\n`;
    msg += `📍 *Ciudad:* ${order.customer.city}, ${order.customer.province}\n`;
    msg += `🏠 *Dirección:* ${order.customer.address}\n\n`;
    msg += `📦 *PRODUCTOS:*\n`;

    order.items.forEach(i => {
      msg += `• ${i.quantity}x ${i.name} ($${(i.price * i.quantity).toFixed(2)})\n`;
    });

    msg += `\n💰 *Total Pagado:* $${order.totals.total} USD\n`;
    msg += `🏦 *Pago:* Banco Pichincha (2200807883)\n`;
    msg += `------------------------------------\n`;
    msg += `Adjunto mi comprobante para la verificación y despacho.`;

    const waUrl = `https://wa.me/593959736854?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  }
};

/**
 * Visualización e Impresión de Facturas Oficiales en PDF
 */
function openInvoiceModal(orderId) {
  const order = OrdersManager.getById(orderId);
  if (!order) return;

  const modal = document.getElementById("invoice-modal");
  if (!modal) return;

  document.getElementById("inv-number").textContent = order.invoiceNumber || `FAC-${order.orderId}`;
  document.getElementById("inv-date").textContent = `Fecha: ${order.date || new Date().toLocaleDateString()}`;
  document.getElementById("inv-customer-name").textContent = order.customer.name;
  document.getElementById("inv-customer-email").textContent = order.customer.email || 'readario94@gmail.com';
  document.getElementById("inv-customer-phone").textContent = `📞 ${order.customer.phone}`;
  document.getElementById("inv-customer-address").textContent = `${order.customer.address} (${order.customer.city}, ${order.customer.province})`;
  document.getElementById("inv-payment-method").textContent = `Pago: ${order.paymentMethod || 'Banco Pichincha (2200807883)'}`;

  const tbody = document.getElementById("inv-items-body");
  tbody.innerHTML = order.items.map(i => `
    <tr>
      <td class="py-2 font-bold">${i.quantity}</td>
      <td class="py-2 font-semibold text-slate-800">${i.name}</td>
      <td class="py-2 text-right">$${i.price.toFixed(2)}</td>
      <td class="py-2 text-right font-bold">$${(i.price * i.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

  document.getElementById("inv-subtotal").textContent = `$${order.totals.subtotal}`;
  document.getElementById("inv-shipping").textContent = `$${order.totals.shipping}`;
  document.getElementById("inv-total").textContent = `$${order.totals.total} USD`;

  const discRow = document.getElementById("inv-discount-row");
  const discVal = document.getElementById("inv-discount");
  if (parseFloat(order.totals.discount || 0) > 0) {
    discRow?.classList.remove("hidden");
    if (discVal) discVal.textContent = `-$${order.totals.discount}`;
  } else {
    discRow?.classList.add("hidden");
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.classList.add("overflow-hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  Checkout.init();
});
