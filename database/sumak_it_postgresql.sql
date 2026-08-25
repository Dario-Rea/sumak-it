-- ==============================================================================
-- BASE DE DATOS OFICIAL EN POSTGRESQL: SUMAK IT
-- "Tu aliado tecnológico, pensando en ti."
-- Razón Social: Mario Dario Rea Tamami
-- RUC: 020246352007
-- Ubicación: Guaranda, Provincia de Bolívar, Ecuador
-- Teléfono / WhatsApp: 0959736854 | Correo: readario94@gmail.com
-- Cuenta Bancaria Oficial: Banco Pichincha (Cuenta de Ahorros: 2200807883)
-- Compatible con: PostgreSQL 14+, 15+, 16+, Supabase, Neon, AWS RDS, Cloudflare Hyperdrive
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- EXTENSIONES RECOMENDADAS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLA: CONFIGURACION_EMPRESA
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS configuracion_empresa CASCADE;
CREATE TABLE configuracion_empresa (
    id SERIAL PRIMARY KEY,
    nombre_comercial VARCHAR(150) NOT NULL DEFAULT 'SUMAK IT',
    eslogan VARCHAR(255) NOT NULL DEFAULT 'Tu aliado tecnológico, pensando en ti.',
    razon_social VARCHAR(200) NOT NULL DEFAULT 'Mario Dario Rea Tamami',
    ruc VARCHAR(13) NOT NULL DEFAULT '0202463527',
    ciudad VARCHAR(100) NOT NULL DEFAULT 'Guaranda',
    provincia VARCHAR(100) NOT NULL DEFAULT 'Bolívar',
    pais VARCHAR(100) NOT NULL DEFAULT 'Ecuador',
    direccion TEXT NOT NULL DEFAULT 'Guaranda, Provincia de Bolívar, Ecuador',
    telefono VARCHAR(20) NOT NULL DEFAULT '0959736854',
    whatsapp VARCHAR(20) NOT NULL DEFAULT '593959736854',
    email VARCHAR(150) NOT NULL DEFAULT 'readario94@gmail.com',
    facebook_url TEXT DEFAULT 'https://www.facebook.com/profile.php?id=61593426244362',
    tiktok_url TEXT DEFAULT 'https://www.tiktok.com/@sumaktech',
    instagram_url TEXT DEFAULT 'https://www.instagram.com/sumaktech',
    banco_nombre VARCHAR(100) NOT NULL DEFAULT 'Banco Pichincha',
    banco_tipo_cuenta VARCHAR(50) NOT NULL DEFAULT 'Cuenta de Ahorros',
    banco_numero_cuenta VARCHAR(50) NOT NULL DEFAULT '2200807883',
    costo_envio_nacional NUMERIC(10,2) NOT NULL DEFAULT 5.00,
    costo_envio_local NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    iva_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO configuracion_empresa (
    nombre_comercial, eslogan, razon_social, ruc, ciudad, provincia, pais, direccion,
    telefono, whatsapp, email, facebook_url, tiktok_url, instagram_url,
    banco_nombre, banco_tipo_cuenta, banco_numero_cuenta, costo_envio_nacional, costo_envio_local, iva_porcentaje
) VALUES (
    'SUMAK IT',
    'Tu aliado tecnológico, pensando en ti.',
    'Mario Dario Rea Tamami',
    '020246352007',
    'Guaranda',
    'Bolívar',
    'Ecuador',
    'Guaranda, Provincia de Bolívar, Ecuador',
    '0959736854',
    '593959736854',
    'readario94@gmail.com',
    'https://www.facebook.com/profile.php?id=61593426244362',
    'https://www.tiktok.com/@sumaktech',
    'https://www.instagram.com/sumaktech',
    'Banco Pichincha',
    'Cuenta de Ahorros',
    '2200807883',
    5.00,
    0.00,
    15.00
);

-- ------------------------------------------------------------------------------
-- 2. TABLA: ADMINISTRADORES Y ROLES
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS administradores CASCADE;
CREATE TABLE administradores (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL DEFAULT 'readario94@gmail.com',
    rol VARCHAR(50) NOT NULL DEFAULT 'Administrador' CHECK (rol IN ('Super Administrador', 'Administrador', 'Vendedor / Facturación', 'Soporte Técnico')),
    es_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_username ON administradores(username);
CREATE INDEX idx_admin_activo ON administradores(activo);

INSERT INTO administradores (username, password_hash, nombre, email, rol, es_superadmin, activo)
VALUES ('admin', 'sumak2026', 'Mario Dario Rea Tamami', 'readario94@gmail.com', 'Super Administrador', TRUE, TRUE);

-- ------------------------------------------------------------------------------
-- 3. TABLA: CLIENTES
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS clientes CASCADE;
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    codigo_cliente VARCHAR(50) NOT NULL UNIQUE DEFAULT ('CLI-' || floor(random()*900000 + 100000)::text),
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(10) NOT NULL,
    provincia VARCHAR(100) NOT NULL DEFAULT 'Bolívar',
    ciudad VARCHAR(100) NOT NULL DEFAULT 'Guaranda',
    direccion TEXT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    registrado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cliente_email ON clientes(email);
CREATE INDEX idx_cliente_telefono ON clientes(telefono);
CREATE INDEX idx_cliente_activo ON clientes(activo);

INSERT INTO clientes (nombre, email, telefono, provincia, ciudad, direccion, password_hash, activo)
VALUES ('Juan Fernando Morales', 'juan.morales@gmail.com', '0987654321', 'Bolívar', 'Guaranda', 'Av. Guayaquil y Manabí, diagonal al Parque Central', 'Password123', TRUE);

-- ------------------------------------------------------------------------------
-- 4. TABLA: CATEGORIAS DE PRODUCTOS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS categorias CASCADE;
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    icono VARCHAR(50) DEFAULT '📦',
    descripcion TEXT,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categoria_slug ON categorias(slug);

INSERT INTO categorias (slug, nombre, icono, descripcion) VALUES
('laptops', 'Laptops & Portátiles', '💻', 'Equipos portátiles para trabajo, oficina, universidad y gaming de alta gama.'),
('monitores', 'Monitores & Pantallas', '🖥️', 'Pantallas IPS, curvas y de alta tasa de refresco 144Hz / 165Hz.'),
('impresoras', 'Impresoras & Tinta', '🖨️', 'Impresoras multifuncionales con sistema continuo de tinta original.'),
('accesorios', 'Accesorios & Periféricos', '⌨️', 'Teclados mecánicos, mouse gamer, discos SSD NVMe, memorias RAM y cables.'),
('componentes', 'Componentes & Hardware', '⚙️', 'Fuentes de poder, tarjetas gráficas, procesadores y placas madre.'),
('redes', 'Conectividad & Redes', '📡', 'Routers WiFi 6, switches, access points y cableado de red de alta velocidad.');

-- ------------------------------------------------------------------------------
-- 5. TABLA: PRODUCTOS
-- Desglose oficial de precios: Precio Final = Distribuidor + IVA 15% + $5 Envío + Ganancia
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS productos CASCADE;
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    categoria_slug VARCHAR(80) NOT NULL REFERENCES categorias(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
    categoria_nombre VARCHAR(120) NOT NULL,
    valor_distribuidor NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    iva_15 NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    costo_envio NUMERIC(10,2) NOT NULL DEFAULT 5.00,
    margen_ganancia NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    precio_final NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 1,
    en_stock BOOLEAN NOT NULL DEFAULT TRUE,
    etiqueta VARCHAR(80) DEFAULT 'Nuevo',
    color_etiqueta VARCHAR(50) DEFAULT 'bg-blue-600',
    destacado_slider BOOLEAN NOT NULL DEFAULT FALSE,
    calificacion NUMERIC(3,2) DEFAULT 5.00,
    numero_resenas INT DEFAULT 1,
    descripcion_corta TEXT,
    especificaciones JSONB DEFAULT '[]'::jsonb,
    imagen_principal TEXT NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_producto_codigo ON productos(codigo);
CREATE INDEX idx_producto_categoria ON productos(categoria_slug);
CREATE INDEX idx_producto_slider ON productos(destacado_slider);
CREATE INDEX idx_producto_precio ON productos(precio_final);

INSERT INTO productos (
    codigo, nombre, categoria_slug, categoria_nombre, valor_distribuidor, 
    iva_15, costo_envio, margen_ganancia, precio_final, stock, en_stock, 
    etiqueta, color_etiqueta, destacado_slider, calificacion, numero_resenas, 
    descripcion_corta, especificaciones, imagen_principal
) VALUES
(
    'lap-01', 'Laptop Asus TUF Gaming A15', 'laptops', 'Laptops & Portátiles', 
    750.00, 112.50, 5.00, 112.50, 980.00, 5, TRUE, 
    'Más Vendido', 'bg-amber-500', TRUE, 4.90, 28, 
    'AMD Ryzen 7 7735HS, 16GB RAM DDR5, 512GB SSD NVMe, NVIDIA RTX 4060 8GB, Pantalla 15.6" 144Hz FHD.', 
    '["Procesador: AMD Ryzen 7 7735HS (8 núcleos / 16 hilos hasta 4.75 GHz)", "Memoria RAM: 16 GB DDR5 4800MHz (Expandible a 32GB)", "Almacenamiento: 512 GB SSD M.2 NVMe PCIe 4.0", "Tarjeta Gráfica: NVIDIA GeForce RTX 4060 8GB GDDR6", "Pantalla: 15.6 pulgadas FHD 144Hz IPS Antirreflejo", "Garantía: 1 Año oficial en SUMAK IT Guaranda"]'::jsonb, 
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80'
),
(
    'lap-02', 'Laptop Lenovo IdeaPad Slim 3 15"', 'laptops', 'Laptops & Portátiles', 
    410.00, 61.50, 5.00, 63.50, 540.00, 8, TRUE, 
    'Oferta Especial', 'bg-emerald-500', TRUE, 4.80, 19, 
    'Intel Core i5-12450H, 16GB RAM, 512GB SSD NVMe, Pantalla 15.6" FHD Antirreflejo. Ideal para oficina y universidad.', 
    '["Procesador: Intel Core i5-12450H 12va Generación", "Memoria RAM: 16 GB LPDDR5 de alta frecuencia", "Almacenamiento: 512 GB SSD NVMe M.2", "Pantalla: 15.6 pulgadas FHD IPS 300 nits", "Batería: Hasta 8 horas con carga rápida"]'::jsonb, 
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80'
),
(
    'lap-03', 'Laptop HP Victus 15 Gaming', 'laptops', 'Laptops & Portátiles', 
    620.00, 93.00, 5.00, 102.00, 820.00, 4, TRUE, 
    'Gamer Top', 'bg-blue-600', FALSE, 4.90, 14, 
    'Intel Core i5 13va Gen, 16GB RAM DDR4, 512GB SSD, NVIDIA GeForce RTX 3050 6GB GDDR6.', 
    '["Procesador: Intel Core i5-13420H", "Memoria RAM: 16 GB DDR4", "Almacenamiento: 512 GB SSD NVMe", "Gráfica: NVIDIA RTX 3050 6GB", "Pantalla: 15.6 pulgadas FHD 144Hz"]'::jsonb, 
    'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'
),
(
    'mon-01', 'Monitor Gamer LG UltraGear 24" 144Hz IPS', 'monitores', 'Monitores & Pantallas', 
    140.00, 21.00, 5.00, 29.00, 195.00, 6, TRUE, 
    'Recomendado', 'bg-blue-600', TRUE, 4.90, 31, 
    '144Hz, 1ms MBR, Panel IPS FHD, AMD FreeSync Premium, HDR10, Bisel Ultra Delgado.', 
    '["Tamaño: 23.8 Pulgadas FHD IPS", "Tasa de refresco: 144Hz", "Tiempo de respuesta: 1ms MBR", "Puertos: HDMI, DisplayPort"]'::jsonb, 
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'
),
(
    'imp-01', 'Impresora Epson EcoTank L3250 WiFi', 'impresoras', 'Impresoras & Tinta', 
    170.00, 25.50, 5.00, 29.50, 230.00, 7, TRUE, 
    'Top Ventas', 'bg-emerald-600', TRUE, 5.00, 42, 
    'Multifuncional 3 en 1 con tanque de tinta continua, WiFi Direct y app Epson Smart Panel.', 
    '["Funciones: Impresión, Copia y Escaneo", "Sistema: Tanque de tinta continua EcoTank", "Rendimiento: 4.500 páginas negro / 7.500 color", "Conectividad: WiFi Direct y USB"]'::jsonb, 
    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80'
),
(
    'acc-01', 'Combo Teclado Mecánico RGB + Mouse Gamer', 'accesorios', 'Accesorios & Periféricos', 
    28.00, 4.20, 5.00, 10.80, 48.00, 15, TRUE, 
    'Combo Gamer', 'bg-purple-600', FALSE, 4.90, 25, 
    'Switches mecánicos Blue, iluminación RGB 14 modos, mouse 7200 DPI con pesas ajustables.', 
    '["Teclado: Mecánico Anti-Ghosting Blue Switch", "Mouse: Óptico 7200 DPI 7 botones", "Cable: Mallado reforzado USB"]'::jsonb, 
    'https://images.unsplash.com/photo-1541140532154-b024d705b909?auto=format&fit=crop&w=800&q=80'
),
(
    'acc-02', 'Disco Sólido Kingston NV2 1TB SSD M.2 NVMe', 'accesorios', 'Accesorios & Periféricos', 
    58.00, 8.70, 5.00, 13.30, 85.00, 12, TRUE, 
    'Alta Velocidad', 'bg-blue-600', FALSE, 5.00, 39, 
    'Velocidades de lectura hasta 3500 MB/s y escritura hasta 2100 MB/s. PCIe 4.0 NVMe.', 
    '["Capacidad: 1 TB (1000 GB)", "Factor de forma: M.2 NVMe PCIe 4.0", "Lectura: 3500 MB/s", "Escritura: 2100 MB/s"]'::jsonb, 
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80'
);

-- ------------------------------------------------------------------------------
-- 6. TABLA: PRODUCTO_IMAGENES (MULTI-FOTO)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS producto_imagenes CASCADE;
CREATE TABLE producto_imagenes (
    id SERIAL PRIMARY KEY,
    producto_codigo VARCHAR(50) NOT NULL REFERENCES productos(codigo) ON UPDATE CASCADE ON DELETE CASCADE,
    imagen_url TEXT NOT NULL,
    orden INT DEFAULT 1
);

CREATE INDEX idx_producto_imagenes_codigo ON producto_imagenes(producto_codigo);

INSERT INTO producto_imagenes (producto_codigo, imagen_url, orden) VALUES
('lap-01', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80', 1),
('lap-01', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80', 2),
('lap-01', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', 3),
('lap-02', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', 1),
('lap-02', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', 2),
('mon-01', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80', 1),
('imp-01', 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80', 1),
('acc-01', 'https://images.unsplash.com/photo-1541140532154-b024d705b909?auto=format&fit=crop&w=800&q=80', 1);

-- ------------------------------------------------------------------------------
-- 7. TABLA: CUPONES_DESCUENTO
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS cupones_descuento CASCADE;
CREATE TABLE cupones_descuento (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL DEFAULT 'percent' CHECK (tipo IN ('percent', 'fixed')),
    valor NUMERIC(10,2) NOT NULL,
    compra_minima NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cupones_codigo ON cupones_descuento(codigo);

INSERT INTO cupones_descuento (codigo, tipo, valor, compra_minima, activo) VALUES
('SUMAKIT', 'percent', 10.00, 50.00, TRUE),
('GUARANDA', 'fixed', 5.00, 30.00, TRUE),
('BIENVENIDO', 'percent', 5.00, 0.00, TRUE);

-- ------------------------------------------------------------------------------
-- 8. TABLA: PEDIDOS Y FACTURAS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS pedidos CASCADE;
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    codigo_orden VARCHAR(50) NOT NULL UNIQUE,
    numero_factura VARCHAR(50) NOT NULL UNIQUE,
    cliente_email VARCHAR(150) NOT NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_telefono VARCHAR(10) NOT NULL,
    cliente_ciudad VARCHAR(100) NOT NULL,
    cliente_provincia VARCHAR(100) NOT NULL,
    cliente_direccion TEXT NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    costo_envio NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_pagado NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    metodo_pago VARCHAR(150) NOT NULL DEFAULT 'Transferencia Bancaria (Banco Pichincha: 2200807883)',
    comprobante_imagen TEXT,
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Preparación', 'Enviado', 'Entregado')),
    notas TEXT,
    fecha_pedido VARCHAR(50) NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pedidos_codigo ON pedidos(codigo_orden);
CREATE INDEX idx_pedidos_factura ON pedidos(numero_factura);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_email);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);

INSERT INTO pedidos (
    codigo_orden, numero_factura, cliente_email, cliente_nombre, cliente_telefono,
    cliente_ciudad, cliente_provincia, cliente_direccion, subtotal, descuento,
    costo_envio, total_pagado, metodo_pago, comprobante_imagen, estado, notas, fecha_pedido
) VALUES (
    'ST-849201',
    'FAC-001-000101',
    'drea@gmail.com',
    'Juan Fernando Morales',
    '0987654321',
    'Guaranda',
    'Bolívar',
    'Av. Guayaquil y Manabí, diagonal al Parque Central',
    1028.00,
    0.00,
    0.00,
    1028.00,
    'Transferencia Bancaria (Banco Pichincha: 2200807883)',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    'Entregado',
    'Entregar en horario de oficina',
    '24/08/2026'
);

-- ------------------------------------------------------------------------------
-- 9. TABLA: PEDIDO_DETALLES
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS pedido_detalles CASCADE;
CREATE TABLE pedido_detalles (
    id SERIAL PRIMARY KEY,
    pedido_codigo VARCHAR(50) NOT NULL REFERENCES pedidos(codigo_orden) ON UPDATE CASCADE ON DELETE CASCADE,
    producto_codigo VARCHAR(50) NOT NULL,
    producto_nombre VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(10,2) NOT NULL,
    total_item NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_detalles_pedido ON pedido_detalles(pedido_codigo);

INSERT INTO pedido_detalles (pedido_codigo, producto_codigo, producto_nombre, cantidad, precio_unitario, total_item) VALUES
('ST-849201', 'lap-01', 'Laptop Asus TUF Gaming A15', 1, 980.00, 980.00),
('ST-849201', 'acc-01', 'Combo Teclado Mecánico RGB + Mouse Gamer', 1, 48.00, 48.00);

-- ------------------------------------------------------------------------------
-- 10. TABLA: SERVICIOS_TECNOLOGICOS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS servicios_tecnologicos CASCADE;
CREATE TABLE servicios_tecnologicos (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE,
    titulo VARCHAR(150) NOT NULL,
    etiqueta VARCHAR(80) NOT NULL DEFAULT 'Servicio Especializado',
    descripcion TEXT NOT NULL,
    caracteristicas JSONB DEFAULT '[]'::jsonb,
    icono VARCHAR(50) DEFAULT 'wrench',
    cta_texto VARCHAR(100) DEFAULT 'Solicitar Servicio',
    mensaje_whatsapp TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO servicios_tecnologicos (slug, titulo, etiqueta, descripcion, caracteristicas, icono, cta_texto, mensaje_whatsapp) VALUES
(
    'soporte-hardware',
    'Soporte y Mantenimiento de Hardware',
    'Servicio Técnico Especializado',
    'Diagnóstico profundo, mantenimiento preventivo y correctivo para laptops, PCs de escritorio e impresoras en Guaranda.',
    '["Limpieza profunda y cambio de pasta térmica de alto rendimiento", "Reparación de placas madre y circuitos electrónicos", "Repotenciación con memorias RAM y discos de estado sólido (SSD)", "Cambio de pantallas, teclados, bisagras y baterías"]'::jsonb,
    'wrench',
    'Solicitar Mantenimiento',
    'Hola SUMAK IT, deseo cotizar un servicio de soporte técnico de hardware para mi equipo.'
),
(
    'desarrollo-software',
    'Desarrollo de Software a Medida',
    'Soluciones Digitales',
    'Diseñamos y programamos aplicaciones web, sistemas de facturación electrónica e inventario adaptados a tu negocio.',
    '["Desarrollo de tiendas online y páginas web corporativas", "Sistemas de facturación electrónica autorizada por el SRI", "Control de inventarios, puntos de venta (POS) y reportes", "Automatización de procesos empresariales y soporte continuo"]'::jsonb,
    'code',
    'Cotizar Proyecto de Software',
    'Hola SUMAK IT, me interesa cotizar el desarrollo de un software / página web para mi negocio.'
),
(
    'redes-infraestructura',
    'Redes, Conectividad y Seguridad',
    'Infraestructura IT',
    'Instalación y configuración de redes WiFi de alta cobertura, cableado estructurado y sistemas de videovigilancia.',
    '["Instalación de Access Points y repetidores WiFi Mesh", "Configuración de switches y routers empresariales", "Instalación de cámaras de seguridad y monitoreo remoto", "Mantenimiento preventivo de centros de datos y racks"]'::jsonb,
    'wifi',
    'Cotizar Redes y Cámaras',
    'Hola SUMAK IT, deseo cotizar la instalación o mantenimiento de redes y seguridad.'
);

-- ------------------------------------------------------------------------------
-- 11. TABLA: CAPACITACIONES_CURSOS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS capacitaciones_cursos CASCADE;
CREATE TABLE capacitaciones_cursos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    titulo VARCHAR(150) NOT NULL,
    nivel VARCHAR(50) NOT NULL DEFAULT 'Básico a Avanzado',
    duracion VARCHAR(50) NOT NULL DEFAULT '40 Horas',
    modalidad VARCHAR(50) NOT NULL DEFAULT 'Presencial y Online',
    precio NUMERIC(10,2) NOT NULL DEFAULT 45.00,
    descripcion TEXT NOT NULL,
    temario JSONB DEFAULT '[]'::jsonb,
    incluye JSONB DEFAULT '[]'::jsonb,
    imagen TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO capacitaciones_cursos (codigo, titulo, nivel, duracion, modalidad, precio, descripcion, temario, incluye, imagen) VALUES
(
    'CURSO-EXCEL',
    'Ofimática Profesional & Excel Avanzado para Negocios',
    'Básico a Avanzado',
    '30 Horas Prácticas',
    'Presencial en Guaranda / Online en vivo',
    45.00,
    'Domina fórmulas complejas, tablas dinámicas, dashboards interactivos y automatización con macros para empresas y profesionales.',
    '["Fórmulas lógicas, financieras y de búsqueda (BUSCARX, SI, CONTAR.SI)", "Tablas y gráficos dinámicos con segmentación de datos", "Creación de Dashboards profesionales para reportes", "Introducción a macros y automatización de procesos"]'::jsonb,
    '["Certificado con valor curricular", "Plantillas editables de Excel para finanzas", "Acceso a grabaciones de las clases", "Asesoría personalizada por tutor"]'::jsonb,
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
),
(
    'CURSO-MANT',
    'Ensamblaje, Mantenimiento y Reparación de Computadoras',
    '100% Práctico',
    '40 Horas en Laboratorio',
    'Presencial (Guaranda)',
    65.00,
    'Aprende a diagnosticar, reparar, optimizar y ensamblar computadoras de escritorio y laptops desde cero con herramientas profesionales.',
    '["Arquitectura de hardware: Procesadores, memorias, fuentes y placas", "Detección y solución de fallas electrónicas y de encendido", "Mantenimiento térmico profundo y cambio de componentes", "Instalación de sistemas operativos, drivers y antivirus"]'::jsonb,
    '["Prácticas con equipos reales de laboratorio", "Kit de herramientas y software de diagnóstico", "Certificado de aprobación técnica", "Guía para emprender tu propio taller técnico"]'::jsonb,
    'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80'
),
(
    'CURSO-WEB',
    'Fundamentos de Desarrollo Web y Programación',
    'Iniciación',
    '35 Horas',
    'Online interactivo con mentor',
    55.00,
    'Aprende a crear tus propios sitios web y aplicaciones interactivas utilizando HTML5, CSS3, JavaScript moderno y bases de datos.',
    '["Estructuración semántica con HTML5 y diseño moderno con CSS3/Tailwind", "Programación con JavaScript: lógica, variables, funciones y DOM", "Conexión a bases de datos y consumo de APIs", "Despliegue y publicación de páginas web en la nube"]'::jsonb,
    '["Proyecto final publicado en internet", "Certificado de desarrollador web inicial", "Repositorio de código y recursos", "Comunidad de apoyo en Discord/WhatsApp"]'::jsonb,
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'
);

-- ------------------------------------------------------------------------------
-- 12. TABLA: BLOG_ARTICULOS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS blog_articulos CASCADE;
CREATE TABLE blog_articulos (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(120) NOT NULL UNIQUE,
    titulo VARCHAR(255) NOT NULL,
    categoria VARCHAR(80) NOT NULL DEFAULT 'Tecnología',
    autor VARCHAR(100) NOT NULL DEFAULT 'Mario Dario Rea Tamami (SUMAK IT)',
    fecha VARCHAR(50) NOT NULL,
    resumen TEXT NOT NULL,
    contenido TEXT NOT NULL,
    imagen TEXT NOT NULL,
    lectura_minutos INT DEFAULT 4,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO blog_articulos (slug, titulo, categoria, autor, fecha, resumen, contenido, imagen, lectura_minutos) VALUES
(
    'guia-elegir-laptop-2026',
    'Guía 2026: Cómo elegir la laptop ideal para tu universidad, oficina o gaming',
    'Guías de Compra',
    'Mario Dario Rea Tamami',
    '24 de Agosto, 2026',
    'Descubre qué procesador, memoria RAM y almacenamiento necesitas realmente según el uso que le darás a tu equipo.',
    'Elegir una computadora portátil hoy en día puede resultar abrumador con tantas opciones en el mercado. En SUMAK IT te recomendamos tener en cuenta 3 factores clave:\n\n1. Procesador y Generación: Para labores de oficina o estudio, un procesador Intel Core i5 de 12va generación o un AMD Ryzen 5 es el estándar ideal. Si te dedicas al diseño gráfico o arquitectura, opta por Ryzen 7 o Core i7.\n\n2. Memoria RAM mínima: En 2026, 16 GB de RAM es la cantidad recomendada para trabajar con fluidez en Windows 11 sin que el equipo se congele.\n\n3. Disco Sólido SSD NVMe: Nunca compres un equipo con disco mecánico tradicional; los SSD NVMe M.2 ofrecen hasta 10 veces más velocidad de arranque.\n\nEn SUMAK IT Guaranda te asesoramos personalmente para que inviertas de forma inteligente.',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    4
),
(
    'mantenimiento-termico-computadoras',
    '¿Por qué tu laptop o PC se calienta y cómo prevenir daños irreparables?',
    'Mantenimiento',
    'Equipo Técnico SUMAK IT',
    '20 de Agosto, 2026',
    'El polvo y la pasta térmica seca son los peores enemigos de los circuitos electrónicos. Te explicamos cada cuánto realizar un mantenimiento.',
    'El sobrecalentamiento es la causa número uno de apagados repentinos y daños permanentes en procesadores y tarjetas de video. Con el paso de los meses, los ventiladores absorben pelusa del ambiente y la pasta térmica que transfiere el calor se seca por completo.\n\nRecomendaciones de SUMAK IT:\n• Realiza una limpieza y cambio de pasta térmica de alto rendimiento al menos una vez al año.\n• Evita colocar tu laptop directamente sobre cobijas, almohadas o superficies acolchadas que tapen las rejillas de ventilación.\n• En nuestro taller en Guaranda realizamos mantenimiento preventivo profesional con garantía.',
    'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80',
    5
),
(
    'ssd-vs-disco-mecanico-repotenciacion',
    'Discos SSD NVMe vs Discos Mecánicos: La repotenciación que le da vida nueva a tu equipo',
    'Hardware & Rendimiento',
    'Mario Dario Rea Tamami',
    '15 de Agosto, 2026',
    'Si tu computadora tarda minutos en encender, cambiar a un disco de estado sólido es la solución más rápida y económica.',
    'Muchos usuarios piensan que cuando una computadora se pone lenta deben comprar una nueva, pero en el 90% de los casos el cuello de botella es el disco duro mecánico tradicional (HDD).\n\nAl instalar un disco SSD Kingston o Western Digital en SUMAK IT, tu equipo pasa de encender en 2 minutos a encender en tan solo 8 segundos, los programas abren al instante y la respuesta general se transforma por completo.',
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
    3
);

-- ==============================================================================
-- FIN DEL SCRIPT POSTGRESQL PARA SUMAK IT
-- ==============================================================================
