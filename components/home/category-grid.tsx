import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
  {
    id: "electronics",
    name: "Electronics",
    image: "https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: "1,200+ items",
    color: "from-blue-500 to-purple-600"
  },
  {
    id: "fashion",
    name: "Fashion",
    image: "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: "2,800+ items",
    color: "from-pink-500 to-rose-600"
  },
  {
    id: "home",
    name: "Home & Garden",
    image: "https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: "950+ items",
    color: "from-green-500 to-emerald-600"
  },
  {
    id: "sports",
    name: "Sports & Fitness",
    image: "https://images.pexels.com/photos/416717/pexels-photo-416717.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: "650+ items",
    color: "from-orange-500 to-red-600"
  },
  {
    id: "beauty",
    name: "Beauty & Health",
    image: "https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: "1,100+ items",
    color: "from-purple-500 to-pink-600"
  },
  {
    id: "automotive",
    name: "Automotive",
    image: "https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: "420+ items",
    color: "from-gray-600 to-slate-700"
  },
];

export function CategoryGrid() {
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {categories.map((category) => (
          <Link key={category.id} href={`/categories/${category.id}`}>
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
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