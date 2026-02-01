🗺️ PLANO DE AÇÃO - Fase 1: Foundation & Payment Integration
ETAPA 1: Modelagem de Dados (AGORA)
Objetivo: Criar models mínimos mas corretos para suportar multi-tenancy e pagamentos
1.1 Models Core (Prioridade ALTA)
📦 Store (Loja/Tenant)
├─ Dados da loja
├─ Configurações de pagamento
└─ Status (ativa/inativa)

👤 User (Cliente)
├─ Vinculado a uma Store
├─ Dados pessoais
├─ Credenciais (email/senha)
└─ Status da conta

📦 Product
├─ Pertence a uma Store
├─ Informações do produto
├─ Preço
├─ Estoque
└─ Status (ativo/inativo)

🛒 Order (Pedido)
├─ Pertence a User e Store
├─ Items do pedido
├─ Total
├─ Status (pending, paid, cancelled, shipped, delivered)
└─ Timestamps

💳 Payment
├─ Vinculado a Order
├─ Gateway usado (stripe, mercadopago, etc)
├─ ID externo do gateway
├─ Status (pending, processing, succeeded, failed, refunded)
├─ Metadata do gateway
└─ Webhooks recebidos
1.2 Models Secundários (Prioridade MÉDIA)
📦 OrderItem
├─ Vinculado a Order e Product
├─ Quantidade
├─ Preço unitário no momento da compra
└─ Subtotal

🔧 PaymentConfig
├─ Configurações por Store
├─ Credenciais do gateway (criptografadas)
├─ Gateway ativo
└─ Webhooks URL
1.3 Decisões Arquiteturais

Isolamento: store_id em todas as tabelas relevantes
Soft Delete: deleted_at para não perder histórico
Timestamps: created_at, updated_at em todas as tabelas
UUIDs vs Integers: Recomendar estratégia
Indexes: Definir quais campos precisam


ETAPA 2: Entender a Arquitetura MVC em Camadas
Objetivo: Você entender onde cada coisa fica e por quê
2.1 Estrutura de Camadas
📁 Controller (Recebe requisição HTTP)
   ↓ valida dados básicos
   ↓ chama Service
   
📁 Service (Lógica de negócio)
   ↓ orquestra operações
   ↓ aplica regras de negócio
   ↓ chama Repositories
   
📁 Repository/Model (Acesso a dados)
   ↓ queries no banco
   ↓ retorna dados
2.2 Exemplo Prático: Criar um Pedido
Controller (OrderController):
- Valida JSON da request
- Extrai user_id do JWT
- Chama OrderService.createOrder()

Service (OrderService):
- Valida se produtos existem e têm estoque
- Calcula total do pedido
- Verifica se a store está ativa
- Cria o pedido via OrderRepository
- Cria os items via OrderItemRepository
- Retorna pedido criado

Repository (OrderRepository):
- Order.create() com Sequelize
- Transações para garantir consistência

ETAPA 3: Integração de Pagamento (PRÓXIMA)
Objetivo: Processar pagamentos de forma segura e confiável
3.1 Escolher Gateway

 Definir gateway (Stripe/Mercado Pago/PagSeguro)
 Criar conta de testes
 Obter credenciais (API keys)

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

 Validar assinatura dos webhooks
 Idempotência (evitar duplicação)
 Logs de todas as transações
 Credenciais em variáveis de ambiente


ETAPA 4: Routes e Middlewares (PARALELO)
Objetivo: Endpoints seguros e bem estruturados
4.1 Middlewares Essenciais
- authMiddleware (valida JWT)
- tenantMiddleware (identifica Store pelo domínio)
- validationMiddleware (valida body/params com Zod)
- errorHandler (tratamento centralizado de erros)
4.2 Routes Principais
POST   /auth/register
POST   /auth/login
GET    /products
GET    /products/:id
POST   /orders (autenticado)
GET    /orders/:id (autenticado)
POST   /payments/create (autenticado)
POST   /webhooks/payment (público, mas validado)