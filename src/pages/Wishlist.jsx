// Wishlist Page
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

export default function Wishlist() {
  const { items, removeItem, isLoading } = useWishlist();
  const { addItem } = useCart();

  const handleAddToCart = (item) => {
    addItem(item.product, 1);
    toast.success('Added to cart', { description: item.product.name });
  };

  const handleRemoveFromWishlist = async (item) => {
    try {
      const productId = item.product?._id || item.product?.id || item._id || item.id;
      if (!productId) {
        toast.error('Unable to remove item: Product ID not found');
        return;
      }
      await removeItem(String(productId));
      // Toast will be shown by the context
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item from wishlist');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container-luxe py-24 text-center">
          <p className="text-muted-foreground">Loading wishlist...</p>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-luxe py-24 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
          <h1 className="font-display text-3xl font-semibold mb-4">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground mb-8">Save items you love for later</p>
          <Button asChild variant="accent">
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-luxe py-8 md:py-12">
        <h1 className="font-display text-3xl md:text-4xl font-semibold mb-8">My Wishlist</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const productId = item.product?._id || item.product?.id || item._id || item.id;
            const product = item.product || item;
            
            return (
              <div key={productId} className="group bg-card rounded-lg border border-border overflow-hidden">
                <Link to={`/products/${product.slug || productId}`} className="block aspect-square bg-secondary">
                  <img 
                    src={getImageUrl(product.images?.[0])} 
                    alt={product.name || 'Product'} 
                    className="w-full h-full object-cover" 
                  />
                </Link>
                <div className="p-4">
                  <h3 className="font-medium line-clamp-1">{product.name || 'Product'}</h3>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency(product.price || 0)}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="accent" 
                      size="sm" 
                      className="flex-1" 
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingBag className="h-4 w-4 mr-1" /> Add to Cart
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleRemoveFromWishlist(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

