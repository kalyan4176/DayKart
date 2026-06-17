import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Seller from '../models/Seller.js';
import redisClient from '../config/redis.js';
import { logAuditEvent } from '../services/auditService.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/customErrors.js';
import logger from '../config/logger.js';

export const getProducts = async (req, res, next) => {
  try {
    const { category, brand, minPrice, maxPrice, sort, page = 1, limit = 10, search, status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    } else {
      query.status = 'approved';
    }

    // Filter by category slug
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        // Find all subcategories to include products under subcategories
        const childCategories = await Category.find({ parentCategory: categoryDoc._id });
        const categoryIds = [categoryDoc._id, ...childCategories.map(c => c._id)];
        query.category = { $in: categoryIds };
      }
    }

    // Filter by brand slug
    if (brand) {
      const brandDoc = await Brand.findOne({ slug: brand });
      if (brandDoc) {
        query.brand = brandDoc._id;
      }
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Keyword search (Regex fallback when Elasticsearch is unavailable)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Define Sorting
    let sortOptions = { createdAt: -1 }; // default newest
    if (sort === 'price-asc') sortOptions = { price: 1 };
    if (sort === 'price-desc') sortOptions = { price: -1 };
    if (sort === 'rating') sortOptions = { 'ratings.average': -1 };

    const skipIndex = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .sort(sortOptions)
      .skip(skipIndex)
      .limit(Number(limit));

    const totalCount = await Product.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products,
        pagination: {
          totalProducts: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit)),
          currentPage: Number(page),
          limit: Number(limit),
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `product:detail:${id}`;

    // 1. Try Redis cache
    if (redisClient.isOpen) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return res.status(200).json({
            status: 'success',
            fromCache: true,
            data: { product: JSON.parse(cached) },
          });
        }
      } catch (cacheErr) {
        logger.warn(`Redis fetch error for product ${id}: ${cacheErr.message}`);
      }
    }

    // 2. Fetch from database
    const product = await Product.findById(id)
      .populate('category', 'name slug parentCategory')
      .populate('brand', 'name slug')
      .populate({
        path: 'seller',
        select: 'storeName storeDescription rating storeAddress logo banner',
      });

    if (!product) {
      return next(new NotFoundError('Product not found.'));
    }

    // 3. Store in Redis cache for 10 minutes (600 seconds)
    if (redisClient.isOpen) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(product), { EX: 600 });
      } catch (cacheErr) {
        logger.warn(`Redis store error for product ${id}: ${cacheErr.message}`);
      }
    }

    res.status(200).json({
      status: 'success',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return next(new ForbiddenError('You must register as a seller to create products.'));
    }
    if (seller.status !== 'approved') {
      return next(new ForbiddenError('Your seller account has not been approved yet.'));
    }

    const { sku, title, description, category, brand, price, compareAtPrice, images, videos, variants, attributes, inventory, tags } = req.body;

    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return next(new BadRequestError(`Product SKU '${sku}' already exists.`));
    }

    const product = new Product({
      sku,
      title,
      description,
      seller: seller._id,
      category,
      brand,
      price,
      compareAtPrice,
      images,
      videos,
      variants,
      attributes,
      inventory,
      tags,
      status: 'pending', // Admins must approve products to maintain marketplace quality
    });

    await product.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'SELLER_CREATE_PRODUCT',
      req,
      details: { sku, title, productId: product._id },
    });

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully. Awaiting admin approval.',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) return next(new ForbiddenError('Access denied.'));

    const product = await Product.findById(id);
    if (!product) return next(new NotFoundError('Product not found.'));

    // Verify ownership
    if (product.seller.toString() !== seller._id.toString() && req.user.role !== 'admin') {
      return next(new ForbiddenError('You do not own this product listing.'));
    }

    const fieldsToUpdate = [
      'title', 'description', 'price', 'compareAtPrice', 'images', 
      'videos', 'variants', 'attributes', 'inventory', 'tags'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // Reset status to pending if seller makes changes (for moderation)
    if (req.user.role !== 'admin') {
      product.status = 'pending';
    }

    await product.save();

    // Invalidate Redis cache for product details
    if (redisClient.isOpen) {
      await redisClient.del(`product:detail:${id}`);
    }

    await logAuditEvent({
      actor: req.user._id,
      action: 'SELLER_UPDATE_PRODUCT',
      req,
      details: { productId: id, sku: product.sku },
    });

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully.',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) return next(new ForbiddenError('Access denied.'));

    const product = await Product.findById(id);
    if (!product) return next(new NotFoundError('Product not found.'));

    // Verify ownership
    if (product.seller.toString() !== seller._id.toString() && req.user.role !== 'admin') {
      return next(new ForbiddenError('You do not own this product listing.'));
    }

    await Product.findByIdAndDelete(id);

    // Invalidate Redis Cache
    if (redisClient.isOpen) {
      await redisClient.del(`product:detail:${id}`);
    }

    await logAuditEvent({
      actor: req.user._id,
      action: 'SELLER_DELETE_PRODUCT',
      req,
      details: { productId: id, sku: product.sku },
    });

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const importCSVProducts = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller || seller.status !== 'approved') {
      return next(new ForbiddenError('Unauthorized. Only approved sellers can upload products.'));
    }

    if (!req.file) {
      return next(new BadRequestError('CSV file is required.'));
    }

    const csvData = req.file.buffer.toString('utf-8');
    const rows = csvData.split('\n').map(row => row.split(','));

    // CSV format expected: sku,title,description,price,compareAtPrice,inventoryQuantity,categorySlug,brandSlug,tags
    // Skip header row
    const importedProducts = [];
    const errors = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 8 || !row[0]) continue;

      const [sku, title, description, price, compareAtPrice, inventoryQuantity, categorySlug, brandSlug, tags] = row.map(cell => cell?.trim());

      try {
        const existingProduct = await Product.findOne({ sku });
        if (existingProduct) {
          errors.push(`Row ${i}: SKU '${sku}' already exists.`);
          continue;
        }

        const categoryDoc = await Category.findOne({ slug: categorySlug });
        const brandDoc = await Brand.findOne({ slug: brandSlug });

        if (!categoryDoc || !brandDoc) {
          errors.push(`Row ${i}: Invalid category/brand slug.`);
          continue;
        }

        const product = new Product({
          sku,
          title,
          description,
          seller: seller._id,
          category: categoryDoc._id,
          brand: brandDoc._id,
          price: Number(price),
          compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
          inventory: { quantity: Number(inventoryQuantity), lowStockThreshold: 5 },
          images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'], // default image
          tags: tags ? tags.split(';') : [],
          status: 'pending',
        });

        await product.save();
        importedProducts.push(product);
      } catch (err) {
        errors.push(`Row ${i}: Failed to save product. ${err.message}`);
      }
    }

    await logAuditEvent({
      actor: req.user._id,
      action: 'SELLER_BULK_UPLOAD_CSV',
      req,
      details: { totalAttempted: rows.length - 1, totalImported: importedProducts.length },
    });

    res.status(200).json({
      status: 'success',
      message: `Bulk import completed. Imported: ${importedProducts.length}, Failed: ${errors.length}`,
      data: {
        totalImported: importedProducts.length,
        failedRows: errors,
      }
    });
  } catch (error) {
    next(error);
  }
};
