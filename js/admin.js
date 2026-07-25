// admin.js - Módulo del Panel de Administración del Bartender / Dueño

document.addEventListener('DOMContentLoaded', () => {
    initAdminModule();
});

function initAdminModule() {
    renderAdminDashboard();
}

function renderAdminDashboard() {
    const tableBody = document.getElementById('adminBookingsTableBody');
    if (!tableBody) return;

    const data = window.BARTENDER_DATA;
    const bookings = data.sampleBookings;

    // Metrics Calculation
    let totalRevenue = 0;
    let pendingCount = 0;
    let reviewCount = 0;

    bookings.forEach(b => {
        if (b.status === 'confirmado') totalRevenue += b.totalAmount;
        if (b.status === 'pendiente') pendingCount++;
        if (b.status === 'revision') reviewCount++;
    });

    const revenueEl = document.getElementById('adminTotalRevenue');
    const pendingEl = document.getElementById('adminPendingCount');
    const reviewEl = document.getElementById('adminReviewCount');

    if (revenueEl) revenueEl.innerText = `Bs. ${totalRevenue.toLocaleString()}`;
    if (pendingEl) pendingEl.innerText = pendingCount;
    if (reviewEl) reviewEl.innerText = reviewCount;

    // Render Table Rows
    tableBody.innerHTML = bookings.map(b => {
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
                    <span style="display: block;">${b.eventType} (${b.guests} personas)</span>
                    <span style="font-size: 0.8rem; color: var(--text-gold);">${b.location}</span>
                </td>
                <td>📅 ${b.date}</td>
                <td>
                    <strong style="color: var(--accent-gold);">Bs. ${b.totalAmount}</strong>
                    <span style="display: block; font-size: 0.75rem; color: var(--text-muted);">${b.invitationPackage}</span>
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
                        ${b.status === 'revision' || b.status === 'pendiente' ? `
                            <button class="btn-icon" title="Aprobar Pago QR" onclick="approvePayment('${b.id}')" style="color: #10B981; border-color: #10B981;">✓</button>
                        ` : ''}
                        <button class="btn-icon" title="Ver Comprobante Subido" onclick="viewPaymentProof('${b.id}')">👁️</button>
                        <button class="btn-icon" title="Enviar Notificación por Gmail" onclick="sendGmailNotification('${b.id}')">✉️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function approvePayment(bookingId) {
    const booking = window.BARTENDER_DATA.sampleBookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = 'confirmado';
        renderAdminDashboard();
        showToast(`✅ Pago verificado para la reserva ${bookingId}. Notificación de confirmación enviada al cliente por Gmail SMTP.`);
    }
}

function viewPaymentProof(bookingId) {
    const booking = window.BARTENDER_DATA.sampleBookings.find(b => b.id === bookingId);
    if (!booking) return;

    if (!booking.paymentProofUrl) {
        showToast(`⚠️ El cliente aún no ha subido comprobante para la reserva ${bookingId}.`);
        return;
    }

    const modalOverlay = document.getElementById('invitationModalOverlay');
    const modalContainer = document.getElementById('invitationModalContainer');
    
    if (modalOverlay && modalContainer) {
        modalContainer.innerHTML = `
            <div style="padding: 2rem; background: #0B132B; text-align: center; border-radius: var(--radius-lg); position: relative;">
                <button onclick="closeInvitationModal()" style="position: absolute; top: 1rem; right: 1rem; background: transparent; border: none; color: #fff; font-size: 1.5rem; cursor: pointer;">✕</button>
                <h3 style="margin-bottom: 1rem; color: var(--accent-gold);">Comprobante de Pago QR Simple</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">Cliente: ${booking.clientName} | Reserva: ${booking.id}</p>
                <div style="background: #FFF; padding: 1.5rem; border-radius: var(--radius-md); max-width: 320px; margin: 0 auto; color: #000; text-align: left;">
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; margin-bottom: 0.5rem; font-weight: bold;">
                        <span>BANCO NACIONAL DE BOLIVIA</span>
                        <span>QR SIMPLE</span>
                    </div>
                    <p style="font-size: 0.8rem;">Monto Transferido: <strong>Bs. ${booking.totalAmount}</strong></p>
                    <p style="font-size: 0.8rem;">Destino: Bartender Pro Cochabamba</p>
                    <p style="font-size: 0.8rem;">Ref: ${booking.id}</p>
                    <p style="font-size: 0.8rem;">Estado: Transferencia Exitosa</p>
                </div>
                <div style="margin-top: 1.5rem;">
                    <button class="btn btn-primary btn-sm" onclick="approvePayment('${booking.id}'); closeInvitationModal();">Validar y Aprobar Reserva</button>
                </div>
            </div>
        `;
        modalOverlay.classList.add('active');
    }
}

function syncWithGoogleCalendar(bookingId) {
    const booking = window.BARTENDER_DATA.sampleBookings.find(b => b.id === bookingId);
    if (booking) {
        booking.googleCalendarSynced = true;
        renderAdminDashboard();
        showToast(`📅 Reserva ${bookingId} sincronizada con Google Calendar de Bartender Pro Cochabamba.`);
    }
}

function sendGmailNotification(bookingId) {
    const booking = window.BARTENDER_DATA.sampleBookings.find(b => b.id === bookingId);
    if (booking) {
        showToast(`✉️ Correo de recordatorio enviado a ${booking.email} vía Gmail (SMTP).`);
    }
}

window.renderAdminDashboard = renderAdminDashboard;
window.approvePayment = approvePayment;
window.viewPaymentProof = viewPaymentProof;
window.syncWithGoogleCalendar = syncWithGoogleCalendar;
window.sendGmailNotification = sendGmailNotification;
