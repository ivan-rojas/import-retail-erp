# Supabase Setup Instructions for TL iPhones Inventory App

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Create a new project
4. Wait for the project to be set up

## 2. Get Your Project Credentials

1. Go to Project Settings > API
2. Copy the following values:
   - `Project URL`
   - `anon/public key`
   - `service_role key` (for admin operations)

## 3. Update Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
# SAFE to be public (these are designed to be exposed to the browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here

# CRITICAL: Keep this PRIVATE (no NEXT_PUBLIC_ prefix)
# This has admin privileges and should NEVER be exposed to the browser
SUPABASE_SECRET_KEY=your-service-role-key-here
```

**🚨 SECURITY WARNING:**

- **NEVER** add `NEXT_PUBLIC_` prefix to `SUPABASE_SECRET_KEY`
- The service role key has admin privileges and must stay server-side only
- Only the URL and anon key should be public

## 4. Set Up the Database Schema

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Copy the entire content from `supabase/schema.sql` file
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

This will create:

- User profiles table with roles (admin, seller, viewer)
- Product definitions table
- Inventory items table
- Device IMEIs table for tracking individual devices
- Sales table
- All necessary indexes, triggers, and RLS policies

## 5. Enable Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Configure the following settings:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add your production domain when deploying
   - Enable email confirmations if desired

## 6. Set Up Row Level Security (RLS)

The schema automatically sets up RLS policies that:

- Allow all authenticated users to view data
- Restrict create/update/delete operations to admin and seller roles
- Protect user profiles (users can only see their own)

## 7. Create Your First Admin User

1. Run the app: `pnpm dev`
2. Go to `http://localhost:3000`
3. Click "Crear Cuenta" (Create Account)
4. Register with your admin email
5. Check your email and confirm your account
6. Go to Supabase Dashboard > Authentication > Users
7. Find your user and click on it
8. Go to the "Raw User Meta Data" section
9. In the SQL Editor, run:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

## 8. Database Structure Overview

### Tables:

- **profiles**: User information and roles
- **products**: Master product catalog (iPhone models, AirPods, etc.)
- **inventory_items**: Actual inventory with quantities and prices
- **device_imeis**: Individual device tracking by IMEI
- **sales**: Sales and reservations records

### User Roles:

- **admin**: Full access to everything
- **seller**: Can manage inventory and sales
- **viewer**: Read-only access

## 9. Test the Application

1. Start the development server: `pnpm dev`
2. Log in with your admin account
3. Test creating product definitions
4. Test adding inventory items
5. Test recording sales

## 10. Production Deployment

When deploying to production:

1. Update your environment variables with production values
2. Update the Site URL in Supabase Authentication settings
3. Add your production domain to Redirect URLs

## 11. Branding (Client Name & Logo)

The app can load a dynamic **client name** and **logo** from the `configuration` table.

### Storage bucket

Create a public bucket in Supabase Storage:

- **Bucket**: `client-assets`
- **Public**: enabled (public read)
- **Object path used by the app**: `client-assets/logo.webp` (the app overwrites this single file when you upload a new logo)

### Recommended policy (public read)

In Storage policies, allow anyone to read objects in the public bucket (Supabase UI provides a toggle when creating a public bucket). The upload/update is performed server-side using the service role key, so you don't need public write.

### DB catch-up (if your DB already exists)

If your database was created before branding keys existed, run:

- `supabase/add_client_branding_config.sql`
4. Consider enabling additional security features in Supabase

## Troubleshooting

### Common Issues:

1. **Authentication not working**: Check that your environment variables are correct
2. **Database errors**: Ensure the schema was executed successfully
3. **Permission errors**: Verify RLS policies and user roles
4. **CORS errors**: Check your Site URL and Redirect URLs in Supabase

### Useful SQL Queries:

```sql
-- Check user roles
SELECT email, role FROM profiles;

-- View all inventory
SELECT * FROM inventory_items;

-- Check device IMEIs
SELECT * FROM device_imeis;

-- View sales
SELECT * FROM sales;
```

## Next Steps

Once the basic setup is complete, you can:

1. Customize the product categories and types
2. Add more user roles if needed
3. Implement additional features like reports and analytics
4. Set up automated backups
5. Configure email templates for authentication
