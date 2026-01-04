## Arquitetura do Projeto

Este projeto segue uma abordagem inspirada em **Clean Architecture / DDD**, separando regras de negócio da infraestrutura e do framework.

### Visão Geral

- **domain** → regras de negócio (núcleo do sistema)
- **application** → casos de uso (orquestra o domínio)
- **presentation** → camada HTTP (controllers, rotas)
- **infra** → implementações externas (DB, ORM, serviços)
- **shared** → código reutilizável e genérico
- **main** → bootstrap da aplicação

---

### Estrutura de Pastas

```txt
src/
├─ domain/                 # negócio puro (não depende de nada)
│  ├─ entities/            # entidades do domínio
│  ├─ value-objects/       # objetos de valor (Email, Money, etc.)
│  └─ repositories/        # interfaces de repositórios
│
├─ application/            # regras de aplicação
│  ├─ use-cases/           # casos de uso (CreateUser, CreateOrder, etc.)
│  └─ dtos/                # DTOs de entrada e saída
│
├─ infra/                  # detalhes de infraestrutura
│  ├─ db/                  # conexão com banco / ORM
│  └─ repositories/        # implementações dos repositórios (Prisma, etc.)
│
├─ presentation/           # camada de entrada (HTTP)
│  └─ http/
│     ├─ controllers/      # controllers (request → use case → response)
│     ├─ routes/           # definição das rotas
│     └─ middlewares/      # middlewares HTTP
│
├─ shared/                 # código reutilizável
│  ├─ errors/              # erros globais da aplicação
│  └─ utils/               # helpers genéricos
│
└─ main/
   └─ server.ts            # bootstrap da aplicação
