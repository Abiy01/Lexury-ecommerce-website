// Product Card Component
// Displays a product in grid/list views

import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatCurrency, cn, getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact';
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const { addItem, isInCart } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();

  const inCart = isInCart(product.id);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast.success('Added to cart', {
      description: product.name,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
    toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist', {
      description: product.name,
    });
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block"
    >
      <div className={cn(
        'relative overflow-hidden rounded-lg bg-card',
        variant === 'default' ? 'hover-lift' : ''
      )}>
        {/* Image container */}
        <div className="product-zoom aspect-square relative bg-secondary">
          <img
            src={getImageUrl(product.images?.[0])}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && (
              <span className="badge-new">New</span>
            )}
            {product.discount && (
              <span className="badge-sale">-{product.discount}%</span>
            )}
          </div>

          {/* Quick actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className={cn(
                'h-9 w-9 rounded-full shadow-md',
                inWishlist && 'bg-accent text-accent-foreground hover:bg-accent-hover'
              )}
              onClick={handleToggleWishlist}
            >
              <Heart className={cn('h-4 w-4', inWishlist && 'fill-current')} />
            </Button>
          </div>

          {/* Add to cart overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Button
              variant={inCart ? 'secondary' : 'accent'}
              className="w-full shadow-lg"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              {inCart ? 'In Cart' : 'Add to Cart'}
            </Button>
          </div>
        </div>

        {/* Product info */}
        <div className="p-4">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
              {product.brand}
            </p>
          )}
          
          {/* Name */}
          <h3 className="font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviewCount})
            </span>
          </div>
          
          {/* Price */}
          <div className="flex items-center gap-2 mt-2">
            <span className="price-current text-lg">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="price-original">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
