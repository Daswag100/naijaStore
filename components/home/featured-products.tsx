"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Heart, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching featured products...');
      
      // Fetch latest 6 products from your database
      const response = await fetch('/api/products?limit=6&featured=true');
      const data = await response.json();
      
      if (response.ok) {
        const productsArray = data.products || [];
        setProducts(productsArray.slice(0, 6)); // Limit to 6 products
        console.log('✅ Featured products loaded:', productsArray.length);
      } else {
        throw new Error(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('❌ Error fetching featured products:', error);
      // Fallback to sample data if API fails
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

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

  // Get the first available image or fallback
  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return 'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800';
  };

  // Generate consistent rating based on product ID
  const generateRating = (product: Product) => {
    const hash = product.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return 4.0 + (Math.abs(hash) % 10) / 10; // Rating between 4.0 and 4.9
  };

  // Generate review count
  const generateReviewCount = (product: Product) => {
    const hash = product.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return 20 + (Math.abs(hash) % 180); // Reviews between 20 and 200
  };

  // Calculate discount percentage
  const getDiscountPercentage = (product: Product) => {
    if (product.compare_price && product.compare_price > product.price) {
      return Math.round(((product.compare_price - product.price) / product.compare_price) * 100);
    }
    return 0;
  };

  // Get product badge
  const getProductBadge = (product: Product) => {
    const isNew = new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    const hasDiscount = getDiscountPercentage(product) > 0;
    
    if (isNew) return "New";
    if (getDiscountPercentage(product) > 15) return "Sale";
    if (getDiscountPercentage(product) > 0) return "Deal";
    return "Featured";
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium products with unbeatable prices
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">Loading featured products...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Featured Products
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover our handpicked selection of premium products with unbeatable prices
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No featured products available at the moment.</p>
          <Link href="/products">
            <Button className="bg-green-600 hover:bg-green-700">
              Browse All Products
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {products.map((product) => {
              const rating = generateRating(product);
              const reviewCount = generateReviewCount(product);
              const discountPercentage = getDiscountPercentage(product);
              const badge = getProductBadge(product);
              const inStock = product.inventory_quantity > 0;

              return (
                <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden">
                  <div className="relative">
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800';
                        }}
                      />
                      
                      {/* Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge 
                          variant="secondary" 
                          className={`${
                            badge === 'Sale' ? 'bg-red-100 text-red-800' :
                            badge === 'New' ? 'bg-blue-100 text-blue-800' :
                            badge === 'Deal' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}
                        >
                          {badge}
                        </Badge>
                      </div>
                      
                      {/* Wishlist button */}
                      <div className="absolute top-3 right-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-white/80 hover:bg-white text-gray-700 rounded-full w-8 h-8 p-0"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Discount badge */}
                      {discountPercentage > 0 && (
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="destructive">
                            -{discountPercentage}%
                          </Badge>
                        </div>
                      )}
                      
                      {/* Out of stock overlay */}
                      {!inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="secondary" className="bg-gray-800 text-white">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Rating */}
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

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
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

                    {/* Category and SKU */}
                    <div className="text-xs text-gray-500 mb-3">
                      {product.category?.name || 'Uncategorized'} • SKU: {product.sku}
                    </div>

                    {/* Add to cart button */}
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

          <div className="text-center">
            <Link href="/products">
              <Button variant="outline" size="lg" className="border-green-600 text-green-600 hover:bg-green-50">
                View All Products
              </Button>
            </Link>
          </div>
        </>
      )}
    </section>
  );
}