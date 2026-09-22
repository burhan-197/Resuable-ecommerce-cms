let qty = 1;
const detailProductDataNode = document.getElementById('detailProductData');
const DETAIL_PRODUCT = detailProductDataNode
  ? JSON.parse(decodeURIComponent(detailProductDataNode.dataset.product || '{}'))
  : null;
let selectedVariant = DETAIL_PRODUCT?.variants?.[0] || null;

function currentVariant() {
  return selectedVariant;
}

function formatPackSize(weight) {
  return String(weight || '').replace(/\s*kg\b/i, ' kg');
}

function formatPrice(price) {
  return window.StoreCurrency
    ? window.StoreCurrency.formatMoney(price)
    : `$ ${Number(price || 0).toLocaleString()}`;
}

function syncVariantUI() {
  const variant = currentVariant();
  if (!variant) return;

  const stock = Math.max(0, Number(variant.stock || 0));
  qty = stock > 0 ? Math.min(qty, stock) : 1;
  const qtyValue = document.getElementById('qtyVal');
  if (qtyValue) qtyValue.textContent = qty;

  const price = document.getElementById('product-price');
  if (price) price.textContent = formatPrice(variant.price);

  const label = document.querySelector('.option-label span');
  if (label) label.textContent = `${variant.weight} (Selected)`;

  const stockStatus = document.querySelector('.stock-status');
  if (stockStatus) {
    stockStatus.classList.toggle('is-in-stock', stock > 0);
    stockStatus.classList.remove('is-low');
    stockStatus.classList.toggle('is-out', stock <= 0);
    stockStatus.textContent = stock <= 0 ? 'Currently unavailable' : `${stock} unit${stock === 1 ? '' : 's'} available`;
  }

  document.querySelectorAll('.qty-btn').forEach(button => { button.disabled = stock === 0; });
  ['addCartBtn', '.btn-buy-now'].forEach(selector => {
    const button = selector.startsWith('.') ? document.querySelector(selector) : document.getElementById(selector);
    if (button) button.disabled = stock === 0;
  });

  const packSizeValue = document.getElementById('packSizeValue');
  if (packSizeValue) packSizeValue.textContent = formatPackSize(variant.weight);
}

function attachImageFallback(image, fallbackContainer, fallbackText, fallbackLabel) {
  image.addEventListener('error', () => {
    if (image.dataset.fallbackApplied) return;
    image.dataset.fallbackApplied = 'true';
    if (fallbackContainer.classList.contains('gallery-thumb')) {
      fallbackContainer.textContent = fallbackText || '🖼️';
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'img-placeholder';
      placeholder.textContent = fallbackText || '📦';
      image.parentElement.replaceWith(placeholder);
    }
    fallbackContainer.setAttribute('aria-label', fallbackLabel);
  }, { once: true });
}

function addCurrentProductToCart(quantity) {
  if (!window.cartManager || !DETAIL_PRODUCT) return false;
  const variant = currentVariant();
  const requestedQty = Math.max(1, Number(quantity || 1));
  if (!variant || Math.max(0, Number(variant.stock || 0)) < requestedQty) return false;
  window.cartManager.addItem({
    id: DETAIL_PRODUCT.id,
    name: DETAIL_PRODUCT.name,
    category: DETAIL_PRODUCT.category,
    categoryName: DETAIL_PRODUCT.categoryName || DETAIL_PRODUCT.category,
    emoji: DETAIL_PRODUCT.emoji,
    slug: DETAIL_PRODUCT.slug,
    price: Number(variant ? variant.price : 0),
    weight: variant ? variant.weight : 'Standard',
    stock: Math.max(0, Number(variant ? variant.stock : 0)),
    image: DETAIL_PRODUCT.image || '',
  }, requestedQty);
  if (window.refreshCartUI) window.refreshCartUI();
  return true;
}

function changeQty(d) {
  const stock = Math.max(0, Number(currentVariant()?.stock || 0));
  if (!stock) return;
  qty = Math.max(1, Math.min(stock, qty + d));
  document.getElementById('qtyVal').textContent = qty;
}

function selectWeight(btn) {
  document.querySelectorAll('.weight-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-pressed', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-pressed', 'true');
  selectedVariant = DETAIL_PRODUCT?.variants?.find(variant => variant.weight === btn.textContent.trim()) || selectedVariant;
  syncVariantUI();
}

function addToCart() {
  if (!currentVariant() || Number(currentVariant().stock || 0) < qty) return;
  addCurrentProductToCart(qty);
  const btn = document.getElementById('addCartBtn');
  btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Added!';
  btn.classList.add('cart-add-success');
  setTimeout(() => {
    btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Add to Cart';
    btn.classList.remove('cart-add-success');
  }, 1500);
}

function addRelated(btn) {
  const stock = Math.max(0, Number(btn.dataset.stock || 0));
  if (stock < 1) {
    btn.disabled = true;
    return;
  }
  if (window.cartManager) {
    window.cartManager.addItem({
      id: btn.dataset.id,
      name: btn.dataset.name,
      category: btn.dataset.category,
      categoryName: btn.dataset.categoryName || btn.dataset.category,
      emoji: btn.dataset.emoji,
      slug: btn.dataset.slug,
      price: Number(btn.dataset.price || 0),
      weight: btn.dataset.weight || 'Standard',
      stock,
      image: btn.dataset.image || '',
    }, 1);
    if (window.refreshCartUI) window.refreshCartUI();
  }
  btn.textContent = '✓';
  btn.classList.add('cart-add-success');
  setTimeout(() => { btn.textContent = '+'; btn.classList.remove('cart-add-success'); }, 1200);
}

function buyNow() {
  if (addCurrentProductToCart(qty)) window.location.href = '/checkout';
}

function switchTab(btn, id) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(id).classList.add('active');
}


document.querySelectorAll('.gallery-thumb').forEach(thumb => {
  const thumbnailImage = thumb.querySelector('img');
  if (thumbnailImage) attachImageFallback(thumbnailImage, thumb, DETAIL_PRODUCT?.emoji || '🖼️', `Image unavailable for ${DETAIL_PRODUCT?.name || 'product'} thumbnail`);
  thumb.addEventListener('click', () => {
    document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');

    const mainImage = document.querySelector('.gallery-main-image');
    const nextSrc = thumb.dataset.thumbSrc;
    const nextSrcset = thumb.dataset.thumbSrcset;
    if (mainImage && nextSrc) {
      mainImage.src = nextSrc;
      if (nextSrcset) {
        mainImage.srcset = nextSrcset;
      } else {
        mainImage.removeAttribute('srcset');
      }
    }
  });
});

const mainImage = document.querySelector('.gallery-main-image');
if (mainImage) attachImageFallback(mainImage, mainImage.parentElement.parentElement, DETAIL_PRODUCT?.emoji || '📦', `Image unavailable for ${DETAIL_PRODUCT?.name || 'product'}`);

syncVariantUI();

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.product-card, .shipping-card').forEach(el => {
  el.style.opacity = '0'; el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  observer.observe(el);
});