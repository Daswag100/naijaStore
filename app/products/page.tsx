"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Grid, List, Star, Heart, ShoppingCart, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useCart } from "@/contexts/cart-context";
import { formatNaira } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  images: string[];
  category_id: string;
  inventory_quantity: number;
  status: string;
  description: string;
  sku: string;
  created_at: string;
  category?: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 2000000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching products from API...');
      
      const response = await fetch('/api/products');
      const data = await response.json();
      
      console.log('📊 Products API response:', data);
      
      if (response.ok) {
        // Handle the response structure from your API
        const productsArray = data.products || data.data || [];
        setProducts(productsArray);
        console.log('✅ Products loaded:', productsArray.length);
      } else {
        throw new Error(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('🔍 Fetching categories from API...');
      
      const response = await fetch('/api/categories');
      const data = await response.json();
      
      console.log('📊 Categories API response:', data);
      
      if (response.ok) {
        const categoriesArray = data.categories || [];
        setCategories(categoriesArray);
        console.log('✅ Categories loaded:', categoriesArray.length);
      } else {
        console.error('❌ Failed to fetch categories:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
    }
  };

  // Filter products based on current criteria
  const filteredProducts = products.filter(product => {
    // Only show active products
    if (product.status !== 'active') return false;
    
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    const matchesCategory = selectedCategories.length === 0 || 
                           selectedCategories.includes(product.category_id) ||
                           selectedCategories.includes(product.category?.name || '');
    
    return matchesSearch && matchesPrice && matchesCategory;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0; // featured - keep original order
    }
  });

  const handleAddToCart = (product: Product) => {
    if (product.inventory_quantity <= 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: getProductImage(product),
      quantity: 1,
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  // FIXED: Better image handling function
  const getProductImage = (product: Product) => {
    // Debug log to see what images look like
    console.log('Product images for', product.name, ':', product.images);
    
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      
      // If it's a valid URL or base64, return it
      if (typeof firstImage === 'string' && firstImage.trim()) {
        return firstImage;
      }
    }
    
    // Fallback image
    return 'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800';
  };

  const isProductInStock = (product: Product) => {
    return product.inventory_quantity > 0;
  };

  const getCategoryName = (product: Product) => {
    return product.category?.name || 'Uncategorized';
  };

  const generateProductRating = (product: Product) => {
    // Since your database doesn't have ratings yet, generate a consistent random rating based on product ID
    const hash = product.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return 4.0 + (Math.abs(hash) % 10) / 10; // Rating between 4.0 and 4.9
  };

  const generateReviewCount = (product: Product) => {
    // Generate consistent review count based on product ID
    const hash = product.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return 20 + (Math.abs(hash) % 200); // Reviews between 20 and 220
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">All Products</h1>
        <p className="text-gray-600">Discover our complete collection of premium products</p>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className={`w-64 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Price Range</h3>
            <div className="space-y-4">
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={2000000}
                step={10000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatNaira(priceRange[0])}</span>
                <span>{formatNaira(priceRange[1])}</span>
              </div>
            </div>
          </Card>

          {categories.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([...selectedCategories, category.id]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category.id));
                        }
                      }}
                    />
                    <label htmlFor={category.id} className="text-sm">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">
              Showing {sortedProducts.length} of {products.length} products
            </p>
            {products.length === 0 && !loading && (
              <Button onClick={fetchProducts} variant="outline" size="sm">
                <Loader2 className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
              <p className="text-gray-600 mb-4">
                Products will appear here once they are added through the admin panel.
              </p>
              <Button onClick={fetchProducts} className="bg-green-600 hover:bg-green-700">
                <Loader2 className="w-4 h-4 mr-2" />
                Refresh Products
              </Button>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No products found matching your criteria.</p>
              <Button onClick={() => {
                setSearchQuery("");
                setSelectedCategories([]);
                setPriceRange([0, 2000000]);
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {sortedProducts.map((product) => {
                const rating = generateProductRating(product);
                const reviewCount = generateReviewCount(product);
                const inStock = isProductInStock(product);
                
                return (
                  <Card key={product.id} className={`group hover:shadow-lg transition-all duration-300 ${
                    viewMode === "list" ? "flex" : ""
                  }`}>
                    <div className={`relative ${viewMode === "list" ? "w-48" : "aspect-square"} overflow-hidden`}>
                      {/* FIXED: Better image rendering */}
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          console.log(`Failed to load image for product: ${product.name}`);
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800';
                        }}
                      />
                      <div className="absolute top-3 left-3">
                        {!inStock && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            Out of Stock
                          </Badge>
                        )}
                        {product.compare_price && product.compare_price > product.price && (
                          <Badge className="bg-green-100 text-green-800 ml-2">
                            Sale
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-3 right-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-white/80 hover:bg-white text-gray-700 rounded-full w-8 h-8 p-0"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <CardContent className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(rating)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">
                          {rating.toFixed(1)} ({reviewCount})
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-lg font-bold text-gray-900">
                            {formatNaira(product.price)}
                          </span>
                          {product.compare_price && product.compare_price > product.price && (
                            <span className="text-sm text-gray-500 ml-2 line-through">
                              {formatNaira(product.compare_price)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-3">
                        {getCategoryName(product)} • SKU: {product.sku}
                      </div>

                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={!inStock}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {inStock ? "Add to Cart" : "Out of Stock"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}