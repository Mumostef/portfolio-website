import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  DollarSign, 
  FileText, 
  TrendingUp, 
  CreditCard,
  Clock,
  CheckCircle,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentSurveys, setRecentSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardResponse, surveysResponse] = await Promise.all([
          axios.get('/user/dashboard'),
          axios.get('/surveys?limit=5')
        ]);

        setDashboardData(dashboardResponse.data);
        setRecentSurveys(surveysResponse.data.surveys);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  const stats = [
    {
      title: 'Available Balance',
      value: `$${dashboardData?.availableBalance?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Earnings',
      value: `$${dashboardData?.totalEarnings?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Completed Surveys',
      value: dashboardData?.completedSurveys || 0,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'This Week',
      value: `$${dashboardData?.recentEarnings?.toFixed(2) || '0.00'}`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's your survey earnings overview and available opportunities.
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
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Surveys */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Available Surveys
                </Card.Title>
                <Link to="/surveys">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card.Header>
            <Card.Content>
              {recentSurveys.length > 0 ? (
                <div className="space-y-4">
                  {recentSurveys.map((survey) => (
                    <div key={survey.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{survey.title}</h4>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{survey.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              ${survey.rewardAmount.toFixed(2)}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {survey.estimatedTime} min
                            </span>
                            {survey.spotsRemaining && (
                              <Badge variant="warning" size="sm">
                                {survey.spotsRemaining} spots left
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Link to={`/surveys/${survey.id}`}>
                          <Button size="sm">
                            Start Survey
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No surveys available at the moment.</p>
                  <p className="text-gray-400 text-sm">Check back later for new opportunities!</p>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Withdrawal Card */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                Quick Withdrawal
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  ${dashboardData?.availableBalance?.toFixed(2) || '0.00'}
                </div>
                <p className="text-gray-600 text-sm mb-4">Available for withdrawal</p>
                {dashboardData?.availableBalance >= 5 ? (
                  <Link to="/withdrawals/request">
                    <Button className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Request Withdrawal
                    </Button>
                  </Link>
                ) : (
                  <div>
                    <Button disabled className="w-full mb-2">
                      Minimum $5.00 Required
                    </Button>
                    <p className="text-xs text-gray-500">
                      Complete more surveys to reach the minimum withdrawal amount.
                    </p>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Pending Withdrawals */}
          {dashboardData?.pendingWithdrawals > 0 && (
            <Card>
              <Card.Header>
                <Card.Title className="text-orange-600">Pending Withdrawals</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600 mb-2">
                    ${dashboardData.pendingWithdrawals.toFixed(2)}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Being processed</p>
                  <Link to="/withdrawals">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <Card.Header>
              <Card.Title>Quick Links</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <Link to="/surveys" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Browse All Surveys
                  </Button>
                </Link>
                <Link to="/earnings" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Earnings History
                  </Button>
                </Link>
                <Link to="/withdrawals" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Withdrawal History
                  </Button>
                </Link>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
