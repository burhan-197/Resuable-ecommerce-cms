module.exports = Object.freeze({
  hero: {
    enabled: true, eyebrow: '', heading: 'Discover Products', highlight: 'Made for You', headingAfter: '',
    description: '', buttonText: 'Shop Now', buttonUrl: '/products',
    buttonStyle: { useCustomColors: false, background: '#1b3e28', text: '#f5efe6', hoverBackground: '#254d34', hoverText: '#f5efe6' },
    image: ''
  },
  trustBar: { enabled: true, items: [
    { icon: '✓', text: 'Quality Products' }, { icon: '🔒', text: 'Simple Checkout' },
    { icon: '🛒', text: 'Easy Ordering' }, { icon: '🚚', text: 'Reliable Delivery' }, { icon: '💬', text: 'Customer Support' }
  ]},
  categories: { enabled: true, eyebrow: 'Explore Our Range', heading: 'Shop by', highlight: 'Category', subheading: '', limit: 0 },
  featuredProducts: { enabled: true, eyebrow: 'Latest Products', heading: 'Featured', highlight: 'Products', subheading: '', limit: 6 },
  process: { enabled: true, eyebrow: 'Simple Shopping', heading: 'How It', highlight: 'Works', subheading: '', steps: [
    { icon: '🔎', title: 'Browse Products', description: 'Explore the catalog and find the products that suit your needs.' },
    { icon: '🛒', title: 'Add to Cart', description: 'Choose the quantity and add the products you want to your cart.' },
    { icon: '📦', title: 'Order Prepared', description: 'Your order is reviewed and prepared for dispatch.' },
    { icon: '🚚', title: 'Delivered to You', description: 'Your order is sent using the store\'s available delivery method.' }
  ]},
  promo: { enabled: false, eyebrow: '', heading: '', subheading: '', buttonText: '', buttonUrl: '', image: '', buttonStyle: { useCustomColors: false } }
});
