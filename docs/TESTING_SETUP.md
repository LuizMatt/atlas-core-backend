# 🧪 Setup de Testes - Backend E-commerce

## 📦 Instalação de Dependências

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest @faker-js/faker
```

## ⚙️ Configuração

### 1. jest.config.js
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main/server.ts',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000
};
```

### 2. Adicionar scripts no package.json
```json
{
  "scripts": {
    "test": "jest --verbose",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e"
  }
}
```

### 3. Criar .env.test
```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_test
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=test_secret_key
```

## 🎯 Tipos de Testes

### Unit Tests (Isolados)
- Testam lógica de negócio pura
- Mockam dependências externas
- Rápidos e independentes

### Integration Tests
- Testam integração com banco de dados
- Usam banco de teste real
- Validam queries e transações

### E2E Tests
- Testam API completa
- Simulam requisições HTTP reais
- Validam fluxo completo

## 📁 Estrutura Criada

```
tests/
├── unit/              # Testes unitários
├── integration/       # Testes de integração
├── e2e/              # Testes end-to-end
├── fixtures/         # Dados de teste
├── helpers/          # Utilitários
└── setup.ts          # Setup global
```

## 🚀 Comandos

```bash
# Rodar todos os testes
npm test

# Rodar com watch mode
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage

# Rodar apenas testes unitários
npm run test:unit

# Rodar apenas testes de integração
npm run test:integration

# Rodar apenas testes E2E
npm run test:e2e
```

## 📊 Cobertura Recomendada

- **Services**: 90%+ (lógica crítica)
- **Controllers**: 80%+
- **Repositories**: 80%+
- **Models**: 70%+

## 🔧 Próximos Passos

1. Instalar dependências
2. Criar configuração do Jest
3. Criar estrutura de pastas
4. Implementar helpers de teste
5. Escrever primeiros testes
