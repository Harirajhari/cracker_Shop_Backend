require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cracker_shop';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'cracker_shop_super_secret_key_2024';

const mongoose = require('mongoose');
const Admin    = require('../models/Admin');
const Customer = require('../models/Customer');
const Category = require('../models/Category');
const Product  = require('../models/Product');
const Order    = require('../models/Order');
const Coupon   = require('../models/Coupon');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB...');

  // Clear existing data
  await Promise.all([
    Admin.deleteMany(), Customer.deleteMany(), Category.deleteMany(),
    Product.deleteMany(), Order.deleteMany(), Coupon.deleteMany()
  ]);
  console.log('Cleared existing data...');

  // ── ADMINS ──────────────────────────────────────────────────
  const superAdmin = new Admin({
    name: 'Raja Murugan',
    email: 'superadmin@crackers.com',
    password: 'Admin@123',
    phone: '9876543210',
    role: 'super_admin',
  });
  superAdmin.setRolePermissions();
  await superAdmin.save();

  const admin1 = new Admin({
    name: 'Priya Lakshmi',
    email: 'admin@crackers.com',
    password: 'Admin@123',
    phone: '9876543211',
    role: 'admin',
    createdBy: superAdmin._id,
  });
  admin1.setRolePermissions();
  await admin1.save();

  const manager1 = new Admin({
    name: 'Karthik Selvam',
    email: 'manager@crackers.com',
    password: 'Admin@123',
    phone: '9876543212',
    role: 'manager',
    createdBy: superAdmin._id,
  });
  manager1.setRolePermissions();
  await manager1.save();

  const staff1 = new Admin({
    name: 'Deepa Natarajan',
    email: 'staff@crackers.com',
    password: 'Admin@123',
    phone: '9876543213',
    role: 'staff',
    createdBy: admin1._id,
  });
  staff1.setRolePermissions();
  await staff1.save();

  console.log('✅ Admins seeded');

  // ── CATEGORIES ───────────────────────────────────────────────
  const categories = await Category.insertMany([
    { name: 'Sparklers',      description: 'Hand-held sparklers for all ages',          sortOrder: 1 },
    { name: 'Ground Chakkar', description: 'Spinning ground crackers',                  sortOrder: 2 },
    { name: 'Aerial Shots',   description: 'High-altitude aerial fireworks',            sortOrder: 3 },
    { name: 'Flower Pots',    description: 'Fountain-style ground fireworks',           sortOrder: 4 },
    { name: 'String Crackers', description: 'Chain of crackers for big noise',          sortOrder: 5 },
    { name: 'Sky Rockets',    description: 'Rockets that shoot into the sky',           sortOrder: 6 },
    { name: 'Gift Boxes',     description: 'Curated assortment gift boxes',             sortOrder: 7 },
    { name: 'Silent Crackers', description: 'Low-noise eco-friendly crackers',          sortOrder: 8 },
  ]);
  console.log('✅ Categories seeded');

  // ── PRODUCTS ─────────────────────────────────────────────────
  const products = await Product.insertMany([
    {
      name: 'Gold Sparkler 25cm',
      description: 'Premium gold sparkler, burns for 45 seconds. Perfect for celebrations.',
      category: categories[0]._id,  // Sparklers
      brand: 'Standard',
      price: { mrp: 150, sellingPrice: 120, costPrice: 60 },
      stock: { quantity: 500, unit: 'pack', minOrderQty: 1, maxOrderQty: 50, lowStockAlert: 50 },
      specifications: { weight: '250g', noise: 'silent', type: 'sparkler', duration: '45 sec', color: 'Gold' },
      safetyInfo: { ageRestriction: 5, hazardLevel: 'low', safetyTips: ['Hold away from face', 'Do not point at others'] },
      tags: ['sparkler', 'gold', 'diwali'],
      isFeatured: true,
      isActive: true,
      totalSold: 1200,
      createdBy: admin1._id,
    },
    {
      name: 'Silver Sparkler 50cm',
      description: 'Long silver sparkler with 60-second burn time.',
      category: categories[0]._id,
      brand: 'Standard',
      price: { mrp: 200, sellingPrice: 170, costPrice: 85 },
      stock: { quantity: 300, unit: 'pack', minOrderQty: 1, maxOrderQty: 50, lowStockAlert: 30 },
      specifications: { weight: '400g', noise: 'silent', type: 'sparkler', duration: '60 sec', color: 'Silver' },
      safetyInfo: { ageRestriction: 5, hazardLevel: 'low' },
      tags: ['sparkler', 'silver', 'long'],
      isFeatured: false,
      isActive: true,
      totalSold: 800,
      createdBy: admin1._id,
    },
    {
      name: 'Chakkar No. 6',
      description: 'Classic ground spinner with rainbow colors.',
      category: categories[1]._id, // Ground Chakkar
      brand: 'Cock Brand',
      price: { mrp: 80, sellingPrice: 65, costPrice: 30 },
      stock: { quantity: 1000, unit: 'box', minOrderQty: 1, maxOrderQty: 200, lowStockAlert: 100 },
      specifications: { weight: '100g', noise: 'medium', type: 'ground', duration: '20 sec', color: 'Multicolor' },
      safetyInfo: { ageRestriction: 12, hazardLevel: 'medium', safetyTips: ['Place on flat surface', 'Keep 3m distance'] },
      tags: ['chakkar', 'ground', 'colorful'],
      isFeatured: true,
      isActive: true,
      totalSold: 2500,
      createdBy: admin1._id,
    },
    {
      name: 'Multi Shot 25 Shots',
      description: 'Powerful 25-shot aerial display with multicolor stars.',
      category: categories[2]._id, // Aerial Shots
      brand: 'Sony',
      price: { mrp: 800, sellingPrice: 650, costPrice: 350 },
      stock: { quantity: 200, unit: 'piece', minOrderQty: 1, maxOrderQty: 20, lowStockAlert: 20 },
      specifications: { weight: '2kg', noise: 'loud', type: 'aerial', duration: '45 sec', height: '50ft' },
      safetyInfo: { ageRestriction: 18, hazardLevel: 'high', safetyTips: ['Adults only', 'Keep 10m distance', 'Never relight'] },
      tags: ['aerial', 'multishot', 'premium'],
      isFeatured: true,
      isActive: true,
      totalSold: 350,
      createdBy: admin1._id,
    },
    {
      name: 'Flower Pot No. 4',
      description: 'Beautiful fountain-style cracker with golden sparks.',
      category: categories[3]._id,
      brand: 'Cock Brand',
      price: { mrp: 120, sellingPrice: 95, costPrice: 45 },
      stock: { quantity: 600, unit: 'piece', minOrderQty: 1, maxOrderQty: 100, lowStockAlert: 60 },
      specifications: { weight: '300g', noise: 'low', type: 'fountain', duration: '30 sec' },
      safetyInfo: { ageRestriction: 12, hazardLevel: 'medium' },
      tags: ['flower pot', 'fountain', 'golden'],
      isFeatured: false,
      isActive: true,
      totalSold: 900,
      createdBy: admin1._id,
    },
    {
      name: '1000 Wala Ladi',
      description: '1000 cracker chain - perfect for big celebrations.',
      category: categories[4]._id, // String
      brand: 'Standard',
      price: { mrp: 250, sellingPrice: 210, costPrice: 100 },
      stock: { quantity: 8, unit: 'roll', minOrderQty: 1, maxOrderQty: 10, lowStockAlert: 10 }, // Low stock!
      specifications: { weight: '500g', noise: 'loud', type: 'string', duration: '30 sec' },
      safetyInfo: { ageRestriction: 18, hazardLevel: 'high' },
      tags: ['ladi', 'chain', '1000'],
      isFeatured: false,
      isActive: true,
      totalSold: 450,
      createdBy: admin1._id,
    },
    {
      name: 'Sky King Rocket',
      description: 'High-altitude rocket with whistling and color burst.',
      category: categories[5]._id,
      brand: 'Sony',
      price: { mrp: 450, sellingPrice: 380, costPrice: 180 },
      stock: { quantity: 150, unit: 'box', minOrderQty: 1, maxOrderQty: 30, lowStockAlert: 15 },
      specifications: { weight: '400g', noise: 'loud', type: 'rocket', height: '100ft', duration: '5 sec' },
      safetyInfo: { ageRestriction: 18, hazardLevel: 'high', safetyTips: ['Use launch tube', 'Stand 15m away'] },
      tags: ['rocket', 'sky', 'whistling'],
      isFeatured: true,
      isActive: true,
      totalSold: 680,
      createdBy: admin1._id,
    },
    {
      name: 'Diwali Family Gift Box',
      description: 'Assorted crackers box with 20 different items. Perfect family pack.',
      category: categories[6]._id,
      brand: 'Mixed',
      price: { mrp: 2500, sellingPrice: 1999, costPrice: 1200 },
      stock: { quantity: 75, unit: 'box', minOrderQty: 1, maxOrderQty: 10, lowStockAlert: 10 },
      specifications: { weight: '5kg', noise: 'medium' },
      safetyInfo: { ageRestriction: 18, hazardLevel: 'medium' },
      tags: ['gift box', 'family', 'assorted', 'diwali'],
      isFeatured: true,
      isActive: true,
      totalSold: 200,
      createdBy: admin1._id,
    },
    {
      name: 'Green Diya (Eco Sparkler)',
      description: 'Eco-friendly, low-smoke, low-noise sparkler. Safe for kids.',
      category: categories[7]._id,
      brand: 'Green Diwali',
      price: { mrp: 180, sellingPrice: 160, costPrice: 80 },
      stock: { quantity: 400, unit: 'pack', minOrderQty: 1, maxOrderQty: 50, lowStockAlert: 40 },
      specifications: { weight: '200g', noise: 'silent', type: 'eco-sparkler', duration: '40 sec' },
      safetyInfo: { ageRestriction: 5, hazardLevel: 'low' },
      tags: ['eco', 'green', 'silent', 'safe', 'kids'],
      isFeatured: true,
      isActive: true,
      totalSold: 600,
      createdBy: admin1._id,
    },
  ]);
  console.log('✅ Products seeded');

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
        label: 'Home', street: '12, Anna Nagar', city: 'Chennai',
        state: 'Tamil Nadu', pincode: '600040', isDefault: true
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
        label: 'Home', street: '5, T Nagar', city: 'Chennai',
        state: 'Tamil Nadu', pincode: '600017', isDefault: true
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
      notes: 'Wholesale buyer - gives bulk orders every Diwali season',
      addresses: [{
        label: 'Shop', street: '8, Sowcarpet', city: 'Chennai',
        state: 'Tamil Nadu', pincode: '600079', isDefault: true
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
      createdBy: superAdmin._id,
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
      createdBy: admin1._id,
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
      createdBy: superAdmin._id,
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
        productSku: 'CRK-SPARK1',
        quantity: 3,
        unit: 'pack',
        mrp: 150,
        sellingPrice: 120,
        discount: 20,
        subtotal: 360,
      },
      {
        product: products[2]._id,
        productName: products[2].name,
        productSku: 'CRK-CHKR1',
        quantity: 5,
        unit: 'box',
        mrp: 80,
        sellingPrice: 65,
        discount: 19,
        subtotal: 325,
      },
    ],
    shippingAddress: customers[0].addresses[0],
    pricing: { subtotal: 685, discount: 0, couponDiscount: 0, shippingCharge: 50, tax: 34, totalAmount: 769 },
    payment: { method: 'upi', status: 'paid', transactionId: 'UPI202412001', paidAt: new Date() },
    status: 'delivered',
    statusHistory: [
      { status: 'pending', note: 'Order placed', updatedBy: admin1._id },
      { status: 'confirmed', note: 'Payment verified', updatedBy: admin1._id },
      { status: 'delivered', note: 'Delivered to customer', updatedBy: staff1._id },
    ],
    deliveryDate: { expected: new Date(), actual: new Date() },
    createdBy: admin1._id,
  });
  await order1.save();

  const order2 = new Order({
    customer: customers[2]._id,
    customerSnapshot: { name: customers[2].name, email: customers[2].email, phone: customers[2].phone },
    items: [
      {
        product: products[7]._id, // Gift box
        productName: products[7].name,
        productSku: 'CRK-GIFT1',
        quantity: 2,
        unit: 'box',
        mrp: 2500,
        sellingPrice: 1999,
        discount: 20,
        subtotal: 3998,
      },
      {
        product: products[3]._id, // Aerial
        productName: products[3].name,
        productSku: 'CRK-AER1',
        quantity: 3,
        unit: 'piece',
        mrp: 800,
        sellingPrice: 650,
        discount: 19,
        subtotal: 1950,
      },
    ],
    shippingAddress: customers[2].addresses[0],
    pricing: { subtotal: 5948, discount: 0, couponDiscount: 500, shippingCharge: 0, tax: 297, totalAmount: 5745 },
    couponCode: 'DIWALI25',
    payment: { method: 'card', status: 'paid', transactionId: 'CARD202412002', paidAt: new Date() },
    status: 'processing',
    statusHistory: [
      { status: 'pending', note: 'Order placed', updatedBy: admin1._id },
      { status: 'confirmed', note: 'Confirmed', updatedBy: admin1._id },
      { status: 'processing', note: 'Being packed', updatedBy: staff1._id },
    ],
  });
  await order2.save();

  console.log('✅ Orders seeded');

  console.log('\n🎆 DATABASE SEEDED SUCCESSFULLY!\n');
  console.log('═══════════════════════════════════════');
  console.log('  Admin Credentials:');
  console.log('  Super Admin → superadmin@crackers.com / Admin@123');
  console.log('  Admin       → admin@crackers.com      / Admin@123');
  console.log('  Manager     → manager@crackers.com    / Admin@123');
  console.log('  Staff       → staff@crackers.com      / Admin@123');
  console.log('\n  Customer Credentials:');
  console.log('  Phone: 9500012345, 9500012346, 9500012347');
  console.log('  Password: Cust@123');
  console.log('\n  Coupon Codes: DIWALI25 | FLAT100 | NEWUSER50');
  console.log('═══════════════════════════════════════\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
