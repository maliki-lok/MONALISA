import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Search, Plus, User, Briefcase, Trash2, Pencil, 
  Loader2, UserCheck, AlertCircle, Phone, GraduationCap, Filter 
} from 'lucide-react';
import type { Employee } from '@/types/auth';

// --- Interfaces ---

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
  status: 'Aktif',
};

// --- Options Constants ---
const JENIS_KELAMIN_OPTIONS = ['Laki-laki', 'Perempuan'];
const AGAMA_OPTIONS = ['Islam', 'Protestan', 'Katholik', 'Hindu', 'Buddha', 'Konghucu'];
const STATUS_OPTIONS = ['Aktif', 'Mutasi', 'Pensiun', 'MD', 'PPNPM', 'Cuti Diluar Tanggungan'];
const PENDIDIKAN_OPTIONS = ['SD', 'SMP', 'SMA', 'SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<EmployeeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // State untuk Filter Status

  // Sheet & Form States
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateForm = (key: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // --- Data Fetching ---
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
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // --- Handlers ---

  const handleOpenCreate = () => {
    setFormData(emptyFormData);
    setIsEditMode(false);
    setCurrentId(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (emp: EmployeeWithUser) => {
    setFormData({
      nip: emp.nip || '',
      nama: emp.nama || '',
      nama_gelar: emp.nama_gelar || '',
      nik: emp.nik || '',
      jenis_kelamin: emp.jenis_kelamin || '',
      tempat_lahir: emp.tempat_lahir || '',
      tanggal_lahir: emp.tanggal_lahir ? new Date(emp.tanggal_lahir).toISOString().split('T')[0] : '',
      agama: emp.agama || '',
      pangkat_golongan: emp.pangkat_golongan || '',
      tmt_pangkat: emp.tmt_pangkat ? new Date(emp.tmt_pangkat).toISOString().split('T')[0] : '',
      jabatan: emp.jabatan || '',
      jenis_jabatan: emp.jenis_jabatan || '',
      tmt_jabatan: emp.tmt_jabatan || '', 
      pendidikan: emp.pendidikan || '',
      jurusan_pendidikan: emp.jurusan_pendidikan || '',
      unit_kerja: emp.unit_kerja || '',
      alamat: emp.alamat || '',
      telepon: emp.telepon || '',
      telepon_khusus: emp.telepon_khusus || '',
      email: emp.email || '',
      foto_url: emp.foto_url || '',
      status: emp.status || 'Aktif',
    });
    setCurrentId(emp.id);
    setIsEditMode(true);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data pegawai "${nama}"?\n\nTindakan ini tidak dapat dibatalkan.`)) return;

    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Data pegawai berhasil dihapus');
      fetchEmployees();
    } catch (error: any) {
      toast.error('Gagal menghapus: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nip || !formData.nama) {
      toast.error('NIP dan Nama wajib diisi');
      return;
    }

    setIsSubmitting(true);
    
    const payload: any = { ...formData };
    Object.keys(payload).forEach(key => {
      if (payload[key] === '') payload[key] = null;
    });

    try {
      if (isEditMode && currentId) {
        const { error } = await supabase
          .from('employees')
          .update(payload)
          .eq('id', currentId);
        
        if (error) throw error;
        toast.success('Data pegawai berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([payload]);
        
        if (error) {
            if (error.code === '23505') throw new Error("NIP sudah terdaftar.");
            throw error;
        }
        toast.success('Pegawai baru berhasil ditambahkan');
      }

      setIsSheetOpen(false);
      fetchEmployees();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // --- FILTERING LOGIC ---
  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    
    // Filter Pencarian Teks
    const matchesSearch = 
        emp.nama.toLowerCase().includes(searchLower) ||
        emp.nip.includes(searchLower) ||
        emp.jabatan?.toLowerCase().includes(searchLower) ||
        emp.unit_kerja?.toLowerCase().includes(searchLower);

    // Filter Status Dropdown
    let matchesStatus = true;
    if (statusFilter === 'all') {
        matchesStatus = true;
    } else if (statusFilter === 'active') {
        matchesStatus = emp.status === 'Aktif';
    } else if (statusFilter === 'inactive') {
        matchesStatus = emp.status !== 'Aktif';
    } else {
        // Jika filter spesifik (misal: 'Pensiun')
        matchesStatus = emp.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Pegawai</h2>
          <p className="text-muted-foreground">Kelola data lengkap seluruh pegawai BAPAS.</p>
        </div>
        
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Pegawai
        </Button>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[640px] overflow-y-auto sm:max-w-[700px]">
          <SheetHeader className="mb-4">
            <SheetTitle>{isEditMode ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}</SheetTitle>
            <SheetDescription>
              Lengkapi form di bawah ini. Field bertanda (*) wajib diisi.
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="personal">Pribadi</TabsTrigger>
              <TabsTrigger value="kepegawaian">Karir</TabsTrigger>
              <TabsTrigger value="pendidikan">Pendidikan</TabsTrigger>
              <TabsTrigger value="kontak">Kontak</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="nip">NIP *</Label>
                        <Input id="nip" value={formData.nip} onChange={e => updateForm('nip', e.target.value)} placeholder="19xxxxxxxxxx" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nik">NIK</Label>
                        <Input id="nik" value={formData.nik} onChange={e => updateForm('nik', e.target.value)} placeholder="317xxxxxxxx" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nama">Nama Lengkap (Tanpa Gelar) *</Label>
                    <Input id="nama" value={formData.nama} onChange={e => updateForm('nama', e.target.value)} placeholder="Nama Saja" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nama_gelar">Nama Lengkap & Gelar</Label>
                    <Input id="nama_gelar" value={formData.nama_gelar} onChange={e => updateForm('nama_gelar', e.target.value)} placeholder="Contoh: Dr. Nama, S.H., M.H." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Jenis Kelamin</Label>
                        <Select value={formData.jenis_kelamin} onValueChange={(val) => updateForm('jenis_kelamin', val)}>
                            <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                            <SelectContent>
                                {JENIS_KELAMIN_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Agama</Label>
                        <Select value={formData.agama} onValueChange={(val) => updateForm('agama', val)}>
                            <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                            <SelectContent>
                                {AGAMA_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                        <Input id="tempat_lahir" value={formData.tempat_lahir} onChange={e => updateForm('tempat_lahir', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                        <Input id="tanggal_lahir" type="date" value={formData.tanggal_lahir} onChange={e => updateForm('tanggal_lahir', e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="foto_url">URL Foto Profil</Label>
                    <Input id="foto_url" value={formData.foto_url} onChange={e => updateForm('foto_url', e.target.value)} placeholder="https://..." />
                </div>
            </TabsContent>

            <TabsContent value="kepegawaian" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Status Pegawai</Label>
                        <Select value={formData.status} onValueChange={(val) => updateForm('status', val)}>
                            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="unit_kerja">Unit Kerja</Label>
                        <Input id="unit_kerja" value={formData.unit_kerja} onChange={e => updateForm('unit_kerja', e.target.value)} placeholder="Contoh: Subsi Bimbingan Klien Anak" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="jabatan">Jabatan Struktural/Fungsional</Label>
                    <Input id="jabatan" value={formData.jabatan} onChange={e => updateForm('jabatan', e.target.value)} placeholder="Contoh: Pembimbing Kemasyarakatan Ahli Muda" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="jenis_jabatan">Jenis Jabatan</Label>
                        <Input id="jenis_jabatan" value={formData.jenis_jabatan} onChange={e => updateForm('jenis_jabatan', e.target.value)} placeholder="Eselon / Fungsional" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tmt_jabatan">TMT Jabatan</Label>
                        <Input id="tmt_jabatan" value={formData.tmt_jabatan} onChange={e => updateForm('tmt_jabatan', e.target.value)} placeholder="Contoh: 01-01-2023" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="pangkat_golongan">Pangkat/Golongan</Label>
                        <Input id="pangkat_golongan" value={formData.pangkat_golongan} onChange={e => updateForm('pangkat_golongan', e.target.value)} placeholder="Penata Muda (III/a)" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tmt_pangkat">TMT Pangkat</Label>
                        <Input id="tmt_pangkat" type="date" value={formData.tmt_pangkat} onChange={e => updateForm('tmt_pangkat', e.target.value)} />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="pendidikan" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tingkat Pendidikan</Label>
                        <Select value={formData.pendidikan} onValueChange={(val) => updateForm('pendidikan', val)}>
                            <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                            <SelectContent>
                                {PENDIDIKAN_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="jurusan">Jurusan</Label>
                        <Input id="jurusan" value={formData.jurusan_pendidikan} onChange={e => updateForm('jurusan_pendidikan', e.target.value)} placeholder="Contoh: Ilmu Hukum" />
                    </div>
                </div>
                <Alert className="bg-muted/50">
                    <GraduationCap className="h-4 w-4" />
                    <AlertTitle>Info Pendidikan</AlertTitle>
                    <AlertDescription>
                        Data pendidikan digunakan untuk analisis kompetensi pegawai. Pastikan jurusan sesuai ijazah terakhir.
                    </AlertDescription>
                </Alert>
            </TabsContent>

            <TabsContent value="kontak" className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email Dinas</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => updateForm('email', e.target.value)} placeholder="nama@kemenkumham.go.id" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="telepon">No. HP / WA</Label>
                        <Input id="telepon" value={formData.telepon} onChange={e => updateForm('telepon', e.target.value)} placeholder="08xxxxxxxx" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="telepon_khusus">Telepon Khusus (Darurat)</Label>
                        <Input id="telepon_khusus" value={formData.telepon_khusus} onChange={e => updateForm('telepon_khusus', e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="alamat">Alamat Lengkap</Label>
                    <Input id="alamat" value={formData.alamat} onChange={e => updateForm('alamat', e.target.value)} placeholder="Jalan, RT/RW, Kelurahan, Kecamatan" />
                </div>
            </TabsContent>
          </Tabs>

          <SheetFooter className="mt-8 flex gap-2">
            <SheetClose asChild>
              <Button variant="outline">Batal</Button>
            </SheetClose>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Simpan Perubahan' : 'Buat Pegawai'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader>
           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle className="whitespace-nowrap">List Pegawai</CardTitle>
            
            {/* --- Filter & Search Container --- */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* 1. Dropdown Filter Status */}
                <div className="w-full sm:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Filter Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Pegawai</SelectItem>
                            <SelectItem value="active">Hanya Aktif</SelectItem>
                            <SelectItem value="inactive">Tidak Aktif (Pensiun/Mutasi)</SelectItem>
                            {/* Opsi Spesifik */}
                            {STATUS_OPTIONS.filter(s => s !== 'Aktif').map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 2. Search Bar */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama, NIP, atau jabatan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[60px]"></TableHead>
                    <TableHead>Identitas Pegawai</TableHead>
                    <TableHead>Jabatan & Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                        <TableCell>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-3 w-[150px]" />
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-3 w-[100px]" />
                            </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                    ))
                ) : filteredEmployees.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        Tidak ada data pegawai yang cocok.
                    </TableCell>
                    </TableRow>
                ) : (
                    filteredEmployees.map((emp) => (
                    <TableRow key={emp.id} className="group hover:bg-muted/50 transition-colors">
                        <TableCell>
                            <Avatar>
                                <AvatarImage src={emp.foto_url || undefined} alt={emp.nama} className="object-cover" />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {getInitials(emp.nama)}
                                </AvatarFallback>
                            </Avatar>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1">
                                <span className="font-semibold text-sm flex items-center gap-2">
                                    {emp.nama_gelar || emp.nama}
                                    {emp.has_user && (
                                        <div className="flex items-center text-xs font-normal text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full" title="Memiliki akun login">
                                            <UserCheck className="h-3 w-3 mr-1" /> Akun
                                        </div>
                                    )}
                                </span>
                                <div className="text-xs text-muted-foreground font-mono">
                                    NIP. {emp.nip}
                                </div>
                                {emp.email && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        {emp.email}
                                    </div>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">{emp.jabatan || '-'}</span>
                                <span className="text-xs text-muted-foreground">{emp.unit_kerja || emp.pangkat_golongan}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge 
                                variant={emp.status === 'Aktif' ? 'default' : 'secondary'} 
                                className={emp.status === 'Aktif' ? 'bg-green-600 hover:bg-green-700' : ''}
                            >
                                {emp.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(emp)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id, emp.nama)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}