const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Coupon = require('../models/Coupon');

// Helper: calculate order pricing
const calculatePricing = async (items, couponCode, shippingCharge = 0) => {
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || product.isDeleted || !product.isActive)
      throw new Error(`Product not available: ${item.productId}`);
    if (product.stock.quantity < item.quantity)
      throw new Error(`Insufficient stock for: ${product.name}`);

    const itemSubtotal = product.price.sellingPrice * item.quantity;
    subtotal += itemSubtotal;
    orderItems.push({
      product: product._id,
      productName: product.name,
      productSku: product.sku,
      quantity: item.quantity,
      unit: product.stock.unit,
      mrp: product.price.mrp,
      sellingPrice: product.price.sellingPrice,
      discount: product.price.discount,
      subtotal: itemSubtotal,
    });
  }

  let couponDiscount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, isDeleted: false });
    if (!coupon) throw new Error('Invalid coupon code.');
    if (new Date() > coupon.validUntil) throw new Error('Coupon expired.');
    if (subtotal < coupon.minOrderAmount) throw new Error(`Minimum order amount is ₹${coupon.minOrderAmount}`);
    if (coupon.usageLimit.total && coupon.usedCount >= coupon.usageLimit.total) throw new Error('Coupon usage limit reached.');

    couponDiscount = coupon.discountType === 'percentage'
      ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscount || Infinity)
      : coupon.discountValue;
  }

  const tax = Math.round(subtotal * 0.05); // 5% GST
  const totalAmount = subtotal - couponDiscount + Number(shippingCharge) + tax;

  return { orderItems, pricing: { subtotal, discount: 0, couponDiscount, shippingCharge: Number(shippingCharge), tax, totalAmount }, coupon };
};

// @POST /api/admin/orders  OR  /api/customer/orders
exports.createOrder = async (req, res) => {
  try {
    const { customerId, items, shippingAddress, couponCode, shippingCharge, payment, notes } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer || customer.isDeleted) return res.status(404).json({ success: false, message: 'Customer not found.' });

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

    // Deduct stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 'stock.quantity': -item.quantity, totalSold: item.quantity }
      });
    }

    // Increment coupon usage
    if (coupon) await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });

    // Update customer stats
    await Customer.findByIdAndUpdate(customer._id, {
      $inc: { totalOrders: 1, totalSpent: pricing.totalAmount, loyaltyPoints: Math.floor(pricing.totalAmount / 10) }
    });

    await order.populate('items.product', 'name sku images');
    res.status(201).json({ success: true, message: 'Order placed successfully.', data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/orders
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, customerId, search, fromDate, toDate, paymentMethod, paymentStatus } = req.query;
    const filter = { isDeleted: false };

    if (status) filter.status = status;
    if (customerId) filter.customer = customerId;
    if (paymentMethod) filter['payment.method'] = paymentMethod;
    if (paymentStatus) filter['payment.status'] = paymentStatus;
    if (search) filter.orderNumber = { $regex: search, $options: 'i' };
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const total = await Order.countDocuments(filter);
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

// @GET /api/admin/orders/:id
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

// @PATCH /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.status = status;
    order.statusHistory.push({ status, note, updatedBy: req.admin._id });

    if (status === 'delivered') {
      order.deliveryDate.actual = new Date();
      if (order.payment.method === 'cod') {
        order.payment.status = 'paid';
        order.payment.paidAt = new Date();
      }
    }

    await order.save();
    res.json({ success: true, message: `Order status updated to '${status}'.`, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PATCH /api/admin/orders/:id/payment
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, transactionId } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { 'payment.status': status, 'payment.transactionId': transactionId, 'payment.paidAt': status === 'paid' ? new Date() : undefined },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, message: 'Payment status updated.', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/admin/orders/:id (soft delete)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, message: 'Order deleted (soft).' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
