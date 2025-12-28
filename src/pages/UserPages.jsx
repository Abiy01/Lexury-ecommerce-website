// Profile, Orders, Admin Dashboard, and Merchant Dashboard pages
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { User, Package, LayoutDashboard, ShoppingBag, Users as UsersIcon, Store, ClipboardList, Save, Lock, Eye, EyeOff, Upload, X, Camera } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AdminStats } from '@/components/admin/AdminStats';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { MerchantProductManagement } from '@/components/merchant/MerchantProductManagement';
import { MerchantOrdersView } from '@/components/merchant/MerchantOrdersView';
import { useAuth } from '@/context/AuthContext';
import { authAPI, ordersAPI } from '@/services/api';
import { toast } from 'sonner';
import { getInitials, formatCurrency, getImageUrl, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';

export function Profile() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        const response = await authAPI.getProfile();
        const userData = response.data.data || response.data;
        
        if (userData) {
          setProfileData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        // Don't redirect - use user from context as fallback
        // The ProtectedRoute will handle authentication checks
        if (user) {
          setProfileData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
          });
        } else {
          // If no user in context and API call failed, let ProtectedRoute handle redirect
          console.warn('No user data available');
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, user]);

  // Show loading if not authenticated (ProtectedRoute will handle redirect)
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container-luxe py-16 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.data || response.data;
      
      updateUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    setIsUploadingAvatar(true);
    try {
      const response = await authAPI.uploadAvatar(file);
      const updatedUser = response.data.data || response.data;
      
      updateUser(updatedUser);
      toast.success('Profile picture updated successfully');
      setAvatarPreview(null); // Clear preview after successful upload
    } catch (error) {
      console.error('Avatar upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload profile picture';
      toast.error(errorMessage);
      setAvatarPreview(null); // Clear preview on error
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <Layout>
        <div className="container-luxe py-16 text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-luxe py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
              {/* User Info */}
              <div className="text-center mb-6">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={user?.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : user?.avatar ? (
                      <img
                        src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.avatar}`}
                        alt={user?.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-accent">
                        {getInitials(user?.name || 'User')}
                      </span>
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className={`absolute bottom-0 right-0 w-7 h-7 bg-accent text-accent-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-accent/90 transition-colors shadow-lg ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Upload profile picture"
                  >
                    {isUploadingAvatar ? (
                      <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                    />
                  </label>
                </div>
                <h2 className="font-semibold text-lg">{user?.name || 'User'}</h2>
                <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
                {user?.role && (
                  <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-secondary rounded-full">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                )}
              </div>

              <Separator className="my-6" />

              {/* Navigation */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-secondary'
                  }`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'password'
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-secondary'
                  }`}
                >
                  Change Password
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <div className="bg-card rounded-lg border border-border p-6 md:p-8">
                <h2 className="font-display text-2xl font-semibold mb-6">Profile Information</h2>
                
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        required
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({ ...profileData, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({ ...profileData, address: e.target.value })
                      }
                      placeholder="123 Main St, City, State, ZIP"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      variant="accent"
                      size="lg"
                      disabled={isLoading}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        if (user) {
                          setProfileData({
                            name: user.name || '',
                            email: user.email || '',
                            phone: user.phone || '',
                            address: user.address || '',
                          });
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <div className="bg-card rounded-lg border border-border p-6 md:p-8">
                <h2 className="font-display text-2xl font-semibold mb-6">Change Password</h2>
                
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? 'text' : 'password'}
                        required
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                        }
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? 'text' : 'password'}
                        required
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                        }
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters long
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        required
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                        }
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      variant="accent"
                      size="lg"
                      disabled={isLoading}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      {isLoading ? 'Changing Password...' : 'Change Password'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() =>
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        })
                      }
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function Orders() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await ordersAPI.getAll();
        const ordersData = response.data.data || response.data || [];
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (error) {
        console.error('Failed to load orders:', error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container-luxe py-16 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-luxe py-8 md:py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Order History</h1>
          <p className="text-muted-foreground">View and track your orders</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h2 className="font-display text-2xl font-semibold mb-4">No Orders Yet</h2>
            <p className="text-muted-foreground mb-8">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Button asChild variant="accent">
              <a href="/products">Browse Products</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id || order.id}
                className="bg-card rounded-lg border border-border p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Order #{order.orderNumber || order._id || order.id}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt || order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.total || 0)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getOrderStatusColor(order.status || 'pending')}`}>
                      {getOrderStatusLabel(order.status || 'pending')}
                    </span>
                  </div>
                </div>
                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex gap-2 flex-wrap">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{item.product?.name || 'Product'}</span>
                          <span className="text-xs">x{item.quantity}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-sm text-muted-foreground">
                          +{order.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/orders/${order._id || order.id}`}>View Details</Link>
                  </Button>
                  {order.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to cancel this order?')) {
                          return;
                        }
                        try {
                          await ordersAPI.cancel(order._id || order.id);
                          toast.success('Order cancelled');
                          // Reload orders
                          const response = await ordersAPI.getAll();
                          const ordersData = response.data.data || response.data || [];
                          setOrders(Array.isArray(ordersData) ? ordersData : []);
                        } catch (error) {
                          console.error('Failed to cancel order:', error);
                          toast.error(error.response?.data?.message || 'Failed to cancel order');
                        }
                      }}
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Layout>
      <div className="min-h-screen bg-muted/30">
        <div className="container-luxe py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage your store, orders, and customers</p>
            </div>
          </div>

          {/* Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-background border p-1 h-auto flex-wrap">
              <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ShoppingBag className="h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Package className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <UsersIcon className="h-4 w-4" />
                Users
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <AdminStats />
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <div className="bg-card border rounded-lg p-6">
                <ProductManagement />
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="bg-card border rounded-lg p-6">
                <OrderManagement />
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="bg-card border rounded-lg p-6">
                <UserManagement />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

export function MerchantDashboard() {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <Layout>
      <div className="min-h-screen bg-muted/30">
        <div className="container-luxe py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Store className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold">Merchant Dashboard</h1>
              <p className="text-muted-foreground">Manage your products and view orders</p>
            </div>
          </div>

          {/* Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-background border p-1 h-auto flex-wrap">
              <TabsTrigger value="products" className="gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                <ShoppingBag className="h-4 w-4" />
                My Products
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                <ClipboardList className="h-4 w-4" />
                Orders
              </TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products">
              <div className="bg-card border rounded-lg p-6">
                <MerchantProductManagement />
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="bg-card border rounded-lg p-6">
                <MerchantOrdersView />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

