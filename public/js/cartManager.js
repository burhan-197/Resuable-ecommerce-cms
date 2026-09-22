(function initCartManager(global) {
  const STORAGE_KEY = 'storefront_cart_v1';
  const MAX_QTY = 99;

  function positiveInt(value, fallback = 1) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(1, Math.min(MAX_QTY, Math.trunc(parsed)));
  }

  function stockLimit(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return MAX_QTY;
    return Math.max(0, Math.min(MAX_QTY, Math.trunc(parsed)));
  }

  function parseStoredCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function sanitizeItem(item) {
    const hasKnownStock = item.stock !== undefined && item.stock !== null && item.stock !== '' && Number.isFinite(Number(item.stock));
    const stock = hasKnownStock ? stockLimit(item.stock) : MAX_QTY;
    const qty = stock > 0 ? Math.min(positiveInt(item.qty, 1), stock) : 0;
    return {
      id: String(item.id || ''),
      name: String(item.name || ''),
      category: String(item.category || ''),
      categoryName: String(item.categoryName || ''),
      emoji: String(item.emoji || ''),
      slug: String(item.slug || ''),
      price: Math.max(0, Number(item.price || 0)),
      qty,
      stock,
      weight: String(item.weight || ''),
      image: String(item.image || ''),
    };
  }

  function getCart() {
    return parseStoredCart().map(sanitizeItem).filter(item => item.id && item.qty > 0);
  }

  function saveCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(sanitizeItem)));
    return getCart();
  }

  function findMatchingItemIndex(cart, incoming) {
    return cart.findIndex(item => item.id === incoming.id && item.weight === incoming.weight);
  }

  function addItem(product, qty = 1) {
    const incoming = sanitizeItem({ ...product, qty });
    if (!incoming.id || incoming.stock === 0) return getCart();

    const cart = getCart();
    const matchIndex = findMatchingItemIndex(cart, incoming);

    if (matchIndex >= 0) {
      const knownStock = Math.min(cart[matchIndex].stock || MAX_QTY, incoming.stock || MAX_QTY);
      cart[matchIndex].stock = knownStock;
      cart[matchIndex].qty = Math.min(MAX_QTY, knownStock, cart[matchIndex].qty + incoming.qty);
      // Refresh display data when the product was added from a current catalogue page.
      cart[matchIndex].name = incoming.name || cart[matchIndex].name;
      cart[matchIndex].category = incoming.category || cart[matchIndex].category;
      cart[matchIndex].categoryName = incoming.categoryName || cart[matchIndex].categoryName;
      cart[matchIndex].price = incoming.price;
      cart[matchIndex].image = incoming.image || cart[matchIndex].image;
      cart[matchIndex].slug = incoming.slug || cart[matchIndex].slug;
    } else {
      cart.push(incoming);
    }

    return saveCart(cart);
  }

  function removeItem(id, weight) {
    const cart = getCart().filter(item => {
      if (item.id !== id) return true;
      if (typeof weight === 'string') return item.weight !== weight;
      return false;
    });
    return saveCart(cart);
  }

  function updateQty(id, weight, newQty) {
    const cart = getCart();
    const index = cart.findIndex(item => item.id === id && item.weight === weight);
    if (index >= 0) {
      const limit = cart[index].stock || MAX_QTY;
      cart[index].qty = Math.min(positiveInt(newQty, 1), limit);
      return saveCart(cart);
    }
    return cart;
  }

  function clearCart() {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }

  function getItemCount(items = getCart()) {
    return items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  }

  function readShippingConfig() {
    const data = document.body ? document.body.dataset : {};
    const flatRate = Number(data.shippingFlatRate);
    const freeThreshold = Number(data.shippingFreeThreshold);

    return {
      enabled: data.shippingEnabled === 'true',
      flatRate: {
        enabled: data.shippingFlatEnabled === 'true',
        amount: Number.isFinite(flatRate) && flatRate >= 0 ? flatRate : 0,
      },
      freeShipping: {
        enabled: data.shippingFreeEnabled === 'true',
        threshold: Number.isFinite(freeThreshold) && freeThreshold >= 0 ? freeThreshold : 0,
      },
    };
  }

  function getShipping(subtotal) {
    if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
    const shipping = readShippingConfig();
    if (!shipping.enabled) return 0;
    if (shipping.freeShipping.enabled && subtotal >= shipping.freeShipping.threshold) return 0;
    return shipping.flatRate.enabled ? shipping.flatRate.amount : 0;
  }

  function getTotals(items = getCart()) {
    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
    const shipping = getShipping(subtotal);
    return { subtotal, shipping, total: subtotal + shipping };
  }

  global.cartManager = {
    getCart,
    saveCart,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    getItemCount,
    getTotals,
  };
})(window);
