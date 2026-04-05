const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    required: true,
  },
  sku: {
    type: String,
    unique: true,
    uppercase: true,
  },
  description: { type: String },
  shortDescription: { type: String },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  brand: { type: String, trim: true },
  images: [String],

  price: {
    basePrice:  { type: Number, required: true },   // The one price admin sets
    costPrice:  { type: Number },                   // Private cost price
    discount:   { type: Number, default: 0 },       // Auto-calculated from category offer
  },

  stock: {
    quantity: { type: Number, default: null },  // null = unlimited stock
    unit:         { type: String, default: 'piece' },
    minOrderQty:  { type: Number, default: 1 },
    maxOrderQty:  { type: Number, default: 100 },
    lowStockAlert:{ type: Number, default: 10 },
  },


  
  specifications: {
    weight:     { type: String },
    dimensions: { type: String },
    color:      { type: String },
    duration:   { type: String },
    height:     { type: String },
    noise:      { type: String, enum: ['silent', 'low', 'medium', 'loud'] },
    type:       { type: String },
  },

  safetyInfo: {
    ageRestriction: { type: Number, default: 18 },
    safetyTips:     [String],
    hazardLevel:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  },

  tags:       [String],
  isFeatured: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date },
  deletedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

  ratings: {
    average: { type: Number, default: 0 },
    count:   { type: Number, default: 0 },
  },
  totalSold: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

}, { timestamps: true });

// Auto-generate slug and SKU
productSchema.pre('validate', function (next) {
  if (this.name) {
    this.slug =
      this.name.toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') +
      '-' + Date.now();
  }
  if (!this.sku) {
    this.sku = 'CRK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// ── Virtual: compute final price from category offer ──────────────────────────
// Usage: await product.populate('category')
// then:  product.finalPrice  →  discounted price
// and:   product.offerLabel  →  e.g. "Diwali Sale"
productSchema.virtual('finalPrice').get(function () {
  const base = this.price?.basePrice || 0;
  const offer = this.category?.offer;

  if (!offer?.isActive) return base;
  if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) return base;

  if (offer.discountType === 'percentage') {
    return Math.round(base * (1 - offer.discountValue / 100));
  }
  if (offer.discountType === 'fixed') {
    return Math.max(0, base - offer.discountValue);
  }
  return base;
});

productSchema.virtual('offerLabel').get(function () {
  const offer = this.category?.offer;
  if (!offer?.isActive) return null;
  if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) return null;
  return offer.label || null;
});

productSchema.virtual('discountPercent').get(function () {
  const base = this.price?.basePrice || 0;
  const final = this.finalPrice;
  if (!base || base === final) return 0;
  return Math.round(((base - final) / base) * 100);
});

// Include virtuals in JSON output (for API responses)
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);