import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Shield, Key } from 'lucide-react';
import type { Role, Permission } from '@/types/auth';

interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export function RoleManagement() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      // Get all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (rolesError) throw rolesError;

      // Get all permissions
      const { data: permissionsData, error: permError } = await supabase
        .from('permissions')
        .select('*');

      if (permError) throw permError;

      // Get role_permissions
      const { data: rolePermissionsData, error: rpError } = await supabase
        .from('role_permissions')
        .select('*');

      if (rpError) throw rpError;

      // Map permissions to roles
      const rolesWithPermissions: RoleWithPermissions[] = (rolesData || []).map(role => {
        const rolePermIds = (rolePermissionsData || [])
          .filter(rp => rp.role_id === role.id)
          .map(rp => rp.permission_id);

        const permissions = (permissionsData || []).filter(p => rolePermIds.includes(p.id));

        return { ...role, permissions };
      });

      setRoles(rolesWithPermissions);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Gagal memuat data roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Manajemen Roles
          </CardTitle>
          <CardDescription>
            Lihat daftar role dan permission yang dimiliki
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {roles.map((role) => (
              <div key={role.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{role.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Code: <code className="bg-muted px-1 rounded">{role.code}</code>
                    </p>
                  </div>
                </div>
                
                {role.description && (
                  <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Permissions ({role.permissions.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map(permission => (
                      <Badge key={permission.id} variant="secondary" className="text-xs">
                        {permission.code}
                      </Badge>
                    ))}
                    {role.permissions.length === 0 && (
                      <span className="text-sm text-muted-foreground">Tidak ada permission</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
