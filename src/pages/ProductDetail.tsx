// Product Details Page
// Shows detailed product information with images, variants, and add to cart

import { useState } from 'react';
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
import { mockProducts } from '@/data/mockData';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { addItem, isInCart } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();

  // Find product by slug
  const product = mockProducts.find((p) => p.slug === slug);

  // Related products
  const relatedProducts = mockProducts
    .filter((p) => p.category === product?.category && p.id !== product?.id)
    .slice(0, 4);

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

  const inCart = isInCart(product.id);
  const inWishlist = isInWishlist(product.id);

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
    setQuantity((q) => Math.min(product.stock, q + 1));
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
              to={`/products?category=${product.category.toLowerCase()}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {product.category}
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
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail images */}
            {product.images.length > 1 && (
              <div className="flex gap-4">
                {product.images.map((image, index) => (
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
              {product.discount && <span className="badge-sale">{product.discount}% Off</span>}
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
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-5 w-5',
                      i < Math.floor(product.rating)
                        ? 'fill-gold text-gold'
                        : 'text-muted'
                    )}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

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
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Stock status */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  product.stock > 0 ? 'bg-success' : 'bg-destructive'
                )}
              />
              <span className="text-sm">
                {product.stock > 0
                  ? product.stock > 10
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
                  disabled={quantity >= product.stock}
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
                disabled={product.stock === 0}
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
                Reviews ({product.reviewCount})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="pt-6">
              <div className="prose max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
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
                  <dd className="font-medium">{product.category}</dd>
                </div>
                {product.brand && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">Brand</dt>
                    <dd className="font-medium">{product.brand}</dd>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-muted-foreground">SKU</dt>
                  <dd className="font-medium">LX-{product.id.padStart(6, '0')}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <dt className="text-muted-foreground">Availability</dt>
                  <dd className="font-medium">{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</dd>
                </div>
              </dl>
            </TabsContent>
            <TabsContent value="reviews" className="pt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Be the first to review this product
                </p>
                <Button variant="outline">Write a Review</Button>
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
      </div>
    </Layout>
  );
}
