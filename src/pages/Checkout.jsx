// Checkout Page
// Multi-step checkout with shipping, payment, and order review

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, CreditCard, Truck, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ordersAPI } from '@/services/api';
import { formatCurrency, cn, getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

const steps = [
  { id: 'shipping', name: 'Shipping', icon: Truck },
  { id: 'payment', name: 'Payment', icon: CreditCard },
  { id: 'review', name: 'Review', icon: Check },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, discount, shipping, tax, total, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [currentStep, setCurrentStep] = useState('shipping');
  const [isProcessing, setIsProcessing] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
  });

  const [shippingMethod, setShippingMethod] = useState('standard');

  // Redirect to cart if empty
  if (items.length === 0) {
    return (
      <Layout hideFooter>
        <div className="container-luxe py-24 text-center">
          <h1 className="font-display text-3xl font-semibold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some items before checking out.</p>
          <Button asChild variant="accent">
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    setCurrentStep('payment');
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setCurrentStep('review');
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    try {
      // Prepare order data
      const orderData = {
        shippingAddress: {
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          street: shippingInfo.street,
          apartment: shippingInfo.apartment,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country,
          phone: shippingInfo.phone,
        },
        paymentMethod: paymentInfo.cardName ? 'Credit Card' : 'Other',
        items: items.map(item => ({
          productId: item.product.id || item.product._id,
          quantity: item.quantity,
          variant: item.variant?.id || item.variant?._id,
        })),
        notes: `Shipping method: ${shippingMethod}`,
      };

      const response = await ordersAPI.create(orderData);
      
      clearCart();
      toast.success('Order placed successfully!', {
        description: 'You will receive a confirmation email shortly.',
      });
      
      // Navigate to order details or orders page
      const orderId = response.data.data?._id || response.data.data?.id || response.data._id || response.data.id;
      if (orderId) {
        navigate(`/orders/${orderId}`);
      } else {
        navigate('/orders');
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      const errorMessage = error.response?.data?.message || 'Failed to place order. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const finalShipping = shippingMethod === 'express' ? 14.99 : shipping;
  const finalTotal = total + (shippingMethod === 'express' ? 14.99 - shipping : 0);

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-secondary">
        {/* Header */}
        <div className="bg-background border-b border-border">
          <div className="container-luxe py-6">
            <div className="flex items-center justify-between">
              <Link to="/" className="font-display text-2xl font-semibold">
                Lexury
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                Secure Checkout
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-background border-b border-border">
          <div className="container-luxe py-4">
            <nav className="flex items-center justify-center">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => index < currentStepIndex && setCurrentStep(step.id)}
                      disabled={index > currentStepIndex}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                        currentStep === step.id
                          ? 'text-accent font-medium'
                          : index < currentStepIndex
                          ? 'text-foreground hover:text-accent'
                          : 'text-muted-foreground'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                          currentStep === step.id
                            ? 'bg-accent text-accent-foreground'
                            : index < currentStepIndex
                            ? 'bg-success text-success-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {index < currentStepIndex ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className="hidden sm:inline">{step.name}</span>
                    </button>
                    {index < steps.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="container-luxe py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border border-border p-6 md:p-8">
                {/* Shipping Step */}
                {currentStep === 'shipping' && (
                  <form onSubmit={handleShippingSubmit} className="space-y-6">
                    <h2 className="font-display text-2xl font-semibold mb-6">
                      Shipping Information
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          required
                          value={shippingInfo.firstName}
                          onChange={(e) =>
                            setShippingInfo({ ...shippingInfo, firstName: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          required
                          value={shippingInfo.lastName}
                          onChange={(e) =>
                            setShippingInfo({ ...shippingInfo, lastName: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={shippingInfo.email}
                          onChange={(e) =>
                            setShippingInfo({ ...shippingInfo, email: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={shippingInfo.phone}
                          onChange={(e) =>
                            setShippingInfo({ ...shippingInfo, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        required
                        value={shippingInfo.street}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, street: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apartment">Apartment, suite, etc. (optional)</Label>
                      <Input
                        id="apartment"
                        value={shippingInfo.apartment}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, apartment: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          required
                          value={shippingInfo.city}
                          onChange={(e) =>
                            setShippingInfo({ ...shippingInfo, city: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          required
                          value={shippingInfo.state}
                          onChange={(e) =>
                            setShippingInfo({ ...shippingInfo, state: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          required
                          value={shippingInfo.zipCode}
                          onChange={(e) =>
                            setShippingInfo({ ...shippingInfo, zipCode: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium">Shipping Method</h3>
                      <RadioGroup
                        value={shippingMethod}
                        onValueChange={setShippingMethod}
                        className="space-y-3"
                      >
                        <label
                          className={cn(
                            'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors',
                            shippingMethod === 'standard'
                              ? 'border-accent bg-accent-light'
                              : 'border-border hover:border-muted-foreground'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="standard" id="standard" />
                            <div>
                              <p className="font-medium">Standard Shipping</p>
                              <p className="text-sm text-muted-foreground">5-7 business days</p>
                            </div>
                          </div>
                          <span className="font-medium">Free</span>
                        </label>
                        <label
                          className={cn(
                            'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors',
                            shippingMethod === 'express'
                              ? 'border-accent bg-accent-light'
                              : 'border-border hover:border-muted-foreground'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="express" id="express" />
                            <div>
                              <p className="font-medium">Express Shipping</p>
                              <p className="text-sm text-muted-foreground">2-3 business days</p>
                            </div>
                          </div>
                          <span className="font-medium">$14.99</span>
                        </label>
                      </RadioGroup>
                    </div>

                    <Button type="submit" variant="accent" size="lg" className="w-full">
                      Continue to Payment
                    </Button>
                  </form>
                )}

                {/* Payment Step */}
                {currentStep === 'payment' && (
                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <h2 className="font-display text-2xl font-semibold mb-6">
                      Payment Information
                    </h2>

                    <div className="space-y-2">
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input
                        id="cardName"
                        required
                        value={paymentInfo.cardName}
                        onChange={(e) =>
                          setPaymentInfo({ ...paymentInfo, cardName: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        required
                        placeholder="1234 5678 9012 3456"
                        value={paymentInfo.cardNumber}
                        onChange={(e) =>
                          setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          required
                          placeholder="MM/YY"
                          value={paymentInfo.expiryDate}
                          onChange={(e) =>
                            setPaymentInfo({ ...paymentInfo, expiryDate: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          required
                          placeholder="123"
                          value={paymentInfo.cvv}
                          onChange={(e) =>
                            setPaymentInfo({ ...paymentInfo, cvv: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="flex-1"
                        onClick={() => setCurrentStep('shipping')}
                      >
                        Back
                      </Button>
                      <Button type="submit" variant="accent" size="lg" className="flex-1">
                        Review Order
                      </Button>
                    </div>
                  </form>
                )}

                {/* Review Step */}
                {currentStep === 'review' && (
                  <div className="space-y-6">
                    <h2 className="font-display text-2xl font-semibold mb-6">
                      Review Your Order
                    </h2>

                    {/* Shipping summary */}
                    <div className="p-4 bg-secondary rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Shipping Address</h3>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setCurrentStep('shipping')}
                        >
                          Edit
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {shippingInfo.firstName} {shippingInfo.lastName}
                        <br />
                        {shippingInfo.street}
                        {shippingInfo.apartment && `, ${shippingInfo.apartment}`}
                        <br />
                        {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                        <br />
                        {shippingInfo.country}
                      </p>
                    </div>

                    {/* Payment summary */}
                    <div className="p-4 bg-secondary rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Payment Method</h3>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setCurrentStep('payment')}
                        >
                          Edit
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Card ending in {paymentInfo.cardNumber.slice(-4) || '****'}
                      </p>
                    </div>

                    {/* Order items */}
                    <div>
                      <h3 className="font-medium mb-4">Order Items</h3>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary">
                              <img
                                src={getImageUrl(item.product.images?.[0])}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium line-clamp-1">{item.product.name}</p>
                              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-medium">
                              {formatCurrency((item.product.price + (item.variant?.priceModifier || 0)) * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="flex-1"
                        onClick={() => setCurrentStep('payment')}
                      >
                        Back
                      </Button>
                      <Button
                        variant="accent"
                        size="lg"
                        className="flex-1"
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Processing...' : `Pay ${formatCurrency(finalTotal)}`}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
                <h2 className="font-display text-xl font-semibold mb-6">Order Summary</h2>

                {/* Items */}
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                        <img
                          src={getImageUrl(item.product.images?.[0])}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCurrency((item.product.price + (item.variant?.priceModifier || 0)) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-accent">
                      <span>Discount</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {shippingMethod === 'express' ? '$14.99' : shipping === 0 ? 'Free' : formatCurrency(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

