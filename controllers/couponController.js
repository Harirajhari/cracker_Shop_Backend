const Coupon = require('../models/Coupon');

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.admin._id });
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndUpdate(req.params.id, { isDeleted: true, isActive: false });
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/customer/coupons/validate
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true, isDeleted: false });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon.' });
    if (new Date() > coupon.validUntil) return res.status(400).json({ success: false, message: 'Coupon expired.' });
    if (orderAmount < coupon.minOrderAmount) return res.status(400).json({ success: false, message: `Min order ₹${coupon.minOrderAmount}` });

    const discount = coupon.discountType === 'percentage'
      ? Math.min((orderAmount * coupon.discountValue) / 100, coupon.maxDiscount || Infinity)
      : coupon.discountValue;

    res.json({ success: true, discount: Math.round(discount), coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
