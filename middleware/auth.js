const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');

// Protect admin routes
exports.protectAdmin = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized. No token.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || admin.isDeleted || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Admin not found or inactive.' });
    }
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

// Protect customer routes
exports.protectCustomer = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized. No token.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.id);
    if (!customer || customer.isDeleted || !customer.isActive) {
      return res.status(401).json({ success: false, message: 'Customer not found or inactive.' });
    }
    req.customer = customer;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

// Role-based access
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: `Role '${req.admin.role}' is not allowed.` });
    }
    next();
  };
};

// Permission-based access: e.g., checkPermission('products', 'create')
exports.checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (req.admin.role === 'super_admin') return next(); // super_admin bypasses
    const permission = req.admin.permissions?.[resource]?.[action];
    if (!permission) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to ${action} ${resource}.`,
      });
    }
    next();
  };
};
