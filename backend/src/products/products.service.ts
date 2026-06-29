import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface FindProductsQuery {
  search?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(query: FindProductsQuery = {}): Promise<ProductsResponse> {
    const {
      search,
      category,
      priceMin,
      priceMax,
      sortBy = 'newest',
      page = 1,
      limit = 12,
    } = query;

    const qb = this.productsRepository.createQueryBuilder('product');

    if (search?.trim()) {
      qb.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    if (category && category !== 'All') {
      qb.andWhere('product.category = :category', { category });
    }

    if (priceMin !== undefined && priceMin > 0) {
      qb.andWhere('product.price >= :priceMin', { priceMin });
    }

    if (priceMax !== undefined && priceMax > 0) {
      qb.andWhere('product.price <= :priceMax', { priceMax });
    }

    switch (sortBy) {
      case 'price-asc':
        qb.orderBy('product.price', 'ASC');
        break;
      case 'price-desc':
        qb.orderBy('product.price', 'DESC');
        break;
      case 'oldest':
        qb.orderBy('product.createdAt', 'ASC');
        break;
      case 'newest':
      default:
        qb.orderBy('product.createdAt', 'DESC');
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    qb.skip(skip).take(safeLimit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  async findByCategory(category: string, excludeId?: string): Promise<Product[]> {
    const qb = this.productsRepository
      .createQueryBuilder('product')
      .where('product.category = :category', { category });

    if (excludeId) {
      qb.andWhere('product.id != :excludeId', { excludeId });
    }

    return qb.take(4).orderBy('product.createdAt', 'DESC').getMany();
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(dto);
    return this.productsRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Validate price if provided
    if (dto.price !== undefined && dto.price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    // Validate stock if provided
    if (dto.stockQuantity !== undefined && dto.stockQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    Object.assign(product, dto);
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
    return { message: `Product "${product.name}" deleted successfully` };
  }

  async decrementStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    if (product.stockQuantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${quantity}`,
      );
    }
    product.stockQuantity -= quantity;
    return this.productsRepository.save(product);
  }

  async getStats(): Promise<{
    totalProducts: number;
    outOfStock: number;
    lowStock: number;
    byCategory: Record<string, number>;
  }> {
    const all = await this.productsRepository.find();
    const byCategory: Record<string, number> = {};
    let outOfStock = 0;
    let lowStock = 0;

    for (const p of all) {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
      if (p.stockQuantity === 0) outOfStock++;
      else if (p.stockQuantity <= 10) lowStock++;
    }

    return {
      totalProducts: all.length,
      outOfStock,
      lowStock,
      byCategory,
    };
  }
}
