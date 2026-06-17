import User from '../models/User.js';
import Seller from '../models/Seller.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import logger from '../config/logger.js';

export const seedDatabase = async () => {
  try {
    // 1. Seed Users
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      logger.info('Database already has users. Skipping seeding.');
      return;
    }

    logger.info('Seeding default users...');
    
    // Create admin
    const admin = new User({
      name: 'Super Admin',
      email: 'admin@daykart.com',
      password: 'AdminPassword123!',
      role: 'admin',
      isVerified: true,
    });
    await admin.save();

    // Create seller user
    const sellerUser = new User({
      name: 'John Seller',
      email: 'seller@daykart.com',
      password: 'SellerPassword123!',
      role: 'seller',
      isVerified: true,
    });
    await sellerUser.save();

    // Create customer user
    const customer = new User({
      name: 'Jane Customer',
      email: 'customer@daykart.com',
      password: 'CustomerPassword123!',
      role: 'customer',
      isVerified: true,
      addresses: [{
        street: '123 E-Commerce Way',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400001',
        isDefault: true,
      }],
    });
    await customer.save();

    // Create delivery partner
    const delivery = new User({
      name: 'Bob Delivery',
      email: 'delivery@daykart.com',
      password: 'DeliveryPassword123!',
      role: 'delivery_partner',
      isVerified: true,
    });
    await delivery.save();

    // 2. Seed Seller Profile
    logger.info('Seeding seller profile...');
    const sellerProfile = new Seller({
      user: sellerUser._id,
      storeName: 'Apex Electronics & Fashion',
      storeDescription: 'Your premium tech and style companion.',
      gstin: '27AAAAA1111A1Z1',
      pan: 'ABCDE1234F',
      bankDetails: {
        accountNumber: '918273645019',
        ifsc: 'SBIN0000001',
        bankName: 'State Bank of India',
        accountHolderName: 'Apex Tech Retailers',
      },
      storeAddress: {
        street: '101 Tech Hub, Bandra',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400050',
      },
      status: 'approved',
      rating: 4.8,
      totalReviews: 24,
    });
    await sellerProfile.save();

    // 3. Seed Categories (Hierarchical)
    logger.info('Seeding categories...');
    const electronics = await new Category({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Gadgets, phones, and computers',
    }).save();

    const mobiles = await new Category({
      name: 'Mobiles',
      slug: 'mobiles',
      parentCategory: electronics._id,
      description: 'Smartphones and cellphones',
    }).save();

    const laptops = await new Category({
      name: 'Laptops',
      slug: 'laptops',
      parentCategory: electronics._id,
      description: 'Workstations and notebooks',
    }).save();

    const fashion = await new Category({
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing, shoes, and accessories',
    }).save();

    const mensWear = await new Category({
      name: 'Mens Wear',
      slug: 'mens-wear',
      parentCategory: fashion._id,
    }).save();

    const womensWear = await new Category({
      name: 'Womens Wear',
      slug: 'womens-wear',
      parentCategory: fashion._id,
    }).save();

    const homeKitchen = await new Category({
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Home appliances and decor',
    }).save();

    // 4. Seed Brands
    logger.info('Seeding brands...');
    const apple = await new Brand({ name: 'Apple', slug: 'apple' }).save();
    const samsung = await new Brand({ name: 'Samsung', slug: 'samsung' }).save();
    const nike = await new Brand({ name: 'Nike', slug: 'nike' }).save();
    const levish = await new Brand({ name: 'Levis', slug: 'levis' }).save();

    // 5. Seed Products
    logger.info('Seeding products...');
    const p1 = new Product({
      sku: 'AP-IPH15P-256-BLU',
      barcode: '190199182736',
      title: 'Apple iPhone 15 Pro (256 GB, Titanium Blue)',
      description: 'The iPhone 15 Pro features a strong and lightweight aerospace-grade titanium design. Powered by the A17 Pro chip for next-level mobile gaming and performance.',
      seller: sellerProfile._id,
      category: mobiles._id,
      brand: apple._id,
      price: 129900,
      compareAtPrice: 139900,
      images: [
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800'
      ],
      inventory: { quantity: 15, lowStockThreshold: 3 },
      variants: [
        { sku: 'AP-IPH15P-256-BLU', price: 129900, inventory: 10, attributes: new Map([['color', 'Blue'], ['storage', '256GB']]) },
        { sku: 'AP-IPH15P-256-BLK', price: 129900, inventory: 5, attributes: new Map([['color', 'Black'], ['storage', '256GB']]) }
      ],
      attributes: new Map([['camera', '48MP Pro System'], ['processor', 'A17 Pro']]),
      ratings: { average: 4.8, count: 5 },
      status: 'approved',
      tags: ['smartphone', 'ios', 'iphone', 'premium'],
    });
    await p1.save();

    const p2 = new Product({
      sku: 'SM-S24U-512-GRY',
      barcode: '880609530491',
      title: 'Samsung Galaxy S24 Ultra (512 GB, Titanium Gray)',
      description: 'Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity and possibility.',
      seller: sellerProfile._id,
      category: mobiles._id,
      brand: samsung._id,
      price: 139900,
      compareAtPrice: 144900,
      images: [
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=800'
      ],
      inventory: { quantity: 20, lowStockThreshold: 4 },
      variants: [
        { sku: 'SM-S24U-512-GRY', price: 139900, inventory: 12, attributes: new Map([['color', 'Titanium Gray'], ['storage', '512GB']]) },
        { sku: 'SM-S24U-512-BLK', price: 139900, inventory: 8, attributes: new Map([['color', 'Titanium Black'], ['storage', '512GB']]) }
      ],
      attributes: new Map([['camera', '200MP Quad Zoom'], ['battery', '5000mAh']]),
      ratings: { average: 4.6, count: 8 },
      status: 'approved',
      tags: ['smartphone', 'android', 'samsung', 'ai'],
    });
    await p2.save();

    const p3 = new Product({
      sku: 'AP-MBP16M3P-1T-SLV',
      barcode: '190199482937',
      title: 'Apple MacBook Pro 16" (M3 Pro, 1TB SSD, Silver)',
      description: 'The 16-inch MacBook Pro blasts forward with M3 Pro, an incredibly advanced chip that brings serious speed and capability for demanding workflows.',
      seller: sellerProfile._id,
      category: laptops._id,
      brand: apple._id,
      price: 249900,
      compareAtPrice: 269900,
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800'
      ],
      inventory: { quantity: 10, lowStockThreshold: 2 },
      variants: [],
      attributes: new Map([['screenSize', '16.2 inch'], ['ram', '18GB']]),
      ratings: { average: 4.9, count: 3 },
      status: 'approved',
      tags: ['laptop', 'macbook', 'macos', 'workstation'],
    });
    await p3.save();

    const p4 = new Product({
      sku: 'NK-PEGASUS40-10-WHT',
      barcode: '091208365492',
      title: 'Nike Air Zoom Pegasus 40 (Size 10, White)',
      description: 'A springy ride for every run, the Peg’s familiar, just-for-you feel returns to help you accomplish your goals.',
      seller: sellerProfile._id,
      category: mensWear._id,
      brand: nike._id,
      price: 11495,
      compareAtPrice: 12995,
      images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800'
      ],
      inventory: { quantity: 50, lowStockThreshold: 10 },
      variants: [
        { sku: 'NK-PEGASUS40-10-WHT', price: 11495, inventory: 25, attributes: new Map([['color', 'White'], ['size', '10']]) },
        { sku: 'NK-PEGASUS40-9-WHT', price: 11495, inventory: 25, attributes: new Map([['color', 'White'], ['size', '9']]) }
      ],
      attributes: new Map([['sole', 'Rubber Zoom Sole'], ['material', 'Mesh Breathable']]),
      ratings: { average: 4.4, count: 12 },
      status: 'approved',
      tags: ['shoes', 'running', 'sport', 'nike'],
    });
    await p4.save();

    // 6. Seed Coupons
    logger.info('Seeding coupons...');
    const c1 = new Coupon({
      code: 'DAYKART10',
      description: 'Get 10% off platform-wide on minimum purchase of ₹1,000.',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 1000,
      maxDiscount: 2000,
      scope: 'platform',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      usageLimit: 1000,
      userLimit: 2,
      active: true,
    });
    await c1.save();

    const c2 = new Coupon({
      code: 'FLAT500',
      description: 'Flat ₹500 discount on electronics over ₹10,000.',
      discountType: 'flat',
      discountValue: 500,
      minOrderValue: 10000,
      scope: 'platform',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      usageLimit: 500,
      userLimit: 1,
      active: true,
    });
    await c2.save();

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error(`Error seeding database: ${error.message}`);
  }
};
