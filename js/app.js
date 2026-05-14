const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
const CATALOGO_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=pdf';

const FALLBACK_PRODUCT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNDAgMTYwJz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9J2cnIHgxPScwJyB4Mj0nMScgeTE9JzAnIHkyPScxJz48c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMDA0YWFkJy8+PHN0b3Agb2Zmc2V0PScxMDAlJyBzdG9wLWNvbG9yPScjMDAyZjcwJy8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9JzI0MCcgaGVpZ2h0PScxNjAnIHJ4PScxOCcgZmlsbD0ndXJsKCNnKScvPjxnIGZpbGw9J25vbmUnIHN0cm9rZT0nd2hpdGUnIHN0cm9rZS13aWR0aD0nNicgc3Ryb2tlLWxpbmVjYXA9J3JvdW5kJz48cGF0aCBkPSdNNjAgMTEwaDEyMCcvPjxwYXRoIGQ9J00xNTAgOTBsMzAtMzAnLz48Y2lyY2xlIGN4PSc5MCcgY3k9JzcwJyByPScyNCcvPjwvZz48L3N2Zz4=';

const EMAILJS_CONFIG = {
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
};

document.addEventListener('DOMContentLoaded', () => {
    initializeAnimations();
    setupResponsiveNav();
    updateCurrentYear();
    setupIntersectionHighlight();
    hydrateCatalogButton();
    fetchAndRenderProducts();
    setupContactForm();
});

function initializeAnimations() {
    if (window.AOS) {
        window.AOS.init({
            duration: 700,
            once: true,
            offset: 120,
        });
    }

    if (window.ScrollReveal) {
        window.ScrollReveal({ reset: false });
    }
}

function setupResponsiveNav() {
    const toggle = document.querySelector('[data-menu-toggle]');
    const navigation = document.querySelector('[data-primary-nav]');
    const overlay = document.querySelector('[data-nav-overlay]');
    const body = document.body;

    if (!toggle || !navigation) return;

    body.classList.add('nav-enhanced');

    const navigationLinks = navigation.querySelectorAll('a');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    let isMenuOpen = false;

    const openMenu = () => {
        navigation.classList.add('is-open');
        toggle.classList.add('is-active');
        toggle.setAttribute('aria-expanded', 'true');
        overlay?.classList.add('is-visible');
        body.classList.add('has-open-menu');
        isMenuOpen = true;
    };

    const closeMenu = (focusToggle = false) => {
        navigation.classList.remove('is-open');
        toggle.classList.remove('is-active');
        toggle.setAttribute('aria-expanded', 'false');
        overlay?.classList.remove('is-visible');
        body.classList.remove('has-open-menu');
        isMenuOpen = false;

        if (focusToggle) {
            toggle.focus();
        }
    };

    const toggleMenu = () => {
        if (isMenuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    };

    const handleKeydown = (event) => {
        if (event.key === 'Escape' && isMenuOpen) {
            closeMenu(true);
        }
    };

    toggle.addEventListener('click', toggleMenu);
    document.addEventListener('keydown', handleKeydown);

    overlay?.addEventListener('click', () => {
        if (isMenuOpen) {
            closeMenu(true);
        }
    });

    navigationLinks.forEach((link) => {
        link.addEventListener('click', () => {
            if (!desktopQuery.matches) {
                closeMenu();
            }
        });
    });

    const handleDesktopChange = (event) => {
        if (event.matches) {
            closeMenu();
        }
    };

    if (typeof desktopQuery.addEventListener === 'function') {
        desktopQuery.addEventListener('change', handleDesktopChange);
    } else if (typeof desktopQuery.addListener === 'function') {
        desktopQuery.addListener(handleDesktopChange);
    }
}

function updateCurrentYear() {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

function hydrateCatalogButton() {
    const catalogButton = document.getElementById('verCatalogoBtn');
    if (!catalogButton) return;

    if (CATALOGO_URL.includes('YOUR_SHEET_ID')) {
        catalogButton.addEventListener('click', (event) => {
            event.preventDefault();
            alert('Configura la constante CATALOGO_URL en js/app.js para enlazar tu catálogo.');
        });
        return;
    }

    catalogButton.href = CATALOGO_URL;
}

async function fetchAndRenderProducts() {
    const grid = document.getElementById('productGrid');
    const loading = document.getElementById('loadingProducts');

    if (!grid) return;

    if (SHEETS_ENDPOINT.includes('YOUR_DEPLOYMENT_ID')) {
        renderFallbackState(grid, 'Configura la constante SHEETS_ENDPOINT en js/app.js para mostrar tus productos.');
        loading?.remove();
        return;
    }

    try {
        const response = await fetch(SHEETS_ENDPOINT, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Error de red: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        let payload;

        if (contentType && contentType.includes('application/json')) {
            payload = await response.json();
        } else {
            const text = await response.text();
            payload = parseSheetPayload(text);
        }

        const products = normalizeSheetData(payload);

        renderProducts(products, grid);
    } catch (error) {
        console.error('No fue posible cargar los productos desde Google Sheets:', error);
        renderFallbackState(grid, 'No pudimos conectar con Google Sheets. Verifica tu URL de Apps Script o el JSON público.');
    } finally {
        loading?.remove();
    }
}

function normalizeSheetData(data) {
    if (!data) return [];

    if (Array.isArray(data)) {
        return data.map(mapSheetRow).filter((item) => item.activo);
    }

    if (Array.isArray(data.products)) {
        return data.products.map(mapSheetRow).filter((item) => item.activo);
    }

    if (Array.isArray(data.records)) {
        return data.records.map(mapSheetRow).filter((item) => item.activo);
    }

    if (data.values && Array.isArray(data.values)) {
        const [headers, ...rows] = data.values;
        if (!headers) return [];
        return rows
            .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])))
            .map(mapSheetRow)
            .filter((item) => item.activo);
    }

    return [];
}

function mapSheetRow(row) {
    const normalized = {
        id: row.ID || row.Id || row.id || generateUUID(),
        nombre: row.Nombre || row.nombre || row['Nombre'] || 'Producto sin nombre',
        descripcion: row.Descripcion || row.descripcion || row['Descripción'] || 'Próximamente más información.',
        imagen: row.Imagen_URL || row['Imagen_URL'] || row.ImagenURL || row.imagen || row.imagen_url || FALLBACK_PRODUCT_IMAGE,
        categoria: row.Categoria || row['Categoría'] || row.categoria || 'General',
        ficha: row.FichaTecnica || row['FichaTecnica'] || row.ficha_tecnica || row['Ficha Técnica'] || row.ficha || '',
        enlace: row.Enlace || row.enlace || row.Link || row.link || '',
        activo: parseBoolean(row.Activo ?? row.activo ?? row['Activo'] ?? true),
    };

    return normalized;
}

function parseBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return ['1', 'true', 'si', 'sí', 'activo'].includes(normalized);
    }
    return false;
}

function renderProducts(products, container) {
    container.innerHTML = '';

    if (!products.length) {
        renderFallbackState(container, 'Sin productos activos en este momento. Actualiza Google Sheets para mostrarlos aquí.');
        return;
    }

    const fragment = document.createDocumentFragment();

    products.forEach((product) => {
        const card = document.createElement('article');
        card.className = 'product-card group';
        card.setAttribute('data-sr-id', product.id);

        const figure = document.createElement('div');
        figure.className = 'product-media';

        const img = document.createElement('img');
        img.src = product.imagen;
        img.alt = product.nombre;
        img.loading = 'lazy';
        img.className = 'product-image';

        figure.append(img);

        const body = document.createElement('div');
        body.className = 'flex flex-col gap-4 p-6';

        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = product.categoria;

        const title = document.createElement('h3');
        title.className = 'text-xl font-semibold text-slate-900';
        title.textContent = product.nombre;

        const description = document.createElement('p');
        description.className = 'text-sm text-slate-600 flex-1';
        description.textContent = product.descripcion;

        const linkUrl = product.ficha || product.enlace;

        body.append(badge, title, description);

        if (linkUrl) {
            const link = document.createElement('a');
            link.href = linkUrl;
            link.target = '_blank';
            link.rel = 'noopener';
            link.className = 'inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-800';

            const linkText = document.createElement('span');
            linkText.textContent = product.ficha ? 'Ver ficha técnica' : 'Solicitar información';

            const arrow = document.createElement('span');
            arrow.setAttribute('aria-hidden', 'true');
            arrow.className = 'transition-transform duration-200 group-hover:translate-x-1';
            arrow.textContent = '→';

            link.append(linkText, arrow);
            body.append(link);
        }

        card.append(figure, body);
        fragment.append(card);
    });

    container.append(fragment);

    if (window.ScrollReveal) {
        window.ScrollReveal().reveal('.product-card', {
            interval: 120,
            distance: '30px',
            origin: 'bottom',
            opacity: 0,
        });
    }
}

function renderFallbackState(container, message) {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'products-empty';
    wrapper.textContent = message;

    container.append(wrapper);
}

function parseSheetPayload(rawPayload) {
    if (!rawPayload) {
        return {};
    }

    if (typeof rawPayload === 'object') {
        return rawPayload;
    }

    const trimmed = rawPayload.trim();

    if (!trimmed) return {};

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            return JSON.parse(trimmed);
        } catch (error) {
            console.error('No se pudo interpretar el JSON directo de Google Sheets:', error);
            return {};
        }
    }

    const jsonStart = trimmed.indexOf('{');
    const jsonEnd = trimmed.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
        return {};
    }

    try {
        const jsonString = trimmed.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonString);

        if (parsed && parsed.table && Array.isArray(parsed.table.cols) && Array.isArray(parsed.table.rows)) {
            const headers = parsed.table.cols.map((col, index) => col.label || col.id || `col_${index}`);
            const values = parsed.table.rows.map((row) => row.c.map((cell) => (cell ? cell.v ?? '' : '')));
            return { values: [headers, ...values] };
        }

        return parsed;
    } catch (error) {
        console.error('No se pudo interpretar la respuesta GViz de Google Sheets:', error);
        return {};
    }
}

function setupIntersectionHighlight() {
    const navLinks = document.querySelectorAll('[data-nav-link]');
    const sections = [...document.querySelectorAll('main section[id]')];

    if (!navLinks.length || !sections.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    navLinks.forEach((link) => {
                        const href = link.getAttribute('href');
                        link.classList.toggle('active', href === `#${entry.target.id}`);
                    });
                }
            });
        },
        {
            root: null,
            rootMargin: '-45% 0px -45% 0px',
            threshold: 0,
        }
    );

    sections.forEach((section) => observer.observe(section));
}

function setupContactForm() {
    const form = document.getElementById('contactForm');
    const successAlert = document.getElementById('contactSuccess');
    const errorAlert = document.getElementById('contactError');
    const submitBtn = document.getElementById('contactSubmitBtn');

    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        successAlert?.classList.add('hidden');
        errorAlert?.classList.add('hidden');

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = Object.fromEntries(new FormData(form));

        if (!window.emailjs || EMAILJS_CONFIG.publicKey.includes('YOUR_EMAILJS_PUBLIC_KEY')) {
            alert('Configura EmailJS en js/app.js para activar el envío del formulario.');
            return;
        }

        toggleSubmittingState(submitBtn, true);

        try {
            window.emailjs.init(EMAILJS_CONFIG.publicKey);
            await window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, formData);
            form.reset();
            successAlert?.classList.remove('hidden');
        } catch (error) {
            console.error('Error al enviar el formulario con EmailJS:', error);
            errorAlert?.classList.remove('hidden');
        } finally {
            toggleSubmittingState(submitBtn, false);
        }
    });
}

function toggleSubmittingState(button, isSubmitting) {
    if (!button) return;

    if (!button.dataset.defaultLabel) {
        button.dataset.defaultLabel = button.textContent.trim();
    }

    button.disabled = isSubmitting;
    button.textContent = isSubmitting ? 'Enviando…' : button.dataset.defaultLabel;
}

function generateUUID() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return template.replace(/[xy]/g, (char) => {
        const r = (Math.random() * 16) | 0;
        const v = char === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
