# Rentohub

Rentohub is a modern rental platform built with Next.js, TypeScript, and Prisma. It provides a robust solution for managing listings, bookings, user authentication, payments, delivery tracking, and more.

## Features
- User authentication and registration
- Admin dashboard for managing users, listings, KYC, disputes, and bookings
- Partner and delivery partner portals
- Stripe payment integration
- Image upload and cropping
- Delivery and live map tracking
- Review and rating system
- Automated notifications and support

## Tech Stack
- Next.js (App Router)
- React
- TypeScript
- Prisma ORM
- PostgreSQL (recommended)
- Tailwind CSS
- Stripe API
- Docker (optional for deployment)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- PostgreSQL database

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/anirban-369/Rentohub.git
   cd Rentohub
   ```
2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```
3. Copy and configure your environment variables:
   ```sh
   cp .env.example .env
   # Edit .env with your database and API keys
   ```
4. Run database migrations:
   ```sh
   npx prisma migrate dev
   ```
5. Start the development server:
   ```sh
   npm run dev
   # or
   yarn dev
   ```

### Scripts
- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npx prisma studio` — Open Prisma Studio (DB GUI)

### Deployment
You can deploy using Docker, Vercel, or your preferred cloud provider. See the `Dockerfile` and deployment scripts for guidance.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
