"use client";

import { useState } from "react";
import { Save, Store, Mail, Truck, CreditCard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    name: "NaijaStore",
    description: "Your trusted online shopping destination in Nigeria",
    email: "hello@naijastore.com",
    phone: "+234 801 234 5678",
    address: "123 Victoria Island, Lagos, Nigeria",
    currency: "NGN",
    timezone: "Africa/Lagos",
  });

  const [emailSettings, setEmailSettings] = useState({
    orderConfirmation: true,
    orderUpdates: true,
    promotionalEmails: false,
    lowStockAlerts: true,
  });

  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: "100000",
    defaultShippingCost: "5000",
    processingTime: "1-2",
    returnPeriod: "30",
  });

  const { toast } = useToast();

  const handleSaveStoreSettings = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Store settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update store settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Email settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update email settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShippingSettings = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Shipping settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update shipping settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your store configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Store className="w-5 h-5 mr-2" />
              Store Information
            </CardTitle>
            <CardDescription>
              Basic information about your store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={storeSettings.name}
                onChange={(e) => setStoreSettings(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeDescription">Description</Label>
              <Textarea
                id="storeDescription"
                value={storeSettings.description}
                onChange={(e) => setStoreSettings(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeEmail">Email</Label>
              <Input
                id="storeEmail"
                type="email"
                value={storeSettings.email}
                onChange={(e) => setStoreSettings(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storePhone">Phone</Label>
              <Input
                id="storePhone"
                value={storeSettings.phone}
                onChange={(e) => setStoreSettings(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeAddress">Address</Label>
              <Textarea
                id="storeAddress"
                value={storeSettings.address}
                onChange={(e) => setStoreSettings(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
              />
            </div>

            <Button 
              onClick={handleSaveStoreSettings}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Store Settings
            </Button>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Configure email notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Order Confirmation</Label>
                <p className="text-sm text-gray-600">Send confirmation emails for new orders</p>
              </div>
              <Switch
                checked={emailSettings.orderConfirmation}
                onCheckedChange={(checked) => 
                  setEmailSettings(prev => ({ ...prev, orderConfirmation: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Order Updates</Label>
                <p className="text-sm text-gray-600">Send emails when order status changes</p>
              </div>
              <Switch
                checked={emailSettings.orderUpdates}
                onCheckedChange={(checked) => 
                  setEmailSettings(prev => ({ ...prev, orderUpdates: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Promotional Emails</Label>
                <p className="text-sm text-gray-600">Send marketing and promotional emails</p>
              </div>
              <Switch
                checked={emailSettings.promotionalEmails}
                onCheckedChange={(checked) => 
                  setEmailSettings(prev => ({ ...prev, promotionalEmails: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-gray-600">Get notified when products are low in stock</p>
              </div>
              <Switch
                checked={emailSettings.lowStockAlerts}
                onCheckedChange={(checked) => 
                  setEmailSettings(prev => ({ ...prev, lowStockAlerts: checked }))
                }
              />
            </div>

            <Button 
              onClick={handleSaveEmailSettings}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Email Settings
            </Button>
          </CardContent>
        </Card>

        {/* Shipping Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="w-5 h-5 mr-2" />
              Shipping Settings
            </CardTitle>
            <CardDescription>
              Configure shipping options and costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (₦)</Label>
              <Input
                id="freeShippingThreshold"
                type="number"
                value={shippingSettings.freeShippingThreshold}
                onChange={(e) => setShippingSettings(prev => ({ 
                  ...prev, 
                  freeShippingThreshold: e.target.value 
                }))}
              />
              <p className="text-sm text-gray-600">
                Orders above this amount get free shipping
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultShippingCost">Default Shipping Cost (₦)</Label>
              <Input
                id="defaultShippingCost"
                type="number"
                value={shippingSettings.defaultShippingCost}
                onChange={(e) => setShippingSettings(prev => ({ 
                  ...prev, 
                  defaultShippingCost: e.target.value 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="processingTime">Processing Time (days)</Label>
              <Input
                id="processingTime"
                value={shippingSettings.processingTime}
                onChange={(e) => setShippingSettings(prev => ({ 
                  ...prev, 
                  processingTime: e.target.value 
                }))}
                placeholder="e.g., 1-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnPeriod">Return Period (days)</Label>
              <Input
                id="returnPeriod"
                type="number"
                value={shippingSettings.returnPeriod}
                onChange={(e) => setShippingSettings(prev => ({ 
                  ...prev, 
                  returnPeriod: e.target.value 
                }))}
              />
            </div>

            <Button 
              onClick={handleSaveShippingSettings}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Shipping Settings
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage admin access and security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
              />
            </div>

            <Button 
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              Update Password
            </Button>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}