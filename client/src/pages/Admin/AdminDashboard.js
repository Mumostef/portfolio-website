import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, 
  FileText, 
  DollarSign, 
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/admin/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  const stats = [
    {
      title: 'Total Users',
      value: dashboardData?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: `+${dashboardData?.newUsersThisMonth || 0} this month`
    },
    {
      title: 'Active Surveys',
      value: dashboardData?.activeSurveys || 0,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: `${dashboardData?.totalSurveys || 0} total surveys`
    },
    {
      title: 'Total Earnings Paid',
      value: `$${dashboardData?.totalEarnings?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: 'All time'
    },
    {
      title: 'Pending Withdrawals',
      value: dashboardData?.pendingWithdrawals?.count || 0,
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: `$${dashboardData?.pendingWithdrawals?.amount?.toFixed(2) || '0.00'} pending`
    }
  ];

  const quickActions = [
    {
      title: 'Create New Survey',
      description: 'Add a new survey for users to complete',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700',
      link: '/admin/surveys/create'
    },
    {
      title: 'Review Withdrawals',
      description: 'Process pending withdrawal requests',
      icon: CreditCard,
      color: 'bg-green-600 hover:bg-green-700',
      link: '/admin/withdrawals'
    },
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: Users,
      color: 'bg-purple-600 hover:bg-purple-700',
      link: '/admin/users'
    },
    {
      title: 'Survey Analytics',
      description: 'View survey performance and statistics',
      icon: TrendingUp,
      color: 'bg-orange-600 hover:bg-orange-700',
      link: '/admin/surveys'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your survey platform and monitor key metrics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <Card.Title>Quick Actions</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link key={index} to={action.link}>
                      <div className="group p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {action.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card.Content>
          </Card>

          {/* Recent Activity */}
          <Card className="mt-6">
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>Platform Activity</Card.Title>
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {dashboardData?.monthlyCompletions || 0} surveys completed this month
                    </p>
                    <p className="text-xs text-gray-500">Platform engagement is strong</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {dashboardData?.newUsersThisMonth || 0} new users joined this month
                    </p>
                    <p className="text-xs text-gray-500">User growth is steady</p>
                  </div>
                </div>

                {dashboardData?.pendingWithdrawals?.count > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {dashboardData.pendingWithdrawals.count} withdrawal requests need review
                      </p>
                      <p className="text-xs text-gray-500">
                        Total amount: ${dashboardData.pendingWithdrawals.amount.toFixed(2)}
                      </p>
                    </div>
                    <Link to="/admin/withdrawals">
                      <Button size="sm">Review</Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* System Status */}
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>System Status</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Platform Status</span>
                  <Badge variant="success">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Processing</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email Service</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Database</span>
                  <Badge variant="success">Healthy</Badge>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Recent Metrics</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Survey Completion Rate</span>
                    <span className="text-sm font-semibold">87%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">User Satisfaction</span>
                    <span className="text-sm font-semibold">4.8/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Payment Success Rate</span>
                    <span className="text-sm font-semibold">99.2%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '99.2%' }}></div>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Quick Stats</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg. Survey Value</span>
                  <span className="font-semibold">$2.45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg. Completion Time</span>
                  <span className="font-semibold">8.5 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Users (24h)</span>
                  <span className="font-semibold">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue This Month</span>
                  <span className="font-semibold text-green-600">$12,450</span>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
