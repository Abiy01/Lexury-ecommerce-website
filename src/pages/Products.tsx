// Product Listing Page
// Displays all products with filters, search, and pagination

import { useState, useMemo } from 'react';
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
import { mockProducts, mockCategories, mockBrands } from '@/data/mockData';
import { ProductFilters as FilterType } from '@/types';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Parse filters from URL
  const filters: FilterType = {
    category: searchParams.get('category') || undefined,
    sortBy: (searchParams.get('sort') as FilterType['sortBy']) || 'newest',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    brands: searchParams.get('brands')?.split(',') || undefined,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    inStock: searchParams.get('inStock') === 'true' || undefined,
  };

  const searchQuery = searchParams.get('search') || '';

  // Price range for filter
  const priceRange = useMemo(() => ({
    min: Math.min(...mockProducts.map((p) => p.price)),
    max: Math.max(...mockProducts.map((p) => p.price)),
  }), []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...mockProducts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.category) {
      result = result.filter(
        (p) => p.category.toLowerCase() === filters.category?.toLowerCase()
      );
    }

    // Price filter
    if (filters.minPrice !== undefined) {
      result = result.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= filters.maxPrice!);
    }

    // Brand filter
    if (filters.brands && filters.brands.length > 0) {
      result = result.filter((p) => p.brand && filters.brands!.includes(p.brand));
    }

    // Rating filter
    if (filters.rating) {
      result = result.filter((p) => p.rating >= filters.rating!);
    }

    // In stock filter
    if (filters.inStock) {
      result = result.filter((p) => p.stock > 0);
    }

    // URL filter params
    const urlFilter = searchParams.get('filter');
    if (urlFilter === 'new') {
      result = result.filter((p) => p.isNew);
    } else if (urlFilter === 'sale') {
      result = result.filter((p) => p.discount && p.discount > 0);
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'popular':
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [filters, searchQuery, searchParams]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterType) => {
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

  const handleSortChange = (value: string) => {
    handleFilterChange({ ...filters, sortBy: value as FilterType['sortBy'] });
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    setSearchParams(params);
  };

  return (
    <Layout>
      <div className="container-luxe py-8 md:py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
            {searchQuery
              ? `Search results for "${searchQuery}"`
              : filters.category
              ? mockCategories.find((c) => c.slug === filters.category)?.name || 'Products'
              : 'All Products'}
          </h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} products found
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
              categories={mockCategories}
              brands={mockBrands}
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
                      categories={mockCategories}
                      brands={mockBrands}
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
            <ProductGrid products={paginatedProducts} columns={viewMode === 'grid' ? 3 : 2} />

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
          </div>
        </div>
      </div>
    </Layout>
  );
}
