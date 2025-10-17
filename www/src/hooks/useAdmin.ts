import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export interface SystemSettings {
  id: string;
  token_system_mode: 'enabled' | 'donation_only' | 'disabled';
  default_token_package: number;
  token_price_per_100: number;
  platform_message: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  created_at: string;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  category: string;
  created_at: string;
}

export interface UserRole {
  role_id: string;
  role_name: string;
  display_name: string;
  description: string | null;
  assigned_at: string;
  assigned_by: string | null;
}

export interface RoleWithStats {
  role_id: string;
  role_name: string;
  display_name: string;
  description: string | null;
  permission_count: number;
  user_count: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  is_admin: boolean;
  token_balance: number;
  item_count: number;
  message_count: number;
  roles?: UserRole[];
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check if user is Super Admin (is_admin flag)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.is_admin === true) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Check if user has Administrator role
      const { data: roles } = await supabase.rpc('get_user_roles', { check_user_id: user.id });
      const hasAdminRole = roles?.some((role: UserRole) => role.role_name === 'admin');

      setIsAdmin(hasAdminRole || false);
      setLoading(false);
    };

    checkAdmin();
  }, [user]);

  const getSystemSettings = async (): Promise<SystemSettings | null> => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  const updateSystemSettings = async (settings: Partial<SystemSettings>): Promise<void> => {
    const { data: current } = await supabase
      .from('system_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!current) throw new Error('System settings not found');

    const { error } = await supabase
      .from('system_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq('id', current.id);

    if (error) throw error;
  };

  const getAllUsers = async (): Promise<AdminUser[]> => {
    const { data, error } = await supabase.rpc('get_all_users_admin');
    if (error) throw error;
    return data || [];
  };

  const suspendUser = async (userId: string, reason: string): Promise<void> => {
    const { error } = await supabase.rpc('suspend_user_admin', {
      target_user_id: userId,
      reason,
    });
    if (error) throw error;
  };

  const unsuspendUser = async (userId: string): Promise<void> => {
    const { error } = await supabase.rpc('unsuspend_user_admin', {
      target_user_id: userId,
    });
    if (error) throw error;
  };

  const deleteUser = async (userId: string): Promise<void> => {
    const { error } = await supabase.rpc('delete_user_admin', {
      target_user_id: userId,
    });
    if (error) throw error;
  };

  const updateUserTokens = async (userId: string, tokenBalance: number): Promise<void> => {
    const { error } = await supabase
      .from('user_tokens')
      .update({ balance: tokenBalance })
      .eq('user_id', userId);

    if (error) throw error;
  };

  const getAllRoles = async (): Promise<RoleWithStats[]> => {
    const { data, error } = await supabase.rpc('get_all_roles_with_permissions');
    if (error) throw error;
    return data || [];
  };

  const getUserRoles = async (userId: string): Promise<UserRole[]> => {
    const { data, error } = await supabase.rpc('get_user_roles', { check_user_id: userId });
    if (error) throw error;
    return data || [];
  };

  const assignRole = async (userId: string, roleId: string): Promise<void> => {
    const { error } = await supabase.rpc('assign_role_to_user', {
      target_user_id: userId,
      target_role_id: roleId,
    });
    if (error) throw error;
  };

  const removeRole = async (userId: string, roleId: string): Promise<void> => {
    const { error } = await supabase.rpc('remove_role_from_user', {
      target_user_id: userId,
      target_role_id: roleId,
    });
    if (error) throw error;
  };

  const getUserPermissions = async (userId: string): Promise<Permission[]> => {
    const { data, error } = await supabase.rpc('get_user_permissions', { check_user_id: userId });
    if (error) throw error;
    return data || [];
  };

  const hasPermission = async (permissionName: string): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase.rpc('user_has_permission', {
      check_user_id: user.id,
      permission_name: permissionName,
    });
    if (error) return false;
    return data || false;
  };

  return {
    isAdmin,
    loading,
    getSystemSettings,
    updateSystemSettings,
    getAllUsers,
    suspendUser,
    unsuspendUser,
    deleteUser,
    updateUserTokens,
    getAllRoles,
    getUserRoles,
    assignRole,
    removeRole,
    getUserPermissions,
    hasPermission,
  };
};
