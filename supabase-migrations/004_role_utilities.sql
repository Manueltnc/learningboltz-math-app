-- =====================================================
-- Role Management Utilities for auth.users metadata
-- =====================================================

-- Function to set user role in auth metadata
CREATE OR REPLACE FUNCTION set_user_role(user_email TEXT, role_name TEXT)
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get user by email
  SELECT id, raw_user_meta_data INTO user_record 
  FROM auth.users 
  WHERE email = user_email;
  
  IF user_record.id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update user metadata with new role
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', role_name)
  WHERE id = user_record.id;
  
  RAISE NOTICE 'Role % assigned to user %', role_name, user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to make current user super admin
CREATE OR REPLACE FUNCTION make_current_user_super_admin()
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'super_admin')
  WHERE id = auth.uid();
  
  RAISE NOTICE 'Current user made super admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list all users with their roles
CREATE OR REPLACE FUNCTION list_users_with_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'role', 'student') as role,
    au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION set_user_role(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION make_current_user_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION list_users_with_roles() TO authenticated;
