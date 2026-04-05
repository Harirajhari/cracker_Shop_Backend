require('dotenv').config();
const express = require('express');
const router = express.Router();

const { protectAdmin, protectCustomer, checkPermission, requireRole } = require('../middleware/auth');
const { uploadProductImages, uploadCategoryImage } = require('../middleware/upload');

const adminCtrl     = require('../controllers/adminController');
const productCtrl   = require('../controllers/productController');
const customerCtrl  = require('../controllers/customerController');
const orderCtrl     = require('../controllers/orderController');
const categoryCtrl  = require('../controllers/categoryController');
const couponCtrl    = require('../controllers/couponController');
const dashboardCtrl = require('../controllers/dashboardController');

// ─────────────────────────────────────────────────────────────
//  ADMIN AUTH
// ─────────────────────────────────────────────────────────────
router.post('/admin/auth/login', adminCtrl.login);
router.get('/admin/auth/me',     protectAdmin, adminCtrl.getMe);

// ─────────────────────────────────────────────────────────────
//  STAFF MANAGEMENT (admin role only)
// ─────────────────────────────────────────────────────────────
router.post('/admin/admins',             protectAdmin, requireRole('admin'), adminCtrl.createAdmin);
router.get('/admin/admins',              protectAdmin, requireRole('admin'), adminCtrl.getAllAdmins);
router.get('/admin/admins/:id',          protectAdmin, requireRole('admin'), adminCtrl.getAdmin);
router.put('/admin/admins/:id',          protectAdmin, requireRole('admin'), adminCtrl.updateAdmin);
router.delete('/admin/admins/:id',       protectAdmin, requireRole('admin'), adminCtrl.deleteAdmin);
router.get('/admin/admins/:id/activity', protectAdmin, requireRole('admin'), adminCtrl.getAdminActivity);

// ─────────────────────────────────────────────────────────────
//  DASHBOARD & REPORTS
// ─────────────────────────────────────────────────────────────
router.get('/admin/dashboard',            protectAdmin, dashboardCtrl.getDashboard);
router.get('/admin/reports/sales',        protectAdmin, requireRole('admin'), dashboardCtrl.getSalesReport);
router.get('/admin/reports/top-products', protectAdmin, requireRole('admin'), dashboardCtrl.getTopProducts);

// ─────────────────────────────────────────────────────────────
//  CATEGORIES
// ─────────────────────────────────────────────────────────────
router.get('/admin/categories',             protectAdmin, categoryCtrl.getAllCategories);
router.get('/admin/categories/:id',         categoryCtrl.getCategoryById);
router.post('/admin/categories',            protectAdmin, requireRole('admin'), uploadCategoryImage, categoryCtrl.createCategory);
router.put('/admin/categories/:id',         protectAdmin, requireRole('admin'), uploadCategoryImage, categoryCtrl.updateCategory);
router.patch('/admin/categories/:id/offer', protectAdmin, requireRole('admin'), categoryCtrl.updateCategoryOffer);
router.delete('/admin/categories/:id',      protectAdmin, requireRole('admin'), categoryCtrl.deleteCategory);
router.get('/categories', categoryCtrl.getAllCategories);

// ─────────────────────────────────────────────────────────────
//  PRODUCTS
// ─────────────────────────────────────────────────────────────
router.post('/admin/products',              protectAdmin, requireRole('admin'),               uploadProductImages, productCtrl.createProduct);
router.get('/admin/products',               protectAdmin, productCtrl.getAllProducts);
router.get('/admin/products/:id',           protectAdmin, productCtrl.getProduct);
router.put('/admin/products/:id',           protectAdmin, requireRole('admin'),               uploadProductImages, productCtrl.updateProduct);
router.delete('/admin/products/:id',        protectAdmin, requireRole('admin'),               productCtrl.deleteProduct);
router.patch('/admin/products/:id/restore', protectAdmin, requireRole('admin'),               productCtrl.restoreProduct);
router.patch('/admin/products/:id/stock',   protectAdmin, checkPermission('products','update'), productCtrl.updateStock);
router.get('/products',     productCtrl.getAllProducts);
router.get('/products/:id', productCtrl.getProduct);

// ─────────────────────────────────────────────────────────────
//  CUSTOMERS
// ─────────────────────────────────────────────────────────────
router.post('/customer/auth/register', customerCtrl.register);
router.post('/customer/auth/login',    customerCtrl.login);

router.get('/admin/customers',            protectAdmin, checkPermission('customers','read'),  customerCtrl.getAllCustomers);
router.get('/admin/customers/:id',        protectAdmin, checkPermission('customers','read'),  customerCtrl.getCustomer);
router.put('/admin/customers/:id',        protectAdmin, requireRole('admin'),                 customerCtrl.updateCustomer);
router.delete('/admin/customers/:id',     protectAdmin, requireRole('admin'),                 customerCtrl.deleteCustomer);
router.get('/admin/customers/:id/orders', protectAdmin, checkPermission('customers','read'),  customerCtrl.getCustomerOrders);

// ─────────────────────────────────────────────────────────────
//  ORDERS
// ─────────────────────────────────────────────────────────────
router.post('/admin/orders',              protectAdmin, requireRole('admin'),               orderCtrl.createOrder);
router.get('/admin/orders',               protectAdmin, checkPermission('orders','read'),   orderCtrl.getAllOrders);
router.get('/admin/orders/:id',           protectAdmin, checkPermission('orders','read'),   orderCtrl.getOrder);
router.patch('/admin/orders/:id/status',  protectAdmin, checkPermission('orders','update'), orderCtrl.updateOrderStatus);
router.patch('/admin/orders/:id/payment', protectAdmin, requireRole('admin'),               orderCtrl.updatePaymentStatus);
router.delete('/admin/orders/:id',        protectAdmin, requireRole('admin'),               orderCtrl.deleteOrder);
router.post('/customer/orders',    orderCtrl.createOrder);
router.get('/customer/orders',     protectCustomer, orderCtrl.getAllOrders);
router.get('/customer/orders/:id', protectCustomer, orderCtrl.getOrder);

// ─────────────────────────────────────────────────────────────
//  COUPONS (admin only)
// ─────────────────────────────────────────────────────────────
router.post('/admin/coupons',             protectAdmin, requireRole('admin'), couponCtrl.createCoupon);
router.get('/admin/coupons',              protectAdmin, couponCtrl.getAllCoupons);
router.put('/admin/coupons/:id',          protectAdmin, requireRole('admin'), couponCtrl.updateCoupon);
router.delete('/admin/coupons/:id',       protectAdmin, requireRole('admin'), couponCtrl.deleteCoupon);
router.post('/customer/coupons/validate', protectCustomer, couponCtrl.validateCoupon);

module.exports = router;