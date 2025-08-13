# Survey Platform - Earn Money by Completing Surveys

A comprehensive web application where users can earn money by answering surveys, similar to Swagbucks, PrizeRebel, or Survey Junkie.

## Features

### User Features
- **Secure Registration & Login** with email verification
- **User Dashboard** showing earnings, completed surveys, and withdrawal requests
- **Survey Completion** with dynamic question loading
- **Earnings Tracking** with automatic crediting
- **Withdrawal System** via PayPal or Credit Card (minimum $5)
- **Responsive Design** works on all devices

### Admin Features
- **Survey Management** - Add, edit, remove surveys
- **User Management** - View all users and their earnings
- **Withdrawal Management** - Approve/reject withdrawal requests
- **Analytics Dashboard** - Track platform performance

### Security Features
- **Email Verification** for new accounts
- **CAPTCHA Protection** on signup and login
- **IP Address Tracking** to detect fraud
- **Encrypted Password Storage** using bcrypt
- **JWT Authentication** for secure sessions
- **Rate Limiting** to prevent abuse

### Payment Integration
- **PayPal API** for PayPal withdrawals
- **Stripe API** for credit card payouts
- **Minimum Withdrawal** limits
- **Admin Approval** system for all withdrawals

## Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** for authentication
- **bcrypt** for password encryption
- **Nodemailer** for email verification
- **PayPal SDK** and **Stripe SDK** for payments

### Frontend
- **React** with modern hooks
- **TailwindCSS** for styling
- **Axios** for API calls
- **React Router** for navigation
- **React Hook Form** for form handling

## Installation Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- PayPal Developer Account
- Stripe Account
- Email service (Gmail/SendGrid)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd survey-platform
```

### 2. Install Dependencies
```bash
npm run install-all
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb survey_platform

# The application will automatically create tables on first run
```

### 4. Environment Configuration

Create `server/.env` file:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/survey_platform

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# PayPal Configuration
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox  # or 'live' for production

# Stripe Configuration
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# reCAPTCHA
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key

# Application
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Create `client/.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### 5. Start the Application
```bash
# Development mode (both frontend and backend)
npm run dev

# Production mode
npm run build
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### User Endpoints
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/earnings` - Get user earnings
- `GET /api/user/surveys` - Get completed surveys

### Survey Endpoints
- `GET /api/surveys` - Get available surveys
- `GET /api/surveys/:id` - Get survey details
- `POST /api/surveys/:id/start` - Start a survey
- `POST /api/surveys/:id/submit` - Submit survey answers

### Withdrawal Endpoints
- `POST /api/withdrawals` - Request withdrawal
- `GET /api/withdrawals` - Get user's withdrawal history

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `GET /api/admin/surveys` - Get all surveys
- `POST /api/admin/surveys` - Create new survey
- `PUT /api/admin/surveys/:id` - Update survey
- `DELETE /api/admin/surveys/:id` - Delete survey
- `GET /api/admin/withdrawals` - Get all withdrawal requests
- `PUT /api/admin/withdrawals/:id` - Approve/reject withdrawal

## Admin Access

To create an admin account:
1. Register a normal user account
2. In the database, update the user's `role` field to 'admin'
3. Login with the account to access admin features

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Rate limiting prevents brute force attacks
- CAPTCHA prevents automated registrations
- IP tracking helps detect fraudulent activity
- Email verification ensures valid accounts

## Payment Processing

### PayPal Integration
- Uses PayPal REST API for payouts
- Supports both sandbox and live environments
- Automatic payout processing for approved withdrawals

### Stripe Integration
- Framework ready for Stripe Connect credit card payouts
- Supports major credit cards (Visa, MasterCard)
- **Note**: Stripe payouts require additional setup of connected accounts
- Currently configured to collect card details but requires implementation of Stripe Connect onboarding

## Customization

### Adding New Survey Providers
1. Create a new service in `server/services/surveyProviders/`
2. Implement the provider interface
3. Add configuration in environment variables
4. Update the survey fetching logic

### Modifying Withdrawal Limits
Update the `MINIMUM_WITHDRAWAL` constant in `server/config/constants.js`

### Changing Email Templates
Edit templates in `server/templates/email/`

## Support

For technical support or questions about the platform, please create an issue in the repository or contact the development team.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
