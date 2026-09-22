const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });
}

document.querySelectorAll('.dropdown-toggle').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const parent = e.target.closest('.dropdown');
    parent.classList.toggle('open');
    btn.setAttribute('aria-expanded', parent.classList.contains('open'));
  });
});

const categoryDrawerOpen = document.getElementById('categoryDrawerOpen');
const categoryDrawer = document.getElementById('categoryDrawer');
const categoryDrawerOverlay = document.getElementById('categoryDrawerOverlay');
const categoryDrawerClose = document.getElementById('categoryDrawerClose');

function setCategoryDrawerState(open) {
  if (!categoryDrawer || !categoryDrawerOverlay) return;
  categoryDrawer.classList.toggle('open', open);
  categoryDrawer.setAttribute('aria-hidden', String(!open));
  categoryDrawerOverlay.hidden = !open;
  categoryDrawerOpen?.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('category-drawer-open', open);
  if (open) {
    requestAnimationFrame(() => categoryDrawerOverlay.classList.add('open'));
    navMenu?.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  } else {
    categoryDrawerOverlay.classList.remove('open');
  }
}

function openCategoryDrawer() {
  closeCartPopover();
  closeCartDrawer();
  closeSearchPanel();
  setCategoryDrawerState(true);
}
function closeCategoryDrawer() { setCategoryDrawerState(false); }

categoryDrawerOpen?.addEventListener('click', openCategoryDrawer);
categoryDrawerClose?.addEventListener('click', closeCategoryDrawer);
categoryDrawerOverlay?.addEventListener('click', closeCategoryDrawer);
categoryDrawer?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeCategoryDrawer));

const navCartBtn = document.getElementById('navCartBtn');
const navCartCount = document.getElementById('navCartCount');
const cartPopover = document.getElementById('cartPopover');
const cartDrawer = document.getElementById('cartDrawer');
const cartDrawerBody = document.getElementById('cartDrawerBody');
const cartDrawerFooter = document.getElementById('cartDrawerFooter');
const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
const cartDrawerClose = document.getElementById('cartDrawerClose');
const navSearchBtn = document.getElementById('navSearchBtn');
const navSearchPanel = document.getElementById('navSearchPanel');
const navSearchForm = document.getElementById('navSearchForm');
const navSearchInput = document.getElementById('navSearchInput');
const navSearchResults = document.getElementById('navSearchResults');
const navSearchMeta = document.getElementById('navSearchMeta');

let searchAbortController = null;
let searchOpen = false;
let searchDebounceTimer = null;

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(value) {
  return window.StoreCurrency
    ? window.StoreCurrency.formatMoney(value)
    : `$ ${Number(value || 0).toLocaleString()}`;
}

function mediaPreview(item, className) {
  const imageUrl = safeAssetUrl(item.image);
  const displayUrl = imageUrl && window.StoreImages
    ? window.StoreImages.url(imageUrl, 320)
    : imageUrl;
  if (displayUrl) return `<img src="${escapeHtml(displayUrl)}" alt="${escapeHtml(item.name)}"/>`;
  return escapeHtml(item.emoji || '📦');
}

function safeAssetUrl(value) {
  const raw = String(value || '').trim();
  if (!raw || /^(?:javascript|data|vbscript):/i.test(raw)) return '';
  if (raw.startsWith('/')) return raw;
  try {
    const parsed = new URL(raw);
  } catch (error) {
    return '';
  }
  return '';
}

function updateNavbarCount() {
  if (!navCartCount || !window.cartManager) return;
  const count = window.cartManager.getItemCount();
  navCartCount.textContent = String(count);
}

function normalizeSearchText(value = '') {
  return String(value).trim().toLowerCase();
}

function setSearchPanelState(open) {
  searchOpen = open;
  if (navSearchPanel) navSearchPanel.classList.toggle('open', open);
  if (navSearchBtn) navSearchBtn.setAttribute('aria-expanded', String(open));
  if (navSearchPanel) navSearchPanel.setAttribute('aria-hidden', String(!open));
  if (open && navSearchInput) {
    window.setTimeout(() => navSearchInput.focus(), 0);
  }
}

function closeSearchPanel() {
  setSearchPanelState(false);
}

function openSearchPanel() {
  setSearchPanelState(true);
}

function renderSearchResults(products, query) {
  if (!navSearchResults || !navSearchMeta) return;
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    navSearchMeta.textContent = 'Start typing to search products.';
    navSearchResults.innerHTML = '';
    return;
  }

  if (!products.length) {
    navSearchMeta.textContent = `No matches for “${query}”.`;
    navSearchResults.innerHTML = '<div class="nav-search-empty">Try a different product name, category, or keyword.</div>';
    return;
  }

  navSearchMeta.textContent = `${products.length} product${products.length === 1 ? '' : 's'} found`;
  navSearchResults.innerHTML = products.map(product => {
    const imageUrl = safeAssetUrl(product.images && product.images[0]);
    const thumb = imageUrl
      ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}"/>`
      : escapeHtml(product.emoji || '📦');

    return `
      <a class="nav-search-item" href="/products/${escapeHtml(product.slug)}" role="option" data-search-result>
        <div class="nav-search-thumb">${thumb}</div>
        <div>
          <div class="nav-search-name">${escapeHtml(product.name)}</div>
          <div class="nav-search-desc">${escapeHtml(product.desc || product.categoryName || product.cat || product.category || '')}</div>
        </div>
        <div class="nav-search-price">${escapeHtml(formatCurrency(product.price))}</div>
      </a>
    `;
  }).join('');
}

async function fetchSearchResults(query) {
  const normalizedQuery = normalizeSearchText(query);
  if (searchAbortController) searchAbortController.abort();
  searchAbortController = new AbortController();

  if (!normalizedQuery) {
    renderSearchResults([], query);
    return;
  }

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, {
      signal: searchAbortController.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Search request failed');
    const payload = await response.json();
    renderSearchResults(Array.isArray(payload.products) ? payload.products : [], query);
  } catch (error) {
    if (error.name === 'AbortError') return;
    if (navSearchMeta) navSearchMeta.textContent = 'Search is temporarily unavailable.';
    if (navSearchResults) navSearchResults.innerHTML = '<div class="nav-search-empty">We could not load search results right now.</div>';
  }
}

function handleSearchInput() {
  if (!navSearchInput) return;
  window.clearTimeout(searchDebounceTimer);
  const query = navSearchInput.value;
  searchDebounceTimer = window.setTimeout(() => fetchSearchResults(query), 180);
}

function renderCartPopover() {
  if (!cartPopover || !window.cartManager) return;
  const items = window.cartManager.getCart();

  if (!items.length) {
    cartPopover.innerHTML = '<div class="cart-popover-empty">Your cart is empty.</div>';
    return;
  }

  const totals = window.cartManager.getTotals(items);
  const previewItems = items.slice(0, 4);

  cartPopover.innerHTML = `
    <div class="cart-popover-head">
      <span class="cart-popover-title">Your Cart</span>
      <span class="cart-popover-meta">${window.cartManager.getItemCount(items)} items</span>
    </div>
    <div class="cart-popover-items">
      ${previewItems.map(item => `
        <div class="cart-popover-item">
          <div class="cart-popover-thumb">${mediaPreview(item, 'cart-popover-thumb')}</div>
          <div>
            <div class="cart-popover-name">${escapeHtml(item.name)}</div>
            <div class="cart-popover-variant">${escapeHtml(item.weight)} x${item.qty}</div>
          </div>
          <div class="cart-popover-price">${formatCurrency(item.price * item.qty)}</div>
        </div>
      `).join('')}
    </div>
    <div class="cart-popover-footer">
      <div class="cart-popover-subtotal"><span>Subtotal</span><strong>${formatCurrency(totals.subtotal)}</strong></div>
      <div class="cart-popover-actions">
        <a href="/cart" class="cart-popover-link">View Cart</a>
        <a href="/checkout" class="cart-popover-link checkout">Checkout</a>
      </div>
    </div>
  `;
}

function openCartPopover() {
  if (!cartPopover) return;
  renderCartPopover();
  cartPopover.classList.add('open');
}

function closeCartPopover() {
  if (!cartPopover) return;
  cartPopover.classList.remove('open');
}

function renderCartDrawer() {
  if (!cartDrawerBody || !cartDrawerFooter || !window.cartManager) return;
  const items = window.cartManager.getCart();

  if (!items.length) {
    cartDrawerBody.innerHTML = '<div class="cart-drawer-empty">Your cart is empty.</div>';
    cartDrawerFooter.innerHTML = '<a href="/products" class="cart-drawer-checkout">Browse Products</a>';
    return;
  }

  cartDrawerBody.innerHTML = items.map(item => `
    <div class="cart-drawer-item" data-id="${escapeHtml(item.id)}" data-weight="${escapeHtml(item.weight)}">
      <div class="cart-drawer-thumb">${mediaPreview(item, 'cart-drawer-thumb')}</div>
      <div>
        <div class="cart-drawer-name">${escapeHtml(item.name)}</div>
        <div class="cart-drawer-variant">${escapeHtml(item.weight)}</div>
        <div class="cart-drawer-line">
          <span class="cart-drawer-line-price">${formatCurrency(item.price * item.qty)}</span>
          <div class="cart-drawer-controls">
            <button class="cart-drawer-btn" type="button" data-action="decrease">-</button>
            <span class="cart-drawer-qty">${item.qty}</span>
            <button class="cart-drawer-btn" type="button" data-action="increase">+</button>
          </div>
        </div>
        <button class="cart-drawer-remove" type="button" data-action="remove">Remove</button>
      </div>
    </div>
  `).join('');

  const totals = window.cartManager.getTotals(items);
  cartDrawerFooter.innerHTML = `
    <div class="cart-drawer-row"><span>Subtotal</span><span>${formatCurrency(totals.subtotal)}</span></div>
    <div class="cart-drawer-row"><span>Shipping</span><span>${totals.shipping === 0 ? 'Free' : formatCurrency(totals.shipping)}</span></div>
    <div class="cart-drawer-row total"><span>Total</span><span>${formatCurrency(totals.total)}</span></div>
    <a class="cart-drawer-checkout" href="/checkout">Proceed to Checkout</a>
  `;
}

function openCartDrawer() {
  if (!cartDrawer || !cartDrawerOverlay) return;
  renderCartDrawer();
  cartDrawerOverlay.classList.add('open');
  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
}

function closeCartDrawer() {
  if (!cartDrawer || !cartDrawerOverlay) return;
  cartDrawerOverlay.classList.remove('open');
  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
}

function refreshCartUI() {
  updateNavbarCount();
  if (cartPopover && cartPopover.classList.contains('open')) renderCartPopover();
  if (cartDrawer && cartDrawer.classList.contains('open')) renderCartDrawer();
}

if (navCartBtn) {
  let hoverCloseTimer;

  navCartBtn.addEventListener('click', (event) => {
    if (window.innerWidth <= 900) {
      event.preventDefault();
      openCartDrawer();
      return;
    }
    window.location.href = '/cart';
  });

  navCartBtn.addEventListener('mouseenter', () => {
    if (window.innerWidth <= 900) return;
    clearTimeout(hoverCloseTimer);
    openCartPopover();
  });

  navCartBtn.addEventListener('mouseleave', () => {
    if (window.innerWidth <= 900) return;
    hoverCloseTimer = setTimeout(closeCartPopover, 140);
  });

  if (cartPopover) {
    cartPopover.addEventListener('mouseenter', () => clearTimeout(hoverCloseTimer));
    cartPopover.addEventListener('mouseleave', () => {
      hoverCloseTimer = setTimeout(closeCartPopover, 120);
    });
  }
}

if (cartDrawerBody && window.cartManager) {
  cartDrawerBody.addEventListener('click', (event) => {
    const actionButton = event.target.closest('button[data-action]');
    if (!actionButton) return;

    const item = actionButton.closest('.cart-drawer-item');
    if (!item) return;

    const id = item.dataset.id;
    const weight = item.dataset.weight;
    const action = actionButton.dataset.action;
    const cart = window.cartManager.getCart();
    const target = cart.find(entry => entry.id === id && entry.weight === weight);
    if (!target) return;

    if (action === 'remove') {
      window.cartManager.removeItem(id, weight);
    } else if (action === 'increase') {
      window.cartManager.updateQty(id, weight, target.qty + 1);
    } else if (action === 'decrease') {
      window.cartManager.updateQty(id, weight, Math.max(1, target.qty - 1));
    }

    refreshCartUI();
  });
}

if (cartDrawerOverlay) cartDrawerOverlay.addEventListener('click', closeCartDrawer);
if (cartDrawerClose) cartDrawerClose.addEventListener('click', closeCartDrawer);

if (navSearchBtn && navSearchPanel) {
  navSearchBtn.addEventListener('click', (event) => {
    event.preventDefault();
    if (searchOpen) closeSearchPanel();
    else openSearchPanel();
  });
}

if (navSearchInput) {
  navSearchInput.addEventListener('input', handleSearchInput);
}

if (navSearchForm) {
  navSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = normalizeSearchText(navSearchInput ? navSearchInput.value : '');
    if (!query) {
      closeSearchPanel();
      return;
    }
    window.location.href = `/products?q=${encodeURIComponent(query)}`;
  });
}

if (navSearchResults) {
  navSearchResults.addEventListener('click', (event) => {
    const resultLink = event.target.closest('[data-search-result]');
    if (!resultLink) return;
    closeSearchPanel();
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeCartPopover();
    closeCartDrawer();
    closeSearchPanel();
    closeCategoryDrawer();
  }
});

document.addEventListener('click', (event) => {
  if (!searchOpen || !navSearchPanel || !navSearchBtn) return;
  if (navSearchPanel.contains(event.target) || navSearchBtn.contains(event.target)) return;
  closeSearchPanel();
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) closeCartDrawer();
});

window.updateNavbarCount = updateNavbarCount;
window.refreshCartUI = refreshCartUI;

refreshCartUI();