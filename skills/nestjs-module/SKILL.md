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
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { [Name] } from './entities/[name].entity';

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

  async findAll(): Promise<[Name][]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<[Name]> {
    const item = await this.repo.findOneBy({ _id: this.toObjectId(id) });
    if (!item) throw new NotFoundException(`[Name] "${id}" not found`);
    return item;
  }

  async create(dto: Create[Name]Dto): Promise<[Name]> {
    const item = this.repo.create(dto);
    return this.repo.save(item);
  }

  async update(id: string, dto: Update[Name]Dto): Promise<[Name]> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: string): Promise<{ message: string }> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
    return { message: `[Name] deleted successfully` };
  }
}
```

---

## Step 5 — Create the controller

File: `backend/src/[name]/[name].controller.ts`

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('[name]s')
@Controller('[name]s')
export class [Name]Controller {
  constructor(private readonly [name]Service: [Name]Service) {}

  @Get()
  findAll() { return this.[name]Service.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.[name]Service.findOne(id); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  create(@Body() dto: Create[Name]Dto) { return this.[name]Service.create(dto); }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: Update[Name]Dto) {
    return this.[name]Service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  remove(@Param('id') id: string) { return this.[name]Service.remove(id); }
}
```

---

## Step 6 — Create the module file

File: `backend/src/[name]/[name].module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { [Name] } from './entities/[name].entity';
import { [Name]Service } from './[name].service';
import { [Name]Controller } from './[name].controller';

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

Read `backend/src/app.module.ts`, then add the new module to the `imports` array:

```typescript
import { [Name]Module } from './[name]/[name].module';

@Module({
  imports: [
    // ... existing modules
    [Name]Module,
  ],
})
```

---

## Step 8 — Verify

After writing all files, confirm:
- Entity is in `TypeOrmModule.forFeature([...])` in the module file
- Module is imported in `app.module.ts`
- All admin write routes have `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles('admin')`
- DTOs have `@ApiProperty` decorators for Swagger
- No hardcoded secrets or connection strings
