## Arquitetura do Projeto

Este projeto segue uma **arquitetura MVC em camadas**, separando responsabilidades entre apresentação, lógica de negócio e acesso a dados.

### Visão Geral

- **routes** → definição de rotas HTTP
- **controllers** → recebem requisições e retornam respostas
- **services** → lógica de negócio e regras da aplicação
- **models** → representação de dados e entidades
- **middlewares** → interceptadores HTTP (auth, validação, etc.)
- **config** → configurações (DB, variáveis de ambiente)
- **main** → bootstrap da aplicação

---

### Estrutura de Pastas

```txt
src/
├─ routes/                 # definição das rotas
│
├─ controllers/            # controllers HTTP
│                          # (request → service → response)
│
├─ services/               # lógica de negócio
│                          # (regras da aplicação)
│
├─ models/                 # entidades e tipos
│
├─ middlewares/            # middlewares HTTP
│                          # (autenticação, validação, etc.)
│
├─ config/                 # configurações
│  └─ config.ts            # conexão com banco de dados
│
└─ main/
   └─ server.ts            # bootstrap da aplicação
