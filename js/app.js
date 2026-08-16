// js/app.js - Principal Controller for Bartender Pro Cochabamba

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    await renderDrinksCatalog('all');
    await renderGallery('all');
    initNavigation();
    initModeSwitcher();
}

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });
}

function initModeSwitcher() {
    const clientBtn = document.getElementById('modeClientBtn');
    const adminBtn = document.getElementById('modeAdminBtn');
    const clientView = document.getElementById('clientViewSection');
    const adminView = document.getElementById('adminDashboardSection');

    if (clientBtn && adminBtn) {
        clientBtn.addEventListener('click', () => {
            clientBtn.classList.add('active');
            adminBtn.classList.remove('active');
            clientView.style.display = 'block';
            adminView.classList.remove('active');
            showToast('👁️ Cambiado a Vista Cliente / Usuario');
        });

        adminBtn.addEventListener('click', () => {
            adminBtn.classList.add('active');
            clientBtn.classList.remove('active');
            clientView.style.display = 'none';
            adminView.classList.add('active');
            if (window.renderAdminDashboard) window.renderAdminDashboard();
            showToast('⚙️ Cambiado a Panel de Administración (Modo Bartender)');
        });
    }
}

// Drink Catalog Renderer
async function renderDrinksCatalog(filterCategory = 'all') {
    const container = document.getElementById('drinksGridContainer');
    if (!container) return;

    const drinks = await window.DB.getDrinks(filterCategory);

    container.innerHTML = drinks.map(drink => `
        <div class="drink-card">
            <div class="drink-img-wrapper">
                <img src="${drink.image}" alt="${drink.name}" loading="lazy">
                ${drink.badge ? `<span class="drink-badge-tag">${drink.badge}</span>` : ''}
            </div>
            <div class="drink-body">
                <h4 class="drink-title">${drink.name}</h4>
                <p class="drink-desc">${drink.description}</p>
                <div class="drink-footer">
                    <span style="font-size: 0.8rem; color: var(--text-gold); font-weight: 600;">${drink.alcohol}</span>
                    <div class="flair-stars" title="Calificación de Presentación Flair">
                        ${'★'.repeat(drink.flairRating)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Filter Drinks Click Handler
function filterDrinks(category, btnElem) {
    const tabBtns = document.querySelectorAll('#drinkFilterTabs .tab-btn');
    tabBtns.forEach(b => b.classList.remove('active'));
    if (btnElem) btnElem.classList.add('active');

    renderDrinksCatalog(category);
}

// Gallery Renderer
async function renderGallery(filterCategory = 'all') {
    const container = document.getElementById('galleryGridContainer');
    if (!container) return;

    const items = await window.DB.getGallery(filterCategory);

    container.innerHTML = items.map(item => `
        <div class="drink-card" style="cursor: pointer;" onclick="openLightbox('${item.image}', '${item.title}', '${item.subtitle}')">
            <div class="drink-img-wrapper" style="height: 250px;">
                <img src="${item.image}" alt="${item.title}" loading="lazy">
            </div>
            <div class="drink-body" style="padding: 1.25rem;">
                <h4 style="font-size: 1.1rem; margin-bottom: 0.3rem;">${item.title}</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted);">${item.subtitle}</p>
            </div>
        </div>
    `).join('');
}

function filterGallery(category, btnElem) {
    const tabBtns = document.querySelectorAll('#galleryFilterTabs .tab-btn');
    tabBtns.forEach(b => b.classList.remove('active'));
    if (btnElem) btnElem.classList.add('active');

    renderGallery(category);
}

function openLightbox(imgUrl, title, subtitle) {
    const modalOverlay = document.getElementById('invitationModalOverlay');
    const modalContainer = document.getElementById('invitationModalContainer');

    if (modalOverlay && modalContainer) {
        modalContainer.innerHTML = `
            <div style="padding: 1.5rem; background: #0B132B; text-align: center; border-radius: var(--radius-lg); position: relative; max-width: 600px; margin: 0 auto; border: 1px solid var(--glass-border);">
                <button onclick="closeInvitationModal()" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.5); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">✕</button>
                <div style="max-height: 65vh; overflow: hidden; border-radius: var(--radius-md); margin-bottom: 1rem;">
                    <img src="${imgUrl}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <h3 style="color: var(--accent-gold); margin-bottom: 0.3rem;">${title}</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted);">${subtitle}</p>
            </div>
        `;
        modalOverlay.classList.add('active');
    }
}

// Toast Notifications Helper
function showToast(message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">🍸</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

window.filterDrinks = filterDrinks;
window.filterGallery = filterGallery;
window.openLightbox = openLightbox;
window.showToast = showToast;
window.renderDrinksCatalog = renderDrinksCatalog;
window.renderGallery = renderGallery;
