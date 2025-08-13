import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Users,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminSurveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchSurveys();
  }, [currentPage]);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/surveys', {
        params: {
          page: currentPage,
          limit: 20
        }
      });
      setSurveys(response.data.surveys);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast.error('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (surveyId, currentStatus) => {
    try {
      await axios.put(`/admin/surveys/${surveyId}/status`, {
        isActive: !currentStatus
      });
      toast.success(`Survey ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchSurveys();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update survey status');
    }
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (!window.confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/admin/surveys/${surveyId}`);
      toast.success('Survey deleted successfully');
      fetchSurveys();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete survey');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Survey Management</h1>
            <p className="text-gray-600 mt-2">
              Create, edit, and manage surveys for your platform.
            </p>
          </div>
          <Link to="/admin/surveys/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Survey
            </Button>
          </Link>
        </div>
      </div>

      {/* Surveys Table */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            All Surveys ({pagination.total || 0})
          </Card.Title>
        </Card.Header>

        <Card.Content padding={false}>
          {loading ? (
            <div className="p-8">
              <LoadingSpinner text="Loading surveys..." />
            </div>
          ) : surveys.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Survey</th>
                      <th>Status</th>
                      <th>Reward</th>
                      <th>Duration</th>
                      <th>Completions</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {surveys.map((survey) => (
                      <tr key={survey.id} className="hover:bg-gray-50">
                        <td>
                          <div>
                            <div className="font-medium text-gray-900 line-clamp-1">
                              {survey.title}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {survey.description}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Created by: {survey.createdBy}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <Badge variant={survey.isActive ? 'success' : 'default'}>
                              {survey.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <button
                              onClick={() => handleToggleActive(survey.id, survey.isActive)}
                              className="text-gray-400 hover:text-gray-600"
                              title={survey.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {survey.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className="font-medium text-green-600">
                            ${survey.rewardAmount.toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-1" />
                            {survey.estimatedTime} min
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="font-medium">{survey.currentCompletions}</div>
                            {survey.maxCompletions && (
                              <div className="text-xs text-gray-500">
                                / {survey.maxCompletions} max
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm text-gray-900">
                            {new Date(survey.createdAt).toLocaleDateString()}
                          </div>
                          {survey.updatedAt !== survey.createdAt && (
                            <div className="text-xs text-gray-500">
                              Updated: {new Date(survey.updatedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <Link to={`/admin/surveys/${survey.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSurvey(survey.id)}
                              className="text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                      {pagination.total} surveys
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
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Surveys Found</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first survey.
              </p>
              <Link to="/admin/surveys/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Survey
                </Button>
              </Link>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default AdminSurveys;
