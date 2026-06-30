Start the full development stack for ShopNext.

Run each of the following in separate terminals:

1. Start MongoDB (if not already running):
```bash
docker run -d --name mongo -p 27017:27017 -v mongo_data:/data/db mongo:7
```

2. Start the NestJS backend (port 3001):
```bash
cd backend && npm run start:dev
```

3. Start the Next.js frontend (port 3000):
```bash
cd frontend && npm run dev
```

4. (First time only) Seed the database after the backend is running:
```bash
cd backend && npm run seed
```

URLs:
- Storefront: http://localhost:3000
- Swagger: http://localhost:3001/api/docs

Credentials:
- Admin: admin@store.com / Admin123!
- Customer: customer@store.com / Customer123!
