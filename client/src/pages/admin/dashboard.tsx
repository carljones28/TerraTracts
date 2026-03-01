import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, Home, MapPin, Activity, TrendingUp, BarChart, AlertTriangle, Clock } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

// Placeholder data - would come from actual API endpoints in production
const usersData = [
  { month: 'Jan', count: 10 },
  { month: 'Feb', count: 15 },
  { month: 'Mar', count: 22 },
  { month: 'Apr', count: 28 },
  { month: 'May', count: 35 },
  { month: 'Jun', count: 42 },
  { month: 'Jul', count: 48 },
  { month: 'Aug', count: 53 },
  { month: 'Sep', count: 60 },
  { month: 'Oct', count: 68 },
  { month: 'Nov', count: 75 },
  { month: 'Dec', count: 85 },
];

const propertiesData = [
  { month: 'Jan', listed: 5, sold: 2 },
  { month: 'Feb', listed: 8, sold: 3 },
  { month: 'Mar', listed: 12, sold: 5 },
  { month: 'Apr', listed: 15, sold: 7 },
  { month: 'May', listed: 18, sold: 8 },
  { month: 'Jun', listed: 22, sold: 10 },
  { month: 'Jul', listed: 25, sold: 12 },
  { month: 'Aug', listed: 30, sold: 15 },
  { month: 'Sep', listed: 35, sold: 18 },
  { month: 'Oct', listed: 40, sold: 20 },
  { month: 'Nov', listed: 45, sold: 22 },
  { month: 'Dec', listed: 50, sold: 25 },
];

const revenueData = [
  { month: 'Jan', revenue: 5000 },
  { month: 'Feb', revenue: 8000 },
  { month: 'Mar', revenue: 12000 },
  { month: 'Apr', revenue: 15000 },
  { month: 'May', revenue: 18000 },
  { month: 'Jun', revenue: 22000 },
  { month: 'Jul', revenue: 25000 },
  { month: 'Aug', revenue: 30000 },
  { month: 'Sep', revenue: 35000 },
  { month: 'Oct', revenue: 40000 },
  { month: 'Nov', revenue: 45000 },
  { month: 'Dec', revenue: 50000 },
];

const pieData = [
  { name: 'Residential', value: 35 },
  { name: 'Agricultural', value: 25 },
  { name: 'Recreational', value: 20 },
  { name: 'Commercial', value: 10 },
  { name: 'Mountain', value: 5 },
  { name: 'Other', value: 5 },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const recentActions = [
  { id: 1, user: 'John Smith', action: 'Listed new property', property: 'Mountain View Ranch', time: '10 minutes ago' },
  { id: 2, user: 'Sarah Johnson', action: 'Marked property as sold', property: 'Lakefront Estate', time: '1 hour ago' },
  { id: 3, user: 'Michael Brown', action: 'Updated property details', property: 'Riverfront Land', time: '3 hours ago' },
  { id: 4, user: 'Emily Davis', action: 'Added new photos', property: 'Desert Oasis', time: '5 hours ago' },
  { id: 5, user: 'David Wilson', action: 'Changed price', property: 'Forest Retreat', time: '1 day ago' },
];

const systemAlerts = [
  { id: 1, type: 'error', message: 'Database connection error at 2:15 AM', time: '6 hours ago' },
  { id: 2, type: 'warning', message: 'High server load detected', time: '12 hours ago' },
  { id: 3, type: 'info', message: 'System update completed successfully', time: '1 day ago' },
  { id: 4, type: 'warning', message: 'Low disk space on media server', time: '2 days ago' },
];

const AdminDashboard = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect non-admin users
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="py-24 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Monitor platform performance and analytics</p>
        </div>

        <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-4 w-full max-w-3xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-primary mr-2" />
                    <span className="text-3xl font-bold">{usersData[11].count}</span>
                  </div>
                  <p className="text-xs text-green-600 mt-2">↑ 12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Active Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Home className="h-5 w-5 text-primary mr-2" />
                    <span className="text-3xl font-bold">{propertiesData[11].listed}</span>
                  </div>
                  <p className="text-xs text-green-600 mt-2">↑ 8% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Properties Sold</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-primary mr-2" />
                    <span className="text-3xl font-bold">{propertiesData[11].sold}</span>
                  </div>
                  <p className="text-xs text-green-600 mt-2">↑ 15% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-primary mr-2" />
                    <span className="text-3xl font-bold">{formatCurrency(revenueData[11].revenue)}</span>
                  </div>
                  <p className="text-xs text-green-600 mt-2">↑ 10% from last month</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>Monthly user registrations</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usersData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Property Listings</CardTitle>
                  <CardDescription>Monthly properties listed vs sold</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={propertiesData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="listed" fill="#8884d8" name="Properties Listed" />
                      <Bar dataKey="sold" fill="#82ca9d" name="Properties Sold" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest actions across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActions.map((action) => (
                      <div key={action.id} className="flex items-start space-x-3 border-b pb-3 last:border-0">
                        <Activity className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{action.user}</p>
                          <p className="text-sm text-gray-500">
                            {action.action}: <span className="font-medium">{action.property}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{action.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Property Types</CardTitle>
                  <CardDescription>Distribution by category</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-primary mr-2" />
                    <span className="text-3xl font-bold">85</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Buyers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-3xl font-bold">58</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">68% of users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Sellers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-3xl font-bold">20</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">24% of users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-orange-500 mr-2" />
                    <span className="text-3xl font-bold">7</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">8% of users</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>Monthly user registrations for the past year</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usersData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                  <CardDescription>Metrics on user platform activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Daily Active Users</span>
                      <span className="text-sm font-medium">32 (38%)</span>
                    </div>
                    <Progress value={38} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Weekly Active Users</span>
                      <span className="text-sm font-medium">52 (61%)</span>
                    </div>
                    <Progress value={61} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Monthly Active Users</span>
                      <span className="text-sm font-medium">68 (80%)</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Retention Rate</span>
                      <span className="text-sm font-medium">72%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Acquisition</CardTitle>
                  <CardDescription>How users are finding the platform</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Organic Search', value: 42 },
                          { name: 'Direct', value: 28 },
                          { name: 'Referral', value: 15 },
                          { name: 'Social Media', value: 10 },
                          { name: 'Email', value: 5 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Home className="h-5 w-5 text-primary mr-2" />
                    <span className="text-3xl font-bold">50</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Active Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Home className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-3xl font-bold">38</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">76% of total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Pending Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Home className="h-5 w-5 text-orange-500 mr-2" />
                    <span className="text-3xl font-bold">7</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">14% of total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Sold Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Home className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-3xl font-bold">25</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Total sold this year</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Listings</CardTitle>
                  <CardDescription>Monthly properties listed vs sold</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={propertiesData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="listed" fill="#8884d8" name="Properties Listed" />
                      <Bar dataKey="sold" fill="#82ca9d" name="Properties Sold" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Property Types</CardTitle>
                  <CardDescription>Distribution by category</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
                <CardDescription>Monthly revenue from property sales</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Properties by state</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">California</span>
                    <span className="text-sm font-medium">12 (24%)</span>
                  </div>
                  <Progress value={24} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Colorado</span>
                    <span className="text-sm font-medium">9 (18%)</span>
                  </div>
                  <Progress value={18} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Texas</span>
                    <span className="text-sm font-medium">8 (16%)</span>
                  </div>
                  <Progress value={16} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Montana</span>
                    <span className="text-sm font-medium">7 (14%)</span>
                  </div>
                  <Progress value={14} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Oregon</span>
                    <span className="text-sm font-medium">6 (12%)</span>
                  </div>
                  <Progress value={12} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Other States</span>
                    <span className="text-sm font-medium">8 (16%)</span>
                  </div>
                  <Progress value={16} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Server Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                    <span className="text-xl font-bold">Operational</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">99.98% uptime this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">CPU Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <BarChart className="h-5 w-5 text-primary mr-2" />
                    <span className="text-3xl font-bold">32%</span>
                  </div>
                  <Progress value={32} className="h-2 mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <BarChart className="h-5 w-5 text-primary mr-2" />
                    <span className="text-3xl font-bold">46%</span>
                  </div>
                  <Progress value={46} className="h-2 mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Disk Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <BarChart className="h-5 w-5 text-primary mr-2" />
                    <span className="text-3xl font-bold">67%</span>
                  </div>
                  <Progress value={67} className="h-2 mt-2" />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>Recent system notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-start space-x-3 border-b pb-3 last:border-0">
                        {alert.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />}
                        {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />}
                        {alert.type === 'info' && <Activity className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />}
                        <div>
                          <p className="font-medium">
                            {alert.type === 'error' && <span className="text-red-500">Error: </span>}
                            {alert.type === 'warning' && <span className="text-amber-500">Warning: </span>}
                            {alert.type === 'info' && <span className="text-blue-500">Info: </span>}
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Performance</CardTitle>
                  <CardDescription>Response times for key endpoints</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">GET /api/properties</span>
                      <span className="text-sm font-medium">56ms</span>
                    </div>
                    <Progress value={28} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">GET /api/properties/:id</span>
                      <span className="text-sm font-medium">42ms</span>
                    </div>
                    <Progress value={21} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">POST /api/properties</span>
                      <span className="text-sm font-medium">112ms</span>
                    </div>
                    <Progress value={56} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">GET /api/users</span>
                      <span className="text-sm font-medium">34ms</span>
                    </div>
                    <Progress value={17} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">GET /api/ai/property-insights</span>
                      <span className="text-sm font-medium">324ms</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Server Load History</CardTitle>
                <CardDescription>System load over the past 24 hours</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    data={Array.from({ length: 24 }, (_, i) => ({
                      hour: i,
                      load: Math.random() * 50 + 20
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Server Load']} />
                    <Line 
                      type="monotone" 
                      dataKey="load" 
                      stroke="#8884d8" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;