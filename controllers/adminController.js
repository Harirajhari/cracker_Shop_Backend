const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

const signToken = (id) =>
  jwt.sign({ id, type: 'admin' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required.' });

    const admin = await Admin.findOne({ email, isDeleted: false }).select('+password');
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (!admin.isActive)
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });

    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = signToken(admin._id);
    admin.password = undefined;
    res.json({ success: true, token, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get me ────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.admin });
};

// ── Create staff (admin only) ─────────────────────────────────────────────────
// POST /api/admin/admins
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Only admins can create accounts; always creates 'staff'
    const newAdmin = new Admin({
      name, email, password, phone,
      role: 'staff',
      createdBy: req.admin._id,
    });
    newAdmin.setRolePermissions();
    await newAdmin.save();

    // Log to creator
    await req.admin.logActivity({
      action: 'created_staff',
      module: 'other',
      targetId: newAdmin._id,
      targetName: newAdmin.name,
    });

    newAdmin.password = undefined;
    res.status(201).json({ success: true, message: 'Staff created successfully.', data: newAdmin });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get all staff (admin only) ────────────────────────────────────────────────
exports.getAllAdmins = async (req, res) => {
  try {
    const { isActive, search, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false, role: 'staff' }; // only show staff list
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const total = await Admin.countDocuments(filter);
    const admins = await Admin.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get single staff + activity ───────────────────────────────────────────────
exports.getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ _id: req.params.id, isDeleted: false, role: 'staff' })
      .select('+activityLog')
      .populate('createdBy', 'name email');
    if (!admin) return res.status(404).json({ success: false, message: 'Staff not found.' });
    res.json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update staff ──────────────────────────────────────────────────────────────
exports.updateAdmin = async (req, res) => {
  try {
    const { name, phone, isActive } = req.body;
    const admin = await Admin.findOne({ _id: req.params.id, isDeleted: false, role: 'staff' });
    if (!admin) return res.status(404).json({ success: false, message: 'Staff not found.' });

    if (name)              admin.name = name;
    if (phone)             admin.phone = phone;
    if (isActive !== undefined) admin.isActive = isActive;

    await admin.save();
    res.json({ success: true, message: 'Staff updated.', data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Delete staff (soft) ───────────────────────────────────────────────────────
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ _id: req.params.id, isDeleted: false, role: 'staff' });
    if (!admin) return res.status(404).json({ success: false, message: 'Staff not found.' });

    admin.isDeleted = true;
    admin.isActive  = false;
    await admin.save();

    await req.admin.logActivity({
      action: 'deleted_staff',
      module: 'other',
      targetId: admin._id,
      targetName: admin.name,
    });

    res.json({ success: true, message: 'Staff deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get staff activity log ────────────────────────────────────────────────────
// GET /api/admin/admins/:id/activity
exports.getAdminActivity = async (req, res) => {
  try {
    const admin = await Admin.findOne({ _id: req.params.id, isDeleted: false, role: 'staff' })
      .select('+activityLog');
    if (!admin) return res.status(404).json({ success: false, message: 'Staff not found.' });
    res.json({ success: true, data: admin.activityLog || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};