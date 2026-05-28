export interface TransparentCheckoutRequest {
    amount: number; // in cents
    description?: string;
    expiresIn?: number; // seconds
    customer?: {
        name: string;
        email: string;
        taxId: string;
        cellphone: string;
    };
    metadata?: Record<string, any>;
}

export interface TransparentCheckoutResponse {
    id: string;
    amount: number;
    status: string;
    pix?: {
        brCode: string;
        brCodeBase64: string;
        expiresAt: string;
    };
    [key: string]: any;
}

export class AbacatePayClient {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = process.env.ABACATEPAY_API_KEY || '';
        this.baseUrl = process.env.ABACATEPAY_BASE_URL || 'https://api.abacatepay.com/v2';
    }

    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };
    }

    async createTransparentCheckout(data: TransparentCheckoutRequest): Promise<TransparentCheckoutResponse> {
        if (!this.apiKey) {
            throw new Error('ABACATEPAY_API_KEY is not configured');
        }

        const url = `${this.baseUrl}/transparents/create`;
        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ data })
        });

        const json = await response.json() as any;

        if (!response.ok || !json.success) {
            const errorMsg = json.error || `HTTP error! status: ${response.status}`;
            throw new Error(`AbacatePay API Error: ${errorMsg}`);
        }

        return json.data;
    }

    async checkPaymentStatus(id: string): Promise<TransparentCheckoutResponse> {
        if (!this.apiKey) {
            throw new Error('ABACATEPAY_API_KEY is not configured');
        }

        const url = `${this.baseUrl}/transparents/check?id=${id}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders()
        });

        const json = await response.json() as any;

        if (!response.ok || !json.success) {
            const errorMsg = json.error || `HTTP error! status: ${response.status}`;
            throw new Error(`AbacatePay API Error: ${errorMsg}`);
        }

        return json.data;
    }
}
