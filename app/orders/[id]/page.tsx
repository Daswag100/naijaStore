// app/orders/[id]/page.tsx - Amazon/Shopify Style - FIXED VERSION
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, CreditCard, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatNaira, formatDate } from '@/lib/utils';
import { SessionManager } from '@/lib/session-manager';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
  product_slug?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  shipping_cost: number;
  shipping_address: any;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);

  // Initialize session manager
  useEffect(() => {
    setSessionManager(SessionManager.getInstance());
  }, []);

  useEffect(() => {
    if (orderId && sessionManager) {
      loadOrder();
    }
  }, [orderId, sessionManager]);

  const loadOrder = async () => {
    if (!sessionManager) {
      console.log('⏳ SessionManager not ready, skipping order load');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      console.log('📋 Loading order details:', orderId);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'GET',
        headers: sessionManager.getApiHeaders(),
        // Add timeout to prevent hanging on the main order fetch
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        
        // 🔽 SIMPLIFIED: Just use the order items as they are to avoid API call issues
        const processedItems = data.order.order_items.map((item: OrderItem) => ({
          ...item,
          // Use fallback image if no image_url
          image_url: (item.image_url && item.image_url !== 'null' && item.image_url.trim() !== '') 
            ? item.image_url 
            : null
        }));

        setOrder({
          ...data.order,
          order_items: processedItems
        });
        
        console.log('✅ Order loaded:', data.order.order_number);
        console.log('📦 Order items with images:', processedItems.map((item: OrderItem) => ({
          name: item.product_name,
          image: item.image_url,
          slug: item.product_slug
        })));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load order');
      }
    } catch (error) {
      console.error('❌ Error loading order:', error);
      setError(error instanceof Error ? error.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  // 🔽 ADD: Handle Buy Again functionality
  const handleBuyAgain = async (item: OrderItem) => {
    if (!sessionManager) {
      console.log('❌ SessionManager not ready, cannot add to cart');
      toast({
        title: "Please wait",
        description: "Please wait a moment and try again.",
        variant: "default"
      });
      return;
    }

    try {
      console.log('🛒 Adding to cart:', item.product_name);
      
      // Add item to cart
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: sessionManager.getApiHeaders(),
        body: JSON.stringify({
          product_id: item.product_id,
          quantity: 1,
        }),
      });

      if (response.ok) {
        console.log('✅ Added to cart successfully');
        toast({
          title: "Added to Cart",
          description: `${item.product_name} has been added to your cart.`,
        });
        // Navigate to cart
        router.push('/cart');
      } else {
        console.error('❌ Failed to add to cart');
        toast({
          title: "Error",
          description: "Failed to add item to cart. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive"
      });
    }
  };

  // 🔽 ADD: Handle Write Review functionality - REMOVED (not needed)
  // const handleWriteReview = (item: OrderItem) => {
  //   if (item.product_slug) {
  //     router.push(`/products/${item.product_slug}#reviews`);
  //   } else {
  //     alert('Product page not available for review.');
  //   }
  // };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-800', text: 'Order Placed' };
      case 'confirmed':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800', text: 'Order Confirmed' };
      case 'processing':
        return { icon: <Package className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800', text: 'Preparing for Shipment' };
      case 'shipped':
        return { icon: <Truck className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-800', text: 'Shipped' };
      case 'delivered':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-100 text-green-800', text: 'Delivered' };
      default:
        return { icon: <Clock className="w-4 h-4" />, color: 'bg-gray-100 text-gray-800', text: 'Processing' };
    }
  };

  const getEstimatedDelivery = () => {
    const orderDate = new Date(order?.created_at || '');
    const estimatedDate = new Date(orderDate);
    estimatedDate.setDate(estimatedDate.getDate() + 3); // 3 days from order
    return formatDate(estimatedDate.toISOString());
  };

  // 🔽 ADD: Get product image with better fallbacks
  const getProductImage = (item: OrderItem) => {
    console.log(`🖼️ Getting image for ${item.product_name}:`, item.image_url);
    
    // If we have an image URL, use it
    if (item.image_url && item.image_url !== 'null' && item.image_url.trim() !== '') {
      return item.image_url;
    }
    
    // For mock products or missing images, use a data URL placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTIwQzE2NS0yIDEzNS0yIDEyMCAzMFYyNDBIMTgwVjMwQzE2NS0yIDEzNS0yIDEyMCAzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="ml-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
            <div className="space-y-2">
              <Link href="/account/orders">
                <Button className="bg-green-600 hover:bg-green-700">
                  Back to Orders
                </Button>
              </Link>
              <br />
              <Button onClick={loadOrder} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const subtotal = order.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/account/orders" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Your Orders
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Order #{order.order_number}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Order placed {formatDate(order.created_at)}</span>
                  <span>•</span>
                  <span>Total {formatNaira(order.total_amount)}</span>
                </div>
              </div>
              <div className="mt-4 lg:mt-0">
                <Badge className={`${statusInfo.color} flex items-center space-x-1 px-3 py-1`}>
                  {statusInfo.icon}
                  <span>{statusInfo.text}</span>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Status */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {order.status === 'delivered' ? 'Delivered' : 'Estimated Delivery'}
                    </h3>
                    <p className="text-2xl font-bold text-green-600 mb-1">
                      {order.status === 'delivered' ? 'Package delivered' : getEstimatedDelivery()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.status === 'delivered' 
                        ? 'Your package was delivered' 
                        : 'Your package will be delivered by this date'
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    {order.tracking_number && (
                      <Button variant="outline" size="sm">
                        Track Package
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Items in this order
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {order.order_items.map((item, index) => (
                    <div key={item.id} className="p-6">
                      <div className="flex space-x-4">
                        {/* 🔽 FIXED: Product Image with better error handling */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={getProductImage(item)}
                              alt={item.product_name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log(`❌ Image load failed for ${item.product_name}, using fallback`);
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTIwQzE2NS0yIDEzNS0yIDEyMCAzMFYyNDBIMTgwVjMwQzE2NS0yIDEzNS0yIDEyMCAzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                              }}
                            />
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-gray-900 mb-1">
                                {item.product_slug ? (
                                  <Link 
                                    href={`/products/${item.product_slug}`}
                                    className="hover:text-blue-600 transition-colors"
                                  >
                                    {item.product_name}
                                  </Link>
                                ) : (
                                  <span className="cursor-default">{item.product_name}</span>
                                )}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                Quantity: {item.quantity}
                              </p>
                              <p className="text-lg font-semibold text-gray-900">
                                {formatNaira(item.price)}
                                <span className="text-sm font-normal text-gray-600 ml-1">each</span>
                              </p>
                            </div>
                          </div>

                          {/* 🔽 FIXED: Action Buttons - Removed Write Review */}
                          <div className="mt-4 flex space-x-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleBuyAgain(item)}
                              className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              Buy it again
                            </Button>
                            {order.status === 'delivered' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toast({
                                  title: "Coming Soon",
                                  description: "Return/replace functionality coming soon!",
                                })}
                                className="hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                Return or replace
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Items ({order.order_items.reduce((sum, item) => sum + item.quantity, 0)}):</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping & handling:</span>
                  <span>{order.shipping_cost === 0 ? 'FREE' : formatNaira(order.shipping_cost)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Order total:</span>
                  <span className="text-lg">{formatNaira(order.total_amount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Payment method:</span>
                    <span>Flutterwave</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Payment status:</span>
                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.shipping_address?.name || 'Customer'}</p>
                  <p>{order.shipping_address?.address_line1 || 'Address not available'}</p>
                  {order.shipping_address?.address_line2 && (
                    <p>{order.shipping_address.address_line2}</p>
                  )}
                  <p>
                    {order.shipping_address?.city || 'City'}, {order.shipping_address?.state || 'State'}
                  </p>
                  <p>{order.shipping_address?.country || 'Nigeria'}</p>
                  {order.shipping_address?.phone && (
                    <p className="mt-2">Phone: {order.shipping_address.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Need Help */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Need help with your order?</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Customer Service
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Report a problem
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailPage;