import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: MongoRepository<Order>,
    private readonly productsService: ProductsService,
  ) {}

  private toObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    return new ObjectId(id);
  }

  // Normalise a product into a stored snapshot so the order is self-contained.
  private snapshot(src: Record<string, any>) {
    return {
      id: String(src?.id ?? ''),
      name: src?.name ?? 'Unknown product',
      description: src?.description ?? '',
      price: Number(src?.price) || 0,
      imageUrl: src?.imageUrl ?? '',
      category: src?.category ?? '',
      stockQuantity: Number(src?.stockQuantity) || 0,
      createdAt: src?.createdAt ?? new Date().toISOString(),
    };
  }

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    const items: any[] = [];
    let subtotal = 0;

    for (const item of dto.items) {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      let product = this.snapshot(item.product);

      // If the product exists in the DB, use its authoritative price and
      // decrement its stock. Unknown products (e.g. demo data) are tolerated.
      if (ObjectId.isValid(product.id)) {
        let dbProduct: any = null;
        try {
          dbProduct = await this.productsService.findOne(product.id);
        } catch {
          dbProduct = null;
        }
        if (dbProduct) {
          // Throws BadRequest if there isn't enough stock — fails the order.
          await this.productsService.decrementStock(product.id, quantity);
          product = this.snapshot({ ...dbProduct, id: String(dbProduct.id) });
        }
      }

      const priceAtPurchase = product.price;
      subtotal += priceAtPurchase * quantity;
      items.push({ product, quantity, priceAtPurchase });
    }

    const shippingCost = Number(dto.shippingCost) || 0;
    const totalAmount = Math.round((subtotal + shippingCost) * 100) / 100;

    const order = this.ordersRepository.create({
      userId,
      status: OrderStatus.PENDING,
      totalAmount,
      shippingAddress: dto.shippingAddress ?? null,
      items,
    });

    return this.ordersRepository.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findAllForUser(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string, isAdmin = false): Promise<Order> {
    const order = await this.ordersRepository.findOneBy({
      _id: this.toObjectId(id),
    });
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }
    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.ordersRepository.findOneBy({
      _id: this.toObjectId(id),
    });
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    order.status = status;
    return this.ordersRepository.save(order);
  }
}
