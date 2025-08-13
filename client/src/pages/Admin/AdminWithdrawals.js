import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  Filter, 
  Calendar, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchWithdrawals();
  }, [currentPage, statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/withdrawals', {
        params: {
          page: currentPage,
          limit: 20,
          status: statusFilter || undefined
        }
      });
      setWithdrawals(response.data.withdrawals);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (withdrawalId, action) => {
    const actionText = action === 'approve' ? 'approve' : 'reject';
    const adminNotes = prompt(`Enter notes for ${actionText}ing this withdrawal:`);
    
    if (adminNotes === null) return; // User cancelled

    try {
      setProcessingId(withdrawalId);
      await axios.put(`/admin/withdrawals/${withdrawalId}`, {
        action,
        adminNotes: adminNotes || `Withdrawal ${actionText}d by admin`
      });
      
      toast.success(`Withdrawal ${actionText}d successfully`);
      fetchWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${actionText} withdrawal`);
    } finally {
      setProcessingId(null);
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
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
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

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const totalPendingAmount = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Withdrawal Management</h1>
        <p className="text-gray-600 mt-2">
          Review and process user withdrawal requests.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">${totalPendingAmount.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Card.Content>
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </Card.Content>
      </Card>

      {/* Withdrawals Table */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            Withdrawal Requests ({pagination.total || 0})
          </Card.Title>
        </Card.Header>

        <Card.Content padding={false}>
          {loading ? (
            <div className="p-8">
              <LoadingSpinner text="Loading withdrawals..." />
            </div>
          ) : withdrawals.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Requested</th>
                      <th>Processed</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-full">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {withdrawal.user.name}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {withdrawal.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="font-semibold text-lg text-gray-900">
                            ${withdrawal.amount.toFixed(2)}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="font-medium">{getMethodDisplay(withdrawal.method)}</div>
                            <div className="text-sm text-gray-500">
                              {withdrawal.method === 'paypal' 
                                ? withdrawal.paymentDetails.email
                                : `**** ${withdrawal.paymentDetails.cardLast4}`
                              }
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge variant={getStatusVariant(withdrawal.status)} className="flex items-center w-fit">
                            {getStatusIcon(withdrawal.status)}
                            <span className="ml-1 capitalize">{withdrawal.status}</span>
                          </Badge>
                        </td>
                        <td>
                          <div className="text-sm text-gray-900">
                            {new Date(withdrawal.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(withdrawal.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td>
                          {withdrawal.processedAt ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                {new Date(withdrawal.processedAt).toLocaleDateString()}
                              </div>
                              {withdrawal.processedBy && (
                                <div className="text-xs text-gray-500">
                                  by {withdrawal.processedBy}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td>
                          {withdrawal.status === 'pending' ? (
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleProcessWithdrawal(withdrawal.id, 'approve')}
                                loading={processingId === withdrawal.id}
                                disabled={processingId !== null}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleProcessWithdrawal(withdrawal.id, 'reject')}
                                loading={processingId === withdrawal.id}
                                disabled={processingId !== null}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              {withdrawal.adminNotes && (
                                <div title={withdrawal.adminNotes} className="truncate max-w-32">
                                  {withdrawal.adminNotes}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Withdrawal Requests</h3>
              <p className="text-gray-600">
                {statusFilter 
                  ? `No ${statusFilter} withdrawal requests found.`
                  : 'No withdrawal requests have been made yet.'
                }
              </p>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default AdminWithdrawals;
