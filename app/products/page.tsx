"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, Grid, List, Star, Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useCart } from "@/contexts/cart-context";
import { formatNaira } from "@/lib/utils";

// Mock products data
const allProducts = [
  {
    id: "1",
    name: "Samsung Galaxy S24 Ultra",
    price: 850000,
    originalPrice: 950000,
    image: "https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.8,
    reviews: 127,
    category: "Electronics",
    brand: "Samsung",
    inStock: true,
  },
  {
    id: "2",
    name: "Apple MacBook Air M2",
    price: 1200000,
    originalPrice: 1350000,
    image: "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.9,
    reviews: 89,
    category: "Electronics",
    brand: "Apple",
    inStock: true,
  },
  {
    id: "3",
    name: "Nike Air Force 1",
    price: 65000,
    originalPrice: 80000,
    image: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.7,
    reviews: 203,
    category: "Fashion",
    brand: "Nike",
    inStock: true,
  },
  {
    id: "4",
    name: "Sony WH-1000XM4 Headphones",
    price: 180000,
    originalPrice: 220000,
    image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.8,
    reviews: 156,
    category: "Electronics",
    brand: "Sony",
    inStock: true,
  },
  {
    id: "5",
    name: "LG 55\" OLED Smart TV",
    price: 450000,
    originalPrice: 520000,
    image: "https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.6,
    reviews: 74,
    category: "Electronics",
    brand: "LG",
    inStock: true,
  },
  {
    id: "6",
    name: "Adidas Ultraboost 22",
    price: 85000,
    originalPrice: 100000,
    image: "https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.7,
    reviews: 91,
    category: "Fashion",
    brand: "Adidas",
    inStock: false,
  },
];

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 2000000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const { addItem } = useCart();

  const categories = ["Electronics", "Fashion", "Home", "Sports", "Beauty"];
  const brands = ["Samsung", "Apple", "Nike", "Sony", "LG", "Adidas"];

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    
    return matchesSearch && matchesPrice && matchesCategory && matchesBrand;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "newest":
        return b.id.localeCompare(a.id);
      default:
        return 0;
    }
  });

  const handleAddToCart = (product: typeof allProducts[0]) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

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
              <SelectItem value="rating">Highest Rated</SelectItem>
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

          <Card className="p-4">
            <h3 className="font-semibold mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCategories([...selectedCategories, category]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(c => c !== category));
                      }
                    }}
                  />
                  <label htmlFor={category} className="text-sm">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">Brands</h3>
            <div className="space-y-2">
              {brands.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={brand}
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedBrands([...selectedBrands, brand]);
                      } else {
                        setSelectedBrands(selectedBrands.filter(b => b !== brand));
                      }
                    }}
                  />
                  <label htmlFor={brand} className="text-sm">
                    {brand}
                  </label>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">
              Showing {sortedProducts.length} of {allProducts.length} products
            </p>
          </div>

          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {sortedProducts.map((product) => (
              <Card key={product.id} className={`group hover:shadow-lg transition-all duration-300 ${
                viewMode === "list" ? "flex" : ""
              }`}>
                <div className={`relative ${viewMode === "list" ? "w-48" : "aspect-square"} overflow-hidden`}>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    {!product.inStock && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Out of Stock
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
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-lg font-bold text-gray-900">
                        {formatNaira(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 ml-2 line-through">
                          {formatNaira(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={!product.inStock}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {product.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {sortedProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No products found matching your criteria.</p>
              <Button onClick={() => {
                setSearchQuery("");
                setSelectedCategories([]);
                setSelectedBrands([]);
                setPriceRange([0, 2000000]);
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}