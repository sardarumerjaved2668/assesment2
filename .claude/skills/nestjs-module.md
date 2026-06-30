---
name: nestjs-module
description: >
  Scaffold a complete NestJS module for the ShopNext e-commerce backend.
  Use this skill whenever the user wants to add a new backend module, endpoint,
  entity, service, or controller to the NestJS API. Triggers on phrases like
  "add a new module", "create a backend endpoint", "add a NestJS service",
  "I need an API for X", or "create an entity for X". Handles MongoDB TypeORM
  entities, DTOs with class-validator, service, controller, module file, and
  wiring into app.module.ts automatically — following the exact patterns used
  in this project.
---

# NestJS Module Creator — ShopNext Backend

You are adding a new module to the ShopNext NestJS backend (`company-test/backend/src/`).

## Stack conventions (follow exactly)
- **Database**: MongoDB via TypeORM `MongoRepository` — NOT a SQL repository
- **Entity IDs**: `@ObjectIdColumn() _id: ObjectId` — serialise to string `id` via a getter
- **Guards**: `JwtAuthGuard + RolesGuard + @Roles('admin')` on all admin write endpoints
- **Validation**: `class-validator` decorators on all DTOs
- **Config**: all env values via `ConfigService` — never hardcode
- **Swagger**: `@ApiProperty` / `@ApiPropertyOptional` on all DTO fields

---

## Step 1 — Read existing modules for reference

Before writing anything, read one similar existing module to match the pattern exactly:

```
backend/src/products/products.service.ts
backend/src/products/products.controller.ts
backend/src/products/products.module.ts
backend/src/products/entities/product.entity.ts
backend/src/products/dto/create-product.dto.ts
```

---

## Step 2 — Create the entity

File: `backend/src/[name]/entities/[name].entity.ts`

```typescript
import { Entity, Column, CreateDateColumn, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('[name]s')
export class [Name] {
  @ObjectIdColumn()
  _id: ObjectId;

  get id(): string {
    return this._id?.toHexString();
  }

  @Column()
  // ... fields

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## Step 3 — Create DTOs

File: `backend/src/[name]/dto/create-[name].dto.ts`

```typescript
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Create[Name]Dto {
  @ApiProperty({ example: 'Example value' })
  @IsString()
  @IsNotEmpty()
  fieldName: string;
}
```

Create `update-[name].dto.ts` using `PartialType(Create[Name]Dto)`.

---

## Step 4 — Create the service

File: `backend/src/[name]/[name].service.ts`

```typescript
@Injectable()
export class [Name]Service {
  constructor(
    @InjectRepository([Name])
    private readonly repo: MongoRepository<[Name]>,
  ) {}

  private toObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) throw new NotFoundException(`[Name] "${id}" not found`);
    return new ObjectId(id);
  }

  async findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  async findOne(id: string) {
    const item = await this.repo.findOneBy({ _id: this.toObjectId(id) });
    if (!item) throw new NotFoundException(`[Name] "${id}" not found`);
    return item;
  }
  async create(dto: Create[Name]Dto) { return this.repo.save(this.repo.create(dto)); }
  async update(id: string, dto: Update[Name]Dto) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }
  async remove(id: string) {
    await this.repo.remove(await this.findOne(id));
    return { message: '[Name] deleted successfully' };
  }
}
```

---

## Step 5 — Create the controller

All admin write routes get `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('admin')` + `@ApiBearerAuth()`.

---

## Step 6 — Create the module file

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([[Name]])],
  controllers: [[Name]Controller],
  providers: [[Name]Service],
  exports: [[Name]Service],
})
export class [Name]Module {}
```

---

## Step 7 — Register in app.module.ts

Add `[Name]Module` to the `imports` array in `src/app.module.ts`.

---

## Checklist
- Entity uses `@ObjectIdColumn` + `id` getter
- Module registered in `app.module.ts`
- Admin write routes have `JwtAuthGuard + RolesGuard + @Roles('admin')`
- DTOs have `@ApiProperty` decorators
- No hardcoded secrets or connection strings
