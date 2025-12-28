// Product Details Page
// Shows detailed product information with images, variants, and add to cart

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  Star,
  Truck,
  Shield,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { productsAPI, reviewsAPI } from '@/services/api';
import { mockProducts } from '@/data/mockData';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, cn, getImageUrls } from '@/lib/utils';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ProductDetail() {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState(null);

  const { addItem, isInCart } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { isAuthenticated, user } = useAuth();

  // Fetch product from API
  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      try {
        // Try to fetch product by slug or ID using the API
        const response = await productsAPI.getById(slug);
        const foundProduct = response.data.data || response.data;

        if (foundProduct) {
          setProduct(foundProduct);
          
          // Fetch reviews for this product
          loadReviews(foundProduct._id || foundProduct.id);
          
          // Fetch related products
          try {
            const relatedResponse = await productsAPI.getAll({
              category: foundProduct.category,
              limit: 5,
            });
            const related = relatedResponse.data.data || relatedResponse.data || [];
            const filtered = Array.isArray(related)
              ? related.filter((p) => (p._id || p.id) !== (foundProduct._id || foundProduct.id)).slice(0, 4)
              : [];
            setRelatedProducts(filtered);
          } catch (error) {
            console.error('Failed to load related products:', error);
            // Fallback to mock data
            const related = mockProducts
              .filter((p) => p.category === foundProduct.category && p.id !== foundProduct.id)
              .slice(0, 4);
            setRelatedProducts(related);
          }
        }
      } catch (error) {
        console.error('Failed to load product:', error);
        // Fallback to mock data
        const mockProduct = mockProducts.find((p) => p.slug === slug);
        if (mockProduct) {
          setProduct(mockProduct);
          const related = mockProducts
            .filter((p) => p.category === mockProduct.category && p.id !== mockProduct.id)
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  const loadReviews = async (productId) => {
    if (!productId) return;
    
    try {
      setIsLoadingReviews(true);
      const response = await reviewsAPI.getByProduct(productId);
      const reviewsData = response.data.data || response.data || [];
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      
      // Check if current user has a review
      if (isAuthenticated && user) {
        const userReviewData = reviewsData.find(
          (r) => r.user?._id?.toString() === user._id?.toString() || 
                 r.user?._id?.toString() === user.id ||
                 r.user?.toString() === user._id?.toString()
        );
        setUserReview(userReviewData || null);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleOpenReviewDialog = () => {
    if (!isAuthenticated) {
      toast.error('Please login to write a review');
      return;
    }
    
    if (userReview) {
      setReviewForm({
        rating: userReview.rating,
        comment: userReview.comment || ''
      });
    } else {
      setReviewForm({ rating: 5, comment: '' });
    }
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!product || !isAuthenticated) return;
    
    if (!reviewForm.rating) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const productId = product._id || product.id;
      
      if (userReview) {
        // Update existing review
        await reviewsAPI.update(userReview._id || userReview.id, {
          rating: reviewForm.rating,
          comment: reviewForm.comment
        });
        toast.success('Review updated successfully');
      } else {
        // Create new review
        await reviewsAPI.create({
          productId,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        });
        toast.success('Review submitted successfully');
      }
      
      // Reload reviews and product
      await loadReviews(productId);
      const productResponse = await productsAPI.getById(productId);
      const updatedProduct = productResponse.data.data || productResponse.data;
      setProduct(updatedProduct);
      
      setIsReviewDialogOpen(false);
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Failed to submit review:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit review';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container-luxe py-24 text-center">
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container-luxe py-24 text-center">
          <h1 className="font-display text-3xl font-semibold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild variant="accent">
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const productId = product.id || product._id;
  const inCart = isInCart(productId);
  const inWishlist = isInWishlist(productId);
  const productImages = getImageUrls(product.images || (product.image ? [product.image] : []));

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success('Added to cart', {
      description: `${quantity}x ${product.name}`,
    });
  };

  const handleToggleWishlist = () => {
    toggleItem(product);
    toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist', {
      description: product.name,
    });
  };

  const decrementQuantity = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const incrementQuantity = () => {
    setQuantity((q) => Math.min(product.stock || 10, q + 1));
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-secondary border-b border-border">
        <div className="container-luxe py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link to="/products" className="text-muted-foreground hover:text-foreground">
              Products
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link
              to={`/products?category=${(product.category || '').toLowerCase()}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {product.category || 'Products'}
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-luxe py-8 md:py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
              <img
                src={productImages[selectedImage] || productImages[0] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail images */}
            {productImages.length > 1 && (
              <div className="flex gap-4">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      'w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors',
                      selectedImage === index
                        ? 'border-accent'
                        : 'border-transparent hover:border-border'
                    )}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex gap-2">
              {product.isNew && <span className="badge-new">New Arrival</span>}
              {(product.discount || product.discountPercentage) && (
                <span className="badge-sale">
                  {product.discount || product.discountPercentage}% Off
                </span>
              )}
            </div>

            {/* Brand */}
            {product.brand && (
              <p className="text-sm text-muted-foreground uppercase tracking-widest">
                {product.brand}
              </p>
            )}

            {/* Name */}
            <h1 className="font-display text-3xl md:text-4xl font-semibold">
              {product.name}
            </h1>

            {/* Rating */}
            {(product.rating || product.rating === 0) && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-5 w-5',
                        i < Math.floor(product.rating || 0)
                          ? 'fill-gold text-gold'
                          : 'text-muted'
                      )}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">
                  {product.rating || 0} ({product.reviewCount || 0} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                  <span className="text-accent font-medium">
                    Save {formatCurrency(product.originalPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Stock status */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  (product.stock || 0) > 0 ? 'bg-success' : 'bg-destructive'
                )}
              />
              <span className="text-sm">
                {(product.stock || 0) > 0
                  ? (product.stock || 0) > 10
                    ? 'In Stock'
                    : `Only ${product.stock} left`
                  : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center border border-border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={incrementQuantity}
                  disabled={quantity >= (product.stock || 0)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              <Button
                size="xl"
                variant={inCart ? 'secondary' : 'accent'}
                className="flex-1"
                onClick={handleAddToCart}
                disabled={(product.stock || 0) === 0}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                {inCart ? 'Add More' : 'Add to Cart'}
              </Button>
              <Button
                size="xl"
                variant="outline"
                onClick={handleToggleWishlist}
                className={cn(inWishlist && 'text-accent border-accent')}
              >
                <Heart className={cn('h-5 w-5', inWishlist && 'fill-current')} />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="flex flex-col items-center text-center gap-2">
                <Truck className="h-6 w-6 text-accent" />
                <span className="text-xs text-muted-foreground">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Shield className="h-6 w-6 text-accent" />
                <span className="text-xs text-muted-foreground">2 Year Warranty</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <RefreshCw className="h-6 w-6 text-accent" />
                <span className="text-xs text-muted-foreground">30-Day Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
              >
                Reviews ({product.reviewCount || 0})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="pt-6">
              <div className="prose max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description || 'No description available.'}
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Crafted with meticulous attention to detail, this piece represents the pinnacle
                  of contemporary design. Each element has been carefully considered to ensure
                  both aesthetic beauty and functional excellence.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="details" className="pt-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium">{product.category || 'N/A'}</dd>
                </div>
                {product.brand && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">Brand</dt>
                    <dd className="font-medium">{product.brand}</dd>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-muted-foreground">SKU</dt>
                  <dd className="font-medium">
                    LX-{String(productId || '').padStart(6, '0')}
                  </dd>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-muted-foreground">Availability</dt>
                  <dd className="font-medium">
                    {(product.stock || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                  </dd>
                </div>
              </dl>
            </TabsContent>
            <TabsContent value="reviews" className="pt-6">
              <div className="space-y-6">
                {/* Review Form Button */}
                {isAuthenticated && (
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      onClick={handleOpenReviewDialog}
                    >
                      {userReview ? 'Edit Your Review' : 'Write a Review'}
                    </Button>
                  </div>
                )}

                {/* Reviews List */}
                {isLoadingReviews ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading reviews...
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      {isAuthenticated 
                        ? 'Be the first to review this product'
                        : 'No reviews yet. Login to write a review.'}
                    </p>
                    {!isAuthenticated && (
                      <Button variant="outline" asChild>
                        <Link to="/login">Login to Review</Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review._id || review.id} className="border-b border-border pb-6 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                              {review.user?.avatar ? (
                                <img 
                                  src={review.user.avatar} 
                                  alt={review.user.name}
                                  className="h-full w-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium">
                                  {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{review.user?.name || 'Anonymous'}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-4 w-4',
                                  i < review.rating
                                    ? 'fill-gold text-gold'
                                    : 'text-muted'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-semibold mb-8">
              You May Also Like
            </h2>
            <ProductGrid products={relatedProducts} columns={4} />
          </section>
        )}

        {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{userReview ? 'Edit Your Review' : 'Write a Review'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating })}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        reviewForm.rating >= rating
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      )}
                    >
                      <Star
                        className={cn(
                          'h-5 w-5',
                          reviewForm.rating >= rating
                            ? 'fill-current'
                            : 'text-muted-foreground'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Comment (Optional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Share your thoughts about this product..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsReviewDialogOpen(false)}
                disabled={isSubmittingReview}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

