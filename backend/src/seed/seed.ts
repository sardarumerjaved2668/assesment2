import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserRole } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Category } from '../categories/entities/category.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mongodb',
  url: process.env.MONGODB_URI,
  database: process.env.DATABASE_NAME || 'fullstack',
  entities: [User, Product, Order, OrderItem, CartItem, Category],
  synchronize: true,
});

const products = [
  {
    name: 'ProBook Laptop',
    description: 'High-performance laptop for professionals',
    price: 1299.99,
    category: 'Electronics',
    stockQuantity: 15,
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
  },
  {
    name: 'SmartPhone X12',
    description: 'Latest flagship smartphone with advanced camera system',
    price: 899.99,
    category: 'Electronics',
    stockQuantity: 42,
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
  },
  {
    name: 'NoiseBlock Headphones',
    description: 'Premium noise-cancelling over-ear headphones',
    price: 349.99,
    category: 'Electronics',
    stockQuantity: 28,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
  },
  {
    name: 'Classic Oxford Shirt',
    description: 'Timeless Oxford weave cotton shirt for every occasion',
    price: 59.99,
    category: 'Clothing',
    stockQuantity: 85,
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400',
  },
  {
    name: 'Slim Fit Denim Jeans',
    description: 'Modern slim fit jeans in classic indigo wash',
    price: 79.99,
    category: 'Clothing',
    stockQuantity: 63,
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
  },
  {
    name: 'Urban Explorer Jacket',
    description: 'Versatile water-resistant jacket for city adventures',
    price: 149.99,
    category: 'Clothing',
    stockQuantity: 34,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
  },
  {
    name: 'The Midnight Library',
    description: 'A novel about all the lives you could have lived',
    price: 16.99,
    category: 'Books',
    stockQuantity: 120,
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
  },
  {
    name: 'Clean Code Handbook',
    description: 'A handbook of agile software craftsmanship',
    price: 42.99,
    category: 'Books',
    stockQuantity: 67,
    imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
  },
  {
    name: 'The Joy of Cooking',
    description: 'The all-purpose cookbook for home chefs',
    price: 35.99,
    category: 'Books',
    stockQuantity: 89,
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400',
  },
  {
    name: 'Minimalist Arc Floor Lamp',
    description: 'Elegant arc floor lamp with adjustable brightness',
    price: 189.99,
    category: 'Home',
    stockQuantity: 22,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
  },
  {
    name: 'Ceramic Pour-Over Mug Set',
    description: 'Handcrafted ceramic pour-over dripper and mug set',
    price: 44.99,
    category: 'Home',
    stockQuantity: 55,
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
  },
  {
    name: 'Monstera Deliciosa Plant',
    description: 'Iconic tropical houseplant, easy care, great aesthetic',
    price: 34.99,
    category: 'Home',
    stockQuantity: 18,
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400',
  },
];

const seedCategories = [
  { name: 'Electronics', description: 'Electronic devices and accessories', slug: 'electronics' },
  { name: 'Clothing', description: 'Apparel and fashion items', slug: 'clothing' },
  { name: 'Books', description: 'Books, e-books and educational materials', slug: 'books' },
  { name: 'Home & Garden', description: 'Home decor, furniture and garden supplies', slug: 'home-garden' },
  { name: 'Sports', description: 'Sports equipment and activewear', slug: 'sports' },
  { name: 'Toys', description: 'Toys, games and kids accessories', slug: 'toys' },
];

async function seed() {
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected. Starting seed...');

  const userRepo = AppDataSource.getRepository(User);
  const productRepo = AppDataSource.getRepository(Product);
  const categoryRepo = AppDataSource.getRepository(Category);

  // Upsert admin user
  const adminEmail = 'admin@store.com';
  let admin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!admin) {
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    admin = userRepo.create({
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    await userRepo.save(admin);
    console.log('Admin user created:', adminEmail);
  } else {
    console.log('Admin user already exists:', adminEmail);
  }

  // Upsert customer user
  const customerEmail = 'customer@store.com';
  let customer = await userRepo.findOne({ where: { email: customerEmail } });
  if (!customer) {
    const hashedPassword = await bcrypt.hash('Customer123!', 12);
    customer = userRepo.create({
      email: customerEmail,
      firstName: 'Customer',
      lastName: 'User',
      password: hashedPassword,
      role: UserRole.CUSTOMER,
    });
    await userRepo.save(customer);
    console.log('Customer user created:', customerEmail);
  } else {
    console.log('Customer user already exists:', customerEmail);
  }

  // Upsert categories
  for (const catData of seedCategories) {
    const existing = await categoryRepo.findOne({ where: { slug: catData.slug } });
    if (!existing) {
      const category = categoryRepo.create({ ...catData, isActive: true });
      await categoryRepo.save(category);
      console.log('Category created:', catData.name);
    } else {
      console.log('Category already exists:', catData.name);
    }
  }

  // Upsert products
  for (const productData of products) {
    const existing = await productRepo.findOne({
      where: { name: productData.name },
    });
    if (!existing) {
      const product = productRepo.create(productData);
      await productRepo.save(product);
      console.log('Product created:', productData.name);
    } else {
      await productRepo.save({ ...existing, ...productData });
      console.log('Product updated:', productData.name);
    }
  }

  console.log('Seed completed successfully.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
