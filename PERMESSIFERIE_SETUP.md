# PermessiFerie Database Setup

This document explains how to set up the `permessiferie` table in your Supabase database.

## Database Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `utils/supabase/db/create_permessiferie_table.sql`
4. Execute the SQL script

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to your project directory
cd your-project-directory

# Run the migration
supabase db push
```

## Table Structure

The `permessiferie` table includes:

- **id**: UUID primary key (auto-generated)
- **salon_id**: Foreign key to salons table
- **member_id**: Foreign key to team table
- **type**: Permission type ('ferie', 'permesso', 'malattia', 'altro')
- **start_date**: Start date of permission
- **end_date**: End date of permission
- **start_time**: Start time (optional, for partial day permissions)
- **end_time**: End time (optional, for partial day permissions)
- **status**: Permission status ('pending', 'approved', 'rejected')
- **reason**: Reason for permission request
- **notes**: Additional notes (optional)
- **approved_by**: User ID who approved the permission
- **approved_at**: Timestamp when permission was approved
- **rejection_reason**: Reason for rejection (if applicable)
- **created_at**: Timestamp when record was created
- **updated_at**: Timestamp when record was last updated

## Features Included

1. **Row Level Security (RLS)**: Users can only access permissions for their salon
2. **Foreign Key Constraints**: Proper relationships with salons, team, and users tables
3. **Check Constraints**: Validates status and type values
4. **Indexes**: Optimized for common queries
5. **Auto-update Trigger**: Automatically updates the `updated_at` timestamp

## RLS Policies

The table includes RLS policies that ensure:
- Users can only view permissions for their salon
- Users can only insert permissions for their salon
- Users can only update permissions for their salon
- Users can only delete permissions for their salon

## Usage

After setting up the table, the PermessiFerie page will automatically:
- Connect to the database
- Create, read, update, and delete permissions
- Filter permissions by salon
- Handle approval/rejection workflows

## Troubleshooting

If you encounter issues:

1. **Table not found error**: Make sure the migration has been executed
2. **Permission denied**: Check that RLS policies are correctly set up
3. **Foreign key errors**: Ensure the referenced tables (salons, team) exist
4. **Type errors**: Verify that the TypeScript types match the database schema

## Testing

To test the setup:

1. Create a new permission through the UI
2. Check that it appears in the database
3. Try approving/rejecting permissions
4. Verify that filters work correctly
5. Test the calendar view

## Notes

- The table uses UUIDs for all ID fields
- Timestamps are in UTC
- The `approved_by` field references the `auth.users` table
- The table includes proper indexing for performance 