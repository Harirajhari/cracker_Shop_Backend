const Category = require('../models/Category');

// ── Create category ────────────────────────────────────────────────────────────
exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get all active categories ──────────────────────────────────────────────────
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false })
      .populate('parentCategory', 'name')
      .sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get single category ────────────────────────────────────────────────────────
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, isDeleted: false })
      .populate('parentCategory', 'name');
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update category (including offer) ─────────────────────────────────────────
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Set / clear category offer ─────────────────────────────────────────────────
// PATCH /admin/categories/:id/offer
// Body: { isActive, label, discountType, discountValue, expiresAt }
exports.updateCategoryOffer = async (req, res) => {
  try {
    const { isActive, label, discountType, discountValue, expiresAt } = req.body;

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      {
        offer: {
          isActive: !!isActive,
          label: label || '',
          discountType: discountType || 'percentage',
          discountValue: Number(discountValue) || 0,
          expiresAt: expiresAt || null,
        }
      },
      { new: true }
    );
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Soft delete category ───────────────────────────────────────────────────────
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { isDeleted: true, isActive: false });
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Helper: get active offer for a category (used in product pricing logic) ───
// Call this when calculating the final price of a product.
// Returns { hasOffer, discountType, discountValue } or null.
exports.getActiveCategoryOffer = async (categoryId) => {
  try {
    const cat = await Category.findOne({ _id: categoryId, isDeleted: false });
    if (!cat?.offer?.isActive) return null;

    // Check expiry
    if (cat.offer.expiresAt && new Date(cat.offer.expiresAt) < new Date()) {
      // Auto-deactivate expired offer
      await Category.findByIdAndUpdate(categoryId, { 'offer.isActive': false });
      return null;
    }

    return {
      hasOffer: true,
      label: cat.offer.label,
      discountType: cat.offer.discountType,
      discountValue: cat.offer.discountValue,
    };
  } catch {
    return null;
  }
};