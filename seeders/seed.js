require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cracker_shop';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'cracker_shop_super_secret_key_2024';

const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // ── Clear all collections ────────────────────────────────────
  await Promise.all([
    Admin.deleteMany(),
    Customer.deleteMany(),
    Category.deleteMany(),
    Product.deleteMany(),
    Order.deleteMany(),
    Coupon.deleteMany(),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── ADMINS (2 roles: admin + staff) ─────────────────────────
  const admin = new Admin({
    name: 'Gurubhagavan',
    email: 'admin@gbfireworks.com',
    password: 'Admin@123',
    phone: '9876543210',
    role: 'admin',
  });
  admin.setRolePermissions();
  await admin.save();

  const admin1 = new Admin({
    name: 'Super Admin',
    email: 'superadmin@crackers.com',
    password: 'Admin@123',
    phone: '9876543210',
    role: 'admin',
  });
  admin1.setRolePermissions();
  await admin1.save();

  const staff1 = new Admin({
    name: 'Karthik Selvam',
    email: 'karthik@gbfireworks.com',
    password: 'Staff@123',
    phone: '9876543211',
    role: 'staff',
    createdBy: admin._id,
  });
  staff1.setRolePermissions();
  await staff1.save();

  const staff2 = new Admin({
    name: 'Deepa Natarajan',
    email: 'deepa@gbfireworks.com',
    password: 'Staff@123',
    phone: '9876543212',
    role: 'staff',
    createdBy: admin._id,
  });
  staff2.setRolePermissions();
  await staff2.save();

  console.log('✅ Admins seeded (1 admin + 2 staff)');

  // ── CATEGORIES ───────────────────────────────────────────────
  const cats = await Category.insertMany([
    {
      name: 'Sparklers',
      description: 'Hand-held sparklers for all ages',
      sortOrder: 1,
    },
    {
      name: 'Ground Chakkar',
      description: 'Spinning ground crackers',
      sortOrder: 2,
    },
    {
      name: 'Aerial Shots',
      description: 'High-altitude aerial fireworks',
      sortOrder: 3,
      offer: {
        isActive: true,
        label: 'Diwali Offer',
        discountType: 'percentage',
        discountValue: 10,
        expiresAt: new Date('2026-12-31'),
      },
    },
    {
      name: 'Flower Pots',
      description: 'Fountain-style ground fireworks',
      sortOrder: 4,
    },
    {
      name: 'String Crackers',
      description: 'Chain of crackers for big noise',
      sortOrder: 5,
    },
    {
      name: 'Sky Rockets',
      description: 'Rockets that shoot into the sky',
      sortOrder: 6,
    },
    {
      name: 'Gift Boxes',
      description: 'Curated assortment gift boxes',
      sortOrder: 7,
      offer: {
        isActive: true,
        label: 'Festival Pack',
        discountType: 'fixed',
        discountValue: 200,
        expiresAt: new Date('2026-12-31'),
      },
    },
    {
      name: 'Silent Crackers',
      description: 'Low-noise eco-friendly crackers',
      sortOrder: 8,
    },
  ]);
  console.log('✅ Categories seeded (2 with active offers)');

  // ── PRODUCTS (basePrice only, null stock = unlimited) ────────
  const products = await Product.insertMany([
    {
      name: 'Gold Sparkler 25cm',
      description: 'Premium gold sparkler, burns 45 seconds. Perfect for all celebrations.',
      category: cats[0]._id,
      brand: 'Standard',
      price: { basePrice: 120 },
      stock: { quantity: 500, unit: 'pack', lowStockAlert: 50 },
      specifications: { noise: 'silent', type: 'sparkler', duration: '45 sec', color: 'Gold', weight: '250g' },
      safetyInfo: { ageRestriction: 5, hazardLevel: 'low', safetyTips: ['Hold away from face', 'Do not point at others'] },
      tags: ['sparkler', 'gold', 'diwali'],
      isFeatured: true,
      totalSold: 1200,
      createdBy: admin._id,
    },
    {
      name: 'Silver Sparkler 50cm',
      description: 'Long silver sparkler with 60-second burn time.',
      category: cats[0]._id,
      brand: 'Standard',
      price: { basePrice: 170 },
      stock: { quantity: 300, unit: 'pack', lowStockAlert: 30 },
      specifications: { noise: 'silent', type: 'sparkler', duration: '60 sec', color: 'Silver', weight: '400g' },
      safetyInfo: { ageRestriction: 5, hazardLevel: 'low' },
      tags: ['sparkler', 'silver'],
      isFeatured: false,
      totalSold: 800,
      createdBy: admin._id,
    },
    {
      name: 'Chakkar No. 6',
      description: 'Classic ground spinner with rainbow colors.',
      category: cats[1]._id,
      brand: 'Cock Brand',
      price: { basePrice: 65 },
      stock: { quantity: null, unit: 'box', lowStockAlert: 100 },  // unlimited
      specifications: { noise: 'medium', type: 'ground', duration: '20 sec', color: 'Multicolor', weight: '100g' },
      safetyInfo: { ageRestriction: 12, hazardLevel: 'medium', safetyTips: ['Place on flat surface', 'Keep 3m distance'] },
      tags: ['chakkar', 'ground', 'colorful'],
      isFeatured: true,
      totalSold: 2500,
      createdBy: admin._id,
    },
    {
      name: 'Multi Shot 25 Shots',
      description: 'Powerful 25-shot aerial display with multicolor stars.',
      category: cats[2]._id,  // Aerial — has 10% offer
      brand: 'Sony',
      price: { basePrice: 650 },
      stock: { quantity: 200, unit: 'piece', lowStockAlert: 20 },
      specifications: { noise: 'loud', type: 'aerial', duration: '45 sec', height: '50ft', weight: '2kg' },
      safetyInfo: { ageRestriction: 18, hazardLevel: 'high', safetyTips: ['Adults only', 'Keep 10m distance', 'Never relight'] },
      tags: ['aerial', 'multishot', 'premium'],
      isFeatured: true,
      totalSold: 350,
      createdBy: admin._id,
    },
    {
      name: 'Flower Pot No. 4',
      description: 'Beautiful fountain-style cracker with golden sparks.',
      category: cats[3]._id,
      brand: 'Cock Brand',
      price: { basePrice: 95 },
      stock: { quantity: 600, unit: 'piece', lowStockAlert: 60 },
      specifications: { noise: 'low', type: 'fountain', duration: '30 sec', weight: '300g' },
      safetyInfo: { ageRestriction: 12, hazardLevel: 'medium' },
      tags: ['flower pot', 'fountain', 'golden'],
      isFeatured: false,
      totalSold: 900,
      createdBy: admin._id,
    },
    {
      name: '1000 Wala Ladi',
      description: '1000 cracker chain — perfect for big celebrations.',
      category: cats[4]._id,
      brand: 'Standard',
      price: { basePrice: 210 },
      stock: { quantity: 8, unit: 'roll', lowStockAlert: 10 },   // Low stock example
      specifications: { noise: 'loud', type: 'string', duration: '30 sec', weight: '500g' },
      safetyInfo: { ageRestriction: 18, hazardLevel: 'high' },
      tags: ['ladi', 'chain', '1000'],
      isFeatured: false,
      totalSold: 450,
      createdBy: admin._id,
    },
    {
      name: 'Sky King Rocket',
      description: 'High-altitude rocket with whistling and color burst.',
      category: cats[5]._id,
      brand: 'Sony',
      price: { basePrice: 380 },
      stock: { quantity: 150, unit: 'box', lowStockAlert: 15 },
      specifications: { noise: 'loud', type: 'rocket', height: '100ft', duration: '5 sec', weight: '400g' },
      safetyInfo: { ageRestriction: 18, hazardLevel: 'high', safetyTips: ['Use launch tube', 'Stand 15m away'] },
      tags: ['rocket', 'sky', 'whistling'],
      isFeatured: true,
      totalSold: 680,
      createdBy: admin._id,
    },
    {
      name: 'Diwali Family Gift Box',
      description: 'Assorted crackers box with 20 different items. Perfect family pack.',
      category: cats[6]._id,  // Gift Boxes — has ₹200 off offer
      brand: 'GB Fireworks',
      price: { basePrice: 1999 },
      stock: { quantity: 75, unit: 'box', lowStockAlert: 10 },
      specifications: { noise: 'medium', weight: '5kg' },
      safetyInfo: { ageRestriction: 18, hazardLevel: 'medium' },
      tags: ['gift box', 'family', 'assorted', 'diwali'],
      isFeatured: true,
      totalSold: 200,
      createdBy: admin._id,
    },
    {
      name: 'Green Diya (Eco Sparkler)',
      description: 'Eco-friendly, low-smoke, low-noise sparkler. Safe for kids.',
      category: cats[7]._id,
      brand: 'Green Diwali',
      price: { basePrice: 160 },
      stock: { quantity: null, unit: 'pack', lowStockAlert: 40 },  // unlimited
      specifications: { noise: 'silent', type: 'eco-sparkler', duration: '40 sec', weight: '200g' },
      safetyInfo: { ageRestriction: 5, hazardLevel: 'low' },
      tags: ['eco', 'green', 'silent', 'safe', 'kids'],
      isFeatured: true,
      totalSold: 600,
      createdBy: admin._id,
    },
  ]);
  console.log('✅ Products seeded (2 unlimited stock, 1 low stock, 2 with category offers)');

  // ── CUSTOMERS ────────────────────────────────────────────────
  const customers = await Customer.insertMany([
    {
      name: 'Arjun Krishnamurthy',
      email: 'arjun@gmail.com',
      phone: '9500012345',
      password: 'Cust@123',
      gender: 'male',
      loyaltyPoints: 350,
      totalOrders: 5,
      totalSpent: 3500,
      isVerified: true,
      tags: ['vip', 'regular'],
      addresses: [{
        label: 'Home', street: '12, Anna Nagar',
        city: 'Chennai', state: 'Tamil Nadu',
        pincode: '600040', isDefault: true,
      }],
    },
    {
      name: 'Meena Suresh',
      email: 'meena.suresh@gmail.com',
      phone: '9500012346',
      password: 'Cust@123',
      gender: 'female',
      loyaltyPoints: 120,
      totalOrders: 2,
      totalSpent: 1200,
      isVerified: true,
      tags: ['regular'],
      addresses: [{
        label: 'Home', street: '5, T Nagar',
        city: 'Chennai', state: 'Tamil Nadu',
        pincode: '600017', isDefault: true,
      }],
    },
    {
      name: 'Ravi Kumar',
      email: 'ravikumar@yahoo.com',
      phone: '9500012347',
      password: 'Cust@123',
      gender: 'male',
      loyaltyPoints: 800,
      totalOrders: 12,
      totalSpent: 8500,
      isVerified: true,
      tags: ['vip', 'wholesale'],
      notes: 'Wholesale buyer — bulk orders every Diwali season',
      addresses: [{
        label: 'Shop', street: '8, Sowcarpet',
        city: 'Chennai', state: 'Tamil Nadu',
        pincode: '600079', isDefault: true,
      }],
    },
    {
      name: 'Kavitha Anand',
      phone: '9500012348',
      password: 'Cust@123',
      gender: 'female',
      loyaltyPoints: 0,
      totalOrders: 0,
      totalSpent: 0,
      isVerified: false,
      tags: ['new'],
    },
  ]);
  console.log('✅ Customers seeded');

  // ── COUPONS ──────────────────────────────────────────────────
  await Coupon.insertMany([
    {
      code: 'DIWALI25',
      description: '25% off on orders above ₹500',
      discountType: 'percentage',
      discountValue: 25,
      minOrderAmount: 500,
      maxDiscount: 500,
      usageLimit: { total: 200, perCustomer: 2 },
      validFrom: new Date('2024-10-01'),
      validUntil: new Date('2026-12-31'),
      createdBy: admin._id,
    },
    {
      code: 'FLAT100',
      description: 'Flat ₹100 off on orders above ₹800',
      discountType: 'fixed',
      discountValue: 100,
      minOrderAmount: 800,
      usageLimit: { total: 100, perCustomer: 1 },
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
      createdBy: admin._id,
    },
    {
      code: 'NEWUSER50',
      description: '50% off for new customers (max ₹200)',
      discountType: 'percentage',
      discountValue: 50,
      minOrderAmount: 200,
      maxDiscount: 200,
      usageLimit: { total: null, perCustomer: 1 },
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
      createdBy: admin._id,
    },
  ]);
  console.log('✅ Coupons seeded');

  // ── SAMPLE ORDERS ────────────────────────────────────────────
  const order1 = new Order({
    customer: customers[0]._id,
    customerSnapshot: { name: customers[0].name, email: customers[0].email, phone: customers[0].phone },
    items: [
      {
        product: products[0]._id,
        productName: products[0].name,
        productSku: products[0].sku,
        quantity: 3,
        unit: 'pack',
        mrp: 120,           // was basePrice
        sellingPrice: 120,  // was unitPrice
        subtotal: 360,
      },
      {
        product: products[2]._id,
        productName: products[2].name,
        productSku: products[2].sku,
        quantity: 5,
        unit: 'box',
        mrp: 65,            // was basePrice
        sellingPrice: 65,   // was unitPrice
        subtotal: 325,
      },
    ],
    shippingAddress: customers[0].addresses[0],
    pricing: {
      subtotal: 685, couponDiscount: 0,
      shippingCharge: 50, tax: 34, totalAmount: 769,
    },
    payment: { method: 'upi', status: 'paid', transactionId: 'UPI202412001', paidAt: new Date() },
    status: 'delivered',
    statusHistory: [
      { status: 'pending', note: 'Order placed', updatedBy: admin._id },
      { status: 'confirmed', note: 'Payment verified', updatedBy: admin._id },
      { status: 'delivered', note: 'Delivered to customer', updatedBy: staff1._id },
    ],
    deliveryDate: { expected: new Date(), actual: new Date() },
    createdBy: admin._id,
  });
  await order1.save();

  const order2 = new Order({
    customer: customers[2]._id,
    customerSnapshot: { name: customers[2].name, email: customers[2].email, phone: customers[2].phone },
    items: [
      {
        product: products[7]._id,
        productName: products[7].name,
        productSku: products[7].sku,
        quantity: 2,
        unit: 'box',
        mrp: 1999,           // was basePrice
        sellingPrice: 1799,  // was unitPrice — ₹200 off
        offerLabel: 'Festival Pack',
        subtotal: 3598,
      },
      {
        product: products[3]._id,
        productName: products[3].name,
        productSku: products[3].sku,
        quantity: 3,
        unit: 'piece',
        mrp: 650,           // was basePrice
        sellingPrice: 585,  // was unitPrice — 10% off
        offerLabel: 'Diwali Offer',
        subtotal: 1755,
      },
    ],
    shippingAddress: customers[2].addresses[0],
    pricing: {
      subtotal: 5353, couponDiscount: 500,
      shippingCharge: 0, tax: 268, totalAmount: 5121,
    },
    couponCode: 'DIWALI25',
    payment: { method: 'card', status: 'paid', transactionId: 'CARD202412002', paidAt: new Date() },
    status: 'processing',
    statusHistory: [
      { status: 'pending', note: 'Order placed', updatedBy: admin._id },
      { status: 'confirmed', note: 'Confirmed', updatedBy: admin._id },
      { status: 'processing', note: 'Being packed', updatedBy: staff2._id },
    ],
    createdBy: admin._id,
  });
  await order2.save();

  // Log sample activities for staff
  await staff1.logActivity({ action: 'order_status_delivered', module: 'orders', targetId: order1._id, targetName: order1.orderNumber, note: 'Delivered to customer' });
  await staff2.logActivity({ action: 'order_status_processing', module: 'orders', targetId: order2._id, targetName: order2.orderNumber, note: 'Being packed' });
  await staff1.logActivity({ action: 'viewed_order', module: 'orders', targetId: order1._id, targetName: order1.orderNumber });
  await staff1.logActivity({ action: 'viewed_customer', module: 'customers', targetId: customers[0]._id, targetName: customers[0].name });

  console.log('✅ Orders seeded + sample activity logs added');

  // ── Summary ──────────────────────────────────────────────────
  console.log(`
╔═══════════════════════════════════════════════╗
║        🎆 GB FIREWORKS — SEED COMPLETE        ║
╠═══════════════════════════════════════════════╣
║  ADMIN LOGIN                                  ║
║  Email    : admin@gbfireworks.com             ║
║  Password : Admin@123                         ║
╠═══════════════════════════════════════════════╣
║  STAFF LOGINS                                 ║
║  karthik@gbfireworks.com  /  Staff@123        ║
║  deepa@gbfireworks.com    /  Staff@123        ║
╠═══════════════════════════════════════════════╣
║  CUSTOMER PHONES (Password: Cust@123)         ║
║  9500012345 · 9500012346 · 9500012347         ║
╠═══════════════════════════════════════════════╣
║  COUPON CODES                                 ║
║  DIWALI25  ·  FLAT100  ·  NEWUSER50           ║
╚═══════════════════════════════════════════════╝
`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed error:', err.message);
  process.exit(1);
});