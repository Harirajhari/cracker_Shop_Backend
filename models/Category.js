const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  label: { type: String, trim: true },            // e.g. "Diwali Sale"
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
  },
  discountValue: { type: Number, default: 0 },    // e.g. 10 (for 10% or ₹10)
  expiresAt: { type: Date, default: null },
}, { _id: false });

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: { type: String },
  image: { type: String },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  offer: { type: offerSchema, default: () => ({ isActive: false }) },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-generate slug from name
categorySchema.pre('validate', function (next) {
  if (this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);