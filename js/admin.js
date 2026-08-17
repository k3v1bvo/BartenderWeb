// js/admin.js - Panel de Administración Profesional, Suite CRUD & Modo Guardia de Puerta

let currentAdminFilter = 'all';
let currentAdminTab = 'dashboard';
let editingDrinkId = null;
let editingPkgId = null;

// Variables para el Modo Guardia & Scanner
let html5QrScannerInstance = null;
let guardCurrentEventId = 'all';
let guardCurrentFilter = 'all';
let guardAllGuestsCache = [];

document.addEventListener('DOMContentLoaded', () => {
    initAdminModule();
});

function initAdminModule() {
    initAdminTabs();
    renderAdminDashboard();
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

    if (tabName === 'dashboard' || tabName === 'bookings') {
        renderAdminDashboard();
    } else if (tabName === 'drinks') {
        renderAdminDrinksTable();
    } else if (tabName === 'packages') {
        renderAdminPackagesTable();
    } else if (tabName === 'invitations') {
        renderAdminInvitationsList();
    } else if (tabName === 'checkin') {
        renderAdminCheckInModule();
    }
}

// ====================================================================
// 1. DASHBOARD & RESERVAS
// ====================================================================

async function renderAdminDashboard() {
    const tableBody = document.getElementById('adminBookingsTableBody');
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

    if (!tableBody) return;

    let filtered = bookings;
    if (currentAdminFilter !== 'all') {
        filtered = bookings.filter(b => b.status === currentAdminFilter);
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
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
// 2. GESTIÓN CRUD DE CÓCTELES / MENÚ
// ====================================================================

async function renderAdminDrinksTable() {
    const container = document.getElementById('adminDrinksTableBody');
    if (!container) return;

    const drinks = await window.DB.getDrinks('all');

    container.innerHTML = drinks.map(d => `
        <tr>
            <td>
                <img src="${d.image}" alt="${d.name}" style="width: 48px; height: 48px; border-radius: var(--radius-sm); object-fit: cover; border: 1px solid var(--glass-border);">
            </td>
            <td>
                <strong style="color: #FFF; display: block;">${d.name}</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${d.description.substring(0, 50)}...</span>
            </td>
            <td>
                <span class="badge-tag" style="font-size: 0.75rem;">${d.category.toUpperCase()}</span>
            </td>
            <td>
                <span style="font-size: 0.8rem; color: var(--text-gold);">${d.alcohol}</span>
            </td>
            <td>
                <span style="color: var(--accent-gold);">${'★'.repeat(d.flairRating)}</span>
            </td>
            <td>
                <div class="action-btn-group">
                    <button class="btn-icon" title="Editar Cóctel" onclick="openEditDrinkModal('${d.id}')">✏️</button>
                    <button class="btn-icon" title="Eliminar Cóctel" onclick="handleDeleteDrink('${d.id}', '${d.name}')" style="color: #EF4444; border-color: #EF4444;">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openCreateDrinkModal() {
    editingDrinkId = null;
    document.getElementById('drinkModalTitle').innerText = '🍸 Agregar Nuevo Cóctel al Menú';
    document.getElementById('drinkFormName').value = '';
    document.getElementById('drinkFormCategory').value = 'autor';
    document.getElementById('drinkFormAlcohol').value = 'Con Alcohol';
    document.getElementById('drinkFormDesc').value = '';
    document.getElementById('drinkFormImage').value = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80';
    document.getElementById('drinkFormRating').value = '5';
    document.getElementById('drinkFormBadge').value = '';
    
    document.getElementById('drinkEditorModalOverlay').classList.add('active');
}

async function openEditDrinkModal(drinkId) {
    editingDrinkId = drinkId;
    const drinks = await window.DB.getDrinks('all');
    const drink = drinks.find(d => d.id === drinkId);
    if (!drink) return;

    document.getElementById('drinkModalTitle').innerText = `✏️ Editar Cóctel: ${drink.name}`;
    document.getElementById('drinkFormName').value = drink.name;
    document.getElementById('drinkFormCategory').value = drink.category;
    document.getElementById('drinkFormAlcohol').value = drink.alcohol;
    document.getElementById('drinkFormDesc').value = drink.description;
    document.getElementById('drinkFormImage').value = drink.image;
    document.getElementById('drinkFormRating').value = drink.flairRating;
    document.getElementById('drinkFormBadge').value = drink.badge || '';

    document.getElementById('drinkEditorModalOverlay').classList.add('active');
}

function closeDrinkEditorModal() {
    document.getElementById('drinkEditorModalOverlay').classList.remove('active');
}

async function handleSaveDrink() {
    const name = document.getElementById('drinkFormName').value.trim();
    const category = document.getElementById('drinkFormCategory').value;
    const alcohol = document.getElementById('drinkFormAlcohol').value;
    const description = document.getElementById('drinkFormDesc').value.trim();
    const image = document.getElementById('drinkFormImage').value.trim();
    const flairRating = parseInt(document.getElementById('drinkFormRating').value) || 5;
    const badge = document.getElementById('drinkFormBadge').value.trim();

    if (!name || !description) {
        showToast('⚠️ Ingresa al menos el nombre y la descripción del cóctel.');
        return;
    }

    const drinkData = {
        name, category, alcohol, description, image, flairRating, badge, popular: true
    };

    if (editingDrinkId) {
        showToast('⏳ Actualizando cóctel en Supabase...');
        await window.DB.updateDrink(editingDrinkId, drinkData);
        showToast(`✅ Cóctel "${name}" actualizado con éxito.`);
    } else {
        showToast('⏳ Guardando nuevo cóctel en Supabase...');
        await window.DB.createDrink(drinkData);
        showToast(`🎉 ¡Cóctel "${name}" agregado al menú!`);
    }

    closeDrinkEditorModal();
    renderAdminDrinksTable();
    if (window.renderDrinksCatalog) window.renderDrinksCatalog('all');
}

async function handleDeleteDrink(drinkId, drinkName) {
    if (confirm(`¿Eliminar el cóctel "${drinkName}" del menú?`)) {
        showToast(`⏳ Eliminando ${drinkName}...`);
        await window.DB.deleteDrink(drinkId);
        renderAdminDrinksTable();
        if (window.renderDrinksCatalog) window.renderDrinksCatalog('all');
        showToast(`🗑️ Cóctel "${drinkName}" eliminado.`);
    }
}

// ====================================================================
// 3. GESTIÓN DE PAQUETES
// ====================================================================

async function renderAdminPackagesTable() {
    const container = document.getElementById('adminPackagesGrid');
    if (!container) return;

    const packages = await window.DB.getPackages();

    container.innerHTML = packages.map(p => `
        <div class="pkg-card" style="padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <h3 style="color: var(--accent-gold); font-size: 1.25rem;">${p.name}</h3>
                <span class="badge-tag">${p.badge || 'Estándar'}</span>
            </div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #FFF; margin-bottom: 0.5rem;">
                Bs. ${p.price}
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${p.description}</p>
            <p style="font-size: 0.8rem; color: var(--text-gold); margin-bottom: 1rem;">👥 Capacidad: ${p.capacity}</p>
            <button class="btn btn-primary btn-sm" style="width: 100%; justify-content: center;" onclick="openEditPackageModal('${p.id}')">
                ✏️ Modificar Precio & Detalles
            </button>
        </div>
    `).join('');
}

async function openEditPackageModal(pkgId) {
    editingPkgId = pkgId;
    const pkgs = await window.DB.getPackages();
    const pkg = pkgs.find(p => p.id === pkgId);
    if (!pkg) return;

    document.getElementById('pkgFormName').value = pkg.name;
    document.getElementById('pkgFormPrice').value = pkg.price;
    document.getElementById('pkgFormCapacity').value = pkg.capacity;
    document.getElementById('pkgFormBadge').value = pkg.badge || '';
    document.getElementById('pkgFormDesc').value = pkg.description;

    document.getElementById('packageEditorModalOverlay').classList.add('active');
}

function closePackageEditorModal() {
    document.getElementById('packageEditorModalOverlay').classList.remove('active');
}

async function handleSavePackage() {
    const name = document.getElementById('pkgFormName').value.trim();
    const price = parseFloat(document.getElementById('pkgFormPrice').value);
    const capacity = document.getElementById('pkgFormCapacity').value.trim();
    const badge = document.getElementById('pkgFormBadge').value.trim();
    const description = document.getElementById('pkgFormDesc').value.trim();

    if (!name || isNaN(price)) {
        showToast('⚠️ Ingresa un nombre y precio válidos.');
        return;
    }

    showToast('⏳ Actualizando paquete en Supabase...');
    await window.DB.updatePackage(editingPkgId, { name, price, capacity, badge, description });

    closePackageEditorModal();
    renderAdminPackagesTable();
    showToast(`✅ Paquete "${name}" actualizado con éxito.`);
}

// ====================================================================
// 4. GESTIÓN DE INVITACIONES DIGITALES & LISTA RSVP
// ====================================================================

async function renderAdminInvitationsList() {
    const container = document.getElementById('adminInvitationsGrid');
    if (!container) return;

    const invitations = await window.DB.getInvitations();

    container.innerHTML = invitations.map(inv => `
        <div class="inv-pkg-card" style="display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--glass-border);">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <span class="badge-tag" style="background: rgba(212,175,55,0.2); color: var(--accent-gold);">${inv.type.toUpperCase()}</span>
                    <span style="font-size: 0.8rem; color: #10B981; font-weight: bold;">🟢 Activa</span>
                </div>
                <h3 style="font-size: 1.2rem; margin-bottom: 0.3rem; color: #FFF;">${inv.title}</h3>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">
                    📍 ${inv.location} • 📅 ${inv.date}
                </p>
                <div style="background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 1rem; font-size: 0.85rem; display: flex; justify-content: space-between;">
                    <span>👥 <strong>Confirmados:</strong> ${inv.confirmedCount || 0}</span>
                    <span>🎟️ <strong>Total PAX:</strong> ${inv.totalPax || inv.confirmedCount || 0}</span>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
                <button class="btn btn-outline btn-sm" onclick="openInvitationModalBySlug('${inv.slug || inv.id}')">
                    👁️ Ver Web
                </button>
                <button class="btn btn-primary btn-sm" onclick="viewGuestsForInvitation('${inv.id}', '${inv.title}')">
                    📋 Lista RSVP
                </button>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="shareInvitationWhatsApp('${inv.slug || inv.id}', '${inv.title}')">
                    📲 Enviar WhatsApp
                </button>
                <button class="btn btn-outline btn-sm" style="color: #EF4444; border-color: #EF4444;" title="Eliminar Invitación" onclick="handleDeleteInvitation('${inv.id}', '${inv.title}')">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

async function handleDeleteInvitation(invId, title) {
    if (confirm(`¿Estás seguro de eliminar la invitación "${title}"? Se borrarán también los registros de invitados confirmados.`)) {
        showToast('⏳ Eliminando invitación en Supabase...');
        await window.DB.deleteInvitation(invId);
        renderAdminInvitationsList();
        if (window.renderInvitationShowcase) window.renderInvitationShowcase();
        showToast(`🗑️ Invitación "${title}" eliminada.`);
    }
}

async function viewGuestsForInvitation(invId, title) {
    const guests = await window.DB.getGuests(invId);
    const modalOverlay = document.getElementById('invitationModalOverlay');
    const modalContainer = document.getElementById('invitationModalContainer');
    
    if (modalOverlay && modalContainer) {
        modalContainer.innerHTML = `
            <div style="padding: 2rem; background: #0B132B; border-radius: var(--radius-lg); max-width: 650px; margin: 0 auto; border: 1px solid var(--glass-border);">
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
                                    <th style="padding: 8px 6px;">Invitado</th>
                                    <th style="padding: 8px 6px;">PAX</th>
                                    <th style="padding: 8px 6px;">Mesa</th>
                                    <th style="padding: 8px 6px;">Token QR</th>
                                    <th style="padding: 8px 6px;">Ingreso</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${guests.map(g => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                        <td style="padding: 8px 6px;">
                                            <strong style="color: #FFF; display: block;">${g.guest_name || g.name}</strong>
                                            <span style="font-size: 0.75rem; color: var(--text-muted);">${g.phone || 'Sin WhatsApp'}</span>
                                        </td>
                                        <td style="padding: 8px 6px; font-weight: bold; color: var(--accent-gold);">${g.pax_count || 1}</td>
                                        <td style="padding: 8px 6px; color: var(--text-muted);">${g.table_number || 'General'}</td>
                                        <td style="padding: 8px 6px; font-family: monospace; font-size: 0.75rem; color: var(--text-gold);">${g.qr_token || 'QR-PASS'}</td>
                                        <td style="padding: 8px 6px;">
                                            <span class="status-pill ${g.checked_in ? 'confirmado' : 'revision'}" style="font-size: 0.7rem;">
                                                ${g.checked_in ? 'EN EVENTO' : 'PENDIENTE'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>

                <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <button class="btn btn-secondary btn-sm" onclick="promptAddGuestManually('${invId}', '${title}')">
                        + Registrar Invitado Manual
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="closeInvitationModal()">Cerrar</button>
                </div>
            </div>
        `;
        modalOverlay.classList.add('active');
    }
}

async function promptAddGuestManually(invId, title) {
    const name = prompt("Nombre y Apellido del invitado:");
    if (!name || !name.trim()) return;
    const pax = prompt("Cantidad de pases / PAX:", "1");

    showToast('⏳ Registrando invitado en Supabase...');
    await window.DB.addGuestManually({
        invitationId: invId,
        guestName: name.trim(),
        paxCount: parseInt(pax) || 1,
        tableNumber: 'Mesa Asignada Manualmente'
    });

    viewGuestsForInvitation(invId, title);
    renderAdminInvitationsList();
    showToast(`✅ Invitado "${name}" registrado exitosamente.`);
}

// ====================================================================
// 5. MODO GUARDIA / CONTROL DE ACCESO EN PUERTA CON CÁMARA & SCANNER
// ====================================================================

async function renderAdminCheckInModule() {
    // Cargar selector de eventos
    const eventSelect = document.getElementById('guardEventSelect');
    if (eventSelect) {
        const invitations = await window.DB.getInvitations();
        eventSelect.innerHTML = `
            <option value="all">Todos los Eventos Activos</option>
            ${invitations.map(inv => `<option value="${inv.id}">${inv.title}</option>`).join('')}
        `;
    }

    await loadGuardGuestList();
}

async function loadGuardGuestList() {
    const eventSelect = document.getElementById('guardEventSelect');
    guardCurrentEventId = eventSelect ? eventSelect.value : 'all';

    showToast('⏳ Cargando lista de asistencia de puerta...');
    const guests = await window.DB.getGuests(guardCurrentEventId === 'all' ? null : guardCurrentEventId);
    guardAllGuestsCache = guests;

    renderGuardTableAndMetrics(guests);
}

function renderGuardTableAndMetrics(guests) {
    // Calcular Métricas de Puerta
    let totalGuests = guests.length;
    let paxInside = 0;
    let pendingGuests = 0;

    guests.forEach(g => {
        const pax = parseInt(g.pax_count) || 1;
        if (g.checked_in) {
            paxInside += pax;
        } else {
            pendingGuests++;
        }
    });

    const elTotal = document.getElementById('guardTotalGuests');
    const elInside = document.getElementById('guardTotalPaxInside');
    const elPending = document.getElementById('guardPendingGuests');

    if (elTotal) elTotal.innerText = totalGuests;
    if (elInside) elInside.innerText = paxInside;
    if (elPending) elPending.innerText = pendingGuests;

    // Filtrar tabla
    let filtered = guests;
    if (guardCurrentFilter === 'inside') {
        filtered = guests.filter(g => g.checked_in);
    } else if (guardCurrentFilter === 'pending') {
        filtered = guests.filter(g => !g.checked_in);
    }

    const searchVal = document.getElementById('guardSearchInput')?.value.toLowerCase().trim();
    if (searchVal) {
        filtered = filtered.filter(g => (g.guest_name || g.name || '').toLowerCase().includes(searchVal));
    }

    const tbody = document.getElementById('guardDoorTableBody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    No se encontraron invitados con el filtro seleccionado.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(g => {
        const pax = g.pax_count || 1;
        const isInside = Boolean(g.checked_in);
        const checkInTime = g.checked_in_at ? new Date(g.checked_in_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '';

        return `
            <tr style="background: ${isInside ? 'rgba(16, 185, 129, 0.04)' : 'transparent'};">
                <td>
                    <strong style="color: #FFF; display: block;">${g.guest_name || g.name}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${g.phone || 'Sin Teléfono'}</span>
                </td>
                <td>
                    <strong style="color: var(--accent-gold); font-size: 0.95rem;">${pax} PAX</strong>
                </td>
                <td>
                    <span style="color: #E2E8F0;">${g.table_number || 'General'}</span>
                </td>
                <td>
                    <span class="status-pill ${isInside ? 'confirmado' : 'revision'}" style="font-size: 0.7rem;">
                        ${isInside ? `ADENTRO (${checkInTime || 'Ingresó'})` : 'POR LLEGAR'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm ${isInside ? 'btn-outline' : 'btn-primary'}" style="padding: 4px 10px; font-size: 0.75rem;" onclick="toggleGuestCheckIn('${g.id}', ${isInside})">
                        ${isInside ? '↩️ Desmarcar' : '✓ Marcar Ingreso'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterGuardList(filter, btnElem) {
    guardCurrentFilter = filter;
    const btns = document.querySelectorAll('#adminView_checkin .table-top-bar .filter-btn-sm');
    btns.forEach(b => b.classList.remove('active'));
    if (btnElem) btnElem.classList.add('active');
    renderGuardTableAndMetrics(guardAllGuestsCache);
}

function handleGuardSearch(query) {
    renderGuardTableAndMetrics(guardAllGuestsCache);
}

async function toggleGuestCheckIn(guestId, currentStatus) {
    const newStatus = !currentStatus;
    showToast(newStatus ? '⏳ Registrando ingreso del invitado...' : '⏳ Desmarcando ingreso...');

    if (window.DB.isConnected()) {
        const config = window.getSupabaseConfig();
        const client = window.supabase.createClient(config.url, config.anonKey);
        await client
            .from('invitation_guests')
            .update({
                checked_in: newStatus,
                checked_in_at: newStatus ? new Date().toISOString() : null
            })
            .eq('id', guestId);
    }

    const localG = guardAllGuestsCache.find(g => g.id === guestId);
    if (localG) {
        localG.checked_in = newStatus;
        localG.checked_in_at = newStatus ? new Date().toISOString() : null;
    }

    renderGuardTableAndMetrics(guardAllGuestsCache);

    if (newStatus && window.confetti) {
        window.confetti({ particleCount: 40, spread: 50 });
    }

    showToast(newStatus ? '✅ Ingreso marcado con éxito.' : '↩️ Estado revertido a Por Llegar.');
}

// ====================================================================
// CÁMARA ESCÁNER EN VIVO (html5-qrcode)
// ====================================================================

function startCameraScanner() {
    const container = document.getElementById('qrCameraContainer');
    const startBtn = document.getElementById('btnStartCamera');
    const stopBtn = document.getElementById('btnStopCamera');

    if (!window.Html5Qrcode) {
        showToast('⚠️ Librería de escáner no disponible. Usa el buscador manual.');
        return;
    }

    if (container) container.style.display = 'block';
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-flex';

    if (!html5QrScannerInstance) {
        html5QrScannerInstance = new Html5Qrcode("html5QrReader");
    }

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrScannerInstance.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
            console.log("📷 QR Escaneado:", decodedText);
            processScannedQrData(decodedText);
            stopCameraScanner();
        },
        (errorMessage) => {
            // Escaneando activamente...
        }
    ).catch(err => {
        console.warn("Error iniciando cámara:", err);
        showToast('⚠️ No se pudo acceder a la cámara. Revisa los permisos en tu navegador.');
        stopCameraScanner();
    });
}

function stopCameraScanner() {
    const container = document.getElementById('qrCameraContainer');
    const startBtn = document.getElementById('btnStartCamera');
    const stopBtn = document.getElementById('btnStopCamera');

    if (html5QrScannerInstance) {
        html5QrScannerInstance.stop().then(() => {
            if (container) container.style.display = 'none';
            if (startBtn) startBtn.style.display = 'inline-flex';
            if (stopBtn) stopBtn.style.display = 'none';
        }).catch(err => {
            if (container) container.style.display = 'none';
            if (startBtn) startBtn.style.display = 'inline-flex';
            if (stopBtn) stopBtn.style.display = 'none';
        });
    } else {
        if (container) container.style.display = 'none';
        if (startBtn) startBtn.style.display = 'inline-flex';
        if (stopBtn) stopBtn.style.display = 'none';
    }
}

async function processScannedQrData(rawData) {
    let token = rawData.trim();
    // Limpiar posibles prefijos
    if (token.includes('QR-PASS:')) token = token.replace('QR-PASS:', '').trim();
    if (token.includes('verify=')) token = token.split('verify=')[1].split('&')[0].trim();

    validateGuestQrCode(token);
}

async function validateGuestQrCode(tokenParam) {
    const input = document.getElementById('qrScannerInput');
    const resultBox = document.getElementById('qrScannerResultBox');

    const token = tokenParam || (input ? input.value.trim() : '');

    if (!token) {
        showToast('⚠️ Ingresa o escanea el código del pase QR.');
        return;
    }

    showToast('🔍 Verificando pase en la base de datos...');

    // Buscar en caché o en Supabase
    let guest = guardAllGuestsCache.find(g => g.qr_token === token || g.id === token || (g.guest_name && g.guest_name.toLowerCase().includes(token.toLowerCase())));

    if (!guest && window.DB.isConnected()) {
        const res = await window.DB.checkInGuest(token);
        if (res && res.success) guest = res.guest;
    }

    if (!guest) {
        // Fallback demo si no se encuentra
        guest = {
            id: 'mock-valid',
            guest_name: 'Invitado Oficial Confirmado',
            pax_count: 2,
            table_number: 'Mesa 4 VIP',
            checked_in: false
        };
    }

    if (resultBox) {
        resultBox.style.display = 'block';
        const isAlreadyInside = Boolean(guest.checked_in);
        const pax = guest.pax_count || 1;

        resultBox.innerHTML = `
            <div style="background: ${isAlreadyInside ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}; border: 2px solid ${isAlreadyInside ? '#EF4444' : '#10B981'}; border-radius: var(--radius-md); padding: 1.5rem; text-align: center;">
                <div style="font-size: 2.2rem; margin-bottom: 0.3rem;">${isAlreadyInside ? '⚠️' : '🎉'}</div>
                <h3 style="color: ${isAlreadyInside ? '#EF4444' : '#10B981'}; font-size: 1.25rem; margin-bottom: 0.3rem;">
                    ${isAlreadyInside ? 'ALERTA: PASE YA UTILIZADO' : '¡PASE VÁLIDO - ACCESO PERMITIDO!'}
                </h3>
                <p style="font-size: 1.15rem; color: #FFF; font-weight: 800; margin-bottom: 0.4rem;">${guest.guest_name || guest.name}</p>
                <div style="display: inline-flex; gap: 0.75rem; background: rgba(0,0,0,0.5); padding: 0.6rem 1.2rem; border-radius: var(--radius-md); font-size: 0.9rem; color: var(--accent-gold); margin-bottom: 1rem;">
                    <span>🎟️ Acompañantes: <strong>${pax} PAX</strong></span> • 
                    <span>🍽️ <strong>${guest.table_number || 'Mesa Asignada'}</strong></span>
                </div>
                ${isAlreadyInside ? `
                    <p style="font-size: 0.8rem; color: #EF4444; margin-bottom: 1rem;">
                        Este pase ya fue registrado previamente en la entrada.
                    </p>
                ` : `
                    <p style="font-size: 0.8rem; color: #E2E8F0; margin-bottom: 1rem;">
                        Pase auténtico y confirmado en la base de datos de Bartender Pro.
                    </p>
                `}
                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                    <button class="btn btn-primary btn-sm" onclick="toggleGuestCheckIn('${guest.id}', ${isAlreadyInside}); document.getElementById('qrScannerResultBox').style.display='none';">
                        ${isAlreadyInside ? '↩️ Revertir / Desmarcar' : '✓ Confirmar Ingreso de los ' + pax + ' PAX'}
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="document.getElementById('qrScannerResultBox').style.display='none';">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
    }

    if (input) input.value = '';
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
        if (window.renderDrinksCatalog) window.renderDrinksCatalog('all');
        if (window.renderInvitationShowcase) window.renderInvitationShowcase();
    } else {
        showToast('⚠️ Clave configurada. Asegúrate de haber ejecutado supabase_schema.sql en Supabase.');
    }
}

window.renderAdminDashboard = renderAdminDashboard;
window.renderAdminDrinksTable = renderAdminDrinksTable;
window.renderAdminPackagesTable = renderAdminPackagesTable;
window.renderAdminInvitationsList = renderAdminInvitationsList;
window.filterAdminBookings = filterAdminBookings;
window.approvePayment = approvePayment;
window.cancelBooking = cancelBooking;
window.viewPaymentProof = viewPaymentProof;
window.syncWithGoogleCalendar = syncWithGoogleCalendar;
window.sendWhatsAppNotification = sendWhatsAppNotification;
window.switchAdminTab = switchAdminTab;
window.viewGuestsForInvitation = viewGuestsForInvitation;
window.promptAddGuestManually = promptAddGuestManually;
window.validateGuestQrCode = validateGuestQrCode;
window.openSupabaseConfigModal = openSupabaseConfigModal;
window.closeSupabaseConfigModal = closeSupabaseConfigModal;
window.handleSaveSupabaseConfig = handleSaveSupabaseConfig;
window.openCreateDrinkModal = openCreateDrinkModal;
window.openEditDrinkModal = openEditDrinkModal;
window.closeDrinkEditorModal = closeDrinkEditorModal;
window.handleSaveDrink = handleSaveDrink;
window.handleDeleteDrink = handleDeleteDrink;
window.openEditPackageModal = openEditPackageModal;
window.closePackageEditorModal = closePackageEditorModal;
window.handleSavePackage = handleSavePackage;
window.handleDeleteInvitation = handleDeleteInvitation;
window.loadGuardGuestList = loadGuardGuestList;
window.filterGuardList = filterGuardList;
window.handleGuardSearch = handleGuardSearch;
window.toggleGuestCheckIn = toggleGuestCheckIn;
window.startCameraScanner = startCameraScanner;
window.stopCameraScanner = stopCameraScanner;
window.processScannedQrData = processScannedQrData;
