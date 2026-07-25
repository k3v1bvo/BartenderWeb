// invitations.js - Previsualización Interactiva de Invitaciones Digitales

document.addEventListener('DOMContentLoaded', () => {
    initInvitationModule();
});

function initInvitationModule() {
    const sampleButtons = document.querySelectorAll('.btn-preview-invitation');
    sampleButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sampleId = e.currentTarget.getAttribute('data-sample-id');
            openInvitationPreviewModal(sampleId);
        });
    });
}

function openInvitationPreviewModal(sampleId) {
    const data = window.BARTENDER_DATA;
    const sample = data.invitationSamples.find(s => s.id === sampleId) || data.invitationSamples[0];
    
    const modalOverlay = document.getElementById('invitationModalOverlay');
    const modalContainer = document.getElementById('invitationModalContainer');
    
    if (!modalOverlay || !modalContainer) return;
    
    // Render phone screen preview content
    modalContainer.innerHTML = `
        <div class="inv-phone-screen ${sample.bgStyle}">
            <div style="position: absolute; top: 12px; right: 16px; z-index: 10;">
                <button onclick="closeInvitationModal()" style="background: rgba(0,0,0,0.5); border: 1px solid var(--glass-border); color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">✕</button>
            </div>
            
            <div class="inv-phone-header">
                <div class="inv-monogram">${sample.type === 'boda' ? 'C & S' : (sample.type === 'quince' ? 'V A' : 'G V')}</div>
                <div class="inv-subtitle">ESTÁS CORDIALMENTE INVITADO A</div>
                <div class="inv-names" style="color: ${sample.themeColor}">${sample.title}</div>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">Cochabamba - Bolivia</p>
            </div>

            <!-- Countdown Timer -->
            <div class="inv-countdown-box">
                <div class="time-unit">
                    <span class="time-val">42</span>
                    <span class="time-lbl">Días</span>
                </div>
                <div class="time-unit">
                    <span class="time-val">14</span>
                    <span class="time-lbl">Horas</span>
                </div>
                <div class="time-unit">
                    <span class="time-val">30</span>
                    <span class="time-lbl">Minutos</span>
                </div>
                <div class="time-unit">
                    <span class="time-val">12</span>
                    <span class="time-lbl">Segundos</span>
                </div>
            </div>

            <!-- Details Card -->
            <div class="inv-details-card">
                <div class="inv-detail-row">
                    <div class="inv-detail-icon">📅</div>
                    <div>
                        <strong style="font-size: 0.9rem; display: block;">Fecha y Hora</strong>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">${sample.date} - ${sample.time}</span>
                    </div>
                </div>
                <div class="inv-detail-row">
                    <div class="inv-detail-icon">📍</div>
                    <div>
                        <strong style="font-size: 0.9rem; display: block;">Ubicación del Evento</strong>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">${sample.location}</span>
                    </div>
                </div>
                <div class="inv-detail-row">
                    <div class="inv-detail-icon">🍹</div>
                    <div>
                        <strong style="font-size: 0.9rem; display: block;">Servicio de Coctelería</strong>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">Barra Libre por Bartender Pro CBBA</span>
                    </div>
                </div>
            </div>

            <!-- Map Mock Button -->
            <div style="text-align: center; margin: 1rem 0;">
                <button class="btn btn-outline btn-sm" onclick="showToast('📍 Abriendo ubicación en Google Maps / Waze Cochabamba')">
                    🗺️ Abrir en Google Maps
                </button>
            </div>

            <!-- RSVP Form Demo -->
            <div class="inv-rsvp-section">
                <h4 style="margin-bottom: 0.5rem; font-size: 1.1rem; color: var(--accent-gold);">Confirmar Asistencia (RSVP)</h4>
                <p style="font-size: 0.775rem; color: var(--text-muted); margin-bottom: 1rem;">Ingresa tus datos para registrar tu pase y mesa de honor:</p>
                
                <input type="text" id="rsvpGuestName" class="rsvp-input" placeholder="Nombre completo del invitado">
                <select class="rsvp-input" id="rsvpGuestCount">
                    <option value="1">1 Asistente (Pase Personal)</option>
                    <option value="2">2 Asistentes (Con Acompañante)</option>
                    <option value="3">Pase Familiar (3+ personas)</option>
                </select>

                <button class="btn btn-primary btn-sm" style="width: 100%; margin-top: 0.5rem;" onclick="handleRSVPSubmit()">
                    ✅ Confirmar mi Asistencia por QR
                </button>

                <div id="rsvpSuccessBox" style="display: none; margin-top: 1.5rem; background: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; padding: 1rem; border-radius: var(--radius-md);">
                    <strong style="color: #10B981; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">¡Asistencia Confirmada con Éxito!</strong>
                    <div class="inv-qr-display">
                        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                            <rect width="100" height="100" fill="white"/>
                            <!-- Simulated QR Pattern -->
                            <rect x="10" y="10" width="25" height="25" fill="black"/>
                            <rect x="15" y="15" width="15" height="15" fill="white"/>
                            <rect x="18" y="18" width="9" height="9" fill="black"/>

                            <rect x="65" y="10" width="25" height="25" fill="black"/>
                            <rect x="70" y="15" width="15" height="15" fill="white"/>
                            <rect x="73" y="18" width="9" height="9" fill="black"/>

                            <rect x="10" y="65" width="25" height="25" fill="black"/>
                            <rect x="15" y="70" width="15" height="15" fill="white"/>
                            <rect x="18" y="73" width="9" height="9" fill="black"/>

                            <rect x="45" y="45" width="10" height="10" fill="black"/>
                            <rect x="60" y="60" width="15" height="15" fill="black"/>
                            <rect x="75" y="45" width="15" height="10" fill="black"/>
                            <rect x="45" y="75" width="15" height="15" fill="black"/>
                        </svg>
                    </div>
                    <p style="font-size: 0.75rem; color: #FFF;">Presenta este código QR el día del evento en la recepción.</p>
                </div>
            </div>
            
            <div style="text-align: center; padding: 1rem; background: rgba(0,0,0,0.5); font-size: 0.7rem; color: var(--text-muted);">
                Desarrollado con Bartender Pro Cochabamba - Sistema de Invitaciones
            </div>
        </div>
    `;

    modalOverlay.classList.add('active');
}

function closeInvitationModal() {
    const modalOverlay = document.getElementById('invitationModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
    }
}

function handleRSVPSubmit() {
    const nameInput = document.getElementById('rsvpGuestName');
    if (!nameInput || !nameInput.value.trim()) {
        showToast('⚠️ Por favor ingresa tu nombre completo para confirmar.');
        return;
    }
    
    const successBox = document.getElementById('rsvpSuccessBox');
    if (successBox) {
        successBox.style.display = 'block';
        showToast(`🎉 ¡Confirmación registrada para ${nameInput.value.trim()}! Se ha generado tu pase QR.`);
    }
}

window.openInvitationPreviewModal = openInvitationPreviewModal;
window.closeInvitationModal = closeInvitationModal;
window.handleRSVPSubmit = handleRSVPSubmit;
