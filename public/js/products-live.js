const productsDataNode = document.getElementById('productsData');

function formatMoneyClient(amount) {
  return window.StoreCurrency
    ? window.StoreCurrency.formatMoney(amount)
    : `$ ${Number(amount || 0).toLocaleString()}`;
}
const PRODUCTS = productsDataNode ? JSON.parse(decodeURIComponent(productsDataNode.dataset.products || '[]')) : [];
const STORE_CATEGORIES = productsDataNode ? JSON.parse(decodeURIComponent(productsDataNode.dataset.categories || '[]')) : [];
const PRODUCT_COPY = productsDataNode ? JSON.parse(decodeURIComponent(productsDataNode.dataset.copy || '%7B%7D')) : {};
function copy(key, fallback) {
  const value = typeof PRODUCT_COPY[key] === 'string' ? PRODUCT_COPY[key].trim() : '';
  return value || fallback;
}
const CATEGORY_LABELS = new Map(STORE_CATEGORIES.map(category => [category.slug, category.name]));
const CATEGORY_SLUGS = new Map(STORE_CATEGORIES.map(category => [
  category.slug,
  Array.isArray(category.descendantSlugs) && category.descendantSlugs.length
    ? category.descendantSlugs
    : [category.slug],
]));
let currentCat = productsDataNode ? productsDataNode.dataset.currentCategory || 'all' : 'all';
let currentSort = 'default';
const catalogMinPrice = 0;
const catalogMaxPrice = productsDataNode ? Number(productsDataNode.dataset.priceMax || 2000) : 2000;
let activeMinPrice = null;
let activeMaxPrice = null;
let searchTerm = productsDataNode ? productsDataNode.dataset.searchQuery || '' : '';
let currentView = 'grid';
const ITEMS_PER_PAGE = 12;
let currentPage = 1;
const mobileFilterQuery = window.matchMedia('(max-width: 900px)');
let mobileFiltersOpen = false;

function setFilterToggleContent(button, isOpen) {
  const icon = document.createElement('span');
  icon.className = 'filter-toggle-icon';
  icon.textContent = isOpen ? '✕' : '☰';

  const label = document.createElement('span');
  label.textContent = isOpen
    ? copy('closeFiltersLabel', 'Close Filters')
    : copy('filtersLabel', 'Filters');

  button.replaceChildren(icon, label);
}

function syncMobileFiltersUI() {
  const sidebar = document.getElementById('productFilters');
  const toggleButton = document.getElementById('filterToggleBtn');
  const backdrop = document.getElementById('filterBackdrop');
  const shopLayout = document.querySelector('.shop-layout');

  if (!sidebar || !toggleButton || !backdrop || !shopLayout) return;

  if (!mobileFilterQuery.matches) {
    mobileFiltersOpen = false;
    document.body.classList.remove('filters-open');
    shopLayout.classList.remove('filters-open');
    sidebar.setAttribute('aria-hidden', 'false');
    toggleButton.setAttribute('aria-expanded', 'false');
    setFilterToggleContent(toggleButton, false);
    backdrop.classList.remove('visible');
    return;
  }

  document.body.classList.toggle('filters-open', mobileFiltersOpen);
  shopLayout.classList.toggle('filters-open', mobileFiltersOpen);
  sidebar.setAttribute('aria-hidden', String(!mobileFiltersOpen));
  toggleButton.setAttribute('aria-expanded', String(mobileFiltersOpen));
  setFilterToggleContent(toggleButton, mobileFiltersOpen);
  backdrop.classList.toggle('visible', mobileFiltersOpen);
}

function toggleMobileFilters(forceOpen) {
  if (!mobileFilterQuery.matches) return;
  mobileFiltersOpen = typeof forceOpen === 'boolean' ? forceOpen : !mobileFiltersOpen;
  syncMobileFiltersUI();
}

if (typeof mobileFilterQuery.addEventListener === 'function') {
  mobileFilterQuery.addEventListener('change', syncMobileFiltersUI);
} else if (typeof mobileFilterQuery.addListener === 'function') {
  mobileFilterQuery.addListener(syncMobileFiltersUI);
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') toggleMobileFilters(false);
});

function catLabel(value) {
  if (value && typeof value === 'object') {
    return String(value.categoryName || CATEGORY_LABELS.get(value.cat || value.category) || value.cat || value.category || 'Products');
  }
  return String(CATEGORY_LABELS.get(String(value || '')) || value || 'Products');
}

function productCreatedAtMs(product) {
  const value = Date.parse(String(product?.createdAt || ''));
  return Number.isFinite(value) ? value : 0;
}

function getFiltered() {
  let list = PRODUCTS.filter(product => {
    const productCategory = product.cat || product.category;
    if (currentCat !== 'all') {
      const acceptedCategories = CATEGORY_SLUGS.get(currentCat) || [currentCat];
      if (!acceptedCategories.includes(productCategory)) return false;
    }
    if (searchTerm) {
      const haystack = [product.name, product.desc, product.cat || product.category, product.slug]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(searchTerm.toLowerCase())) return false;
    }
    if (activeMinPrice !== null && product.price < activeMinPrice) return false;
    if (activeMaxPrice !== null && product.price > activeMaxPrice) return false;
    return true;
  });

  if (currentSort === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (currentSort === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (currentSort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
  if (currentSort === 'newest') list.sort((a, b) => productCreatedAtMs(b) - productCreatedAtMs(a));

  return list;
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const list = getFiltered();
  const count = list.length;
  const totalPages = Math.max(1, Math.ceil(count / ITEMS_PER_PAGE));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const slice = list.slice(start, start + ITEMS_PER_PAGE);

  grid.classList.toggle('list-view', currentView === 'list');

  const resultsCount = document.getElementById('resultsCount');
  resultsCount.replaceChildren();
  const countStrong = document.createElement('strong');
  countStrong.textContent = String(count);
  const productLabel = count === 1 ? copy('productSingularLabel', 'product') : copy('productPluralLabel', 'products');
  resultsCount.append(countStrong, ` ${productLabel} ${copy('foundSuffix', 'found')}`);
  document.getElementById('headerCount').textContent = `${copy('showingPrefix', 'Showing')} ${count} ${productLabel}`;

  if (!count) {
    const emptyState = document.createElement('div');
    emptyState.className = 'no-results empty-state';
    emptyState.innerHTML = '<div class="empty-state-icon">🔍</div>';
    const emptyHeading = document.createElement('h3');
    emptyHeading.textContent = copy('emptyHeading', 'No products found');
    emptyState.append(emptyHeading);
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = searchTerm ? `Nothing matches “${searchTerm}”.` : copy('emptyDescription', 'Try adjusting your filters or clearing them to see more results.');
    emptyState.append(emptyMessage);
    grid.replaceChildren(emptyState);
    renderPagination(0);
    return;
  }

  const cards = slice.map(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = String(product.id || '');
    card.setAttribute('role', 'link');
    card.tabIndex = 0;
    const productUrl = safeProductUrl(product.slug);
    const openProduct = () => { if (productUrl) window.location.href = productUrl; };
    card.addEventListener('click', event => {
      if (!event.target.closest('.add-btn')) openProduct();
    });
    card.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('.add-btn')) openProduct();
    });


    const imageWrap = document.createElement('div');
    imageWrap.className = 'product-img';
    const imageUrl = safeAssetUrl(product.images && product.images[0]);
    if (imageUrl) {
      const image = document.createElement('img');
      if (window.StoreImages) {
        window.StoreImages.apply(image, imageUrl, {
          width: 640,
          widths: [320, 640, 960],
          sizes: currentView === 'list' ? '(max-width: 900px) 35vw, 240px' : '(max-width: 700px) 50vw, 25vw'
        });
      } else {
        image.src = imageUrl;
      }
      image.alt = String(product.name || '');
      image.loading = 'lazy';
      image.addEventListener('error', () => {
        if (image.dataset.fallbackApplied) return;
        image.dataset.fallbackApplied = 'true';
        image.remove();
        imageWrap.textContent = String(product.emoji || '📦');
        imageWrap.setAttribute('aria-label', `Image unavailable for ${String(product.name || 'product')}`);
      }, { once: true });
      imageWrap.append(image);
    } else {
      imageWrap.textContent = String(product.emoji || '');
    }
    card.append(imageWrap);

    const body = document.createElement('div');
    body.className = 'product-body';
    const category = document.createElement('div');
    category.className = 'product-cat';
    category.textContent = catLabel(product);
    const name = document.createElement('div');
    name.className = 'product-name';
    name.textContent = String(product.name || '');
    const description = document.createElement('div');
    description.className = 'product-desc';
    description.textContent = String(product.desc || product.description || '');

    const footer = document.createElement('div');
    footer.className = 'product-footer';
    const priceWrap = document.createElement('div');
    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = formatMoneyClient(product.price);
    priceWrap.append(price);
    const addButton = document.createElement('button');
    addButton.className = 'add-btn';
    addButton.type = 'button';
    addButton.dataset.productId = String(product.id || '');
    addButton.textContent = '+';
    const primaryVariant = product.variants && product.variants[0] ? product.variants[0] : {};
    const primaryStock = Math.max(0, Number(primaryVariant.stock || 0));
    addButton.disabled = primaryStock <= 0;
    if (primaryStock <= 0) {
      addButton.title = 'Currently unavailable';
      addButton.setAttribute('aria-label', `${String(product.name || 'Product')} is currently unavailable`);
    }
    addButton.addEventListener('click', event => {
      event.stopPropagation();
      addToCartFromButton(addButton);
    });
    footer.append(priceWrap, addButton);
    body.append(category, name, description);
    body.append(footer);
    card.append(body);
    return card;
  });
  grid.replaceChildren(...cards);

  renderPagination(count);
}

function renderPagination(total) {
  const container = document.getElementById('pagination');
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  if (!container) return;
  if (!total) {
    container.replaceChildren();
    return;
  }

  const buttons = [];
  const previous = document.createElement('button');
  previous.className = 'page-btn';
  previous.type = 'button';
  previous.textContent = '‹';
  previous.disabled = currentPage === 1;
  previous.addEventListener('click', () => changePage(-1));
  buttons.push(previous);

  for (let page = 1; page <= totalPages; page += 1) {
    const pageButton = document.createElement('button');
    pageButton.className = `page-btn${page === currentPage ? ' active' : ''}`;
    pageButton.type = 'button';
    pageButton.textContent = String(page);
    pageButton.addEventListener('click', () => setPage(page));
    buttons.push(pageButton);
  }

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.type = 'button';
  next.textContent = '›';
  next.disabled = currentPage === totalPages;
  next.addEventListener('click', () => changePage(1));
  buttons.push(next);
  container.replaceChildren(...buttons);
}

// Wishlist removed: functions omitted

function addToCartFromButton(button) {
  addToCart(button.dataset.productId, button);
}

function addToCart(id, button) {
  if (!window.cartManager) return;
  const product = PRODUCTS.find(item => String(item.id) === String(id));
  if (!product) return;

  const fallbackVariant = product.variants && product.variants[0] ? product.variants[0] : {};
  if (Math.max(0, Number(fallbackVariant.stock || 0)) < 1) return;
  window.cartManager.addItem({
    id: product.id,
    name: product.name,
    category: product.cat || product.category,
    categoryName: product.categoryName || catLabel(product),
    emoji: product.emoji,
    slug: product.slug,
    price: Number(product.price || fallbackVariant.price || 0),
    weight: fallbackVariant.weight || product.displayWeight || 'Standard',
    stock: Math.max(0, Number(fallbackVariant.stock || 0)),
    image: product.images && product.images.length ? product.images[0] : '',
  }, 1);

  if (window.refreshCartUI) window.refreshCartUI();
  button.textContent = '✓';
  button.classList.add('cart-add-success');
  setTimeout(() => {
    button.textContent = '+';
    button.classList.remove('cart-add-success');
  }, 1200);
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

function safeProductUrl(slug) {
  const value = String(slug || '').trim();
  if (!value || /[\u0000-\u001f\u007f]/.test(value) || value.includes('/') || value.includes('\\')) return '';
  return `/products/${encodeURIComponent(value)}`;
}

function renderActiveFilters() {
  const container = document.getElementById('activeFilters');
  const tags = [];
  if (searchTerm) tags.push({ label: `Search: ${searchTerm}`, key: 'search' });
  if (currentCat !== 'all') tags.push({ label: catLabel(currentCat), key: 'cat' });
  if (activeMinPrice !== null) tags.push({ label: `Over ${formatMoneyClient(activeMinPrice)}`, key: 'min-price' });
  if (activeMaxPrice !== null) tags.push({ label: `Under ${formatMoneyClient(activeMaxPrice)}`, key: 'max-price' });

  container.replaceChildren(...tags.map(tag => {
    const tagElement = document.createElement('div');
    tagElement.className = 'filter-tag';
    const label = document.createElement('span');
    label.textContent = tag.label;
    const remove = document.createElement('button');
    remove.className = 'filter-tag-remove';
    remove.type = 'button';
    remove.textContent = '×';
    remove.addEventListener('click', () => removeFilter(tag.key));
    tagElement.append(label, ' ', remove);
    return tagElement;
  }));
}

function syncPriceControls() {
  document.getElementById('priceMin').value = activeMinPrice === null ? catalogMinPrice : activeMinPrice;
  document.getElementById('priceMax').value = activeMaxPrice === null ? catalogMaxPrice : activeMaxPrice;
  document.getElementById('priceSlider').value = activeMaxPrice === null ? catalogMaxPrice : activeMaxPrice;
}

function removeFilter(key) {
  if (key === 'search') searchTerm = '';
  else if (key === 'cat') currentCat = 'all';
  else if (key === 'min-price') activeMinPrice = null;
  else if (key === 'max-price') activeMaxPrice = null;
  currentPage = 1;
  syncPriceControls();
  renderActiveFilters();
  renderProducts();
}

function clearFilters() {
  currentCat = 'all';
  currentSort = 'default';
  searchTerm = '';
  activeMinPrice = null;
  activeMaxPrice = null;
  currentPage = 1;
  document.querySelectorAll('.cat-item').forEach(element => element.classList.toggle('active', element.dataset.cat === 'all'));
  document.getElementById('priceMin').value = catalogMinPrice;
  document.getElementById('priceMax').value = catalogMaxPrice;
  document.getElementById('priceSlider').value = catalogMaxPrice;
  renderActiveFilters();
  renderProducts();
}

function setView(view) {
  currentView = view;
  const grid = document.getElementById('productsGrid');
  grid.classList.toggle('list-view', view === 'list');
  document.getElementById('gridViewBtn').classList.toggle('active', view === 'grid');
  document.getElementById('listViewBtn').classList.toggle('active', view === 'list');

  const responsiveSizes = view === 'list'
    ? '(max-width: 900px) 35vw, 240px'
    : '(max-width: 700px) 50vw, 25vw';
  grid.querySelectorAll('.product-img img[srcset]').forEach(image => {
    image.sizes = responsiveSizes;
  });
}

window.setView = setView;

document.getElementById('gridViewBtn').addEventListener('click', event => {
  event.preventDefault();
  setView('grid');
});

document.getElementById('listViewBtn').addEventListener('click', event => {
  event.preventDefault();
  setView('list');
});

function toggleSection(element) {
  const arrow = element.querySelector('.filter-title-arrow');
  const body = element.nextElementSibling;
  const isOpen = arrow.classList.contains('open');
  arrow.classList.toggle('open', !isOpen);
  body.style.display = isOpen ? 'none' : '';
}

document.getElementById('categoryList').addEventListener('click', event => {
  const item = event.target.closest('.cat-item');
  if (!item) return;
  currentCat = item.dataset.cat;
  currentPage = 1;
  document.querySelectorAll('.cat-item').forEach(element => element.classList.toggle('active', element === item));
  renderActiveFilters();
  renderProducts();
});

document.getElementById('sortSelect').addEventListener('change', event => {
  currentSort = event.target.value;
  currentPage = 1;
  renderProducts();
});

document.getElementById('priceSlider').addEventListener('input', event => {
  const value = Math.min(catalogMaxPrice, Math.max(catalogMinPrice, Number(event.target.value) || 0));
  activeMaxPrice = value < catalogMaxPrice ? value : null;
  currentPage = 1;
  document.getElementById('priceMax').value = value;
  if (activeMinPrice !== null && activeMaxPrice !== null && activeMinPrice > activeMaxPrice) {
    activeMinPrice = activeMaxPrice;
    document.getElementById('priceMin').value = activeMinPrice;
  }
  renderActiveFilters();
  renderProducts();
});

document.getElementById('priceMin').addEventListener('change', event => {
  const value = Math.min(catalogMaxPrice, Math.max(catalogMinPrice, Number(event.target.value) || 0));
  activeMinPrice = value > catalogMinPrice ? value : null;
  if (activeMinPrice !== null && activeMaxPrice !== null && activeMinPrice > activeMaxPrice) {
    activeMaxPrice = activeMinPrice;
    document.getElementById('priceMax').value = activeMaxPrice;
    document.getElementById('priceSlider').value = activeMaxPrice;
  }
  document.getElementById('priceMin').value = value;
  currentPage = 1;
  renderActiveFilters();
  renderProducts();
});

document.getElementById('priceMax').addEventListener('change', event => {
  const value = Math.min(catalogMaxPrice, Math.max(catalogMinPrice, Number(event.target.value) || 0));
  activeMaxPrice = value < catalogMaxPrice ? value : null;
  if (activeMinPrice !== null && activeMaxPrice !== null && activeMinPrice > activeMaxPrice) {
    activeMinPrice = activeMaxPrice;
    document.getElementById('priceMin').value = activeMinPrice;
  }
  currentPage = 1;
  document.getElementById('priceMax').value = value;
  document.getElementById('priceSlider').value = value;
  renderActiveFilters();
  renderProducts();
});


function changePage(direction) {
  setPage(currentPage + direction);
}

function setPage(page) {
  const totalPages = Math.max(1, Math.ceil(getFiltered().length / ITEMS_PER_PAGE));
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderProducts();
}

renderProducts();
renderActiveFilters();
syncMobileFiltersUI();
