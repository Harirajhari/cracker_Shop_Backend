const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// @GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalOrders, todayOrders, monthOrders,
      totalRevenue, todayRevenue, monthRevenue,
      totalProducts, lowStockProducts,
      totalCustomers, newCustomersToday,
      pendingOrders, recentOrders,
      topProducts
    ] = await Promise.all([
      Order.countDocuments({ isDeleted: false }),
      Order.countDocuments({ isDeleted: false, createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ isDeleted: false, createdAt: { $gte: startOfMonth } }),

      Order.aggregate([{ $match: { isDeleted: false, 'payment.status': 'paid' } }, { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }]),
      Order.aggregate([{ $match: { isDeleted: false, 'payment.status': 'paid', createdAt: { $gte: startOfToday } } }, { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }]),
      Order.aggregate([{ $match: { isDeleted: false, 'payment.status': 'paid', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }]),

      Product.countDocuments({ isDeleted: false }),
      Product.countDocuments({ isDeleted: false, $expr: { $lte: ['$stock.quantity', '$stock.lowStockAlert'] } }),

      Customer.countDocuments({ isDeleted: false }),
      Customer.countDocuments({ isDeleted: false, createdAt: { $gte: startOfToday } }),

      Order.countDocuments({ isDeleted: false, status: 'pending' }),

      Order.find({ isDeleted: false })
        .populate('customer', 'name phone')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber status pricing.totalAmount customer createdAt'),

      Product.find({ isDeleted: false })
        .sort({ totalSold: -1 })
        .limit(5)
        .select('name totalSold price.sellingPrice stock.quantity images'),
    ]);

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          today: todayOrders,
          thisMonth: monthOrders,
          pending: pendingOrders,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          today: todayRevenue[0]?.total || 0,
          thisMonth: monthRevenue[0]?.total || 0,
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts,
        },
        customers: {
          total: totalCustomers,
          newToday: newCustomersToday,
        },
        recentOrders,
        topProducts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/reports/sales?period=monthly&year=2024
exports.getSalesReport = async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    const groupBy = period === 'daily'
      ? { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }
      : { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };

    const report = await Order.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } },
      { $group: {
        _id: groupBy,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        totalItems: { $sum: { $sum: '$items.quantity' } },
        paidOrders: { $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, 1, 0] } },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({ success: true, period, year, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/reports/top-products
exports.getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const products = await Product.find({ isDeleted: false })
      .sort({ totalSold: -1 })
      .limit(Number(limit))
      .populate('category', 'name')
      .select('name sku totalSold price stock category images');
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
