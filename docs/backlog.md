# 📋 Backlog de Tarefas - Atlas Core Backend

Este documento lista as tarefas pendentes para a conclusão da Fase 1, com foco na integração com **AbacatePay**.

---

## ✅ Concluído: Refatoração e Padronização (Maio/2026)
- [x] **Remoção de `store_id`**: Removido de todo o fluxo de Cart e Order (Models, Controllers, Services, Repositories).
- [x] **Nomenclatura**: Padronização de arquivos para PascalCase em Controllers e camelCase em Routes.
- [x] **Registro de Rotas**: Ativação das rotas de Cart e Order no `server.ts`.
- [x] **Otimização N+1**: Refatoração do `OrderRepository` para usar batch loading.
- [x] **Validação de Cliente**: Garantia de que operações de Cart/Order validam a existência do cliente.
- [x] **Segurança**: Adição de verificações de existência em updates de repositório.

---

## 🛒 1. Fluxo de Checkout e Estoque ✅ DONE
Objetivo: Garantir que o carrinho se transforme em pedido corretamente.

- [x] **Lógica de Conversão**
  - [x] Implementar em `OrderService` o método para criar pedido a partir de um `Cart`.
  - [x] Limpar o carrinho após o checkout bem-sucedido.

- [x] **Gestão de Estoque**
  - [x] Diminuir `stock_quantity` no `Product` ao criar o pedido.
  - [x] Implementar lógica de reposição de estoque caso o pedido seja cancelado.

---

## 💳 2. Integração AbacatePay (Próximo Passo)
Objetivo: Implementar o fluxo de pagamento ponta a ponta.

- [ ] **Modelagem e Dados**
  - [ ] Criar modelo `Payment` em `src/models/Payment.ts` (conforme especificação).
  - [ ] Criar `PaymentRepository` para persistência.
  - [ ] Criar migração para a tabela `payments`.

- [ ] **Service Layer**
  - [ ] Criar `PaymentService.ts`.
  - [ ] Implementar integração com a API do AbacatePay (SDK ou Fetch).
  - [ ] Método `createPaymentIntent`: Criar cobrança no gateway e salvar registro no banco vinculado à `Order`.
  - [ ] Método `handleWebhook`: Processar notificações de mudança de status (Paid, Expired, Refunded).

- [ ] **API e Rotas**
  - [ ] Criar `PaymentController.ts`.
  - [ ] Criar rota `POST /payments/create` (autenticada).
  - [ ] Criar rota `POST /webhooks/abacatepay` (pública, com validação de assinatura).

---

## 🧪 3. Testes e Qualidade
Objetivo: Garantir estabilidade nas novas funcionalidades.

- [ ] **Testes de Unidade**
  - [ ] Criar `tests/unit/services/OrderService.test.ts`.
  - [ ] Criar `tests/unit/services/CartService.test.ts`.
  - [ ] Criar `tests/unit/services/PaymentService.test.ts`.

- [ ] **Testes de Integração**
  - [ ] Testar fluxo completo: Adicionar ao Carrinho -> Checkout -> Simulação de Webhook de Pagamento.

---

## 🔒 4. Segurança e Ajustes Finais
- [ ] Validar assinatura dos webhooks do AbacatePay para evitar ataques.
- [ ] Garantir que todas as rotas de Admin em `adminRoutes.ts` possuam o middleware de autorização correto.
- [ ] Configurar variáveis de ambiente (`.env`) para as chaves do AbacatePay.

---

## 📝 Notas
- Gateway definido: **AbacatePay**.
- Documentação de referência: [docs.abacatepay.com](https://docs.abacatepay.com)
