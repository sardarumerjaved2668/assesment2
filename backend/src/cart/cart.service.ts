import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';

export interface CartLine {
  productId: string;
  quantity: number;
  product: Record<string, any> | null;
  lineTotal: number;
}

export interface CartSummary {
  items: CartLine[];
  itemCount: number; // total quantity across all lines
  subtotal: number;
  total: number;
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: MongoRepository<CartItem>,
    private readonly productsService: ProductsService,
  ) {}

  // Build the full cart view for a user, joining live product data.
  async getCart(userId: string): Promise<CartSummary> {
    const rows = await this.cartRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    const items: CartLine[] = [];
    let subtotal = 0;
    let itemCount = 0;

    for (const row of rows) {
      let product: Record<string, any> | null = null;
      try {
        const p: any = await this.productsService.findOne(row.productId);
        product = {
          id: String(p.id),
          name: p.name,
          description: p.description ?? '',
          price: Number(p.price) || 0,
          imageUrl: p.imageUrl ?? '',
          category: p.category ?? '',
          stockQuantity: Number(p.stockQuantity) || 0,
          createdAt: p.createdAt ?? new Date().toISOString(),
        };
      } catch {
        // Product was deleted — keep the line but mark product as null.
        product = null;
      }

      const price = product ? product.price : 0;
      const lineTotal = Math.round(price * row.quantity * 100) / 100;
      subtotal += lineTotal;
      itemCount += row.quantity;

      items.push({
        productId: row.productId,
        quantity: row.quantity,
        product,
        lineTotal,
      });
    }

    return {
      items,
      itemCount,
      subtotal: Math.round(subtotal * 100) / 100,
      total: Math.round(subtotal * 100) / 100,
    };
  }

  async addItem(
    userId: string,
    productId: string,
    quantity = 1,
  ): Promise<CartSummary> {
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));

    // Validate the product exists and has stock.
    const product: any = await this.productsService.findOne(productId);

    const existing = await this.cartRepository.findOneBy({ userId, productId });
    const desired = (existing?.quantity ?? 0) + qty;

    if (product.stockQuantity != null && desired > product.stockQuantity) {
      throw new BadRequestException(
        `Only ${product.stockQuantity} unit(s) of "${product.name}" are in stock`,
      );
    }

    if (existing) {
      existing.quantity = desired;
      await this.cartRepository.save(existing);
    } else {
      const item = this.cartRepository.create({ userId, productId, quantity: qty });
      await this.cartRepository.save(item);
    }

    return this.getCart(userId);
  }

  async updateQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartSummary> {
    const qty = Math.floor(Number(quantity));

    if (isNaN(qty) || qty < 0) {
      throw new BadRequestException('quantity must be 0 or a positive whole number');
    }

    // Quantity 0 removes the item.
    if (qty === 0) {
      return this.removeItem(userId, productId);
    }

    const existing = await this.cartRepository.findOneBy({ userId, productId });
    if (!existing) {
      // Treat as an add if it wasn't in the cart yet.
      return this.addItem(userId, productId, qty);
    }

    const product: any = await this.productsService.findOne(productId);
    if (product.stockQuantity != null && qty > product.stockQuantity) {
      throw new BadRequestException(
        `Only ${product.stockQuantity} unit(s) of "${product.name}" are in stock`,
      );
    }

    existing.quantity = qty;
    await this.cartRepository.save(existing);
    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string): Promise<CartSummary> {
    await this.cartRepository.deleteMany({ userId, productId });
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<CartSummary> {
    await this.cartRepository.deleteMany({ userId });
    return this.getCart(userId);
  }
}
