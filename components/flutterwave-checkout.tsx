"use client";

import React, { useState } from 'react';
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { generateOrderNumber } from '@/lib/database';

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
  const orderNumber = generateOrderNumber();

  // Flutterwave configuration
  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
    tx_ref: orderNumber,
    amount: finalTotal,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email: user?.email || '',
      phone_number: user?.phone || '',
      name: user?.name || '',
    },
    customizations: {
      title: 'NaijaStore Payment',
      description: `Payment for order ${orderNumber}`,
      logo: '', // Add your logo URL here
    },
  };

  const handlePaymentSuccess = async (response: any) => {
    setIsProcessing(true);
    
    try {
      console.log('Payment response:', response);

      // 1. Verify payment with Flutterwave
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id || 'mock-token'}`, // Use actual auth token
        },
        body: JSON.stringify({
          reference: response.tx_ref,
          transaction_id: response.transaction_id,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || verifyData.status !== 'success') {
        throw new Error('Payment verification failed');
      }

      // 2. Create order in your system
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id || 'mock-token'}`,
        },
        body: JSON.stringify({
          items: state.items.map(item => ({
            productId: item.product_id,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
          // You'll need to implement address selection in your checkout flow
          shippingAddressId: 'default-address-id', // Replace with actual address selection
          paymentMethod: 'flutterwave',
          paymentReference: response.tx_ref,
          transactionId: response.transaction_id,
          subtotal: state.total,
          discount: discount,
          shippingCost: shippingCost,
          total: finalTotal,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // 3. Clear cart and redirect
      await clearCart();

      toast({
        title: "Payment Successful! 🎉",
        description: `Your order ${orderNumber} has been placed successfully.`,
      });

      // Redirect to order success page
      router.push(`/orders/${orderData.order.id}?success=true`);

    } catch (error) {
      console.error('Error processing payment:', error);
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