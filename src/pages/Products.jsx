// Product Listing Page
// Displays all products with filters, search, and pagination

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Grid3X3, LayoutList, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { productsAPI } from '@/services/api';
import { mockProducts, mockCategories, mockBrands } from '@/data/mockData';

const ITEMS_PER_PAGE = 12;

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(mockCategories);
  const [brands, setBrands] = useState(mockBrands);
  const [isLoading, setIsLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Parse filters from URL
  const filters = {
    category: searchParams.get('category') || undefined,
    sortBy: searchParams.get('sort') || 'newest',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    brands: searchParams.get('brands')?.split(',') || undefined,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    inStock: searchParams.get('inStock') === 'true' || undefined,
  };

  const searchQuery = searchParams.get('search') || '';

  // Fetch products from API
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: searchQuery || undefined,
          category: filters.category,
          sort: filters.sortBy,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          brand: filters.brands?.[0], // Backend expects single brand
          rating: filters.rating,
          inStock: filters.inStock ? 'true' : undefined,
        };

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const response = await productsAPI.getAll(params);
        const data = response.data.data || response.data;
        const pagination = response.data.pagination;

        if (Array.isArray(data)) {
          setProducts(data);
          if (pagination) {
            setTotalProducts(pagination.total || data.length);
          } else {
            setTotalProducts(data.length);
          }
        } else if (data && Array.isArray(data.products)) {
          setProducts(data.products);
          setTotalProducts(data.total || data.products.length);
        } else {
          setProducts([]);
          setTotalProducts(0);
        }

        // Load categories
        try {
          const categoriesResponse = await productsAPI.getCategories();
          const cats = categoriesResponse.data.data || categoriesResponse.data || [];
          if (Array.isArray(cats) && cats.length > 0) {
            setCategories(cats);
          }
        } catch (error) {
          console.error('Failed to load categories:', error);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
        // Fallback to mock data
        setProducts(mockProducts);
        setTotalProducts(mockProducts.length);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [currentPage, searchQuery, filters.category, filters.sortBy, filters.minPrice, filters.maxPrice, filters.brands, filters.rating, filters.inStock]);

  // Price range for filter (from products)
  const priceRange = useMemo(() => {
    if (products.length === 0) {
      return { min: 0, max: 1000 };
    }
    return {
      min: Math.min(...products.map((p) => p.price)),
      max: Math.max(...products.map((p) => p.price)),
    };
  }, [products]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, String(value));
        }
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    handleFilterChange({ ...filters, sortBy: value });
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    setSearchParams(params);
  };

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  return (
    <Layout>
      <div className="container-luxe py-8 md:py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
            {searchQuery
              ? `Search results for "${searchQuery}"`
              : filters.category
              ? categories.find((c) => c.slug === filters.category)?.name || 'Products'
              : 'All Products'}
          </h1>
          <p className="text-muted-foreground">
            {isLoading ? 'Loading...' : `${totalProducts} products found`}
          </p>
        </div>

        {/* Search tag */}
        {searchQuery && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Searching for:</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm">
              {searchQuery}
              <button onClick={clearSearch} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ProductFilters
              categories={categories}
              brands={brands}
              filters={filters}
              onFilterChange={handleFilterChange}
              priceRange={priceRange}
            />
          </aside>

          {/* Main content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
              {/* Mobile filter button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <ProductFilters
                      categories={categories}
                      brands={brands}
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      priceRange={priceRange}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort dropdown */}
              <div className="flex items-center gap-4 ml-auto">
                <Select value={filters.sortBy || 'newest'} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View mode toggle */}
                <div className="hidden md:flex items-center border border-border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => setViewMode('list')}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <>
                <ProductGrid products={products} columns={viewMode === 'grid' ? 3 : 2} />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'accent' : 'ghost'}
                          size="icon"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

