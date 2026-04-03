const express = require('express');
const router = express.Router();

const { protectAdmin, protectCustomer, checkPermission, requireRole } = require('../middleware/auth');

// Controllers
const adminCtrl      = require('../controllers/adminController');
const productCtrl    = require('../controllers/productController');
const customerCtrl   = require('../controllers/customerController');
const orderCtrl      = require('../controllers/orderController');
const categoryCtrl   = require('../controllers/categoryController');
const couponCtrl     = require('../controllers/couponController');
const dashboardCtrl  = require('../controllers/dashboardController');

// ─────────────────────────────────────────────────────────────
//  ADMIN AUTH
// ─────────────────────────────────────────────────────────────
router.post('/admin/auth/login', adminCtrl.login);
router.get('/admin/auth/me', protectAdmin, adminCtrl.getMe);

// ─────────────────────────────────────────────────────────────
//  ADMIN MANAGEMENT (super_admin only for most)
// ─────────────────────────────────────────────────────────────
router.post('/admin/admins',    protectAdmin, checkPermission('admins','create'), adminCtrl.createAdmin);
router.get('/admin/admins',     protectAdmin, checkPermission('admins','read'),   adminCtrl.getAllAdmins);
router.get('/admin/admins/:id', protectAdmin, checkPermission('admins','read'),   adminCtrl.getAdmin);
router.put('/admin/admins/:id', protectAdmin, checkPermission('admins','update'), adminCtrl.updateAdmin);
router.delete('/admin/admins/:id', protectAdmin, requireRole('super_admin'),      adminCtrl.deleteAdmin);

// ─────────────────────────────────────────────────────────────
//  DASHBOARD & REPORTS
// ─────────────────────────────────────────────────────────────
router.get('/admin/dashboard',          protectAdmin, dashboardCtrl.getDashboard);
router.get('/admin/reports/sales',      protectAdmin, checkPermission('reports','read'), dashboardCtrl.getSalesReport);
router.get('/admin/reports/top-products', protectAdmin, checkPermission('reports','read'), dashboardCtrl.getTopProducts);

// ─────────────────────────────────────────────────────────────
//  CATEGORIES
// ─────────────────────────────────────────────────────────────
router.post('/admin/categories',    protectAdmin, checkPermission('products','create'), categoryCtrl.createCategory);
router.get('/admin/categories',     protectAdmin, categoryCtrl.getAllCategories);
router.put('/admin/categories/:id', protectAdmin, checkPermission('products','update'), categoryCtrl.updateCategory);
router.delete('/admin/categories/:id', protectAdmin, checkPermission('products','delete'), categoryCtrl.deleteCategory);
// Public
router.get('/categories', categoryCtrl.getAllCategories);

// ─────────────────────────────────────────────────────────────
//  PRODUCTS (CRACKERS)
// ─────────────────────────────────────────────────────────────
router.post('/admin/products',              protectAdmin, checkPermission('products','create'), productCtrl.createProduct);
router.get('/admin/products',               protectAdmin, productCtrl.getAllProducts);
router.get('/admin/products/:id',           protectAdmin, productCtrl.getProduct);
router.put('/admin/products/:id',           protectAdmin, checkPermission('products','update'), productCtrl.updateProduct);
router.delete('/admin/products/:id',        protectAdmin, checkPermission('products','delete'), productCtrl.deleteProduct);
router.patch('/admin/products/:id/restore', protectAdmin, requireRole('super_admin','admin'),  productCtrl.restoreProduct);
router.patch('/admin/products/:id/stock',   protectAdmin, checkPermission('products','update'), productCtrl.updateStock);
// Public
router.get('/products',     productCtrl.getAllProducts);
router.get('/products/:id', productCtrl.getProduct);

// ─────────────────────────────────────────────────────────────
//  CUSTOMERS
// ─────────────────────────────────────────────────────────────
router.post('/customer/auth/register', customerCtrl.register);
router.post('/customer/auth/login',    customerCtrl.login);

router.get('/admin/customers',                protectAdmin, checkPermission('customers','read'),   customerCtrl.getAllCustomers);
router.get('/admin/customers/:id',            protectAdmin, checkPermission('customers','read'),   customerCtrl.getCustomer);
router.put('/admin/customers/:id',            protectAdmin, checkPermission('customers','update'), customerCtrl.updateCustomer);
router.delete('/admin/customers/:id',         protectAdmin, checkPermission('customers','delete'), customerCtrl.deleteCustomer);
router.get('/admin/customers/:id/orders',     protectAdmin, checkPermission('customers','read'),   customerCtrl.getCustomerOrders);

// ─────────────────────────────────────────────────────────────
//  ORDERS
// ─────────────────────────────────────────────────────────────
router.post('/admin/orders',              protectAdmin, checkPermission('orders','create'), orderCtrl.createOrder);
router.get('/admin/orders',               protectAdmin, checkPermission('orders','read'),   orderCtrl.getAllOrders);
router.get('/admin/orders/:id',           protectAdmin, checkPermission('orders','read'),   orderCtrl.getOrder);
router.patch('/admin/orders/:id/status',  protectAdmin, checkPermission('orders','update'), orderCtrl.updateOrderStatus);
router.patch('/admin/orders/:id/payment', protectAdmin, checkPermission('orders','update'), orderCtrl.updatePaymentStatus);
router.delete('/admin/orders/:id',        protectAdmin, checkPermission('orders','delete'), orderCtrl.deleteOrder);
// Customer orders
router.post('/customer/orders', orderCtrl.createOrder);
router.get('/customer/orders',     protectCustomer, orderCtrl.getAllOrders);
router.get('/customer/orders/:id', protectCustomer, orderCtrl.getOrder);

// ─────────────────────────────────────────────────────────────
//  COUPONS
// ─────────────────────────────────────────────────────────────
router.post('/admin/coupons',    protectAdmin, requireRole('super_admin','admin','manager'), couponCtrl.createCoupon);
router.get('/admin/coupons',     protectAdmin, couponCtrl.getAllCoupons);
router.put('/admin/coupons/:id', protectAdmin, requireRole('super_admin','admin','manager'), couponCtrl.updateCoupon);
router.delete('/admin/coupons/:id', protectAdmin, requireRole('super_admin','admin'),        couponCtrl.deleteCoupon);
router.post('/customer/coupons/validate', protectCustomer, couponCtrl.validateCoupon);

module.exports = router;
