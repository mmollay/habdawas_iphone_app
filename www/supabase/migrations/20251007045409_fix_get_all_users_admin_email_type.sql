/*
  # Fix get_all_users_admin Function - Email Type Mismatch
  
  1. Changes
    - Cast email to text to match function return type
    - Ensure all types match exactly
*/

CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  created_at timestamptz,
  is_suspended boolean,
  suspended_at timestamptz,
  suspended_reason text,
  is_admin boolean,
  token_balance integer,
  item_count bigint,
  message_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    au.email::text,
    p.full_name,
    p.phone,
    p.created_at,
    p.is_suspended,
    p.suspended_at,
    p.suspended_reason,
    p.is_admin,
    COALESCE(MAX(ut.balance), 0)::integer as token_balance,
    COUNT(DISTINCT i.id) as item_count,
    COUNT(DISTINCT m.id) as message_count
  FROM profiles p
  JOIN auth.users au ON au.id = p.id
  LEFT JOIN user_tokens ut ON ut.user_id = p.id
  LEFT JOIN items i ON i.user_id = p.id
  LEFT JOIN messages m ON m.sender_id = p.id
  GROUP BY p.id, au.email, p.full_name, p.phone, p.created_at, p.is_suspended, 
           p.suspended_at, p.suspended_reason, p.is_admin
  ORDER BY p.created_at DESC;
END;
$$;
