const Order = require('../models/Order');
const Product = require('../models/Product');

const allowed = new Set(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);

async function list(req, res, next) {
  try {
    res.render('admin/pages/orders', { orders: await Order.find().sort({ createdAt: -1 }).lean() });
  } catch (error) {
    next(error);
  }
}

async function detail(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).send('Order not found.');
    res.render('admin/pages/order-detail', { order, error: '' });
  } catch (error) {
    next(error);
  }
}

async function cancelAndRestore(order) {
  const previousStatus = order.status;
  const claimedAt = new Date();

  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, status: previousStatus, inventoryRestoredAt: null },
    { $set: { status: 'cancelled', inventoryRestoredAt: claimedAt, isNewOrder: false } },
    { new: true }
  );

  if (!claimed) return false;

  const restored = [];
  try {
    for (const item of claimed.items || []) {
      const qty = Number(item.qty || 0);
      if (!Number.isInteger(qty) || qty <= 0) continue;
      await Product.updateOne({ id: item.productId }, { $inc: { 'variants.0.stock': qty } });
      restored.push({ productId: item.productId, qty });
    }
    return true;
  } catch (error) {
    for (const item of restored) {
      await Product.updateOne(
        { id: item.productId, 'variants.0.stock': { $gte: item.qty } },
        { $inc: { 'variants.0.stock': -item.qty } }
      ).catch(() => {});
    }
    await Order.updateOne(
      { _id: order._id, status: 'cancelled', inventoryRestoredAt: claimedAt },
      { $set: { status: previousStatus, inventoryRestoredAt: null } }
    ).catch(() => {});
    throw error;
  }
}

async function updateStatus(req, res, next) {
  try {
    const status = String(req.body.status || '');
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send('Order not found.');

    if (!allowed.has(status)) {
      return res.status(400).render('admin/pages/order-detail', { order: order.toObject(), error: 'Invalid order status.' });
    }
    if (order.status === 'cancelled' && status !== 'cancelled') {
      return res.status(409).render('admin/pages/order-detail', { order: order.toObject(), error: 'Cancelled orders cannot be reopened.' });
    }
    if (status === order.status) return res.redirect(`/admin/orders/${order._id}`);

    if (status === 'cancelled') {
      const changed = await cancelAndRestore(order);
      if (!changed) {
        const latest = await Order.findById(order._id).lean();
        const message = latest?.status === 'cancelled'
          ? 'This order has already been cancelled.'
          : 'The order changed while you were updating it. Refresh and try again.';
        return res.status(409).render('admin/pages/order-detail', { order: latest || order.toObject(), error: message });
      }
      return res.redirect(`/admin/orders/${order._id}`);
    }

    // Use a compare-and-set update so a stale admin request cannot reopen an order
    // that was cancelled in another tab/request while this page was open.
    const changed = await Order.findOneAndUpdate(
      { _id: order._id, status: order.status, inventoryRestoredAt: null },
      { $set: { status, isNewOrder: false } },
      { new: true }
    );

    if (!changed) {
      const latest = await Order.findById(order._id).lean();
      const message = latest?.status === 'cancelled'
        ? 'Cancelled orders cannot be reopened.'
        : 'The order changed while you were updating it. Refresh and try again.';
      return res.status(409).render('admin/pages/order-detail', { order: latest || order.toObject(), error: message });
    }

    res.redirect(`/admin/orders/${order._id}`);
  } catch (error) {
    next(error);
  }
}

module.exports = { list, detail, updateStatus };
