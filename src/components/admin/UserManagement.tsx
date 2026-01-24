import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, Plus, Shield, X, Key, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import type { Employee, Role } from '@/types/auth';

// Interface Data
interface UserWithDetails {
  id: string;
  employee_id: string;
  created_at: string;
  employee: Employee;
  roles: Role[];
}

export function UserManagement() {
  // --- STATE MANAGEMENT ---
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Create User
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [employeesWithoutUser, setEmployeesWithoutUser] = useState<Employee[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // State Change Password
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState<UserWithDetails | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // --- DATA FETCHING (Optimized) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Menggunakan Promise.all untuk mengambil semua data secara paralel (Fix N+1 Problem)
      const [usersResponse, rolesResponse, employeesResponse] = await Promise.all([
        supabase
          .from('users')
          .select(`
            id,
            employee_id,
            created_at,
            employees (*),
            user_roles (
              roles (
                id,
                name,
                code
              )
            )
          `)
          .order('created_at', { ascending: false }),
        
        supabase.from('roles').select('*').order('name'),
        supabase.from('employees').select('*').order('nama')
      ]);

      if (usersResponse.error) throw usersResponse.error;
      if (rolesResponse.error) throw rolesResponse.error;
      if (employeesResponse.error) throw employeesResponse.error;

      // Set Master Data
      setAllRoles(rolesResponse.data || []);

      // Mapping & Flattening Data User
      const rawUsers = usersResponse.data || [];
      const formattedUsers: UserWithDetails[] = rawUsers.map((u: any) => ({
        id: u.id,
        employee_id: u.employee_id,
        created_at: u.created_at,
        employee: u.employees as Employee,
        // Flatten user_roles array menjadi roles array yang bersih
        roles: u.user_roles ? u.user_roles.map((ur: any) => ur.roles).filter(Boolean) : []
      }));

      // Filter hanya user yang memiliki data employee valid
      const validUsers = formattedUsers.filter(u => u.employee);
      setUsers(validUsers);

      // Filter Employees yang belum punya akun User
      const userEmployeeIds = new Set(rawUsers.map((u: any) => u.employee_id));
      const availableEmployees = (employeesResponse.data || []).filter(
        emp => !userEmployeeIds.has(emp.id)
      );
      setEmployeesWithoutUser(availableEmployees);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ACTIONS HANDLERS ---

  const handleCreateUser = async () => {
    if (!selectedEmployee || !password) {
      toast.error('Pegawai dan password wajib diisi');
      return;
    }
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setIsCreating(true);
    try {
      const employee = employeesWithoutUser.find(e => e.id === selectedEmployee);
      if (!employee?.email) {
        toast.error('Pegawai ini tidak memiliki email terdaftar');
        return;
      }

      // Pastikan session valid sebelum panggil edge function
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
          toast.error("Sesi habis. Silakan login ulang.");
          return;
      }

      // Panggil Edge Function
      const { error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: employee.email,
          password: password,
          employee_id: selectedEmployee,
          roles: selectedRoles
        }
      });

      if (error) {
        // Parsing error message dari edge function jika ada
        let msg = 'Gagal membuat user';
        try {
            const parsed = JSON.parse(error.message);
            if(parsed?.error) msg = parsed.error;
        } catch(e) { msg = error.message; }
        throw new Error(msg);
      }
      
      toast.success(`User untuk ${employee.nama} berhasil dibuat`);
      setShowCreateDialog(false);
      
      // Reset Form
      setSelectedEmployee('');
      setPassword('');
      setSelectedRoles([]);
      
      fetchData(); // Refresh data

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!userToUpdate || !newPassword) return;
    if (newPassword.length < 6) {
        toast.error('Password minimal 6 karakter');
        return;
    }

    setIsUpdatingPassword(true);
    try {
        const { error } = await supabase.functions.invoke('admin-update-user', {
            body: {
                userId: userToUpdate.id,
                password: newPassword
            }
        });

        if (error) throw error;

        toast.success(`Password berhasil diubah`);
        setShowPasswordDialog(false);
        setNewPassword('');
        setUserToUpdate(null);
    } catch (error: any) {
        console.error('Error updating password:', error);
        toast.error('Gagal mengubah password');
    } finally {
        setIsUpdatingPassword(false);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    // Optimistic UI: Kita bisa update state lokal dulu jika mau, 
    // tapi untuk keamanan kita tunggu response DB di sini.
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) throw error;
      
      toast.success('Role dihapus');
      fetchData(); 
    } catch (error) {
      toast.error('Gagal menghapus role');
    }
  };

  const handleAddRole = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleId });

      if (error) throw error;

      toast.success('Role ditambahkan');
      fetchData();
    } catch (error) {
      toast.error('Gagal menambahkan role');
    }
  };

  // --- FILTERING ---
  const filteredUsers = users.filter(user => 
    user.employee?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employee?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employee?.nip.includes(searchTerm)
  );

  // --- RENDER ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Kelola akses sistem, role, dan keamanan akun pegawai.
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Buat User Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Buat User Baru</DialogTitle>
              <DialogDescription>
                Buat akun login untuk pegawai yang belum terdaftar di sistem.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="employee">Pilih Pegawai</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cari nama pegawai..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employeesWithoutUser.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">Semua pegawai sudah punya akun</div>
                    ) : (
                      employeesWithoutUser.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.nama} <span className="text-muted-foreground text-xs">({emp.jabatan})</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password Awal</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="grid gap-2">
                <Label>Assign Roles</Label>
                <div className="flex flex-wrap gap-2 border p-3 rounded-md bg-muted/20">
                  {allRoles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2 bg-background p-1.5 rounded border">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        className="h-4 w-4 rounded border-gray-300 accent-primary"
                        checked={selectedRoles.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoles([...selectedRoles, role.id]);
                          } else {
                            setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                          }
                        }}
                      />
                      <label htmlFor={`role-${role.id}`} className="text-sm font-medium cursor-pointer select-none">
                        {role.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Batal</Button>
              <Button onClick={handleCreateUser} disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Akun
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-muted/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-medium">Daftar Pengguna Aktif</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIP, atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-background"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Responsive Wrapper */}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[250px]">Identitas Pegawai</TableHead>
                  <TableHead>Email Login</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // UX Improvement: Skeleton Loading Rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-[120px]" />
                            <Skeleton className="h-3 w-[80px]" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                            <Skeleton className="h-5 w-12 rounded-full" />
                            <Skeleton className="h-5 w-12 rounded-full" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-10 rounded" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-8 w-8 opacity-20" />
                        <p>Tidak ada pengguna ditemukan sesuai pencarian.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UserCheck className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-foreground">{user.employee?.nama}</span>
                            <span className="text-xs text-muted-foreground">{user.employee?.nip}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {user.employee?.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {user.roles.map((role) => (
                            <Badge 
                                key={role.id} 
                                variant="secondary" 
                                className="group text-xs font-normal pr-1 pl-2 gap-1 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-default"
                            >
                              {role.name}
                              <button
                                onClick={() => handleRemoveRole(user.id, role.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-destructive/20 transition-opacity"
                                title="Hapus Role"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          
                          {/* Add Role Button */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" className="h-5 w-5 rounded-full border-dashed opacity-70 hover:opacity-100">
                                <Plus className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[400px]">
                              <DialogHeader>
                                <DialogTitle>Tambah Role</DialogTitle>
                                <DialogDescription>
                                  Pilih role tambahan untuk <b>{user.employee?.nama}</b>.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-2 py-2">
                                {allRoles.filter(r => !user.roles.find(ur => ur.id === r.id)).length === 0 ? (
                                    <p className="text-sm text-center text-muted-foreground py-4">User ini sudah memiliki semua role.</p>
                                ) : (
                                    allRoles
                                    .filter(r => !user.roles.find(ur => ur.id === r.id))
                                    .map(role => (
                                        <Button
                                        key={role.id}
                                        variant="ghost"
                                        className="justify-start w-full font-normal"
                                        onClick={() => handleAddRole(user.id, role.id)}
                                        >
                                        <Shield className="mr-2 h-4 w-4 text-primary" />
                                        {role.name}
                                        </Button>
                                    ))
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline" className="text-xs text-green-600 bg-green-50 border-green-200">
                            Aktif
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-primary"
                            onClick={() => {
                                setUserToUpdate(user);
                                setShowPasswordDialog(true);
                            }}
                        >
                            <Key className="h-4 w-4 mr-2" />
                            Reset Password
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Ganti Password */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                    Masukkan password baru untuk user <b>{userToUpdate?.employee?.nama}</b>.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="new-password">Password Baru</Label>
                    <Input 
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        autoFocus
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Batal</Button>
                <Button onClick={handleChangePassword} disabled={isUpdatingPassword}>
                    {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Password
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}