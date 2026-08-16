// js/admin.js - Módulo del Panel de Administración del Bartender / Dueño

let currentAdminFilter = 'all';
let currentAdminTab = 'bookings';

document.addEventListener('DOMContentLoaded', () => {
    initAdminModule();
});

function initAdminModule() {
    renderAdminDashboard();
    initAdminTabs();
}

function initAdminTabs() {
    const tabBtns = document.querySelectorAll('.admin-nav-tab');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const targetTab = e.currentTarget.getAttribute('data-tab');
            switchAdminTab(targetTab);
        });
    });
}

function switchAdminTab(tabName) {
    currentAdminTab = tabName;
    const views = document.querySelectorAll('.admin-tab-view');
    views.forEach(v => v.style.display = 'none');

    const targetView = document.getElementById(`adminView_${tabName}`);
    if (targetView) targetView.style.display = 'block';

    if (tabName === 'bookings') {
        renderAdminDashboard();
    } else if (tabName === 'invitations') {
        renderAdminInvitationsList();
    } else if (tabName === 'checkin') {
        renderAdminCheckInModule();
    }
}

// Renderizar Reservas y Métricas
async function renderAdminDashboard() {
    const tableBody = document.getElementById('adminBookingsTableBody');
    if (!tableBody) return;

    const bookings = await window.DB.getBookings();

    // Métricas en Bs. y Conteo
    let totalRevenue = 0;
    let pendingCount = 0;
    let reviewCount = 0;
    let confirmedCount = 0;

    bookings.forEach(b => {
        if (b.status === 'confirmado') {
            totalRevenue += b.totalAmount;
            confirmedCount++;
        }
        if (b.status === 'pendiente') pendingCount++;
        if (b.status === 'revision') reviewCount++;
    });

    const revenueEl = document.getElementById('adminTotalRevenue');
    const pendingEl = document.getElementById('adminPendingCount');
    const reviewEl = document.getElementById('adminReviewCount');
    const confirmedEl = document.getElementById('adminConfirmedCount');

    if (revenueEl) revenueEl.innerText = `Bs. ${totalRevenue.toLocaleString('es-BO')}`;
    if (pendingEl) pendingEl.innerText = pendingCount;
    if (reviewEl) reviewEl.innerText = reviewCount;
    if (confirmedEl) confirmedEl.innerText = confirmedCount;

    // Filtrar tabla
    let filtered = bookings;
    if (currentAdminFilter !== 'all') {
        filtered = bookings.filter(b => b.status === currentAdminFilter);
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    No hay solicitudes registradas con el filtro seleccionado.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filtered.map(b => {
        let statusClass = b.status;
        let statusLabel = b.status === 'confirmado' ? 'CONFIRMADO' : (b.status === 'revision' ? 'EN REVISIÓN' : (b.status === 'pendiente' ? 'PENDIENTE' : 'CANCELADO'));

        return `
            <tr>
                <td><strong>${b.id}</strong></td>
                <td>
                    <strong style="color: #FFF; display: block;">${b.clientName}</strong>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${b.phone}</span>
                </td>
                <td>
                    <span style="display: block;">${b.eventType || 'Evento'} (${b.guests} personas)</span>
                    <span style="font-size: 0.8rem; color: var(--text-gold);">${b.location}</span>
                </td>
                <td>📅 ${b.date}</td>
                <td>
                    <strong style="color: var(--accent-gold);">Bs. ${b.totalAmount}</strong>
                    <span style="display: block; font-size: 0.75rem; color: var(--text-muted);">${b.invitationPackage || 'Sin Invitación'}</span>
                </td>
                <td>
                    <span class="status-pill ${statusClass}">${statusLabel}</span>
                </td>
                <td>
                    ${b.googleCalendarSynced ? `
                        <span style="color: #10B981; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
                            Sincronizado
                        </span>
                    ` : `
                        <button class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.75rem;" onclick="syncWithGoogleCalendar('${b.id}')">Sincronizar</button>
                    `}
                </td>
                <td>
                    <div class="action-btn-group">
                        ${b.status !== 'confirmado' ? `
                            <button class="btn-icon" title="Aprobar Pago y Confirmar" onclick="approvePayment('${b.id}')" style="color: #10B981; border-color: #10B981;">✓</button>
                        ` : ''}
                        ${b.status !== 'cancelado' ? `
                            <button class="btn-icon" title="Cancelar Solicitud" onclick="cancelBooking('${b.id}')" style="color: #EF4444; border-color: #EF4444;">✕</button>
                        ` : ''}
                        <button class="btn-icon" title="Ver Comprobante de Pago" onclick="viewPaymentProof('${b.id}')">👁️</button>
                        <button class="btn-icon" title="Enviar WhatsApp al Cliente" onclick="sendWhatsAppNotification('${b.phone}', '${b.clientName}', '${b.id}')">💬</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterAdminBookings(status, btnElem) {
    currentAdminFilter = status;
    const btns = document.querySelectorAll('.table-filter-group .filter-btn-sm');
    btns.forEach(b => b.classList.remove('active'));
    if (btnElem) btnElem.classList.add('active');
    renderAdminDashboard();
}

async function approvePayment(bookingId) {
    showToast(`⏳ Aprobando reserva ${bookingId}...`);
    await window.DB.updateBookingStatus(bookingId, 'confirmado');
    renderAdminDashboard();
    showToast(`✅ ¡Reserva ${bookingId} confirmada en Supabase! Notificación emitida.`);
}

async function cancelBooking(bookingId) {
    if (confirm(`¿Estás seguro de cancelar la reserva ${bookingId}?`)) {
        await window.DB.updateBookingStatus(bookingId, 'cancelado');
        renderAdminDashboard();
        showToast(`⚠️ Reserva ${bookingId} cancelada.`);
    }
}

async function viewPaymentProof(bookingId) {
    const bookings = await window.DB.getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const modalOverlay = document.getElementById('invitationModalOverlay');
    const modalContainer = document.getElementById('invitationModalContainer');
    
    if (modalOverlay && modalContainer) {
        modalContainer.innerHTML = `
            <div style="padding: 2rem; background: #0B132B; text-align: center; border-radius: var(--radius-lg); position: relative; max-width: 440px; margin: 0 auto; border: 1px solid var(--glass-border);">
                <button onclick="closeInvitationModal()" style="position: absolute; top: 1rem; right: 1rem; background: transparent; border: none; color: #FFF; font-size: 1.3rem; cursor: pointer;">✕</button>
                
                <h3 style="margin-bottom: 0.4rem; color: var(--accent-gold);">Comprobante QR Simple Bolivia</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">Cliente: ${booking.clientName} • ID: ${booking.id}</p>
                
                <div style="background: #FFF; padding: 1.5rem; border-radius: var(--radius-md); color: #000; text-align: left; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                    <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #19376D; padding-bottom: 0.5rem; margin-bottom: 0.75rem; font-weight: 800; color: #19376D;">
                        <span>BANCO NACIONAL DE BOLIVIA</span>
                        <span>QR SIMPLE</span>
                    </div>
                    <div style="font-size: 0.85rem; line-height: 1.6;">
                        <p><strong>Monto Pagado:</strong> <span style="color: #10B981; font-weight: bold; font-size: 1.1rem;">Bs. ${booking.totalAmount}</span></p>
                        <p><strong>Beneficiario:</strong> Bartender Pro Cochabamba S.R.L.</p>
                        <p><strong>Referencia:</strong> ${booking.id}</p>
                        <p><strong>Fecha:</strong> ${booking.date}</p>
                        <p><strong>Estado:</strong> <span style="color: #10B981; font-weight: bold;">TRANSACCIÓN EXITOSA</span></p>
                    </div>
                </div>

                <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: center;">
                    ${booking.status !== 'confirmado' ? `
                        <button class="btn btn-primary btn-sm" onclick="approvePayment('${booking.id}'); closeInvitationModal();">
                            ✅ Validar y Aprobar Reserva
                        </button>
                    ` : `
                        <span style="color: #10B981; font-weight: bold; font-size: 0.9rem;">✅ Reserva ya Confirmada</span>
                    `}
                </div>
            </div>
        `;
        modalOverlay.classList.add('active');
    }
}

async function syncWithGoogleCalendar(bookingId) {
    await window.DB.updateBookingCalendarSync(bookingId, true);
    renderAdminDashboard();
    showToast(`📅 Reserva ${bookingId} sincronizada con Google Calendar.`);
}

function sendWhatsAppNotification(phone, clientName, bookingId) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = `¡Hola ${clientName}! 🍸 Te saludamos de *Bartender Pro Cochabamba*. Confirmamos la recepción de tu reserva *${bookingId}* para tu evento. ¡Estamos preparando la mejor coctelería de la Llajta para ti! 🥂`;
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

// ====================================================================
// PESTAÑA: GESTIÓN DE INVITACIONES Y LISTA RSVP
// ====================================================================

async function renderAdminInvitationsList() {
    const container = document.getElementById('adminInvitationsGrid');
    if (!container) return;

    const invitations = await window.DB.getInvitations();

    container.innerHTML = invitations.map(inv => `
        <div class="inv-pkg-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <span class="badge-tag" style="background: rgba(212,175,55,0.2); color: var(--accent-gold);">${inv.type.toUpperCase()}</span>
                    <span style="font-size: 0.8rem; color: #10B981; font-weight: bold;">🟢 Activa</span>
                </div>
                <h3 style="font-size: 1.2rem; margin-bottom: 0.3rem; color: #FFF;">${inv.title}</h3>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">
                    📍 ${inv.location} • 📅 ${inv.date}
                </p>
                <div style="background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 1rem; font-size: 0.85rem;">
                    <span>👥 <strong>Invitados Confirmados:</strong> ${inv.confirmedCount || 0}</span>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="openInvitationModalBySlug('${inv.slug || inv.id}')">
                    👁️ Ver Web
                </button>
                <button class="btn btn-primary btn-sm" onclick="viewGuestsForInvitation('${inv.id}', '${inv.title}')" title="Ver Lista de Asistencia">
                    📋 Lista RSVP
                </button>
            </div>
        </div>
    `).join('');
}

async function viewGuestsForInvitation(invId, title) {
    const guests = await window.DB.getGuests(invId);
    const modalOverlay = document.getElementById('invitationModalOverlay');
    const modalContainer = document.getElementById('invitationModalContainer');
    
    if (modalOverlay && modalContainer) {
        modalContainer.innerHTML = `
            <div style="padding: 2rem; background: #0B132B; border-radius: var(--radius-lg); max-width: 580px; margin: 0 auto; border: 1px solid var(--glass-border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                    <div>
                        <h3 style="color: var(--accent-gold); font-size: 1.25rem;">Lista de Confirmados (RSVP)</h3>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${title}</span>
                    </div>
                    <button onclick="closeInvitationModal()" style="background: transparent; border: none; color: #FFF; font-size: 1.3rem; cursor: pointer;">✕</button>
                </div>

                <div style="max-height: 380px; overflow-y: auto;">
                    ${guests.length === 0 ? `
                        <p style="text-align: center; color: var(--text-muted); padding: 2rem;">Aún no hay invitados confirmados para este evento.</p>
                    ` : `
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--glass-border-subtle); color: var(--text-gold); text-align: left;">
                                    <th style="padding: 6px;">Invitado</th>
                                    <th style="padding: 6px;">PAX</th>
                                    <th style="padding: 6px;">Mesa</th>
                                    <th style="padding: 6px;">Ingreso</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${guests.map(g => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                        <td style="padding: 8px 6px;">
                                            <strong style="color: #FFF; display: block;">${g.guest_name || g.name}</strong>
                                            <span style="font-size: 0.75rem; color: var(--text-muted);">${g.phone || ''}</span>
                                        </td>
                                        <td style="padding: 8px 6px; font-weight: bold; color: var(--accent-gold);">${g.pax_count || 1}</td>
                                        <td style="padding: 8px 6px; color: var(--text-muted);">${g.table_number || 'General'}</td>
                                        <td style="padding: 8px 6px;">
                                            <span class="status-pill ${g.checked_in ? 'confirmado' : 'revision'}" style="font-size: 0.7rem;">
                                                ${g.checked_in ? 'EN EVENTO' : 'NO INGRESÓ'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>

                <div style="margin-top: 1.5rem; text-align: right;">
                    <button class="btn btn-outline btn-sm" onclick="closeInvitationModal()">Cerrar</button>
                </div>
            </div>
        `;
        modalOverlay.classList.add('active');
    }
}

// ====================================================================
// PESTAÑA: CONTROL DE ACCESO / VALIDADOR DE PASES QR EN PUERTA
// ====================================================================

function renderAdminCheckInModule() {
    const input = document.getElementById('qrScannerInput');
    if (input) input.focus();
}

async function validateGuestQrCode() {
    const input = document.getElementById('qrScannerInput');
    const resultBox = document.getElementById('qrScannerResultBox');

    if (!input || !input.value.trim()) {
        showToast('⚠️ Ingresa o escanea el código del pase QR.');
        return;
    }

    const token = input.value.trim();
    showToast('🔍 Verificando pase en Supabase...');

    const res = await window.DB.checkInGuest(token);

    if (res && res.success) {
        if (resultBox) {
            resultBox.style.display = 'block';
            resultBox.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.15); border: 2px solid #10B981; border-radius: var(--radius-md); padding: 1.5rem; text-align: center;">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎉</div>
                    <h3 style="color: #10B981; font-size: 1.3rem; margin-bottom: 0.3rem;">¡ACCESO PERMITIDO!</h3>
                    <p style="font-size: 1.1rem; color: #FFF; font-weight: bold; margin-bottom: 0.5rem;">${res.guest.guest_name || 'Invitado VIP'}</p>
                    <div style="display: inline-block; background: rgba(0,0,0,0.4); padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--accent-gold);">
                        <span>PAX: <strong>${res.guest.pax_count || 1} Persona(s)</strong></span> • 
                        <span>${res.guest.table_number || 'Mesa Asignada'}</span>
                    </div>
                    <p style="font-size: 0.75rem; color: #94A3B8; margin-top: 0.75rem;">Ingreso registrado a las ${new Date().toLocaleTimeString('es-BO')}</p>
                </div>
            `;
        }

        if (window.confetti) {
            window.confetti({ particleCount: 60, spread: 60 });
        }

        showToast(`✅ Acceso confirmado para ${res.guest.guest_name || 'Invitado'}`);
        input.value = '';
    }
}

// Supabase Config Modal Handlers
function openSupabaseConfigModal() {
    const modal = document.getElementById('supabaseConfigModal');
    const urlInput = document.getElementById('supabaseUrlInput');
    const keyInput = document.getElementById('supabaseKeyInput');
    const config = window.getSupabaseConfig();

    if (urlInput) urlInput.value = config.url;
    if (keyInput) keyInput.value = config.anonKey;

    if (modal) modal.classList.add('active');
}

function closeSupabaseConfigModal() {
    const modal = document.getElementById('supabaseConfigModal');
    if (modal) modal.classList.remove('active');
}

async function handleSaveSupabaseConfig() {
    const urlInput = document.getElementById('supabaseUrlInput');
    const keyInput = document.getElementById('supabaseKeyInput');

    if (!urlInput || !keyInput) return;

    showToast('⏳ Conectando con Supabase...');
    const success = await window.saveSupabaseConfig(urlInput.value, keyInput.value);

    if (success) {
        showToast('🟢 ¡Conectado exitosamente a Supabase PostgreSQL!');
        closeSupabaseConfigModal();
        renderAdminDashboard();
        if (window.renderDrinksCatalog) window.renderDrinksCatalog();
        if (window.renderInvitationShowcase) window.renderInvitationShowcase();
    } else {
        showToast('⚠️ No se pudo conectar. Verifica que la Anon Key sea correcta y hayas ejecutado supabase_schema.sql');
    }
}

window.renderAdminDashboard = renderAdminDashboard;
window.renderAdminInvitationsList = renderAdminInvitationsList;
window.filterAdminBookings = filterAdminBookings;
window.approvePayment = approvePayment;
window.cancelBooking = cancelBooking;
window.viewPaymentProof = viewPaymentProof;
window.syncWithGoogleCalendar = syncWithGoogleCalendar;
window.sendWhatsAppNotification = sendWhatsAppNotification;
window.switchAdminTab = switchAdminTab;
window.viewGuestsForInvitation = viewGuestsForInvitation;
window.validateGuestQrCode = validateGuestQrCode;
window.openSupabaseConfigModal = openSupabaseConfigModal;
window.closeSupabaseConfigModal = closeSupabaseConfigModal;
window.handleSaveSupabaseConfig = handleSaveSupabaseConfig;
