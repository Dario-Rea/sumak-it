/**
 * SUMAK IT - "Tu aliado tecnológico, pensando en ti."
 * Datos Iniciales y Manejadores de Estado (Local Storage & Modelos Relacionales)
 * Razón Social: Mario Dario Rea Tamami | RUC: 020246352007
 * Cuenta Bancaria Única: Banco Pichincha 2200807883
 * Guaranda, Bolívar, Ecuador | 0959736854 | readario94@gmail.com
 */

const COMPANY_INFO = {
  name: "SUMAK IT",
  legalName: "Mario Dario Rea Tamami",
  slogan: "Tu aliado tecnológico, pensando en ti.",
  ruc: "020246352007",
  location: "Guaranda, Bolívar, Ecuador",
  address: "Guaranda, Provincia de Bolívar, Ecuador",
  phone: "0959736854",
  whatsappPhone: "593959736854",
  email: "readario94@gmail.com",
  facebookUrl: "https://www.facebook.com/profile.php?id=61593426244362",
  instagramUrl: "https://www.instagram.com/sumaktech",
  tiktokUrl: "https://www.tiktok.com/@sumaktech",
  shippingNational: 5.00,
  shippingGuaranda: 0.00,
  bankInfo: {
    bank: "Banco Pichincha",
    accountType: "Cuenta de Ahorros",
    accountNumber: "2200807883",
    holder: "Mario Dario Rea Tamami",
    ruc: "020246352007",
    email: "readario94@gmail.com",
    phone: "0959736854"
  }
};

/**
 * Categorías del Catálogo de SUMAK IT
 */
const DEFAULT_CATEGORIES = [
  { slug: "laptops", name: "Laptops & Portátiles", icon: "💻" },
  { slug: "monitores", name: "Monitores & Pantallas", icon: "🖥️" },
  { slug: "impresoras", name: "Impresoras & Tinta", icon: "🖨️" },
  { slug: "accesorios", name: "Accesorios & Periféricos", icon: "⌨️" },
  { slug: "componentes", name: "Componentes & Hardware", icon: "⚙️" },
  { slug: "redes", name: "Conectividad & Redes", icon: "📡" }
];

const CategoriesManager = {
  STORAGE_KEY: "sumak_categories",

  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        this.saveAll(DEFAULT_CATEGORIES);
        return DEFAULT_CATEGORIES;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  },

  saveAll(categories) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(categories));
  },

  add(name, icon = "📦") {
    if (!name || name.trim() === "") return { success: false, message: "Nombre de categoría requerido." };
    const categories = this.getAll();
    const slug = name.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");

    if (categories.some(c => c.slug === slug)) {
      return { success: false, message: "Ya existe una categoría con este nombre." };
    }

    const newCat = { slug, name: name.trim(), icon: icon || "📦" };
    categories.push(newCat);
    this.saveAll(categories);
    return { success: true, category: newCat };
  },

  delete(slug) {
    let categories = this.getAll();
    if (categories.length <= 1) {
      return { success: false, message: "No puedes eliminar todas las categorías." };
    }
    categories = categories.filter(c => c.slug !== slug);
    this.saveAll(categories);
    return { success: true };
  }
};

/**
 * Cupones de Descuento
 */
const DEFAULT_COUPONS = [
  { code: "SUMAKIT", type: "percent", value: 10, minPurchase: 50, active: true },
  { code: "GUARANDA", type: "fixed", value: 5.00, minPurchase: 30, active: true },
  { code: "BIENVENIDO", type: "percent", value: 5, minPurchase: 0, active: true }
];

const CouponsManager = {
  STORAGE_KEY: "sumak_coupons",

  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        this.saveAll(DEFAULT_COUPONS);
        return DEFAULT_COUPONS;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_COUPONS;
    }
  },

  saveAll(coupons) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(coupons));
  },

  add(code, type, value, minPurchase = 0) {
    if (!code || !value) return { success: false, message: "Código y valor son requeridos." };
    const coupons = this.getAll();
    const cleanCode = code.toUpperCase().trim();

    if (coupons.some(c => c.code === cleanCode)) {
      return { success: false, message: "Ya existe un cupón con este código." };
    }

    const newCoupon = {
      code: cleanCode,
      type: type === "fixed" ? "fixed" : "percent",
      value: parseFloat(value),
      minPurchase: parseFloat(minPurchase) || 0,
      active: true,
      createdAt: new Date().toISOString()
    };

    coupons.push(newCoupon);
    this.saveAll(coupons);
    return { success: true, coupon: newCoupon };
  },

  delete(code) {
    let coupons = this.getAll();
    coupons = coupons.filter(c => c.code !== code.toUpperCase().trim());
    this.saveAll(coupons);
    return { success: true };
  },

  validate(code, subtotal) {
    const coupons = this.getAll();
    const cleanCode = (code || "").toUpperCase().trim();
    const found = coupons.find(c => c.code === cleanCode && c.active);

    if (!found) {
      return { valid: false, message: "Cupón no válido o expirado." };
    }

    if (subtotal < (found.minPurchase || 0)) {
      return { valid: false, message: `Este cupón requiere una compra mínima de $${found.minPurchase.toFixed(2)}.` };
    }

    let discountAmount = 0;
    if (found.type === "percent") {
      discountAmount = (subtotal * (found.value / 100));
    } else {
      discountAmount = Math.min(found.value, subtotal);
    }

    return {
      valid: true,
      coupon: found,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      message: `¡Cupón aplicado! Descuento de ${found.type === 'percent' ? found.value + '%' : '$' + found.value.toFixed(2)}.`
    };
  }
};

/**
 * Productos Predeterminados
 */
const DEFAULT_PRODUCTS = [
  // --- LAPTOPS ---
  {
    id: "lap-01",
    name: "Laptop Asus TUF Gaming A15",
    category: "laptops",
    categoryName: "Laptops & Portátiles",
    distributorPrice: 750.00,
    iva15: 112.50,
    shippingCost: 5.00,
    profitMargin: 112.50,
    price: 980.00,
    rating: 4.9,
    reviewsCount: 28,
    badge: "Más Vendido",
    badgeColor: "bg-amber-500",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "AMD Ryzen 7 7735HS, 16GB RAM DDR5, 512GB SSD NVMe, NVIDIA RTX 4060 8GB, Pantalla 15.6\" 144Hz FHD.",
    specs: [
      "Procesador: AMD Ryzen 7 7735HS (8 núcleos / 16 hilos hasta 4.75 GHz)",
      "Memoria RAM: 16 GB DDR5 4800MHz (Expandible a 32GB)",
      "Almacenamiento: 512 GB SSD M.2 NVMe PCIe 4.0 ultra veloz",
      "Tarjeta Gráfica: NVIDIA GeForce RTX 4060 8GB GDDR6",
      "Pantalla: 15.6\" Full HD (1920x1080) 144Hz IPS Antirreflejo",
      "Teclado: Retroiluminado RGB en español con teclado numérico",
      "Garantía: 1 Año oficial en SUMAK IT Guaranda"
    ],
    inStock: true,
    stockCount: 5,
    featured: true
  },
  {
    id: "lap-02",
    name: "Laptop Lenovo IdeaPad Slim 3 15\"",
    category: "laptops",
    categoryName: "Laptops & Portátiles",
    distributorPrice: 410.00,
    iva15: 61.50,
    shippingCost: 5.00,
    profitMargin: 63.50,
    price: 540.00,
    rating: 4.8,
    reviewsCount: 19,
    badge: "Oferta Especial",
    badgeColor: "bg-emerald-500",
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "Intel Core i5-12450H, 16GB RAM, 512GB SSD NVMe, Pantalla 15.6\" FHD Antirreflejo. Ideal para oficina y universidad.",
    specs: [
      "Procesador: Intel Core i5-12450H 12va Generación",
      "Memoria RAM: 16 GB LPDDR5 de alta frecuencia",
      "Almacenamiento: 512 GB SSD NVMe M.2 ultra veloz",
      "Gráficos: Intel UHD Graphics",
      "Pantalla: 15.6\" FHD IPS 300 nits con biseles ultra delgados",
      "Batería: Hasta 8 horas de autonomía con carga rápida",
      "Peso: 1.62 kg diseño liviano y elegante"
    ],
    inStock: true,
    stockCount: 8,
    featured: true
  },
  {
    id: "lap-03",
    name: "Laptop HP Victus 15 Gaming",
    category: "laptops",
    categoryName: "Laptops & Portátiles",
    distributorPrice: 620.00,
    iva15: 93.00,
    shippingCost: 5.00,
    profitMargin: 102.00,
    price: 820.00,
    rating: 4.9,
    reviewsCount: 14,
    badge: "Gamer Top",
    badgeColor: "bg-blue-600",
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "Intel Core i5 13va Gen, 16GB RAM DDR4, 512GB SSD, NVIDIA GeForce RTX 3050 6GB GDDR6.",
    specs: [
      "Procesador: Intel Core i5-13420H (8 núcleos hasta 4.60 GHz)",
      "Memoria RAM: 16 GB DDR4 3200MHz",
      "Almacenamiento: 512 GB SSD NVMe M.2",
      "Gráfica: NVIDIA RTX 3050 6GB GDDR6",
      "Pantalla: 15.6\" FHD 144Hz IPS micro-edge",
      "Audio: B&O con altavoces duales y HP Audio Boost"
    ],
    inStock: true,
    stockCount: 4,
    featured: false
  },

  // --- MONITORES ---
  {
    id: "mon-01",
    name: "Monitor Gamer LG UltraGear 24\" 144Hz IPS",
    category: "monitores",
    categoryName: "Monitores & Pantallas",
    distributorPrice: 140.00,
    iva15: 21.00,
    shippingCost: 5.00,
    profitMargin: 29.00,
    price: 195.00,
    rating: 4.9,
    reviewsCount: 31,
    badge: "Recomendado",
    badgeColor: "bg-blue-600",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1551645120-d70bfe84c826?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "144Hz, 1ms MBR, Panel IPS FHD, AMD FreeSync Premium, HDR10, Bisel Ultra Delgado.",
    specs: [
      "Tamaño: 23.8 Pulgadas FHD (1920 x 1080)",
      "Tasa de Refresco: 144Hz ultra fluida",
      "Tiempo de Respuesta: 1ms MBR",
      "Panel: IPS con 99% sRGB y HDR10",
      "Tecnología: AMD FreeSync Premium / G-Sync Compatible",
      "Puertos: HDMI, DisplayPort, Salida de Audio"
    ],
    inStock: true,
    stockCount: 6,
    featured: true
  },
  {
    id: "mon-02",
    name: "Monitor Samsung Curvo 27\" Essential",
    category: "monitores",
    categoryName: "Monitores & Pantallas",
    distributorPrice: 135.00,
    iva15: 20.25,
    shippingCost: 5.00,
    profitMargin: 24.75,
    price: 185.00,
    rating: 4.7,
    reviewsCount: 16,
    badge: "Curvo 1800R",
    badgeColor: "bg-cyan-600",
    image: "https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "Pantalla Curva 1800R Inmersiva, 75Hz, AMD FreeSync, Eye Saver Mode y Flicker Free.",
    specs: [
      "Tamaño: 27 Pulgadas Curvo 1800R FHD",
      "Frecuencia: 75Hz con FreeSync",
      "Panel: VA con contraste dinámico 3000:1",
      "Protección Ocular: Modo descanso y libre de parpadeo",
      "Conexiones: HDMI y D-Sub VGA"
    ],
    inStock: true,
    stockCount: 5,
    featured: false
  },

  // --- IMPRESORAS ---
  {
    id: "imp-01",
    name: "Impresora Epson EcoTank L3250 WiFi",
    category: "impresoras",
    categoryName: "Impresoras & Tinta",
    distributorPrice: 170.00,
    iva15: 25.50,
    shippingCost: 5.00,
    profitMargin: 29.50,
    price: 230.00,
    rating: 5.0,
    reviewsCount: 42,
    badge: "Top Ventas",
    badgeColor: "bg-emerald-600",
    image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "Multifuncional 3 en 1 con tanque de tinta continua, WiFi Direct y app Epson Smart Panel.",
    specs: [
      "Funciones: Impresión, Copia y Escaneo a color",
      "Sistema: Tanque de tinta original EcoTank 100% sin cartuchos",
      "Rendimiento: Hasta 4.500 páginas en negro y 7.500 a color por carga",
      "Conectividad: WiFi, WiFi Direct y USB 2.0",
      "Compatibilidad: Windows, macOS, Android e iOS"
    ],
    inStock: true,
    stockCount: 7,
    featured: true
  },

  // --- ACCESORIOS ---
  {
    id: "acc-01",
    name: "Combo Teclado Mecánico RGB + Mouse Gamer",
    category: "accesorios",
    categoryName: "Accesorios & Periféricos",
    distributorPrice: 28.00,
    iva15: 4.20,
    shippingCost: 5.00,
    profitMargin: 10.80,
    price: 48.00,
    rating: 4.9,
    reviewsCount: 25,
    badge: "Combo Gamer",
    badgeColor: "bg-purple-600",
    image: "https://images.unsplash.com/photo-1541140532154-b024d705b909?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1541140532154-b024d705b909?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "Switches mecánicos Blue, iluminación RGB 14 modos, mouse 7200 DPI con pesas ajustables.",
    specs: [
      "Teclado: Mecánico 100% Anti-Ghosting con switch azul táctil",
      "Mouse: Sensor óptico 7200 DPI con 7 botones programables",
      "Cable: Mallado reforzado de 1.8 metros con conector USB dorado",
      "Compatible con PC, Laptop y consolas"
    ],
    inStock: true,
    stockCount: 15,
    featured: false
  },
  {
    id: "acc-02",
    name: "Disco Sólido Kingston NV2 1TB SSD M.2 NVMe",
    category: "accesorios",
    categoryName: "Accesorios & Periféricos",
    distributorPrice: 58.00,
    iva15: 8.70,
    shippingCost: 5.00,
    profitMargin: 13.30,
    price: 85.00,
    rating: 5.0,
    reviewsCount: 39,
    badge: "Alta Velocidad",
    badgeColor: "bg-blue-600",
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "Velocidades de lectura hasta 3500 MB/s y escritura hasta 2100 MB/s. PCIe 4.0 NVMe.",
    specs: [
      "Capacidad: 1 TB (1000 GB)",
      "Factor de Forma: M.2 2280 PCIe 4.0 x4",
      "Velocidad Lectura: 3.500 MB/s",
      "Velocidad Escritura: 2.100 MB/s",
      "Garantía oficial de 3 años"
    ],
    inStock: true,
    stockCount: 12,
    featured: false
  }
];

/**
 * Gestor de Productos
 */
const ProductsManager = {
  STORAGE_KEY: "sumak_products",

  calculateFinalPrice(distributorPrice, profitMargin) {
    const dist = parseFloat(distributorPrice) || 0;
    const profit = parseFloat(profitMargin) || 0;
    const iva = dist * 0.15;
    const shipping = 5.00;
    const total = dist + iva + shipping + profit;
    return {
      distributorPrice: parseFloat(dist.toFixed(2)),
      iva15: parseFloat(iva.toFixed(2)),
      shippingCost: shipping,
      profitMargin: parseFloat(profit.toFixed(2)),
      totalPrice: parseFloat(total.toFixed(2))
    };
  },

  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        this.saveAll(DEFAULT_PRODUCTS);
        return DEFAULT_PRODUCTS;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_PRODUCTS;
    }
  },

  saveAll(products) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
    window.PRODUCTS_DATA = products;
  },

  getById(id) {
    const products = this.getAll();
    return products.find(p => p.id === id) || null;
  },

  getFeatured() {
    const products = this.getAll();
    const featured = products.filter(p => p.featured === true);
    return featured.length > 0 ? featured : products.slice(0, 4);
  },

  add(productData) {
    const products = this.getAll();
    const newId = "prod-" + Date.now();
    const images = Array.isArray(productData.images) && productData.images.length > 0 
      ? productData.images 
      : [productData.image || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"];

    const calc = this.calculateFinalPrice(productData.distributorPrice || (productData.price * 0.75), productData.profitMargin || 25.00);

    const newProduct = {
      id: newId,
      name: productData.name,
      category: productData.category,
      categoryName: productData.categoryName || "Tecnología",
      distributorPrice: calc.distributorPrice,
      iva15: calc.iva15,
      shippingCost: calc.shippingCost,
      profitMargin: calc.profitMargin,
      price: productData.price || calc.totalPrice,
      rating: productData.rating || 5.0,
      reviewsCount: productData.reviewsCount || 1,
      badge: productData.badge || "Nuevo",
      badgeColor: productData.badgeColor || "bg-blue-600",
      image: images[0],
      images: images,
      shortDescription: productData.shortDescription || "",
      specs: Array.isArray(productData.specs) ? productData.specs : (productData.specs ? productData.specs.split("\n") : []),
      inStock: true,
      stockCount: parseInt(productData.stockCount, 10) || 5,
      featured: !!productData.featured
    };

    products.unshift(newProduct);
    this.saveAll(products);
    return newProduct;
  },

  update(id, updatedFields) {
    const products = this.getAll();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    if (updatedFields.distributorPrice !== undefined || updatedFields.profitMargin !== undefined) {
      const dist = updatedFields.distributorPrice !== undefined ? updatedFields.distributorPrice : products[index].distributorPrice;
      const profit = updatedFields.profitMargin !== undefined ? updatedFields.profitMargin : products[index].profitMargin;
      const calc = this.calculateFinalPrice(dist, profit);
      updatedFields.distributorPrice = calc.distributorPrice;
      updatedFields.iva15 = calc.iva15;
      updatedFields.shippingCost = calc.shippingCost;
      updatedFields.profitMargin = calc.profitMargin;
      updatedFields.price = calc.totalPrice;
    }

    products[index] = { ...products[index], ...updatedFields };
    this.saveAll(products);
    return products[index];
  },

  delete(id) {
    let products = this.getAll();
    products = products.filter(p => p.id !== id);
    this.saveAll(products);
    return true;
  }
};

/**
 * Gestor de Pedidos y Facturas
 */
const DEFAULT_ORDERS = [
  {
    orderId: "ST-849201",
    invoiceNumber: "FAC-001-000101",
    date: "24/08/2026",
    customer: {
      name: "Juan Fernando Morales",
      email: "juan.morales@gmail.com",
      phone: "0987654321",
      city: "Guaranda",
      province: "Bolívar",
      address: "Av. Guayaquil y Manabí, diagonal al Parque Central"
    },
    items: [
      {
        id: "lap-01",
        name: "Laptop Asus TUF Gaming A15",
        price: 980.00,
        quantity: 1
      },
      {
        id: "acc-01",
        name: "Combo Teclado Mecánico RGB + Mouse Gamer",
        price: 48.00,
        quantity: 1
      }
    ],
    totals: {
      subtotal: "1028.00",
      discount: "0.00",
      shipping: "0.00",
      total: "1028.00"
    },
    paymentMethod: "Transferencia Bancaria (Banco Pichincha: 2200807883)",
    receiptImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    status: "Entregado"
  }
];

const OrdersManager = {
  STORAGE_KEY: "sumak_orders_history",

  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        this.saveAll(DEFAULT_ORDERS);
        return DEFAULT_ORDERS;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_ORDERS;
    }
  },

  saveAll(orders) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
  },

  add(order) {
    const orders = this.getAll();
    orders.unshift(order);
    this.saveAll(orders);
    return order;
  },

  getById(orderId) {
    const orders = this.getAll();
    return orders.find(o => o.orderId === orderId) || null;
  },

  getByCustomerEmail(email) {
    const orders = this.getAll();
    return orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === email.toLowerCase());
  },

  updateStatus(orderId, newStatus) {
    const orders = this.getAll();
    const order = orders.find(o => o.orderId === orderId);
    if (order) {
      order.status = newStatus;
      this.saveAll(orders);
      return true;
    }
    return false;
  }
};

/**
 * Gestor Avanzado de Usuarios Administradores (Multi-Admin)
 */
const DEFAULT_ADMINS = [
  {
    id: "adm-01",
    username: "admin",
    password: "sumak2026",
    name: "Mario Dario Rea Tamami",
    email: "readario94@gmail.com",
    role: "Super Administrador",
    isSuperAdmin: true,
    active: true,
    createdAt: "2026-08-24T00:00:00.000Z"
  }
];

const AdminAuth = {
  AUTH_KEY: "sumak_admin_session",
  ADMINS_LIST_KEY: "sumak_admin_users_list",

  getAllAdmins() {
    try {
      const data = localStorage.getItem(this.ADMINS_LIST_KEY);
      if (!data) {
        localStorage.setItem(this.ADMINS_LIST_KEY, JSON.stringify(DEFAULT_ADMINS));
        return DEFAULT_ADMINS;
      }
      let list = JSON.parse(data);
      if (!Array.isArray(list) || list.length === 0) {
        localStorage.setItem(this.ADMINS_LIST_KEY, JSON.stringify(DEFAULT_ADMINS));
        return DEFAULT_ADMINS;
      }
      
      list = list.map(a => ({
        ...a,
        active: a.active !== undefined ? a.active : true
      }));

      if (!list.some(a => a.username.toLowerCase() === "admin")) {
        list.unshift(DEFAULT_ADMINS[0]);
      }
      this.saveAdmins(list);
      return list;
    } catch (e) {
      return DEFAULT_ADMINS;
    }
  },

  saveAdmins(admins) {
    localStorage.setItem(this.ADMINS_LIST_KEY, JSON.stringify(admins));
  },

  isAuthenticated() {
    return localStorage.getItem(this.AUTH_KEY) !== null;
  },

  getCurrentAdminUser() {
    return localStorage.getItem(this.AUTH_KEY) || "admin";
  },

  login(user, pass) {
    const admins = this.getAllAdmins();
    const cleanUser = (user || "").trim().toLowerCase();
    const cleanPass = (pass || "").trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: "Por favor ingresa usuario y contraseña." };
    }

    const found = admins.find(a => 
      a.username.toLowerCase().trim() === cleanUser && 
      a.password.trim() === cleanPass
    );

    if (found) {
      if (found.active === false) {
        return { success: false, message: "Esta cuenta de administrador se encuentra INACTIVA. Contacta al Super Administrador." };
      }
      localStorage.setItem(this.AUTH_KEY, found.username);
      return { success: true, admin: found };
    }
    return { success: false, message: "Usuario o contraseña de administrador incorrectos. Verifica o usa '¿Olvidaste tu contraseña?'." };
  },

  addAdmin(username, password, name, role = "Administrador") {
    const cleanUser = (username || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: "El nombre de usuario y contraseña son obligatorios." };
    }
    if (cleanPass.length < 6) {
      return { success: false, message: "La contraseña debe tener al menos 6 caracteres." };
    }

    const admins = this.getAllAdmins();

    if (admins.some(a => a.username.toLowerCase().trim() === cleanUser)) {
      return { success: false, message: "Ya existe un administrador con ese nombre de usuario." };
    }

    const newAdmin = {
      id: "adm-" + Date.now(),
      username: cleanUser,
      password: cleanPass,
      name: name ? name.trim() : cleanUser,
      email: "readario94@gmail.com",
      role: role || "Administrador",
      isSuperAdmin: false,
      active: true,
      createdAt: new Date().toISOString()
    };

    admins.push(newAdmin);
    this.saveAdmins(admins);
    return { success: true, admin: newAdmin, message: `Administrador "${newAdmin.username}" creado exitosamente.` };
  },

  updateAdmin(username, updatedData) {
    const admins = this.getAllAdmins();
    const cleanUser = (username || "").toLowerCase().trim();
    const found = admins.find(a => a.username.toLowerCase().trim() === cleanUser);

    if (!found) {
      return { success: false, message: "Administrador no encontrado." };
    }

    if (updatedData.name !== undefined) found.name = updatedData.name.trim();
    if (updatedData.role !== undefined) found.role = updatedData.role.trim();
    if (updatedData.active !== undefined && cleanUser !== "admin") {
      found.active = !!updatedData.active;
    }

    this.saveAdmins(admins);
    return { success: true, message: `Datos de "${found.username}" actualizados correctamente.` };
  },

  toggleActive(username) {
    const admins = this.getAllAdmins();
    const cleanUser = (username || "").toLowerCase().trim();

    if (cleanUser === "admin") {
      return { success: false, message: "No puedes inactivar al Super Administrador principal." };
    }

    const found = admins.find(a => a.username.toLowerCase().trim() === cleanUser);
    if (!found) {
      return { success: false, message: "Administrador no encontrado." };
    }

    found.active = !found.active;
    this.saveAdmins(admins);
    return { 
      success: true, 
      active: found.active, 
      message: `Administrador "${found.username}" ha sido ${found.active ? 'ACTIVADO' : 'INACTIVADO'} correctamente.` 
    };
  },

  deleteAdmin(username) {
    const admins = this.getAllAdmins();
    const cleanUser = (username || "").toLowerCase().trim();

    if (cleanUser === "admin") {
      return { success: false, message: "No puedes eliminar al Super Administrador principal." };
    }

    const filtered = admins.filter(a => a.username.toLowerCase().trim() !== cleanUser);
    if (filtered.length === admins.length) {
      return { success: false, message: "Administrador no encontrado." };
    }

    this.saveAdmins(filtered);
    return { success: true, message: `Administrador "${username}" eliminado correctamente.` };
  },

  updateAdminPassword(username, newPass) {
    const cleanPass = (newPass || "").trim();
    if (cleanPass.length < 6) {
      return { success: false, message: "La nueva contraseña debe tener al menos 6 caracteres." };
    }
    const admins = this.getAllAdmins();
    const cleanUser = (username || "").toLowerCase().trim();
    const found = admins.find(a => a.username.toLowerCase().trim() === cleanUser);

    if (!found) {
      return { success: false, message: "Administrador no encontrado." };
    }

    found.password = cleanPass;
    this.saveAdmins(admins);
    return { success: true, message: `Contraseña de "${found.username}" actualizada exitosamente.` };
  },

  recoverPassword(username, recoveryEmail, newPass) {
    const cleanUser = (username || "").trim().toLowerCase();
    const cleanEmail = (recoveryEmail || "").trim().toLowerCase();
    const cleanPass = (newPass || "").trim();

    if (!cleanUser || !cleanEmail || !cleanPass) {
      return { success: false, message: "Todos los campos de recuperación son obligatorios." };
    }

    if (cleanPass.length < 6) {
      return { success: false, message: "La nueva contraseña debe tener al menos 6 caracteres." };
    }

    if (cleanEmail !== COMPANY_INFO.email.toLowerCase()) {
      return { success: false, message: `El correo de recuperación no coincide con el correo autorizado (${COMPANY_INFO.email}).` };
    }

    const admins = this.getAllAdmins();
    const found = admins.find(a => a.username.toLowerCase().trim() === cleanUser);

    if (!found) {
      return { success: false, message: `El usuario de administrador "${cleanUser}" no existe.` };
    }

    found.password = cleanPass;
    found.active = true;
    this.saveAdmins(admins);
    return { success: true, message: `¡Contraseña de "${found.username}" restablecida con éxito! Ya puedes iniciar sesión.` };
  },

  changePassword(currentPass, newPass) {
    const currentUser = this.getCurrentAdminUser();
    const admins = this.getAllAdmins();
    const found = admins.find(a => a.username.toLowerCase().trim() === currentUser.toLowerCase().trim());

    if (!found || found.password.trim() !== (currentPass || "").trim()) {
      return { success: false, message: "La contraseña actual es incorrecta." };
    }

    return this.updateAdminPassword(currentUser, newPass);
  },

  logout() {
    localStorage.removeItem(this.AUTH_KEY);
  }
};

window.PRODUCTS_DATA = ProductsManager.getAll();

/**
 * Servicios Tecnológicos
 */
const SERVICES_DATA = [
  {
    id: "serv-hw",
    title: "Soporte y Mantenimiento de Hardware",
    icon: "wrench",
    tag: "Servicio Técnico Especializado",
    description: "Diagnóstico profundo, mantenimiento preventivo y correctivo para laptops, PCs de escritorio e impresoras en Guaranda.",
    features: [
      "Limpieza profunda y cambio de pasta térmica de alto rendimiento",
      "Reparación de placas madre y circuitos electrónicos",
      "Repotenciación con memorias RAM y discos de estado sólido (SSD)",
      "Cambio de pantallas, teclados, bisagras y baterías"
    ],
    ctaText: "Solicitar Mantenimiento",
    whatsappMsg: "Hola SUMAK IT, deseo cotizar un servicio de soporte técnico de hardware para mi equipo."
  },
  {
    id: "serv-sw",
    title: "Desarrollo de Software a Medida",
    icon: "code",
    tag: "Soluciones Digitales",
    description: "Diseñamos y programamos aplicaciones web, sistemas de facturación electrónica e inventario adaptados a tu negocio.",
    features: [
      "Desarrollo de tiendas online y páginas web corporativas",
      "Sistemas de facturación electrónica autorizada por el SRI",
      "Control de inventarios, puntos de venta (POS) y reportes",
      "Automatización de procesos empresariales y soporte continuo"
    ],
    ctaText: "Cotizar Proyecto de Software",
    whatsappMsg: "Hola SUMAK IT, me interesa cotizar el desarrollo de un software / página web para mi negocio."
  },
  {
    id: "serv-redes",
    title: "Redes, Conectividad y Seguridad",
    icon: "wifi",
    tag: "Infraestructura IT",
    description: "Instalación y configuración de redes WiFi de alta cobertura, cableado estructurado y sistemas de cámaras de seguridad.",
    features: [
      "Instalación de Access Points y repetidores WiFi Mesh",
      "Configuración de switches y routers empresariales",
      "Instalación de cámaras de seguridad y monitoreo remoto",
      "Mantenimiento preventivo de centros de datos y racks"
    ],
    ctaText: "Cotizar Redes y Cámaras",
    whatsappMsg: "Hola SUMAK IT, deseo cotizar la instalación o mantenimiento de redes y seguridad."
  }
];

/**
 * Cursos y Capacitaciones Tecnológicas
 */
const COURSES_DATA = [
  {
    id: "curso-excel",
    code: "CURSO-EXCEL",
    title: "Ofimática Profesional & Excel Avanzado para Negocios",
    level: "Básico a Avanzado",
    duration: "30 Horas Prácticas",
    modality: "Presencial (Guaranda) / Online en vivo",
    price: 45.00,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    description: "Domina fórmulas lógicas, tablas dinámicas, dashboards interactivos y automatización con macros para empresas y profesionales.",
    topics: [
      "Fórmulas lógicas, financieras y de búsqueda (BUSCARX, SI, CONTAR.SI)",
      "Tablas y gráficos dinámicos con segmentación de datos",
      "Creación de Dashboards profesionales para reportes ejecutivos",
      "Introducción a macros y automatización de procesos"
    ],
    includes: [
      "Certificado con valor curricular",
      "Plantillas editables de Excel para finanzas",
      "Acceso a grabaciones de las clases",
      "Asesoría personalizada por tutor"
    ],
    whatsappMsg: "Hola SUMAK IT, deseo inscribirme en el curso de Ofimática Profesional y Excel Avanzado."
  },
  {
    id: "curso-mant",
    code: "CURSO-MANT",
    title: "Ensamblaje, Mantenimiento y Reparación de Computadoras",
    level: "100% Práctico",
    duration: "40 Horas en Laboratorio",
    modality: "Presencial (Guaranda)",
    price: 65.00,
    image: "https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80",
    description: "Aprende a diagnosticar, reparar, optimizar y ensamblar computadoras de escritorio y laptops desde cero con herramientas profesionales.",
    topics: [
      "Arquitectura de hardware: Procesadores, memorias, fuentes y placas",
      "Detección y solución de fallas electrónicas y de encendido",
      "Mantenimiento térmico profundo y cambio de componentes",
      "Instalación de sistemas operativos, drivers y antivirus"
    ],
    includes: [
      "Prácticas con equipos reales de laboratorio",
      "Kit de herramientas y software de diagnóstico",
      "Certificado de aprobación técnica",
      "Guía para emprender tu propio taller técnico"
    ],
    whatsappMsg: "Hola SUMAK IT, deseo información e inscribirme en el curso de Ensamblaje y Mantenimiento de Computadoras."
  },
  {
    id: "curso-web",
    code: "CURSO-WEB",
    title: "Fundamentos de Desarrollo Web y Programación",
    level: "Iniciación",
    duration: "35 Horas",
    modality: "Online interactivo con mentor",
    price: 55.00,
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
    description: "Aprende a crear tus propios sitios web y aplicaciones interactivas utilizando HTML5, CSS3, JavaScript moderno y bases de datos.",
    topics: [
      "Estructuración semántica con HTML5 y diseño moderno con CSS3/Tailwind",
      "Programación con JavaScript: lógica, variables, funciones y DOM",
      "Conexión a bases de datos y consumo de APIs",
      "Despliegue y publicación de páginas web en la nube"
    ],
    includes: [
      "Proyecto final publicado en internet",
      "Certificado de desarrollador web inicial",
      "Repositorio de código y recursos descargables",
      "Comunidad de apoyo en Discord/WhatsApp"
    ],
    whatsappMsg: "Hola SUMAK IT, deseo inscribirme en el curso de Desarrollo Web y Programación."
  }
];

/**
 * Artículos del Blog de Tecnología
 */
const BLOG_POSTS_DATA = [
  {
    id: "blog-01",
    slug: "guia-elegir-laptop-2026",
    title: "Guía 2026: Cómo elegir la laptop ideal para tu universidad, oficina o gaming",
    category: "Guías de Compra",
    author: "Mario Dario Rea Tamami",
    date: "24 de Agosto, 2026",
    readTime: "4 min de lectura",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    summary: "Descubre qué procesador, memoria RAM y almacenamiento necesitas realmente según el uso que le darás a tu equipo.",
    content: `Elegir una computadora portátil hoy en día puede resultar abrumador con tantas opciones en el mercado. En SUMAK IT te recomendamos tener en cuenta 3 factores clave:

1. Procesador y Generación: Para labores de oficina o estudio, un procesador Intel Core i5 de 12va generación o un AMD Ryzen 5 es el estándar ideal. Si te dedicas al diseño gráfico o arquitectura, opta por Ryzen 7 o Core i7.

2. Memoria RAM mínima: En 2026, 16 GB de RAM es la cantidad recomendada para trabajar con fluidez en Windows 11 sin que el equipo se congele.

3. Disco Sólido SSD NVMe: Nunca compres un equipo con disco mecánico tradicional; los SSD NVMe M.2 ofrecen hasta 10 veces más velocidad de arranque.

En SUMAK IT Guaranda te asesoramos personalmente para que inviertas de forma inteligente.`
  },
  {
    id: "blog-02",
    slug: "mantenimiento-termico-computadoras",
    title: "¿Por qué tu laptop o PC se calienta y cómo prevenir daños irreparables?",
    category: "Mantenimiento",
    author: "Equipo Técnico SUMAK IT",
    date: "20 de Agosto, 2026",
    readTime: "5 min de lectura",
    image: "https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80",
    summary: "El polvo y la pasta térmica seca son los peores enemigos de los circuitos electrónicos. Te explicamos cada cuánto realizar un mantenimiento.",
    content: `El sobrecalentamiento es la causa número uno de apagados repentinos y daños permanentes en procesadores y tarjetas de video. Con el paso de los meses, los ventiladores absorben pelusa del ambiente y la pasta térmica que transfiere el calor se seca por completo.

Recomendaciones de SUMAK IT:
• Realiza una limpieza y cambio de pasta térmica de alto rendimiento al menos una vez al año.
• Evita colocar tu laptop directamente sobre cobijas, almohadas o superficies acolchadas que tapen las rejillas de ventilación.
• En nuestro taller en Guaranda realizamos mantenimiento preventivo profesional con garantía.`
  },
  {
    id: "blog-03",
    slug: "ssd-vs-disco-mecanico-repotenciacion",
    title: "Discos SSD NVMe vs Discos Mecánicos: La repotenciación que le da vida nueva a tu equipo",
    category: "Hardware & Rendimiento",
    author: "Mario Dario Rea Tamami",
    date: "15 de Agosto, 2026",
    readTime: "3 min de lectura",
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",
    summary: "Si tu computadora tarda minutos en encender, cambiar a un disco de estado sólido es la solución más rápida y económica.",
    content: `Muchos usuarios piensan que cuando una computadora se pone lenta deben comprar una nueva, pero en el 90% de los casos el cuello de botella es el disco duro mecánico tradicional (HDD).

Al instalar un disco SSD Kingston o Western Digital en SUMAK IT, tu equipo pasa de encender en 2 minutos a encender en tan solo 8 segundos, los programas abren al instante y la respuesta general se transforma por completo.`
  }
];
