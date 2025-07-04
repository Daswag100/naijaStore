// components/address-form.tsx - Fixed version with proper session management
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { SessionManager } from '@/lib/session-manager';

interface AddressFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export function AddressForm({ onClose, onSuccess }: AddressFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria',
    isDefault: false,
  });
  const { toast } = useToast();
  const sessionManager = SessionManager.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.street || !formData.city || !formData.state) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Submitting address form with session:', sessionManager.getSessionId());
      console.log('📝 Form data:', formData);

      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: sessionManager.getApiHeaders(),
        body: JSON.stringify({
          name: formData.name || `${formData.city} Address`,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          isDefault: formData.isDefault,
        }),
      });

      console.log('📡 Address creation response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Address creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create address');
      }

      const result = await response.json();
      console.log('✅ Address created successfully:', result);

      toast({
        title: "Success!",
        description: "Address added successfully",
      });

      // Call onSuccess to refresh the address list
      onSuccess();
      onClose();

    } catch (error) {
      console.error('❌ Error creating address:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create address",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Address Name (Optional)</Label>
        <Input
          id="name"
          placeholder="e.g., Home, Office"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="street">Street Address *</Label>
        <Input
          id="street"
          placeholder="No 23, Akinrinlo Bajulaiye"
          value={formData.street}
          onChange={(e) => updateFormData('street', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            placeholder="Somolu"
            value={formData.city}
            onChange={(e) => updateFormData('city', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="state">State *</Label>
          <Select value={formData.state} onValueChange={(value) => updateFormData('state', value)} required>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {nigerianStates.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="zipCode">Postal Code (Optional)</Label>
        <Input
          id="zipCode"
          placeholder="100001"
          value={formData.zipCode}
          onChange={(e) => updateFormData('zipCode', e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(checked) => updateFormData('isDefault', checked)}
        />
        <Label htmlFor="isDefault">Set as default address</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Address'}
        </Button>
      </div>
    </form>
  );
}