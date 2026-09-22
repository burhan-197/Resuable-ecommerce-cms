const crypto = require('crypto');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { cleanText } = require('../utils/text');

function fail(status, message) {
  const error = new Error(message);
  error.statusCode = status;
  error.expose = true;
  throw error;
}

async function orderId() {
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const id = `ORD-${date}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    if (!(await Order.exists({ id }))) return id;
  }
  return `ORD-${Date.now()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

async function rollback(items) {
  for (const item of items) {
    await Product.updateOne({ id: item.productId }, { $inc: { 'variants.0.stock': item.qty } }).catch(() => {});
  }
}

function parseCustomer(body) {
  const first = cleanText(body.firstName, 80);
  const last = cleanText(body.lastName, 80);
  const phone = cleanText(body.phone, 50);
  const email = cleanText(body.email, 254).toLowerCase();
  const address = cleanText(body.address, 500);
  const city = cleanText(body.city, 100);
  const state = cleanText(body.state, 100);
  const postalCode = cleanText(body.postalCode, 30);
  const instructions = cleanText(body.instructions, 1000);

  if (!first || !last || !phone || !address || !city) fail(400, 'Name, phone, address and city are required.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Enter a valid email address.');
  if (body.agreeTerms !== true && String(body.agreeTerms) !== 'true' && String(body.agreeTerms) !== 'on') fail(400, 'Please accept the order terms.');

  return { first, last, phone, email, address, city, state, postalCode, instructions };
}

function parseCart(raw) {
  if (!Array.isArray(raw) || !raw.length) fail(400, 'Your cart is empty.');
  if (raw.length > 50) fail(400, 'Too many items in one order.');

  const grouped = new Map();
  for (const item of raw) {
    const id = cleanText(item.id || item.productId, 80);
    const qty = Number(item.qty);
    if (!id) fail(400, 'Invalid product in cart.');
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) fail(400, 'Each product quantity must be a whole number between 1 and 99.');
    const nextQty = (grouped.get(id) || 0) + qty;
    if (nextQty > 99) fail(400, 'A product quantity cannot exceed 99 units per order.');
    grouped.set(id, nextQty);
  }
  return grouped;
}

async function create(req, res, next) {
  const decremented = [];
  try {
    const customer = parseCustomer(req.body || {});
    const payment = String(req.body.payment || 'cod').toLowerCase();
    if (!['cod', 'manual'].includes(payment)) fail(400, 'Unsupported payment method.');

    const grouped = parseCart(req.body.cartItems);
    const items = [];
    let subtotal = 0;

    for (const [productId, qty] of grouped.entries()) {
      const product = await Product.findOneAndUpdate(
        { id: productId, isActive: true, 'variants.0.stock': { $gte: qty } },
        { $inc: { 'variants.0.stock': -qty } },
        { new: true }
      );

      if (!product) fail(409, 'One or more products are unavailable or do not have enough stock.');

      decremented.push({ productId: product.id, qty });
      const variant = product.variants?.[0];
      if (!variant || !Number.isFinite(Number(variant.price)) || Number(variant.price) <= 0) fail(409, `${product.name} is unavailable.`);

      const price = Number(variant.price);
      items.push({
        productId: product.id,
        name: product.name,
        variant: 'Standard',
        qty,
        price,
        image: product.images?.[0] || '',
      });
      subtotal += price * qty;
    }

    const id = await orderId();
    const order = await Order.create({
      id,
      customer: `${customer.first} ${customer.last}`.trim(),
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      instructions: customer.instructions,
      items,
      subtotal,
      shipping: 0,
      total: subtotal,
      paymentMethod: payment,
      paymentStatus: 'pending',
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      orderId: order.id,
      paymentMethod: payment === 'cod' ? 'Cash on Delivery' : 'Manual Payment',
      paymentMethodId: payment,
      paymentStatus: 'pending',
      totals: { subtotal: order.subtotal, shipping: 0, total: order.total },
    });
  } catch (error) {
    if (decremented.length) await rollback(decremented);
    next(error);
  }
}

async function complete(req, res, next) {
  try {
    const id = cleanText(req.query.id, 120);
    const order = id ? await Order.findOne({ id }).lean() : null;
    if (!order) return res.status(404).render('public/pages/not-found', { title: 'Order not found', metaDesc: 'The requested order could not be found.', cartCount: 0, active: 'cart' });

    res.set('Cache-Control', 'no-store, private');
    const orderData = {
      orderNumber: order.id,
      items: order.items,
      summary: { subtotal: order.subtotal, shipping: order.shipping || 0, total: order.total },
      customerName: order.customer,
      address: order.address,
      city: order.city,
      state: order.state,
      postalCode: order.postalCode,
      email: order.email,
      phone: order.phone,
      instructions: order.instructions,
      paymentMethod: order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Manual Payment',
      paymentStatus: order.paymentStatus,
    };
    return res.render('public/pages/order-complete', { active: 'cart', cartCount: 0, orderData, canonical: null, breadcrumbs: [] });
  } catch (error) {
    next(error);
  }
}

module.exports = { create, complete };
