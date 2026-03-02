const Product = require('../models/Product');

// @POST /api/admin/products
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, createdBy: req.admin._id });
    res.status(201).json({ success: true, message: 'Product created.', data: product });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: 'Product SKU already exists.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/products  OR  @GET /api/products (public)
exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, search, category, brand,
      minPrice, maxPrice, isFeatured, isActive, inStock, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const filter = { isDeleted: false };
    if (req.admin === undefined) filter.isActive = true; // public route only active

    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (inStock === 'true') filter['stock.quantity'] = { $gt: 0 };
    if (minPrice || maxPrice) {
      filter['price.sellingPrice'] = {};
      if (minPrice) filter['price.sellingPrice'].$gte = Number(minPrice);
      if (maxPrice) filter['price.sellingPrice'].$lte = Number(maxPrice);
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), totalPages: Math.ceil(total / limit), data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false })
      .populate('category', 'name slug')
      .populate('createdBy', 'name email');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/admin/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: 'Product updated.', data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/admin/products/:id (soft delete)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    product.isDeleted = true;
    product.isActive = false;
    product.deletedAt = new Date();
    product.deletedBy = req.admin._id;
    await product.save();
    res.json({ success: true, message: 'Product deleted (soft).' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PATCH /api/admin/products/:id/restore
exports.restoreProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, isActive: true, deletedAt: null, deletedBy: null },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: 'Product restored.', data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PATCH /api/admin/products/:id/stock
exports.updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'set' | 'add' | 'subtract'
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    if (operation === 'add') product.stock.quantity += quantity;
    else if (operation === 'subtract') product.stock.quantity = Math.max(0, product.stock.quantity - quantity);
    else product.stock.quantity = quantity;

    await product.save();
    res.json({ success: true, message: 'Stock updated.', stock: product.stock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
