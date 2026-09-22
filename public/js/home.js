document.querySelectorAll('.product-img-wrap img').forEach(image => {
  image.addEventListener('error', () => {
    if (image.dataset.fallbackApplied) return;
    image.dataset.fallbackApplied = 'true';
    const placeholder = document.createElement('span');
    placeholder.textContent = image.dataset.fallback || '📦';
    placeholder.setAttribute('aria-label', `Image unavailable for ${image.alt || 'product'}`);
    image.replaceWith(placeholder);
  }, { once: true });
});

document.querySelectorAll('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', () => {
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
        image: btn.dataset.image || '',
      }, 1);
      if (window.refreshCartUI) window.refreshCartUI();
    }

    btn.textContent = '✓';
    btn.classList.add('cart-add-success');
    setTimeout(() => { btn.textContent = '+'; btn.classList.remove('cart-add-success'); }, 1200);
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.product-card, .cat-card, .testi-card, .process-step').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity .6s ease, transform .6s ease';
  observer.observe(el);
});