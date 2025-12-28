import express from 'express';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('items.product');

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, items: [] });
    }

    res.json({
      success: true,
      data: wishlist.items
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/wishlist
// @desc    Add product to wishlist
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, items: [] });
    }

    // Check if product already in wishlist
    const exists = wishlist.items.some(
      item => item.product.toString() === productId
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    wishlist.items.push({
      product: productId,
      addedAt: new Date()
    });

    await wishlist.save();

    const updatedWishlist = await Wishlist.findById(wishlist._id)
      .populate('items.product');

    res.json({
      success: true,
      data: updatedWishlist.items,
      message: 'Product added to wishlist'
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/:productId', protect, async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    // Filter out the item - compare both as strings to handle ObjectId properly
    const initialLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(
      item => String(item.product) !== String(productId)
    );

    // Check if item was actually removed
    if (wishlist.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    await wishlist.save();

    const updatedWishlist = await Wishlist.findById(wishlist._id)
      .populate('items.product');

    res.json({
      success: true,
      data: updatedWishlist.items,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    next(error);
  }
});

// @route   GET /api/wishlist/check/:productId
// @desc    Check if product is in wishlist
// @access  Private
router.get('/check/:productId', protect, async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.json({
        success: true,
        data: { inWishlist: false }
      });
    }

    const inWishlist = wishlist.items.some(
      item => item.product.toString() === req.params.productId
    );

    res.json({
      success: true,
      data: { inWishlist }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

