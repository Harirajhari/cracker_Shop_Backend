const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

const signToken = (id) =>
  jwt.sign({ id, type: 'admin' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// @POST /api/admin/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Login attempt: ${email}`);
    
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

// @GET /api/admin/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.admin });
};

// @POST /api/admin/admins - Create admin (by super_admin or admin)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, role, permissions } = req.body;

    // Only super_admin can create super_admin
    if (role === 'super_admin' && req.admin.role !== 'super_admin')
      return res.status(403).json({ success: false, message: 'Only super_admin can create another super_admin.' });

    const admin = new Admin({ name, email, password, phone, role, createdBy: req.admin._id });
    
    // Set default role permissions, then override if custom permissions provided
    admin.setRolePermissions();
    if (permissions) admin.permissions = permissions;

    await admin.save();
    admin.password = undefined;
    res.status(201).json({ success: true, message: 'Admin created successfully.', data: admin });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/admins
exports.getAllAdmins = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 10, search } = req.query;
    const filter = { isDeleted: false };
    if (role) filter.role = role;
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

// @GET /api/admin/admins/:id
exports.getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ _id: req.params.id, isDeleted: false }).populate('createdBy', 'name email');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });
    res.json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/admin/admins/:id
exports.updateAdmin = async (req, res) => {
  try {
    const { name, phone, role, permissions, isActive } = req.body;
    const admin = await Admin.findOne({ _id: req.params.id, isDeleted: false });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });

    // Only super_admin can change role
    if (role && req.admin.role !== 'super_admin')
      return res.status(403).json({ success: false, message: 'Only super_admin can change roles.' });

    if (name) admin.name = name;
    if (phone) admin.phone = phone;
    if (isActive !== undefined) admin.isActive = isActive;
    if (role) { admin.role = role; admin.setRolePermissions(); }
    if (permissions) admin.permissions = permissions;

    await admin.save();
    res.json({ success: true, message: 'Admin updated.', data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/admin/admins/:id  (soft delete)
exports.deleteAdmin = async (req, res) => {
  try {
    if (req.params.id === req.admin._id.toString())
      return res.status(400).json({ success: false, message: 'Cannot delete yourself.' });

    const admin = await Admin.findOne({ _id: req.params.id, isDeleted: false });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });

    admin.isDeleted = true;
    admin.isActive = false;
    await admin.save();
    res.json({ success: true, message: 'Admin deleted (soft).' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
