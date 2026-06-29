# Backend Agent — Prompt & Instructions

## Role
You are the BACKEND AGENT for a full-stack e-commerce assessment. Build a complete NestJS backend with TypeORM + PostgreSQL and JWT authentication.

## Working Directory
`company-test/backend/`

## Tech Stack
- NestJS + TypeScript
- TypeORM + PostgreSQL
- Passport + passport-jwt + passport-local
- bcrypt (12 rounds)
- class-validator + class-transformer
- @nestjs/config (ConfigModule)
- @nestjs/swagger (OpenAPI docs)

## What Already Exists (do not recreate)
- `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `.env.example`
- `src/config/database.config.ts` — TypeORM config via ConfigModule
- `src/config/jwt.config.ts` — JWT config
- `src/users/entities/user.entity.ts` — User entity (id, email, password, firstName, lastName, role)
- `src/users/users.service.ts` — findByEmail, findById, create, findAll
- `src/users/users.controller.ts`, `src/users/users.module.ts`
- `src/products/entities/product.entity.ts`
- `src/orders/entities/order.entity.ts`, `src/orders/entities/order-item.entity.ts`
- `src/cart/entities/cart-item.entity.ts`
- `src/auth/dto/register.dto.ts`, `src/auth/dto/login.dto.ts`

## What to Build

### Core App Files
- `src/main.ts` — Bootstrap: global pipes, CORS, validation, Swagger
- `src/app.module.ts` — Root module: ConfigModule, TypeORM, all feature modules
- `src/app.controller.ts` — Health check endpoint GET /health
- `src/app.service.ts` — App service

### Auth Module (FULL IMPLEMENTATION)
- `src/auth/auth.module.ts`
- `src/auth/auth.controller.ts` — POST /auth/register, POST /auth/login, GET /auth/me
- `src/auth/auth.service.ts` — register, login, validateUser
- `src/auth/strategies/jwt.strategy.ts` — JwtStrategy extending PassportStrategy
- `src/auth/strategies/local.strategy.ts` — LocalStrategy
- `src/auth/guards/jwt-auth.guard.ts` — @UseGuards(JwtAuthGuard)
- `src/auth/guards/local-auth.guard.ts` — @UseGuards(LocalAuthGuard)
- `src/auth/guards/roles.guard.ts` — checks @Roles() decorator
- `src/auth/decorators/current-user.decorator.ts` — @CurrentUser()
- `src/auth/decorators/roles.decorator.ts` — @Roles('admin')

### Stub Modules (compile but return 501)
- `src/products/products.module.ts`, `products.controller.ts`, `products.service.ts`
- `src/orders/orders.module.ts`, `orders.controller.ts`, `orders.service.ts`
- `src/cart/cart.module.ts`, `cart.controller.ts`, `cart.service.ts`

### Seed Script
- `src/seed/seed.ts` — Creates admin + customer + 12 products (idempotent)

### Tests
- `test/auth.e2e-spec.ts` — E2E tests for all auth endpoints
- `test/jest-e2e.json`

## Auth Flow
1. POST /auth/register → validate DTO → check email unique → hash pw → save → return { access_token, user }
2. POST /auth/login → validate credentials → compare bcrypt → return { access_token, user }
3. GET /auth/me → JWT guard → return current user (no password)
4. JWT payload: { sub: userId, email: string, role: UserRole }
5. JWT expiry: 7d from env JWT_EXPIRES_IN

## Error Handling
- ConflictException (409) for duplicate email
- UnauthorizedException (401) for bad credentials or missing token
- NotFoundException (404) for missing resources
- Use global ValidationPipe: whitelist, forbidNonWhitelisted, transform

## CORS
Enable for http://localhost:3000 in main.ts

## Seed Credentials
- admin@store.com / Admin123! (role: admin)
- customer@store.com / Customer123! (role: customer)
- 12 products across Electronics, Clothing, Books, Home categories
