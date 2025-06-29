"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";

// Mock data - replace with real API calls
const mockStats = {
  totalRevenue: 2450000,
  revenueChange: 12.5,
  totalOrders: 156,
  ordersChange: 8.2,
  totalProducts: 89,
  productsChange: 3.1,
  totalCustomers: 234,
  customersChange: 15.3,
};

const mockRecentOrders = [
  {
    id: "NS001234567",
    customer: "John Doe",
    amount: 125000,
    status: "completed",
    date: "2024-01-15",
  },
  {
    id: "NS001234568",
    customer: "Jane Smith",
    amount: 85000,
    status: "processing",
    date: "2024-01-15",
  },
  {
    id: "NS001234569",
    customer: "Mike Johnson",
    amount: 195000,
    status: "shipped",
    date: "2024-01-14",
  },
  {
    id: "NS001234570",
    customer: "Sarah Wilson",
    amount: 65000,
    status: "pending",
    date: "2024-01-14",
  },
];

const mockTopProducts = [
  {
    name: "Samsung Galaxy S24 Ultra",
    sales: 45,
    revenue: 38250000,
  },
  {
    name: "Apple MacBook Air M2",
    sales: 23,
    revenue: 27600000,
  },
  {
    name: "Sony WH-1000XM4",
    sales: 67,
    revenue: 12060000,
  },
  {
    name: "Nike Air Force 1",
    sales: 89,
    revenue: 5785000,
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(mockStats);
  const [recentOrders, setRecentOrders] = useState(mockRecentOrders);
  const [topProducts, setTopProducts] = useState(mockTopProducts);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "processing":
        return "text-blue-600 bg-blue-100";
      case "shipped":
        return "text-purple-600 bg-purple-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(stats.totalRevenue)}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{stats.revenueChange}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{stats.ordersChange}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{stats.productsChange}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{stats.customersChange}% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders from your customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.customer}</p>
                    <p className="text-sm text-gray-600">Order #{order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatNaira(order.amount)}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatNaira(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to manage your store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/products/new"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Package className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h3 className="font-medium">Add New Product</h3>
                <p className="text-sm text-gray-600">Create a new product listing</p>
              </div>
            </a>
            
            <a
              href="/admin/orders"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h3 className="font-medium">Manage Orders</h3>
                <p className="text-sm text-gray-600">View and update order status</p>
              </div>
            </a>
            
            <a
              href="/admin/categories"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <h3 className="font-medium">Manage Categories</h3>
                <p className="text-sm text-gray-600">Organize your product catalog</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}