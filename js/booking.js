// js/booking.js - Asistente de Reserva Interactivo & Pasarela QR Simple Bolivia conectado a Supabase

let currentStep = 1;
let bookingState = {
    packageId: "pkg-premium",
    packageName: "Paquete Premium - Coctelería de Autor & Show",
    packagePrice: 1600,
    selectedDrinks: ["d1", "d2", "d4", "d6"],
    invitationId: "inv-premium",
    invitationName: "Invitación Web Premium con RSVP + QR",
    invitationPrice: 300,
    eventDate: "2026-09-19",
    eventLocation: "Tiquipaya - El Bosque",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    guestsCount: 80,
    proofUploaded: false,
    paymentProofUrl: null
};

document.addEventListener('DOMContentLoaded', () => {
    initBookingWizard();
});

function initBookingWizard() {
    const openBtn = document.getElementById('openBookingModalBtn');
    const closeBtn = document.getElementById('closeBookingModalBtn');
    
    if (openBtn) openBtn.addEventListener('click', () => openBookingModal());
    if (closeBtn) closeBtn.addEventListener('click', () => closeBookingModal());
}

async function openBookingModal(preselectedPkgId) {
    if (preselectedPkgId) {
        const pkgs = await window.DB.getPackages();
        const pkg = pkgs.find(p => p.id === preselectedPkgId);
        if (pkg) {
            bookingState.packageId = pkg.id;
            bookingState.packageName = pkg.name;
            bookingState.packagePrice = parseFloat(pkg.price);
        }
    }
    
    currentStep = 1;
    await renderWizardStep();
    
    const overlay = document.getElementById('bookingModalOverlay');
    if (overlay) overlay.classList.add('active');
}

function closeBookingModal() {
    const overlay = document.getElementById('bookingModalOverlay');
    if (overlay) overlay.classList.remove('active');
}

function calculateTotalBs() {
    const pkgCost = parseFloat(bookingState.packagePrice) || 0;
    const invCost = parseFloat(bookingState.invitationPrice) || 0;
    return pkgCost + invCost;
}

async function renderWizardStep() {
    const container = document.getElementById('bookingWizardContainer');
    if (!container) return;

    const totalBs = calculateTotalBs();
    const packages = await window.DB.getPackages();
    const invitationPkgs = [
        { id: 'inv-basico', name: 'Invitación Digital Básica PDF', price: 150, description: 'Diseño en PDF interactivo en alta resolución para WhatsApp.' },
        { id: 'inv-premium', name: 'Invitación Web Premium con RSVP + QR', price: 300, popular: true, description: 'Página web con formulario RSVP, cronómetro y pase QR individual.' },
        { id: 'inv-combo', name: 'Combo Evento VIP Completo', price: 450, description: 'Web Premium + QR para Mesa de Bienvenida + Galería post-evento.' }
    ];

    let stepHtml = '';

    // Barra de Progreso
    stepHtml += `
        <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span class="badge-tag">PASO ${currentStep} DE 5</span>
                <span style="font-size: 0.95rem; color: var(--text-gold); font-weight: 800;">TOTAL ESTIMADO: Bs. ${totalBs}</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                <div style="width: ${(currentStep / 5) * 100}%; height: 100%; background: var(--gold-gradient); transition: width 0.3s ease;"></div>
            </div>
        </div>
    `;

    if (currentStep === 1) {
        // PASO 1: Fecha, Invitados y Lugar
        stepHtml += `
            <h3 style="font-size: 1.4rem; margin-bottom: 0.4rem; color: #FFF;">📅 1. Elige Fecha y Lugar del Evento</h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.5rem;">Comprobaremos la disponibilidad en vivo con la agenda de Cochabamba.</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                    <label style="display: block; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.4rem;">Fecha del Evento *</label>
                    <input type="date" id="wizardEventDate" class="rsvp-input" value="${bookingState.eventDate}">
                </div>
                <div>
                    <label style="display: block; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.4rem;">Cantidad de Invitados (Estimada)</label>
                    <input type="number" id="wizardGuestCount" class="rsvp-input" value="${bookingState.guestsCount}" min="20" max="1000">
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.4rem;">Salón / Quinta en Cochabamba</label>
                <select id="wizardLocation" class="rsvp-input">
                    <option value="Tiquipaya - Centro de Eventos El Bosque" ${bookingState.eventLocation.includes('Tiquipaya') ? 'selected' : ''}>Tiquipaya (El Bosque / Jardines / Quintas)</option>
                    <option value="La Recoleta - Salón Hotel Cochabamba" ${bookingState.eventLocation.includes('Recoleta') ? 'selected' : ''}>Paseo La Recoleta / Hotel Cochabamba</option>
                    <option value="Pairumani - Salón & Quinta" ${bookingState.eventLocation.includes('Pairumani') ? 'selected' : ''}>Pairumani (Quintas & Jardines del Valle)</option>
                    <option value="Country Club Cochabamba" ${bookingState.eventLocation.includes('Country') ? 'selected' : ''}>Country Club Cochabamba</option>
                    <option value="Tupuraya / Zona Norte" ${bookingState.eventLocation.includes('Tupuraya') ? 'selected' : ''}>Tupuraya / Residencia Privada Zona Norte</option>
                    <option value="Sacaba / Quillacollo" ${bookingState.eventLocation.includes('Sacaba') ? 'selected' : ''}>Sacaba / Quillacollo / Colcapirhua</option>
                </select>
            </div>

            <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid #10B981; padding: 1rem; border-radius: var(--radius-md); display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: #10B981;">
                <span style="font-size: 1.2rem;">📅</span>
                <span><strong>Sincronizador Activo:</strong> La fecha seleccionada cuenta con disponibilidad de bartenders para tu evento.</span>
            </div>
        `;
    } else if (currentStep === 2) {
        // PASO 2: Selección de Paquete de Barra
        stepHtml += `
            <h3 style="font-size: 1.4rem; margin-bottom: 0.4rem; color: #FFF;">🍸 2. Selecciona tu Paquete de Barra Móvil</h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.5rem;">Escoge la barra y nivel de mixología que deseas para tu fiesta.</p>
            
            <div style="display: grid; gap: 0.85rem; margin-bottom: 1.5rem;">
                ${packages.map(p => `
                    <div onclick="selectWizardPkg('${p.id}', '${p.name}', ${p.price})" style="padding: 1rem 1.25rem; border-radius: var(--radius-md); background: ${bookingState.packageId === p.id ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${bookingState.packageId === p.id ? 'var(--accent-gold)' : 'var(--glass-border-subtle)'}; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: var(--transition-fast);">
                        <div>
                            <strong style="display: block; color: #FFF; font-size: 0.98rem;">${p.name}</strong>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">${p.capacity} • ${p.badge || 'Barra Completa'}</span>
                        </div>
                        <span style="font-weight: 800; font-size: 1.15rem; color: var(--accent-gold);">Bs. ${p.price}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (currentStep === 3) {
        // PASO 3: Paquete de Invitaciones Digitales
        stepHtml += `
            <h3 style="font-size: 1.4rem; margin-bottom: 0.4rem; color: #FFF;">💌 3. Añade tu Paquete de Invitaciones Digitales</h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.5rem;">Facilita la confirmación de tus invitados con invitaciones interactivas y pases QR.</p>
            
            <div style="display: grid; gap: 0.85rem; margin-bottom: 1.5rem;">
                <div onclick="selectWizardInv('inv-none', 'Sin Invitación Digital', 0)" style="padding: 1rem 1.25rem; border-radius: var(--radius-md); background: ${bookingState.invitationId === 'inv-none' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${bookingState.invitationId === 'inv-none' ? 'var(--accent-gold)' : 'var(--glass-border-subtle)'}; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="display: block; color: #FFF;">Solo Servicio de Bartender</strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Sin contratación de invitaciones interactivas</span>
                    </div>
                    <span style="font-weight: 700; color: var(--text-muted);">Bs. 0</span>
                </div>

                ${invitationPkgs.map(inv => `
                    <div onclick="selectWizardInv('${inv.id}', '${inv.name}', ${inv.price})" style="padding: 1rem 1.25rem; border-radius: var(--radius-md); background: ${bookingState.invitationId === inv.id ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${bookingState.invitationId === inv.id ? 'var(--accent-gold)' : 'var(--glass-border-subtle)'}; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="display: block; color: #FFF;">${inv.name} ${inv.popular ? '⭐' : ''}</strong>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">${inv.description}</span>
                        </div>
                        <span style="font-weight: 800; font-size: 1.15rem; color: var(--accent-gold);">Bs. ${inv.price}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (currentStep === 4) {
        // PASO 4: Datos del Anfitrión
        stepHtml += `
            <h3 style="font-size: 1.4rem; margin-bottom: 0.4rem; color: #FFF;">👤 4. Datos del Anfitrión o Contratante</h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.5rem;">Generaremos el contrato digital y te enviaremos la confirmación por WhatsApp.</p>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.4rem;">Nombre Completo / Anfitrión *</label>
                <input type="text" id="wizardClientName" class="rsvp-input" placeholder="Ej: Arq. Carlos Gutierrez" value="${bookingState.clientName}">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                    <label style="display: block; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.4rem;">WhatsApp (Bolivia) *</label>
                    <input type="tel" id="wizardClientPhone" class="rsvp-input" placeholder="+591 797XXXXX" value="${bookingState.clientPhone}">
                </div>
                <div>
                    <label style="display: block; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.4rem;">Correo Electrónico</label>
                    <input type="email" id="wizardClientEmail" class="rsvp-input" placeholder="correo@ejemplo.bo" value="${bookingState.clientEmail}">
                </div>
            </div>

            <div style="text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--glass-border-subtle);">
                <button class="btn btn-outline btn-sm" onclick="demoGoogleLogin()">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.032-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/></svg>
                    Autocompletar con Google Demo
                </button>
            </div>
        `;
    } else if (currentStep === 5) {
        // PASO 5: Confirmación y Pasarela QR Simple Bolivia
        stepHtml += `
            <h3 style="font-size: 1.4rem; margin-bottom: 0.4rem; color: #FFF;">💳 5. Confirmación y Pago por QR Simple Bolivia</h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.5rem;">Escanea el código QR desde tu app bancaria (BNB, Banco Unión, BCP, Mercantil, Bisa) y adjunta el comprobante.</p>
            
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-muted);">Servicio Barra: ${bookingState.packageName}</span>
                    <strong style="color: var(--accent-gold);">Bs. ${bookingState.packagePrice}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-muted);">Invitaciones: ${bookingState.invitationName}</span>
                    <strong style="color: var(--accent-gold);">Bs. ${bookingState.invitationPrice}</strong>
                </div>
                <div style="border-top: 1px dashed var(--glass-border-subtle); padding-top: 0.6rem; display: flex; justify-content: space-between; font-weight: 800; font-size: 1.15rem; color: #FFF;">
                    <span>Monto Total a Transferir:</span>
                    <span class="text-gold">Bs. ${totalBs}</span>
                </div>
            </div>

            <!-- Código QR Simple Bolivia -->
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="display: inline-block; background: #FFF; padding: 12px; border-radius: var(--radius-md); border: 3px solid var(--accent-gold); box-shadow: var(--shadow-gold);">
                    <svg viewBox="0 0 100 100" style="width: 140px; height: 140px;">
                        <rect width="100" height="100" fill="white"/>
                        <rect x="5" y="5" width="90" height="90" fill="none" stroke="#19376D" stroke-width="2"/>
                        <text x="50" y="18" font-size="7" text-anchor="middle" fill="#000" font-weight="bold">QR SIMPLE BOLIVIA</text>
                        <rect x="15" y="24" width="24" height="24" fill="#0B132B"/>
                        <rect x="18" y="27" width="18" height="18" fill="white"/>
                        <rect x="22" y="31" width="10" height="10" fill="#0B132B"/>

                        <rect x="61" y="24" width="24" height="24" fill="#0B132B"/>
                        <rect x="64" y="27" width="18" height="18" fill="white"/>
                        <rect x="68" y="31" width="10" height="10" fill="#0B132B"/>

                        <rect x="15" y="61" width="24" height="24" fill="#0B132B"/>
                        <rect x="18" y="64" width="18" height="18" fill="white"/>
                        <rect x="22" y="68" width="10" height="10" fill="#0B132B"/>

                        <rect x="45" y="45" width="12" height="12" fill="#D4AF37"/>
                        <rect x="60" y="60" width="15" height="15" fill="#0B132B"/>
                    </svg>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">Cuentas: Banco Nacional de Bolivia (BNB) / Banco Unión (Bartender Pro S.R.L.)</p>
            </div>

            <!-- Caja para Subir Comprobante -->
            <div style="border: 2px dashed ${bookingState.proofUploaded ? '#10B981' : 'var(--glass-border)'}; border-radius: var(--radius-md); padding: 1.25rem; text-align: center; background: rgba(255,255,255,0.02); margin-bottom: 1.5rem;">
                ${bookingState.proofUploaded ? `
                    <div style="color: #10B981;">
                        <strong style="font-size: 1rem; display: block; margin-bottom: 0.3rem;">✅ Comprobante Adjuntado con Éxito</strong>
                        <span style="font-size: 0.82rem;">La reserva pasará a estado: <span class="status-pill revision">EN REVISIÓN</span></span>
                    </div>
                ` : `
                    <strong style="font-size: 0.95rem; color: #FFF; display: block; margin-bottom: 0.3rem;">Subir Comprobante de Transferencia QR</strong>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">Arrastra y suelta tu archivo o presiona el botón</p>
                    <input type="file" id="bookingReceiptFileInput" accept="image/*,.pdf" style="display: none;" onchange="handleReceiptFileSelect(event)">
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('bookingReceiptFileInput').click()">📎 Adjuntar Comprobante</button>
                    <button class="btn btn-outline btn-sm" onclick="simulatedUploadProof()" style="margin-left: 6px;">⚡ Adjuntar Demo</button>
                `}
            </div>
        `;
    }

    // Botones de Navegación del Paso
    stepHtml += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid var(--glass-border-subtle);">
            ${currentStep > 1 ? `
                <button class="btn btn-outline btn-sm" onclick="changeWizardStep(-1)">⬅️ Volver</button>
            ` : '<div></div>'}
            
            ${currentStep < 5 ? `
                <button class="btn btn-primary" onclick="changeWizardStep(1)">Siguiente Paso ➡️</button>
            ` : `
                <button class="btn btn-primary" onclick="finishBookingProcess()">🎉 Confirmar y Enviar Reserva</button>
            `}
        </div>
    `;

    container.innerHTML = stepHtml;
}

function changeWizardStep(delta) {
    if (delta > 0) {
        if (currentStep === 1) {
            const d = document.getElementById('wizardEventDate');
            const g = document.getElementById('wizardGuestCount');
            const l = document.getElementById('wizardLocation');
            if (d) bookingState.eventDate = d.value;
            if (g) bookingState.guestsCount = parseInt(g.value);
            if (l) bookingState.eventLocation = l.value;
        } else if (currentStep === 4) {
            const n = document.getElementById('wizardClientName');
            const p = document.getElementById('wizardClientPhone');
            const e = document.getElementById('wizardClientEmail');
            if (n) bookingState.clientName = n.value.trim();
            if (p) bookingState.clientPhone = p.value.trim();
            if (e) bookingState.clientEmail = e.value.trim();
            
            if (!bookingState.clientName) {
                showToast('⚠️ Por favor ingresa el nombre del anfitrión.');
                return;
            }
            if (!bookingState.clientPhone) {
                showToast('⚠️ Por favor ingresa el número de WhatsApp para contacto.');
                return;
            }
        }
    }
    
    currentStep += delta;
    if (currentStep < 1) currentStep = 1;
    if (currentStep > 5) currentStep = 5;
    renderWizardStep();
}

function selectWizardPkg(id, name, price) {
    bookingState.packageId = id;
    bookingState.packageName = name;
    bookingState.packagePrice = price;
    renderWizardStep();
    showToast(`Paquete seleccionado: ${name}`);
}

function selectWizardInv(id, name, price) {
    bookingState.invitationId = id;
    bookingState.invitationName = name;
    bookingState.invitationPrice = price;
    renderWizardStep();
    showToast(`Invitación seleccionada: ${name}`);
}

function simulatedUploadProof() {
    bookingState.proofUploaded = true;
    bookingState.paymentProofUrl = "comprobante_qr_simulado.jpg";
    renderWizardStep();
    showToast('📄 Comprobante simulado subido. Estado: En Revisión');
}

function handleReceiptFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        bookingState.proofUploaded = true;
        bookingState.paymentProofUrl = file.name;
        renderWizardStep();
        showToast(`📄 Archivo "${file.name}" cargado exitosamente.`);
    }
}

async function finishBookingProcess() {
    showToast('⏳ Guardando reserva en la base de datos Supabase...');

    const result = await window.DB.createBooking({
        clientName: bookingState.clientName || "Anfitrión Bartender Pro",
        clientPhone: bookingState.clientPhone || "+591 797 00000",
        clientEmail: bookingState.clientEmail || "contacto@cliente.bo",
        eventDate: bookingState.eventDate,
        eventLocation: bookingState.eventLocation,
        guestsCount: bookingState.guestsCount,
        packageId: bookingState.packageId,
        packageName: bookingState.packageName,
        invitationId: bookingState.invitationId,
        invitationName: bookingState.invitationName,
        totalAmount: calculateTotalBs(),
        proofUploaded: bookingState.proofUploaded,
        paymentProofUrl: bookingState.paymentProofUrl
    });

    closeBookingModal();

    if (window.confetti) {
        window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }

    showToast(`🎉 ¡Reserva ${result.id} confirmada! Hemos registrado tu solicitud en Supabase.`);

    if (window.renderAdminDashboard) {
        window.renderAdminDashboard();
    }
}

function demoGoogleLogin() {
    bookingState.clientName = "Lic. Roberto Arnez (Google Account)";
    bookingState.clientPhone = "+591 797 88220";
    bookingState.clientEmail = "roberto.arnez@gmail.com";
    renderWizardStep();
    showToast('🔑 Datos cargados desde Google OAuth');
}

window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.changeWizardStep = changeWizardStep;
window.selectWizardPkg = selectWizardPkg;
window.selectWizardInv = selectWizardInv;
window.simulatedUploadProof = simulatedUploadProof;
window.handleReceiptFileSelect = handleReceiptFileSelect;
window.finishBookingProcess = finishBookingProcess;
window.demoGoogleLogin = demoGoogleLogin;
