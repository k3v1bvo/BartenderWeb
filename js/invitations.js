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

    // Tipo de evento etiqueta caligráfica
    const calligraphyLabels = {
        boda: 'Nuestra Boda',
        quince: 'Mis 15 Años',
        corporativo: 'Gala Exclusiva',
        cumpleanos: 'Celebración VIP',
        graduacion: 'Nuestra Graduación'
    };
    const eventCalligraphy = calligraphyLabels[inv.type] || 'Estás Invitado';

    modalContainer.innerHTML = `
        <div class="inv-phone-screen ${inv.bgStyle || 'boda-theme'}">
            <!-- Botón cerrar elegante -->
            <button class="inv-close-btn" onclick="closeInvitationModal()" title="Cerrar Invitación">✕</button>

            <!-- Encabezado de Lujo con Sello Monograma y Tipografía Nupcial -->
            <div class="inv-hero-header">
                <div class="inv-monogram-seal">
                    <span class="inv-monogram-text">${monogram}</span>
                </div>
                
                <span class="inv-calligraphy-badge">${eventCalligraphy}</span>
                <h1 class="inv-title">${inv.title}</h1>
                <p class="inv-subtitle">Tenemos el honor de invitarte a celebrar con nosotros</p>
                
                <div class="inv-ornament-divider">✦ ── ⚜ ── ✦</div>
            </div>

            <!-- Cronómetro Regresivo de Gala -->
            <div class="inv-countdown-luxury">
                <span class="countdown-luxury-label">CUENTA REGRESIVA PARA EL GRAN DÍA</span>
                <div class="countdown-luxury-grid">
                    <div class="countdown-box-item">
                        <span id="cdDays" class="countdown-box-num">00</span>
                        <span class="countdown-box-lbl">DÍAS</span>
                    </div>
                    <div class="countdown-box-item">
                        <span id="cdHours" class="countdown-box-num">00</span>
                        <span class="countdown-box-lbl">HORAS</span>
                    </div>
                    <div class="countdown-box-item">
                        <span id="cdMinutes" class="countdown-box-num">00</span>
                        <span class="countdown-box-lbl">MIN</span>
                    </div>
                    <div class="countdown-box-item">
                        <span id="cdSeconds" class="countdown-box-num">00</span>
                        <span class="countdown-box-lbl">SEG</span>
                    </div>
                </div>
            </div>

            <!-- Tarjeta de Detalles del Evento (Itinerario & Salón) -->
            <div class="inv-details-luxury-card">
                <div class="inv-luxury-row">
                    <div class="inv-icon-badge">📅</div>
                    <div>
                        <span class="inv-row-label">Fecha & Hora</span>
                        <span class="inv-row-value">${inv.date} • ${inv.time || '17:00 HRS'}</span>
                    </div>
                </div>

                <div class="inv-luxury-row">
                    <div class="inv-icon-badge">📍</div>
                    <div>
                        <span class="inv-row-label">Lugar de Recepción</span>
                        <span class="inv-row-value" style="display: block; margin-bottom: 4px;">${inv.location}</span>
                        <a href="https://maps.google.com/?q=${encodeURIComponent(inv.location + ', Cochabamba, Bolivia')}" target="_blank" class="inv-map-btn-luxury">
                            🗺️ Abrir en Google Maps / Waze ➔
                        </a>
                    </div>
                </div>

                <div class="inv-luxury-row">
                    <div class="inv-icon-badge">👔</div>
                    <div>
                        <span class="inv-row-label">Código de Vestimenta</span>
                        <span class="inv-row-value">${inv.dressCode || 'Rigurosa Gala / Formal'}</span>
                    </div>
                </div>

                <!-- Botón Google Calendar Elegante -->
                <div style="margin-top: 1.25rem;">
                    <a href="${gCalUrl}" target="_blank" class="btn btn-secondary btn-sm" style="width: 100%; justify-content: center; text-decoration: none; border-color: rgba(212,175,55,0.4);">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
                        Agendar en Google Calendar
                    </a>
                </div>
            </div>

            <!-- Dedicatoria de los Anfitriones -->
            ${inv.welcomeMessage ? `
                <div style="padding: 1.5rem; text-align: center; font-style: italic; color: #F1F5F9; font-size: 0.92rem; line-height: 1.6; background: rgba(0,0,0,0.35); margin: 0 1.25rem 1.75rem 1.25rem; border-radius: 16px; border: 1px solid rgba(212,175,55,0.25);">
                    "${inv.welcomeMessage}"
                    <div style="margin-top: 0.6rem; font-weight: bold; font-style: normal; color: #D4AF37; font-family: 'Cinzel', serif; font-size: 0.85rem;">— ${inv.hostName} —</div>
                </div>
            ` : ''}

            <!-- Barra de Coctelería de Autor (Bartender Pro) -->
            <div class="inv-bar-luxury-card">
                <span class="inv-bar-tag">BARRA LIBRE DE AUTOR</span>
                <h4 class="inv-bar-title">Coctelería por Bartender Pro CBBA</h4>
                <p class="inv-bar-desc">Cocteles de autor con Singani de altura, frutas del valle y show en vivo.</p>
                <div class="inv-bar-cocktails-chips">
                    <span class="inv-cocktail-chip">🍸 Chuflay Gran Reserva</span>
                    <span class="inv-cocktail-chip">🍹 Tumbo Sour Royale</span>
                    <span class="inv-cocktail-chip">🍓 Gin Rosé de Altura</span>
                    <span class="inv-cocktail-chip">🔥 Flameado en Barra</span>
                </div>
            </div>

            <!-- FORMULARIO NUPCIAL RSVP & TARJETA DE CONFIRMACIÓN -->
            <div class="inv-rsvp-wrapper">
                <div id="rsvpFormFields">
                    <div class="rsvp-luxury-header">
                        <span class="rsvp-script-title">R. S. V. P.</span>
                        <h3 class="rsvp-main-title">Confirmación de Asistencia</h3>
                        <p style="font-size: 0.82rem; color: #94A3B8; margin-top: 4px;">
                            Confirma tu presencia para asignarte mesa y generar tu pase digital VIP.
                        </p>
                    </div>

                    <div style="text-align: left; margin-bottom: 0.85rem;">
                        <label style="font-size: 0.72rem; color: #D4AF37; display: block; margin-bottom: 3px; font-weight: 700; letter-spacing: 1px;">NOMBRE Y APELLIDO *</label>
                        <input type="text" id="rsvpGuestName" class="rsvp-luxury-input" placeholder="Ej: Lic. Rodrigo Morales">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; text-align: left; margin-bottom: 0.85rem;">
                        <div>
                            <label style="font-size: 0.72rem; color: #D4AF37; display: block; margin-bottom: 3px; font-weight: 700; letter-spacing: 1px;">WHATSAPP</label>
                            <input type="tel" id="rsvpGuestPhone" class="rsvp-luxury-input" placeholder="+591 797XXXXX">
                        </div>
                        <div>
                            <label style="font-size: 0.72rem; color: #D4AF37; display: block; margin-bottom: 3px; font-weight: 700; letter-spacing: 1px;">PASES / PAX</label>
                            <select class="rsvp-luxury-input" id="rsvpGuestPax">
                                <option value="1">1 Persona (Individual)</option>
                                <option value="2" selected>2 Personas (Pareja)</option>
                                <option value="3">3 Personas</option>
                                <option value="4">Pase Familiar (4+)</option>
                            </select>
                        </div>
                    </div>

                    <div style="text-align: left; margin-bottom: 1.25rem;">
                        <label style="font-size: 0.72rem; color: #D4AF37; display: block; margin-bottom: 3px; font-weight: 700; letter-spacing: 1px;">MENSAJE O CANCIÓN PARA EL DJ (OPCIONAL)</label>
                        <input type="text" id="rsvpGuestNotes" class="rsvp-luxury-input" placeholder="Canción para bailar o preferencia dietética">
                    </div>

                    <button class="btn-luxury-gold" onclick="handleRSVPSubmit()">
                        ✨ Confirmar Asistencia & Generar Pase VIP
                    </button>
                </div>

                <!-- PASE VIP DIGITAL (GOLDEN TICKET CONFIRMATION) -->
                <div id="rsvpSuccessBox" class="golden-ticket-card" style="display: none;">
                    <div class="ticket-notch-left"></div>
                    <div class="ticket-notch-right"></div>

                    <span class="golden-ticket-badge">✦ PASE DIGITAL VIP • ACCESO AUTORIZADO ✦</span>
                    
                    <h3 id="rsvpPassGuestName" class="golden-ticket-guest">Invitado Oficial</h3>
                    
                    <div class="golden-ticket-meta">
                        <span id="rsvpPassPaxText">🎟️ 2 Personas</span> • 
                        <span>🍽️ Mesa Asignada</span>
                    </div>

                    <div class="golden-qr-frame">
                        <canvas id="rsvpQrCanvas" width="180" height="180" style="display: block;"></canvas>
                    </div>

                    <strong id="rsvpQrTokenText" style="color: #D4AF37; font-family: monospace; font-size: 0.95rem; letter-spacing: 2px; display: block; margin-bottom: 0.5rem;">QR-PASS</strong>
                    
                    <p style="font-size: 0.78rem; color: #94A3B8; margin-bottom: 1.25rem;">
                        Presenta este código QR en la mesa de recepción del salón.
                    </p>

                    <button class="btn btn-primary btn-sm" onclick="downloadQrPass()" style="width: 100%; justify-content: center;">
                        💾 Descargar Pase VIP en Mi Celular (PNG)
                    </button>
                </div>
            </div>

            <!-- Branding Footer -->
            <div class="inv-footer-branding">
                Desarrollado con 🍸 <strong>Bartender Pro Cochabamba</strong><br>
                Coctelería de Autor & Plataforma de Invitaciones Digitales
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
    const type = document.getElementById('builderEventType')?.value || 'boda';

    const calligraphyLabels = {
        boda: 'Nuestra Boda',
        quince: 'Mis 15 Años',
        corporativo: 'Gala Exclusiva',
        cumpleanos: 'Celebración VIP',
        graduacion: 'Nuestra Graduación'
    };
    const eventCalligraphy = calligraphyLabels[type] || 'Nuestra Celebración';

    // Monograma corto
    const parts = host.split(' ');
    const mono = parts.length > 1 ? `${parts[0].charAt(0)} & ${parts[1].charAt(0)}` : host.substring(0, 2).toUpperCase();

    previewContainer.className = `inv-phone-screen ${bgStyle}`;

    previewContainer.innerHTML = `
        <div class="inv-hero-header" style="padding: 2rem 1rem 1rem 1rem;">
            <div class="inv-monogram-seal" style="width: 60px; height: 60px; margin-bottom: 0.75rem;">
                <span class="inv-monogram-text" style="font-size: 1rem;">${mono}</span>
            </div>
            <span class="inv-calligraphy-badge" style="font-size: 1.6rem;">${eventCalligraphy}</span>
            <h2 class="inv-title" style="font-size: 1.3rem;">${title}</h2>
            <p class="inv-subtitle" style="font-size: 0.68rem; letter-spacing: 2px;">${host}</p>
            <div class="inv-ornament-divider" style="margin: 0.75rem auto;">✦ ── ⚜ ── ✦</div>
        </div>

        <div class="inv-countdown-luxury" style="padding: 0.85rem 0.5rem; margin: 0 0.75rem 1rem 0.75rem;">
            <span class="countdown-luxury-label" style="font-size: 0.6rem; margin-bottom: 0.4rem;">FALTAN PARA EL GRAN DÍA</span>
            <div class="countdown-luxury-grid" style="gap: 0.3rem;">
                <div class="countdown-box-item" style="padding: 0.4rem 0.2rem;"><span class="countdown-box-num" style="font-size: 1.1rem;">45</span><span class="countdown-box-lbl" style="font-size: 0.55rem;">DÍAS</span></div>
                <div class="countdown-box-item" style="padding: 0.4rem 0.2rem;"><span class="countdown-box-num" style="font-size: 1.1rem;">12</span><span class="countdown-box-lbl" style="font-size: 0.55rem;">HRS</span></div>
                <div class="countdown-box-item" style="padding: 0.4rem 0.2rem;"><span class="countdown-box-num" style="font-size: 1.1rem;">30</span><span class="countdown-box-lbl" style="font-size: 0.55rem;">MIN</span></div>
                <div class="countdown-box-item" style="padding: 0.4rem 0.2rem;"><span class="countdown-box-num" style="font-size: 1.1rem;">00</span><span class="countdown-box-lbl" style="font-size: 0.55rem;">SEG</span></div>
            </div>
        </div>

        <div class="inv-details-luxury-card" style="padding: 1rem; margin: 0 0.75rem 1rem 0.75rem; font-size: 0.8rem;">
            <div style="margin-bottom: 0.6rem;">
                <span class="inv-row-label" style="font-size: 0.65rem;">📅 FECHA & HORA</span>
                <span class="inv-row-value" style="font-size: 0.85rem;">${date} • ${time}</span>
            </div>
            <div style="margin-bottom: 0.6rem;">
                <span class="inv-row-label" style="font-size: 0.65rem;">📍 LUGAR</span>
                <span class="inv-row-value" style="font-size: 0.85rem;">${venue}</span>
            </div>
            <div>
                <span class="inv-row-label" style="font-size: 0.65rem;">👔 VESTIMENTA</span>
                <span class="inv-row-value" style="font-size: 0.85rem; color: #D4AF37;">${dress}</span>
            </div>
        </div>

        <div style="padding: 0.85rem; text-align: center; font-style: italic; color: #F1F5F9; font-size: 0.78rem; background: rgba(0,0,0,0.4); margin: 0 0.75rem 1rem 0.75rem; border-radius: 12px; border: 1px solid rgba(212,175,55,0.25);">
            "${message}"
        </div>

        <div style="text-align: center; padding: 0.85rem; background: rgba(212,175,55,0.12); border-radius: 12px; margin: 0 0.75rem 1rem 0.75rem; border: 1px dashed #D4AF37;">
            <span style="font-size: 0.75rem; color: #D4AF37; font-weight: bold; font-family: 'Cinzel', serif;">✦ FORMULARIO RSVP + PASE VIP QR INCLUIDOS ✦</span>
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
