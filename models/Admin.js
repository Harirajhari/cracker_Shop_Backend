const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  phone: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'manager', 'staff'],
    default: 'staff',
  },
  permissions: {
    products: {
      create: { type: Boolean, default: false },
      read:   { type: Boolean, default: true },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    orders: {
      create: { type: Boolean, default: false },
      read:   { type: Boolean, default: true },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    customers: {
      create: { type: Boolean, default: false },
      read:   { type: Boolean, default: true },
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
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  lastLogin: {
    type: Date,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Set default permissions based on role
adminSchema.methods.setRolePermissions = function () {
  const rolePermissions = {
    super_admin: {
      products:  { create: true, read: true, update: true, delete: true },
      orders:    { create: true, read: true, update: true, delete: true },
      customers: { create: true, read: true, update: true, delete: true },
      reports:   { read: true },
      admins:    { create: true, read: true, update: true, delete: true },
    },
    admin: {
      products:  { create: true, read: true, update: true, delete: true },
      orders:    { create: true, read: true, update: true, delete: false },
      customers: { create: true, read: true, update: true, delete: false },
      reports:   { read: true },
      admins:    { create: true, read: true, update: false, delete: false },
    },
    manager: {
      products:  { create: true, read: true, update: true, delete: false },
      orders:    { create: true, read: true, update: true, delete: false },
      customers: { create: false, read: true, update: false, delete: false },
      reports:   { read: true },
      admins:    { create: false, read: true, update: false, delete: false },
    },
    staff: {
      products:  { create: false, read: true, update: false, delete: false },
      orders:    { create: true, read: true, update: true, delete: false },
      customers: { create: false, read: true, update: false, delete: false },
      reports:   { read: false },
      admins:    { create: false, read: false, update: false, delete: false },
    },
  };
  this.permissions = rolePermissions[this.role] || rolePermissions.staff;
};

module.exports = mongoose.model('Admin', adminSchema);
