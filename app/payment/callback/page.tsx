// app/payment/callback/page.tsx - SIMPLIFIED VERSION
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/cart-context';
import { SessionManager } from '@/lib/session-manager';
import { useAuth } from '@/contexts/auth-context';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your payment...');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);
  const processedRef = useRef(false); // Prevent multiple executions

  // Initialize session manager
  useEffect(() => {
    setSessionManager(SessionManager.getInstance());
  }, []);

  const addDebug = (msg: string) => {
    console.log('🔍 DEBUG:', msg);
    setDebugInfo(prev => [...prev, msg]);
  };

  useEffect(() => {
    // Wait for session manager and user to be available
    if (!sessionManager || !user) {
      addDebug(`Waiting for auth... SessionManager: ${!!sessionManager}, User: ${!!user}`);
      return;
    }

    // Prevent multiple executions
    if (processedRef.current) {
      addDebug('Already processed, skipping...');
      return;
    }

    const processPayment = async () => {
      try {
        processedRef.current = true;
        
        const tx_ref = searchParams.get('tx_ref');
        const transaction_id = searchParams.get('transaction_id');
        const status = searchParams.get('status');

        addDebug(`URL Params: tx_ref=${tx_ref}, transaction_id=${transaction_id}, status=${status}`);

        if (!tx_ref) {
          throw new Error('No transaction reference found');
        }

        // If Flutterwave indicates failure
        if (status === 'cancelled' || status === 'failed') {
          setStatus('error');
          setMessage('Payment was cancelled or failed. Please try again.');
          return;
        }

        setMessage('Verifying your payment...');
        addDebug('Starting payment verification...');

        // Use a direct fetch without auth header first to test
        const verifyResponse = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reference: tx_ref,
            transaction_id: transaction_id,
          }),
        });

        addDebug(`Verify response status: ${verifyResponse.status}`);

        if (!verifyResponse.ok) {
          const errorText = await verifyResponse.text();
          addDebug(`Verify error: ${errorText}`);
          throw new Error(`Payment verification failed: ${errorText}`);
        }

        const verifyData = await verifyResponse.json();
        addDebug(`Verify success: ${JSON.stringify(verifyData)}`);
        
        if (verifyData.status !== 'success') {
          throw new Error(`Payment verification failed: ${verifyData.error || 'Unknown error'}`);
        }

        addDebug('Payment verified, creating order...');
        setMessage('Creating your order...');

        // Create order with authentication headers
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: sessionManager.getApiHeaders(),
          body: JSON.stringify({
            paymentMethod: 'flutterwave',
            paymentReference: tx_ref,
            transactionId: transaction_id,
            subtotal: verifyData.data.amount || 0,
            discount: 0,
            shippingCost: 0,
            total: verifyData.data.amount || 0,
            shippingAddress: {
              name: user.name || 'Customer',
              email: user.email || 'customer@example.com',
              phone: user.phone || '',
              address_line1: 'Default Address',
              city: 'Lagos',
              state: 'Lagos',
              country: 'Nigeria',
            },
          }),
        });

        addDebug(`Order response status: ${orderResponse.status}`);

        if (!orderResponse.ok) {
          const errorText = await orderResponse.text();
          addDebug(`Order creation error: ${errorText}`);
          throw new Error(`Failed to create order: ${errorText}`);
        }

        const orderData = await orderResponse.json();
        addDebug(`Order created: ${JSON.stringify(orderData)}`);

        // Clear cart
        addDebug('Clearing cart...');
        clearCart();

        setStatus('success');
        setMessage(`Order ${orderData.order.order_number} created successfully!`);
        setOrderId(orderData.order.id);

        toast({
          title: "Payment Successful! 🎉",
          description: `Your order ${orderData.order.order_number} has been placed successfully.`,
        });

        // Redirect after a delay
        addDebug('Success! Redirecting...');
        setTimeout(() => {
          router.push(`/orders/${orderData.order.id}?success=true`);
        }, 2000);

      } catch (error) {
        console.error('❌ Payment processing error:', error);
        addDebug(`FINAL ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An error occurred processing your payment');
        
        toast({
          title: "Payment Error",
          description: "There was an issue processing your payment. Please contact support.",
          variant: "destructive",
        });
      }
    };

    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      processPayment();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchParams, router, toast, clearCart, sessionManager, user]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-600" />
                <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
                <p className="text-gray-600 mb-4">{message}</p>
                
                {/* Debug Information */}
                <div className="mt-6 p-4 bg-gray-100 rounded text-left text-xs max-h-40 overflow-y-auto">
                  <strong>Debug Info:</strong>
                  {debugInfo.map((info, index) => (
                    <div key={index} className="text-gray-700 border-b border-gray-200 py-1">
                      {info}
                    </div>
                  ))}
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h1 className="text-2xl font-bold mb-2 text-green-800">Payment Successful!</h1>
                <p className="text-gray-600 mb-4">{message}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Redirecting you to your order details...
                </p>
                {orderId && (
                  <Button 
                    onClick={() => router.push(`/orders/${orderId}`)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    View Order Details
                  </Button>
                )}
                
                {/* Show success debug info */}
                <div className="mt-4 p-4 bg-green-50 rounded text-left text-xs max-h-32 overflow-y-auto">
                  <strong>Process Log:</strong>
                  {debugInfo.slice(-5).map((info, index) => (
                    <div key={index} className="text-green-700">{info}</div>
                  ))}
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
                <h1 className="text-2xl font-bold mb-2 text-red-800">Payment Failed</h1>
                <p className="text-gray-600 mb-4">{message}</p>
                
                {/* Debug Information for errors */}
                <div className="mt-4 p-4 bg-red-50 rounded text-left text-xs max-h-40 overflow-y-auto">
                  <strong>Debug Info:</strong>
                  {debugInfo.map((info, index) => (
                    <div key={index} className="text-red-700 border-b border-red-200 py-1">
                      {info}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2 mt-4">
                  <Button 
                    onClick={() => router.push('/cart')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Back to Cart
                  </Button>
                  <Button 
                    onClick={() => router.push('/account')}
                    variant="outline"
                    className="w-full"
                  >
                    My Account
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}