#!/bin/bash
set -e

echo "🚀 RentoHub EC2 Setup Script"
echo "=============================="

cd ~/rentohub

# Create .env file
echo "📝 Creating .env file..."
cat > .env << 'ENVEOF'
NODE_ENV=production
DATABASE_URL=postgresql://rentohub_user:RentoHub@App#2025!@database-3.chokoc6iwcww.eu-north-1.rds.amazonaws.com:5432/rentohub?sslmode=require
NEXTAUTH_SECRET=RentoHubSecureKey2025ChangeMeLater
NEXTAUTH_URL=https://rentohub.anir.co.in
NEXT_PUBLIC_APP_URL=https://rentohub.anir.co.in
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ENVEOF

echo "✅ .env file created"
cat .env

# Run Prisma migrations
echo ""
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Build the application
echo ""
echo "🏗️  Building Next.js application..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the app: npm start"
echo "2. Or use PM2: pm2 start npm --name rentohub -- start"
