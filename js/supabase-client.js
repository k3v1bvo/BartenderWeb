// js/supabase-client.js - Conector y API CRUD Completa de Supabase para Bartender Pro Cochabamba

const DEFAULT_SUPABASE_URL = "https://rifhvogyfuhljfvgonqx.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZmh2b2d5ZnVobGpmdmdvbnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MTAzOTUsImV4cCI6MjEwMjQ4NjM5NX0.r3vcvap7eqnjNfc57ZTQxBubTQMWEou1RRFHkQOijuQ";
const STORAGE_KEY_URL = "bartender_supabase_url";
const STORAGE_KEY_ANON = "bartender_supabase_anon_key";

let supabaseClient = null;
let isConnectedToSupabase = false;
let realtimeChannels = [];

// Inicialización del cliente Supabase
function getSupabaseConfig() {
    return {
        url: localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_SUPABASE_URL,
        anonKey: localStorage.getItem(STORAGE_KEY_ANON) || DEFAULT_SUPABASE_ANON_KEY
    };
}

function saveSupabaseConfig(url, anonKey) {
    if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
    if (anonKey) localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    return initSupabase();
}

async function initSupabase() {
    const config = getSupabaseConfig();
    
    if (window.supabase && config.url && config.anonKey) {
        try {
            supabaseClient = window.supabase.createClient(config.url, config.anonKey);
            
            // Probar conexión rápida
            const { data, error } = await supabaseClient
                .from('packages')
                .select('id')
                .limit(1);

            if (!error) {
                isConnectedToSupabase = true;
                updateConnectionStatusBadge(true, "🟢 Supabase en Vivo");
                setupRealtimeListeners();
                console.log("✅ Conectado exitosamente a Supabase PostgreSQL:", config.url);
                return true;
            } else {
                console.warn("⚠️ Supabase conectado pero tabla no disponible aún (ejecutar SQL):", error.message);
                isConnectedToSupabase = false;
                updateConnectionStatusBadge(false, "🟡 Ejecutar supabase_schema.sql");
                return false;
            }
        } catch (err) {
            console.warn("⚠️ Error inicializando Supabase:", err);
            isConnectedToSupabase = false;
            updateConnectionStatusBadge(false, "🟡 Modo Local");
            return false;
        }
    } else {
        isConnectedToSupabase = false;
        updateConnectionStatusBadge(false, "⚙️ Conectar Supabase");
        return false;
    }
}

function updateConnectionStatusBadge(connected, text) {
    const badge = document.getElementById('supabaseStatusBadge');
    if (badge) {
        badge.innerHTML = `
            <span class="status-dot ${connected ? 'live' : 'offline'}"></span>
            <span>${text}</span>
        `;
        badge.className = `supabase-status-pill ${connected ? 'connected' : 'offline'}`;
    }
}

// Configurar suscripciones en tiempo real
function setupRealtimeListeners() {
    if (!supabaseClient || !isConnectedToSupabase) return;

    realtimeChannels.forEach(ch => supabaseClient.removeChannel(ch));
    realtimeChannels = [];

    const channel = supabaseClient
        .channel('schema-db-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'bookings' },
            (payload) => {
                if (window.showToast) {
                    if (payload.eventType === 'INSERT') {
                        window.showToast(`🔔 ¡Nueva Reserva Recibida! ${payload.new.client_name} - Bs. ${payload.new.total_amount}`);
                        triggerChime();
                    } else if (payload.eventType === 'UPDATE') {
                        window.showToast(`🔄 Reserva ${payload.new.id} actualizada: ${payload.new.status.toUpperCase()}`);
                    }
                }
                if (window.renderAdminDashboard) window.renderAdminDashboard();
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'invitation_guests' },
            (payload) => {
                if (window.showToast && payload.eventType === 'INSERT') {
                    window.showToast(`💌 ¡Nuevo RSVP Confirmado! ${payload.new.guest_name} (${payload.new.pax_count} PAX)`);
                    triggerChime();
                }
                if (window.renderAdminInvitationsList) window.renderAdminInvitationsList();
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'cocktails' },
            () => {
                if (window.renderDrinksCatalog) window.renderDrinksCatalog();
                if (window.renderAdminDrinksTable) window.renderAdminDrinksTable();
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'packages' },
            () => {
                if (window.renderPackagesCatalog) window.renderPackagesCatalog();
                if (window.renderAdminPackagesTable) window.renderAdminPackagesTable();
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'invitations' },
            () => {
                if (window.renderInvitationShowcase) window.renderInvitationShowcase();
                if (window.renderAdminInvitationsList) window.renderAdminInvitationsList();
            }
        )
        .subscribe();

    realtimeChannels.push(channel);
}

function triggerChime() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {}
}

// ====================================================================
// OBJETO DB: MÉTODOS CRUD COMPLETOS CON PERSISTENCIA EN SUPABASE
// ====================================================================

window.DB = {
    isConnected: () => isConnectedToSupabase,

    // ==================== CÓCTELES (CRUD) ====================
    async getDrinks(category = 'all') {
        if (isConnectedToSupabase && supabaseClient) {
            let query = supabaseClient
                .from('cocktails')
                .select('*')
                .order('sort_order', { ascending: true });
            if (category !== 'all') {
                query = query.eq('category', category);
            }
            const { data, error } = await query;
            if (!error && data && data.length > 0) {
                return data.map(d => ({
                    id: d.id,
                    name: d.name,
                    category: d.category,
                    alcohol: d.alcohol,
                    description: d.description,
                    image: d.image_url,
                    flairRating: d.flair_rating,
                    popular: d.is_popular,
                    badge: d.badge
                }));
            }
        }
        let drinks = window.BARTENDER_DATA.drinks;
        if (category !== 'all') {
            drinks = drinks.filter(d => d.category === category);
        }
        return drinks;
    },

    async createDrink(drinkData) {
        const id = 'd_' + Date.now();
        const record = {
            id: id,
            name: drinkData.name,
            category: drinkData.category || 'autor',
            alcohol: drinkData.alcohol || 'Con Alcohol',
            description: drinkData.description || '',
            image_url: drinkData.image || 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
            flair_rating: parseInt(drinkData.flairRating) || 5,
            badge: drinkData.badge || null,
            is_popular: Boolean(drinkData.popular)
        };

        if (isConnectedToSupabase && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('cocktails')
                .insert([record])
                .select();
            if (!error && data) return data[0];
        }

        // Fallback local
        const localItem = {
            id: id,
            name: record.name,
            category: record.category,
            alcohol: record.alcohol,
            description: record.description,
            image: record.image_url,
            flairRating: record.flair_rating,
            badge: record.badge,
            popular: record.is_popular
        };
        window.BARTENDER_DATA.drinks.push(localItem);
        return localItem;
    },

    async updateDrink(drinkId, drinkData) {
        const record = {
            name: drinkData.name,
            category: drinkData.category,
            alcohol: drinkData.alcohol,
            description: drinkData.description,
            image_url: drinkData.image,
            flair_rating: parseInt(drinkData.flairRating) || 5,
            badge: drinkData.badge || null,
            is_popular: Boolean(drinkData.popular)
        };

        if (isConnectedToSupabase && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('cocktails')
                .update(record)
                .eq('id', drinkId)
                .select();
            if (!error && data) return data[0];
        }

        const local = window.BARTENDER_DATA.drinks.find(d => d.id === drinkId);
        if (local) {
            Object.assign(local, drinkData);
        }
        return local;
    },

    async deleteDrink(drinkId) {
        if (isConnectedToSupabase && supabaseClient) {
            await supabaseClient.from('cocktails').delete().eq('id', drinkId);
        }
        window.BARTENDER_DATA.drinks = window.BARTENDER_DATA.drinks.filter(d => d.id !== drinkId);
        return true;
    },

    // ==================== PAQUETES DE COCTELERÍA (CRUD) ====================
    async getPackages() {
        if (isConnectedToSupabase && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('packages')
                .select('*')
                .order('sort_order', { ascending: true });
            if (!error && data && data.length > 0) {
                return data.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: parseFloat(p.price),
                    priceLabel: p.price_label || `Bs. ${p.price}`,
                    badge: p.badge,
                    description: p.description,
                    includes: p.includes || [],
                    capacity: p.capacity,
                    popular: p.is_popular
                }));
            }
        }
        return window.BARTENDER_DATA.packages;
    },

    async updatePackage(pkgId, pkgData) {
        const record = {
            name: pkgData.name,
            price: parseFloat(pkgData.price),
            description: pkgData.description,
            capacity: pkgData.capacity,
            badge: pkgData.badge,
            includes: pkgData.includes || []
        };

        if (isConnectedToSupabase && supabaseClient) {
            await supabaseClient.from('packages').update(record).eq('id', pkgId);
        }

        const local = window.BARTENDER_DATA.packages.find(p => p.id === pkgId);
        if (local) Object.assign(local, pkgData);
        return true;
    },

    // ==================== INVITACIONES DIGITALES (CRUD) ====================
    async getInvitations() {
        if (isConnectedToSupabase && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('invitations')
                .select('*, invitation_guests(id, pax_count)')
                .order('created_at', { ascending: false });
            if (!error && data && data.length > 0) {
                return data.map(inv => {
                    const guests = inv.invitation_guests || [];
                    const totalPax = guests.reduce((sum, g) => sum + (g.pax_count || 1), 0);
                    return {
                        id: inv.id,
                        slug: inv.slug,
                        title: inv.title,
                        type: inv.event_type,
                        hostName: inv.host_name,
                        partnerName: inv.partner_name,
                        location: inv.venue_name,
                        address: inv.venue_address,
                        mapsUrl: inv.maps_url,
                        date: inv.event_date,
                        time: inv.event_time,
                        themeColor: inv.theme_color,
                        bgStyle: inv.bg_style,
                        previewImage: inv.cover_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
                        description: inv.welcome_message || "Invitación Digital Interactiva con Confirmación RSVP.",
                        dressCode: inv.dress_code,
                        confirmedCount: guests.length,
                        totalPax: totalPax
                    };
                });
            }
        }
        return window.BARTENDER_DATA.invitationSamples;
    },

    async getInvitationBySlug(slugOrId) {
        if (isConnectedToSupabase && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('invitations')
                .select('*')
                .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
                .single();
            if (!error && data) {
                return {
                    id: data.id,
                    slug: data.slug,
                    title: data.title,
                    type: data.event_type,
                    hostName: data.host_name,
                    partnerName: data.partner_name,
                    location: data.venue_name,
                    address: data.venue_address,
                    mapsUrl: data.maps_url,
                    date: data.event_date,
                    time: data.event_time,
                    themeColor: data.theme_color,
                    bgStyle: data.bg_style,
                    previewImage: data.cover_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
                    description: data.welcome_message,
                    dressCode: data.dress_code,
                    enableRsvp: data.enable_rsvp,
                    enableMusic: data.enable_music
                };
            }
        }

        const local = window.BARTENDER_DATA.invitationSamples.find(s => s.id === slugOrId || s.slug === slugOrId || s.type === slugOrId);
        return local || window.BARTENDER_DATA.invitationSamples[0];
    },

    async createInvitation(invData) {
        const slug = (invData.slug || invData.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')).replace(/^-|-$/g, '');
        const record = {
            slug: slug,
            title: invData.title,
            event_type: invData.type || 'boda',
            host_name: invData.hostName,
            partner_name: invData.partnerName || null,
            event_date: invData.date,
            event_time: invData.time || '18:00 HRS',
            venue_name: invData.location,
            venue_address: invData.address || invData.location,
            maps_url: invData.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(invData.location + ' Cochabamba')}`,
            theme_color: invData.themeColor || '#D4AF37',
            bg_style: invData.bgStyle || 'boda-theme',
            cover_image_url: invData.coverImageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
            dress_code: invData.dressCode || 'Gala / Traje Formal',
            welcome_message: invData.welcomeMessage || 'Nos encantará contar con tu presencia en este momento tan especial.',
            enable_rsvp: true,
            enable_music: true,
            is_published: true
        };

        if (isConnectedToSupabase && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('invitations')
                .insert([record])
                .select();
            if (!error && data) {
                return data[0];
            } else {
                console.warn("Error guardando invitación en Supabase:", error);
            }
        }

        const localInv = {
            id: `sample-${slug}`,
            slug: slug,
            title: record.title,
            type: record.event_type,
            location: record.venue_name,
            date: record.event_date,
            time: record.event_time,
            themeColor: record.theme_color,
            bgStyle: record.bg_style,
            previewImage: record.cover_image_url,
            description: record.welcome_message,
            dressCode: record.dress_code
        };
        window.BARTENDER_DATA.invitationSamples.push(localInv);
        return localInv;
    },

    async updateInvitation(invId, invData) {
        const record = {
            title: invData.title,
            event_type: invData.type,
            host_name: invData.hostName,
            event_date: invData.date,
            event_time: invData.time,
            venue_name: invData.location,
            theme_color: invData.themeColor,
            bg_style: invData.bgStyle,
            dress_code: invData.dressCode,
            welcome_message: invData.welcomeMessage,
            updated_at: new Date().toISOString()
        };

        if (isConnectedToSupabase && supabaseClient) {
            await supabaseClient.from('invitations').update(record).eq('id', invId);
        }

        const local = window.BARTENDER_DATA.invitationSamples.find(i => i.id === invId || i.slug === invId);
        if (local) Object.assign(local, invData);
        return true;
    },

    async deleteInvitation(invId) {
        if (isConnectedToSupabase && supabaseClient) {
            await supabaseClient.from('invitations').delete().eq('id', invId);
        }
        window.BARTENDER_DATA.invitationSamples = window.BARTENDER_DATA.invitationSamples.filter(i => i.id !== invId && i.slug !== invId);
        return true;
    },

    // ==================== INVITADOS & RSVP (CRUD) ====================
    async getGuests(invitationId) {
        if (isConnectedToSupabase && supabaseClient) {
            let query = supabaseClient
                .from('invitation_guests')
                .select('*')
                .order('created_at', { ascending: false });
            if (invitationId) {
                query = query.eq('invitation_id', invitationId);
            }
            const { data, error } = await query;
            if (!error && data) return data;
        }

        return [
            {
                id: "g-101",
                guest_name: "Dr. Fernando Mercado & Sra.",
                phone: "+591 797 33410",
                pax_count: 2,
                status: "confirmado",
                table_number: "Mesa 4 - Honor",
                qr_token: "QR-BODA-MERCADO-881",
                checked_in: true,
                created_at: new Date().toISOString()
            },
            {
                id: "g-102",
                guest_name: "Ing. Claudia Torrico",
                phone: "+591 717 99012",
                pax_count: 1,
                status: "confirmado",
                table_number: "Mesa 8",
                qr_token: "QR-BODA-TORRICO-452",
                checked_in: false,
                created_at: new Date().toISOString()
            }
        ];
    },

    async submitRSVP(rsvpData) {
        const qrToken = `QR-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const record = {
            invitation_id: rsvpData.invitationId,
            guest_name: rsvpData.guestName,
            phone: rsvpData.phone || null,
            email: rsvpData.email || null,
            pax_count: parseInt(rsvpData.paxCount) || 1,
            status: 'confirmado',
            table_number: rsvpData.tableNumber || 'Mesa Recepción',
            qr_token: qrToken,
            special_notes: rsvpData.specialNotes || null,
            song_request: rsvpData.songRequest || null,
            checked_in: false
        };

        if (isConnectedToSupabase && supabaseClient && rsvpData.invitationId) {
            const { data, error } = await supabaseClient
                .from('invitation_guests')
                .insert([record])
                .select();
            if (!error && data) return data[0];
        }

        return record;
    },

    async addGuestManually(guestData) {
        return this.submitRSVP(guestData);
    },

    async deleteGuest(guestId) {
        if (isConnectedToSupabase && supabaseClient) {
            await supabaseClient.from('invitation_guests').delete().eq('id', guestId);
        }
        return true;
    },

    async checkInGuest(tokenOrId) {
        if (isConnectedToSupabase && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('invitation_guests')
                .update({ checked_in: true, checked_in_at: new Date().toISOString() })
                .or(`qr_token.eq.${tokenOrId},id.eq.${tokenOrId}`)
                .select();
            if (!error && data && data.length > 0) {
                return { success: true, guest: data[0] };
            }
        }

        return {
            success: true,
            guest: {
                guest_name: "Invitado Validado",
                pax_count: 2,
                table_number: "Mesa 4 VIP",
                checked_in: true
            }
        };
    },

    // ==================== RESERVAS ====================
    async getBookings() {
        if (isConnectedToSupabase && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false });
            if (!error && data) {
                return data.map(b => ({
                    id: b.id,
                    clientName: b.client_name,
                    phone: b.client_phone,
                    email: b.client_email,
                    eventType: b.event_type,
                    location: b.event_location,
                    date: b.event_date,
                    guests: b.guest_count,
                    package: b.package_name,
                    invitationPackage: b.invitation_package_name,
                    totalAmount: parseFloat(b.total_amount),
                    status: b.status,
                    googleCalendarSynced: b.google_calendar_synced,
                    paymentProofUrl: b.payment_proof_url,
                    createdAt: new Date(b.created_at).toLocaleDateString('es-BO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                }));
            }
        }
        return window.BARTENDER_DATA.sampleBookings;
    },

    async createBooking(bookingObj) {
        const id = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
        const record = {
            id: id,
            client_name: bookingObj.clientName,
            client_phone: bookingObj.clientPhone,
            client_email: bookingObj.clientEmail,
            event_type: bookingObj.eventType || "Evento Privado",
            event_date: bookingObj.eventDate,
            event_location: bookingObj.eventLocation,
            guest_count: bookingObj.guestsCount,
            package_id: bookingObj.packageId,
            package_name: bookingObj.packageName,
            invitation_package_id: bookingObj.invitationId !== 'inv-none' ? bookingObj.invitationId : null,
            invitation_package_name: bookingObj.invitationName,
            selected_drinks: bookingObj.selectedDrinks || [],
            total_amount: bookingObj.totalAmount,
            status: bookingObj.proofUploaded ? 'revision' : 'pendiente',
            payment_method: 'qr_simple',
            payment_proof_url: bookingObj.paymentProofUrl || (bookingObj.proofUploaded ? 'comprobante_qr_reciente.jpg' : null),
            google_calendar_synced: true,
            notes: bookingObj.notes || ''
        };

        if (isConnectedToSupabase && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('bookings')
                .insert([record])
                .select();
            if (!error && data) return data[0];
        }

        const localBooking = {
            id: id,
            clientName: record.client_name,
            phone: record.client_phone,
            email: record.client_email,
            eventType: record.event_type,
            location: record.event_location,
            date: record.event_date,
            guests: record.guest_count,
            package: record.package_name,
            invitationPackage: record.invitation_package_name,
            totalAmount: record.total_amount,
            status: record.status,
            googleCalendarSynced: true,
            paymentProofUrl: record.payment_proof_url,
            createdAt: "Hoy recién"
        };
        window.BARTENDER_DATA.sampleBookings.unshift(localBooking);
        return localBooking;
    },

    async updateBookingStatus(bookingId, newStatus) {
        if (isConnectedToSupabase && supabaseClient) {
            await supabaseClient
                .from('bookings')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', bookingId);
        }
        const local = window.BARTENDER_DATA.sampleBookings.find(b => b.id === bookingId);
        if (local) local.status = newStatus;
        return true;
    },

    async updateBookingCalendarSync(bookingId, synced = true) {
        if (isConnectedToSupabase && supabaseClient) {
            await supabaseClient
                .from('bookings')
                .update({ google_calendar_synced: synced })
                .eq('id', bookingId);
        }
        const local = window.BARTENDER_DATA.sampleBookings.find(b => b.id === bookingId);
        if (local) local.googleCalendarSynced = synced;
        return true;
    },

    // ==================== GALERÍA ====================
    async getGallery(category = 'all') {
        if (isConnectedToSupabase && supabaseClient) {
            let query = supabaseClient
                .from('gallery_items')
                .select('*')
                .order('sort_order', { ascending: true });
            if (category !== 'all') query = query.eq('category', category);
            const { data, error } = await query;
            if (!error && data && data.length > 0) {
                return data.map(g => ({
                    id: g.id,
                    title: g.title,
                    subtitle: g.subtitle,
                    category: g.category,
                    image: g.image_url
                }));
            }
        }
        let items = window.BARTENDER_DATA.gallery;
        if (category !== 'all') items = items.filter(g => g.category === category);
        return items;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});

window.initSupabase = initSupabase;
window.getSupabaseConfig = getSupabaseConfig;
window.saveSupabaseConfig = saveSupabaseConfig;
