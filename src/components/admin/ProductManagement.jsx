import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Upload, X } from 'lucide-react';
import { productsAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { formatCurrency, getImageUrl } from '@/lib/utils';

export function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    stock: '',
    isFeatured: false,
    isNew: false,
  });

  // Image upload state
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Load products and categories from API
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      const categoriesData = response.data?.data || response.data || [];
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : [];
      setCategories(categoriesArray);
      
      if (categoriesArray.length === 0) {
        console.warn('No categories found. Default categories should be created automatically.');
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      console.error('Error details:', error.response?.data || error.message);
      setCategories([]);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productsAPI.getAll({ limit: 1000 });
      const productsData = response.data.data || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      category: '',
      stock: '',
      isFeatured: false,
      isNew: false,
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setEditingProduct(null);
  };

  const openAddDialog = (e) => {
    try {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Ensure categories are loaded
      if (categories.length === 0) {
        loadCategories();
      }
      
      resetForm();
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error opening add dialog:', error);
      console.error('Error stack:', error.stack);
      toast.error('Failed to open add product dialog. Please check the console for details.');
    }
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      originalPrice: product.originalPrice?.toString() || '',
      category: product.category || '',
      stock: product.stock?.toString() || '0',
      isFeatured: product.isFeatured || false,
      isNew: product.isNew || false,
    });
    
    // Set image previews for existing product (full URLs)
    if (product.images && product.images.length > 0) {
      const imageUrls = product.images.map(img => getImageUrl(img));
      setImagePreviews(imageUrls);
    } else {
      setImagePreviews([]);
    }
    setSelectedImages([]); // Clear selected images for new uploads
    setIsDialogOpen(true);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      toast.error('Please select only image files');
      return;
    }

    // Limit to 5 images total (existing + new)
    const existingImageCount = editingProduct ? (imagePreviews.filter(p => !p.startsWith('data:')).length) : 0;
    const remainingSlots = 5 - existingImageCount - selectedImages.length;
    if (remainingSlots <= 0) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    const filesToAdd = validFiles.slice(0, remainingSlots);
    
    setSelectedImages([...selectedImages, ...filesToAdd]);

    // Create previews
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    // Check if it's a new image (data URL) or existing image (HTTP URL)
    const preview = imagePreviews[index];
    const isNewImage = typeof preview === 'string' && preview.startsWith('data:');
    
    if (isNewImage) {
      // It's a new image - find and remove the corresponding file
      // New images are added at the end of imagePreviews
      const newImageIndex = imagePreviews.length - selectedImages.length;
      if (index >= newImageIndex) {
        const fileIndex = index - newImageIndex;
        setSelectedImages(selectedImages.filter((_, i) => i !== fileIndex));
      }
    }
    // Remove from previews
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.category || formData.category === 'no-categories') {
      toast.error('Please fill in all required fields (Name, Price, Category)');
      return;
    }

    setIsSaving(true);
    try {
      const productFormData = new FormData();
      
      // Ensure description is provided (use name as fallback)
      const description = formData.description?.trim() || formData.name;
      
      // Add form fields
      productFormData.append('name', formData.name.trim());
      productFormData.append('description', description);
      productFormData.append('price', parseFloat(formData.price).toString());
      if (formData.originalPrice) {
        productFormData.append('originalPrice', parseFloat(formData.originalPrice).toString());
      }
      productFormData.append('category', formData.category);
      productFormData.append('stock', (formData.stock ? parseInt(formData.stock) : 0).toString());
      productFormData.append('isFeatured', formData.isFeatured.toString());
      productFormData.append('isNew', formData.isNew.toString());

      // Add images (only new ones, not existing previews)
      selectedImages.forEach((file) => {
        productFormData.append('images', file);
      });

      // If editing and no new images, keep existing images
      if (editingProduct && selectedImages.length === 0 && imagePreviews.length > 0) {
        // For update, we'll let the backend handle existing images
        // The backend will only update images if new ones are provided
      }

      let response;
      if (editingProduct) {
        // Update existing product
        response = await productsAPI.update(editingProduct._id || editingProduct.id, productFormData);
        toast.success('Product updated successfully');
      } else {
        // Create new product
        response = await productsAPI.create(productFormData);
        toast.success('Product added successfully');
      }

      // Reload products
      await loadProducts();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Save product error:', error);
      console.error('Error response:', error.response?.data);
      
      // Better error handling
      let errorMessage = 'Failed to save product';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const validationErrors = errorData.errors.map(err => err.msg || err.message).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for authentication errors
      if (error.response?.status === 401) {
        errorMessage = 'You are not authorized. Please log in as admin or merchant.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.response?.status === 0 || !error.response) {
        errorMessage = 'Network error. Please check if the backend server is running.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted successfully');
      await loadProducts();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Delete product error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete product';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={openAddDialog} type="button">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Products Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product._id || product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={getImageUrl(product.images?.[0])}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.brand && (
                          <p className="text-sm text-muted-foreground">{product.brand}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatCurrency(product.price)}</p>
                      {product.originalPrice && (
                        <p className="text-sm text-muted-foreground line-through">
                          {formatCurrency(product.originalPrice)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.stock > 10 ? 'default' : product.stock > 0 ? 'secondary' : 'destructive'}>
                      {product.stock || 0} in stock
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {product.isFeatured && <Badge variant="outline">Featured</Badge>}
                      {product.isNew && <Badge variant="outline">New</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeleteConfirmId(product._id || product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog - Modal Popup */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDialogOpen(false);
          resetForm();
        }
      }} modal={true}>
        <DialogContent 
          className="!flex !flex-col max-w-lg max-h-[90vh] p-0 gap-0 [&>button]:hidden"
          style={{ height: '90vh' }}
          onInteractOutside={(e) => {
            // Prevent closing when clicking outside if form is being saved
            if (isSaving) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing with Escape if form is being saved
            if (isSaving) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle className="text-lg">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4 px-6 overflow-y-auto overflow-x-hidden flex-1" style={{ minHeight: 0 }}>
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter product description"
                rows={2}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="originalPrice">Original Price</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {!categories || categories.length === 0 ? (
                      <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                    ) : (
                      categories.map((cat) => {
                        if (!cat || !cat.name) return null;
                        return (
                          <SelectItem key={cat._id || cat.id || cat.name} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        );
                      }).filter(Boolean)
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
            
            {/* Image Upload */}
            <div className="grid gap-2">
              <Label className="text-sm">Product Images (Max 5)</Label>
              <div className="grid grid-cols-4 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {imagePreviews.length < 5 && (
                  <label className="flex items-center justify-center h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {imagePreviews.length}/5 images {editingProduct && selectedImages.length === 0 ? '(existing)' : selectedImages.length > 0 ? `(${selectedImages.length} new)` : ''}
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
                <Label htmlFor="featured" className="text-sm">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="new"
                  checked={formData.isNew}
                  onCheckedChange={(checked) => setFormData({ ...formData, isNew: checked })}
                />
                <Label htmlFor="new" className="text-sm">New Arrival</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this product? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

