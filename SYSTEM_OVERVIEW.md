# LiveMART E-commerce Platform - System Overview

## 🏗️ Architecture Overview

**LiveMART** is a comprehensive multi-user e-commerce platform supporting both B2C (Business-to-Consumer) and B2B (Business-to-Business) transactions. The system is built with:

- **Backend**: Node.js/Express, MongoDB (Mongoose), JWT Authentication
- **Frontend**: React, React Router, Context API
- **Payment**: Razorpay Integration
- **Email**: Nodemailer for OTP and notifications
- **File Upload**: Multer for product images
- **Bulk Upload**: CSV parsing for wholesaler products

---

## 👥 User Roles & Permissions

### 1. **Customer**
- Browse and purchase products from retailers
- Add items to cart (B2C cart - database-backed)
- Place orders with online/Cash on Delivery
- View order history
- Write product reviews
- Auto-login after OTP registration

### 2. **Retailer**
- Browse wholesaler products
- Add wholesaler products to B2B cart (localStorage-backed)
- Place bulk orders from wholesalers
- Create own products
- Add proxy products from wholesalers (with quantity/markup)
- Manage inventory
- View and update order status
- Requires admin approval before activation

### 3. **Wholesaler**
- Create products with wholesale pricing
- Bulk upload products via CSV
- Set tiered pricing (quantity-based discounts)
- View B2B orders from retailers
- Manage order status
- Requires admin approval before activation

### 4. **Admin**
- Approve/reject retailer and wholesaler registrations
- View pending approvals
- Manage platform users

---

## 🔐 Authentication System

### OTP-Based Authentication
- **Registration Flow**:
  1. User enters email → OTP sent
  2. User enters OTP + registration details
  3. For customers: Auto-login after verification
  4. For retailers/wholesalers: Await admin approval

- **Login Flow**:
  1. User enters email + password → OTP sent
  2. User enters OTP → Logged in

### OAuth Integration
- **Google OAuth**: Login/Register with Google account
- **Facebook OAuth**: Login/Register with Facebook account
- OAuth users automatically registered as customers
- OAuth users skip OTP verification
- Profile pictures from OAuth providers stored

### Security Features
- JWT tokens for session management
- Password hashing with bcrypt
- OTP expiration (10 minutes)
- TTL index for automatic OTP cleanup
- Role-based access control (RBAC)

---

## 🛒 Cart System

### B2C Cart (Customer)
- **Storage**: MongoDB database
- **Features**:
  - Persistent across sessions
  - Real-time stock validation
  - Quantity updates
  - Item removal
  - Automatic price calculation

### B2B Cart (Retailer)
- **Storage**: localStorage
- **Features**:
  - Client-side only
  - Bulk quantity management
  - Remove/update items on checkout page
  - Wholesale pricing calculation
  - Tiered pricing support

---

## 📦 Product Management

### Product Model Structure
```javascript
{
  name, description, category, images,
  retailPrice, stock,
  owner, ownerType: ['retailer', 'wholesaler'],
  wholesaleEnabled, wholesalePrice, wholesaleMinQty, wholesaleTiers,
  sourceWholesaler, // For proxy products
  isLocalProduct, region,
  averageRating, numberOfReviews
}
```

### Product Types

1. **Retailer Products**:
   - Created directly by retailer
   - Sold to customers (B2C)
   - Standard retail pricing

2. **Wholesaler Products**:
   - Created by wholesaler
   - Sold to retailers (B2B)
   - Wholesale pricing with tiered discounts
   - Bulk upload support (CSV)

3. **Proxy Products**:
   - Retailer adds wholesaler product to their store
   - Deducts stock from wholesaler
   - Can set custom markup
   - Updates existing or creates new retailer product

---

## 💰 Pricing System

### B2C Pricing
- Retail price from product
- 5% tax
- Delivery fee: ₹50 (free above ₹500)

### B2B Pricing
- Wholesale price from product
- Tiered pricing based on quantity
- Minimum order quantity enforcement
- Tax and delivery calculated separately

### Tiered Pricing
Wholesalers can set quantity-based pricing:
```javascript
wholesaleTiers: [
  { minQty: 10, discountPercent: 5 },
  { minQty: 50, discountPercent: 10 },
  { minQty: 100, discountPercent: 15 }
]
```

---

## 📋 Order Management

### Order Types

1. **B2C Orders** (Customer → Retailer):
   - Created from B2C cart
   - Payment: Online (Razorpay) or Cash on Delivery
   - Stock deducted after payment verification (online) or immediately (COD)
   - Order status: pending → confirmed → processing → shipped → delivered

2. **B2B Orders** (Retailer → Wholesaler):
   - Created from B2B cart
   - Payment: Online (Razorpay) or Cash on Delivery
   - Stock deducted after payment verification
   - **Auto-inventory**: Products automatically added to retailer inventory after payment
   - Order status tracking

### Order Status Flow
```
pending → confirmed → processing → shipped → delivered
         ↓
      cancelled (restores stock)
```

### Stock Management
- **Deduction**:
  - Online payment: After payment verification
  - COD: Immediately on order creation
- **Restoration**:
  - On order cancellation
  - Prevents duplicate restoration
- **Validation**:
  - Stock checked before order creation
  - Double-checked before payment verification

---

## 💳 Payment System

### Razorpay Integration
1. **Create Payment Order**: Backend creates Razorpay order
2. **Frontend Checkout**: Razorpay popup for payment
3. **Payment Verification**: Signature verification on backend
4. **Stock Deduction**: After successful verification
5. **Order Confirmation**: Email notifications sent

### Payment Methods
- **Online**: Razorpay (credit/debit card, UPI, netbanking)
- **Cash on Delivery**: Stock deducted immediately

### Payment Flow
```
Order Created → Payment Initiated → User Pays → 
Payment Verified → Stock Deduced → Order Confirmed → 
Emails Sent → Inventory Updated (B2B)
```

---

## 🏪 Retailer Workflows

### Browse Wholesalers
- View all approved wholesaler products
- Filter by category
- See wholesale pricing and stock
- Add to B2B cart

### Add Proxy Product
- Select wholesaler product
- Enter quantity to purchase
- Set markup percentage
- Stock deducted from wholesaler
- Product added/updated in retailer inventory

### Create Own Product
- Upload product details
- Add images (max 5)
- Set retail price and stock
- Product visible to customers

### Manage Orders
- View orders from customers
- Update order status
- Track order progress

---

## 🏭 Wholesaler Workflows

### Create Product
- Add product details
- Set retail and wholesale prices
- Configure tiered pricing
- Upload images
- Set minimum order quantity

### Bulk Upload
- Upload CSV file
- Parse and validate data
- Create multiple products at once
- Error handling for invalid rows

### Manage Orders
- View B2B orders from retailers
- Update order status
- Track bulk order progress

---

## 📧 Email System

### Email Types
1. **OTP Emails**: Registration and login OTPs
2. **Welcome Emails**: New user registration
3. **Approval Emails**: Account approval notifications
4. **Order Confirmation**: Customer order confirmation
5. **Seller Notifications**: New order alerts to sellers

### Email Service
- Uses Nodemailer
- HTML templates
- SMTP configuration via environment variables

---

## ⭐ Review System

### Features
- Customers can review products after delivery
- Rating: 1-5 stars
- Text comments
- Average rating calculation
- Review count tracking
- One review per product per customer

### Review Display
- Shown on product detail page
- Average rating displayed
- Sorted by date (newest first)
- Review form auto-opens from orders page

---

## 🔄 Key Workflows

### Customer Purchase Flow
```
Browse Products → Add to Cart → View Cart → 
Checkout → Enter Address → Choose Payment → 
Place Order → Payment (if online) → 
Order Confirmed → Stock Deducted → 
Order Tracking → Delivery → Review
```

### Retailer B2B Purchase Flow
```
Browse Wholesalers → Add to B2B Cart → 
B2B Checkout → Enter Address → 
Place Order → Payment (if online) → 
Payment Verified → Stock Deducted from Wholesaler → 
Products Auto-Added to Retailer Inventory
```

### Proxy Product Flow
```
Browse Wholesaler Product → Add as Proxy → 
Enter Quantity & Markup → Stock Deducted from Wholesaler → 
Product Added/Updated in Retailer Store
```

---

## 🗄️ Database Models

### User Model
- Basic info: name, email, password (optional for OAuth)
- Role: customer, retailer, wholesaler, admin
- OAuth: provider, oauthId, profilePicture
- Nested schemas: wholesalerInfo, retailerInfo
- Approval status for retailers/wholesalers

### Product Model
- Product details: name, description, category, images
- Pricing: retailPrice, wholesalePrice, wholesaleTiers
- Stock management
- Owner tracking
- Source tracking for proxy products
- Rating aggregation

### Order Model
- Customer reference
- Order items with product details
- Pricing breakdown (subtotal, tax, delivery, total)
- Payment info (method, status, paymentId)
- Delivery address
- Order status and tracking
- Order type (B2C/B2B)

### Cart Model
- User reference
- Cart items with product references
- Total price calculation
- Persistent storage

### OTP Model
- Email, OTP, purpose (registration/login)
- Expiration timestamp
- Verified status
- TTL index for auto-cleanup

### Review Model
- User and product references
- Rating (1-5)
- Comment text
- Timestamps

---

## 🔒 Security & Validation

### Middleware
- `requireAuth`: JWT token validation
- `authorizeRoles`: Role-based access control
- Request validation

### Stock Validation
- Check before order creation
- Double-check before payment verification
- Prevent overselling

### Payment Security
- Razorpay signature verification
- Secure payment flow
- Transaction logging

---

## 🎨 Frontend Architecture

### Context Providers
1. **AuthContext**: User authentication state
2. **CartContext**: B2C cart management
3. **B2BCartContext**: B2B cart management (localStorage)

### Routing
- Public routes: Home, Products, Product Detail
- Protected routes: Cart, Checkout, Orders, Dashboards
- Role-based routes: Admin, Retailer, Wholesaler dashboards

### Key Pages
- **Home**: Landing page with role-based navigation
- **Products**: Product listing with search/filter
- **ProductDetail**: Product info, reviews, add to cart
- **Cart**: B2C cart management
- **Checkout**: Order placement with payment
- **Orders**: Order history and tracking
- **RetailerDashboard**: Browse wholesalers, manage products, orders
- **WholesalerDashboard**: Manage products, bulk upload, orders
- **AdminDashboard**: Approve users
- **B2BCheckout**: B2B order placement with cart management

---

## 🚀 Key Features Implemented

✅ Multi-role user system (Customer, Retailer, Wholesaler, Admin)
✅ OTP-based authentication (registration & login)
✅ OAuth integration (Google & Facebook)
✅ Separate B2C and B2B cart systems
✅ Product management with images
✅ Bulk product upload (CSV)
✅ Proxy product system
✅ Tiered wholesale pricing
✅ Razorpay payment integration
✅ Order management with status tracking
✅ Stock management (deduction/restoration)
✅ Review and rating system
✅ Email notifications
✅ Admin approval system
✅ Order cancellation with stock restoration
✅ Auto-inventory for B2B purchases
✅ Location-based product features
✅ Search and filter functionality

---

## 🔧 Environment Variables

```env
# Server
PORT=5000
MONGO_URI=mongodb://localhost:27017/marketdb

# Authentication
JWT_SECRET=your_secret_key

# Payment
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASSWORD=your_app_password

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
BACKEND_URL=http://localhost:5000

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## 📝 API Endpoints Summary

### Authentication
- `POST /api/auth/send-registration-otp`
- `POST /api/auth/verify-registration-otp`
- `POST /api/auth/send-login-otp`
- `POST /api/auth/verify-login-otp`
- `GET /api/auth/google/url`
- `GET /api/auth/google/callback`
- `GET /api/auth/facebook/url`
- `GET /api/auth/facebook/callback`

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `GET /api/products/search` - Search products
- `GET /api/products/category/:category` - Filter by category

### Cart (B2C)
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/update` - Update quantity
- `DELETE /api/cart/remove/:productId` - Remove item
- `DELETE /api/cart/clear` - Clear cart

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get customer orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/cancel` - Cancel order
- `PUT /api/orders/:id/status` - Update status (seller)
- `GET /api/orders/seller/orders` - Get seller orders

### B2B Orders
- `POST /api/b2b-orders` - Create B2B order
- `GET /api/b2b-orders/my-orders` - Get retailer B2B orders
- `GET /api/b2b-orders/wholesaler-orders` - Get wholesaler B2B orders

### Payment
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment
- `GET /api/payment/:paymentId` - Get payment details

### Retailer
- `GET /api/retailer/browse-wholesalers` - Browse wholesaler products
- `POST /api/retailer/products` - Create product
- `GET /api/retailer/products` - List retailer products
- `PUT /api/retailer/products/:id` - Update product
- `DELETE /api/retailer/products/:id` - Delete product
- `POST /api/retailer/add-proxy-product` - Add proxy product

### Wholesaler
- `POST /api/wholesaler/products` - Create product
- `POST /api/wholesaler/products/bulk` - Bulk upload
- `GET /api/wholesaler/products/me` - List wholesaler products
- `PUT /api/wholesaler/products/:id` - Update product
- `DELETE /api/wholesaler/products/:id` - Delete product

### Admin
- `GET /api/admin/wholesalers/pending` - List pending wholesalers
- `POST /api/admin/wholesaler/:id/approve` - Approve wholesaler
- `GET /api/admin/retailers/pending` - List pending retailers
- `POST /api/admin/retailer/:id/approve` - Approve retailer

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Add review
- `PUT /api/reviews/:reviewId` - Update review
- `DELETE /api/reviews/:reviewId` - Delete review

---

## 🐛 Bug Fixes Implemented

1. **Stock Deduction Timing**: Fixed to deduct after payment verification for online payments
2. **Duplicate Stock Restoration**: Added checks to prevent multiple restorations on cancellation
3. **B2B Cart Management**: Added remove and update quantity functionality
4. **Proxy Product Stock**: Fixed to deduct wholesaler stock when retailer adds product
5. **Customer Auto-Login**: Fixed registration flow to auto-login customers after OTP verification
6. **Payment Verification Stock Check**: Added double-check for stock availability before deduction
7. **B2B Payment Stock Deduction**: Fixed product reference for correct stock deduction

---

## 🎯 Future Enhancements (Potential)

- Real-time notifications (WebSocket)
- Advanced search with filters
- Wishlist functionality
- Coupon/discount system
- Inventory alerts (low stock)
- Analytics dashboard
- Multi-language support
- Mobile app (React Native)
- Advanced reporting
- Shipping integration
- Return/refund management

---

This system provides a complete e-commerce solution with robust B2B and B2C capabilities, secure authentication, payment processing, and comprehensive order management.

