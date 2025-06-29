import { Hero } from "@/components/home/hero";
import { FeaturedProducts } from "@/components/home/featured-products";
import { CategoryGrid } from "@/components/home/category-grid";
import { NewsletterSignup } from "@/components/home/newsletter-signup";
import { TrustIndicators } from "@/components/home/trust-indicators";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <Hero />
      <div className="container mx-auto px-4">
        <TrustIndicators />
        <CategoryGrid />
        <FeaturedProducts />
        <NewsletterSignup />
      </div>
    </div>
  );
}