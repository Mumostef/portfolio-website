#!/bin/bash

echo "🚀 Setting up Survey Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing server dependencies..."
cd server && npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install server dependencies"
    exit 1
fi

echo "📦 Installing client dependencies..."
cd ../client && npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies"
    exit 1
fi

cd ..

echo "✅ Dependencies installed successfully"

# Create environment files if they don't exist
if [ ! -f "server/.env" ]; then
    echo "📝 Creating server environment file..."
    cp server/.env.example server/.env
    echo "⚠️  Please edit server/.env with your configuration"
fi

if [ ! -f "client/.env" ]; then
    echo "📝 Creating client environment file..."
    cp client/.env.example client/.env
    echo "⚠️  Please edit client/.env with your configuration"
fi

# Create database (optional)
read -p "🗄️  Do you want to create the PostgreSQL database 'survey_platform'? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    createdb survey_platform 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Database 'survey_platform' created successfully"
    else
        echo "⚠️  Database might already exist or you don't have permissions"
    fi
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your environment variables in server/.env and client/.env"
echo "2. Set up your PayPal, Stripe, and reCAPTCHA accounts"
echo "3. Update the database connection string in server/.env"
echo "4. Run 'npm run dev' to start both frontend and backend"
echo ""
echo "📖 See README.md for detailed configuration instructions"
