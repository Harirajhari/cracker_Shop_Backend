# 🎆 Cracker Shop Backend API

Complete Node.js + Express + MongoDB backend for a cracker/fireworks shop.

---

## ⚙️ Setup & Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and configure
cp .env.example .env
# Edit .env with your MongoDB URI

# 3. Seed sample data
npm run seed

# 4. Start server
npm run dev        # Development (nodemon)
npm start          # Production
```

---

## 🗄️ Project Structure

```
cracker-shop-backend/
├── server.js                  # Entry point
├── config/
│   └── db.js                  # MongoDB connection
├── models/
│   ├── Admin.js               # Admin/Staff with roles & permissions
│   ├── Customer.js            # Customer with addresses & loyalty
│   ├── Category.js            # Product categories
│   ├── Product.js             # Cracker products with stock
│   ├── Order.js               # Orders with status history
│   └── Coupon.js              # Discount coupons
├── controllers/
│   ├── adminController.js     # Admin CRUD + auth
│   ├── productController.js   # Product CRUD + stock
│   ├── customerController.js  # Customer CRUD + auth
│   ├── orderController.js     # Order management
│   ├── categoryController.js  # Category CRUD
│   ├── couponController.js    # Coupon management
│   └── dashboardController.js # Reports & analytics
├── middleware/
│   └── auth.js                # JWT + role + permission middleware
├── routes/
│   └── index.js               # All routes
└── seeders/
    └── seed.js                # Sample data seeder
```

---

## 👥 Roles & Permissions

| Permission     | super_admin | admin | manager | staff |
|---------------|-------------|-------|---------|-------|
| Create Product | ✅ | ✅ | ✅ | ❌ |
| Edit Product   | ✅ | ✅ | ✅ | ❌ |
| Delete Product | ✅ | ✅ | ❌ | ❌ |
| View Orders    | ✅ | ✅ | ✅ | ✅ |
| Update Orders  | ✅ | ✅ | ✅ | ✅ |
| Delete Orders  | ✅ | ✅ | ❌ | ❌ |
| View Customers | ✅ | ✅ | ✅ | ✅ |
| Edit Customers | ✅ | ✅ | ❌ | ❌ |
| View Reports   | ✅ | ✅ | ✅ | ❌ |
| Manage Admins  | ✅ | ✅ | ❌ | ❌ |
| Delete Admins  | ✅ | ❌ | ❌ | ❌ |

---

## 🔗 API Endpoints

### AUTH
```
POST   /api/admin/auth/login          → Admin login
GET    /api/admin/auth/me             → Get current admin
POST   /api/customer/auth/register    → Customer register
POST   /api/customer/auth/login       → Customer login
```

### ADMIN MANAGEMENT
```
POST   /api/admin/admins             → Create admin
GET    /api/admin/admins             → List all admins
GET    /api/admin/admins/:id         → Get admin
PUT    /api/admin/admins/:id         → Update admin
DELETE /api/admin/admins/:id         → Soft delete admin
```

### CATEGORIES
```
POST   /api/admin/categories         → Create category
GET    /api/admin/categories         → List categories (admin)
PUT    /api/admin/categories/:id     → Update category
DELETE /api/admin/categories/:id     → Soft delete category
GET    /api/categories               → List categories (public)
```

### PRODUCTS (CRACKERS)
```
POST   /api/admin/products                → Create product
GET    /api/admin/products                → List products (with filters)
GET    /api/admin/products/:id            → Get product
PUT    /api/admin/products/:id            → Update product
DELETE /api/admin/products/:id            → Soft delete product
PATCH  /api/admin/products/:id/restore    → Restore deleted product
PATCH  /api/admin/products/:id/stock      → Update stock
GET    /api/products                      → Public product listing
GET    /api/products/:id                  → Public product detail
```

### CUSTOMERS
```
GET    /api/admin/customers              → List customers
GET    /api/admin/customers/:id          → Get customer + recent orders
PUT    /api/admin/customers/:id          → Update customer
DELETE /api/admin/customers/:id          → Soft delete customer
GET    /api/admin/customers/:id/orders   → Full purchase history
```

### ORDERS
```
POST   /api/admin/orders                 → Create order (for customer)
GET    /api/admin/orders                 → List orders (with filters)
GET    /api/admin/orders/:id             → Get order details
PATCH  /api/admin/orders/:id/status      → Update order status
PATCH  /api/admin/orders/:id/payment     → Update payment status
DELETE /api/admin/orders/:id             → Soft delete order
POST   /api/customer/orders              → Customer places order
GET    /api/customer/orders              → Customer order history
```

### COUPONS
```
POST   /api/admin/coupons               → Create coupon
GET    /api/admin/coupons               → List coupons
PUT    /api/admin/coupons/:id           → Update coupon
DELETE /api/admin/coupons/:id           → Delete coupon
POST   /api/customer/coupons/validate   → Validate coupon
```

### DASHBOARD & REPORTS
```
GET    /api/admin/dashboard             → Stats overview
GET    /api/admin/reports/sales         → Sales report (daily/monthly)
GET    /api/admin/reports/top-products  → Top selling products
```

---

## 📦 Query Parameters

### Products Filters
```
?search=sparkler&category=ID&brand=Standard
&minPrice=100&maxPrice=1000
&isFeatured=true&isActive=true&inStock=true
&sortBy=price.sellingPrice&sortOrder=asc
&page=1&limit=20
```

### Orders Filters
```
?status=pending&customerId=ID&search=ORD-2412
&fromDate=2024-01-01&toDate=2024-12-31
&paymentMethod=upi&paymentStatus=paid
&page=1&limit=20
```

---

## 🌱 Sample Credentials (after seeding)

| Role        | Email                      | Password   |
|-------------|---------------------------|------------|
| Super Admin | superadmin@crackers.com   | Admin@123  |
| Admin       | admin@crackers.com        | Admin@123  |
| Manager     | manager@crackers.com      | Admin@123  |
| Staff       | staff@crackers.com        | Admin@123  |

| Customer Phone | Password  |
|----------------|-----------|
| 9500012345     | Cust@123  |
| 9500012346     | Cust@123  |
| 9500012347     | Cust@123  |

**Coupon Codes:** `DIWALI25` | `FLAT100` | `NEWUSER50`

---

## 🔐 Authentication

All protected routes require:
```
Authorization: Bearer <token>
```

---

## 🎆 Features Summary

- ✅ Role-based admin system (super_admin, admin, manager, staff)
- ✅ Granular permissions per resource (CRUD)
- ✅ Multiple admin support with creator tracking
- ✅ Soft delete everywhere (isDeleted flag)
- ✅ Product management with stock tracking
- ✅ Customer profiles with purchase history & loyalty points
- ✅ Order management with full status history
- ✅ Payment tracking
- ✅ Coupon/discount system
- ✅ Dashboard with KPIs
- ✅ Sales reports (daily/monthly)
- ✅ Top products report
- ✅ Low stock alerts
- ✅ Public API for storefront
