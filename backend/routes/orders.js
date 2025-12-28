import express from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', protect, [
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required')
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

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product._id} not found`
        });
      }

      // Check stock
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const price = product.price + (item.variant?.priceModifier || 0);
      subtotal += price * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        variant: item.variant,
        price: product.price
      });

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Calculate discount
    const discount = 0;

    // Calculate shipping
    const shipping = subtotal >= 100 ? 0 : 9.99;

    // Calculate tax
    const tax = subtotal * 0.08;

    // Calculate total
    const total = subtotal + shipping + tax;

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.billingAddress || req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      notes: req.body.notes
    });

    // Clear cart
    cart.items = [];
    await cart.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product');

    res.status(201).json({
      success: true,
      data: populatedOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders
// @desc    Get user's orders (or all orders if admin, or merchant orders if merchant)
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    let query = {};
    
    // If merchant, get orders containing their products
    if (req.user.role === 'merchant') {
      // For merchants, we need to find orders that contain products they own
      // We'll fetch all orders and filter by merchant products
      query = {}; // Get all orders, we'll filter by merchant products
    } else if (req.user.role === 'admin') {
      // Admin gets all orders
      query = {};
    } else {
      // Regular user gets only their orders
      query = { user: req.user._id };
    }
    
    if (status) {
      query.status = status;
    }

    // Search functionality - search in orderNumber
    if (search) {
      query.orderNumber = new RegExp(search, 'i');
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum * 2) // Fetch more to account for filtering
      .populate('user', 'name email phone')
      .populate({
        path: 'items.product',
        populate: {
          path: 'merchant',
          select: 'name email _id'
        }
      });

    // If merchant, filter orders to only include those with merchant's products
    if (req.user.role === 'merchant') {
      const merchantId = req.user._id.toString();
      orders = orders.filter(order => {
        if (!order.items || !Array.isArray(order.items)) return false;
        return order.items.some(item => {
          const product = item.product;
          if (!product) return false;
          
          // Check if product has merchant field and it matches current user
          // Handle both populated merchant object and merchant ID string
          let productMerchantId = null;
          if (product.merchant) {
            if (typeof product.merchant === 'object' && product.merchant._id) {
              productMerchantId = product.merchant._id.toString();
            } else if (typeof product.merchant === 'string') {
              productMerchantId = product.merchant;
            } else if (product.merchant.toString) {
              productMerchantId = product.merchant.toString();
            }
          }
          
          return productMerchantId === merchantId;
        });
      });
      // Limit to requested amount after filtering
      orders = orders.slice(0, limitNum);
    }

    // If admin and search provided, filter by user name/email too
    if (search && req.user.role === 'admin') {
      const searchLower = search.toLowerCase();
      orders = orders.filter(order => {
        const orderNumber = (order.orderNumber || '').toLowerCase();
        const userName = (order.user?.name || '').toLowerCase();
        const userEmail = (order.user?.email || '').toLowerCase();
        return orderNumber.includes(searchLower) || 
               userName.includes(searchLower) || 
               userEmail.includes(searchLower);
      });
      // Limit to requested amount after filtering
      orders = orders.slice(0, limitNum);
    }

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
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

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order (unless admin)
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order
// @access  Private
router.put('/:id/cancel', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (['cancelled', 'delivered', 'shipped'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin or Merchant)
// @access  Private (Admin/Merchant)
router.put('/:id/status', protect, authorize('admin', 'merchant'), [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid status')
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

    const order = await Order.findById(req.params.id)
      .populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // If merchant, check if order contains their products
    if (req.user.role === 'merchant') {
      const merchantId = req.user._id.toString();
      const hasMerchantProduct = order.items.some(item => {
        const product = item.product;
        if (!product) return false;
        
        // Check if product belongs to merchant
        let productMerchantId = null;
        if (product.merchant) {
          if (typeof product.merchant === 'object' && product.merchant._id) {
            productMerchantId = product.merchant._id.toString();
          } else if (typeof product.merchant === 'string') {
            productMerchantId = product.merchant;
          } else if (product.merchant.toString) {
            productMerchantId = product.merchant.toString();
          }
        }
        
        return productMerchantId === merchantId;
      });

      if (!hasMerchantProduct) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this order. Order does not contain your products.'
        });
      }
    }

    order.status = req.body.status;

    // Add tracking number if provided
    if (req.body.trackingNumber) {
      order.trackingNumber = req.body.trackingNumber;
    }

    // Add estimated delivery if provided
    if (req.body.estimatedDelivery) {
      order.estimatedDelivery = new Date(req.body.estimatedDelivery);
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product');

    res.json({
      success: true,
      data: populatedOrder,
      message: 'Order status updated'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

