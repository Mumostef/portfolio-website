import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import axios from 'axios';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  FileText,
  DollarSign,
  Clock,
  Users
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';

const CreateSurvey = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues
  } = useForm({
    defaultValues: {
      questions: [
        {
          type: 'multiple_choice',
          text: '',
          description: '',
          required: true,
          options: ['']
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions'
  });

  const onSubmit = async (data) => {
    // Process questions to ensure proper format
    const processedQuestions = data.questions.map((question, index) => ({
      id: index + 1,
      type: question.type,
      text: question.text,
      description: question.description || '',
      required: question.required || false,
      options: question.options?.filter(option => option.trim() !== '') || [],
      min: question.min || 0,
      max: question.max || 10,
      minLabel: question.minLabel || '',
      maxLabel: question.maxLabel || ''
    }));

    const surveyData = {
      title: data.title,
      description: data.description,
      rewardAmount: parseFloat(data.rewardAmount),
      estimatedTime: parseInt(data.estimatedTime),
      maxCompletions: data.maxCompletions ? parseInt(data.maxCompletions) : null,
      questions: processedQuestions
    };

    try {
      setSubmitting(true);
      await axios.post('/admin/surveys', surveyData);
      toast.success('Survey created successfully!');
      navigate('/admin/surveys');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create survey');
    } finally {
      setSubmitting(false);
    }
  };

  const addQuestion = () => {
    append({
      type: 'multiple_choice',
      text: '',
      description: '',
      required: true,
      options: ['']
    });
  };

  const addOption = (questionIndex) => {
    const currentOptions = getValues(`questions.${questionIndex}.options`) || [];
    const updatedOptions = [...currentOptions, ''];
    setValue(`questions.${questionIndex}.options`, updatedOptions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const currentOptions = getValues(`questions.${questionIndex}.options`) || [];
    if (currentOptions.length > 1) {
      const updatedOptions = currentOptions.filter((_, index) => index !== optionIndex);
      setValue(`questions.${questionIndex}.options`, updatedOptions);
    }
  };

  const questionTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'checkbox', label: 'Checkbox (Multiple Select)' },
    { value: 'text', label: 'Text Input' },
    { value: 'rating', label: 'Rating (1-5)' },
    { value: 'scale', label: 'Scale (0-10)' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/admin/surveys" className="inline-flex items-center text-blue-600 hover:text-blue-500">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Surveys
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Survey</h1>
        <p className="text-gray-600 mt-2">Design a survey to collect user feedback and opinions.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Basic Information
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-6">
              <div>
                <label className="form-label">Survey Title</label>
                <input
                  {...register('title', {
                    required: 'Title is required',
                    minLength: { value: 5, message: 'Title must be at least 5 characters' },
                    maxLength: { value: 255, message: 'Title must be less than 255 characters' }
                  })}
                  className="form-input"
                  placeholder="Enter survey title"
                />
                {errors.title && <p className="form-error">{errors.title.message}</p>}
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  {...register('description', {
                    required: 'Description is required',
                    minLength: { value: 10, message: 'Description must be at least 10 characters' },
                    maxLength: { value: 1000, message: 'Description must be less than 1000 characters' }
                  })}
                  rows={4}
                  className="form-input"
                  placeholder="Describe what this survey is about"
                />
                {errors.description && <p className="form-error">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="form-label">Reward Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('rewardAmount', {
                        required: 'Reward amount is required',
                        min: { value: 0.01, message: 'Minimum reward is $0.01' },
                        max: { value: 1000, message: 'Maximum reward is $1000' }
                      })}
                      type="number"
                      step="0.01"
                      className="form-input pl-10"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.rewardAmount && <p className="form-error">{errors.rewardAmount.message}</p>}
                </div>

                <div>
                  <label className="form-label">Estimated Time (minutes)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('estimatedTime', {
                        required: 'Estimated time is required',
                        min: { value: 1, message: 'Minimum time is 1 minute' },
                        max: { value: 120, message: 'Maximum time is 120 minutes' }
                      })}
                      type="number"
                      className="form-input pl-10"
                      placeholder="10"
                    />
                  </div>
                  {errors.estimatedTime && <p className="form-error">{errors.estimatedTime.message}</p>}
                </div>

                <div>
                  <label className="form-label">Max Completions (optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('maxCompletions', {
                        min: { value: 1, message: 'Minimum is 1 completion' }
                      })}
                      type="number"
                      className="form-input pl-10"
                      placeholder="Unlimited"
                    />
                  </div>
                  {errors.maxCompletions && <p className="form-error">{errors.maxCompletions.message}</p>}
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Questions */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Survey Questions</Card.Title>
              <Button type="button" variant="outline" onClick={addQuestion}>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="space-y-6">
              {fields.map((field, questionIndex) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      Question {questionIndex + 1}
                    </h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(questionIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Question Type</label>
                      <select
                        {...register(`questions.${questionIndex}.type`)}
                        className="form-input"
                      >
                        {questionTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Question Text</label>
                      <input
                        {...register(`questions.${questionIndex}.text`, {
                          required: 'Question text is required'
                        })}
                        className="form-input"
                        placeholder="Enter your question"
                      />
                      {errors.questions?.[questionIndex]?.text && (
                        <p className="form-error">{errors.questions[questionIndex].text.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Description (optional)</label>
                      <input
                        {...register(`questions.${questionIndex}.description`)}
                        className="form-input"
                        placeholder="Additional context or instructions"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        {...register(`questions.${questionIndex}.required`)}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">Required question</label>
                    </div>

                    {/* Question-specific options */}
                    {(watch(`questions.${questionIndex}.type`) === 'multiple_choice' || 
                      watch(`questions.${questionIndex}.type`) === 'checkbox') && (
                      <div>
                        <label className="form-label">Options</label>
                        <div className="space-y-2">
                          {watch(`questions.${questionIndex}.options`)?.map((_, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <input
                                {...register(`questions.${questionIndex}.options.${optionIndex}`, {
                                  required: 'Option text is required'
                                })}
                                className="form-input flex-1"
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              {watch(`questions.${questionIndex}.options`)?.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeOption(questionIndex, optionIndex)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(questionIndex)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Option
                          </Button>
                        </div>
                      </div>
                    )}

                    {watch(`questions.${questionIndex}.type`) === 'scale' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Minimum Label</label>
                          <input
                            {...register(`questions.${questionIndex}.minLabel`)}
                            className="form-input"
                            placeholder="e.g., Strongly Disagree"
                          />
                        </div>
                        <div>
                          <label className="form-label">Maximum Label</label>
                          <input
                            {...register(`questions.${questionIndex}.maxLabel`)}
                            className="form-input"
                            placeholder="e.g., Strongly Agree"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-4">
          <Link to="/admin/surveys">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" loading={submitting}>
            Create Survey
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateSurvey;
