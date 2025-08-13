import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  DollarSign, 
  Clock, 
  Users, 
  CheckCircle,
  AlertCircle,
  Play
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const SurveyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/surveys/${id}`);
      setSurvey(response.data);
    } catch (error) {
      console.error('Error fetching survey:', error);
      setError(error.response?.data?.error || 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSurvey = () => {
    navigate(`/surveys/${id}/take`);
  };

  if (loading) {
    return <LoadingSpinner text="Loading survey details..." />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Survey Not Available</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/surveys">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Surveys
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/surveys" className="inline-flex items-center text-blue-600 hover:text-blue-500">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Surveys
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{survey.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {survey.estimatedTime} minutes
                    </span>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {survey.currentCompletions} completed
                    </span>
                  </div>
                </div>
                <Badge variant="success" className="text-lg px-3 py-1">
                  ${survey.rewardAmount.toFixed(2)}
                </Badge>
              </div>
            </Card.Header>
            
            <Card.Content>
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Survey</h3>
                <p className="text-gray-700 leading-relaxed mb-6">{survey.description}</p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Survey Questions</h3>
                <p className="text-gray-600 mb-4">
                  This survey contains {survey.questions.length} questions covering various topics. 
                  Your responses will help us understand consumer preferences and market trends.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">What to Expect</h4>
                      <ul className="text-blue-800 text-sm space-y-1">
                        <li>• Answer honestly and thoughtfully</li>
                        <li>• Complete all required questions</li>
                        <li>• Survey takes approximately {survey.estimatedTime} minutes</li>
                        <li>• Earn ${survey.rewardAmount.toFixed(2)} upon completion</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">Important Notes</h4>
                      <ul className="text-yellow-800 text-sm space-y-1">
                        <li>• You can only complete this survey once</li>
                        <li>• Please answer all questions honestly</li>
                        <li>• Your responses are confidential and anonymous</li>
                        <li>• Earnings will be credited immediately upon completion</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Survey Stats */}
          <Card>
            <Card.Header>
              <Card.Title>Survey Details</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reward</span>
                  <span className="font-semibold text-green-600">${survey.rewardAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{survey.estimatedTime} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Questions</span>
                  <span className="font-semibold">{survey.questions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-semibold">{survey.currentCompletions}</span>
                </div>
                {survey.maxCompletions && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Spots Left</span>
                    <Badge variant="warning" size="sm">
                      {survey.maxCompletions - survey.currentCompletions}
                    </Badge>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Start Survey */}
          <Card>
            <Card.Content>
              <div className="text-center">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    ${survey.rewardAmount.toFixed(2)}
                  </div>
                  <p className="text-gray-600 text-sm">You'll earn this amount</p>
                </div>
                
                <Button 
                  onClick={handleStartSurvey}
                  className="w-full mb-3"
                  size="lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Survey Now
                </Button>
                
                <p className="text-xs text-gray-500">
                  By starting this survey, you agree to provide honest and thoughtful responses.
                </p>
              </div>
            </Card.Content>
          </Card>

          {/* Tips */}
          <Card>
            <Card.Header>
              <Card.Title>Tips for Success</Card.Title>
            </Card.Header>
            <Card.Content>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Read each question carefully
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Answer honestly and consistently
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Complete in one session
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Don't rush through questions
                </li>
              </ul>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SurveyDetail;
