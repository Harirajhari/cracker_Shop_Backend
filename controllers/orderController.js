const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Coupon = require('../models/Coupon');

// ── Helper: calculate pricing ─────────────────────────────────────────────────
const calculatePricing = async (items, couponCode, shippingCharge = 0) => {
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId)
      .populate('category', 'name slug offer');
    if (!product || product.isDeleted || !product.isActive)
      throw new Error(`Product not available: ${item.productId}`);

    // null stock = unlimited, never block
    if (product.stock.quantity !== null && product.stock.quantity < item.quantity)
      throw new Error(`Insufficient stock for: ${product.name}`);

    // Use finalPrice virtual (applies category offer automatically)
    const unitPrice   = product.finalPrice ?? product.price.basePrice;
    const itemSubtotal = unitPrice * item.quantity;
    subtotal += itemSubtotal;

    orderItems.push({
      product:      product._id,
      productName:  product.name,
      productSku:   product.sku,
      quantity:     item.quantity,
      unit:         product.stock.unit,
      basePrice:    product.price.basePrice,
      unitPrice,                            // final price after category offer
      offerLabel:   product.offerLabel || null,
      subtotal:     itemSubtotal,
    });
  }

  let couponDiscount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, isDeleted: false });
    if (!coupon)                throw new Error('Invalid coupon code.');
    if (new Date() > coupon.validUntil) throw new Error('Coupon expired.');
    if (subtotal < coupon.minOrderAmount) throw new Error(`Minimum order amount is ₹${coupon.minOrderAmount}`);
    if (coupon.usageLimit.total && coupon.usedCount >= coupon.usageLimit.total)
      throw new Error('Coupon usage limit reached.');

    couponDiscount = coupon.discountType === 'percentage'
      ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscount || Infinity)
      : coupon.discountValue;
  }

  const tax         = Math.round(subtotal * 0.05);
  const totalAmount = subtotal - couponDiscount + Number(shippingCharge) + tax;

  return {
    orderItems,
    pricing: { subtotal, couponDiscount, shippingCharge: Number(shippingCharge), tax, totalAmount },
    coupon,
  };
};

// ── Create order ──────────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { customerId, items, shippingAddress, couponCode, shippingCharge, payment, notes } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer || customer.isDeleted)
      return res.status(404).json({ success: false, message: 'Customer not found.' });

    const { orderItems, pricing, coupon } = await calculatePricing(items, couponCode, shippingCharge);

    const order = new Order({
      customer: customer._id,
      customerSnapshot: { name: customer.name, email: customer.email, phone: customer.phone },
      items: orderItems,
      shippingAddress,
      pricing,
      couponCode,
      payment: payment || { method: 'cod', status: 'pending' },
      notes: { customer: notes?.customer, admin: notes?.admin },
      statusHistory: [{ status: 'pending', note: 'Order placed', updatedBy: req.admin?._id }],
      createdBy: req.admin?._id,
    });

    await order.save();

    // Deduct stock (only for tracked products — skip null/unlimited)
    for (const item of orderItems) {
      await Product.findOneAndUpdate(
        { _id: item.product, 'stock.quantity': { $ne: null } },
        { $inc: { 'stock.quantity': -item.quantity, totalSold: item.quantity } }
      );
      // For unlimited products just increment totalSold
      await Product.findOneAndUpdate(
        { _id: item.product, 'stock.quantity': null },
        { $inc: { totalSold: item.quantity } }
      );
    }

    if (coupon) await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });

    await Customer.findByIdAndUpdate(customer._id, {
      $inc: {
        totalOrders: 1,
        totalSpent: pricing.totalAmount,
        loyaltyPoints: Math.floor(pricing.totalAmount / 10),
      },
    });

    // Log activity
    if (req.admin) {
      await req.admin.logActivity({
        action: 'created_order',
        module: 'orders',
        targetId: order._id,
        targetName: order.orderNumber,
      });
    }

    await order.populate('items.product', 'name sku images');
    res.status(201).json({ success: true, message: 'Order placed successfully.', data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Get all orders ────────────────────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, status, customerId, search,
      fromDate, toDate, paymentMethod, paymentStatus,
    } = req.query;

    const filter = { isDeleted: false };
    if (status)        filter.status = status;
    if (customerId)    filter.customer = customerId;
    if (paymentMethod) filter['payment.method'] = paymentMethod;
    if (paymentStatus) filter['payment.status'] = paymentStatus;
    if (search)        filter.orderNumber = { $regex: search, $options: 'i' };
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate)   filter.createdAt.$lte = new Date(toDate);
    }

    const total  = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get single order ──────────────────────────────────────────────────────────
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customer', 'name phone email addresses')
      .populate('items.product', 'name sku images');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update order status ───────────────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.status = status;
    order.statusHistory.push({ status, note, updatedBy: req.admin._id });

    if (status === 'delivered') {
      order.deliveryDate = { actual: new Date() };
      if (order.payment.method === 'cod') {
        order.payment.status = 'paid';
        order.payment.paidAt = new Date();
      }
    }
    await order.save();

    // Log activity
    await req.admin.logActivity({
      action: `order_status_${status}`,
      module: 'orders',
      targetId: order._id,
      targetName: order.orderNumber,
      note: note || `Status changed to ${status}`,
    });

    res.json({ success: true, message: `Order status updated to '${status}'.`, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update payment status ─────────────────────────────────────────────────────
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, transactionId } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      {
        'payment.status': status,
        'payment.transactionId': transactionId,
        'payment.paidAt': status === 'paid' ? new Date() : undefined,
      },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    await req.admin.logActivity({
      action: `payment_${status}`,
      module: 'orders',
      targetId: order._id,
      targetName: order.orderNumber,
    });

    res.json({ success: true, message: 'Payment status updated.', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Delete order ──────────────────────────────────────────────────────────────
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, message: 'Order deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};