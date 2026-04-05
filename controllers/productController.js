const Product = require('../models/Product');
const { deleteCloudinaryImage } = require('../middleware/upload');

// @POST /api/admin/products  (multipart/form-data)
exports.createProduct = async (req, res) => {
  try {
    const imageUrls = req.files?.map(f => f.path) || [];

    const product = await Product.create({
      ...req.body,
      images: imageUrls,
      createdBy: req.admin._id,
      price: req.body.price ? JSON.parse(req.body.price) : undefined,
      stock: req.body.stock ? JSON.parse(req.body.stock) : undefined,
    });

    const populated = await Product.findById(product._id)
      .populate('category', 'name slug offer');

    res.status(201).json({ success: true, message: 'Product created.', data: populated });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: 'Product SKU already exists.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/products
exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, search, category, brand,
      minPrice, maxPrice, isFeatured, isActive, inStock,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const filter = { isDeleted: false };
    if (req.admin === undefined) filter.isActive = true;

    if (search)   filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (brand)    filter.brand = { $regex: brand, $options: 'i' };
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (isActive !== undefined)   filter.isActive = isActive === 'true';

    if (inStock === 'true') {
      filter.$or = [
        { 'stock.quantity': null },
        { 'stock.quantity': { $gt: 0 } },
      ];
    }

    if (minPrice || maxPrice) {
      filter['price.basePrice'] = {};
      if (minPrice) filter['price.basePrice'].$gte = Number(minPrice);
      if (maxPrice) filter['price.basePrice'].$lte = Number(maxPrice);
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name slug offer')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true, total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: products,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false })
      .populate('category', 'name slug offer')
      .populate('createdBy', 'name email');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/admin/products/:id  (multipart/form-data)
exports.updateProduct = async (req, res) => {
  try {
    const existing = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found.' });

    const newImageUrls = req.files?.map(f => f.path) || [];

    // keepImages = existing URLs the frontend wants to keep
    let keepImages = [];
    if (req.body.keepImages) {
      keepImages = JSON.parse(req.body.keepImages);
    }

    // Delete images removed by admin from Cloudinary
    const removedImages = existing.images.filter(url => !keepImages.includes(url));
    await Promise.all(removedImages.map(deleteCloudinaryImage));

    const finalImages = [...keepImages, ...newImageUrls];

    const updateData = {
      ...req.body,
      images: finalImages,
      price: req.body.price ? JSON.parse(req.body.price) : existing.price,
      stock: req.body.stock ? JSON.parse(req.body.stock) : existing.stock,
    };
    delete updateData.keepImages;

    const product = await Product.findByIdAndUpdate(
      req.params.id, updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug offer');

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
    product.isActive  = false;
    product.deletedAt = new Date();
    product.deletedBy = req.admin._id;
    await product.save();
    res.json({ success: true, message: 'Product deleted.' });
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
    ).populate('category', 'name slug offer');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: 'Product restored.', data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PATCH /api/admin/products/:id/stock
exports.updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body;
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    if (operation === 'set') {
      product.stock.quantity = quantity === null ? null : Number(quantity);
    } else if (operation === 'add') {
      if (product.stock.quantity !== null) product.stock.quantity += Number(quantity);
    } else if (operation === 'subtract') {
      if (product.stock.quantity !== null)
        product.stock.quantity = Math.max(0, product.stock.quantity - Number(quantity));
    }

    await product.save();
    res.json({ success: true, message: 'Stock updated.', stock: product.stock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};