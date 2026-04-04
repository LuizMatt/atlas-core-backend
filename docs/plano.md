🗺️ PLANO DE AÇÃO - Fase 1: Foundation & Payment Integration

ETAPA 1: Modelagem de Dados ✅ DONE
Objetivo: Models mínimos mas corretos para suportar pagamentos

1.1 Models Core (Prioridade ALTA) ✅
👤 Customer
├─ Dados pessoais
├─ Credenciais (email/senha)
└─ Status da conta

📦 Product
├─ Informações do produto
├─ Preço
├─ Estoque
└─ Status (ativo/inativo)

🛒 Order (Pedido) — A IMPLEMENTAR
├─ Pertence a Customer
├─ Items do pedido
├─ Total
├─ Status (pending, paid, cancelled, shipped, delivered)
└─ Timestamps

💳 Payment — A IMPLEMENTAR
├─ Vinculado a Order
├─ Gateway usado
├─ ID externo do gateway
├─ Status (pending, processing, succeeded, failed, refunded)
└─ Webhooks recebidos

1.2 Models Secundários (Prioridade MÉDIA)
🛒 Cart — A IMPLEMENTAR
├─ Vinculado a Customer
├─ Status (active, converted, abandoned)
└─ Timestamps

📦 CartItem — A IMPLEMENTAR
├─ Vinculado a Cart e Product
├─ Quantidade
└─ Preço unitário no momento da adição

📦 OrderItem — A IMPLEMENTAR
├─ Vinculado a Order e Product
├─ Quantidade
├─ Preço unitário no momento da compra
└─ Subtotal

1.3 Decisões Arquiteturais
- Soft Delete: deleted_at para não perder histórico
- Timestamps: created_at, updated_at em todas as tabelas
- UUIDs como PK
- Single-tenant (uma marca)

ETAPA 2: Arquitetura MVC em Camadas ✅ DONE
2.1 Estrutura de Camadas
📁 Controller (Recebe requisição HTTP)
   ↓ valida dados básicos
   ↓ chama Service

📁 Service (Lógica de negócio)
   ↓ orquestra operações
   ↓ aplica regras de negócio
   ↓ chama Repositories

📁 Repository (Acesso a dados)
   ↓ queries no banco
   ↓ retorna dados

ETAPA 3: Integração de Pagamento (PRÓXIMA)
Objetivo: Processar pagamentos de forma segura e confiável

3.1 Escolher Gateway
- Definir gateway (AbacatePay / Stripe / MercadoPago)
- Criar conta de testes
- Obter credenciais (API keys)

3.2 Implementar Payment Service
PaymentService:
├─ createPaymentIntent() - inicia pagamento
├─ confirmPayment() - confirma pagamento
├─ handleWebhook() - processa notificações
├─ refundPayment() - estornos
└─ getPaymentStatus() - consulta status

3.3 Fluxo de Pagamento
1. Cliente finaliza pedido → Order criada (status: pending)
2. Controller chama PaymentService.createPaymentIntent()
3. Service cria Payment (status: pending)
4. Retorna dados para frontend processar
5. Gateway processa pagamento
6. Webhook recebido → PaymentService.handleWebhook()
7. Atualiza Payment e Order status

3.4 Segurança
- Validar assinatura dos webhooks
- Idempotência (evitar duplicação)
- Logs de todas as transações
- Credenciais em variáveis de ambiente

ETAPA 4: Routes e Middlewares (PARALELO)
Objetivo: Endpoints seguros e bem estruturados

4.1 Middlewares Essenciais
- authMiddleware (valida JWT)
- validationMiddleware (valida body/params com Zod)
- errorHandler (tratamento centralizado de erros)

4.2 Routes Principais
POST   /auth/register
POST   /auth/login
GET    /products
GET    /products/:id
GET    /cart (autenticado)
POST   /cart/items (autenticado)
PUT    /cart/items/:id (autenticado)
DELETE /cart/items/:id (autenticado)
POST   /cart/checkout (autenticado) → converte Cart em Order
POST   /orders (autenticado)
GET    /orders/:id (autenticado)
POST   /payments/create (autenticado)
POST   /webhooks/payment (público, mas validado)
