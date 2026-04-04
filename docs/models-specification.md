# 📊 Models Specification - E-commerce de Brindes

## Overview
Sistema single-tenant para e-commerce de brindes com integração de pagamento.

---

## 1️⃣ Customer (Cliente) ✅ IMPLEMENTED

### Attributes
```typescript
Customer {
  id: UUID (PK)

  name: string
  taxId: string                    // CPF/CNPJ (only numbers)
  email: string (unique)
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
- `1 Customer` → `N Orders`

### Validations
- `name`: required, min 3 chars
- `taxId`: required, only numbers, 11 or 14 digits
- `email`: required, unique, lowercase
- `phone`: required, only numbers
- `password`: min 6 chars (hashed with bcrypt)

### Indexes
```sql
CREATE UNIQUE INDEX idx_customer_email ON customers(email);
CREATE INDEX idx_customer_status ON customers(status);
```

---

## 2️⃣ Product (Produto) ✅ IMPLEMENTED

### Attributes
```typescript
Product {
  id: UUID (PK)

  name: string                     // "Caneta Personalizada"
  description?: string
  sku: string (unique)             // Unique product code

  price: decimal(10,2)             // 15.90
  stock_quantity: integer          // 100
  min_stock?: integer              // 10 (low stock alert)

  image_url?: string               // Main image URL
  images?: string[]                // Array of image URLs (JSONB)

  category?: string                // "Canetas", "Brindes"

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
- `1 Product` → `N OrderItems`

### Validations
- `name`: required, min 3 chars
- `sku`: required, unique, uppercase
- `price`: required, > 0
- `stock_quantity`: required, >= 0
- `featured`: default = false
- `status`: default = 'active'

### Business Rules
- Auto set `status = 'out_of_stock'` when `stock_quantity = 0`
- Alert when `stock_quantity <= min_stock`

### Indexes
```sql
CREATE UNIQUE INDEX idx_product_sku ON products(sku);
CREATE INDEX idx_product_status ON products(status);
CREATE INDEX idx_product_featured ON products(featured) WHERE featured = true;
```

---

## 3️⃣ Order (Pedido)

### Attributes
```typescript
Order {
  id: UUID (PK)
  customer_id: UUID (FK → Customer)

  subtotal: decimal(10,2)
  discount: decimal(10,2)
  shipping: decimal(10,2)
  total: decimal(10,2)

  status: enum (pending, paid, processing, shipped, delivered, cancelled, refunded)

  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_zip_code: string

  notes?: string

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
CREATE INDEX idx_order_customer ON orders(customer_id);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_order_created ON orders(created_at DESC);
```

---

## 4️⃣ OrderItem (Item do Pedido)

### Attributes
```typescript
OrderItem {
  id: UUID (PK)
  order_id: UUID (FK → Order)
  product_id: UUID (FK → Product)

  product_name: string             // Snapshot
  product_sku: string

  quantity: integer
  unit_price: decimal(10,2)        // Price at purchase time
  subtotal: decimal(10,2)          // quantity * unit_price

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

## 5️⃣ Payment (Pagamento)

### Attributes
```typescript
Payment {
  id: UUID (PK)
  order_id: UUID (FK → Order)

  gateway: string                  // "abacatepay"
  gateway_payment_id: string

  amount: decimal(10,2)
  currency: string                 // "BRL"

  status: enum (pending, processing, succeeded, failed, refunded)

  payment_method: enum (pix, credit_card, boleto)

  gateway_metadata?: jsonb

  pix_qr_code?: string
  pix_qr_code_url?: string
  pix_expires_at?: timestamp

  paid_at?: timestamp
  created_at: timestamp
  updated_at: timestamp
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

### Indexes
```sql
CREATE INDEX idx_payment_order ON payments(order_id);
CREATE INDEX idx_payment_status ON payments(status);
CREATE INDEX idx_payment_gateway_id ON payments(gateway_payment_id);
```
