"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Mail, Phone, MapPin, Package, Settings, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { formatNaira, formatDate } from "@/lib/utils";
import { SessionManager } from "@/lib/session-manager";

// Nigerian states for the dropdown
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

interface Address {
  id: string;
  address_line1: string;
  city: string;
  state: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

// Order History Component
function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);
  const { toast } = useToast();

  // Initialize session manager
  useEffect(() => {
    setSessionManager(SessionManager.getInstance());
  }, []);

  // Load orders
  useEffect(() => {
    if (sessionManager) {
      loadOrders();
    }
  }, [sessionManager]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600 bg-green-100";
      case "shipped":
        return "text-blue-600 bg-blue-100";
      case "processing":
        return "text-yellow-600 bg-yellow-100";
      case "confirmed":
        return "text-blue-600 bg-blue-100";
      case "pending":
        return "text-orange-600 bg-orange-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadOrders} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
        <p className="text-gray-600 mb-4">When you place orders, they'll appear here.</p>
        <Link href="/products">
          <Button className="bg-green-600 hover:bg-green-700">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold">Order #{order.order_number}</h3>
              <p className="text-sm text-gray-600">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {order.order_items?.length || 0} items • {formatNaira(order.total_amount)}
            </div>
            <div className="flex space-x-2">
              <Link href={`/orders/${order.id}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
              {order.tracking_number && (
                <Link href={`/orders/${order.id}/track`}>
                  <Button variant="outline" size="sm">
                    Track Order
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Order Items Preview */}
          {order.order_items && order.order_items.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-gray-600 mb-2">Items:</p>
              <div className="space-y-1">
                {order.order_items.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product_name} × {item.quantity}</span>
                    <span className="font-medium">{formatNaira(item.price * item.quantity)}</span>
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
        </div>
      ))}
    </div>
  );
}

export default function AccountPage() {
  const { user, updateProfile, logout } = useAuth();
  const { toast } = useToast();
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);
  
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Profile management state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Initialize session manager on client side only
  useEffect(() => {
    setSessionManager(SessionManager.getInstance());
  }, []);

  // Address management state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  
  // Address form state
  const [addressForm, setAddressForm] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria',
    isDefault: false,
  });

  // Load addresses on component mount
  useEffect(() => {
    if (user && sessionManager) {
      loadAddresses();
    }
  }, [user, sessionManager]);

  // Load profile on component mount
  useEffect(() => {
    if (user && sessionManager) {
      loadProfile();
    }
  }, [user, sessionManager]);

  // Load profile function
  const loadProfile = async () => {
    if (!sessionManager) return;
    
    try {
      setIsLoadingProfile(true);
      console.log('🔍 Loading profile with session manager');
      
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: sessionManager.getApiHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile loaded:', data.user);
        
        const profileInfo = {
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
        };

        setProfileData(profileInfo);
        setFormData(profileInfo);
      } else {
        // If profile doesn't exist, use user context data
        const fallbackData = {
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
        };
        setProfileData(fallbackData);
        setFormData(fallbackData);
      }
      
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      // Use fallback data on error
      const fallbackData = {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
      };
      setProfileData(fallbackData);
      setFormData(fallbackData);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadAddresses = async () => {
    if (!sessionManager) return;
    
    try {
      setIsLoadingAddresses(true);
      console.log('🔍 Loading addresses with session manager');
      
      const response = await fetch('/api/addresses', {
        method: 'GET',
        headers: sessionManager.getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load addresses');
      }

      const data = await response.json();
      setAddresses(data.addresses || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast({
        title: "Error",
        description: "Failed to load addresses",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionManager) return;
    
    setIsSubmittingAddress(true);

    try {
      console.log('📝 Submitting address:', addressForm);
      
      const url = editingAddress ? `/api/addresses/${editingAddress.id}` : '/api/addresses';
      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: sessionManager.getApiHeaders(),
        body: JSON.stringify({
          name: addressForm.name || `${addressForm.city} Address`,
          street: addressForm.street,
          city: addressForm.city,
          state: addressForm.state,
          zipCode: addressForm.zipCode,
          country: addressForm.country,
          isDefault: addressForm.isDefault,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save address');
      }

      toast({
        title: "Success",
        description: editingAddress ? "Address updated successfully" : "Address added successfully",
      });

      // Reload addresses and close dialog
      await loadAddresses();
      handleCloseAddressDialog();
    } catch (error) {
      console.error('Error saving address:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save address",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!sessionManager) return;
    
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'DELETE',
        headers: sessionManager.getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      toast({
        title: "Success",
        description: "Address deleted successfully",
      });

      await loadAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      name: '',
      street: address.address_line1,
      city: address.city,
      state: address.state,
      zipCode: '',
      country: address.country,
      isDefault: address.is_default,
    });
    setIsAddressDialogOpen(true);
  };

  const handleCloseAddressDialog = () => {
    setIsAddressDialogOpen(false);
    setEditingAddress(null);
    setAddressForm({
      name: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Nigeria',
      isDefault: false,
    });
  };

  // Profile save function
  const handleSave = async () => {
    if (!sessionManager) return;
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSavingProfile(true);

    try {
      console.log('💾 Saving profile:', formData);
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: sessionManager.getApiHeaders(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      const result = await response.json();
      console.log('✅ Profile saved:', result.user);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Update local state
      setProfileData(formData);
      setEditMode(false);

      // Update auth context if available
      if (updateProfile) {
        updateProfile(formData);
      }

    } catch (error) {
      console.error('❌ Error saving profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view your account</h1>
        <Button>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
        <p className="text-gray-600">Manage your Profile</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingProfile ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading profile...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!editMode}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!editMode}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!editMode}
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    {editMode ? (
                      <>
                        <Button 
                          onClick={handleSave} 
                          disabled={isSavingProfile}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSavingProfile ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditMode(false);
                            setFormData(profileData);
                          }}
                          disabled={isSavingProfile}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => setEditMode(true)}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Order History
              </CardTitle>
              <CardDescription>
                View and track your recent orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderHistory />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Shipping Addresses
              </CardTitle>
              <CardDescription>
                Manage your shipping addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAddresses ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading addresses...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">Address</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {address.address_line1}<br />
                            {address.city}, {address.state}<br />
                            {address.country}
                          </p>
                          {address.is_default && (
                            <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {addresses.length === 0 && (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No addresses added yet</p>
                    </div>
                  )}

                  {/* Add New Address Dialog */}
                  <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" onClick={() => setIsAddressDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAddress ? 'Edit Address' : 'Add New Address'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddressSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="street">Street Address</Label>
                          <Input
                            id="street"
                            value={addressForm.street}
                            onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                            placeholder="Enter your street address"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              placeholder="City"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Select 
                              value={addressForm.state} 
                              onValueChange={(value) => setAddressForm({ ...addressForm, state: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                              <SelectContent>
                                {NIGERIAN_STATES.map((state) => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="default"
                            checked={addressForm.isDefault}
                            onCheckedChange={(checked) => setAddressForm({ ...addressForm, isDefault: checked })}
                          />
                          <Label htmlFor="default">Set as default address</Label>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleCloseAddressDialog}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={isSubmittingAddress}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isSubmittingAddress ? 'Saving...' : editingAddress ? 'Update Address' : 'Add Address'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-600">Receive order updates and promotions</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">SMS Notifications</h3>
                    <p className="text-sm text-gray-600">Get delivery updates via SMS</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Privacy Settings</h3>
                    <p className="text-sm text-gray-600">Control your data and privacy</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Sign Out</h3>
                    <p className="text-sm text-gray-600">Sign out of your account</p>
                  </div>
                  <Button variant="outline" onClick={logout}>
                    Sign Out
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-red-600">Delete Account</h3>
                    <p className="text-sm text-gray-600">Permanently delete your account and data</p>
                  </div>
                  <Button variant="destructive">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}