// booking.js - Asistente de Reserva Interactivo & Pasarela QR Simple Bolivia

let currentStep = 1;
let bookingState = {
    packageId: "pkg-premium",
    packageName: "Paquete Premium - Coctelería de Autor",
    packagePrice: 1600,
    selectedDrinks: ["d1", "d2", "d4", "d6"],
    invitationId: "inv-premium",
    invitationName: "Invitación Web Premium con RSVP",
    invitationPrice: 300,
    eventDate: "2026-09-19",
    eventLocation: "Cochabamba - Zona Norte / Recoleta",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    guestsCount: 80,
    proofUploaded: false
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

function openBookingModal(preselectedPkgId) {
    if (preselectedPkgId) {
        const pkg = window.BARTENDER_DATA.packages.find(p => p.id === preselectedPkgId);
        if (pkg) {
            bookingState.packageId = pkg.id;
            bookingState.packageName = pkg.name;
            bookingState.packagePrice = pkg.price;
        }
    }
    
    currentStep = 1;
    renderWizardStep();
    
    const overlay = document.getElementById('bookingModalOverlay');
    if (overlay) overlay.classList.add('active');
}

function closeBookingModal() {
    const overlay = document.getElementById('bookingModalOverlay');
    if (overlay) overlay.classList.remove('active');
}

function calculateTotalBs() {
    let pkgCost = bookingState.packagePrice || 0;
    let invCost = bookingState.invitationPrice || 0;
    return pkgCost + invCost;
}

function renderWizardStep() {
    const container = document.getElementById('bookingWizardContainer');
    if (!container) return;

    const data = window.BARTENDER_DATA;
    const totalBs = calculateTotalBs();

    let stepHtml = '';

    // Step Header Progress
    stepHtml += `
        <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <span class="badge-tag">PASO ${currentStep} DE 5</span>
                <span style="font-size: 0.85rem; color: var(--text-gold); font-weight: 700;">TOTAL ESTIMADO: Bs. ${totalBs}</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                <div style="width: ${(currentStep / 5) * 100}%; height: 100%; background: var(--gold-gradient); transition: width 0.3s ease;"></div>
            </div>
        </div>
    `;

    if (currentStep === 1) {
        // STEP 1: Date & Guests
        stepHtml += `
            <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">📅 1. Elige la Fecha y Escenario del Evento</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Comprobaremos la disponibilidad en vivo y sincronizaremos con Google Calendar.</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.4rem;">Fecha del Evento</label>
                    <input type="date" id="wizardEventDate" class="rsvp-input" value="${bookingState.eventDate}">
                </div>
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.4rem;">Cantidad de Invitados</label>
                    <input type="number" id="wizardGuestCount" class="rsvp-input" value="${bookingState.guestsCount}" min="20" max="500">
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.4rem;">Ubicación / Salón en Cochabamba</label>
                <select id="wizardLocation" class="rsvp-input">
                    <option value="Tiquipaya - El Bosque">Tiquipaya (El Bosque / Jardines)</option>
                    <option value="La Recoleta - Salón de Eventos">Paseo La Recoleta / Av. Pando</option>
                    <option value="Pairumani - Quinta de Eventos">Pairumani (Quintas & Jardines)</option>
                    <option value="Country Club Cochabamba">Country Club Cochabamba</option>
                    <option value="Tupuraya - Residencia Privada">Tupuraya / Zona Norte</option>
                    <option value="Sacaba / Quillacollo">Sacaba / Quillacollo</option>
                </select>
            </div>

            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10B981; padding: 1rem; border-radius: var(--radius-md); display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: #10B981;">
                <span>📅</span>
                <span><strong>Sincronizador Google Calendar Activo:</strong> La fecha seleccionada se encuentra 100% disponible en la agenda oficial.</span>
            </div>
        `;
    } else if (currentStep === 2) {
        // STEP 2: Package & Drinks Selection
        stepHtml += `
            <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">🍸 2. Selecciona tu Paquete y Carta de Cócteles</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Elige la barra ideal para deslumbrar a tus invitados.</p>
            
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-size: 0.85rem; color: var(--text-gold); font-weight: 700; margin-bottom: 0.75rem;">Paquetes Disponibles</label>
                <div style="display: grid; gap: 0.75rem;">
                    ${data.packages.map(p => `
                        <div onclick="selectWizardPkg('${p.id}', '${p.name}', ${p.price})" style="padding: 1rem; border-radius: var(--radius-md); background: ${bookingState.packageId === p.id ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${bookingState.packageId === p.id ? 'var(--accent-gold)' : 'var(--glass-border-subtle)'}; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="display: block; color: #fff;">${p.name}</strong>
                                <span style="font-size: 0.8rem; color: var(--text-muted);">${p.capacity}</span>
                            </div>
                            <span style="font-weight: 800; color: var(--accent-gold);">Bs. ${p.price}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (currentStep === 3) {
        // STEP 3: Digital Invitations Add-on
        stepHtml += `
            <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">💌 3. Añade tu Paquete de Invitaciones Digitales</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Ofrece una experiencia inolvidable a tus invitados desde el primer mensaje.</p>
            
            <div style="display: grid; gap: 0.75rem; margin-bottom: 1.5rem;">
                <div onclick="selectWizardInv('inv-none', 'Sin Invitación Digital', 0)" style="padding: 1rem; border-radius: var(--radius-md); background: ${bookingState.invitationId === 'inv-none' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${bookingState.invitationId === 'inv-none' ? 'var(--accent-gold)' : 'var(--glass-border-subtle)'}; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="display: block; color: #fff;">Sin servicio de invitaciones digitales</strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Solo contratar el servicio de barra libre de Bartender</span>
                    </div>
                    <span style="font-weight: 700; color: var(--text-muted);">Bs. 0</span>
                </div>
                ${data.invitationPackages.map(inv => `
                    <div onclick="selectWizardInv('${inv.id}', '${inv.name}', ${inv.price})" style="padding: 1rem; border-radius: var(--radius-md); background: ${bookingState.invitationId === inv.id ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${bookingState.invitationId === inv.id ? 'var(--accent-gold)' : 'var(--glass-border-subtle)'}; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="display: block; color: #fff;">${inv.name} ${inv.popular ? '⭐' : ''}</strong>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">${inv.description}</span>
                        </div>
                        <span style="font-weight: 800; color: var(--accent-gold);">Bs. ${inv.price}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (currentStep === 4) {
        // STEP 4: Client Info
        stepHtml += `
            <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">👤 4. Datos del Anfitrión y Contacto</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Enviaremos el contrato y comprobante digital a tu correo.</p>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.4rem;">Nombre Completo o Razón Social</label>
                <input type="text" id="wizardClientName" class="rsvp-input" placeholder="Ej: Arq. Carlos Gutierrez" value="${bookingState.clientName}">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.4rem;">Teléfono / WhatsApp (Bolivia)</label>
                    <input type="tel" id="wizardClientPhone" class="rsvp-input" placeholder="+591 797 XXXXX" value="${bookingState.clientPhone}">
                </div>
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.4rem;">Correo Electrónico</label>
                    <input type="email" id="wizardClientEmail" class="rsvp-input" placeholder="correo@ejemplo.bo" value="${bookingState.clientEmail}">
                </div>
            </div>

            <!-- Google OAuth Demo Button -->
            <div style="text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--glass-border-subtle);">
                <button class="btn btn-outline btn-sm" onclick="demoGoogleLogin()">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/></svg>
                    Auto-completar con Google (OAuth)
                </button>
            </div>
        `;
    } else if (currentStep === 5) {
        // STEP 5: Payment Summary & QR Simple Simulator
        stepHtml += `
            <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">💳 5. Confirmación y Pago por QR Simple Bolivia</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Escanea el código QR desde la App de tu Banco (BNB, Banco Unión, BCP, Mercantil) y sube tu comprobante.</p>
            
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.5rem;">
                    <span>Servicio: ${bookingState.packageName}</span>
                    <strong style="color: var(--accent-gold);">Bs. ${bookingState.packagePrice}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.5rem;">
                    <span>Servicio: ${bookingState.invitationName}</span>
                    <strong style="color: var(--accent-gold);">Bs. ${bookingState.invitationPrice}</strong>
                </div>
                <div style="border-top: 1px dashed var(--glass-border-subtle); padding-top: 0.5rem; display: flex; justify-content: space-between; font-weight: 800; font-size: 1.1rem; color: #FFF;">
                    <span>Monto Total a Transferir:</span>
                    <span class="text-gold">Bs. ${totalBs}</span>
                </div>
            </div>

            <!-- QR Container -->
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="display: inline-block; background: #FFF; padding: 12px; border-radius: var(--radius-md); border: 3px solid var(--accent-gold); box-shadow: var(--shadow-gold);">
                    <svg viewBox="0 0 100 100" style="width: 140px; height: 140px;">
                        <rect width="100" height="100" fill="white"/>
                        <rect x="5" y="5" width="90" height="90" fill="none" stroke="#19376D" stroke-width="2"/>
                        <text x="50" y="20" font-size="8" text-anchor="middle" fill="#000" font-weight="bold">QR SIMPLE BOLIVIA</text>
                        <rect x="15" y="25" width="25" height="25" fill="#0B132B"/>
                        <rect x="18" y="28" width="19" height="19" fill="white"/>
                        <rect x="22" y="32" width="11" height="11" fill="#0B132B"/>

                        <rect x="60" y="25" width="25" height="25" fill="#0B132B"/>
                        <rect x="63" y="28" width="19" height="19" fill="white"/>
                        <rect x="67" y="32" width="11" height="11" fill="#0B132B"/>

                        <rect x="15" y="60" width="25" height="25" fill="#0B132B"/>
                        <rect x="18" y="63" width="19" height="19" fill="white"/>
                        <rect x="22" y="67" width="11" height="11" fill="#0B132B"/>

                        <rect x="45" y="45" width="12" height="12" fill="#D4AF37"/>
                        <rect x="60" y="60" width="15" height="15" fill="#0B132B"/>
                    </svg>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">Cuentas habilitadas: Banco Nacional de Bolivia (BNB) / Banco Unión</p>
            </div>

            <!-- Upload Receipt Box -->
            <div style="border: 2px dashed ${bookingState.proofUploaded ? '#10B981' : 'var(--glass-border)'}; border-radius: var(--radius-md); padding: 1.25rem; text-align: center; background: rgba(255,255,255,0.02); margin-bottom: 1.5rem;">
                ${bookingState.proofUploaded ? `
                    <div style="color: #10B981;">
                        <strong style="font-size: 1rem; display: block; margin-bottom: 0.3rem;">✅ Comprobante Subido con Éxito</strong>
                        <span style="font-size: 0.8rem;">El pago se encuentra en estado: <span class="status-pill revision">EN REVISIÓN</span></span>
                    </div>
                ` : `
                    <strong style="font-size: 0.95rem; color: #FFF; display: block; margin-bottom: 0.3rem;">Subir Comprobante de Transferencia (Foto / PDF)</strong>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">Arrastra y suelta tu archivo aquí o haz clic en el botón</p>
                    <button class="btn btn-secondary btn-sm" onclick="simulatedUploadProof()">📎 Adjuntar Comprobante Demo</button>
                `}
            </div>
        `;
    }

    // Step Footer Navigation Buttons
    stepHtml += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid var(--glass-border-subtle);">
            ${currentStep > 1 ? `
                <button class="btn btn-outline btn-sm" onclick="changeWizardStep(-1)">⬅️ Volver</button>
            ` : '<div></div>'}
            
            ${currentStep < 5 ? `
                <button class="btn btn-primary" onclick="changeWizardStep(1)">Siguiente Paso ➡️</button>
            ` : `
                <button class="btn btn-primary" onclick="finishBookingProcess()">🎉 Finalizar Reserva</button>
            `}
        </div>
    `;

    container.innerHTML = stepHtml;
}

function changeWizardStep(delta) {
    if (delta > 0) {
        // Save field values before moving next
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
            if (n) bookingState.clientName = n.value;
            if (p) bookingState.clientPhone = p.value;
            if (e) bookingState.clientEmail = e.value;
            
            if (!bookingState.clientName.trim()) {
                showToast('⚠️ Ingresa tu nombre o razón social.');
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
    renderWizardStep();
    showToast('📄 Comprobante subido correctamente. Estado actualizado a: En Revisión');
}

function finishBookingProcess() {
    closeBookingModal();
    showToast('🎉 ¡Reserva recibida! Hemos enviado la confirmación y contrato digital a tu correo.');
    
    // Add to mock dataset for admin view demonstration!
    const newRes = {
        id: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
        clientName: bookingState.clientName || "Cliente Demo Cochabamba",
        phone: bookingState.clientPhone || "+591 797 00000",
        email: bookingState.clientEmail || "cliente@demo.bo",
        eventType: "Evento Privado",
        location: bookingState.eventLocation,
        date: bookingState.eventDate,
        guests: bookingState.guestsCount,
        package: bookingState.packageName,
        invitationPackage: bookingState.invitationName,
        totalAmount: calculateTotalBs(),
        status: bookingState.proofUploaded ? "revision" : "pendiente",
        googleCalendarSynced: true,
        paymentProofUrl: bookingState.proofUploaded ? "comprobante_reciente.jpg" : null,
        createdAt: "Hoy 11:30"
    };
    
    window.BARTENDER_DATA.sampleBookings.unshift(newRes);
    if (window.renderAdminDashboard) {
        window.renderAdminDashboard();
    }
}

function demoGoogleLogin() {
    bookingState.clientName = "Lic. Roberto Arnez (Google Account)";
    bookingState.clientPhone = "+591 797 88220";
    bookingState.clientEmail = "roberto.arnez@gmail.com";
    renderWizardStep();
    showToast('🔑 Inicio de sesión exitoso con Google OAuth');
}

window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.changeWizardStep = changeWizardStep;
window.selectWizardPkg = selectWizardPkg;
window.selectWizardInv = selectWizardInv;
window.simulatedUploadProof = simulatedUploadProof;
window.finishBookingProcess = finishBookingProcess;
window.demoGoogleLogin = demoGoogleLogin;
