// js/invitations.js - Módulo de Invitaciones Digitales, Creador Interactivo & RSVP

let activeCountdownInterval = null;
let currentViewingInvitation = null;

document.addEventListener('DOMContentLoaded', () => {
    initInvitationModule();
    checkUrlForInvitation();
});

function initInvitationModule() {
    renderInvitationShowcase();
}

// Comprobar si la URL tiene parámetro ?inv=slug para abrir la invitación directamente
async function checkUrlForInvitation() {
    const urlParams = new URLSearchParams(window.location.search);
    const invSlug = urlParams.get('inv');
    if (invSlug) {
        setTimeout(async () => {
            await openInvitationModalBySlug(invSlug);
        }, 300);
    }
}

// Renderizar tarjetas de muestra de invitaciones en la página principal
async function renderInvitationShowcase() {
    const container = document.getElementById('invitationSamplesGrid');
    if (!container) return;

    const invitations = await window.DB.getInvitations();

    container.innerHTML = invitations.map(inv => {
        const typeLabels = {
            boda: 'BODA DE GALA',
            quince: '15 AÑOS',
            corporativo: 'CORPORATIVO',
            cumpleanos: 'CUMPLEAÑOS VIP',
            graduacion: 'GRADUACIÓN'
        };
        const badgeText = typeLabels[inv.type] || 'EVENTO ESPECIAL';
        const color = inv.themeColor || '#D4AF37';

        return `
            <div class="sample-card">
                <div class="sample-img-box">
                    <img src="${inv.previewImage}" alt="${inv.title}">
                    <span class="sample-overlay-tag" style="color: ${color}; border-color: ${color};">${badgeText}</span>
                </div>
                <div class="sample-content">
                    <h4 class="sample-title">${inv.title}</h4>
                    <div class="sample-meta">
                        <span>📍 ${inv.location}</span>
                        <span>📅 ${inv.date}</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                        <button class="btn btn-primary btn-sm" onclick="openInvitationModalBySlug('${inv.slug || inv.id}')" style="flex: 1;">
                            👁️ Ver Invitación Web
                        </button>
                        <button class="btn btn-outline btn-sm" title="Compartir Enlace por WhatsApp" onclick="shareInvitationWhatsApp('${inv.slug || inv.id}', '${inv.title}')">
                            📲
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ====================================================================
// VISOR DE INVITACIÓN DIGITAL INTERACTIVA (MODAL SMARTPHONE)
// ====================================================================

async function openInvitationModalBySlug(slugOrId) {
    const inv = await window.DB.getInvitationBySlug(slugOrId);
    if (!inv) {
        showToast('⚠️ No se encontró la invitación solicitada.');
        return;
    }

    currentViewingInvitation = inv;

    const modalOverlay = document.getElementById('invitationModalOverlay');
    const modalContainer = document.getElementById('invitationModalContainer');
    if (!modalOverlay || !modalContainer) return;

    // Calcular monograma
    let monogram = "VIP";
    if (inv.partnerName && inv.hostName) {
        monogram = `${inv.hostName.charAt(0)} & ${inv.partnerName.charAt(0)}`;
    } else if (inv.hostName) {
        const parts = inv.hostName.split(' ');
        monogram = parts.length > 1 ? `${parts[0].charAt(0)} ${parts[1].charAt(0)}` : inv.hostName.substring(0, 2).toUpperCase();
    }

    // Google Calendar URL Generator
    const gCalUrl = generateGoogleCalendarUrl(inv);

    modalContainer.innerHTML = `
        <div class="inv-phone-screen ${inv.bgStyle || 'boda-theme'}">
            <!-- Barra superior flotante -->
            <div style="position: absolute; top: 14px; right: 14px; z-index: 20; display: flex; gap: 8px;">
                <button onclick="shareInvitationWhatsApp('${inv.slug || inv.id}', '${inv.title}')" class="inv-floating-btn" title="Compartir en WhatsApp">
                    📲
                </button>
                <button onclick="closeInvitationModal()" class="inv-floating-btn" title="Cerrar">
                    ✕
                </button>
            </div>

            <!-- Cabecera de la Invitación -->
            <div class="inv-phone-header">
                <div class="inv-monogram" style="border-color: ${inv.themeColor}; color: ${inv.themeColor};">${monogram}</div>
                <div class="inv-subtitle">ESTÁS CORDIALMENTE INVITADO A</div>
                <div class="inv-names" style="color: ${inv.themeColor}">${inv.title}</div>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.4rem;">Cochabamba - Bolivia</p>
            </div>

            <!-- Mensaje de Bienvenida -->
            ${inv.description ? `
                <div style="padding: 0 1.25rem; text-align: center; margin-bottom: 1.25rem;">
                    <p style="font-size: 0.88rem; font-style: italic; color: #E2E8F0; line-height: 1.5; background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: var(--radius-md); border-left: 3px solid ${inv.themeColor};">
                        "${inv.description}"
                    </p>
                </div>
            ` : ''}

            <!-- Cuenta Regresiva en Tiempo Real -->
            <div class="inv-countdown-box">
                <div class="time-unit">
                    <span class="time-val" id="cdDays">00</span>
                    <span class="time-lbl">Días</span>
                </div>
                <div class="time-unit">
                    <span class="time-val" id="cdHours">00</span>
                    <span class="time-lbl">Horas</span>
                </div>
                <div class="time-unit">
                    <span class="time-val" id="cdMinutes">00</span>
                    <span class="time-lbl">Minutos</span>
                </div>
                <div class="time-unit">
                    <span class="time-val" id="cdSeconds">00</span>
                    <span class="time-lbl">Segundos</span>
                </div>
            </div>

            <!-- Tarjeta de Detalles del Evento -->
            <div class="inv-details-card">
                <div class="inv-detail-row">
                    <div class="inv-detail-icon">📅</div>
                    <div>
                        <strong style="font-size: 0.9rem; display: block; color: #FFF;">Fecha & Hora</strong>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">${inv.date} • ${inv.time}</span>
                    </div>
                </div>

                <div class="inv-detail-row">
                    <div class="inv-detail-icon">📍</div>
                    <div>
                        <strong style="font-size: 0.9rem; display: block; color: #FFF;">Ubicación del Evento</strong>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">${inv.location}</span>
                        ${inv.address ? `<span style="display: block; font-size: 0.75rem; color: #94A3B8;">${inv.address}</span>` : ''}
                    </div>
                </div>

                <div class="inv-detail-row">
                    <div class="inv-detail-icon">👔</div>
                    <div>
                        <strong style="font-size: 0.9rem; display: block; color: #FFF;">Código de Vestimenta</strong>
                        <span style="font-size: 0.85rem; color: var(--text-gold); font-weight: 600;">${inv.dressCode || 'Gala / Traje Formal'}</span>
                    </div>
                </div>

                <div class="inv-detail-row">
                    <div class="inv-detail-icon">🍸</div>
                    <div>
                        <strong style="font-size: 0.9rem; display: block; color: #FFF;">Servicio de Coctelería</strong>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">Barra Móvil & Mixología por Bartender Pro CBBA</span>
                    </div>
                </div>
            </div>

            <!-- Botones de Acción: Maps y Google Calendar -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding: 0 1.25rem; margin-bottom: 1.5rem;">
                <a href="${inv.mapsUrl || 'https://maps.google.com/?q=' + encodeURIComponent(inv.location + ' Cochabamba')}" target="_blank" class="btn btn-outline btn-sm" style="text-align: center; text-decoration: none;">
                    🗺️ Ver Mapa
                </a>
                <a href="${gCalUrl}" target="_blank" class="btn btn-outline btn-sm" style="text-align: center; text-decoration: none;">
                    📅 Agendar Evento
                </a>
            </div>

            <!-- Formulario RSVP de Confirmación de Asistencia -->
            <div class="inv-rsvp-section">
                <h4 style="margin-bottom: 0.3rem; font-size: 1.15rem; color: ${inv.themeColor};">Confirmar Asistencia (RSVP)</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">Regístrate para recibir tu pase de acceso con código QR:</p>
                
                <div style="display: flex; flex-direction: column; gap: 0.65rem;">
                    <div>
                        <label style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Nombre y Apellido *</label>
                        <input type="text" id="rsvpGuestName" class="rsvp-input" placeholder="Ej: Dr. Fernando Mercado">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 2px;">WhatsApp</label>
                            <input type="tel" id="rsvpGuestPhone" class="rsvp-input" placeholder="+591 797XXXXX">
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Pases / PAX</label>
                            <select class="rsvp-input" id="rsvpGuestPax">
                                <option value="1">1 Persona (Individual)</option>
                                <option value="2" selected>2 Personas (Pareja)</option>
                                <option value="3">3 Personas</option>
                                <option value="4">Pase Familiar (4+)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Mensaje o Canción para el DJ (Opcional)</label>
                        <input type="text" id="rsvpGuestNotes" class="rsvp-input" placeholder="Canción favorita o nota dietética">
                    </div>

                    <button class="btn btn-primary" style="width: 100%; margin-top: 0.5rem; justify-content: center;" onclick="handleRSVPSubmit()">
                        ✨ Confirmar Asistencia y Generar Pase QR
                    </button>
                </div>

                <!-- Resultado y Pase QR Generado -->
                <div id="rsvpSuccessBox" style="display: none; margin-top: 1.5rem; background: rgba(16, 185, 129, 0.12); border: 1px solid #10B981; padding: 1.25rem; border-radius: var(--radius-md); text-align: center;">
                    <div style="font-size: 1.8rem; margin-bottom: 0.3rem;">🎉</div>
                    <strong style="color: #10B981; font-size: 1.05rem; display: block; margin-bottom: 0.3rem;">¡Asistencia Confirmada!</strong>
                    <p style="font-size: 0.8rem; color: #E2E8F0; margin-bottom: 1rem;">Tu pase digital ha sido emitido y registrado en el sistema.</p>

                    <!-- Contenedor del QR Canvas -->
                    <div style="background: #FFF; padding: 12px; border-radius: var(--radius-md); display: inline-block; box-shadow: var(--shadow-gold); margin-bottom: 0.75rem;">
                        <canvas id="rsvpQrCanvas" width="160" height="160"></canvas>
                    </div>

                    <div style="font-size: 0.8rem; color: #FFF; margin-bottom: 0.75rem;">
                        <strong id="rsvpQrTokenText" style="color: var(--accent-gold); letter-spacing: 1px; display: block; font-size: 0.9rem;">QR-PASS</strong>
                        <span id="rsvpPassGuestName" style="color: #94A3B8;">Invitado Oficial</span>
                    </div>

                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 1rem;">Presenta este código QR en la mesa de recepción del evento.</p>

                    <button class="btn btn-secondary btn-sm" onclick="downloadQrPass()" style="width: 100%; justify-content: center;">
                        💾 Descargar Pase Digital
                    </button>
                </div>
            </div>

            <!-- Pie de página de la invitación -->
            <div style="text-align: center; padding: 1.5rem; background: rgba(0,0,0,0.6); font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid var(--glass-border-subtle);">
                Desarrollado con 🍸 <strong>Bartender Pro Cochabamba</strong><br>
                Plataforma de Invitaciones & Coctelería de Autor
            </div>
        </div>
    `;

    modalOverlay.classList.add('active');
    startCountdown(inv.date, inv.time);
}

function closeInvitationModal() {
    const modalOverlay = document.getElementById('invitationModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
    }
    if (activeCountdownInterval) {
        clearInterval(activeCountdownInterval);
        activeCountdownInterval = null;
    }
}

// Iniciar cronómetro dinámico
function startCountdown(dateStr, timeStr) {
    if (activeCountdownInterval) clearInterval(activeCountdownInterval);

    // Intentar parsear fecha
    let targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
        targetDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000); // Fallback 45 días
    }

    function update() {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            const elD = document.getElementById('cdDays');
            const elH = document.getElementById('cdHours');
            const elM = document.getElementById('cdMinutes');
            const elS = document.getElementById('cdSeconds');
            if (elD) elD.innerText = '00';
            if (elH) elH.innerText = '00';
            if (elM) elM.innerText = '00';
            if (elS) elS.innerText = '00';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const elD = document.getElementById('cdDays');
        const elH = document.getElementById('cdHours');
        const elM = document.getElementById('cdMinutes');
        const elS = document.getElementById('cdSeconds');

        if (elD) elD.innerText = String(days).padStart(2, '0');
        if (elH) elH.innerText = String(hours).padStart(2, '0');
        if (elM) elM.innerText = String(minutes).padStart(2, '0');
        if (elS) elS.innerText = String(seconds).padStart(2, '0');
    }

    update();
    activeCountdownInterval = setInterval(update, 1000);
}

// Generador de URL para Google Calendar
function generateGoogleCalendarUrl(inv) {
    const title = encodeURIComponent(inv.title);
    const details = encodeURIComponent(`${inv.description || ''}\nServicio de Coctelería por Bartender Pro Cochabamba.\nCódigo de Vestimenta: ${inv.dressCode || 'Gala'}`);
    const location = encodeURIComponent(`${inv.location}, Cochabamba, Bolivia`);
    
    // Fecha en formato YYYYMMDD
    let d = new Date(inv.date);
    if (isNaN(d.getTime())) d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateFormatted = `${y}${m}${day}T190000Z/${y}${m}${day}T235900Z`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateFormatted}&details=${details}&location=${location}`;
}

// Manejar confirmación de asistencia RSVP
async function handleRSVPSubmit() {
    const nameInput = document.getElementById('rsvpGuestName');
    const phoneInput = document.getElementById('rsvpGuestPhone');
    const paxSelect = document.getElementById('rsvpGuestPax');
    const notesInput = document.getElementById('rsvpGuestNotes');

    if (!nameInput || !nameInput.value.trim()) {
        showToast('⚠️ Por favor ingresa tu nombre completo para confirmar.');
        nameInput.focus();
        return;
    }

    const guestName = nameInput.value.trim();
    const guestPhone = phoneInput ? phoneInput.value.trim() : '';
    const pax = paxSelect ? paxSelect.value : 1;
    const notes = notesInput ? notesInput.value.trim() : '';

    const invId = currentViewingInvitation ? (currentViewingInvitation.id || currentViewingInvitation.slug) : 'demo-inv';

    showToast('⏳ Registrando confirmación en la base de datos...');

    const rsvpResult = await window.DB.submitRSVP({
        invitationId: currentViewingInvitation ? currentViewingInvitation.id : null,
        guestName: guestName,
        phone: guestPhone,
        paxCount: pax,
        specialNotes: notes,
        tableNumber: 'Mesa Recepción'
    });

    // Mostrar caja de éxito
    const successBox = document.getElementById('rsvpSuccessBox');
    const tokenText = document.getElementById('rsvpQrTokenText');
    const nameText = document.getElementById('rsvpPassGuestName');

    if (successBox) {
        successBox.style.display = 'block';
        if (tokenText) tokenText.innerText = rsvpResult.qr_token || 'QR-PASS-CONFIRMADO';
        if (nameText) nameText.innerText = `${guestName} (${pax} PAX)`;

        // Generar QR en Canvas
        generateQrCodeCanvas(rsvpResult.qr_token || 'QR-PASS-DEFAULT');

        // Confeti de celebración
        if (window.confetti) {
            window.confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        showToast(`🎉 ¡Confirmación registrada para ${guestName}! Pase emitido.`);
        successBox.scrollIntoView({ behavior: 'smooth' });
    }
}

// Generador de Código QR en Canvas
function generateQrCodeCanvas(text) {
    const canvas = document.getElementById('rsvpQrCanvas');
    if (!canvas) return;

    if (window.QRCode && window.QRCode.toCanvas) {
        window.QRCode.toCanvas(canvas, text, {
            width: 160,
            margin: 1,
            color: {
                dark: '#0B132B',
                light: '#FFFFFF'
            }
        }, function (error) {
            if (error) console.error(error);
        });
    } else {
        // Fallback drawing if QRCode library not loaded
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 160, 160);
        ctx.fillStyle = "#0B132B";
        ctx.fillRect(10, 10, 40, 40);
        ctx.fillRect(110, 10, 40, 40);
        ctx.fillRect(10, 110, 40, 40);
        ctx.fillStyle = "#D4AF37";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("QR PASS", 80, 85);
        ctx.font = "9px monospace";
        ctx.fillText(text.substring(0, 15), 80, 100);
    }
}

function downloadQrPass() {
    const canvas = document.getElementById('rsvpQrCanvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `pase-qr-${currentViewingInvitation ? currentViewingInvitation.slug : 'evento'}.png`;
    link.href = canvas.toDataURL();
    link.click();
    showToast('💾 Pase digital guardado en tu dispositivo.');
}

function shareInvitationWhatsApp(slug, title) {
    const url = `${window.location.origin}${window.location.pathname}?inv=${slug}`;
    const text = `🍸 *¡Estás invitado a ${title}!* 🥂\n\nConfirma tu asistencia y obtén tu pase digital con código QR aquí:\n${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
}

// ====================================================================
// CREADOR / CONSTRUCTOR INTERACTIVO DE INVITACIONES
// ====================================================================

function openInvitationBuilderModal() {
    const modalOverlay = document.getElementById('invitationBuilderOverlay');
    if (modalOverlay) {
        modalOverlay.classList.add('active');
        updateBuilderLivePreview();
    }
}

function closeInvitationBuilderModal() {
    const modalOverlay = document.getElementById('invitationBuilderOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
    }
}

function updateBuilderLivePreview() {
    const type = document.getElementById('builderEventType')?.value || 'boda';
    const title = document.getElementById('builderTitle')?.value || 'Boda Carlos & Sofía';
    const host = document.getElementById('builderHost')?.value || 'Carlos & Sofía';
    const date = document.getElementById('builderDate')?.value || '2026-10-15';
    const time = document.getElementById('builderTime')?.value || '17:00 HRS';
    const venue = document.getElementById('builderVenue')?.value || 'Centro de Eventos El Bosque, Tiquipaya';
    const theme = document.getElementById('builderTheme')?.value || '#D4AF37';
    const bgStyle = document.getElementById('builderBgStyle')?.value || 'boda-theme';
    const dress = document.getElementById('builderDressCode')?.value || 'Rigurosa Gala';
    const message = document.getElementById('builderMessage')?.value || 'Nos complace invitarte a compartir este día especial con nosotros.';

    // Actualizar vista previa en el celular del constructor
    const previewContainer = document.getElementById('builderPhonePreview');
    if (!previewContainer) return;

    previewContainer.className = `inv-phone-screen ${bgStyle}`;
    previewContainer.innerHTML = `
        <div class="inv-phone-header">
            <div class="inv-monogram" style="border-color: ${theme}; color: ${theme};">${host.substring(0, 3).toUpperCase()}</div>
            <div class="inv-subtitle">INVITACIÓN DIGITAL</div>
            <div class="inv-names" style="color: ${theme}">${title}</div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">Cochabamba - Bolivia</p>
        </div>

        <div style="padding: 0 1rem; text-align: center; margin-bottom: 1rem;">
            <p style="font-size: 0.8rem; font-style: italic; color: #E2E8F0; background: rgba(0,0,0,0.3); padding: 0.6rem; border-radius: var(--radius-sm); border-left: 2px solid ${theme};">
                "${message}"
            </p>
        </div>

        <div class="inv-details-card" style="padding: 0.85rem; font-size: 0.8rem;">
            <div style="margin-bottom: 0.4rem;"><strong>📅 Fecha:</strong> ${date} - ${time}</div>
            <div style="margin-bottom: 0.4rem;"><strong>📍 Lugar:</strong> ${venue}</div>
            <div><strong>👔 Código:</strong> <span style="color: ${theme}">${dress}</span></div>
        </div>

        <div style="text-align: center; padding: 0.75rem; background: rgba(212,175,55,0.1); border-radius: var(--radius-md); margin: 0.5rem 1rem;">
            <span style="font-size: 0.75rem; color: ${theme}; font-weight: bold;">📱 Formulario RSVP + Pase QR Incluidos</span>
        </div>
    `;
}

async function saveAndPublishInvitation() {
    const title = document.getElementById('builderTitle')?.value.trim();
    const host = document.getElementById('builderHost')?.value.trim();
    const date = document.getElementById('builderDate')?.value;
    const time = document.getElementById('builderTime')?.value.trim() || '18:00 HRS';
    const venue = document.getElementById('builderVenue')?.value.trim();
    const type = document.getElementById('builderEventType')?.value || 'boda';
    const theme = document.getElementById('builderTheme')?.value || '#D4AF37';
    const bgStyle = document.getElementById('builderBgStyle')?.value || 'boda-theme';
    const dress = document.getElementById('builderDressCode')?.value.trim() || 'Gala / Traje Formal';
    const message = document.getElementById('builderMessage')?.value.trim();

    if (!title || !host || !date || !venue) {
        showToast('⚠️ Por favor completa los campos principales: Título, Anfitrión, Fecha y Salón.');
        return;
    }

    showToast('⏳ Guardando invitación en Supabase...');

    const slug = title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Math.floor(100 + Math.random() * 900);

    const newInv = await window.DB.createInvitation({
        slug: slug,
        title: title,
        type: type,
        hostName: host,
        date: date,
        time: time,
        location: venue,
        themeColor: theme,
        bgStyle: bgStyle,
        dressCode: dress,
        welcomeMessage: message
    });

    closeInvitationBuilderModal();

    if (window.confetti) {
        window.confetti({ particleCount: 100, spread: 80 });
    }

    showToast(`🎉 ¡Invitación "${title}" creada con éxito!`);

    // Refrescar catálogo y panel admin
    renderInvitationShowcase();
    if (window.renderAdminInvitationsList) window.renderAdminInvitationsList();

    // Abrir automáticamente la invitación creada
    setTimeout(() => {
        openInvitationModalBySlug(slug);
    }, 600);
}

// Exponer funciones globales
window.openInvitationModalBySlug = openInvitationModalBySlug;
window.closeInvitationModal = closeInvitationModal;
window.handleRSVPSubmit = handleRSVPSubmit;
window.downloadQrPass = downloadQrPass;
window.shareInvitationWhatsApp = shareInvitationWhatsApp;
window.openInvitationBuilderModal = openInvitationBuilderModal;
window.closeInvitationBuilderModal = closeInvitationBuilderModal;
window.updateBuilderLivePreview = updateBuilderLivePreview;
window.saveAndPublishInvitation = saveAndPublishInvitation;
window.renderInvitationShowcase = renderInvitationShowcase;
