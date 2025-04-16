# Transport Company Computerization (TCC)

A comprehensive system for managing transport company operations.

## Features

- **Consignment Management**: Record details, calculate charges, generate bills
- **Truck Allocation**: Automatic allocation when volume reaches 500 cubic meters
- **Reporting and Analytics**: Track truck usage, consignment status, revenue
- **Role-Based Access**: Admin, Manager, and Staff permissions
- **Office Management**: Head office and multiple branch offices

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS 3
- **Database**: MongoDB
- **Authentication**: NextAuth.js with role-based access

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd transport
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```
# MongoDB
MONGODB_URI=mongodb://localhost:27017/transport-company

# Next Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-next-auth-secret-key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- **`/src/app`**: Contains all pages and API routes
- **`/src/components`**: Reusable UI components
- **`/src/lib`**: Utility functions and services
- **`/src/models`**: MongoDB schema definitions

## Role-Based Access

- **Admin**: Full access to all features
- **Manager**: Access to reporting, truck management, and consignment tracking
- **Staff**: Basic operations like consignment entry and status checking

## Deployment

The application can be deployed to any platform that supports Next.js, such as Vercel or Netlify.

```bash
npm run build
npm start
```
