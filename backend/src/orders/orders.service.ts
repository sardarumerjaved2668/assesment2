import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { ProductsService } from '../products/products.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: MongoRepository<Order>,
    private readonly productsService: ProductsService,
    private readonly cartService: CartService,
  ) {}

  // Mock payment processor. In test mode card 4242… succeeds, 4000…0002 is
  // declined. Swap this for Stripe in production.
  private processMockPayment(
    payment: Record<string, any>,
  ): { success: boolean; transactionId?: string; message?: string } {
    const card = String(payment?.cardNumber ?? '').replace(/\s/g, '');
    if (!card) {
      return { success: false, message: 'Payment details are required' };
    }
    if (card === '4000000000000002') {
      return { success: false, message: 'Your card was declined' };
    }
    if (!/^\d{13,19}$/.test(card)) {
      return { success: false, message: 'Invalid card number' };
    }
    return {
      success: true,
      transactionId: `mock_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`,
    };
  }

  // Convert the user's cart into a paid order.
  async checkout(userId: string, dto: CheckoutDto): Promise<Order> {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items.length) {
      throw new BadRequestException('Your cart is empty');
    }

    // Validate availability and stock before charging.
    for (const line of cart.items) {
      if (!line.product) {
        throw new BadRequestException(
          'A product in your cart is no longer available',
        );
      }
      if (line.product.stockQuantity < line.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${line.product.name}". Available: ${line.product.stockQuantity}`,
        );
      }
    }

    const shippingCost = Number(dto.shippingCost) || 0;
    const totalAmount =
      Math.round((cart.subtotal + shippingCost) * 100) / 100;

    // Process (mock) payment.
    const payment = this.processMockPayment(dto.payment);
    if (!payment.success) {
      throw new HttpException(
        payment.message || 'Payment failed',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Build order items and decrement stock.
    const items: any[] = [];
    for (const line of cart.items) {
      const product = line.product as Record<string, any>;
      await this.productsService.decrementStock(product.id, line.quantity);
      items.push({
        product,
        quantity: line.quantity,
        priceAtPurchase: product.price,
      });
    }

    const order = this.ordersRepository.create({
      userId,
      status: OrderStatus.PENDING,
      totalAmount,
      shippingAddress: dto.shippingAddress ?? null,
      paymentStatus: 'paid',
      transactionId: payment.transactionId,
      items,
    });

    const saved = await this.ordersRepository.save(order);

    // Empty the cart now that the order is placed.
    await this.cartService.clearCart(userId);

    return saved;
  }

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

  async getDashboardStats(): Promise<{
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
    topProducts: Array<{
      productId: string;
      name: string;
      imageUrl: string;
      category: string;
      price: number;
      sold: number;
      revenue: number;
    }>;
  }> {
    const orders = await this.ordersRepository.find();

    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Count orders by status
    const ordersByStatus: Record<string, number> = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const order of orders) {
      const s = order.status as string;
      if (s in ordersByStatus) {
        ordersByStatus[s]++;
      }
    }

    // Aggregate top-selling products from order items
    const productMap = new Map<
      string,
      { name: string; imageUrl: string; category: string; price: number; sold: number }
    >();

    for (const order of orders) {
      if (!Array.isArray(order.items)) continue;
      for (const item of order.items) {
        const product = item.product as Record<string, any>;
        if (!product) continue;
        const pid = String(product.id ?? product._id ?? '');
        if (!pid) continue;

        const existing = productMap.get(pid);
        if (existing) {
          existing.sold += Number(item.quantity) || 0;
        } else {
          productMap.set(pid, {
            name: product.name ?? 'Unknown',
            imageUrl: product.imageUrl ?? '',
            category: product.category ?? '',
            price: Number(item.priceAtPurchase ?? product.price) || 0,
            sold: Number(item.quantity) || 0,
          });
        }
      }
    }

    const topProducts = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        imageUrl: data.imageUrl,
        category: data.category,
        price: data.price,
        sold: data.sold,
        revenue: Math.round(data.price * data.sold * 100) / 100,
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    return {
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      ordersByStatus,
      topProducts,
    };
  }
}
