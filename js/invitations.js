// js/invitations.js - Módulo de Invitaciones Digitales, Creador Interactivo, Generador QR & RSVP

let activeCountdownInterval = null;
let currentViewingInvitation = null;
let currentEventQrData = { slug: '', title: '', url: '' };

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

// ====================================================================
// MOTOR ROBUSTO DE GENERACIÓN DE CÓDIGOS QR REALES (100% ESCANEABLES)
// ====================================================================

function renderRealQrCode(targetElemOrId, text, size = 200) {
    let container = typeof targetElemOrId === 'string' ? document.getElementById(targetElemOrId) : targetElemOrId;
    if (!container) return;

    // Si es un canvas directo
    if (container.tagName.toLowerCase() === 'canvas') {
        const canvas = container;
        canvas.width = size;
        canvas.height = size;

        // Intentar con QRious primero
        if (window.QRious) {
            try {
                new window.QRious({
                    element: canvas,
                    value: text,
                    size: size,
                    level: 'H',
                    background: '#FFFFFF',
                    foreground: '#0B132B'
                });
                return;
            } catch (err) {
                console.warn('QRious falló, usando motor alternativo:', err);
            }
        }

        // Fallback cargando imagen QR de alta resolución en el canvas
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, size, size);
        };
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=0b132b&bgcolor=ffffff&margin=1`;
        return;
    }

    // Si es un div contenedor
    container.innerHTML = '';
    
    // Intentar con QRCodeJS
    if (window.QRCode) {
        try {
            new window.QRCode(container, {
                text: text,
                width: size,
                height: size,
                colorDark: "#0B132B",
                colorLight: "#FFFFFF",
                correctLevel: window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.H : 2
            });
            return;
        } catch (err) {
            console.warn('QRCodeJS falló, usando imagen directa:', err);
        }
    }

    // Fallback garantizado con elemento IMG
    const qrImg = document.createElement('img');
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=0b132b&bgcolor=ffffff&margin=1`;
    qrImg.alt = "Código QR Escaneable";
    qrImg.style.width = "100%";
    qrImg.style.height = "100%";
    qrImg.style.display = "block";
    qrImg.style.borderRadius = "8px";
    container.appendChild(qrImg);
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
                    <img src="${inv.previewImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'}" alt="${inv.title}">
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
                            👁️ Ver Web
                        </button>
                        <button class="btn btn-secondary btn-sm" title="Ver y Descargar Código QR" onclick="openEventQrModal('${inv.slug || inv.id}', '${inv.title}')">
                            📱 QR
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
            <!-- Botón cerrar -->
            <button class="inv-close-btn" onclick="closeInvitationModal()">✕</button>

            <!-- Encabezado de lujo -->
            <div class="inv-hero-header">
                <div class="inv-monogram">${monogram}</div>
                <h1 class="inv-title">${inv.title}</h1>
                <p class="inv-subtitle">Tenemos el honor de invitarte a celebrar con nosotros</p>
                <div class="inv-divider">✦ ✦ ✦</div>
            </div>

            <!-- Cronómetro Regresivo Dinámico -->
            <div class="inv-countdown-box">
                <span class="countdown-label">FALTAN PARA EL GRAN DÍA</span>
                <div class="countdown-digits">
                    <div class="cd-item"><span id="cdDays">00</span><small>DÍAS</small></div>
                    <div class="cd-item"><span id="cdHours">00</span><small>HRS</small></div>
                    <div class="cd-item"><span id="cdMinutes">00</span><small>MIN</small></div>
                    <div class="cd-item"><span id="cdSeconds">00</span><small>SEG</small></div>
                </div>
            </div>

            <!-- Itinerario y Detalles del Evento -->
            <div class="inv-details-card">
                <div class="inv-detail-row">
                    <div class="inv-detail-icon">📅</div>
                    <div>
                        <strong>Fecha del Evento</strong>
                        <span>${inv.date} • ${inv.time || '17:00 HRS'}</span>
                    </div>
                </div>

                <div class="inv-detail-row">
                    <div class="inv-detail-icon">📍</div>
                    <div>
                        <strong>Lugar de Recepción</strong>
                        <span>${inv.location}</span>
                        <a href="https://maps.google.com/?q=${encodeURIComponent(inv.location + ', Cochabamba, Bolivia')}" target="_blank" class="inv-map-link">
                            🗺️ Ver Ubicación en Google Maps / Waze ➔
                        </a>
                    </div>
                </div>

                <div class="inv-detail-row">
                    <div class="inv-detail-icon">👔</div>
                    <div>
                        <strong>Código de Vestimenta</strong>
                        <span>${inv.dressCode || 'Rigurosa Gala / Formal'}</span>
                    </div>
                </div>

                <!-- Botón Google Calendar -->
                <div style="margin-top: 1rem;">
                    <a href="${gCalUrl}" target="_blank" class="btn btn-secondary btn-sm" style="width: 100%; justify-content: center; text-decoration: none;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
                        Agendar en Google Calendar
                    </a>
                </div>
            </div>

            <!-- Dedicatoria de los anfitriones -->
            ${inv.welcomeMessage ? `
                <div style="padding: 1.5rem; text-align: center; font-style: italic; color: #E2E8F0; font-size: 0.9rem; line-height: 1.6; background: rgba(0,0,0,0.25); margin: 0 1rem 1.5rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border-subtle);">
                    "${inv.welcomeMessage}"
                    <div style="margin-top: 0.5rem; font-weight: bold; font-style: normal; color: var(--accent-gold);">${inv.hostName}</div>
                </div>
            ` : ''}

            <!-- Barra de Coctelería del Evento -->
            <div style="background: rgba(11, 19, 43, 0.6); padding: 1.25rem; margin: 0 1rem 1.5rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border); text-align: center;">
                <span style="font-size: 0.75rem; color: var(--text-gold); font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 0.3rem;">BARRA LIBRE EXCLUSIVA</span>
                <h4 style="font-size: 1.05rem; color: #FFF; margin-bottom: 0.5rem;">Coctelería por Bartender Pro CBBA</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">Disfruta de nuestros cócteles de autor con Singani de altura y show en vivo.</p>
                <div style="display: flex; gap: 0.5rem; justify-content: center; font-size: 0.75rem; color: var(--accent-gold);">
                    <span>🍸 Chuflay Gran Reserva</span> • 
                    <span>🍹 Tumbo Sour</span> • 
                    <span>🍓 Gin Rosé</span>
                </div>
            </div>

            <!-- FORMULARIO DE CONFIRMACIÓN RSVP -->
            <div class="inv-rsvp-section">
                <div class="rsvp-card">
                    <span class="rsvp-tag">CONFIRMACIÓN DE ASISTENCIA</span>
                    <h3 class="rsvp-title">¿Nos acompañas?</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem;">
                        Por favor confirma tu asistencia para asignarte mesa y emitir tu pase digital con código QR.
                    </p>

                    <div id="rsvpFormFields" style="display: flex; flex-direction: column; gap: 0.75rem;">
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
                        <p style="font-size: 0.8rem; color: #E2E8F0; margin-bottom: 1rem;">Tu pase digital ha sido emitido y registrado en la base de datos.</p>

                        <!-- Contenedor del QR Canvas y Real Image -->
                        <div style="background: #FFFFFF; padding: 12px; border-radius: var(--radius-md); display: inline-block; box-shadow: var(--shadow-gold); margin-bottom: 0.75rem; border: 2px solid var(--accent-gold);">
                            <div id="rsvpQrCanvasContainer" style="width: 170px; height: 170px; display: flex; align-items: center; justify-content: center;">
                                <canvas id="rsvpQrCanvas" width="170" height="170" style="display: block; width: 100%; height: 100%;"></canvas>
                            </div>
                        </div>

                        <div style="font-size: 0.8rem; color: #FFF; margin-bottom: 0.75rem;">
                            <strong id="rsvpQrTokenText" style="color: var(--accent-gold); letter-spacing: 1px; display: block; font-size: 0.9rem;">QR-PASS</strong>
                            <span id="rsvpPassGuestName" style="color: #94A3B8;">Invitado Oficial</span>
                        </div>

                        <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 1rem;">Presenta este código QR en la entrada del salón.</p>

                        <button class="btn btn-secondary btn-sm" onclick="downloadQrPass()" style="width: 100%; justify-content: center;">
                            💾 Descargar Pase Digital
                        </button>
                    </div>
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

    let targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
        targetDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
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

function generateGoogleCalendarUrl(inv) {
    const title = encodeURIComponent(inv.title);
    const details = encodeURIComponent(`Invitación oficial para ${inv.title}. Servicio de coctelería a cargo de Bartender Pro Cochabamba.`);
    const location = encodeURIComponent(`${inv.location}, Cochabamba, Bolivia`);

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

    showToast('⏳ Registrando confirmación en la base de datos...');

    const rsvpResult = await window.DB.submitRSVP({
        invitationId: currentViewingInvitation ? currentViewingInvitation.id : null,
        guestName: guestName,
        phone: guestPhone,
        paxCount: pax,
        specialNotes: notes,
        tableNumber: 'Mesa Recepción'
    });

    // Mostrar caja de éxito y generar código QR real
    const successBox = document.getElementById('rsvpSuccessBox');
    const formFields = document.getElementById('rsvpFormFields');
    const tokenText = document.getElementById('rsvpQrTokenText');
    const nameText = document.getElementById('rsvpPassGuestName');

    if (successBox) {
        successBox.style.display = 'block';
        if (formFields) formFields.style.display = 'none';

        const token = rsvpResult.qr_token || `QR-PASS-${Math.floor(1000 + Math.random() * 9000)}`;
        if (tokenText) tokenText.innerText = token;
        if (nameText) nameText.innerText = `${guestName} (${pax} PAX)`;

        // Generar QR real
        renderRealQrCode('rsvpQrCanvas', `QR-PASS:${token}`, 170);

        // Confeti de celebración
        if (window.confetti) {
            window.confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        showToast(`🎉 ¡Confirmación registrada para ${guestName}! Pase QR emitido.`);
        successBox.scrollIntoView({ behavior: 'smooth' });
    }
}

function downloadQrPass() {
    const canvas = document.getElementById('rsvpQrCanvas');
    const tokenText = document.getElementById('rsvpQrTokenText')?.innerText || 'PASE';
    
    if (canvas) {
        const link = document.createElement('a');
        link.download = `pase-qr-${tokenText}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('💾 Pase digital guardado en tu dispositivo.');
    } else {
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent('QR-PASS:' + tokenText)}`;
        window.open(url, '_blank');
    }
}

function shareInvitationWhatsApp(slug, title) {
    const url = `${window.location.origin}${window.location.pathname}?inv=${slug}`;
    const text = `🍸 *¡Estás invitado a ${title}!* 🥂\n\nConfirma tu asistencia y obtén tu pase digital con código QR aquí:\n${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
}

// ====================================================================
// MODAL DE CÓDIGO QR OFICIAL DEL EVENTO (PARA IMPRIMIR Y COMPARTIR)
// ====================================================================

async function openEventQrModal(slugOrId, optionalTitle) {
    const inv = await window.DB.getInvitationBySlug(slugOrId);
    const title = inv ? inv.title : (optionalTitle || 'Invitación Digital');
    const slug = inv ? (inv.slug || inv.id) : slugOrId;
    const invUrl = `${window.location.origin}${window.location.pathname}?inv=${slug}`;

    currentEventQrData = { slug, title, url: invUrl };

    const modal = document.getElementById('eventQrModalOverlay');
    const titleEl = document.getElementById('eventQrModalTitle');
    const inputEl = document.getElementById('eventQrUrlInput');

    if (titleEl) titleEl.innerText = title;
    if (inputEl) inputEl.value = invUrl;

    if (modal) modal.classList.add('active');

    // Renderizar código QR real de alta resolución
    setTimeout(() => {
        renderRealQrCode('eventQrCanvas', invUrl, 220);
    }, 100);
}

function closeEventQrModal() {
    const modal = document.getElementById('eventQrModalOverlay');
    if (modal) modal.classList.remove('active');
}

function copyEventQrUrl() {
    const inputEl = document.getElementById('eventQrUrlInput');
    if (inputEl) {
        navigator.clipboard.writeText(inputEl.value).then(() => {
            showToast('📋 ¡Enlace copiado al portapapeles!');
        }).catch(() => {
            inputEl.select();
            document.execCommand('copy');
            showToast('📋 ¡Enlace copiado!');
        });
    }
}

function downloadEventQrImage() {
    const canvas = document.getElementById('eventQrCanvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = `codigo-qr-${currentEventQrData.slug || 'evento'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('💾 Código QR de alta resolución descargado.');
    }
}

function shareEventQrWhatsApp() {
    if (currentEventQrData.slug) {
        shareInvitationWhatsApp(currentEventQrData.slug, currentEventQrData.title);
    }
}

// ====================================================================
// CONSTRUCTOR DE INVITACIONES INTERACTIVO (ESTUDIO)
// ====================================================================

function openInvitationBuilderModal() {
    const modal = document.getElementById('invitationBuilderOverlay');
    if (modal) {
        modal.classList.add('active');
        updateBuilderLivePreview();
    }
}

function closeInvitationBuilderModal() {
    const modal = document.getElementById('invitationBuilderOverlay');
    if (modal) modal.classList.remove('active');
}

function updateBuilderLivePreview() {
    const previewContainer = document.getElementById('builderPhonePreview');
    if (!previewContainer) return;

    const title = document.getElementById('builderTitle')?.value || 'Boda Carlos & Sofía';
    const host = document.getElementById('builderHost')?.value || 'Carlos & Sofía';
    const date = document.getElementById('builderDate')?.value || '2026-10-15';
    const time = document.getElementById('builderTime')?.value || '17:00 HRS';
    const venue = document.getElementById('builderVenue')?.value || 'Centro de Eventos El Bosque, Tiquipaya';
    const dress = document.getElementById('builderDressCode')?.value || 'Rigurosa Gala';
    const message = document.getElementById('builderMessage')?.value || 'Nos llena de emoción compartir este momento contigo.';
    const bgStyle = document.getElementById('builderBgStyle')?.value || 'boda-theme';

    previewContainer.className = `inv-phone-screen ${bgStyle}`;

    previewContainer.innerHTML = `
        <div class="inv-hero-header" style="padding: 1.5rem 1rem 1rem 1rem;">
            <div class="inv-monogram" style="width: 50px; height: 50px; font-size: 1rem; margin-bottom: 0.5rem;">VIP</div>
            <h2 class="inv-title" style="font-size: 1.3rem;">${title}</h2>
            <p class="inv-subtitle" style="font-size: 0.75rem;">${host}</p>
            <div class="inv-divider" style="margin: 0.5rem 0;">✦ ✦ ✦</div>
        </div>

        <div class="inv-countdown-box" style="padding: 0.75rem; margin: 0 1rem 1rem 1rem;">
            <span class="countdown-label" style="font-size: 0.65rem;">FALTAN PARA EL GRAN DÍA</span>
            <div class="countdown-digits" style="gap: 0.3rem;">
                <div class="cd-item" style="padding: 0.3rem;"><span style="font-size: 1rem;">45</span><small style="font-size: 0.55rem;">DÍAS</small></div>
                <div class="cd-item" style="padding: 0.3rem;"><span style="font-size: 1rem;">12</span><small style="font-size: 0.55rem;">HRS</small></div>
                <div class="cd-item" style="padding: 0.3rem;"><span style="font-size: 1rem;">30</span><small style="font-size: 0.55rem;">MIN</small></div>
            </div>
        </div>

        <div class="inv-details-card" style="padding: 0.85rem; font-size: 0.8rem; margin: 0 1rem 1rem 1rem;">
            <div style="margin-bottom: 0.4rem;"><strong>📅 Fecha:</strong> ${date} - ${time}</div>
            <div style="margin-bottom: 0.4rem;"><strong>📍 Lugar:</strong> ${venue}</div>
            <div><strong>👔 Código:</strong> <span style="color: var(--accent-gold);">${dress}</span></div>
        </div>

        <div style="padding: 0.75rem; text-align: center; font-style: italic; color: #E2E8F0; font-size: 0.75rem; background: rgba(0,0,0,0.3); margin: 0 1rem 1rem 1rem; border-radius: var(--radius-md);">
            "${message}"
        </div>

        <div style="text-align: center; padding: 0.75rem; background: rgba(212,175,55,0.15); border-radius: var(--radius-md); margin: 0 1rem 1rem 1rem; border: 1px dashed var(--accent-gold);">
            <span style="font-size: 0.75rem; color: var(--accent-gold); font-weight: bold;">📱 Formulario RSVP + Pase QR Incluidos</span>
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
        themeColor: '#D4AF37',
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

    // Abrir automáticamente el modal con el código QR oficial del evento
    setTimeout(() => {
        openEventQrModal(slug, title);
    }, 500);
}

// Exponer funciones globales
window.renderRealQrCode = renderRealQrCode;
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
window.openEventQrModal = openEventQrModal;
window.closeEventQrModal = closeEventQrModal;
window.copyEventQrUrl = copyEventQrUrl;
window.downloadEventQrImage = downloadEventQrImage;
window.shareEventQrWhatsApp = shareEventQrWhatsApp;
