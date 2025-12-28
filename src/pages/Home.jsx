// Home Page Component
// Landing page with hero, featured products, and categories

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RefreshCw, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { productsAPI } from '@/services/api';
import { mockProducts, mockCategories } from '@/data/mockData';
import heroBanner from '@/assets/hero-banner.jpg';

// Helper function to get category image
// Add your custom image URLs here for each category
const getCategoryImage = (categoryName) => {
  const categoryImageMap = {
    'Beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=1000&fit=crop',
    'Books': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=1000&fit=crop',
    'Electronics': 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=1000&fit=crop',
    'Fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=1000&fit=crop',
    'Food & Beverages': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=1000&fit=crop',
    'Home & Living': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=1000&fit=crop',
    'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=1000&fit=crop',
    'Toys': 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=1000&fit=crop',
  };
  return categoryImageMap[categoryName] || null;
};

// Features data
const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over $100',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% protected transactions',
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    description: '30-day return policy',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Dedicated customer service',
  },
];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [categories, setCategories] = useState(mockCategories);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Fetch featured products
        const featuredResponse = await productsAPI.getFeatured();
        const featured = featuredResponse.data.data || featuredResponse.data || [];
        setFeaturedProducts(Array.isArray(featured) ? featured.slice(0, 4) : []);

        // Fetch new products (filter by isNew)
        const newResponse = await productsAPI.getAll({ sort: 'newest', limit: 4 });
        const newProds = newResponse.data.data || newResponse.data || [];
        setNewProducts(Array.isArray(newProds) ? newProds : []);

        // Fetch categories
        try {
          const categoriesResponse = await productsAPI.getCategories();
          const cats = categoriesResponse.data.data || categoriesResponse.data || [];
          const categoriesArray = Array.isArray(cats) ? cats : [];
          
          // Merge with mock categories to ensure we have images
          const mergedCategories = categoriesArray.map(cat => {
            const mockCat = mockCategories.find(mc => mc.name === cat.name || mc.slug === cat.slug);
            return {
              ...cat,
              image: cat.image || mockCat?.image || getCategoryImage(cat.name)
            };
          });
          
          setCategories(mergedCategories.length > 0 ? mergedCategories : mockCategories);
        } catch (error) {
          console.error('Failed to load categories:', error);
          // Keep mock categories as fallback
          setCategories(mockCategories);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
        // Fallback to mock data
        setFeaturedProducts(mockProducts.filter((p) => p.isFeatured).slice(0, 4));
        setNewProducts(mockProducts.filter((p) => p.isNew).slice(0, 4));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={heroBanner}
            alt="Luxury accessories"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="container-luxe relative z-10">
          <div className="max-w-xl animate-slide-up">
            <span className="inline-block text-accent text-sm font-semibold uppercase tracking-widest mb-4">
              New Collections
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight mb-6">
              Discover Timeless Elegance
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              Curated luxury Products for those who appreciate exceptional craftsmanship and refined style.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="xl" variant="accent">
                <Link to="/products">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link to="/products?filter=new">
                  View New Arrivals
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-secondary border-y border-border">
        <div className="container-luxe py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent-light flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24">
        <div className="container-luxe">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
              Shop by Category
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Explore our carefully curated collections
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No categories available
              </div>
            ) : (
              categories.map((category, index) => (
                <Link
                  key={category._id || category.id || index}
                  to={`/products?category=${category.slug || category.name?.toLowerCase()}`}
                  className="group relative aspect-[4/5] rounded-lg overflow-hidden bg-secondary hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {category.image && (
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-primary-foreground">
                    <h3 className="font-display text-lg font-semibold">{category.name}</h3>
                    <p className="text-sm opacity-80">
                      {category.productCount || 0} products
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-gradient-hero">
        <div className="container-luxe">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-2">
                Featured Products
              </h2>
              <p className="text-muted-foreground">
                Handpicked selections for discerning taste
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/products">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <ProductGrid products={featuredProducts} columns={4} />
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container-luxe">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-accent text-sm font-semibold uppercase tracking-widest">
                Just In
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-semibold mt-2">
                New Arrivals
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/products?filter=new">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <ProductGrid products={newProducts} columns={4} />
        </div>
      </section>
    </Layout>
  );
}

