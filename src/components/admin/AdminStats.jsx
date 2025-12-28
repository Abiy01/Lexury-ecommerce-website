import { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { adminAPI } from '@/services/api';

export function AdminStats() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
    recentSales: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getStats();
      const data = response.data.data || response.data || {};
      
      // Calculate pending orders from ordersByStatus
      const ordersByStatus = data.ordersByStatus || {};
      const pendingOrders = (ordersByStatus.pending || 0) + 
                          (ordersByStatus.confirmed || 0) + 
                          (ordersByStatus.processing || 0);

      setStats({
        totalRevenue: data.totalRevenue || 0,
        totalOrders: data.totalOrders || 0,
        totalProducts: data.totalProducts || 0,
        totalUsers: data.totalUsers || 0,
        pendingOrders: pendingOrders,
        recentSales: data.recentSales || 0,
      });
    } catch (error) {
      console.error('Failed to load admin stats:', error);
      // Keep default values on error
    } finally {
      setIsLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      change: stats.recentSales > 0 ? `+${formatCurrency(stats.recentSales)} (30d)` : 'No recent sales',
      changeType: stats.recentSales > 0 ? 'positive' : 'neutral',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-500',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingBag,
      change: `${stats.pendingOrders} pending`,
      changeType: 'neutral',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Products',
      value: stats.totalProducts.toString(),
      icon: TrendingUp,
      change: `${stats.totalProducts} total`,
      changeType: 'neutral',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
    },
    {
      title: 'Customers',
      value: stats.totalUsers.toString(),
      icon: Users,
      change: `${stats.totalUsers} users`,
      changeType: 'neutral',
      bgColor: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-2"></div>
            <div className="h-8 bg-muted rounded w-32 mb-2"></div>
            <div className="h-4 bg-muted rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((stat) => (
        <div key={stat.title} className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-semibold mt-1">{stat.value}</p>
              <p
                className={`text-sm mt-1 ${
                  stat.changeType === 'positive'
                    ? 'text-green-600'
                    : stat.changeType === 'negative'
                    ? 'text-red-600'
                    : 'text-muted-foreground'
                }`}
              >
                {stat.change}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

