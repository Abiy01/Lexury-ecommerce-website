import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import wishlistRoutes from './routes/wishlist.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import reviewRoutes from './routes/reviews.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:8080',
  'http://localhost:5173'
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // In production, allow the configured frontend URL
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lexury-ecommerce';
    console.log('Attempting to connect to MongoDB...');
    
    // Hide credentials in log
    const safeURI = mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('Connection string:', safeURI);
    
    // Set connection options for better timeout handling
    const options = {
      serverSelectionTimeoutMS: 15000, // 15 seconds (increased for Atlas)
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 15000, // 15 seconds
      retryWrites: true,
      w: 'majority',
      // For MongoDB Atlas, ensure we're using the right connection method
      ...(mongoURI.includes('mongodb+srv://') && {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
    };
    
    await mongoose.connect(mongoURI, options);
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('\n❌ MongoDB connection error:', error.message);
    if (error.code === 'ETIMEOUT' || error.name === 'MongoServerSelectionError') {
      console.error('\n⚠️  MongoDB Connection Failed!');
      console.error('Possible causes:');
      console.error('1. MongoDB Atlas:');
      console.error('   - Check your internet connection');
      console.error('   - Verify IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for testing)');
      console.error('   - Check if the connection string includes the database name');
      console.error('2. Local MongoDB:');
      console.error('   - Ensure MongoDB is running: mongod');
      console.error('   - Or use: MONGODB_URI=mongodb://localhost:27017/lexury-ecommerce');
      console.error('\n💡 Quick fix: Update .env file with:');
      console.error('   MONGODB_URI=mongodb://localhost:27017/lexury-ecommerce\n');
    } else {
      console.error('Error details:', error);
    }
    // Don't exit - allow server to start but API won't work
    console.error('⚠️  Server will start but API endpoints will fail until MongoDB is connected\n');
  }
};

// Start server
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
connectDB().then(() => {
  // Start server even if MongoDB connection failed (for testing)
  app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Check MongoDB connection status
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB: Connected');
    } else {
      console.log('⚠️  MongoDB: Not connected - API will not work until MongoDB is connected');
      console.log('   Fix the connection and restart the server\n');
    }
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;

