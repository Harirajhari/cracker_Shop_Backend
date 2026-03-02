const Customer = require('../models/Customer');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

const signToken = (id) =>
  jwt.sign({ id, type: 'customer' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// ─── CUSTOMER AUTH ─────────────────────────────────────────────────────────────

// @POST /api/customer/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const existing = await Customer.findOne({ $or: [{ phone }, { email }], isDeleted: false });
    if (existing) return res.status(400).json({ success: false, message: 'Phone or email already registered.' });

    const customer = await Customer.create({ name, email, phone, password });
    const token = signToken(customer._id);
    customer.password = undefined;
    res.status(201).json({ success: true, token, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/customer/auth/login
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const customer = await Customer.findOne({ phone, isDeleted: false }).select('+password');
    if (!customer || !(await customer.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid phone or password.' });
    if (!customer.isActive) return res.status(403).json({ success: false, message: 'Account deactivated.' });

    const token = signToken(customer._id);
    customer.password = undefined;
    res.json({ success: true, token, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN: MANAGE CUSTOMERS ──────────────────────────────────────────────────

// @GET /api/admin/customers
exports.getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive, tags } = req.query;
    const filter = { isDeleted: false };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (tags) filter.tags = { $in: tags.split(',') };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const total = await Customer.countDocuments(filter);
    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/customers/:id
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    // Get purchase history
    const orders = await Order.find({ customer: customer._id, isDeleted: false })
      .populate('items.product', 'name sku images')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, data: customer, recentOrders: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/admin/customers/:id
exports.updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, notes, tags, isActive, isVerified } = req.body;
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    if (name) customer.name = name;
    if (email) customer.email = email;
    if (phone) customer.phone = phone;
    if (notes !== undefined) customer.notes = notes;
    if (tags) customer.tags = tags;
    if (isActive !== undefined) customer.isActive = isActive;
    if (isVerified !== undefined) customer.isVerified = isVerified;

    await customer.save();
    res.json({ success: true, message: 'Customer updated.', data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/admin/customers/:id (soft delete)
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    customer.isDeleted = true;
    customer.isActive = false;
    customer.deletedAt = new Date();
    await customer.save();
    res.json({ success: true, message: 'Customer deleted (soft).' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/customers/:id/orders — Full purchase history
exports.getCustomerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const orders = await Order.find({ customer: req.params.id, isDeleted: false })
      .populate('items.product', 'name sku images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments({ customer: req.params.id, isDeleted: false });
    res.json({ success: true, total, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
