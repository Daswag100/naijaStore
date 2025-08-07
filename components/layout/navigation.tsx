"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, ShoppingCart, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";

const mainNavigation = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "Categories", href: "/categories" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useCart();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Debug logging for auth state
  useEffect(() => {
    console.log('🔄 Navigation - Auth state updated:', { 
      isAuthenticated, 
      isLoading, 
      userEmail: user?.email,
      userName: user?.name 
    });
  }, [isAuthenticated, isLoading, user]);

  // Handle search functionality
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchFocused(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e as any);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-bold text-lg">NS</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-gray-900 tracking-tight">
                NaijaStore
              </span>
              <span className="text-xs text-gray-500 -mt-1 hidden sm:block">
                Nigeria&apos;s Premier Store
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-10 mx-8">
            {mainNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative text-base font-medium transition-all duration-200 hover:text-green-600 group ${
                  pathname === item.href
                    ? "text-green-600"
                    : "text-gray-700"
                }`}
              >
                {item.name}
                <span
                  className={`absolute -bottom-6 left-0 right-0 h-0.5 bg-green-600 transition-all duration-200 ${
                    pathname === item.href ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <div className={`relative transition-all duration-200 ${searchFocused ? 'scale-105' : ''}`}>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="search"
                  placeholder="Search for products, brands, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  onKeyDown={handleSearchKeyDown}
                  className={`pl-12 pr-4 h-12 text-base border-2 rounded-full transition-all duration-200 ${
                    searchFocused 
                      ? 'border-green-500 shadow-lg bg-white' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                />
                {searchQuery && (
                  <Button
                    type="submit"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-4 rounded-full bg-green-600 hover:bg-green-700"
                  >
                    Search
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Wishlist - Desktop only */}
            <Button 
              variant="ghost" 
              size="lg" 
              className="hidden md:flex relative p-3 hover:bg-gray-50 rounded-full transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 text-gray-600" />
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-gray-100"
              >
                0
              </Badge>
            </Button>

            {/* Cart with improved styling */}
            <Link href="/cart">
              <Button 
                variant="ghost" 
                size="lg" 
                className="relative p-3 hover:bg-gray-50 rounded-full transition-colors"
                title="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {state.itemCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center text-xs p-0 bg-green-600 hover:bg-green-700 border-2 border-white animate-pulse"
                  >
                    {state.itemCount > 99 ? '99+' : state.itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {isLoading ? (
              <div className="flex items-center space-x-2 p-3">
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden xl:block text-sm text-gray-500">Loading...</span>
              </div>
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded-full transition-colors"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="hidden xl:block text-sm font-medium text-gray-700 max-w-24 truncate">
                      {user?.name || 'Account'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="mt-2">
                    <Link href="/account" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>My Account</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="flex items-center space-x-2">
                      <ShoppingCart className="w-4 h-4" />
                      <span>Order History</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-3 ml-4">
                <Link href="/login">
                  <Button 
                    variant="ghost" 
                    className="px-6 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 transition-colors"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button 
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-md hover:shadow-lg transition-all"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 hover:bg-gray-50 rounded-full"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-6 border-t border-gray-100 bg-white">
            <div className="space-y-6">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-12 pr-4 h-12 text-base border-2 border-gray-200 rounded-full"
                />
              </form>

              {/* Mobile Navigation */}
              <div className="space-y-1">
                {mainNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block py-3 px-4 text-lg font-medium transition-colors rounded-lg ${
                      pathname === item.href
                        ? "text-green-600 bg-green-50"
                        : "text-gray-700 hover:text-green-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Mobile Auth */}
              {isLoading ? (
                <div className="pt-4 border-t border-gray-100 flex items-center justify-center space-x-2 p-4">
                  <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-500">Loading...</span>
                </div>
              ) : (!isAuthenticated || !user) && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full h-12 text-base rounded-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsOpen(false)}>
                    <Button className="w-full h-12 text-base bg-green-600 hover:bg-green-700 rounded-full">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile User Info */}
              {!isLoading && isAuthenticated && user && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Link href="/account" className="block py-2 px-4 text-gray-700 hover:text-green-600">
                      My Account
                    </Link>
                    <Link href="/account/orders" className="block py-2 px-4 text-gray-700 hover:text-green-600">
                      Order History
                    </Link>
                    <button 
                      onClick={logout}
                      className="block w-full text-left py-2 px-4 text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}