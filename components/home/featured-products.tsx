"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/cart-context";
import { formatNaira } from "@/lib/utils";

const featuredProducts = [
  {
    id: "1",
    name: "Samsung Galaxy S24",
    price: 850000,
    originalPrice: 950000,
    image: "https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.8,
    reviews: 127,
    badge: "Best Seller",
    discount: 11,
  },
  {
    id: "2",
    name: "Apple MacBook Air M2",
    price: 1200000,
    originalPrice: 1350000,
    image: "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.9,
    reviews: 89,
    badge: "New",
    discount: 11,
  },
  {
    id: "3",
    name: "Nike Air Force 1",
    price: 65000,
    originalPrice: 80000,
    image: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.7,
    reviews: 203,
    badge: "Popular",
    discount: 19,
  },
  {
    id: "4",
    name: "Sony WH-1000XM4",
    price: 180000,
    originalPrice: 220000,
    image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.8,
    reviews: 156,
    badge: "Sale",
    discount: 18,
  },
  {
    id: "5",
    name: "LG 55\" OLED TV",
    price: 450000,
    originalPrice: 520000,
    image: "https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.6,
    reviews: 74,
    badge: "Deal",
    discount: 13,
  },
  {
    id: "6",
    name: "Adidas Ultraboost 22",
    price: 85000,
    originalPrice: 100000,
    image: "https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 4.7,
    reviews: 91,
    badge: "Trending",
    discount: 15,
  },
];

export function FeaturedProducts() {
  const { addItem } = useCart();

  const handleAddToCart = (product: typeof featuredProducts[0]) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {featuredProducts.map((product) => (
          <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden">
            <div className="relative">
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {product.badge}
                  </Badge>
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
                {product.discount > 0 && (
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="destructive">
                      -{product.discount}%
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
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Link href="/products">
          <Button variant="outline" size="lg">
            View All Products
          </Button>
        </Link>
      </div>
    </section>
  );
}