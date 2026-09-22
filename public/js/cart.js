const cartItemsContainer = document.querySelector('.cart-items');
const cartItemCount = document.querySelector('.cart-item-count');
const subtotalAmount = document.querySelector('.subtotal-amount');
const shippingAmount = document.querySelector('.shipping-amount');
const totalAmount = document.querySelector('.total-amount');
const cartSummary = document.querySelector('.cart-summary');

function currency(amount) {
  return window.StoreCurrency
    ? window.StoreCurrency.formatMoney(amount)
    : `$ ${Number(amount || 0).toLocaleString()}`;
}


function itemMedia(item) {
  const media = document.createElement('div');
  const imageUrl = safeAssetUrl(item.image);
  if (imageUrl) {
    const image = document.createElement('img');
    if (window.StoreImages) {
      window.StoreImages.apply(image, imageUrl, {
        width: 320,
        widths: [160, 320, 640],
        sizes: '120px'
      });
    } else {
      image.src = imageUrl;
    }
    image.alt = String(item.name || '');
    media.append(image);
  } else {
    media.textContent = String(item.emoji || '📦');
  }
  return media;
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

function updateSummary(items) {
  const totals = window.cartManager.getTotals(items);
  if (subtotalAmount) subtotalAmount.textContent = currency(totals.subtotal);
  if (shippingAmount) shippingAmount.textContent = totals.shipping === 0 ? 'Free' : currency(totals.shipping);
  if (totalAmount) totalAmount.textContent = currency(totals.total);
}

function renderCart() {
  if (!window.cartManager || !cartItemsContainer) return;

  const items = window.cartManager.getCart();
  if (cartItemCount) cartItemCount.textContent = `${window.cartManager.getItemCount(items)} items`;

  if (!items.length) {
    cartItemsContainer.innerHTML = '<div class="empty-state" style="padding:36px 10px;text-align:center;"><div class="empty-state-icon">🛒</div><h3>Your cart is empty</h3><p>Browse products and add your favorites.</p></div>';
    if (cartSummary) cartSummary.style.display = 'none';
    return;
  }

  if (cartSummary) cartSummary.style.display = '';
  const rows = items.map(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.dataset.id = String(item.id);
    row.dataset.weight = String(item.weight);

    const imageWrap = document.createElement('div');
    imageWrap.className = 'cart-item-img';
    imageWrap.append(itemMedia(item));
    const details = document.createElement('div');
    details.className = 'cart-item-details';
    const name = document.createElement('div');
    name.className = 'cart-item-name';
    name.textContent = String(item.name || '');
    const category = document.createElement('div');
    category.className = 'cart-item-category';
    category.textContent = String(item.categoryName || item.category || '');
    const price = document.createElement('div');
    price.className = 'cart-item-price';
    price.textContent = currency(item.price);
    details.append(name, category, price);

    const controls = document.createElement('div');
    controls.className = 'cart-item-controls';
    const adjuster = document.createElement('div');
    adjuster.className = 'quantity-adjuster';
    const decrease = document.createElement('button');
    decrease.className = 'qty-btn';
    decrease.type = 'button';
    decrease.dataset.action = 'decrease';
    decrease.textContent = '−';
    const quantity = document.createElement('input');
    quantity.className = 'qty-input';
    quantity.type = 'number';
    quantity.value = String(item.qty);
    quantity.min = '1';
    quantity.readOnly = true;
    const increase = document.createElement('button');
    increase.className = 'qty-btn';
    increase.type = 'button';
    increase.dataset.action = 'increase';
    increase.textContent = '+';
    adjuster.append(decrease, quantity, increase);
    const subtotal = document.createElement('div');
    subtotal.className = 'cart-item-subtotal';
    subtotal.textContent = currency(item.price * item.qty);
    const remove = document.createElement('button');
    remove.className = 'cart-item-remove';
    remove.type = 'button';
    remove.dataset.action = 'remove';
    remove.title = 'Remove item';
    remove.textContent = '🗑️';
    controls.append(adjuster, subtotal, remove);
    row.append(imageWrap, details, controls);
    return row;
  });
  cartItemsContainer.replaceChildren(...rows);

  updateSummary(items);
}

if (cartItemsContainer) {
  cartItemsContainer.addEventListener('click', (event) => {
    const actionElement = event.target.closest('[data-action]');
    if (!actionElement || !window.cartManager) return;

    const row = actionElement.closest('.cart-item');
    if (!row) return;

    const id = row.dataset.id;
    const weight = row.dataset.weight;
    const action = actionElement.dataset.action;
    const items = window.cartManager.getCart();
    const target = items.find(item => item.id === id && item.weight === weight);
    if (!target) return;

    if (action === 'remove') {
      window.cartManager.removeItem(id, weight);
    } else if (action === 'increase') {
      window.cartManager.updateQty(id, weight, target.qty + 1);
    } else if (action === 'decrease') {
      window.cartManager.updateQty(id, weight, Math.max(1, target.qty - 1));
    }

    if (window.refreshCartUI) window.refreshCartUI();
    renderCart();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  if (window.refreshCartUI) window.refreshCartUI();
});