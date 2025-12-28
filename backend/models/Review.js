import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure one review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to update product rating
reviewSchema.statics.updateProductRating = async function(productId) {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({ product: productId });
  
  if (reviews.length === 0) {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      rating: 0,
      reviewCount: 0
    });
    return;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  const reviewCount = reviews.length;

  await mongoose.model('Product').findByIdAndUpdate(productId, {
    rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    reviewCount: reviewCount
  });
};

// Update product rating when review is saved
reviewSchema.post('save', async function() {
  const Review = mongoose.model('Review');
  await Review.updateProductRating(this.product);
});

// Update product rating when review is deleted
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Review = mongoose.model('Review');
    await Review.updateProductRating(doc.product);
  }
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
