import { randomUUID, UUID } from 'crypto';
import * as crypto from 'crypto';
import { Payment, PaymentStatus, PaymentMethod } from '../models/Payment';
import { OrderStatus } from '../models/Order';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { OrderRepository } from '../repositories/OrderRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { AbacatePayClient } from './AbacatePayClient';

export class PaymentService {
    private paymentRepository: PaymentRepository;
    private orderRepository: OrderRepository;
    private customerRepository: CustomerRepository;
    private productRepository: ProductRepository;
    private abacatePayClient: AbacatePayClient;

    constructor() {
        this.paymentRepository = new PaymentRepository();
        this.orderRepository = new OrderRepository();
        this.customerRepository = new CustomerRepository();
        this.productRepository = new ProductRepository();
        this.abacatePayClient = new AbacatePayClient();
    }

    async createPixPayment(orderId: string): Promise<Payment> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new Error(`Cannot pay for an order with status ${order.status}`);
        }

        // Check if payment already exists
        const existingPayment = await this.paymentRepository.findByOrderId(orderId);
        if (existingPayment) {
            if (existingPayment.status === PaymentStatus.SUCCEEDED) {
                throw new Error('Order is already paid');
            }
            if (existingPayment.status === PaymentStatus.PENDING) {
                return existingPayment;
            }
        }

        const customer = await this.customerRepository.findById(order.customer_id as any);
        if (!customer) {
            throw new Error('Customer not found');
        }

        const amountInCents = Math.round(order.total * 100);

        // Map phone toCellphone formatting for AbacatePay. If empty/invalid format, provide a default or handle.
        const cellphone = customer.phone || '00000000000';

        const checkoutData = await this.abacatePayClient.createTransparentCheckout({
            amount: amountInCents,
            description: `Pedido ${order.id}`,
            expiresIn: 3600, // 1 hour expiry for PIX QR code
            customer: {
                name: customer.name,
                email: customer.email,
                taxId: customer.taxId,
                cellphone: cellphone
            },
            metadata: {
                orderId: order.id
            }
        });

        const now = new Date();
        const payment = new Payment(
            randomUUID(),
            order.id as any,
            'abacatepay',
            checkoutData.id,
            amountInCents,
            'BRL',
            PaymentStatus.PENDING,
            PaymentMethod.PIX,
            now,
            now,
            checkoutData,
            checkoutData.pix?.brCode,
            checkoutData.pix?.brCodeBase64,
            checkoutData.pix?.expiresAt ? new Date(checkoutData.pix.expiresAt) : undefined
        );

        return await this.paymentRepository.create(payment);
    }

    async checkPaymentStatus(paymentId: string): Promise<Payment> {
        const payment = await this.paymentRepository.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }

        if (payment.status === PaymentStatus.SUCCEEDED || payment.status === PaymentStatus.FAILED) {
            return payment;
        }

        const externalData = await this.abacatePayClient.checkPaymentStatus(payment.gateway_payment_id);
        const externalStatus = externalData.status;

        let newStatus: PaymentStatus = payment.status;
        if (externalStatus === 'PAID') {
            newStatus = PaymentStatus.SUCCEEDED;
            payment.setPaidAt(new Date());
        } else if (externalStatus === 'EXPIRED') {
            newStatus = PaymentStatus.EXPIRED;
        } else if (externalStatus === 'REFUNDED') {
            // Estorno is out of scope but we can map it just in case
            newStatus = PaymentStatus.FAILED;
        }

        if (newStatus !== payment.status) {
            payment.setStatus(newStatus);
            payment.setGatewayMetadata(externalData);
            await this.paymentRepository.update(payment);
            
            // Sync status with order
            await this.syncOrderStatus(payment.order_id, newStatus);
        }

        return payment;
    }

    async handleWebhook(signature: string | undefined, rawBody: string, payload: any): Promise<void> {
        // Validate HMAC signature if secret is configured
        const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;
        if (webhookSecret && signature) {
            const hmac = crypto.createHmac('sha256', webhookSecret);
            const computedSignature = hmac.update(rawBody).digest('hex');
            if (computedSignature !== signature) {
                throw new Error('Invalid signature');
            }
        }

        const { event, data } = payload;
        if (!data || !data.id) {
            return;
        }

        const payment = await this.paymentRepository.findByGatewayId(data.id);
        if (!payment) {
            console.log(`Payment with gateway ID ${data.id} not found in database.`);
            return;
        }

        let newStatus: PaymentStatus = payment.status;
        let paidAt: Date | null = null;

        switch (event) {
            case 'transparent.completed':
                newStatus = PaymentStatus.SUCCEEDED;
                paidAt = new Date();
                break;
            case 'transparent.lost':
            case 'checkout.lost':
                newStatus = PaymentStatus.EXPIRED;
                break;
            case 'transparent.refunded':
            case 'checkout.refunded':
                newStatus = PaymentStatus.FAILED;
                break;
            default:
                // Log and ignore unhandled events
                console.log(`Unhandled webhook event: ${event}`);
                return;
        }

        if (newStatus !== payment.status) {
            payment.setStatus(newStatus);
            if (paidAt) {
                payment.setPaidAt(paidAt);
            }
            payment.setGatewayMetadata(payload);
            await this.paymentRepository.update(payment);

            // Sync with Order status and manage stock if needed
            await this.syncOrderStatus(payment.order_id, newStatus);
        }
    }

    private async syncOrderStatus(orderId: string, paymentStatus: PaymentStatus): Promise<void> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) return;

        if (paymentStatus === PaymentStatus.SUCCEEDED) {
            order.setStatus(OrderStatus.PAID);
            await this.orderRepository.update(order);
        } else if (paymentStatus === PaymentStatus.FAILED || paymentStatus === PaymentStatus.EXPIRED) {
            order.setStatus(OrderStatus.CANCELLED);
            await this.orderRepository.update(order);

            // Restore product stock
            for (const item of order.items) {
                const product = await this.productRepository.findById(item.product_id);
                if (product) {
                    product.setStockQuantity(product.stock_quantity + item.quantity);
                    await this.productRepository.update(product);
                }
            }
        }
    }
}
