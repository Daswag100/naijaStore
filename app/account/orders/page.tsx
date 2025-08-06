// app/account/orders/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Eye, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNaira, formatDate } from '@/lib/utils';
import { SessionManager } from '@/lib/session-manager';
import { useAuth } from '@/contexts/auth-context';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);

  // Initialize session manager
  useEffect(() => {
    setSessionManager(SessionManager.getInstance());
  }, []);

  // Load orders
  useEffect(() => {
    if (sessionManager && user) {
      loadOrders();
    }
  }, [sessionManager, user]);

  const loadOrders = async () => {
    if (!sessionManager) return;
    
    try {
      setLoading(true);
      setError(null);

      console.log('📋 Loading user orders...');

      const response = await fetch('/api/orders', {
        method: 'GET',
        headers: sessionManager.getApiHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        console.log('✅ Orders loaded:', data.orders?.length || 0);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load orders');
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      setError(error instanceof Error ? error.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'confirmed':
      case 'processing':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-indigo-600" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'processing':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Please sign in to view your orders</h1>
        <p className="text-gray-600 mb-6">You need to be logged in to access your order history.</p>
        <Link href="/login">
          <Button className="bg-green-600 hover:bg-green-700">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="ml-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/account" className="inline-flex items-center text-green-600 hover:text-green-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Account
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        <p className="text-gray-600">Track and manage your orders</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
            <Button 
              onClick={loadOrders} 
              variant="outline" 
              size="sm" 
              className="mt-3"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">You haven't placed any orders. Start shopping to see your orders here.</p>
            <Link href="/products">
              <Button className="bg-green-600 hover:bg-green-700">
                Start Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                    <p className="text-sm text-gray-600">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold">{formatNaira(order.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <Badge className={getPaymentStatusColor(order.payment_status)}>
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Items</p>
                    <p className="font-semibold">
                      {order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
                    </p>
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.order_items && order.order_items.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Items:</p>
                    <div className="space-y-1">
                      {order.order_items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.quantity}x {item.product_name}
                          </span>
                          <span className="font-medium">{formatNaira(item.price)}</span>
                        </div>
                      ))}
                      {order.order_items.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{order.order_items.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}