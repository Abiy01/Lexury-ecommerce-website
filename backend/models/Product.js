import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['color', 'size', 'material'],
    required: true
  },
  value: {
    type: String,
    required: true
  },
  priceModifier: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    sparse: true // Allows multiple null values (for uniqueness check)
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    min: 0,
    max: 100
  },
  images: [{
    type: String,
    required: true
  }],
  category: {
    type: String,
    required: [true, 'Please provide a category']
  },
  brand: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  variants: [productVariantSchema],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }],
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate slug from name
productSchema.pre('save', async function(next) {
  // Always generate slug if it's missing, if it's a new document, or if name is modified
  if (!this.slug || this.isNew || this.isModified('name')) {
    if (!this.name) {
      return next(new Error('Product name is required to generate slug'));
    }
    
    let baseSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now();
    let slug = `${baseSlug}-${timestamp}`;
    let counter = 1;
    
    // Check for slug uniqueness (though timestamp should make it unique)
    const Product = this.constructor;
    while (await Product.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${timestamp}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Calculate discount if originalPrice is set
productSchema.pre('save', function(next) {
  if (this.originalPrice && this.originalPrice > this.price) {
    this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;

