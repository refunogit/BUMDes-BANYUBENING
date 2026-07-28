# Instalasi BUMDes Banyubening

## Prasyarat
- Node 20+, Postgres 15+, Redis 7+ (opsional)

## Backend
1. cd backend && cp ../.env.example .env
2. Edit DATABASE_URL, JWT_SECRET, PIN_CODE
3. npm install
4. npx prisma migrate dev
5. npm run prisma:seed
6. npm run dev

## Frontend
1. cd frontend && npm install
2. echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1" > .env.local
3. npm run dev

## Docker
docker-compose up --build -d
