"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Simulate subscription
    setIsSubscribed(true);
    toast({
      title: "Successfully subscribed!",
      description: "You'll receive our latest updates and offers.",
    });
    
    setTimeout(() => setIsSubscribed(false), 3000);
    setEmail("");
  };

  return (
    <section className="py-16">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 md:p-12 text-center text-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Stay Updated with Our Latest Deals
          </h2>
          <p className="text-green-100 mb-8">
            Subscribe to our newsletter and be the first to know about exclusive offers, new products, and special promotions.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white text-gray-900 border-0"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="bg-white text-green-600 hover:bg-gray-100 font-semibold"
              disabled={isSubscribed}
            >
              {isSubscribed ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Subscribed!
                </>
              ) : (
                "Subscribe"
              )}
            </Button>
          </form>
          
          <p className="text-green-100 text-sm mt-4">
            No spam, unsubscribe at any time. We respect your privacy.
          </p>
        </div>
      </div>
    </section>
  );
}