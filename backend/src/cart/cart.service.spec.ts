import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';

const makeProduct = (overrides = {}) => ({
  id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  name: 'Gadget',
  price: 9.99,
  stockQuantity: 5,
  imageUrl: '',
  category: 'Gadgets',
  description: '',
  createdAt: new Date().toISOString(),
  ...overrides,
});

const makeCartRow = (overrides = {}): CartItem =>
  ({
    userId: 'user1',
    productId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
    quantity: 1,
    createdAt: new Date(),
    ...overrides,
  } as unknown as CartItem);

describe('CartService', () => {
  let service: CartService;

  const mockCartRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockProductsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(CartItem), useValue: mockCartRepo },
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  // ── addItem ────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('creates a new cart row when the product is not already in the cart', async () => {
      const product = makeProduct();
      mockProductsService.findOne.mockResolvedValue(product);
      mockCartRepo.findOneBy.mockResolvedValue(null); // not in cart yet
      mockCartRepo.create.mockImplementation((dto) => dto);
      mockCartRepo.save.mockResolvedValue({});
      // getCart call
      mockCartRepo.find.mockResolvedValue([]);

      await service.addItem('user1', product.id, 1);

      expect(mockCartRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user1', quantity: 1 }),
      );
      expect(mockCartRepo.save).toHaveBeenCalled();
    });

    it('throws BadRequestException when requested quantity exceeds stock', async () => {
      const product = makeProduct({ stockQuantity: 2 });
      mockProductsService.findOne.mockResolvedValue(product);
      mockCartRepo.findOneBy.mockResolvedValue(null);

      await expect(service.addItem('user1', product.id, 5)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when existing + new quantity exceeds stock', async () => {
      const product = makeProduct({ stockQuantity: 3 });
      mockProductsService.findOne.mockResolvedValue(product);
      // Already has 2 in cart, trying to add 2 more = 4 > 3
      mockCartRepo.findOneBy.mockResolvedValue(makeCartRow({ quantity: 2 }));

      await expect(service.addItem('user1', product.id, 2)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('increments an existing cart row quantity', async () => {
      const product = makeProduct({ stockQuantity: 10 });
      mockProductsService.findOne.mockResolvedValue(product);
      const existing = makeCartRow({ quantity: 2 });
      mockCartRepo.findOneBy.mockResolvedValue(existing);
      mockCartRepo.save.mockResolvedValue({ ...existing, quantity: 4 });
      mockCartRepo.find.mockResolvedValue([]);

      await service.addItem('user1', product.id, 2);

      expect(mockCartRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 4 }),
      );
    });
  });

  // ── updateQuantity ─────────────────────────────────────────────────────────

  describe('updateQuantity', () => {
    it('rejects negative quantities', async () => {
      await expect(
        service.updateQuantity('user1', 'aaaaaaaaaaaaaaaaaaaaaaaa', -1),
      ).rejects.toThrow(BadRequestException);
    });

    it('removes the item when quantity is set to 0', async () => {
      mockCartRepo.deleteMany.mockResolvedValue({});
      mockCartRepo.find.mockResolvedValue([]);

      await service.updateQuantity('user1', 'aaaaaaaaaaaaaaaaaaaaaaaa', 0);

      expect(mockCartRepo.deleteMany).toHaveBeenCalled();
    });
  });

  // ── clearCart ──────────────────────────────────────────────────────────────

  describe('clearCart', () => {
    it('deletes all rows for the user and returns an empty cart', async () => {
      mockCartRepo.deleteMany.mockResolvedValue({});
      mockCartRepo.find.mockResolvedValue([]);

      const result = await service.clearCart('user1');

      expect(mockCartRepo.deleteMany).toHaveBeenCalledWith({ userId: 'user1' });
      expect(result.items).toHaveLength(0);
      expect(result.subtotal).toBe(0);
    });
  });

  // ── getCart totals ─────────────────────────────────────────────────────────

  describe('getCart', () => {
    it('computes correct line totals and subtotal', async () => {
      const product = makeProduct({ price: 10, stockQuantity: 5 });
      mockProductsService.findOne.mockResolvedValue(product);
      mockCartRepo.find.mockResolvedValue([makeCartRow({ quantity: 3 })]);

      const cart = await service.getCart('user1');

      expect(cart.items[0].lineTotal).toBe(30);
      expect(cart.subtotal).toBe(30);
      expect(cart.itemCount).toBe(3);
    });

    it('handles a deleted product gracefully (null product, zero line total)', async () => {
      mockProductsService.findOne.mockRejectedValue(new Error('Not found'));
      mockCartRepo.find.mockResolvedValue([makeCartRow({ quantity: 2 })]);

      const cart = await service.getCart('user1');

      expect(cart.items[0].product).toBeNull();
      expect(cart.items[0].lineTotal).toBe(0);
    });
  });
});
