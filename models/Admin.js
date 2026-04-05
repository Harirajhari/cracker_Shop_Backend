const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const activityLogSchema = new mongoose.Schema({
  action:     { type: String },   // e.g. 'updated_order', 'created_product'
  module:     { type: String, enum: ['orders', 'products', 'customers', 'coupons', 'other'] },
  targetId:   { type: mongoose.Schema.Types.ObjectId },
  targetName: { type: String },   // e.g. product name, order number
  note:       { type: String },
  at:         { type: Date, default: Date.now },
}, { _id: true });

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  phone: { type: String, trim: true },

  role: {
    type: String,
    enum: ['admin', 'staff'],
    default: 'staff',
  },

  permissions: {
    products:  {
      create: { type: Boolean, default: false },
      read:   { type: Boolean, default: true  },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    orders:    {
      create: { type: Boolean, default: false },
      read:   { type: Boolean, default: true  },
      update: { type: Boolean, default: true  },
      delete: { type: Boolean, default: false },
    },
    customers: {
      create: { type: Boolean, default: false },
      read:   { type: Boolean, default: true  },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    reports: {
      read: { type: Boolean, default: false },
    },
    admins: {
      create: { type: Boolean, default: false },
      read:   { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
  },

  // Last 100 actions this admin performed
  activityLog: {
    type: [activityLogSchema],
    default: [],
    select: false,   // not loaded by default — fetch explicitly when needed
  },

  isActive:  { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  lastLogin: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

}, { timestamps: true });

// ── Hash password ─────────────────────────────────────────────────────────────
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Role permissions ──────────────────────────────────────────────────────────
adminSchema.methods.setRolePermissions = function () {
  const map = {
    admin: {
      products:  { create: true,  read: true, update: true,  delete: true  },
      orders:    { create: true,  read: true, update: true,  delete: true  },
      customers: { create: true,  read: true, update: true,  delete: true  },
      reports:   { read: true },
      admins:    { create: true,  read: true, update: true,  delete: true  },
    },
    staff: {
      products:  { create: false, read: true, update: false, delete: false },
      orders:    { create: false, read: true, update: true,  delete: false },
      customers: { create: false, read: true, update: false, delete: false },
      reports:   { read: false },
      admins:    { create: false, read: false,update: false, delete: false },
    },
  };
  this.permissions = map[this.role] || map.staff;
};

// ── Log an activity (keeps last 100) ─────────────────────────────────────────
adminSchema.methods.logActivity = async function ({ action, module, targetId, targetName, note }) {
  await this.constructor.findByIdAndUpdate(this._id, {
    $push: {
      activityLog: {
        $each: [{ action, module, targetId, targetName, note, at: new Date() }],
        $slice: -100,   // keep newest 100
        $position: 0,   // prepend so newest is first
      },
    },
  });
};

module.exports = mongoose.model('Admin', adminSchema);