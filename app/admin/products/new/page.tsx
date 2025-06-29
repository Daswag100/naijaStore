"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Upload, X, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    compare_price: "",
    sku: "",
    inventory_quantity: "",
    category_id: "",
    images: [] as string[],
    status: "active",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  // Preview image when URL changes
  useEffect(() => {
    if (imageUrl) {
      setImagePreview(imageUrl);
    } else {
      setImagePreview("");
    }
  }, [imageUrl]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError("");
      console.log('🔍 Fetching categories...');
      
      const response = await fetch('/api/categories');
      const data = await response.json();
      
      console.log('📊 Categories response:', data);
      
      if (response.ok) {
        const categoriesArray = data.categories || [];
        setCategories(categoriesArray);
        console.log('✅ Categories loaded:', categoriesArray.length);
        
        if (categoriesArray.length === 0) {
          setCategoriesError("No categories found. Please create categories first.");
        }
      } else {
        console.error('❌ Failed to fetch categories:', data.error);
        setCategoriesError(data.error || "Failed to load categories");
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      setCategoriesError("Failed to load categories. Please check your connection.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    console.log(`🔄 Setting ${name} to:`, value);
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const addImage = () => {
    if (imageUrl && !formData.images.includes(imageUrl)) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
      setImageUrl("");
      setImagePreview("");
      
      toast({
        title: "Image added",
        description: "Image URL has been added to the product gallery",
      });
    } else if (formData.images.includes(imageUrl)) {
      toast({
        title: "Duplicate image",
        description: "This image URL is already added",
        variant: "destructive",
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    
    toast({
      title: "Image removed",
      description: "Image has been removed from the gallery",
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = "Valid price is required";
    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    if (!formData.inventory_quantity || parseInt(formData.inventory_quantity) < 0) {
      newErrors.inventory_quantity = "Valid inventory quantity is required";
    }
    if (!formData.category_id) newErrors.category_id = "Category is required";
    if (formData.images.length === 0) newErrors.images = "At least one image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: formData.compare_price ? parseFloat(formData.compare_price) : undefined,
        stockQuantity: parseInt(formData.inventory_quantity),
        category: formData.category_id,
        images: formData.images,
      };

      console.log('📤 Submitting product data:', productData);

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product created successfully",
        });
        router.push('/admin/products');
      } else {
        throw new Error(data.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('❌ Error creating product:', error);
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600">Create a new product for your store</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details about your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>
                  Set the pricing for your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₦) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    {errors.price && (
                      <p className="text-sm text-red-600">{errors.price}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compare_price">Compare Price (₦)</Label>
                    <Input
                      id="compare_price"
                      name="compare_price"
                      type="number"
                      value={formData.compare_price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Add images to showcase your product. Use high-quality image URLs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                    </div>
                    <Button 
                      type="button" 
                      onClick={addImage} 
                      variant="outline"
                      disabled={!imageUrl.trim()}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <div className="flex items-start space-x-3">
                        <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-white border">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                            onError={() => setImagePreview("")}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 break-all">{imageUrl}</p>
                          <a 
                            href={imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center mt-1"
                          >
                            Open in new tab <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {errors.images && (
                  <p className="text-sm text-red-600">{errors.images}</p>
                )}

                {formData.images.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Product Gallery ({formData.images.length} images)
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 border">
                            <Image
                              src={image}
                              alt={`Product image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                              Image {index + 1}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Visibility */}
            <Card>
              <CardHeader>
                <CardTitle>Status & Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Organization */}
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category *</Label>
                  {categoriesLoading ? (
                    <div className="flex items-center justify-center p-3 border rounded-md">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading categories...</span>
                    </div>
                  ) : categoriesError ? (
                    <div className="space-y-3">
                      <Alert variant="destructive">
                        <AlertDescription>{categoriesError}</AlertDescription>
                      </Alert>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchCategories}
                        className="w-full"
                      >
                        Retry Loading Categories
                      </Button>
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="p-3 border rounded-md bg-yellow-50">
                      <p className="text-sm text-yellow-800 mb-2">
                        No categories found. Please create categories first.
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('/admin/categories', '_blank')}
                      >
                        Create Categories
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => {
                        console.log('🏷️ Category selected:', value);
                        handleSelectChange("category_id", value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.category_id && (
                    <p className="text-sm text-red-600">{errors.category_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="Enter SKU (e.g., PROD-001)"
                  />
                  {errors.sku && (
                    <p className="text-sm text-red-600">{errors.sku}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inventory_quantity">Quantity *</Label>
                  <Input
                    id="inventory_quantity"
                    name="inventory_quantity"
                    type="number"
                    value={formData.inventory_quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                  />
                  {errors.inventory_quantity && (
                    <p className="text-sm text-red-600">{errors.inventory_quantity}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading || categoriesLoading}
              >
                {loading ? "Creating..." : "Create Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}