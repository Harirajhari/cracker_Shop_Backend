const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName:  { type: String, required: true },  // snapshot at time of order
  productSku:   { type: String },
  quantity:     { type: Number, required: true, min: 1 },
  unit:         { type: String, default: 'piece' },
  mrp:          { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  discount:     { type: Number, default: 0 },
  subtotal:     { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  // Snapshot of customer info at time of order
  customerSnapshot: {
    name:  String,
    email: String,
    phone: String,
  },
  items: [orderItemSchema],
  shippingAddress: {
    street:  { type: String, required: true },
    city:    { type: String, required: true },
    state:   { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  pricing: {
    subtotal:       { type: Number, required: true },
    discount:       { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    tax:            { type: Number, default: 0 },
    totalAmount:    { type: Number, required: true },
  },
  couponCode: {
    type: String,
  },
  payment: {
    method:        { type: String, enum: ['cash', 'upi', 'card', 'netbanking', 'cod'], default: 'cod' },
    status:        { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    transactionId: { type: String },
    paidAt:        { type: Date },
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
  },
  statusHistory: [{
    status:    String,
    note:      String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedAt: { type: Date, default: Date.now },
  }],
  deliveryDate: {
    expected: Date,
    actual:   Date,
  },
  notes: {
    customer: String,
    admin:    String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',   // if placed by admin on behalf of customer
  },
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 9000) + 1000;
    this.orderNumber = `ORD-${y}${m}${d}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
