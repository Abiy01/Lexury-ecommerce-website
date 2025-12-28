import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const categories = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Living', slug: 'home-living' },
  { name: 'Beauty', slug: 'beauty' },
  { name: 'Sports', slug: 'sports' }
];

const products = [
  {
    name: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    description: 'High-quality wireless headphones with noise cancellation and premium sound quality.',
    price: 299.99,
    originalPrice: 399.99,
    images: ['/placeholder.svg'],
    category: 'Electronics',
    brand: 'AudioTech',
    stock: 50,
    rating: 4.5,
    reviewCount: 120,
    isFeatured: true,
    isNew: false,
    tags: ['wireless', 'audio', 'premium']
  },
  {
    name: 'Designer Leather Jacket',
    slug: 'designer-leather-jacket',
    description: 'Handcrafted leather jacket with premium quality and timeless design.',
    price: 599.99,
    originalPrice: 799.99,
    images: ['/placeholder.svg'],
    category: 'Fashion',
    brand: 'LuxuryWear',
    stock: 25,
    rating: 4.8,
    reviewCount: 85,
    isFeatured: true,
    isNew: true,
    tags: ['leather', 'jacket', 'designer']
  },
  {
    name: 'Modern Coffee Table',
    slug: 'modern-coffee-table',
    description: 'Sleek and modern coffee table perfect for contemporary living spaces.',
    price: 449.99,
    images: ['/placeholder.svg'],
    category: 'Home & Living',
    brand: 'HomeStyle',
    stock: 15,
    rating: 4.3,
    reviewCount: 45,
    isFeatured: false,
    isNew: true,
    tags: ['furniture', 'modern', 'coffee-table']
  },
  {
    name: 'Luxury Skincare Set',
    slug: 'luxury-skincare-set',
    description: 'Complete skincare set with premium ingredients for radiant skin.',
    price: 199.99,
    originalPrice: 249.99,
    images: ['/placeholder.svg'],
    category: 'Beauty',
    brand: 'BeautyLux',
    stock: 40,
    rating: 4.6,
    reviewCount: 200,
    isFeatured: true,
    isNew: false,
    tags: ['skincare', 'beauty', 'premium']
  },
  {
    name: 'Professional Running Shoes',
    slug: 'professional-running-shoes',
    description: 'High-performance running shoes designed for athletes and fitness enthusiasts.',
    price: 149.99,
    images: ['/placeholder.svg'],
    category: 'Sports',
    brand: 'SportPro',
    stock: 60,
    rating: 4.7,
    reviewCount: 150,
    isFeatured: false,
    isNew: false,
    tags: ['running', 'shoes', 'sports']
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lexury-ecommerce');
    console.log('MongoDB connected');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared existing data');

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@lexury.com',
      password: hashedPassword,
      role: 'admin'
    });
    console.log('Created admin user:', admin.email);

    // Create merchant user
    const merchantPassword = await bcrypt.hash('merchant123', 10);
    const merchant = await User.create({
      name: 'Merchant User',
      email: 'merchant@lexury.com',
      password: merchantPassword,
      role: 'merchant'
    });
    console.log('Created merchant user:', merchant.email);

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await User.create({
      name: 'Test User',
      email: 'user@lexury.com',
      password: userPassword,
      role: 'user'
    });
    console.log('Created regular user:', user.email);

    // Create products
    const createdProducts = await Product.insertMany(products);
    console.log(`Created ${createdProducts.length} products`);

    console.log('Database seeded successfully!');
    console.log('\nTest Accounts:');
    console.log('Admin - Email: admin@lexury.com, Password: admin123');
    console.log('Merchant - Email: merchant@lexury.com, Password: merchant123');
    console.log('User - Email: user@lexury.com, Password: user123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

