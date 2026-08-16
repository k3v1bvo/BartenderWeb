-- ====================================================================
-- BARTENDER PRO COCHABAMBA & PLATAFORMA DE INVITACIONES DIGITALES
-- Script SQL Maestro para Supabase PostgreSQL
-- Proyecto: Events&invitations (rifhvogyfuhljfvgonqx)
-- ====================================================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. TABLA: CONFIGURACIÓN GENERAL DEL NEGOCIO (business_settings)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 3. TABLA: PAQUETES DE SERVICIO DE COCTELERÍA (packages)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    price_label TEXT,
    badge TEXT,
    description TEXT,
    includes TEXT[] NOT NULL DEFAULT '{}',
    capacity TEXT,
    is_popular BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 4. TABLA: CÓCTELES Y MENÚ (cocktails)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.cocktails (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('autor', 'tradicional', 'clasico', 'sin_alcohol')),
    alcohol TEXT DEFAULT 'Con Alcohol',
    price_info TEXT DEFAULT 'Incluido en Menú',
    description TEXT,
    image_url TEXT,
    flair_rating INT DEFAULT 4 CHECK (flair_rating BETWEEN 1 AND 5),
    is_popular BOOLEAN DEFAULT false,
    badge TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 5. TABLA: PAQUETES DE INVITACIONES DIGITALES (invitation_packages)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.invitation_packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    price_label TEXT,
    badge TEXT,
    description TEXT,
    features TEXT[] NOT NULL DEFAULT '{}',
    is_popular BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 6. TABLA: INVITACIONES DIGITALES DE EVENTOS (invitations)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('boda', 'quince', 'corporativo', 'cumpleanos', 'graduacion', 'aniversario', 'otro')),
    host_name TEXT NOT NULL,
    partner_name TEXT,
    event_date DATE NOT NULL,
    event_time TEXT NOT NULL,
    venue_name TEXT NOT NULL,
    venue_address TEXT,
    maps_url TEXT,
    theme_color TEXT DEFAULT '#D4AF37',
    bg_style TEXT DEFAULT 'boda-theme',
    cover_image_url TEXT,
    music_url TEXT,
    dress_code TEXT DEFAULT 'Gala / Traje Formal',
    welcome_message TEXT,
    max_guests INT DEFAULT 150,
    enable_rsvp BOOLEAN DEFAULT true,
    enable_music BOOLEAN DEFAULT true,
    custom_details JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 7. TABLA: INVITADOS & CONFIRMACIONES RSVP (invitation_guests)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.invitation_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    pax_count INT DEFAULT 1 CHECK (pax_count >= 1),
    status TEXT DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'rechazado', 'pendiente')),
    table_number TEXT,
    qr_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
    special_notes TEXT,
    song_request TEXT,
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 8. TABLA: RESERVAS Y SOLICITUDES DE EVENTOS (bookings)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    event_type TEXT NOT NULL DEFAULT 'Evento Privado',
    event_date DATE NOT NULL,
    event_location TEXT NOT NULL,
    guest_count INT DEFAULT 50,
    package_id TEXT REFERENCES public.packages(id) ON DELETE SET NULL,
    package_name TEXT,
    invitation_package_id TEXT REFERENCES public.invitation_packages(id) ON DELETE SET NULL,
    invitation_package_name TEXT,
    selected_drinks JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'revision', 'confirmado', 'cancelado')),
    payment_method TEXT DEFAULT 'qr_simple',
    payment_proof_url TEXT,
    google_calendar_synced BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 9. TABLA: GALERÍA DE EVENTOS REALES (gallery_items)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT NOT NULL CHECK (category IN ('bodas', 'quince', 'corporativo', 'graduaciones', 'barras')),
    image_url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 10. ÍNDICES DE RENDIMIENTO
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON public.invitations(slug);
CREATE INDEX IF NOT EXISTS idx_invitations_date ON public.invitations(event_date);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_inv_id ON public.invitation_guests(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_token ON public.invitation_guests(qr_token);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- ====================================================================
-- 11. HABILITACIÓN DE ROW LEVEL SECURITY (RLS) & POLÍTICAS
-- ====================================================================
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cocktails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública (Catálogo, Menú, Invitaciones activas)
DROP POLICY IF EXISTS "Public read settings" ON public.business_settings;
CREATE POLICY "Public read settings" ON public.business_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read packages" ON public.packages;
CREATE POLICY "Public read packages" ON public.packages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read cocktails" ON public.cocktails;
CREATE POLICY "Public read cocktails" ON public.cocktails FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read invitation_packages" ON public.invitation_packages;
CREATE POLICY "Public read invitation_packages" ON public.invitation_packages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read gallery_items" ON public.gallery_items;
CREATE POLICY "Public read gallery_items" ON public.gallery_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read published invitations" ON public.invitations;
CREATE POLICY "Public read published invitations" ON public.invitations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert invitations" ON public.invitations;
CREATE POLICY "Public insert invitations" ON public.invitations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update invitations" ON public.invitations;
CREATE POLICY "Public update invitations" ON public.invitations FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read guests for rsvp" ON public.invitation_guests;
CREATE POLICY "Public read guests for rsvp" ON public.invitation_guests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert rsvp guest" ON public.invitation_guests;
CREATE POLICY "Public insert rsvp guest" ON public.invitation_guests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update rsvp guest" ON public.invitation_guests;
CREATE POLICY "Public update rsvp guest" ON public.invitation_guests FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public insert booking" ON public.bookings;
CREATE POLICY "Public insert booking" ON public.bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read bookings" ON public.bookings;
CREATE POLICY "Public read bookings" ON public.bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public update booking status" ON public.bookings;
CREATE POLICY "Public update booking status" ON public.bookings FOR UPDATE USING (true);

-- ====================================================================
-- 12. REALTIME SUBSCRIPTIONS
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'invitations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.invitations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'invitation_guests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.invitation_guests;
    END IF;
END $$;

-- ====================================================================
-- 13. SEMILLA DE DATOS INICIALES (SEEDS PROFESIONALES)
-- ====================================================================

-- Configuración de Negocio
INSERT INTO public.business_settings (key, value, description)
VALUES 
(
    'company_info',
    '{
        "name": "Bartender Pro Cochabamba",
        "tagline": "Experiencia de Coctelería de Autor & Invitaciones Digitales para la Llajta",
        "city": "Cochabamba, Bolivia",
        "phone": "+591 797 12345",
        "whatsapp": "59179712345",
        "email": "contacto@bartenderprocbba.bo",
        "address": "Av. Ballivián #642 (Paseo El Prado), Cochabamba",
        "currency": "Bs.",
        "rating": 4.9,
        "eventsCount": "250+",
        "bank_accounts": {
            "bnb": {
                "bank": "Banco Nacional de Bolivia",
                "account_number": "350-0192847-1-09",
                "holder": "Bartender Pro Cochabamba S.R.L.",
                "qr_enabled": true
            },
            "union": {
                "bank": "Banco Unión",
                "account_number": "10000039281729",
                "holder": "Bartender Pro CBBA",
                "qr_enabled": true
            }
        }
    }'::jsonb,
    'Información general de contacto y cuentas de banco para QR Simple'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Paquetes de Coctelería
INSERT INTO public.packages (id, name, slug, price, price_label, badge, description, includes, capacity, is_popular, sort_order)
VALUES 
(
    'pkg-basico',
    'Paquete Básico - Barra Libre Esencial',
    'paquete-basico',
    850.00,
    'Bs. 850 / evento',
    'Ideal para reuniones íntimas',
    'Barra libre profesional con lo esencial para deslumbrar a tus invitados sin complicaciones.',
    ARRAY[
        '1 Bartender profesional uniformado',
        '3 Cócteles a elección del menú estándar',
        'Barra móvil básica con iluminación LED',
        'Insumos de barra: hielos, cristalería, fruta y refrescos',
        'Servicio durante 4 horas continuas',
        'Sincronización de agenda con Google Calendar'
    ],
    'Hasta 40 personas',
    false,
    1
),
(
    'pkg-premium',
    'Paquete Premium - Coctelería de Autor & Show',
    'paquete-premium',
    1600.00,
    'Bs. 1.600 / evento',
    'MÁS POPULAR EN COCHABAMBA ⭐',
    'Una experiencia de coctelería interactiva con show de preparación Flair, insumos premium y Singani de altura.',
    ARRAY[
        '2 Bartenders profesionales + Mixólogo de Autor',
        '5 Cócteles exclusivos (Incluye tragos de autor con Singani)',
        'Show de Flair Bartending (Flameado y malabares de barra)',
        'Estación de Coctelería de lujo con neón personalizado',
        'Servicio de cristalería fina y shots de cortesía',
        'Servicio durante 6 horas continuas',
        'Integración con Confirmación de Pago por QR Simple'
    ],
    'Hasta 100 personas',
    true,
    2
),
(
    'pkg-vip',
    'Paquete VIP Personalizado - Experiencia Elite',
    'paquete-vip',
    2800.00,
    'Bs. 2.800 / evento',
    'Bodas y Grandes Eventos',
    'El servicio definitivo para bodas, graduaciones y grandes recepciones en Cochabamba con barra ilimitada a medida.',
    ARRAY[
        '3 Bartenders VIP + Sommelier de Coctelería',
        'Menú Abierto e ilimitado de Coctelería Nacional e Internacional',
        'Barra Móvil Temática de Lujo (Madera/Mármol con iluminación RGB)',
        'Pistola de humo aromático + Cocteles con Hielo Seco y Burbujas',
        'Servicio de Mozos de Barra incluidos',
        'Duración de hasta 8 horas de evento',
        'Incluye Descuento Especial en Paquetes de Invitaciones Digitales'
    ],
    'Más de 150 personas',
    false,
    3
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    includes = EXCLUDED.includes,
    description = EXCLUDED.description;

-- Menú de Cócteles
INSERT INTO public.cocktails (id, name, category, alcohol, description, image_url, flair_rating, is_popular, badge, sort_order)
VALUES 
(
    'd1',
    'Chuflay de Gala con Singani de Altura',
    'autor',
    'Con Alcohol',
    'Singani Gran Reserva, Ginger Ale artesanal, gotas de limón de la llajta e infusión de hierbabuena fresca.',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    5,
    true,
    'Favorito Cochabambino',
    1
),
(
    'd2',
    'Tumbo Sour Royale',
    'autor',
    'Con Alcohol',
    'Cremoso cóctel de autor a base de pulpa natural de tumbo del valle, Singani 8 Estrellas, jarabe de goma y amargo de angostura.',
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
    5,
    true,
    'Coctelería de Autor',
    2
),
(
    'd3',
    'Yungueño Pasión del Valle',
    'tradicional',
    'Con Alcohol',
    'Mezcla refrescante de jugo de naranja natural recién exprimido, Singani tarijeño/potosino, toque de granadina y rodaja de maracuyá.',
    'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=80',
    4,
    false,
    'Clásico Boliviano',
    3
),
(
    'd4',
    'Garapiña Craft & Sparkle',
    'tradicional',
    'Con Alcohol',
    'Reinterpretación de la clásica garapiña cochabambina con helado de canela, chicha gourmet clarificada y espuma de frutilla.',
    'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=600&q=80',
    5,
    true,
    'Edición Cochabamba',
    4
),
(
    'd5',
    'Gin Tonic Llajta Botanical',
    'clasico',
    'Con Alcohol',
    'Gin craft infusionado con romero de Tiquipaya, bayas de enebro, pepino, tónica premium y humo de cedro.',
    'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
    4,
    false,
    'Botánico',
    5
),
(
    'd6',
    'Mojito del Valle con Menta de Quillacollo',
    'clasico',
    'Con Alcohol',
    'Ron blanco añejo, menta fresca del valle cochabambino, azúcar rubia, zumo de lima y agua con gas helada.',
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    4,
    true,
    'Refrescante',
    6
),
(
    'd7',
    'Maracuyá Mocktail Zero',
    'sin_alcohol',
    'Sin Alcohol',
    'Néctar concentrado de maracuyá, menta macerada, tónica de pomelo rosa y esferas explosivas de fruta.',
    'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80',
    3,
    false,
    '100% Mocktail',
    7
),
(
    'd8',
    'Fernandito VIP Cochabamba',
    'tradicional',
    'Con Alcohol',
    'Fernet artesanal con Coca-Cola servido en cristalería tallada con cubo de hielo XXL transparente.',
    'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80',
    3,
    false,
    'Fiesta',
    8
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url;

-- Paquetes de Invitaciones Digitales
INSERT INTO public.invitation_packages (id, name, price, price_label, badge, description, features, is_popular, sort_order)
VALUES 
(
    'inv-basico',
    'Invitación Digital Básica PDF',
    150.00,
    'Bs. 150',
    'Económico',
    'Diseño elegante en PDF interactivo en alta resolución, optimizado para enviar rápidamente por WhatsApp o Email.',
    ARRAY[
        'Diseño personalizado según colores del evento',
        'Enlaces clickeables a ubicación de Google Maps',
        'Formato PDF optimizado para pantalla de celular',
        'Entrega garantizada en menos de 48 horas'
    ],
    false,
    1
),
(
    'inv-premium',
    'Invitación Web Premium con RSVP + QR',
    300.00,
    'Bs. 300',
    'RECOMENDADO ⭐',
    'Página web propia del evento con confirmación de asistencia en tiempo real, cronómetro regresivo y pase QR individual.',
    ARRAY[
        'Página web única del evento con enlace compartible',
        'Formulario RSVP con filtro y registro de acompañantes',
        'Código QR único para control de ingreso en puerta',
        'Integración con Waze y Google Maps Cochabamba',
        'Sincronización con agenda de invitados (Google Calendar)'
    ],
    true,
    2
),
(
    'inv-combo',
    'Combo Evento VIP Completo',
    450.00,
    'Bs. 450',
    'Experiencia Total',
    'Todo lo del paquete Premium + QR impreso para mesa de bienvenida, galería de fotos post-evento y recordatorios por WhatsApp.',
    ARRAY[
        'Página Web Premium + PDF para WhatsApp',
        'QR físico de alta calidad para Mesa de Bienvenida',
        'Módulo de Galería Interactiva post-evento para fotos de invitados',
        'Recordatorios automáticos por WhatsApp a 3 días y 1 día del evento',
        'Soporte VIP y cambios ilimitados de diseño'
    ],
    false,
    3
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    features = EXCLUDED.features;

-- Invitaciones de Ejemplo en Supabase
INSERT INTO public.invitations (
    id, slug, title, event_type, host_name, partner_name, event_date, event_time, 
    venue_name, venue_address, maps_url, theme_color, bg_style, cover_image_url, 
    dress_code, welcome_message, max_guests, enable_rsvp, is_published
)
VALUES 
(
    'a1000000-0000-0000-0000-000000000001',
    'boda-carlos-sofia',
    'Boda Carlos & Sofía',
    'boda',
    'Carlos Gutierrez',
    'Sofía Valenzuela',
    '2026-10-15',
    '17:00 HRS',
    'Centro de Eventos El Bosque',
    'Av. Ecológica Km 4.5, Tiquipaya, Cochabamba',
    'https://maps.google.com/?q=Tiquipaya+Cochabamba',
    '#D4AF37',
    'boda-theme',
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    'Rigurosa Gala / Smoking & Vestido Largo',
    'Nos llena de felicidad celebrar el día más importante de nuestras vidas junto a ti. Por favor confirma tu asistencia para reservar tu pase y mesa de honor.',
    150,
    true,
    true
),
(
    'a2000000-0000-0000-0000-000000000002',
    '15-valeria',
    'Mis 15 Años - Valeria Alexandra',
    'quince',
    'Valeria Alexandra Flores',
    NULL,
    '2026-11-28',
    '20:00 HRS',
    'Salón de Eventos Pairumani',
    'Camino a Pairumani s/n, Cochabamba',
    'https://maps.google.com/?q=Pairumani+Cochabamba',
    '#EC4899',
    'quince-theme',
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
    'Elegante & Juvenil (Neón Glow)',
    '¡Llegó la noche de mis 15! Ven a celebrar conmigo en una fiesta inolvidable con estación de mocktails y cócteles neón.',
    120,
    true,
    true
),
(
    'a3000000-0000-0000-0000-000000000003',
    'gala-bnb-valle',
    'Gala Corporativa - Grupo Empresarial Valle',
    'corporativo',
    'Lic. Gonzalo Arnez',
    NULL,
    '2026-12-12',
    '19:30 HRS',
    'Hotel Cochabamba - Salón La Recoleta',
    'Plaza Quintanilla / La Recoleta, Cochabamba',
    'https://maps.google.com/?q=Hotel+Cochabamba',
    '#3B82F6',
    'corp-theme',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    'Traje Ejecutivo / Cocktail Formal',
    'El Directorio General tiene el agrado de invitar a su personal ejecutivo y socios estratégicos a la Cena Anual de Gala y Reconocimientos.',
    200,
    true,
    true
)
ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title,
    event_date = EXCLUDED.event_date,
    venue_name = EXCLUDED.venue_name;

-- Invitados Confirmados RSVP de Ejemplo
INSERT INTO public.invitation_guests (
    id, invitation_id, guest_name, phone, email, pax_count, status, table_number, qr_token, special_notes, checked_in
)
VALUES 
(
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Dr. Fernando Mercado & Sra.',
    '+591 797 33410',
    'fmercado@gmail.com',
    2,
    'confirmado',
    'Mesa 4 - Familia Real',
    'QR-BODA-MERCADO-881',
    'Opción de trago sin alcohol para acompañante',
    true
),
(
    'b2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Ing. Claudia Torrico',
    '+591 717 99012',
    'claudiat@hotmail.com',
    1,
    'confirmado',
    'Mesa 8 - Amigos Tiquipaya',
    'QR-BODA-TORRICO-452',
    'Felicitaciones a los novios',
    false
),
(
    'b3000000-0000-0000-0000-000000000003',
    'a2000000-0000-0000-0000-000000000002',
    'Mateo Rojas & Amigos',
    '+591 674 55102',
    'mateo.rojas@gmail.com',
    3,
    'confirmado',
    'Mesa Neón 2',
    'QR-15-ROJAS-993',
    '¡Poner reggaeton clásico!',
    false
)
ON CONFLICT (id) DO NOTHING;

-- Reservas de Ejemplo
INSERT INTO public.bookings (
    id, client_name, client_phone, client_email, event_type, event_date, event_location, 
    guest_count, package_id, package_name, invitation_package_id, invitation_package_name, 
    total_amount, status, payment_method, payment_proof_url, google_calendar_synced, created_at
)
VALUES 
(
    'RES-8042',
    'Lic. Marcelo Arnez',
    '+591 717 44882',
    'marcelo.arnez@gmail.com',
    'Boda de Gala',
    '2026-08-15',
    'Salon Country Club, Cochabamba',
    120,
    'pkg-premium',
    'Paquete Premium - Coctelería de Autor',
    'inv-combo',
    'Combo Evento VIP Completo',
    2050.00,
    'confirmado',
    'qr_simple',
    'comprobante_qr_bnb_8042.jpg',
    true,
    NOW() - INTERVAL '2 days'
),
(
    'RES-8043',
    'Dra. Natalia Villarroel',
    '+591 797 99120',
    'nvillarroel@hotmail.com',
    'Cumpleaños 30',
    '2026-08-22',
    'Residencia Privada El Bosque, Tiquipaya',
    60,
    'pkg-basico',
    'Paquete Básico - Barra Libre',
    'inv-premium',
    'Invitación Web Premium con RSVP',
    1150.00,
    'revision',
    'qr_simple',
    'comprobante_qr_union_8043.jpg',
    true,
    NOW() - INTERVAL '1 day'
),
(
    'RES-8044',
    'Arq. Gonzalo Claros',
    '+591 674 11029',
    'gclaros.arq@gmail.com',
    'Inauguración Sucursal',
    '2026-09-05',
    'Av. América Oeste #420, Cochabamba',
    80,
    'pkg-vip',
    'Paquete VIP Personalizado',
    NULL,
    'Sin Invitación Digital',
    2800.00,
    'pendiente',
    'qr_simple',
    NULL,
    false,
    NOW() - INTERVAL '4 hours'
)
ON CONFLICT (id) DO UPDATE SET 
    status = EXCLUDED.status,
    total_amount = EXCLUDED.total_amount;

-- Galería de Eventos
INSERT INTO public.gallery_items (id, title, subtitle, category, image_url, sort_order)
VALUES 
(
    'g1',
    'Boda de Gala en El Bosque Tiquipaya',
    'Barra libre Premium con 5 tragos de autor y show flameado.',
    'bodas',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    1
),
(
    'g2',
    'Fiesta de 15 Años en La Recoleta',
    'Estación de mocktails Neón y bebidas sin alcohol coloridas.',
    'quince',
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
    2
),
(
    'g3',
    'Aniversario Corporativo Banco BNB Cochabamba',
    'Servicio VIP con cristalería tallada y Singani de Reserva.',
    'corporativo',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=80',
    3
),
(
    'g4',
    'Graduación Medicina UMSS - Pairumani',
    'Show de Flair Bartending y shots de bienvenida para 200 invitados.',
    'graduaciones',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    4
),
(
    'g5',
    'Montaje de Barra Móvil de Madera & Dorado',
    'Nuestra barra propia adaptada a jardines en Tupuraya.',
    'barras',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=800&q=80',
    5
),
(
    'g6',
    'Coctelería de Autor con Frutas del Valle',
    'Tumbo Sour Royale y Chuflay de Gala listos para servir.',
    'bodas',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    6
)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    image_url = EXCLUDED.image_url;

-- Fin del script SQL
