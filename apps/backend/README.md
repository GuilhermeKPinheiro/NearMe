# NearMe Backend

API do MVP do NearMe com NestJS, Prisma e PostgreSQL.

## Rodar localmente

1. Copie `.env.example` para `.env`
2. Rode `npm run db:setup`
3. Rode `npm run prisma:migrate:dev`
4. Rode `npm run db:seed`
5. Rode `npm run start:dev`

## Porta

- `3002`

## Endpoints principais

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/profile/me`
- `PUT /api/profile/me`
- `POST /api/visibility/start`
- `POST /api/visibility/stop`
- `GET /api/nearby/users`
- `POST /api/connections/request`
- `POST /api/connections/:id/accept`
- `GET /api/connections`
