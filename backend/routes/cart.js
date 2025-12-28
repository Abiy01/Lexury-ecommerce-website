import express from 'express';
import { body, validationResult } from 'express-validator';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper function to calculate cart totals
const calculateCartTotals = (items) => {
  let subtotal = 0;
  
  items.forEach(item => {
    const price = item.product.price + (item.variant?.priceModifier || 0);
    subtotal += price * item.quantity;
  });

  return subtotal;
};

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product')
      .populate('items.variant');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const subtotal = calculateCartTotals(cart.items);
    const discount = 0;
    const shipping = subtotal >= 100 ? 0 : 9.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    res.json({
      success: true,
      data: {
        items: cart.items,
        subtotal,
        discount,
        shipping,
        tax,
        total
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/cart/items
// @desc    Add item to cart
// @access  Private
router.post('/items', protect, [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
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

    const { productId, quantity, variant } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && 
      (!variant || item.variant?.toString() === variant)
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        variant: variant || undefined
      });
    }

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product')
      .populate('items.variant');

    res.json({
      success: true,
      data: updatedCart.items,
      message: 'Item added to cart'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/cart/items/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put('/items/:itemId', protect, [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
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

    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Check stock
    const product = await Product.findById(item.product);
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    item.quantity = quantity;
    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product')
      .populate('items.variant');

    res.json({
      success: true,
      data: updatedCart.items,
      message: 'Cart item updated'
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/cart/items/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/items/:itemId', protect, async (req, res, next) => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find the item by ID - try multiple methods
    let itemToRemove = cart.items.id(itemId);
    
    // If not found by id(), try finding by string comparison
    if (!itemToRemove) {
      itemToRemove = cart.items.find(item => {
        const itemIdStr = item._id?.toString();
        const searchIdStr = String(itemId);
        return itemIdStr === searchIdStr || itemIdStr === itemId;
      });
    }
    
    if (!itemToRemove) {
      console.log('Item not found. Requested ID:', itemId, 'Type:', typeof itemId);
      console.log('Available cart item IDs:', cart.items.map(item => ({
        _id: item._id?.toString(),
        _idType: typeof item._id,
        product: item.product?.toString()
      })));
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
        debug: {
          requestedId: itemId,
          requestedIdType: typeof itemId,
          availableIds: cart.items.map(item => item._id?.toString())
        }
      });
    }

    console.log('Found item to remove:', {
      itemId: itemToRemove._id?.toString(),
      product: itemToRemove.product?.toString(),
      quantity: itemToRemove.quantity
    });

    // Remove the item using pull() method which is more reliable
    cart.items.pull(itemToRemove._id);
    
    // Mark the items array as modified
    cart.markModified('items');
    
    // Save the cart
    const savedCart = await cart.save();
    
    console.log('Item removed successfully. Remaining items:', savedCart.items.length);
    console.log('Saved cart items:', savedCart.items.map(item => ({
      _id: item._id?.toString(),
      product: item.product?.toString()
    })));

    // Re-fetch the cart to ensure we have the latest data
    const updatedCart = await Cart.findOne({ user: req.user._id })
      .populate('items.product')
      .populate('items.variant');
    
    console.log('Updated cart after removal:', {
      itemsCount: updatedCart?.items?.length || 0,
      itemIds: updatedCart?.items?.map(item => item._id?.toString()) || []
    });

    if (!updatedCart) {
      return res.json({
        success: true,
        data: { items: [] },
        message: 'Item removed from cart'
      });
    }

    res.json({
      success: true,
      data: updatedCart,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    next(error);
  }
});

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', protect, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    next(error);
  }
});

export default router;



