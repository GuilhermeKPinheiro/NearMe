# NearMe

Monorepo do MVP do NearMe com backend NestJS/Prisma e app mobile Expo.

## Estrutura

- `apps/backend` - API NestJS + Prisma + PostgreSQL
- `apps/mobile` - app React Native + Expo Router

## Setup local

1. Garanta PostgreSQL local em `localhost:5432` com usuario `postgres` e senha `123456`.
2. Copie:
   - `apps/backend/.env.example` para `apps/backend/.env`
   - `apps/mobile/.env.example` para `apps/mobile/.env`
3. Rode `npm install` na raiz.
4. Rode `npm run db:setup`
5. Rode `npm run db:migrate`
6. Rode `npm run db:seed`

## Subir o MVP

1. Backend: `npm run dev:backend`
2. Mobile: `npm run dev:mobile`

O backend local roda em `http://localhost:3002`.

## Conta de teste

- email: `demo@nearme.app`
- senha: `123456`

## Fluxo validado localmente

- cadastro com email e senha
- login
- edicao de perfil
- ativacao de visibilidade
- listagem de pessoas proximas
- envio de conexao
- aceite de pedido recebido
- liberacao de links apos conexao
