import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';

const makeProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
    name: 'Test Product',
    description: 'A test product',
    price: 29.99,
    category: 'Electronics',
    stockQuantity: 10,
    imageUrl: '',
    createdAt: new Date().toISOString(),
    ...overrides,
  } as unknown as Product);

describe('ProductsService', () => {
  let service: ProductsService;

  const mockRepo = {
    findOneBy: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  // ── decrementStock ─────────────────────────────────────────────────────────

  describe('decrementStock', () => {
    it('decrements stock by the requested quantity', async () => {
      const product = makeProduct({ stockQuantity: 10 });
      mockRepo.findOneBy.mockResolvedValue(product);
      mockRepo.save.mockImplementation(async (p) => p);

      const result = await service.decrementStock(product.id, 3);

      expect(result.stockQuantity).toBe(7);
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ stockQuantity: 7 }),
      );
    });

    it('throws BadRequestException when requested quantity exceeds stock', async () => {
      const product = makeProduct({ stockQuantity: 2 });
      mockRepo.findOneBy.mockResolvedValue(product);

      await expect(service.decrementStock(product.id, 5)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows decrement to exactly zero stock', async () => {
      const product = makeProduct({ stockQuantity: 5 });
      mockRepo.findOneBy.mockResolvedValue(product);
      mockRepo.save.mockImplementation(async (p) => p);

      const result = await service.decrementStock(product.id, 5);
      expect(result.stockQuantity).toBe(0);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('throws NotFoundException for a non-existent product', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.findOne('aaaaaaaaaaaaaaaaaaaaaaaa'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── findByCategory (suggestions) ──────────────────────────────────────────

  describe('findByCategory', () => {
    it('returns at most 4 products', async () => {
      const products = Array.from({ length: 4 }, (_, i) =>
        makeProduct({ id: `product${i}`, name: `Product ${i}` }),
      );
      mockRepo.find.mockResolvedValue(products);

      const result = await service.findByCategory('Electronics');
      expect(result.length).toBeLessThanOrEqual(4);
    });

    it('excludes the specified product id', async () => {
      const products = [makeProduct({ id: 'bbbbbbbbbbbbbbbbbbbbbbbb' })];
      mockRepo.find.mockResolvedValue(products);

      const result = await service.findByCategory(
        'Electronics',
        'aaaaaaaaaaaaaaaaaaaaaaaa',
      );

      // Verify the exclude filter was passed to the repository
      const findCall = mockRepo.find.mock.calls[0][0];
      expect(findCall.where._id).toBeDefined();
      expect(result).toEqual(products);
    });
  });

  // ── update validation ──────────────────────────────────────────────────────

  describe('update', () => {
    it('rejects a price update of zero or below', async () => {
      const product = makeProduct();
      mockRepo.findOneBy.mockResolvedValue(product);

      await expect(
        service.update(product.id, { price: 0 } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a negative stockQuantity update', async () => {
      const product = makeProduct();
      mockRepo.findOneBy.mockResolvedValue(product);

      await expect(
        service.update(product.id, { stockQuantity: -1 } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
