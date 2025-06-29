"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingBag, Truck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const heroSlides = [
  {
    id: 1,
    title: "Premium Quality Products",
    subtitle: "Discover the best deals on electronics, fashion & home essentials",
    image: "https://images.pexels.com/photos/974911/pexels-photo-974911.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    cta: "Shop Now",
    href: "/products",
  },
  {
    id: 2,
    title: "Fast Delivery Across Nigeria",
    subtitle: "Get your orders delivered within 24-48 hours in Lagos & Abuja",
    image: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    cta: "Learn More",
    href: "/shipping",
  },
  {
    id: 3,
    title: "Secure Payment & Shopping",
    subtitle: "Shop with confidence using our secure payment system",
    image: "https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    cta: "Start Shopping",
    href: "/products",
  },
];

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    setIsAutoPlaying(false);
  };

  return (
    <section className="relative h-screen max-h-[600px] overflow-hidden">
      {/* Slide Container */}
      <div className="relative w-full h-full">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-transform duration-700 ease-in-out ${
              index === currentSlide ? "translate-x-0" : 
              index < currentSlide ? "-translate-x-full" : "translate-x-full"
            }`}
          >
            <div className="relative w-full h-full">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-black/40" />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="container mx-auto px-4 text-center text-white">
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto animate-fade-in animation-delay-200">
                    {slide.subtitle}
                  </p>
                  <Link href={slide.href}>
                    <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white animate-fade-in animation-delay-400">
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      {slide.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-colors"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => {setCurrentSlide(index); setIsAutoPlaying(false);}}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Trust Indicators */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white text-center">
            <div className="flex items-center justify-center space-x-2">
              <Truck className="w-5 h-5" />
              <span className="text-sm">Fast Delivery</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Secure Payment</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-sm">Quality Products</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}