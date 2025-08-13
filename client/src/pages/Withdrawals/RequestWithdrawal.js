import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { 
  ArrowLeft, 
  CreditCard, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const RequestWithdrawal = () => {
  const navigate = useNavigate();
  const [withdrawalInfo, setWithdrawalInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('paypal');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues: {
      method: 'paypal'
    }
  });

  const watchAmount = watch('amount');
  const watchMethod = watch('method');

  useEffect(() => {
    fetchWithdrawalInfo();
  }, []);

  useEffect(() => {
    setSelectedMethod(watchMethod);
  }, [watchMethod]);

  const fetchWithdrawalInfo = async () => {
    try {
      const response = await axios.get('/withdrawals/info');
      setWithdrawalInfo(response.data);
      
      if (response.data.availableBalance < response.data.minimumWithdrawal) {
        toast.error('Insufficient balance for withdrawal');
        navigate('/withdrawals');
      }
    } catch (error) {
      console.error('Error fetching withdrawal info:', error);
      toast.error('Failed to load withdrawal information');
      navigate('/withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    const paymentDetails = {};
    
    if (data.method === 'paypal') {
      paymentDetails.email = data.paypalEmail;
    } else if (data.method === 'stripe') {
      paymentDetails.cardLast4 = data.cardLast4;
      paymentDetails.cardType = data.cardType;
    }

    try {
      setSubmitting(true);
      await axios.post('/withdrawals', {
        amount: parseFloat(data.amount),
        method: data.method,
        paymentDetails
      });
      
      toast.success('Withdrawal request submitted successfully!');
      navigate('/withdrawals');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading withdrawal information..." />;
  }

  const calculateFee = (amount) => {
    const feePercentage = withdrawalInfo?.withdrawalFeePercentage || 0.02;
    return amount * feePercentage;
  };

  const netAmount = watchAmount ? parseFloat(watchAmount) - calculateFee(parseFloat(watchAmount)) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/withdrawals" className="inline-flex items-center text-blue-600 hover:text-blue-500">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Withdrawals
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Request Withdrawal</h1>
        <p className="text-gray-600 mt-2">Withdraw your earnings to PayPal or credit card.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                Withdrawal Details
              </Card.Title>
            </Card.Header>
            
            <Card.Content>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Amount */}
                <div>
                  <label className="form-label">Withdrawal Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('amount', {
                        required: 'Amount is required',
                        min: {
                          value: withdrawalInfo.minimumWithdrawal,
                          message: `Minimum withdrawal is $${withdrawalInfo.minimumWithdrawal.toFixed(2)}`
                        },
                        max: {
                          value: withdrawalInfo.availableBalance,
                          message: 'Amount exceeds available balance'
                        },
                        validate: value => {
                          const num = parseFloat(value);
                          if (isNaN(num)) return 'Please enter a valid amount';
                          if (num <= 0) return 'Amount must be greater than 0';
                          return true;
                        }
                      })}
                      type="number"
                      step="0.01"
                      className="form-input pl-10"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.amount && (
                    <p className="form-error">{errors.amount.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Available balance: ${withdrawalInfo.availableBalance.toFixed(2)}
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="form-label">Payment Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="relative">
                      <input
                        {...register('method')}
                        type="radio"
                        value="paypal"
                        className="sr-only"
                      />
                      <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedMethod === 'paypal' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">PP</span>
                          </div>
                          <div>
                            <div className="font-medium">PayPal</div>
                            <div className="text-sm text-gray-500">Fast & secure</div>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="relative">
                      <input
                        {...register('method')}
                        type="radio"
                        value="stripe"
                        className="sr-only"
                      />
                      <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedMethod === 'stripe' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-8 h-8 text-gray-600" />
                          <div>
                            <div className="font-medium">Credit Card</div>
                            <div className="text-sm text-gray-500">Visa, MasterCard</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* PayPal Details */}
                {selectedMethod === 'paypal' && (
                  <div>
                    <label className="form-label">PayPal Email Address</label>
                    <input
                      {...register('paypalEmail', {
                        required: selectedMethod === 'paypal' ? 'PayPal email is required' : false,
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      type="email"
                      className="form-input"
                      placeholder="your-paypal@email.com"
                    />
                    {errors.paypalEmail && (
                      <p className="form-error">{errors.paypalEmail.message}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Make sure this email is associated with your PayPal account
                    </p>
                  </div>
                )}

                {/* Credit Card Details */}
                {selectedMethod === 'stripe' && (
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Card Type</label>
                      <select
                        {...register('cardType', {
                          required: selectedMethod === 'stripe' ? 'Card type is required' : false
                        })}
                        className="form-input"
                      >
                        <option value="">Select card type</option>
                        <option value="visa">Visa</option>
                        <option value="mastercard">MasterCard</option>
                      </select>
                      {errors.cardType && (
                        <p className="form-error">{errors.cardType.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label">Last 4 Digits</label>
                      <input
                        {...register('cardLast4', {
                          required: selectedMethod === 'stripe' ? 'Last 4 digits are required' : false,
                          pattern: {
                            value: /^\d{4}$/,
                            message: 'Please enter exactly 4 digits'
                          }
                        })}
                        type="text"
                        maxLength="4"
                        className="form-input"
                        placeholder="1234"
                      />
                      {errors.cardLast4 && (
                        <p className="form-error">{errors.cardLast4.message}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        For verification purposes only
                      </p>
                    </div>
                  </div>
                )}

                {/* Fee Information */}
                {watchAmount && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 mb-2">Transaction Summary</h4>
                        <div className="space-y-1 text-sm text-blue-800">
                          <div className="flex justify-between">
                            <span>Withdrawal amount:</span>
                            <span>${parseFloat(watchAmount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processing fee ({((withdrawalInfo?.withdrawalFeePercentage || 0.02) * 100).toFixed(0)}%):</span>
                            <span>-${calculateFee(parseFloat(watchAmount)).toFixed(2)}</span>
                          </div>
                          <div className="border-t border-blue-300 pt-1 flex justify-between font-medium">
                            <span>You will receive:</span>
                            <span>${netAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  loading={submitting}
                  disabled={!watchAmount || parseFloat(watchAmount) < withdrawalInfo.minimumWithdrawal}
                >
                  Submit Withdrawal Request
                </Button>
              </form>
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Balance */}
          <Card>
            <Card.Header>
              <Card.Title>Account Balance</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  ${withdrawalInfo.availableBalance.toFixed(2)}
                </div>
                <p className="text-gray-600 text-sm">Available for withdrawal</p>
              </div>
            </Card.Content>
          </Card>

          {/* Processing Info */}
          <Card>
            <Card.Header>
              <Card.Title>Processing Information</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Processing time: {withdrawalInfo.processingTime}</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Minimum withdrawal: ${withdrawalInfo.minimumWithdrawal.toFixed(2)}</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>2% processing fee applies</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Secure payment processing</span>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Important Notes */}
          <Card>
            <Card.Header>
              <Card.Title className="text-orange-600">Important Notes</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Withdrawal requests are reviewed within 24 hours</span>
                </div>
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Ensure your payment details are correct</span>
                </div>
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>You can cancel pending requests</span>
                </div>
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Processing fees are non-refundable</span>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RequestWithdrawal;
