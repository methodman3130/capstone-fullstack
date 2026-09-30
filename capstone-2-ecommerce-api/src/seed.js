require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');

/**
 * Seeds sample products so the search and filter practice task
 * (at least 5 products, at least 2 categories) has data to work with.
 *
 * Run with:  npm run seed
 * WARNING: this clears the products collection first.
 */

const products = [
  {
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard with hot-swappable switches',
    price: 1850,
    category: 'Accessories',
    stock: 12,
  },
  {
    name: 'Wireless Mouse',
    description: 'Silent wireless mouse with adjustable DPI',
    price: 950,
    category: 'Accessories',
    stock: 25,
  },
  {
    name: 'Gaming Laptop',
    description: 'High refresh rate display and dedicated graphics card',
    price: 78000,
    category: 'Laptop',
    stock: 3,
  },
  {
    name: 'Office Laptop',
    description: 'Thin and light laptop for documents and meetings',
    price: 42000,
    category: 'Laptop',
    stock: 7,
  },
  {
    name: 'USB-C Hub',
    description: 'Seven-in-one hub with HDMI and card reader',
    price: 1450,
    category: 'Accessories',
    stock: 18,
  },
  {
    name: 'Free Promo Sticker',
    description: 'Giveaway sticker pack, genuinely free',
    price: 0,
    category: 'Promo',
    stock: 0,
  },
];

async function seed() {
  try {
    await connectDB();
    await Product.deleteMany({});
    const created = await Product.insertMany(products);
    console.log(`Seeded ${created.length} products across 3 categories.`);
  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();
