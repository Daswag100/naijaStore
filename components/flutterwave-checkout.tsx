// components/flutterwave-checkout.tsx - FIXED VERSION
"use client";

import React, { useState } from 'react';
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface FlutterwaveCheckoutProps {
  className?: string;
  discount?: number;
  shippingCost?: number;
}

export function FlutterwaveCheckout({ 
  className = "", 
  discount = 0, 
  shippingCost = 0 
}: FlutterwaveCheckoutProps) {
  const { state, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const finalTotal = state.total - discount + shippingCost;
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
    tx_ref: orderNumber,
    amount: finalTotal,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    // ADD REDIRECT URL - This is crucial!
    redirect_url: `${window.location.origin}/payment/callback?tx_ref=${orderNumber}`,
    customer: {
      email: user?.email || '',
      phone_number: user?.phone || '',
      name: user?.name || '',
    },
    customizations: {
      title: 'NaijaStore Payment',
      description: `Payment for order ${orderNumber}`,
      logo: '',
    },
  };

  const handlePaymentSuccess = async (response: any) => {
    console.log('💳 Payment callback received:', response);
    setIsProcessing(true);
    
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No valid session found');
      }

      console.log('🔍 Verifying payment...');

      // 1. Verify payment with Flutterwave
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          reference: response.tx_ref,
          transaction_id: response.transaction_id,
        }),
      });

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.error('❌ Payment verification failed:', errorText);
        throw new Error('Payment verification failed');
      }

      const verifyData = await verifyResponse.json();
      if (verifyData.status !== 'success') {
        throw new Error('Payment verification failed');
      }

      console.log('✅ Payment verified, creating order...');

      // 2. Create order in your system
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          paymentMethod: 'flutterwave',
          paymentReference: response.tx_ref,
          transactionId: response.transaction_id,
          subtotal: state.total,
          discount: discount,
          shippingCost: shippingCost,
          total: finalTotal,
          shippingAddress: {
            name: user?.name || 'Customer',
            email: user?.email || '',
            phone: user?.phone || '',
            address_line1: 'Default Address',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria',
          },
        }),
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error('❌ Order creation failed:', errorText);
        throw new Error(`Order creation failed: ${errorText}`);
      }

      const orderData = await orderResponse.json();
      console.log('✅ Order created successfully:', orderData.order.order_number);

      // 3. Clear cart locally
      clearCart();
      console.log('✅ Cart cleared');

      toast({
        title: "Payment Successful! 🎉",
        description: `Your order ${orderData.order.order_number} has been placed successfully.`,
      });

      // 4. Redirect to order success page
      router.push(`/orders/${orderData.order.id}?success=true`);

    } catch (error) {
      console.error('❌ Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "There was an issue processing your payment. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      closePaymentModal();
    }
  };

  const handlePaymentClose = () => {
    setIsProcessing(false);
    console.log('Payment modal closed');
  };

  const fwConfig = {
    ...config,
    text: `Pay ₦${finalTotal.toLocaleString()}`,
    callback: handlePaymentSuccess,
    onClose: handlePaymentClose,
  };

  // Validation checks
  if (state.items.length === 0) {
    return (
      <Button disabled className={`w-full ${className}`}>
        Cart is Empty
      </Button>
    );
  }

  if (!user) {
    return (
      <Button 
        onClick={() => router.push('/login')}
        className={`w-full bg-green-600 hover:bg-green-700 text-white ${className}`}
      >
        Sign In to Checkout
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    );
  }

  if (!process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY) {
    return (
      <Button disabled className={`w-full ${className}`}>
        Payment Not Configured
      </Button>
    );
  }

  if (isProcessing) {
    return (
      <Button disabled className={`w-full ${className}`}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Processing Payment...
      </Button>
    );
  }

  return (
    <FlutterWaveButton 
      {...fwConfig} 
      className={`w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center ${className}`}
    />
  );
}