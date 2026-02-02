import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { SuratTugasGenerator } from '@/components/litmas/SuratTugasGenerator'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, Upload, CheckCircle, AlertCircle, Clock, 
  FileText, Calendar, CheckSquare, Eye, History, 
  ExternalLink, Search, FileClock, ListFilter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// --- HELPER FORMAT TANGGAL ---
const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

// Helper Jadwal Sidang (Memisahkan Tanggal & Jam)
const formatSidangDate = (isoString: string) => {
    if (!isoString) return { dateStr: '-', timeStr: '-' };
    const date = new Date(isoString);
    
    const dateStr = date.toLocaleDateString('id-ID', {
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
    });

    // Default Sidang TPP pukul 09.00 sesuai instruksi
    const timeStr = "09.00"; 

    return { dateStr, timeStr };
};

export default function PKTest() {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Upload
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  
  // State Pendaftaran TPP
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedLitmasId, setSelectedLitmasId] = useState<number | null>(null);
  const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');

  // State Detail & History
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const isAdmin = hasRole('admin');

  // --- FETCH DATA ---
  const fetchMyTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let pkId = null;
      if (!isAdmin) {
        const { data: pkData } = await supabase.from('petugas_pk').select('id').eq('user_id', user.id).maybeSingle();
        if (!pkData) { setTasks([]); setLoading(false); return; }
        pkId = pkData.id;
      }

      let finalQuery = (supabase as any)
        .from('litmas')
        .select(`
            *,
            klien:klien!litmas_id_klien_fkey (nama_klien, nomor_register_lapas, kategori_usia),
            petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama, nip),
            jadwal:tpp_schedules!litmas_tpp_schedule_id_fkey (tanggal_sidang, jenis_sidang)
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin && pkId) {
          finalQuery = finalQuery.eq('nama_pk', pkId);
      }

      const { data, error } = await finalQuery;
      
      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
      fetchMyTasks(); 
      const fetchSchedules = async () => {
          const { data } = await (supabase as any)
            .from('tpp_schedules')
            .select('*')
            .eq('status', 'Open')
            .gte('tanggal_sidang', new Date().toISOString()); 
          setAvailableSchedules(data || []);
      };
      fetchSchedules();
  }, [user, isAdmin]);

  // --- ACTIONS ---
  const handleUpload = async (file: File, taskId: number, type: 'surat_tugas' | 'hasil_litmas') => {
    setUploadingId(taskId);
    try {
      const ext = file.name.split('.').pop();
      const path = `${type}/${taskId}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
      if (upErr) throw upErr;

      let updateData: any = {};
      if (type === 'surat_tugas') {
          updateData = { 
              surat_tugas_signed_url: path, 
              status: 'On Progress',
              waktu_upload_surat_tugas: new Date().toISOString() 
          };
      } else {
          updateData = { 
              hasil_litmas_url: path, 
              status: 'Review', 
              anev_notes: null,
              waktu_upload_laporan: new Date().toISOString() 
          };
      }

      await supabase.from('litmas').update(updateData).eq('id_litmas', taskId);
      toast({ title: "Berhasil", description: "Dokumen berhasil diupload." });
      fetchMyTasks(); 
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal", description: e.message });
    } finally {
      setUploadingId(null);
    }
  };

  const openRegisterDialog = (id: number) => {
      setSelectedLitmasId(id);
      setSelectedScheduleId('');
      setIsRegisterOpen(true);
  };

  const confirmRegisterTPP = async () => {
      if (!selectedScheduleId || !selectedLitmasId) return toast({ variant: "destructive", title: "Pilih jadwal dulu!" });

      const { error } = await supabase
        .from('litmas')
        .update({ 
            status: 'TPP Scheduled',
            tpp_schedule_id: selectedScheduleId,
            waktu_daftar_tpp: new Date().toISOString() 
        } as any)
        .eq('id_litmas', selectedLitmasId);

      if (error) toast({ variant: "destructive", title: "Gagal", description: error.message });
      else {
          toast({ title: "Sukses", description: "Berhasil mendaftar ke jadwal sidang." });
          setIsRegisterOpen(false);
          fetchMyTasks();
      }
  };

  const openDoc = (path: string) => {
    if(!path) return;
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    window.open(data.publicUrl, '_blank');
  };

  const getStatus = (status: string | null) => status || 'New Task';

  // --- FILTER & STATS ---
  const filteredTasks = tasks.filter(t => 
    t.klien?.nama_klien.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.klien?.nomor_register_lapas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
      new: tasks.filter(t => !t.status || t.status === 'New Task').length,
      process: tasks.filter(t => t.status === 'On Progress' || t.status === 'Revision').length,
      review: tasks.filter(t => t.status === 'Review').length,
      done: tasks.filter(t => ['Approved', 'TPP Scheduled', 'Selesai'].includes(t.status)).length
  };

  return (
    <TestPageLayout 
        title="Dashboard PK" 
        description="Manajemen Tugas Penelitian Kemasyarakatan" 
        permissionCode="access_pk" 
        icon={<User className="w-8 h-8 text-primary" />}
    >
      <div className="space-y-6">
        
        {/* === HEADER STATS CARDS === */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white border-l-4 border-l-slate-500 shadow-sm">
                <CardContent className="p-4 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Tugas Baru</p>
                        <h3 className="text-2xl font-bold text-slate-700">{stats.new}</h3>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-full"><FileText className="w-5 h-5 text-slate-500"/></div>
                </CardContent>
            </Card>
            <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="p-4 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Sedang Proses</p>
                        <h3 className="text-2xl font-bold text-blue-700">{stats.process}</h3>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-full"><FileClock className="w-5 h-5 text-blue-600"/></div>
                </CardContent>
            </Card>
            <Card className="bg-white border-l-4 border-l-yellow-500 shadow-sm">
                <CardContent className="p-4 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Menunggu Review</p>
                        <h3 className="text-2xl font-bold text-yellow-700">{stats.review}</h3>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded-full"><Clock className="w-5 h-5 text-yellow-600"/></div>
                </CardContent>
            </Card>
            <Card className="bg-white border-l-4 border-l-green-500 shadow-sm">
                <CardContent className="p-4 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Selesai / TPP</p>
                        <h3 className="text-2xl font-bold text-green-700">{stats.done}</h3>
                    </div>
                    <div className="bg-green-50 p-2 rounded-full"><CheckCircle className="w-5 h-5 text-green-600"/></div>
                </CardContent>
            </Card>
        </div>

        {/* === MAIN CONTENT === */}
        <Card className="shadow-md border-t-4 border-t-primary">
          <CardHeader className="bg-slate-50/50 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ListFilter className="w-5 h-5 text-primary"/> Daftar Tugas Litmas
                    </CardTitle>
                    <CardDescription>Kelola laporan dan status litmas Anda di sini.</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Cari nama klien atau no. register..." 
                        className="pl-9 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[25%] font-bold text-slate-700">Identitas Klien</TableHead>
                  <TableHead className="w-[25%] font-bold text-slate-700">Status & Jadwal</TableHead>
                  <TableHead className="w-[20%] font-bold text-slate-700">Detail & Riwayat</TableHead>
                  <TableHead className="w-[30%] font-bold text-slate-700 text-right pr-6">Aksi Cepat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                            Tidak ada data yang cocok.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredTasks.map((task) => {
                        const status = getStatus(task.status);
                        // Format Tanggal Sidang (Object)
                        const schedule = task.jadwal ? formatSidangDate(task.jadwal.tanggal_sidang) : null;

                        return (
                        <TableRow key={task.id_litmas} className="hover:bg-slate-50 transition-colors">
                        
                        {/* 1. IDENTITAS KLIEN */}
                        <TableCell className="align-top py-4">
                            <div className="font-bold text-slate-900 text-base">{task.klien?.nama_klien}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1 mb-2 bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200">
                                {task.klien?.nomor_register_lapas}
                            </div>
                            <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-[10px] h-5 font-normal text-slate-600 bg-white">
                                    {task.jenis_litmas}
                                </Badge>
                            </div>
                        </TableCell>

                        {/* 2. STATUS & JADWAL */}
                        <TableCell className="align-top py-4">
                            <div className="flex flex-col gap-2 items-start">
                                <Badge className={
                                    status === 'Disetujui' ? 'bg-green-600 hover:bg-green-700' :
                                    status === 'Ditolak' ? 'bg-red-600 hover:bg-red-700' :
                                    status === 'On Progress' ? 'bg-blue-600 hover:bg-blue-700' : 
                                    status === 'TPP Scheduled' ? 'bg-purple-600 hover:bg-purple-700' :
                                    status === 'Selesai' ? 'bg-slate-600 hover:bg-slate-700' :
                                    'bg-slate-500 hover:bg-slate-600'
                                }>
                                    {status === 'TPP Scheduled' ? 'Sidang Dijadwalkan' : status}
                                </Badge>
                                
                                {schedule ? (
                                    <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded-md text-xs text-purple-900 flex flex-col gap-1 mt-1 w-full shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-purple-700"/> 
                                            {/* HANYA MENAMPILKAN TANGGAL (JAM DIHILANGKAN DI TABEL) */}
                                            <span className="font-semibold">{schedule.dateStr}</span>
                                        </div>
                                        <div className="h-[1px] bg-purple-200 my-1"></div>
                                        <span className="text-[10px] text-purple-600/90 font-medium uppercase tracking-tight">{task.jadwal.jenis_sidang}</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-slate-400 italic mt-1">Belum terjadwal</span>
                                )}
                            </div>
                        </TableCell>

                        {/* 3. DETAIL & RIWAYAT */}
                        <TableCell className="align-top py-4">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full justify-start text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100"
                                onClick={() => { setSelectedTask(task); setIsDetailOpen(true); }}
                            >
                                <Eye className="w-4 h-4 mr-2 text-blue-500"/> Lihat Detail
                            </Button>
                            <div className="text-[10px] text-slate-400 mt-2 pl-3 border-l-2 border-slate-100">
                                Update: {new Date(task.updated_at || task.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}
                            </div>
                        </TableCell>

                        {/* 4. AKSI CEPAT */}
                        <TableCell className="align-top py-4 text-right pr-6">
                            <div className="w-full max-w-[200px] ml-auto space-y-2">
                            
                            {status === 'New Task' && (
                                <div className="space-y-2">
                                    <div className="w-full"><SuratTugasGenerator litmasId={task.id_litmas} /></div>
                                    <div className="relative w-full">
                                        <Button size="sm" variant="secondary" className="w-full text-xs h-9 border shadow-sm font-medium">
                                            <Upload className="w-3 h-3 mr-2"/> Upload TTD
                                        </Button>
                                        <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], task.id_litmas, 'surat_tugas')} />
                                    </div>
                                </div>
                            )}

                            {(status === 'On Progress' || status === 'Revision') && (
                                <div className="relative w-full">
                                    <Button size="sm" className="bg-blue-600 w-full hover:bg-blue-700 text-xs h-9 shadow-sm font-medium">
                                        <Upload className="w-3 h-3 mr-2"/> Upload Laporan
                                    </Button>
                                    <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], task.id_litmas, 'hasil_litmas')} />
                                </div>
                            )}

                            {status === 'Review' && (
                                <div className="w-full h-9 flex items-center justify-center gap-2 text-xs font-medium text-yellow-700 bg-yellow-50 rounded border border-yellow-100 select-none cursor-default">
                                    <Clock className="w-3.5 h-3.5"/> Sedang Diverifikasi
                                </div>
                            )}

                            {status === 'Approved' && (
                                <Button size="sm" variant="outline" className="border-green-600 text-green-700 bg-green-50/50 w-full hover:bg-green-100 h-9 text-xs font-medium shadow-sm" onClick={() => openRegisterDialog(task.id_litmas)}>
                                    <Calendar className="w-3.5 h-3.5 mr-2"/> Daftar Sidang TPP
                                </Button>
                            )}

                            {status === 'TPP Scheduled' && (
                                <div className="w-full h-9 flex items-center justify-center gap-2 text-xs font-medium text-purple-700 bg-purple-50 rounded border border-purple-100 select-none cursor-default">
                                    <CheckSquare className="w-3.5 h-3.5"/> Menunggu Sidang
                                </div>
                            )}

                            {status === 'Selesai' && (
                                <div className="w-full h-9 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 rounded border border-slate-200 select-none cursor-default">
                                    <CheckCircle className="w-3.5 h-3.5"/> Proses Selesai
                                </div>
                            )}

                            </div>
                        </TableCell>
                        </TableRow>
                    )})
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* === MODAL PILIH JADWAL (Tampilkan Jam 09.00) === */}
        <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Pilih Jadwal Sidang</DialogTitle>
                    <DialogDescription>Pilih salah satu slot sidang yang tersedia.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
                        <SelectTrigger className="bg-slate-50 h-auto py-3">
                            <SelectValue placeholder="-- Pilih Tanggal --" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableSchedules.map(s => {
                                const { dateStr, timeStr } = formatSidangDate(s.tanggal_sidang);
                                return (
                                <SelectItem key={s.id} value={s.id} className="py-3 border-b last:border-0">
                                    <div className="flex flex-col gap-1 text-left">
                                        <span className="font-semibold text-slate-800">{dateStr}</span>
                                        <div className="flex items-center gap-2 text-xs">
                                            {/* JAM TAMPIL DI DROPDOWN */}
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">Pukul {timeStr} WIB</span>
                                            <span className="text-slate-400">|</span>
                                            <span className="text-slate-500 italic">{s.jenis_sidang}</span>
                                        </div>
                                    </div>
                                </SelectItem>
                            )})}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button onClick={confirmRegisterTPP} className="bg-purple-600 hover:bg-purple-700 w-full">Daftar Sekarang</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* === MODAL DETAIL & HISTORY === */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600"/> Detail Litmas
                        </DialogTitle>
                        <Badge variant="outline" className="text-sm px-3 py-1 bg-slate-50">
                            {selectedTask?.status}
                        </Badge>
                    </div>
                    <DialogDescription>Nomor Surat: <span className="font-mono text-slate-700">{selectedTask?.nomor_surat_permintaan}</span></DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    
                    {/* INFO GRID */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm bg-slate-50 p-5 rounded-lg border border-slate-100">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama Klien</span> 
                            <p className="font-semibold text-slate-800 text-base">{selectedTask?.klien?.nama_klien}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Jenis Litmas</span> 
                            <p className="font-medium text-slate-700">{selectedTask?.jenis_litmas}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Asal UPT</span> 
                            <p className="font-medium text-slate-700">{selectedTask?.asal_bapas}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">PK Penanggungjawab</span> 
                            <p className="font-medium text-slate-700">{selectedTask?.petugas_pk?.nama}</p>
                        </div>
                        
                        {/* JADWAL DI DETAIL (TAMPILKAN JAM) */}
                        {selectedTask?.jadwal && (
                            <div className="col-span-2 mt-2 pt-3 border-t border-slate-200">
                                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block mb-1">Jadwal Sidang TPP</span>
                                <div className="flex items-center gap-2 text-purple-900 font-medium">
                                    <Calendar className="w-4 h-4"/>
                                    {formatSidangDate(selectedTask.jadwal.tanggal_sidang).dateStr}
                                    <span className="text-slate-400 mx-1">|</span>
                                    <Clock className="w-4 h-4"/>
                                    Pukul {formatSidangDate(selectedTask.jadwal.tanggal_sidang).timeStr} WIB
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DOKUMEN SECTION */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-900 border-b pb-2">Dokumen Digital</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border p-3 rounded-md flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="bg-slate-100 p-2 rounded"><FileText className="w-4 h-4 text-slate-600"/></div>
                                    <div className="text-xs">
                                        <span className="block font-medium text-slate-700">Surat Tugas</span>
                                        <span className="text-slate-400">{selectedTask?.surat_tugas_signed_url ? 'Sudah diupload' : 'Belum tersedia'}</span>
                                    </div>
                                </div>
                                {selectedTask?.surat_tugas_signed_url && (
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openDoc(selectedTask.surat_tugas_signed_url)}>
                                        <ExternalLink className="w-3 h-3 mr-1"/> Buka
                                    </Button>
                                )}
                            </div>
                            
                            <div className="border p-3 rounded-md flex items-center justify-between hover:bg-blue-50/50 transition-colors border-blue-100 bg-blue-50/20">
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-100 p-2 rounded"><FileText className="w-4 h-4 text-blue-600"/></div>
                                    <div className="text-xs">
                                        <span className="block font-medium text-blue-800">Laporan Litmas</span>
                                        <span className="text-blue-400">{selectedTask?.hasil_litmas_url ? 'Siap diperiksa' : 'Belum upload'}</span>
                                    </div>
                                </div>
                                {selectedTask?.hasil_litmas_url && (
                                    <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => openDoc(selectedTask.hasil_litmas_url)}>
                                        <ExternalLink className="w-3 h-3 mr-1"/> Buka
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* TIMELINE HISTORY */}
                    <div className="border rounded-lg p-5 bg-white shadow-sm">
                        <h4 className="text-sm font-bold mb-5 flex items-center gap-2 text-slate-800">
                            <History className="w-4 h-4 text-blue-600"/> Riwayat Proses
                        </h4>
                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-2">
                            
                            {/* 1. Registrasi */}
                            <div className="ml-8 relative">
                                <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${selectedTask?.waktu_registrasi ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Registrasi & Penunjukan PK</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(selectedTask?.waktu_registrasi)}</p>
                                </div>
                            </div>

                            {/* 2. Upload Surat */}
                            <div className="ml-8 relative">
                                <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${selectedTask?.waktu_upload_surat_tugas ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">PK: Upload Surat Tugas</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(selectedTask?.waktu_upload_surat_tugas)}</p>
                                </div>
                            </div>

                            {/* 3. Upload Laporan */}
                            <div className="ml-8 relative">
                                <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${selectedTask?.waktu_upload_laporan ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">PK: Upload Laporan Litmas</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(selectedTask?.waktu_upload_laporan)}</p>
                                </div>
                            </div>

                            {/* 4. Verifikasi */}
                            <div className="ml-8 relative">
                                <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${selectedTask?.waktu_verifikasi_anev ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Anev: Verifikasi & Approval</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(selectedTask?.waktu_verifikasi_anev)}</p>
                                </div>
                            </div>

                            {/* 5. Sidang */}
                            <div className="ml-8 relative">
                                <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${selectedTask?.waktu_sidang_tpp ? 'bg-purple-600' : 'bg-slate-200'}`}></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">TPP: Sidang Dilaksanakan</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(selectedTask?.waktu_sidang_tpp)}</p>
                                </div>
                            </div>

                             {/* 6. Selesai */}
                             <div className="ml-8 relative">
                                <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${selectedTask?.waktu_selesai ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                                <div>
                                    <p className="text-xs font-bold text-blue-700">Selesai</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(selectedTask?.waktu_selesai)}</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

      </div>
    </TestPageLayout>
  );
}