<div align="center">
  <h1>🛒 E-COMMERCE API</h1>
</div>

A production-ready RESTful E-Commerce API built with **Node.js, Express, and MongoDB** featuring complete shopping functionality. The platform includes **JWT authentication**, product and category management, **shopping cart** with coupon support, order processing with **real-time status tracking**, and **PayPal payment integration**. It implements secure user roles (customer/admin), advanced product search/filtering, **inventory management**, and order history with analytics.
<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18.x-green" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4.18.x-blue" alt="Express">
  <img src="https://img.shields.io/badge/MongoDB-6.0+-brightgreen" alt="MongoDB">
  <img src="https://img.shields.io/badge/Deploy-Ready-success" alt="Deploy Ready">
</p>

##  Live Demo & Health Check

Test the API availability instantly via our live deployment:

[🔗 Visit Live API Endpoint](https://ecommerce-api.onrender.com/health)

>  **Note:** This link returns the server health status. For full documentation, see the API Docs section below.

**Endpoint:** `GET https://ecommerce-api.onrender.com/health`

## Features

- **Auth & Security:** JWT-based authentication, Role-based access (User/Admin), bcrypt hashing, Helmet.js security headers.
- **Catalog Management:** Nested categories, product search/filtering (price, category), sorting, stock management, and pagination.
- **Shopping Cart:** Real-time cart calculation, unique item tracking, and coupon application.
- **Order Management:** Seamless cart-to-order flow, timeline tracking (Pending → Processing → Shipped → Delivered).
- **Payments:** Integrated PayPal SDK for order creation, capturing payments, and processing refunds.

## Technology Stack

| Category | Technologies |
| --- | --- |
| **Backend** | Node.js (v18+), Express.js (v5.x) |
| **Database** | MongoDB (v7.0+), Mongoose ODM (v9.x) |
| **Auth & Security** | JWT (jsonwebtoken), bcrypt, Helmet.js, express-validator |
| **Payments** | `@paypal/checkout-server-sdk` |

## Quick Start

### 1. Installation

```
git clone https://github.com/UttamSingh809/E-commerce-API.git
cd E-commerce-api
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/ecommerce
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# PayPal Config
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox
PAYPAL_CURRENCY=USD
PAYPAL_SUCCESS_URL=http://localhost:3000/payments/success
PAYPAL_CANCEL_URL=http://localhost:3000/payments/cancel
```

### 3. Run the Server

```
npm run dev  # Development
npm start    # Production
```

### 4. API health check
```
http://localhost:3000/health
```

## API Endpoints

| Resource | Method | Endpoint | Description | Access |
| --- | --- | --- | --- | --- |
| **Auth** | `POST` | `/auth/register` | Register new user | Public |
|  | `POST` | `/auth/login` | Login user | Public |
|  | `GET` | `/auth/me` | Get current user profile | User |
| **Categories** | `GET` | `/categories` | Get all categories | Public |
|  | `GET` | `/categories/:id` | Get single category | Public |
|  | `POST` | `/categories` | Create category | **Admin** |
|  | `PUT` | `/categories/:id` | Update category | **Admin** |
|  | `DELETE` | `/categories/:id` | Delete category | **Admin** |
| **Products** | `GET` | `/products` | Get all products (with filters) | Public |
|  | `GET` | `/products/:id` | Get single product | Public |
|  | `POST` | `/products` | Create product | **Admin** |
|  | `PUT` | `/products/:id` | Update product | **Admin** |
|  | `DELETE` | `/products/:id` | Delete product | **Admin** |
|  | `PUT` | `/products/:id/stock` | Update stock | **Admin** |
| **Cart** | `GET` | `/cart` | Get user's cart | User |
|  | `POST` | `/cart/items` | Add item to cart | User |
|  | `PUT` | `/cart/items/:id` | Update item quantity | User |
|  | `DELETE` | `/cart/items/:id` | Remove item from cart | User |
|  | `DELETE` | `/cart` | Clear entire cart | User |
|  | `POST` | `/cart/coupon` | Apply coupon | User |
|  | `DELETE` | `/cart/coupon/:code` | Remove coupon | User |
| **Orders** | `GET` | `/orders` | Get user's orders | User |
|  | `GET` | `/orders/:id` | Get single order details | User |
|  | `POST` | `/orders` | Create order from cart | User |
|  | `PUT` | `/orders/:id/cancel` | Cancel order | User |
|  | `PUT` | `/orders/:id/status` | Update order status | **Admin** |
|  | `PUT` | `/orders/:id/tracking` | Add tracking number | **Admin** |
| **Payments** | `POST` | `/payments/create-order` | Create PayPal order | User |
|  | `POST` | `/payments/capture` | Capture payment | User |
|  | `GET` | `/payments/success` | Payment success redirect | Public |
|  | `GET` | `/payments/cancel` | Payment cancel redirect | Public |
|  | `GET` | `/payments/methods` | Get payment methods | User |
|  | `GET` | `/payments/history` | Get payment history | User |
|  | `GET` | `/payments/status/:id` | Check payment status | User |
|  | `POST` | `/payments/refund/:id` | Process refund | **Admin** |

## Project Structure & Schemas

```
ecommerce-api/
├── src/
│   ├── config/          # Env vars, PayPal config
│   ├── models/          # User, Category, Product, Cart, Order schemas
│   ├── controllers/     # Route logic
│   ├── routes/          # Express routing definitions
│   ├── services/        # Business logic (Payment, Inventory)
│   ├── middleware/      # Authentication logic
│   └── app.js           # Express app setup
├── server.js            # Entry point
└── package.json
```

### **1. User Model**

```
- name, email (unique), password (hashed)
- role: ['customer', 'admin']
- addresses: [{street, city, state, zip, country}]
- isActive, lastLogin
```

### **2. Category Model**

```
- name (unique), slug (unique)
- description, image
- parentId (self-reference for nesting)
- level: 1,2,3 (subcategory depth)
- isActive
```

### **3. Product Model**

```
- name, slug (unique), description
- price, comparePrice (for discounts)
- categoryId (ref: Category)
- images: [{url, isPrimary}]
- inventory: {quantity, lowStockThreshold}
- ratings: {average, count, distribution}
- tags, isActive, isFeatured
- variants: [{name, options}]
- attributes: [{name, value}]
```

### **4. Cart Model**

```
- user (ref: User, unique)
- items: [{
    product (ref: Product),
    quantity,
    price (snapshot),
    total
  }]
- subtotal, totalDiscount, total
- coupons: [{code, discount, type}]
- expiresAt (auto-delete after 7 days)
```

### **5. Order Model**

```
- orderNumber (unique, auto-generated)
- user (ref: User)
- items: [{
    product (ref: Product),
    name, price, quantity, total (snapshot)
  }]
- shippingAddress, billingAddress
- payment: {method, status, transactionId, paidAt}
- subtotal, shippingCost, tax, discount, total
- status: ['pending','processing','shipped','delivered','cancelled','refunded']
- timeline: [{status, timestamp, note}]
- tracking: {number, carrier, url}
```

### **6. Payment Model**

```
- method: ['paypal', 'card', 'cod']
- status: ['pending', 'paid', 'failed', 'refunded']
- transactionId, paymentId
- paidAt, refundId, refundedAt
```

## **Relationship**

| **Relationship** | **Type** | **Description** |
| --- | --- | --- |
| **User → Cart** | One-to-One | One cart per user |
| **User → Order** | One-to-Many | User can have multiple orders |
| **Product → Category** | Many-to-One | Products belong to one category |
| **Category → Category** | Self-Reference | Nested categories (parent-child) |
| **Order → Product** | Many-to-Many | Order contains multiple products (snapshot) |
| **Cart → Product** | Many-to-Many | Cart contains multiple products |
| **User → Payment** | One-to-Many | User can have multiple payments (via orders) |

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

> **Disclaimer:** This project is for educational purposes. Ensure you secure your API keys and database credentials in production environments.


<div align="center">
  <p>⭐ Star this repo if you found it helpful!</p>
</div>
