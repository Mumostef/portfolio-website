import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  DollarSign, 
  Clock, 
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Surveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchSurveys();
    fetchStats();
  }, [currentPage, searchTerm]);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/surveys', {
        params: {
          page: currentPage,
          limit: 12,
          search: searchTerm
        }
      });
      setSurveys(response.data.surveys);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/surveys/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSurveys();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Available Surveys</h1>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.availableSurveys || 0}</div>
                <div className="text-sm text-gray-600">Available Surveys</div>
              </div>
            </div>
          </Card>
          <Card className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">${stats.averageReward?.toFixed(2) || '0.00'}</div>
                <div className="text-sm text-gray-600">Average Reward</div>
              </div>
            </div>
          </Card>
          <Card className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.completedSurveys || 0}</div>
                <div className="text-sm text-gray-600">Completed by You</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search surveys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </form>
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Surveys Grid */}
      {loading ? (
        <LoadingSpinner text="Loading surveys..." />
      ) : surveys.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {surveys.map((survey) => (
              <Card key={survey.id} className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {survey.title}
                      </h3>
                      <Badge variant="success" className="ml-2 flex-shrink-0">
                        ${survey.rewardAmount.toFixed(2)}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {survey.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
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
                  
                  <div className="flex space-x-2">
                    <Link to={`/surveys/${survey.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link to={`/surveys/${survey.id}/take`} className="flex-1">
                      <Button className="w-full">
                        Start Survey
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
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
                
                {/* Page numbers */}
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
          )}
        </>
      ) : (
        <Card className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Surveys Available</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? `No surveys found matching "${searchTerm}". Try a different search term.`
              : 'There are no surveys available at the moment. Check back later for new opportunities!'
            }
          </p>
          {searchTerm && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              Clear Search
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};

export default Surveys;
