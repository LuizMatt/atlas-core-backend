# 🧪 Testes Unitários - Backend E-commerce

## 📁 Estrutura Criada

```
tests/
├── unit/
│   ├── models/
│   │   ├── Product.test.ts       # Testes do modelo Product
│   │   └── Customer.test.ts      # Testes do modelo Customer
│   └── services/
│       ├── ProductService.test.ts    # Testes do ProductService
│       └── CustomerService.test.ts   # Testes do CustomerService
├── helpers/
│   └── mocks.ts                  # Funções auxiliares para criar mocks
├── fixtures/
│   └── data.ts                   # Dados de teste reutilizáveis
└── setup.ts                      # Configuração global
```

## 🚀 Como Executar

```bash
# Rodar todos os testes
npm test

# Rodar com watch mode (reexecuta ao salvar)
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage

# Rodar apenas testes unitários
npm run test:unit
```

## 📊 Cobertura Atual

Os testes cobrem:

### ✅ Models
- **Product**: Validações de nome, preço, estoque, SKU, soft delete, low stock
- **Customer**: Validações de nome, email, taxId, phone, status, soft delete

### ✅ Services
- **ProductService**: 
  - Criação de produtos (com validação de SKU duplicado)
  - Busca por ID
  - Atualização de produtos
  - Deleção (soft delete)
  - Listagem com paginação
  - Upload de imagens
  - Produtos com estoque baixo

- **CustomerService**:
  - Criação de clientes (com hash de senha)
  - Validação de email duplicado
  - Busca por ID
  - Atualização de dados
  - Deleção (soft delete)
  - Listagem com paginação
  - Validação de credenciais (login)

## 🎯 Exemplos de Testes

### Teste de Validação (Model)
```typescript
it('should throw error for empty name', () => {
    const product = createTestProduct();
    expect(() => product.setName('')).toThrow('Product name cannot be empty');
});
```

### Teste de Lógica de Negócio (Service)
```typescript
it('should throw error if SKU already exists', async () => {
    mockRepository.findBySku.mockResolvedValue(createMockProduct());
    
    await expect(service.createProduct(validProductData))
        .rejects.toThrow('SKU already exists');
});
```

## 🔧 Tecnologias Utilizadas

- **Jest**: Framework de testes
- **ts-jest**: Suporte TypeScript
- **Mocks**: Isolamento de dependências

## 📝 Boas Práticas Implementadas

1. ✅ **Isolamento**: Cada teste é independente
2. ✅ **Mocks**: Repositories são mockados nos testes de Service
3. ✅ **Nomenclatura clara**: describe/it descrevem o comportamento
4. ✅ **AAA Pattern**: Arrange, Act, Assert
5. ✅ **Cobertura**: Testa casos de sucesso e erro

## 🎓 Próximos Passos

Para expandir os testes:

1. Adicionar testes de Controllers (com supertest)
2. Criar testes de integração com banco de dados
3. Adicionar testes E2E para fluxos completos
4. Implementar testes de performance

## 💡 Dicas

- Use `npm run test:watch` durante desenvolvimento
- Mantenha cobertura acima de 80%
- Teste sempre casos de erro, não só sucesso
- Mocks devem simular comportamento real
