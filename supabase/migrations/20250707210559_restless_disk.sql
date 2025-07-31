/*
  # Complete database setup with conflict handling

  1. New Tables
    - `profiles` - User profiles with metrics and admin status
    - `trial_usage` - Anonymous trial usage tracking

  2. Security
    - Enable RLS on both tables
    - Policies for profile access and trial tracking
    - Secure functions for data manipulation

  3. Functions
    - User creation trigger with MailerLite integration
    - Metric increment functions
    - Trial usage tracking functions
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  date_of_birth date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  links_analyzed integer DEFAULT 0,
  visit_count integer DEFAULT 0,
  positive_ratings integer DEFAULT 0,
  negative_ratings integer DEFAULT 0,
  is_admin boolean DEFAULT false
);

-- Create trial usage table
CREATE TABLE IF NOT EXISTS trial_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text UNIQUE NOT NULL,
  usage_count integer DEFAULT 1,
  first_used_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now()
);

-- Enable RLS (safe to run multiple times)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DO $$ 
BEGIN
  -- Drop profiles policies
  DROP POLICY IF EXISTS "All users can read profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can read own profile or admins can read all" ON profiles;
  DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
  DROP POLICY IF EXISTS "Admin users can read all profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  
  -- Drop trial usage policies
  DROP POLICY IF EXISTS "Allow anonymous trial tracking" ON trial_usage;
END $$;

-- Create profiles policies
CREATE POLICY "All users can read profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    -- Prevent non-admin users from changing is_admin
    (
      is_admin = (SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()) OR
      (SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()) = true
    )
  );

-- Create trial usage policies
CREATE POLICY "Allow anonymous trial tracking"
  ON trial_usage
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  mailerlite_response json;
BEGIN
  -- Create the user profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    links_analyzed,
    visit_count,
    positive_ratings,
    negative_ratings,
    is_admin
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    0,
    0,
    0,
    0,
    false
  );

  -- Call MailerLite Edge Function to add user to mailing list
  BEGIN
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/add-to-mailerlite',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'email', new.email,
        'full_name', COALESCE(new.raw_user_meta_data->>'full_name', '')
      )
    ) INTO mailerlite_response;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to add user to MailerLite: %', SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create increment functions
CREATE OR REPLACE FUNCTION public.increment_visit_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    visit_count = visit_count + 1,
    updated_at = now()
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for ID: %', user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_links_analyzed(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    links_analyzed = links_analyzed + 1,
    updated_at = now()
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for ID: %', user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_positive_rating(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    positive_ratings = positive_ratings + 1,
    updated_at = now()
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for ID: %', user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_negative_rating(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    negative_ratings = negative_ratings + 1,
    updated_at = now()
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for ID: %', user_id;
  END IF;
END;
$$;

-- Create trial usage functions
CREATE OR REPLACE FUNCTION public.check_trial_usage(client_ip text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  hashed_ip text;
  usage_record record;
  max_trial_uses constant int := 3;
  trial_period_days constant int := 7;
BEGIN
  -- Hash the IP address
  hashed_ip := encode(digest(client_ip, 'sha256'), 'hex');
  
  -- Get or create usage record without incrementing
  INSERT INTO trial_usage (ip_hash, usage_count, first_used_at, last_used_at)
  VALUES (hashed_ip, 0, now(), now())
  ON CONFLICT (ip_hash) 
  DO UPDATE SET 
    last_used_at = now()
  RETURNING * INTO usage_record;

  -- Check if trial has expired
  RETURN json_build_object(
    'remaining_uses', greatest(0, max_trial_uses - usage_record.usage_count),
    'trial_expired', 
    (usage_record.usage_count >= max_trial_uses) OR 
    (usage_record.first_used_at < now() - interval '1 day' * trial_period_days)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.track_analyzer_usage(client_ip text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  hashed_ip text;
  usage_record record;
  max_trial_uses constant int := 3;
  trial_period_days constant int := 7;
BEGIN
  -- Hash the IP address
  hashed_ip := encode(digest(client_ip, 'sha256'), 'hex');
  
  -- Update usage count
  UPDATE trial_usage 
  SET usage_count = usage_count + 1
  WHERE ip_hash = hashed_ip
  RETURNING * INTO usage_record;

  -- Return updated status
  RETURN json_build_object(
    'remaining_uses', greatest(0, max_trial_uses - usage_record.usage_count),
    'trial_expired', 
    (usage_record.usage_count >= max_trial_uses) OR 
    (usage_record.first_used_at < now() - interval '1 day' * trial_period_days)
  );
END;
$$;

-- Drop the problematic function if it exists
DROP FUNCTION IF EXISTS is_admin_user();