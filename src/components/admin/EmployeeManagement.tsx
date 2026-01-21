import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Search, Plus, UserCheck, UserX, Pencil, Trash2, Eye } from 'lucide-react';
import type { Employee } from '@/types/auth';

interface EmployeeWithUser extends Employee {
  has_user: boolean;
}

interface EmployeeFormData {
  nip: string;
  nama: string;
  nama_gelar: string;
  nik: string;
  jenis_kelamin: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  agama: string;
  pangkat_golongan: string;
  tmt_pangkat: string;
  jabatan: string;
  jenis_jabatan: string;
  tmt_jabatan: string;
  pendidikan: string;
  jurusan_pendidikan: string;
  unit_kerja: string;
  alamat: string;
  telepon: string;
  telepon_khusus: string;
  email: string;
  foto_url: string;
  foto_thumbnail: string;
  status: string;
}

const emptyFormData: EmployeeFormData = {
  nip: '',
  nama: '',
  nama_gelar: '',
  nik: '',
  jenis_kelamin: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  agama: '',
  pangkat_golongan: '',
  tmt_pangkat: '',
  jabatan: '',
  jenis_jabatan: '',
  tmt_jabatan: '',
  pendidikan: '',
  jurusan_pendidikan: '',
  unit_kerja: '',
  alamat: '',
  telepon: '',
  telepon_khusus: '',
  email: '',
  foto_url: '',
  foto_thumbnail: '',
  status: 'Aktif',
};

const JENIS_KELAMIN_OPTIONS = ['Laki-laki', 'Perempuan'];
const AGAMA_OPTIONS = ['Islam', 'Protestan', 'Katholik', 'Hindu', 'Buddha', 'Konghucu'];
const STATUS_OPTIONS = ['Aktif', 'Mutasi', 'Pensiun', 'MD', 'PPNPM'];
const PENDIDIKAN_OPTIONS = ['SD', 'SMP', 'SMA', 'SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<EmployeeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [formData, setFormData] = useState<EmployeeFormData>(emptyFormData);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .order('nama');

      if (empError) throw empError;

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('employee_id');

      if (usersError) throw usersError;

      const userEmployeeIds = new Set(usersData?.map(u => u.employee_id) || []);

      const employeesWithUsers: EmployeeWithUser[] = (employeesData || []).map(emp => ({
        ...emp,
        has_user: userEmployeeIds.has(emp.id),
      }));

      setEmployees(employeesWithUsers);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Gagal memuat data employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async () => {
    if (!formData.nip || !formData.nama) {
      toast.error('NIP dan Nama wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('employees')
        .insert({
          nip: formData.nip,
          nama: formData.nama,
          nama_gelar: formData.nama_gelar || null,
          nik: formData.nik || null,
          jenis_kelamin: formData.jenis_kelamin || null,
          tempat_lahir: formData.tempat_lahir || null,
          tanggal_lahir: formData.tanggal_lahir || null,
          agama: formData.agama || null,
          pangkat_golongan: formData.pangkat_golongan || null,
          tmt_pangkat: formData.tmt_pangkat || null,
          jabatan: formData.jabatan || null,
          jenis_jabatan: formData.jenis_jabatan || null,
          tmt_jabatan: formData.tmt_jabatan || null,
          pendidikan: formData.pendidikan || null,
          jurusan_pendidikan: formData.jurusan_pendidikan || null,
          unit_kerja: formData.unit_kerja || null,
          alamat: formData.alamat || null,
          telepon: formData.telepon || null,
          telepon_khusus: formData.telepon_khusus || null,
          email: formData.email || null,
          foto_url: formData.foto_url || null,
          foto_thumbnail: formData.foto_thumbnail || null,
          status: formData.status || 'Aktif',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('NIP sudah terdaftar');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Employee berhasil ditambahkan');
      setShowAddDialog(false);
      setFormData(emptyFormData);
      fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Gagal menambahkan employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee || !formData.nip || !formData.nama) {
      toast.error('NIP dan Nama wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          nip: formData.nip,
          nama: formData.nama,
          nama_gelar: formData.nama_gelar || null,
          nik: formData.nik || null,
          jenis_kelamin: formData.jenis_kelamin || null,
          tempat_lahir: formData.tempat_lahir || null,
          tanggal_lahir: formData.tanggal_lahir || null,
          agama: formData.agama || null,
          pangkat_golongan: formData.pangkat_golongan || null,
          tmt_pangkat: formData.tmt_pangkat || null,
          jabatan: formData.jabatan || null,
          jenis_jabatan: formData.jenis_jabatan || null,
          tmt_jabatan: formData.tmt_jabatan || null,
          pendidikan: formData.pendidikan || null,
          jurusan_pendidikan: formData.jurusan_pendidikan || null,
          unit_kerja: formData.unit_kerja || null,
          alamat: formData.alamat || null,
          telepon: formData.telepon || null,
          telepon_khusus: formData.telepon_khusus || null,
          email: formData.email || null,
          foto_url: formData.foto_url || null,
          foto_thumbnail: formData.foto_thumbnail || null,
          status: formData.status || 'Aktif',
        })
        .eq('id', selectedEmployee.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('NIP sudah digunakan employee lain');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Employee berhasil diupdate');
      setShowEditDialog(false);
      setSelectedEmployee(null);
      setFormData(emptyFormData);
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Gagal mengupdate employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      toast.success('Employee berhasil dihapus');
      setShowDeleteDialog(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Gagal menghapus employee. Pastikan employee tidak memiliki akun terkait.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (employee: EmployeeWithUser) => {
    setSelectedEmployee(employee);
    setFormData({
      nip: employee.nip || '',
      nama: employee.nama || '',
      nama_gelar: employee.nama_gelar || '',
      nik: employee.nik || '',
      jenis_kelamin: employee.jenis_kelamin || '',
      tempat_lahir: employee.tempat_lahir || '',
      tanggal_lahir: employee.tanggal_lahir || '',
      agama: employee.agama || '',
      pangkat_golongan: employee.pangkat_golongan || '',
      tmt_pangkat: employee.tmt_pangkat || '',
      jabatan: employee.jabatan || '',
      jenis_jabatan: employee.jenis_jabatan || '',
      tmt_jabatan: employee.tmt_jabatan || '',
      pendidikan: employee.pendidikan || '',
      jurusan_pendidikan: employee.jurusan_pendidikan || '',
      unit_kerja: employee.unit_kerja || '',
      alamat: employee.alamat || '',
      telepon: employee.telepon || '',
      telepon_khusus: employee.telepon_khusus || '',
      email: employee.email || '',
      foto_url: employee.foto_url || '',
      foto_thumbnail: employee.foto_thumbnail || '',
      status: employee.status || 'Aktif',
    });
    setShowEditDialog(true);
  };

  const openDetailDialog = (employee: EmployeeWithUser) => {
    setSelectedEmployee(employee);
    setShowDetailDialog(true);
  };

  const openDeleteDialog = (employee: EmployeeWithUser) => {
    setSelectedEmployee(employee);
    setShowDeleteDialog(true);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nip.includes(searchTerm) ||
    emp.jabatan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.unit_kerja?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nik?.includes(searchTerm)
  );

  const renderFormFields = () => (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="kepegawaian">Kepegawaian</TabsTrigger>
        <TabsTrigger value="pendidikan">Pendidikan</TabsTrigger>
        <TabsTrigger value="kontak">Kontak</TabsTrigger>
      </TabsList>
      
      <TabsContent value="personal" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nip">NIP *</Label>
            <Input
              id="nip"
              value={formData.nip}
              onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
              placeholder="18 digit NIP"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nik">NIK</Label>
            <Input
              id="nik"
              value={formData.nik}
              onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
              placeholder="16 digit NIK"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nama">Nama *</Label>
          <Input
            id="nama"
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            placeholder="Nama tanpa gelar"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nama_gelar">Nama dengan Gelar</Label>
          <Input
            id="nama_gelar"
            value={formData.nama_gelar}
            onChange={(e) => setFormData({ ...formData, nama_gelar: e.target.value })}
            placeholder="Nama lengkap dengan gelar"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
            <Select
              value={formData.jenis_kelamin}
              onValueChange={(value) => setFormData({ ...formData, jenis_kelamin: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                {JENIS_KELAMIN_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agama">Agama</Label>
            <Select
              value={formData.agama}
              onValueChange={(value) => setFormData({ ...formData, agama: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih agama" />
              </SelectTrigger>
              <SelectContent>
                {AGAMA_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
            <Input
              id="tempat_lahir"
              value={formData.tempat_lahir}
              onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
              placeholder="Kota/kabupaten"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
            <Input
              id="tanggal_lahir"
              type="date"
              value={formData.tanggal_lahir}
              onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TabsContent>

      <TabsContent value="kepegawaian" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="unit_kerja">Unit Kerja / Bagian</Label>
          <Input
            id="unit_kerja"
            value={formData.unit_kerja}
            onChange={(e) => setFormData({ ...formData, unit_kerja: e.target.value })}
            placeholder="Contoh: Tata Usaha, BKA, BKD"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pangkat_golongan">Pangkat/Golongan Ruang</Label>
            <Input
              id="pangkat_golongan"
              value={formData.pangkat_golongan}
              onChange={(e) => setFormData({ ...formData, pangkat_golongan: e.target.value })}
              placeholder="Contoh: Penata (III/c)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tmt_pangkat">TMT Pangkat</Label>
            <Input
              id="tmt_pangkat"
              type="date"
              value={formData.tmt_pangkat}
              onChange={(e) => setFormData({ ...formData, tmt_pangkat: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jabatan">Jabatan</Label>
            <Input
              id="jabatan"
              value={formData.jabatan}
              onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
              placeholder="Contoh: Pembimbing Kemasyarakatan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jenis_jabatan">Jenis Jabatan</Label>
            <Input
              id="jenis_jabatan"
              value={formData.jenis_jabatan}
              onChange={(e) => setFormData({ ...formData, jenis_jabatan: e.target.value })}
              placeholder="Contoh: Fungsional Ahli Muda"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tmt_jabatan">TMT Jabatan</Label>
          <Input
            id="tmt_jabatan"
            value={formData.tmt_jabatan}
            onChange={(e) => setFormData({ ...formData, tmt_jabatan: e.target.value })}
            placeholder="DD/MM/YYYY atau range tanggal"
          />
        </div>
      </TabsContent>

      <TabsContent value="pendidikan" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="pendidikan">Pendidikan Terakhir</Label>
          <Select
            value={formData.pendidikan}
            onValueChange={(value) => setFormData({ ...formData, pendidikan: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih pendidikan" />
            </SelectTrigger>
            <SelectContent>
              {PENDIDIKAN_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="jurusan_pendidikan">Jurusan/Program Studi</Label>
          <Input
            id="jurusan_pendidikan"
            value={formData.jurusan_pendidikan}
            onChange={(e) => setFormData({ ...formData, jurusan_pendidikan: e.target.value })}
            placeholder="Contoh: Ilmu Hukum"
          />
        </div>
      </TabsContent>

      <TabsContent value="kontak" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="alamat">Alamat</Label>
          <Textarea
            id="alamat"
            value={formData.alamat}
            onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
            placeholder="Alamat lengkap"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="telepon">Telepon</Label>
            <Input
              id="telepon"
              value={formData.telepon}
              onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telepon_khusus">Telepon Khusus</Label>
            <Input
              id="telepon_khusus"
              value={formData.telepon_khusus}
              onChange={(e) => setFormData({ ...formData, telepon_khusus: e.target.value })}
              placeholder="Nomor alternatif"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email (untuk login)</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="foto_url">URL Foto (Google Drive)</Label>
            <Input
              id="foto_url"
              value={formData.foto_url}
              onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="foto_thumbnail">URL Thumbnail</Label>
            <Input
              id="foto_thumbnail"
              value={formData.foto_thumbnail}
              onChange={(e) => setFormData({ ...formData, foto_thumbnail: e.target.value })}
              placeholder="https://drive.google.com/thumbnail..."
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  const renderDetailContent = () => {
    if (!selectedEmployee) return null;
    
    const DetailRow = ({ label, value }: { label: string; value: string | null }) => (
      <div className="py-2 border-b border-border/50 last:border-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        <p className="font-medium">{value || '-'}</p>
      </div>
    );

    return (
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-1">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Data Personal</h4>
          <DetailRow label="NIP" value={selectedEmployee.nip} />
          <DetailRow label="NIK" value={selectedEmployee.nik} />
          <DetailRow label="Nama" value={selectedEmployee.nama} />
          <DetailRow label="Nama dengan Gelar" value={selectedEmployee.nama_gelar} />
          <DetailRow label="Jenis Kelamin" value={selectedEmployee.jenis_kelamin} />
          <DetailRow label="Tempat, Tanggal Lahir" value={`${selectedEmployee.tempat_lahir || '-'}, ${selectedEmployee.tanggal_lahir || '-'}`} />
          <DetailRow label="Agama" value={selectedEmployee.agama} />
          <DetailRow label="Status" value={selectedEmployee.status} />
          
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-6 mb-3">Data Kepegawaian</h4>
          <DetailRow label="Unit Kerja" value={selectedEmployee.unit_kerja} />
          <DetailRow label="Pangkat/Golongan" value={selectedEmployee.pangkat_golongan} />
          <DetailRow label="TMT Pangkat" value={selectedEmployee.tmt_pangkat} />
          <DetailRow label="Jabatan" value={selectedEmployee.jabatan} />
          <DetailRow label="Jenis Jabatan" value={selectedEmployee.jenis_jabatan} />
          <DetailRow label="TMT Jabatan" value={selectedEmployee.tmt_jabatan} />
          
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-6 mb-3">Pendidikan</h4>
          <DetailRow label="Pendidikan Terakhir" value={selectedEmployee.pendidikan} />
          <DetailRow label="Jurusan" value={selectedEmployee.jurusan_pendidikan} />
          
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-6 mb-3">Kontak</h4>
          <DetailRow label="Alamat" value={selectedEmployee.alamat} />
          <DetailRow label="Telepon" value={selectedEmployee.telepon} />
          <DetailRow label="Telepon Khusus" value={selectedEmployee.telepon_khusus} />
          <DetailRow label="Email" value={selectedEmployee.email} />
          
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-6 mb-3">Akun</h4>
          <div className="py-2">
            <span className="text-sm text-muted-foreground">Status Akun</span>
            <div className="mt-1">
              {selectedEmployee.has_user ? (
                <Badge variant="default" className="gap-1">
                  <UserCheck className="w-3 h-3" />
                  Memiliki Akun
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <UserX className="w-3 h-3" />
                  Belum Punya Akun
                </Badge>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Manajemen Employee</CardTitle>
            <CardDescription>
              Kelola data pegawai (single source of truth)
            </CardDescription>
          </div>
          <Button onClick={() => { setFormData(emptyFormData); setShowAddDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Cari berdasarkan NIP, NIK, nama, jabatan, atau unit kerja..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIP</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Akun</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Tidak ada employee yang cocok' : 'Belum ada data employee'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-mono text-xs">{employee.nip}</TableCell>
                      <TableCell className="font-medium">{employee.nama}</TableCell>
                      <TableCell className="text-sm">{employee.jabatan || '-'}</TableCell>
                      <TableCell className="text-sm">{employee.unit_kerja || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === 'Aktif' ? 'default' : 'secondary'}>
                          {employee.status || 'Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {employee.has_user ? (
                          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                            <UserCheck className="w-3 h-3" />
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-muted-foreground">
                            <UserX className="w-3 h-3" />
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDetailDialog(employee)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(employee)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openDeleteDialog(employee)}
                            disabled={employee.has_user}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Total: {filteredEmployees.length} employee
        </div>
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Employee</DialogTitle>
            <DialogDescription>
              Tambahkan data pegawai baru
            </DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAddEmployee} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update data pegawai
            </DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleEditEmployee} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Employee</DialogTitle>
            <DialogDescription>
              {selectedEmployee?.nama_gelar || selectedEmployee?.nama}
            </DialogDescription>
          </DialogHeader>
          {renderDetailContent()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
            <Button onClick={() => { setShowDetailDialog(false); if (selectedEmployee) openEditDialog(selectedEmployee); }}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Employee</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus employee <strong>{selectedEmployee?.nama}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteEmployee} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
