# TL Inventory App

A comprehensive inventory management system built with Next.js and Supabase, designed specifically for managing electronic device inventory, sales, and business operations.

## 🚀 Features

### Core Functionality

- **Product Management**: Create and manage product catalogs with detailed specifications
- **Inventory Tracking**: Track individual devices by IMEI with batch management
- **Sales Management**: Complete sales workflow with multiple payment methods
- **User Management**: Role-based access control with different permission levels
- **Audit System**: Comprehensive logging of all system activities
- **Delivery Tracking**: Manage product deliveries and status updates
- **Analytics Dashboard**: Business insights and profit tracking

### Key Modules

- **Dashboard**: Overview of business metrics and quick actions
- **Products**: Master product catalog management
- **Inventory**: Device and accessory tracking with batch operations
- **Sales**: Complete sales process with reservations and payments
- **Deliveries**: Order fulfillment and delivery management
- **Users**: User account and role management
- **Audit**: System activity logs and security monitoring
- **Profits**: Business analytics and financial reporting

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Recharts** - Data visualization

### Backend & Database

- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database with Row Level Security
- **Supabase Auth** - Authentication system
- **TanStack Query** - Server state management

### Development Tools

- **ESLint** - Code linting
- **Turbopack** - Fast bundler
- **pnpm** - Package manager

## 🏗️ Project Structure

```
tl-inventory-app/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Protected dashboard pages
│   └── login/             # Authentication pages
├── components/            # React components
│   ├── features/          # Feature-specific components
│   ├── providers/         # Context providers
│   └── shared/            # Reusable components
├── lib/                   # Core business logic
│   ├── api/              # API client functions
│   ├── auth/             # Authentication utilities
│   ├── database/         # Database operations
│   ├── hooks/            # Custom React hooks
│   ├── schemas/          # Zod validation schemas
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── ui/                   # UI component library
├── supabase/            # Database schema and migrations
└── utils/               # Supabase client configurations
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd tl-inventory-app
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_SECRET_KEY=your-service-role-key
   ```

4. **Set up the database**

   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Configure authentication settings

5. **Start the development server**

   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 👥 User Roles

The application supports multiple user roles with different permission levels:

- **Super Admin**: Full system access (logs filtered from audit)
- **Admin**: Complete management capabilities
- **Seller**: Sales and delivery management
- **Inventory**: Product and inventory management
- **Viewer**: Read-only access

## 📊 Database Schema

### Core Tables

- **profiles**: User accounts and roles
- **products**: Master product catalog
- **product_items**: Individual inventory items with IMEI tracking
- **accessory_items**: Accessory inventory
- **batchs**: Inventory batch management
- **sales**: Sales transactions
- **deliveries**: Delivery tracking
- **audit_logs**: System activity logging

### Key Features

- **Row Level Security (RLS)**: Data protection at the database level
- **Audit System**: Comprehensive activity logging
- **IMEI Tracking**: Individual device tracking
- **Batch Management**: Group inventory operations
- **Multi-currency Support**: USD and ARS currencies
- **Payment Methods**: Cash, transfer, and crypto payments

## 🔧 Development

### Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Consistent component structure
- Custom hooks for business logic

## 🚀 Deployment

The application is optimized for deployment on Vercel:

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

For other platforms, ensure:

- Environment variables are properly configured
- Supabase project is accessible
- Database migrations are applied

## 📝 API Documentation

### Authentication

- JWT-based authentication via Supabase
- Role-based access control
- Session management

### Key Endpoints

- `/api/auth/*` - Authentication operations
- `/api/products` - Product management
- `/api/inventory` - Inventory operations
- `/api/sales` - Sales management
- `/api/deliveries` - Delivery tracking
- `/api/stats` - Analytics data

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **Audit Logging**: Complete activity tracking
- **Role-based Permissions**: Granular access control
- **Input Validation**: Zod schema validation
- **CSRF Protection**: Built-in Next.js security

## 📈 Business Features

- **Inventory Tracking**: Real-time stock management
- **Sales Analytics**: Profit tracking and reporting
- **Batch Operations**: Efficient bulk inventory management
- **Delivery Management**: Order fulfillment tracking
- **Multi-currency Support**: International business operations
- **Audit Trail**: Complete business activity history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For support and questions, please contact the development team.

---

Built with ❤️ using Next.js and Supabase
