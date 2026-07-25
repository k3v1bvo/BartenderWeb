// data.js - Datos completos para la maqueta de Bartender Pro Cochabamba

window.BARTENDER_DATA = {
    business: {
        name: "Bartender Pro Cochabamba",
        tagline: "Experiencia de Coctelería de Autor & Invitaciones Digitales para la Llajta",
        city: "Cochabamba, Bolivia",
        phone: "+591 797 12345",
        whatsapp: "59179712345",
        email: "contacto@bartenderprocbba.bo",
        address: "Av. Ballivián #642 (Paseo El Prado), Cochabamba",
        currency: "Bs.",
        rating: 4.9,
        eventsCount: "250+"
    },

    packages: [
        {
            id: "pkg-basico",
            name: "Paquete Básico - Barra Libre Esencial",
            popular: false,
            badge: "Ideal para reuniones íntimas",
            price: 850,
            priceLabel: "Bs. 850 / evento",
            description: "Barra libre profesional con lo esencial para deslumbrar a tus invitados sin complicaciones.",
            includes: [
                "1 Bartender profesional uniformado",
                "3 Cócteles a elección del menú estándar",
                "Barra móvil básica con iluminación LED",
                "Insumos de barra: hielos, cristalería, fruta y refrescos",
                "Servicio durante 4 horas continuas",
                "Sincronización de agenda con Google Calendar"
            ],
            capacity: "Hasta 40 personas"
        },
        {
            id: "pkg-premium",
            name: "Paquete Premium - Coctelería de Autor & Show",
            popular: true,
            badge: "MÁS POPULAR EN COCHABAMBA ⭐",
            price: 1600,
            priceLabel: "Bs. 1.600 / evento",
            description: "Una experiencia de coctelería interactiva con show de preparación Flair, insumos premium y Singani de altura.",
            includes: [
                "2 Bartenders profesionales + Mixólogo de Autor",
                "5 Cócteles exclusivos (Incluye tragos de autor con Singani)",
                "Show de Flair Bartending (Flameado y malabares de barra)",
                "Estación de Coctelería de lujo con neón personalizado",
                "Servicio de cristalería fina y shots de cortesía",
                "Servicio durante 6 horas continuas",
                "Integración con Confirmación de Pago por QR Simple"
            ],
            capacity: "Hasta 100 personas"
        },
        {
            id: "pkg-vip",
            name: "Paquete VIP Personalizado - Experiencia Elite",
            popular: false,
            badge: "Bodas y Grandes Eventos",
            price: 2800,
            priceLabel: "Bs. 2.800 / evento",
            description: "El servicio definitivo para bodas, graduaciones y grandes recepciones en Cochabamba con barra ilimitada a medida.",
            includes: [
                "3 Bartenders VIP + Sommelier de Coctelería",
                "Menú Abierto e ilimitado de Coctelería Nacional e Internacional",
                "Barra Móvil Temática de Lujo (Madera/Mármol con iluminación RGB)",
                "Pistola de humo aromático + Cocteles con Hielo Seco y Burbujas",
                "Servicio de Mozos de Barra incluidos",
                "Duración de hasta 8 horas de evento",
                "Incluye Descuento Especial en Paquetes de Invitaciones Digitales"
            ],
            capacity: "Más de 150 personas"
        }
    ],

    drinks: [
        {
            id: "d1",
            name: "Chuflay de Gala con Singani de Altura",
            category: "autor",
            price: "Incluido en Menú",
            alcohol: "Con Alcohol",
            description: "Singani Gran Reserva, Ginger Ale artesanal, gotas de limón de la llajta e infusión de hierbabuena fresca.",
            image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
            flairRating: 5,
            popular: true,
            badge: "Favorito Cochabambino"
        },
        {
            id: "d2",
            name: "Tumbo Sour Royale",
            category: "autor",
            price: "Incluido en Menú",
            alcohol: "Con Alcohol",
            description: "Cremoso cóctel de autor a base de pulpa natural de tumbo del valle, Singani 8 Estrellas, jarabe de goma y amargo de angostura.",
            image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80",
            flairRating: 5,
            popular: true,
            badge: "Coctelería de Autor"
        },
        {
            id: "d3",
            name: "Yungueño Pasión del Valle",
            category: "tradicional",
            price: "Incluido en Menú",
            alcohol: "Con Alcohol",
            description: "Mezcla refrescante de jugo de naranja natural recién exprimido, Singani tarijeño/potosino, toque de granadina y rodaja de maracuyá.",
            image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=80",
            flairRating: 4,
            popular: false
        },
        {
            id: "d4",
            name: "Garapiña Craft & Sparkle",
            category: "tradicional",
            price: "Incluido en Menú",
            alcohol: "Con Alcohol",
            description: "Reinterpretación de la clásica garapiña cochabambina con helado de canela, chicha gourmet clarificada y espuma de frutilla.",
            image: "https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=600&q=80",
            flairRating: 5,
            popular: true,
            badge: "Edición Cochabamba"
        },
        {
            id: "d5",
            name: "Gin Tonic Llajta Botanical",
            category: "clasico",
            price: "Incluido en Menú",
            alcohol: "Con Alcohol",
            description: "Gin craft infusionado con romero de Tiquipaya, bayas de enebro, pepino, tónica premium y humo de cedro.",
            image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80",
            flairRating: 4,
            popular: false
        },
        {
            id: "d6",
            name: "Mojito del Valle con Menta de Quillacollo",
            category: "clasico",
            price: "Incluido en Menú",
            alcohol: "Con Alcohol",
            description: "Ron blanco añejo, menta fresca del valle cochabambino, azúcar rubia, zumo de lima y agua con gas helada.",
            image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
            flairRating: 4,
            popular: true
        },
        {
            id: "d7",
            name: "Maracuyá Mocktail Zero",
            category: "sin_alcohol",
            price: "Incluido en Menú",
            alcohol: "Sin Alcohol",
            description: "Néctar concentrado de maracuyá, menta macerada, tónica de pomelo rosa y esferas explosivas de fruta.",
            image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80",
            flairRating: 3,
            popular: false,
            badge: "100% Mocktail"
        },
        {
            id: "d8",
            name: "Fernandito VIP Cochabamba",
            category: "tradicional",
            price: "Incluido en Menú",
            alcohol: "Con Alcohol",
            description: "Fernet artesanal con Coca-Cola servido en cristalería tallada con cubo de hielo XXL transparente.",
            image: "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80",
            flairRating: 3,
            popular: false
        }
    ],

    invitationPackages: [
        {
            id: "inv-basico",
            name: "Invitación Digital Básica",
            price: 150,
            priceLabel: "Bs. 150",
            description: "Diseño elegante en PDF interactivo en alta resolución, optimizado para enviar rápidamente por WhatsApp o Email.",
            features: [
                "Diseño personalizado según colores del evento",
                "Enlaces clickeables a ubicación de Google Maps",
                "Formato PDF optimizado para pantalla de celular",
                "Entrega garantizada en menos de 48 horas"
            ],
            badge: "Económico"
        },
        {
            id: "inv-premium",
            name: "Invitación Web Premium con RSVP + QR",
            price: 300,
            priceLabel: "Bs. 300",
            popular: true,
            description: "Página web propia del evento con confirmación de asistencia en tiempo real, cronómetro regresivo y pase QR individual.",
            features: [
                "Página web única del evento (ej: boda-carlos-y-sofia.bo)",
                "Formulario RSVP con filtro de lista de invitados",
                "Código QR único para control de ingreso",
                "Integración con Waze y Google Maps",
                "Sincronización con agenda de invitados (Google Calendar)"
            ],
            badge: "RECOMENDADO ⭐"
        },
        {
            id: "inv-combo",
            name: "Combo Evento VIP Completo",
            price: 450,
            priceLabel: "Bs. 450",
            description: "Todo lo del paquete Premium + QR impreso para mesa de bienvenida, galería de fotos post-evento y recordatorios por WhatsApp.",
            features: [
                "Página Web Premium + PDF para WhatsApp",
                "QR físico de alta calidad para Mesa de Bienvenida",
                "Módulo de Galería Interactiva post-evento para fotos de invitados",
                "Recordatorios automáticos por WhatsApp a 3 días y 1 día del evento",
                "Soporte VIP y cambios ilimitados de diseño"
            ],
            badge: "Experiencia Total"
        }
    ],

    invitationSamples: [
        {
            id: "sample-boda",
            title: "Boda Elegante - Carlos & Sofia",
            type: "boda",
            location: "Centro de Eventos El Bosque, Tiquipaya - Cochabamba",
            date: "15 de Octubre, 2026",
            time: "17:00 HRS",
            themeColor: "#D4AF37",
            bgStyle: "boda-theme",
            previewImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
            description: "Diseño sofisticado con detalles dorados, tipografía manuscrita luxury y pase VIP con QR para mesas asignadas."
        },
        {
            id: "sample-15",
            title: "Mis 15 Años - Valeria Alexandra",
            type: "quince",
            location: "Salón de Eventos Pairumani, Cochabamba",
            date: "28 de Noviembre, 2026",
            time: "20:00 HRS",
            themeColor: "#EC4899",
            bgStyle: "quince-theme",
            previewImage: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
            description: "Estilo jovial y deslumbrante con efecto Neón, música de fondo interactiva y votación de canciones para el DJ."
        },
        {
            id: "sample-corp",
            title: "Gala Corporativa - Grupo Empresarial Valle",
            type: "corporativo",
            location: "Hotel Cochabamba - Salón La Recoleta",
            date: "12 de Diciembre, 2026",
            time: "19:30 HRS",
            themeColor: "#3B82F6",
            bgStyle: "corp-theme",
            previewImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80",
            description: "Formato ejecutivo minimalista con registro de asistentes por QR, código de vestimenta y agenda del evento."
        }
    ],

    gallery: [
        {
            id: "g1",
            title: "Boda de Gala en El Bosque Tiquipaya",
            category: "bodas",
            image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
            subtitle: "Barra libre Premium con 5 tragos de autor y show flameado."
        },
        {
            id: "g2",
            title: "Fiesta de 15 Años en La Recoleta",
            category: "quince",
            image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80",
            subtitle: "Estación de mocktails Neón y bebidas sin alcohol coloridas."
        },
        {
            id: "g3",
            title: "Aniversario Corporativo Banco BNB Cochabamba",
            category: "corporativo",
            image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=80",
            subtitle: "Servicio VIP con cristalería tallada y Singani de Reserva."
        },
        {
            id: "g4",
            title: "Graduación Medicina UMSS - Pairumani",
            category: "graduaciones",
            image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
            subtitle: "Show de Flair Bartending y shots de bienvenida para 200 invitados."
        },
        {
            id: "g5",
            title: "Montaje de Barra Móvil de Madera & Dorado",
            category: "barras",
            image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=800&q=80",
            subtitle: "Nuestra barra propia adaptada a jardines en Tupuraya."
        },
        {
            id: "g6",
            title: "Coctelería de Autor con Frutas del Valle",
            category: "bodas",
            image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
            subtitle: "Tumbo Sour Royale y Chuflay de Gala listos para servir."
        }
    ],

    sampleBookings: [
        {
            id: "RES-8042",
            clientName: "Lic. Marcelo Arnez",
            phone: "+591 717 44882",
            email: "marcelo.arnez@gmail.com",
            eventType: "Boda de Gala",
            location: "Salon Country Club, Cochabamba",
            date: "2026-08-15",
            guests: 120,
            package: "Paquete Premium - Coctelería de Autor",
            invitationPackage: "Combo Evento VIP Completo",
            totalAmount: 2050,
            status: "confirmado",
            googleCalendarSynced: true,
            paymentProofUrl: "comprobante_qr_bnb_8042.jpg",
            createdAt: "2026-07-24 14:30"
        },
        {
            id: "RES-8043",
            clientName: "Dra. Natalia Villarroel",
            phone: "+591 797 99120",
            email: "nvillarroel@hotmail.com",
            eventType: "Cumpleaños 30",
            location: "Residencia Privada El Bosque, Tiquipaya",
            date: "2026-08-22",
            guests: 60,
            package: "Paquete Básico - Barra Libre",
            invitationPackage: "Invitación Web Premium con RSVP",
            totalAmount: 1150,
            status: "revision",
            googleCalendarSynced: true,
            paymentProofUrl: "comprobante_qr_union_8043.jpg",
            createdAt: "2026-07-25 09:15"
        },
        {
            id: "RES-8044",
            clientName: "Arq. Gonzalo Claros",
            phone: "+591 674 11029",
            email: "gclaros.arq@gmail.com",
            eventType: "Inauguración Sucursal",
            location: "Av. América Oeste #420, Cochabamba",
            date: "2026-09-05",
            guests: 80,
            package: "Paquete VIP Personalizado",
            invitationPackage: "Sin Invitación Digital",
            totalAmount: 2800,
            status: "pendiente",
            googleCalendarSynced: false,
            paymentProofUrl: null,
            createdAt: "2026-07-25 11:00"
        }
    ]
};
