import express from 'express';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      sort,
      minPrice,
      maxPrice,
      brand,
      rating,
      inStock,
      featured
    } = req.query;

    // Build query
    const query = {};

    if (category) {
      query.category = new RegExp(category, 'i');
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') }
      ];
    }

    if (minPrice) {
      query.price = { ...query.price, $gte: parseFloat(minPrice) };
    }

    if (maxPrice) {
      query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    }

    if (brand) {
      query.brand = new RegExp(brand, 'i');
    }

    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'price-asc':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'popular':
        sortOption = { reviewCount: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('merchant', 'name email');

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true })
      .limit(8)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/categories
// @desc    Get all categories (auto-generate from products if none exist)
// @access  Public
router.get('/categories', async (req, res, next) => {
  try {
    let categories = await Category.find().sort({ name: 1 });
    
    // If no categories exist, auto-generate from products or create defaults
    if (categories.length === 0) {
      // Get unique categories from products
      const products = await Product.find({ category: { $exists: true, $ne: '' } });
      const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
      
      // If no products exist, create default categories
      if (uniqueCategories.length === 0) {
        const defaultCategories = [
          { name: 'Electronics', slug: 'electronics' },
          { name: 'Fashion', slug: 'fashion' },
          { name: 'Home & Living', slug: 'home-living' },
          { name: 'Beauty', slug: 'beauty' },
          { name: 'Sports', slug: 'sports' },
          { name: 'Books', slug: 'books' },
          { name: 'Toys', slug: 'toys' },
          { name: 'Food & Beverages', slug: 'food-beverages' }
        ];
        
        // Insert default categories
        for (const catDoc of defaultCategories) {
          try {
            await Category.create(catDoc);
          } catch (err) {
            // Ignore duplicate key errors
            if (err.code !== 11000) {
              throw err;
            }
          }
        }
      } else {
        // Create category documents from products
        const categoryDocs = uniqueCategories.map(catName => ({
          name: catName,
          slug: catName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
        }));
        
        // Insert categories (ignore duplicates)
        for (const catDoc of categoryDocs) {
          try {
            await Category.create(catDoc);
          } catch (err) {
            // Ignore duplicate key errors
            if (err.code !== 11000) {
              throw err;
            }
          }
        }
      }
      
      // Re-fetch categories
      categories = await Category.find().sort({ name: 1 });
    }
    
    // Update productCount for each category
    for (const category of categories) {
      const count = await Product.countDocuments({ category: category.name });
      if (category.productCount !== count) {
        category.productCount = count;
        await category.save();
      }
    }
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/products/categories
// @desc    Create a new category (Admin only)
// @access  Private/Admin
router.post('/categories', protect, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Category name is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, image } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      $or: [
        { name: name },
        { slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') }
      ]
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const category = await Category.create({
      name,
      image,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID or slug
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID first (MongoDB ObjectId)
    let product = null;
    
    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      product = await Product.findById(id)
        .populate('merchant', 'name email');
    }
    
    // If not found by ID, try to find by slug
    if (!product) {
      product = await Product.findOne({ slug: id })
        .populate('merchant', 'name email');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private (Admin/Merchant)
router.post('/', protect, authorize('admin', 'merchant'), upload.array('images', 5), [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const productData = {
      ...req.body,
      merchant: req.user.role === 'merchant' ? req.user._id : undefined
    };

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => `/uploads/${file.filename}`);
    } else {
      // If no images uploaded, use placeholder
      productData.images = ['/placeholder.svg'];
    }

    // Slug will be auto-generated by Product model pre-save hook
    // No need to set it manually

    // Convert string numbers to actual numbers
    if (productData.price) productData.price = parseFloat(productData.price);
    if (productData.originalPrice) productData.originalPrice = parseFloat(productData.originalPrice);
    if (productData.stock) productData.stock = parseInt(productData.stock);
    if (productData.isFeatured) productData.isFeatured = productData.isFeatured === 'true';
    if (productData.isNew) productData.isNew = productData.isNew === 'true';

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private (Admin/Merchant)
router.put('/:id', protect, authorize('admin', 'merchant'), upload.array('images', 5), [
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if merchant owns this product (unless admin)
    if (req.user.role === 'merchant' && product.merchant?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    const updateData = { ...req.body };

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    // Convert string numbers to actual numbers
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.originalPrice) updateData.originalPrice = parseFloat(updateData.originalPrice);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);
    if (updateData.isFeatured !== undefined) updateData.isFeatured = updateData.isFeatured === 'true';
    if (updateData.isNew !== undefined) updateData.isNew = updateData.isNew === 'true';

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (Admin/Merchant)
router.delete('/:id', protect, authorize('admin', 'merchant'), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if merchant owns this product (unless admin)
    if (req.user.role === 'merchant' && product.merchant?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

