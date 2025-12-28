// Order Detail Page
// Shows detailed information about a specific order

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Package, MapPin, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { ordersAPI } from '@/services/api';
import { formatCurrency, getImageUrl, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await ordersAPI.getById(id);
        const orderData = response.data.data || response.data;
        setOrder(orderData);
      } catch (error) {
        console.error('Failed to load order:', error);
        toast.error('Failed to load order details');
        navigate('/orders');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadOrder();
    }
  }, [id, isAuthenticated, navigate]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await ordersAPI.cancel(id);
      toast.success('Order cancelled successfully');
      // Reload order
      const response = await ordersAPI.getById(id);
      const orderData = response.data.data || response.data;
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container-luxe py-24 text-center">
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container-luxe py-24 text-center">
          <h1 className="font-display text-3xl font-semibold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The order you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild variant="accent">
            <Link to="/orders">Back to Orders</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-secondary border-b border-border">
        <div className="container-luxe py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link to="/orders" className="text-muted-foreground hover:text-foreground">
              Orders
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium">
              Order #{order.orderNumber || order._id || order.id}
            </span>
          </nav>
        </div>
      </div>

      <div className="container-luxe py-8 md:py-12">
        {/* Order Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
              Order #{order.orderNumber || order._id || order.id}
            </h1>
            <p className="text-muted-foreground">
              Placed on {new Date(order.createdAt || order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              getOrderStatusColor(order.status)
            }`}>
              {getOrderStatusLabel(order.status)}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="font-semibold text-lg mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 pb-4 border-b border-border last:border-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      <img
                        src={getImageUrl(item.product?.images?.[0])}
                        alt={item.product?.name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{item.product?.name || 'Product'}</h3>
                      {item.product?.brand && (
                        <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency((item.price || item.product?.price || 0) * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price || item.product?.price || 0)} each
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold text-lg">Shipping Address</h2>
                </div>
                <div className="text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p>{order.shippingAddress.street}</p>
                  {order.shippingAddress.apartment && (
                    <p>{order.shippingAddress.apartment}</p>
                  )}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                  )}
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold text-lg">Payment Method</h2>
              </div>
              <p className="text-muted-foreground">
                {order.paymentMethod || 'N/A'}
              </p>
              {order.paymentStatus && (
                <p className="text-sm text-muted-foreground mt-2">
                  Status: <span className="capitalize">{order.paymentStatus}</span>
                </p>
              )}
            </div>

            {/* Cancel Order Button */}
            {order.status === 'pending' && (
              <div className="bg-card rounded-lg border border-border p-6">
                <Button
                  variant="outline"
                  onClick={handleCancelOrder}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal || 0)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-success">-{formatCurrency(order.discount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{order.shipping === 0 ? 'Free' : formatCurrency(order.shipping || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(order.tax || 0)}</span>
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total || 0)}</span>
                  </div>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="font-medium mb-2">Tracking Number</h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {order.trackingNumber}
                  </p>
                </div>
              )}

              {order.estimatedDelivery && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Estimated Delivery</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

