# 📊 Models Specification - Multi-Tenant E-commerce

## Overview
Sistema multi-tenant para e-commerce de brindes com integração de pagamento (AbacatePay).

---

## 1️⃣ Store (Loja/Tenant)

### Attributes
```typescript
Store {
  // Identification
  id: UUID (PK)
  
  // Store data
  name: string                    // "Brindes Silva LTDA"
  slug: string (unique)           // "brindes-silva" (URL friendly)
  domain?: string                 // "brindessilva.com.br" (custom domain)
  
  // Contact
  email: string
  phone: string
  
  // Address
  address?: string
  city?: string
  state?: string
  zip_code?: string
  
  // Settings
  logo_url?: string
  status: enum (active, inactive, suspended)
  
  // Control
  created_at: timestamp
  updated_at: timestamp
  deleted_at?: timestamp
}
```

### Enum: StoreStatus
```typescript
enum StoreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}
```

### Relationships
- `1 Store` → `N Customers`
- `1 Store` → `N Products`
- `1 Store` → `N Orders`

### Validations
- `name`: required, min 3 chars
- `slug`: required, unique, lowercase, no spaces
- `email`: required, valid email format
- `phone`: required, only numbers
- `status`: default = 'active'

### Indexes
```sql
CREATE INDEX idx_store_slug ON stores(slug);
CREATE INDEX idx_store_domain ON stores(domain);
CREATE INDEX idx_store_status ON stores(status);
```

---

## 2️⃣ Customer (Cliente) ✅ IMPLEMENTED

### Attributes
```typescript
Customer {
  id: UUID (PK)
  store_id: UUID (FK → Store)     // Multi-tenancy isolation
  
  name: string
  taxId: string                    // CPF/CNPJ (only numbers)
  email: string
  phone: string
  password_hash: string
  status: enum (active, inactive, blocked)
  
  created_at: timestamp
  updated_at: timestamp
  deleted_at?: timestamp
}
```

### Enum: CustomerStatus
```typescript
enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}
```

### Relationships
- `N Customers` → `1 Store`
- `1 Customer` → `N Orders`

### Validations
- `name`: required, min 3 chars
- `taxId`: required, only numbers, 11 or 14 digits
- `email`: required, unique per store, lowercase
- `phone`: required, only numbers
- `password`: min 6 chars (hashed with bcrypt)

### Indexes
```sql
CREATE UNIQUE INDEX idx_customer_email_store ON customers(email, store_id);
CREATE INDEX idx_customer_store ON customers(store_id);
CREATE INDEX idx_customer_status ON customers(status);
```

---

## 3️⃣ Product (Produto)

### Attributes
```typescript
Product {
  // Identification
  id: UUID (PK)
  store_id: UUID (FK → Store)     // Multi-tenancy isolation
  
  // Basic data
  name: string                     // "Caneta Personalizada"
  description?: string
  sku: string                      // Unique product code
  
  // Price and stock
  price: decimal(10,2)             // 15.90
  stock_quantity: integer          // 100
  min_stock?: integer              // 10 (low stock alert)
  
  // Images
  image_url?: string               // Main image URL
  images?: string[]                // Array of image URLs (JSONB)
  
  // Passar um Enum de acordo com a loja
  category?: string                // "Canetas", "Brindes"
  
  // Control
  status: enum (active, inactive, out_of_stock)
  featured: boolean                // Featured product?
  
  created_at: timestamp
  updated_at: timestamp
  deleted_at?: timestamp
}
```

### Enum: ProductStatus
```typescript
enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock'
}
```

### Relationships
- `N Products` → `1 Store`
- `1 Product` → `N OrderItems`

### Validations
- `name`: required, min 3 chars
- `sku`: required, unique per store
- `price`: required, > 0
- `stock_quantity`: required, >= 0
- `featured`: default = false
- `status`: default = 'active'

### Business Rules
- Auto set `status = 'out_of_stock'` when `stock_quantity = 0`
- Alert when `stock_quantity <= min_stock`

### Indexes
```sql
CREATE INDEX idx_product_store ON products(store_id);
CREATE UNIQUE INDEX idx_product_sku_store ON products(sku, store_id);
CREATE INDEX idx_product_status ON products(status);
CREATE INDEX idx_product_featured ON products(featured) WHERE featured = true;
```

---

## 4️⃣ Order (Pedido)

### Attributes
```typescript
Order {
  // Identification
  id: UUID (PK)
  store_id: UUID (FK → Store)     // Multi-tenancy isolation
  customer_id: UUID (FK → Customer)
  
  // Values
  subtotal: decimal(10,2)          // Sum of items
  discount: decimal(10,2)          // Applied discount
  shipping: decimal(10,2)          // Shipping cost
  total: decimal(10,2)             // Final total
  
  // Order status
  status: enum (
    pending,      // Awaiting payment
    paid,         // Paid
    processing,   // Processing
    shipped,      // Shipped
    delivered,    // Delivered
    cancelled,    // Cancelled
    refunded      // Refunded
  )
  
  // Shipping address
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_zip_code: string
  
  // Notes
  notes?: string
  
  // Control
  created_at: timestamp
  updated_at: timestamp
  deleted_at?: timestamp
}
```

### Enum: OrderStatus
```typescript
enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}
```

### Relationships
- `N Orders` → `1 Store`
- `N Orders` → `1 Customer`
- `1 Order` → `N OrderItems`
- `1 Order` → `1 Payment`

### Validations
- `subtotal`: required, >= 0
- `discount`: default = 0, >= 0
- `shipping`: default = 0, >= 0
- `total`: required, > 0
- `status`: default = 'pending'
- `shipping_address`: required
- `shipping_zip_code`: required, only numbers

### Business Rules
- `total = subtotal - discount + shipping`
- Cannot cancel if `status = 'shipped' or 'delivered'`
- Auto update to `paid` when payment succeeds

### Indexes
```sql
CREATE INDEX idx_order_store ON orders(store_id);
CREATE INDEX idx_order_customer ON orders(customer_id);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_order_created ON orders(created_at DESC);
```

---

## 5️⃣ OrderItem (Item do Pedido)

### Attributes
```typescript
OrderItem {
  // Identification
  id: UUID (PK)
  order_id: UUID (FK → Order)
  product_id: UUID (FK → Product)
  
  // Product snapshot (at purchase time)
  product_name: string             // Snapshot (if product changes later)
  product_sku: string
  
  // Quantity and price
  quantity: integer                // 5 units
  unit_price: decimal(10,2)        // 15.90 (price at purchase time)
  subtotal: decimal(10,2)          // quantity * unit_price = 79.50
  
  // Control
  created_at: timestamp
}
```

### Relationships
- `N OrderItems` → `1 Order`
- `N OrderItems` → `1 Product`

### Validations
- `quantity`: required, > 0
- `unit_price`: required, > 0
- `subtotal`: required, = quantity * unit_price

### Business Rules
- Save product snapshot (name, sku, price) at purchase time
- Decrease product stock when order is created
- Restore stock if order is cancelled

### Indexes
```sql
CREATE INDEX idx_orderitem_order ON order_items(order_id);
CREATE INDEX idx_orderitem_product ON order_items(product_id);
```

---

## 6️⃣ Payment (Pagamento)

### Attributes
```typescript
Payment {
  // Identification
  id: UUID (PK)
  order_id: UUID (FK → Order)
  
  // Gateway
  gateway: enum (abacatepay, stripe, mercadopago)
  gateway_payment_id: string       // External gateway ID
  
  // Values
  amount: decimal(10,2)            // Paid amount
  currency: string                 // "BRL"
  
  // Status
  status: enum (
    pending,      // Awaiting
    processing,   // Processing
    succeeded,    // Success
    failed,       // Failed
    refunded      // Refunded
  )
  
  // Payment method
  payment_method: enum (pix, credit_card, boleto)
  
  // Gateway data (JSON)
  gateway_metadata?: jsonb         // Extra gateway data
  
  // PIX specific
  pix_qr_code?: string
  pix_qr_code_url?: string
  pix_expires_at?: timestamp
  
  // Control
  paid_at?: timestamp              // When it was paid
  created_at: timestamp
  updated_at: timestamp
}
```

### Enum: PaymentGateway
```typescript
enum PaymentGateway {
  ABACATEPAY = 'abacatepay',
  STRIPE = 'stripe',
  MERCADOPAGO = 'mercadopago'
}
```

### Enum: PaymentStatus
```typescript
enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}
```

### Enum: PaymentMethod
```typescript
enum PaymentMethod {
  PIX = 'pix',
  CREDIT_CARD = 'credit_card',
  BOLETO = 'boleto'
}
```

### Relationships
- `1 Payment` → `1 Order`

### Validations
- `amount`: required, > 0
- `currency`: default = 'BRL'
- `status`: default = 'pending'
- `gateway`: required
- `gateway_payment_id`: required, unique

### Business Rules
- Update order status when payment succeeds
- Store webhook data in `gateway_metadata`
- PIX expires in 30 minutes (configurable)

### Indexes
```sql
CREATE UNIQUE INDEX idx_payment_order ON payments(order_id);
CREATE INDEX idx_payment_gateway_id ON payments(gateway_payment_id);
CREATE INDEX idx_payment_status ON payments(status);
```

---

## 📐 Entity Relationship Diagram

```
┌─────────────┐
│   Store     │ (1)
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
       ↓ (N)          ↓ (N)          ↓ (N)
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Customer   │  │   Product   │  │    Order    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       │ (1)            │ (1)            │ (1)
       │                │                │
       └────────┬───────┘                ├──────────┐
                │                        │          │
                ↓ (N)                    ↓ (N)      ↓ (1)
         ┌─────────────┐          ┌─────────────┐  ┌─────────────┐
         │  OrderItem  │          │  OrderItem  │  │   Payment   │
         └─────────────┘          └─────────────┘  └─────────────┘
```

**Legend:**
- `(1)` = One
- `(N)` = Many
- `→` = Foreign Key

---

## 🔑 Architectural Decisions

### 1. UUIDs vs Integers
✅ **Use UUIDs**
- Better for multi-tenancy
- Doesn't expose record count
- Easier data merging
- No collision between stores

### 2. Soft Delete
✅ **Use `deleted_at` in all tables**
- Audit trail
- Data recovery
- Historical reports
- LGPD compliance

### 3. Timestamps
✅ **Use `created_at` and `updated_at` in all tables**
- Audit
- Debugging
- Analytics

### 4. Multi-Tenancy Isolation
✅ **Add `store_id` to all relevant tables**
- Complete data isolation
- Security by design
- Scalable architecture

### 5. Price Snapshot
✅ **Save price in OrderItem**
- Product price can change
- Order must reflect purchase-time price
- Historical accuracy

### 6. Stock Management
✅ **Decrease stock on order creation**
- Real-time inventory
- Prevent overselling
- Restore on cancellation

---

## 🗄️ Database Schema (PostgreSQL)

### Create Tables Script
```sql
-- Store
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    logo_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Customer
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(14) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Product
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER,
    image_url TEXT,
    images JSONB,
    category VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Order
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(2) NOT NULL,
    shipping_zip_code VARCHAR(10) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- OrderItem
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Payment
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    gateway VARCHAR(50) NOT NULL,
    gateway_payment_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) NOT NULL,
    gateway_metadata JSONB,
    pix_qr_code TEXT,
    pix_qr_code_url TEXT,
    pix_expires_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Create Indexes Script
```sql
-- Store indexes
CREATE INDEX idx_store_slug ON stores(slug);
CREATE INDEX idx_store_domain ON stores(domain);
CREATE INDEX idx_store_status ON stores(status);

-- Customer indexes
CREATE UNIQUE INDEX idx_customer_email_store ON customers(email, store_id);
CREATE INDEX idx_customer_store ON customers(store_id);
CREATE INDEX idx_customer_status ON customers(status);

-- Product indexes
CREATE INDEX idx_product_store ON products(store_id);
CREATE UNIQUE INDEX idx_product_sku_store ON products(sku, store_id);
CREATE INDEX idx_product_status ON products(status);
CREATE INDEX idx_product_featured ON products(featured) WHERE featured = true;

-- Order indexes
CREATE INDEX idx_order_store ON orders(store_id);
CREATE INDEX idx_order_customer ON orders(customer_id);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_order_created ON orders(created_at DESC);

-- OrderItem indexes
CREATE INDEX idx_orderitem_order ON order_items(order_id);
CREATE INDEX idx_orderitem_product ON order_items(product_id);

-- Payment indexes
CREATE UNIQUE INDEX idx_payment_order ON payments(order_id);
CREATE INDEX idx_payment_gateway_id ON payments(gateway_payment_id);
CREATE INDEX idx_payment_status ON payments(status);
```

---

## 🚀 Implementation Order

1. ✅ **Customer** (DONE)
2. **Store** (base for multi-tenancy)
3. **Product**
4. **Order + OrderItem** (together, they're related)
5. **Payment** (last, depends on Order)

---

## 📝 Notes

- All models use **encapsulation** (private properties + getters/setters)
- All models have **soft delete** support
- All models have **validation** in setters
- All foreign keys use **UUID**
- All prices use **DECIMAL(10,2)** for precision
- All timestamps use **PostgreSQL TIMESTAMP**
- JSONB used for flexible data (`images`, `gateway_metadata`)
