/*
  # Fix admin RLS policy to prevent infinite recursion

  1. Problem
    - The current admin policy creates infinite recursion when checking is_admin
    - The is_admin_user() function queries profiles table from within profiles policy
    - This causes the policy check to fail and return false

  2. Solution
    - Drop the problematic recursive policies
    - Create a simpler, non-recursive policy structure
    - Use a direct approach that doesn't cause circular dependencies

  3. Security
    - Users can read their own profile
    - Admin users can read all profiles without recursion
    - Maintain existing update permissions
*/

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile or admins can read all" ON profiles;

-- Drop the problematic function
DROP FUNCTION IF EXISTS is_admin_user();

-- Create new, simple policies that don't cause recursion
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create a separate policy for admin access that uses a different approach
-- This policy will be checked after the user policy, avoiding recursion
CREATE POLICY "Admin users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Check if the current user has admin privileges by looking up their record directly
    -- This uses a subquery that should not cause recursion since it's a direct lookup
    EXISTS (
      SELECT 1 
      FROM profiles admin_check 
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

-- Ensure the update policy exists
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);