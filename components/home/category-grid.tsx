"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Define category type for better type safety
interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  productCount?: number;
}

// Fallback static categories with real data based on audit
const fallbackCategories = [
  {
    id: "electronics",
    name: "Electronics",
    slug: "electronics",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500",
    count: "5 items",
    color: "from-blue-500 to-purple-600"
  },
  {
    id: "fashion", 
    name: "Fashion",
    slug: "fashion",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500",
    count: "12 items",
    color: "from-pink-500 to-rose-600"
  },
  {
    id: "home-living",
    name: "Home & Living",
    slug: "home-living", 
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500",
    count: "1 item",
    color: "from-green-500 to-emerald-600"
  },
  {
    id: "beauty",
    name: "Beauty",
    slug: "beauty",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500",
    count: "2 items",
    color: "from-purple-500 to-pink-600"
  },
];

export function CategoryGrid() {
  const [categories, setCategories] = useState<any[]>(fallbackCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoriesWithCounts();
  }, []);

  const fetchCategoriesWithCounts = async () => {
    try {
      // Fetch categories and products in parallel
      const [categoriesRes, productsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products')
      ]);

      if (categoriesRes.ok && productsRes.ok) {
        const categoriesData = await categoriesRes.json();
        const productsData = await productsRes.json();
        
        // Count products per category
        const categoryCountMap = (productsData.products || []).reduce((acc: any, product: any) => {
          const categoryId = product.category_id;
          acc[categoryId] = (acc[categoryId] || 0) + 1;
          return acc;
        }, {});

        // Map categories with counts
        const categoriesWithCounts = (categoriesData.categories || []).map((cat: CategoryData) => {
          const productCount = categoryCountMap[cat.id] || 0;
          const fallback = fallbackCategories.find(f => f.slug === cat.slug);
          
          return {
            id: cat.slug,
            name: cat.name,
            slug: cat.slug,
            image: cat.image_url || fallback?.image || 'https://via.placeholder.com/400x400?text=Category',
            count: `${productCount} item${productCount !== 1 ? 's' : ''}`,
            color: fallback?.color || 'from-gray-500 to-slate-600'
          };
        }).filter((cat: any) => {
          // Only show categories that have products
          const productCount = categoryCountMap[categoriesData.categories?.find((c: CategoryData) => c.slug === cat.slug)?.id] || 0;
          return productCount > 0;
        });

        if (categoriesWithCounts.length > 0) {
          setCategories(categoriesWithCounts);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Keep fallback categories on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our wide range of product categories and find exactly what you need
          </p>
        </div>
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Shop by Category
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore our wide range of product categories and find exactly what you need
        </p>
      </div>

      {/* Clean 2x2 Grid for 4 categories */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
        {categories.map((category) => (
          <Link key={category.id} href={`/products?category=${category.slug}`}>
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/400x400?text=Category';
                  }}
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-60 group-hover:opacity-50 transition-opacity`} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                  <h3 className="font-bold text-sm md:text-base mb-1 group-hover:scale-105 transition-transform">
                    {category.name}
                  </h3>
                  <p className="text-xs opacity-90">
                    {category.count}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}