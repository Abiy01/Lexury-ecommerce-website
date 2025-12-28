// Product Filters Component
// Sidebar filters for product listing

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ProductFilters as FilterType, Category } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';

interface ProductFiltersProps {
  categories: Category[];
  brands: string[];
  filters: FilterType;
  onFilterChange: (filters: FilterType) => void;
  priceRange: { min: number; max: number };
}

export function ProductFilters({
  categories,
  brands,
  filters,
  onFilterChange,
  priceRange,
}: ProductFiltersProps) {
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    brand: true,
    rating: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryChange = (category: string) => {
    onFilterChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    });
  };

  const handlePriceChange = (values: number[]) => {
    onFilterChange({
      ...filters,
      minPrice: values[0],
      maxPrice: values[1],
    });
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    const currentBrands = filters.brands || [];
    const newBrands = checked
      ? [...currentBrands, brand]
      : currentBrands.filter((b) => b !== brand);
    
    onFilterChange({
      ...filters,
      brands: newBrands.length > 0 ? newBrands : undefined,
    });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({
      ...filters,
      rating: filters.rating === rating ? undefined : rating,
    });
  };

  const handleInStockChange = (checked: boolean) => {
    onFilterChange({
      ...filters,
      inStock: checked || undefined,
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  );

  return (
    <aside className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>

      {/* Categories */}
      <Collapsible
        open={openSections.category}
        onOpenChange={() => toggleSection('category')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border">
          <span className="font-medium text-sm">Category</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              openSections.category && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.slug)}
              className={cn(
                'flex items-center justify-between w-full py-1.5 text-sm transition-colors',
                filters.category === category.slug
                  ? 'text-accent font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>{category.name}</span>
              <span className="text-xs">({category.productCount})</span>
            </button>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Price Range */}
      <Collapsible
        open={openSections.price}
        onOpenChange={() => toggleSection('price')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border">
          <span className="font-medium text-sm">Price</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              openSections.price && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <Slider
            defaultValue={[priceRange.min, priceRange.max]}
            min={priceRange.min}
            max={priceRange.max}
            step={10}
            value={[
              filters.minPrice ?? priceRange.min,
              filters.maxPrice ?? priceRange.max,
            ]}
            onValueChange={handlePriceChange}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatCurrency(filters.minPrice ?? priceRange.min)}</span>
            <span>{formatCurrency(filters.maxPrice ?? priceRange.max)}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Brands */}
      <Collapsible
        open={openSections.brand}
        onOpenChange={() => toggleSection('brand')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border">
          <span className="font-medium text-sm">Brand</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              openSections.brand && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-3">
          {brands.map((brand) => (
            <label
              key={brand}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Checkbox
                checked={filters.brands?.includes(brand) ?? false}
                onCheckedChange={(checked) =>
                  handleBrandChange(brand, checked as boolean)
                }
              />
              <span className="text-sm text-muted-foreground hover:text-foreground">
                {brand}
              </span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Rating */}
      <Collapsible
        open={openSections.rating}
        onOpenChange={() => toggleSection('rating')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border">
          <span className="font-medium text-sm">Rating</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              openSections.rating && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingChange(rating)}
              className={cn(
                'flex items-center gap-2 w-full py-1 text-sm transition-colors',
                filters.rating === rating
                  ? 'text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="text-gold">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
              <span>& Up</span>
            </button>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* In Stock */}
      <label className="flex items-center space-x-2 cursor-pointer py-2">
        <Checkbox
          checked={filters.inStock ?? false}
          onCheckedChange={(checked) => handleInStockChange(checked as boolean)}
        />
        <span className="text-sm font-medium">In Stock Only</span>
      </label>
    </aside>
  );
}

export default ProductFilters;
