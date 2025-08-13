import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Earnings = () => {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [filter, setFilter] = useState('all'); // all, survey, bonus, referral

  useEffect(() => {
    fetchEarnings();
  }, [currentPage, filter]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/user/earnings', {
        params: {
          page: currentPage,
          limit: 20,
          type: filter !== 'all' ? filter : undefined
        }
      });
      setEarnings(response.data.earnings);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getEarningIcon = (type) => {
    switch (type) {
      case 'survey':
        return <FileText className="h-4 w-4" />;
      case 'bonus':
        return <TrendingUp className="h-4 w-4" />;
      case 'referral':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getEarningColor = (type) => {
    switch (type) {
      case 'survey':
        return 'text-blue-600 bg-blue-100';
      case 'bonus':
        return 'text-green-600 bg-green-100';
      case 'referral':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Earnings History</h1>
        <p className="text-gray-600 mt-2">Track all your earnings from surveys, bonuses, and referrals.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Survey Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                ${earnings.filter(e => e.type === 'survey').reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                ${earnings.filter(e => {
                  const earningDate = new Date(e.createdAt);
                  const now = new Date();
                  return earningDate.getMonth() === now.getMonth() && 
                         earningDate.getFullYear() === now.getFullYear();
                }).reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Earnings List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Earnings History
            </Card.Title>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="survey">Survey Earnings</option>
                <option value="bonus">Bonuses</option>
                <option value="referral">Referrals</option>
              </select>
            </div>
          </div>
        </Card.Header>

        <Card.Content padding={false}>
          {loading ? (
            <div className="p-8">
              <LoadingSpinner text="Loading earnings..." />
            </div>
          ) : earnings.length > 0 ? (
            <>
              <div className="divide-y divide-gray-200">
                {earnings.map((earning) => (
                  <div key={earning.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${getEarningColor(earning.type)}`}>
                          {getEarningIcon(earning.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {earning.surveyTitle || earning.description}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <Badge variant={earning.type === 'survey' ? 'info' : earning.type === 'bonus' ? 'success' : 'primary'}>
                              {earning.type.charAt(0).toUpperCase() + earning.type.slice(1)}
                            </Badge>
                            <span className="text-sm text-gray-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(earning.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          +${earning.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} earnings
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex space-x-1">
                        {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={page === pagination.page ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Earnings Yet</h3>
              <p className="text-gray-600 mb-6">
                Start completing surveys to see your earnings history here.
              </p>
              <Button onClick={() => window.location.href = '/surveys'}>
                Browse Surveys
              </Button>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default Earnings;
