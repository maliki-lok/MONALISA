import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AuthContextType, AuthUser, Employee } from '@/types/auth';
import type { Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (userId: string) => {
    try {
      // Get user record with employee data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          employee_id,
          employees (
            id,
            nip,
            nama,
            jabatan,
            unit_kerja,
            email,
            foto_url,
            created_at,
            updated_at
          )
        `)
        .eq('id', userId)
        .maybeSingle();

      if (userError || !userData) {
        console.error('User not found in users table:', userError);
        return null;
      }

      // Get user roles
      const { data: rolesData } = await supabase
        .rpc('get_user_roles', { _user_id: userId });

      // Get user permissions
      const { data: permissionsData } = await supabase
        .rpc('get_user_permissions', { _user_id: userId });

      const employee = userData.employees as unknown as Employee;
      
      return {
        id: userId,
        employee,
        roles: rolesData?.map((r: { role_code: string }) => r.role_code) || [],
        permissions: permissionsData?.map((p: { permission_code: string }) => p.permission_code) || [],
      };
    } catch (error) {
      console.error('Error loading user data:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(async () => {
            const userData = await loadUserData(session.user.id);
            setUser(userData);
            setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user.id).then((userData) => {
          setUser(userData);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const signIn = async (nip: string, password: string): Promise<{ error: string | null }> => {
    try {
      // First, get employee by NIP to find the email
      const { data: employeeData, error: employeeError } = await supabase
        .rpc('get_employee_by_nip', { _nip: nip });

      if (employeeError || !employeeData || employeeData.length === 0) {
        return { error: 'NIP tidak ditemukan' };
      }

      const employee = employeeData[0];
      
      if (!employee.email) {
        return { error: 'Employee tidak memiliki email untuk login' };
      }

      // Sign in with email
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: employee.email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          return { error: 'NIP atau password salah' };
        }
        return { error: signInError.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Terjadi kesalahan saat login' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const hasPermission = useCallback((permission: string): boolean => {
    return user?.permissions.includes(permission) || false;
  }, [user]);

  const hasRole = useCallback((role: string): boolean => {
    return user?.roles.includes(role) || false;
  }, [user]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(p => user?.permissions.includes(p));
  }, [user]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(r => user?.roles.includes(r));
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        hasPermission,
        hasRole,
        hasAnyPermission,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
