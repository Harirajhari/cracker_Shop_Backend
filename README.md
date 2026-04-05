# 🎆 GB Fireworks — Admin Backend API

Complete Node.js + Express + MongoDB backend for GB Fireworks cracker shop.

---

## ⚙️ Setup & Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, and Cloudinary credentials

# 3. Seed the database (wipes everything and inserts fresh data)
npm run seed

# 4. Start server
npm run dev     # Development with nodemon (auto-restart)
npm start       # Production
```

---

## 🗑️ How to Wipe & Re-Seed

```bash
# Option 1 — Just re-run the seed (it clears all data first, then inserts fresh)
npm run seed

# Option 2 — Wipe manually from MongoDB shell, then seed
mongosh "your_mongodb_uri"
use cracker_shop
db.dropDatabase()
exit
npm run seed

# Option 3 — Wipe via Atlas UI
# Go to Atlas → your cluster → Collections → drop each collection manually
# Then run: npm run seed
```

> ⚠️ The seed script **always wipes all collections before inserting**. Running it again gives you a clean slate.

---

## 🗄️ Project Structure

```
cracker-shop-backend/
├── server.js
├── config/
│   ├── db.js              # MongoDB connection
│   └── cloudinary.js      # Cloudinary config
├── models/
│   ├── Admin.js           # Admin + Staff with activity log
│   ├── Customer.js        # Customer with addresses & loyalty
│   ├── Category.js        # Product categories with offer support
│   ├── Product.js         # Products with basePrice + virtual finalPrice
│   ├── Order.js           # Orders with status history
│   └── Coupon.js          # Discount coupons
├── controllers/
│   ├── adminController.js
│   ├── productController.js
│   ├── customerController.js
│   ├── orderController.js
│   ├── categoryController.js
│   ├── couponController.js
│   └── dashboardController.js
├── middleware/
│   ├── auth.js            # JWT + role + permission middleware
│   └── upload.js          # Multer + Cloudinary upload middleware
├── routes/
│   └── index.js
└── seeders/
    └── seed.js
```

---

## 👥 Roles & Permissions

Only **2 roles** exist in this system:

| Permission            | admin | staff |
|-----------------------|-------|-------|
| View products         | ✅    | ✅    |
| Create/Edit/Delete products | ✅ | ❌  |
| Update product stock  | ✅    | ✅    |
| View orders           | ✅    | ✅    |
| Update order status   | ✅    | ✅    |
| Create/Delete orders  | ✅    | ❌    |
| Update payment status | ✅    | ❌    |
| View customers        | ✅    | ✅    |
| Edit/Delete customers | ✅    | ❌    |
| Manage categories     | ✅    | ❌    |
| Manage coupons        | ✅    | ❌    |
| View reports          | ✅    | ❌    |
| Create/Edit/Delete staff | ✅ | ❌   |
| View staff activity   | ✅    | ❌    |

**Admin** has full access to everything.  
**Staff** can view products/orders/customers and update order status only.

---

## 💰 Pricing Model

Products have a single **Base Price**. Discounts come from **Category Offers**:

```
Final Price = Base Price − Category Offer (if active)
```

- Category offers can be **percentage** (e.g. 10% off) or **fixed** (e.g. ₹200 off)
- Offers can have an optional **expiry date** — auto-deactivated when expired
- `finalPrice`, `discountPercent`, and `offerLabel` are **Mongoose virtuals** — computed on-the-fly when category is populated, no extra storage needed

---

## 📦 Stock Model

- `stock.quantity = null` → **Unlimited stock** (no tracking)
- `stock.quantity = 0` → **Out of stock**
- `stock.quantity > 0` → **Tracked stock**

Order creation and stock updates skip the deduction step for unlimited products (only `totalSold` is incremented).

---

## 🖼️ Image Uploads

Product and category images are stored in **Cloudinary**. Add to `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Product images → `cracker_shop/products/` (max 5, resized to 800×800)  
Category images → `cracker_shop/categories/` (resized to 400×400)

---

## 🔗 API Endpoints

### Auth
```
POST   /api/admin/auth/login          Admin login
GET    /api/admin/auth/me             Get current admin
POST   /api/customer/auth/register    Customer register
POST   /api/customer/auth/login       Customer login
```

### Staff Management (admin only)
```
POST   /api/admin/admins              Create staff
GET    /api/admin/admins              List all staff
GET    /api/admin/admins/:id          Get staff + info
PUT    /api/admin/admins/:id          Update staff (name/phone/isActive)
DELETE /api/admin/admins/:id          Soft delete staff
GET    /api/admin/admins/:id/activity Staff activity log (last 100 actions)
```

### Categories
```
POST   /api/admin/categories                Create category (with optional offer)
GET    /api/admin/categories                List categories (admin)
GET    /api/admin/categories/:id            Get category
PUT    /api/admin/categories/:id            Update category
PATCH  /api/admin/categories/:id/offer      Set/clear category offer
DELETE /api/admin/categories/:id            Soft delete
GET    /api/categories                      Public list
```

### Products
```
POST   /api/admin/products                  Create product (multipart/form-data)
GET    /api/admin/products                  List products (with filters)
GET    /api/admin/products/:id              Get product
PUT    /api/admin/products/:id              Update product (multipart/form-data)
DELETE /api/admin/products/:id              Soft delete
PATCH  /api/admin/products/:id/restore      Restore deleted product
PATCH  /api/admin/products/:id/stock        Update stock
GET    /api/products                        Public listing
GET    /api/products/:id                    Public detail
```

### Customers
```
GET    /api/admin/customers              List customers
GET    /api/admin/customers/:id          Get customer + recent orders
PUT    /api/admin/customers/:id          Update customer (admin only)
DELETE /api/admin/customers/:id          Soft delete (admin only)
GET    /api/admin/customers/:id/orders   Full order history
```

### Orders
```
POST   /api/admin/orders                 Create order (admin only)
GET    /api/admin/orders                 List orders
GET    /api/admin/orders/:id             Get order detail
PATCH  /api/admin/orders/:id/status      Update order status (admin + staff)
PATCH  /api/admin/orders/:id/payment     Update payment status (admin only)
DELETE /api/admin/orders/:id             Soft delete (admin only)
POST   /api/customer/orders              Customer places order
GET    /api/customer/orders              Customer order history
GET    /api/customer/orders/:id          Customer order detail
```

### Coupons (admin only)
```
POST   /api/admin/coupons               Create coupon
GET    /api/admin/coupons               List coupons
PUT    /api/admin/coupons/:id           Update coupon
DELETE /api/admin/coupons/:id           Delete coupon
POST   /api/customer/coupons/validate   Validate coupon (customer)
```

### Dashboard & Reports (admin only)
```
GET    /api/admin/dashboard             KPIs + recent orders + low stock
GET    /api/admin/reports/sales         Sales report (daily/monthly)
GET    /api/admin/reports/top-products  Top selling products
```

---

## 📦 Query Parameters

### Products
```
?search=sparkler&category=ID&brand=Standard
&minPrice=100&maxPrice=1000
&isFeatured=true&isActive=true&inStock=true
&sortBy=price.basePrice&sortOrder=asc
&page=1&limit=20
```

### Orders
```
?status=pending&customerId=ID&search=ORD-001
&fromDate=2024-01-01&toDate=2024-12-31
&paymentMethod=upi&paymentStatus=paid
&page=1&limit=20
```

---

## 🔐 Authentication

All protected routes require:
```
Authorization: Bearer <token>
```

---

## 🌱 Seed Credentials

| Role  | Email                       | Password  |
|-------|-----------------------------|-----------|
| Admin | admin@gbfireworks.com       | Admin@123 |
| Staff | karthik@gbfireworks.com     | Staff@123 |
| Staff | deepa@gbfireworks.com       | Staff@123 |

| Customer Phone | Password |
|----------------|----------|
| 9500012345     | Cust@123 |
| 9500012346     | Cust@123 |
| 9500012347     | Cust@123 |

**Coupon Codes:** `DIWALI25` · `FLAT100` · `NEWUSER50`

---

## ✅ Feature Summary

- 2-role admin system (admin + staff) with granular permissions
- Staff activity log — tracks every order/product/customer action (last 100)
- Single base price per product — category offers auto-calculate final price
- Unlimited stock mode (`null`) — no deduction, just `totalSold` tracking
- Cloudinary image upload for products and categories
- Soft delete everywhere
- Category-level offers (percentage or fixed, with expiry)
- Full order lifecycle with status history
- Coupon/discount system
- Customer loyalty points
- Dashboard KPIs + sales reports + top products
- Public API for storefront (products, categories, orders, coupons)