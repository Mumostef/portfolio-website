import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [withdrawalInfo, setWithdrawalInfo] = useState(null);

  useEffect(() => {
    fetchWithdrawals();
    fetchWithdrawalInfo();
  }, [currentPage]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/withdrawals', {
        params: {
          page: currentPage,
          limit: 20
        }
      });
      setWithdrawals(response.data.withdrawals);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalInfo = async () => {
    try {
      const response = await axios.get('/withdrawals/info');
      setWithdrawalInfo(response.data);
    } catch (error) {
      console.error('Error fetching withdrawal info:', error);
    }
  };

  const handleCancelWithdrawal = async (withdrawalId) => {
    if (!window.confirm('Are you sure you want to cancel this withdrawal request?')) {
      return;
    }

    try {
      await axios.delete(`/withdrawals/${withdrawalId}`);
      toast.success('Withdrawal request cancelled successfully');
      fetchWithdrawals();
      fetchWithdrawalInfo();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel withdrawal');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
      case 'completed':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getMethodDisplay = (method) => {
    switch (method) {
      case 'paypal':
        return 'PayPal';
      case 'stripe':
        return 'Credit Card';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Withdrawals</h1>
            <p className="text-gray-600 mt-2">Manage your withdrawal requests and payment history.</p>
          </div>
          {withdrawalInfo && withdrawalInfo.availableBalance >= withdrawalInfo.minimumWithdrawal && (
            <Link to="/withdrawals/request">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Request Withdrawal
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Withdrawal Info */}
      {withdrawalInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${withdrawalInfo.availableBalance.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${withdrawalInfo.pendingAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Minimum Withdrawal</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${withdrawalInfo.minimumWithdrawal.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Withdrawal Info Card */}
      {withdrawalInfo && (
        <Card className="mb-8">
          <Card.Header>
            <Card.Title>Withdrawal Information</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Supported Methods</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {withdrawalInfo.supportedMethods.map((method) => (
                    <li key={method} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {getMethodDisplay(method)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Processing Information</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Processing time: {withdrawalInfo.processingTime}</li>
                  <li>• Minimum amount: ${withdrawalInfo.minimumWithdrawal.toFixed(2)}</li>
                  <li>• Processing fees apply</li>
                </ul>
              </div>
            </div>
            
            {withdrawalInfo.availableBalance < withdrawalInfo.minimumWithdrawal && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Minimum Balance Required</h4>
                    <p className="text-yellow-800 text-sm mt-1">
                      You need at least ${withdrawalInfo.minimumWithdrawal.toFixed(2)} to request a withdrawal. 
                      Complete more surveys to reach the minimum amount.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Withdrawals List */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            Withdrawal History
          </Card.Title>
        </Card.Header>

        <Card.Content padding={false}>
          {loading ? (
            <div className="p-8">
              <LoadingSpinner text="Loading withdrawals..." />
            </div>
          ) : withdrawals.length > 0 ? (
            <>
              <div className="divide-y divide-gray-200">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`p-2 rounded-full ${
                            withdrawal.status === 'completed' ? 'bg-green-100 text-green-600' :
                            withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {getStatusIcon(withdrawal.status)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">
                              ${withdrawal.amount.toFixed(2)} via {getMethodDisplay(withdrawal.method)}
                            </h4>
                            <Badge variant={getStatusVariant(withdrawal.status)}>
                              {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Requested: {new Date(withdrawal.createdAt).toLocaleDateString()}
                            </span>
                            {withdrawal.processedAt && (
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Processed: {new Date(withdrawal.processedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {withdrawal.adminNotes && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Note:</strong> {withdrawal.adminNotes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {withdrawal.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelWithdrawal(withdrawal.id)}
                          >
                            Cancel
                          </Button>
                        )}
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
                      {pagination.total} withdrawals
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
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Withdrawals Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't made any withdrawal requests yet. Start earning and request your first withdrawal!
              </p>
              {withdrawalInfo && withdrawalInfo.availableBalance >= withdrawalInfo.minimumWithdrawal ? (
                <Link to="/withdrawals/request">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Request Withdrawal
                  </Button>
                </Link>
              ) : (
                <Link to="/surveys">
                  <Button>
                    Complete Surveys
                  </Button>
                </Link>
              )}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default Withdrawals;
