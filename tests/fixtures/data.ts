import { randomUUID } from 'crypto';

export const productFixtures = {
    validProduct: {
        store_id: randomUUID(),
        name: 'Smartphone XYZ',
        sku: 'PHONE-001',
        price: 1299.99,
        stock_quantity: 50,
        description: 'Latest smartphone model',
        min_stock: 10,
        category: 'Electronics',
        featured: true
    },
    
    productWithoutStock: {
        store_id: randomUUID(),
        name: 'Out of Stock Product',
        sku: 'OOS-001',
        price: 99.99,
        stock_quantity: 0,
        min_stock: 5
    },

    lowStockProduct: {
        store_id: randomUUID(),
        name: 'Low Stock Product',
        sku: 'LOW-001',
        price: 49.99,
        stock_quantity: 3,
        min_stock: 10
    }
};

export const customerFixtures = {
    validCustomer: {
        store_id: randomUUID(),
        name: 'Maria Silva',
        taxId: '12345678900',
        email: 'maria@example.com',
        phone: '11987654321',
        password: 'SecurePass123!'
    },

    anotherCustomer: {
        store_id: randomUUID(),
        name: 'João Santos',
        taxId: '98765432100',
        email: 'joao@example.com',
        phone: '11912345678',
        password: 'AnotherPass456!'
    }
};
