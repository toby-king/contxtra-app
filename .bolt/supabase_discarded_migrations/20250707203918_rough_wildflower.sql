/*
  # Fix admin status for existing users

  1. Changes
    - Add a function to manually set admin status for specific users
    - This allows you to grant admin access to your account

  2. Security
    - Function is security definer to allow admin privilege updates
    - Only updates the is_admin field for specified users
*/

-- Create a function to set admin status for a user by email
CREATE OR REPLACE FUNCTION public.set_admin_status(user_email text, admin_status boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET is_admin = admin_status,
      updated_at = now()
  WHERE email = user_email;
  
  -- If no rows were affected, the user doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  RAISE NOTICE 'Admin status for % set to %', user_email, admin_status;
END;
$$;

-- Example usage (uncomment and replace with your email to grant admin access):
-- SELECT set_admin_status('your-email@example.com', true);