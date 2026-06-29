import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface FindCategoriesQuery {
  search?: string;
  isActive?: boolean | string;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: MongoRepository<Category>,
  ) {}

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private toObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return new ObjectId(id);
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = this.slugify(dto.name);

    const existing = await this.categoryRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = this.categoryRepo.create({
      ...dto,
      slug,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });
    return this.categoryRepo.save(category);
  }

  async findAll(query: FindCategoriesQuery = {}): Promise<Category[]> {
    const { search, isActive } = query;
    const where: Record<string, any> = {};

    if (search?.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      where.$or = [{ name: regex }, { description: regex }];
    }

    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === true || isActive === 'true';
    }

    return this.categoryRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { _id: this.toObjectId(id) } as any,
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { slug } });
    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.name && dto.name !== category.name) {
      const newSlug = this.slugify(dto.name);
      const existing = await this.categoryRepo.findOne({
        where: { slug: newSlug },
      });
      if (existing && existing.id.toString() !== id) {
        throw new ConflictException('Category with this name already exists');
      }
      category.slug = newSlug;
    }

    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.findOne(id);
    await this.categoryRepo.remove(category);
    return { message: `Category "${category.name}" deleted successfully` };
  }

  async toggleActive(id: string): Promise<Category> {
    const category = await this.findOne(id);
    category.isActive = !category.isActive;
    return this.categoryRepo.save(category);
  }
}
