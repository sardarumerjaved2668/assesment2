import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, HttpException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { ProductsService } from '../products/products.service';
import { CartService } from '../cart/cart.service';

const makeProduct = (overrides = {}) => ({
  id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  name: 'Widget',
  price: 19.99,
  stockQuantity: 10,
  imageUrl: '',
  category: 'Tools',
  description: '',
  createdAt: new Date().toISOString(),
  ...overrides,
});

const makeCart = (items: any[] = []) => ({
  items,
  itemCount: items.reduce((s, i) => s + i.quantity, 0),
  subtotal: items.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0),
  total: items.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0),
});

const validCheckoutDto = (cardNumber = '4242424242424242') => ({
  shippingAddress: { street: '1 Main St', city: 'Testville', country: 'UK' },
  payment: { cardNumber },
  shippingCost: 0,
});

describe('OrdersService', () => {
  let service: OrdersService;

  const mockOrdersRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockProductsService = {
    findOne: jest.fn(),
    decrementStock: jest.fn(),
  };

  const mockCartService = {
    getCart: jest.fn(),
    clearCart: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrdersRepo },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: CartService, useValue: mockCartService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  // ── Mock payment ───────────────────────────────────────────────────────────

  describe('checkout — mock payment', () => {
    const product = makeProduct();

    beforeEach(() => {
      const cartItem = { product, quantity: 1, productId: product.id, lineTotal: 19.99 };
      mockCartService.getCart.mockResolvedValue(makeCart([cartItem]));
      mockProductsService.decrementStock.mockResolvedValue({ ...product, stockQuantity: 9 });
      mockOrdersRepo.create.mockImplementation((dto) => dto);
      mockOrdersRepo.save.mockImplementation(async (o) => ({ ...o, id: 'order1' }));
      mockCartService.clearCart.mockResolvedValue(makeCart([]));
    });

    it('creates an order when the success card is used', async () => {
      const order = await service.checkout('user1', validCheckoutDto('4242424242424242'));
      expect(order).toBeDefined();
      expect(mockOrdersRepo.save).toHaveBeenCalled();
    });

    it('rejects with 402 when the decline card is used', async () => {
      await expect(
        service.checkout('user1', validCheckoutDto('4000000000000002')),
      ).rejects.toThrow(HttpException);
    });

    it('rejects with HttpException when payment details are missing', async () => {
      const dto = { ...validCheckoutDto(''), payment: {} };
      await expect(service.checkout('user1', dto as any)).rejects.toThrow(HttpException);
    });

    it('rejects with HttpException for a non-numeric card number', async () => {
      await expect(
        service.checkout('user1', validCheckoutDto('not-a-card')),
      ).rejects.toThrow(HttpException);
    });
  });

  // ── Stock validation ───────────────────────────────────────────────────────

  describe('checkout — stock validation', () => {
    it('throws BadRequestException when cart item quantity exceeds available stock', async () => {
      const product = makeProduct({ stockQuantity: 1 });
      const cartItem = { product, quantity: 5, productId: product.id, lineTotal: 99.95 };
      mockCartService.getCart.mockResolvedValue(makeCart([cartItem]));

      await expect(
        service.checkout('user1', validCheckoutDto()),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for an empty cart', async () => {
      mockCartService.getCart.mockResolvedValue(makeCart([]));

      await expect(
        service.checkout('user1', validCheckoutDto()),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when a cart item product is unavailable', async () => {
      const cartItem = { product: null, quantity: 1, productId: 'deleted', lineTotal: 0 };
      mockCartService.getCart.mockResolvedValue(makeCart([cartItem]));

      await expect(
        service.checkout('user1', validCheckoutDto()),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── Order total calculation ────────────────────────────────────────────────

  describe('checkout — order total', () => {
    it('includes shipping cost in the order total', async () => {
      const product = makeProduct({ price: 10 });
      const cartItem = { product, quantity: 2, productId: product.id, lineTotal: 20 };
      mockCartService.getCart.mockResolvedValue({
        ...makeCart([cartItem]),
        subtotal: 20,
        total: 20,
      });
      mockProductsService.decrementStock.mockResolvedValue(product);
      mockOrdersRepo.create.mockImplementation((dto) => dto);
      mockOrdersRepo.save.mockImplementation(async (o) => ({ ...o, id: 'order2' }));
      mockCartService.clearCart.mockResolvedValue(makeCart([]));

      const dto = { ...validCheckoutDto(), shippingCost: 5 };
      const order = await service.checkout('user1', dto as any);

      expect(order.totalAmount).toBe(25);
    });
  });
});
