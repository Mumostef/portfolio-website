import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const TakeSurvey = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/surveys/${id}`);
      setSurvey(response.data);
      
      // Start the survey
      await axios.post(`/surveys/${id}/start`);
    } catch (error) {
      console.error('Error fetching survey:', error);
      setError(error.response?.data?.error || 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < survey.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate required questions
    const currentQ = survey.questions[currentQuestion];
    if (currentQ.required && !answers[currentQ.id]) {
      toast.error('Please answer this required question before proceeding.');
      return;
    }

    // Check if this is the last question
    if (currentQuestion === survey.questions.length - 1) {
      // Validate all required questions
      const requiredQuestions = survey.questions.filter(q => q.required);
      const missingAnswers = requiredQuestions.filter(q => !answers[q.id]);
      
      if (missingAnswers.length > 0) {
        toast.error(`Please answer all required questions. Missing: ${missingAnswers.length} questions.`);
        return;
      }

      // Submit survey
      try {
        setSubmitting(true);
        const response = await axios.post(`/surveys/${id}/submit`, { answers });
        setCompleted(true);
        toast.success(`Survey completed! You earned $${response.data.rewardEarned.toFixed(2)}`);
      } catch (error) {
        console.error('Error submitting survey:', error);
        toast.error(error.response?.data?.error || 'Failed to submit survey');
      } finally {
        setSubmitting(false);
      }
    } else {
      handleNext();
    }
  };

  const renderQuestion = (question) => {
    const answer = answers[question.id] || '';

    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value={option}
                  checked={answer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(answer) && answer.includes(option)}
                  onChange={(e) => {
                    const currentAnswers = Array.isArray(answer) ? answer : [];
                    if (e.target.checked) {
                      handleAnswerChange(question.id, [...currentAnswers, option]);
                    } else {
                      handleAnswerChange(question.id, currentAnswers.filter(a => a !== option));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            rows={4}
            className="form-input"
          />
        );

      case 'rating':
        return (
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleAnswerChange(question.id, rating)}
                className={`w-10 h-10 rounded-full border-2 font-semibold transition-colors ${
                  answer === rating
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-600 hover:border-blue-300'
                }`}
              >
                {rating}
              </button>
            ))}
            <span className="ml-4 text-sm text-gray-600">
              {answer ? `${answer}/5` : 'Select a rating'}
            </span>
          </div>
        );

      case 'scale':
        return (
          <div className="space-y-4">
            <input
              type="range"
              min={question.min || 0}
              max={question.max || 10}
              value={answer || question.min || 0}
              onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{question.minLabel || question.min || 0}</span>
              <span className="font-semibold">{answer || question.min || 0}</span>
              <span>{question.maxLabel || question.max || 10}</span>
            </div>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="form-input"
          />
        );
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading survey..." />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Survey Not Available</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/surveys')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Surveys
          </Button>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Survey Completed!</h2>
          <p className="text-xl text-gray-600 mb-6">
            Thank you for completing "{survey.title}"
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                ${survey.rewardAmount.toFixed(2)}
              </span>
            </div>
            <p className="text-green-800 text-sm">Earnings added to your account</p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => navigate('/surveys')} className="mr-4">
              Take Another Survey
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / survey.questions.length) * 100;
  const currentQ = survey.questions[currentQuestion];
  const timeElapsed = Math.floor((Date.now() - startTime) / 1000 / 60);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {timeElapsed} min elapsed
            </span>
            <span className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              ${survey.rewardAmount.toFixed(2)} reward
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Question {currentQuestion + 1} of {survey.questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </div>

      {/* Question Card */}
      <Card className="mb-8">
        <Card.Content className="py-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQ.text}
              {currentQ.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {currentQ.description && (
              <p className="text-gray-600 mb-4">{currentQ.description}</p>
            )}
          </div>

          {renderQuestion(currentQ)}
        </Card.Content>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="text-sm text-gray-600">
          {currentQ.required && !answers[currentQ.id] && (
            <span className="text-red-600">* This question is required</span>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          loading={submitting}
          disabled={currentQ.required && !answers[currentQ.id]}
        >
          {currentQuestion === survey.questions.length - 1 ? (
            <>
              Submit Survey
              <CheckCircle className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Survey Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Your responses are confidential and will be used for research purposes only.</p>
      </div>
    </div>
  );
};

export default TakeSurvey;
