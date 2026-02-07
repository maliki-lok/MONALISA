import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { User, ListFilter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Import Komponen Pecahan
import { PKStatsCards } from '@/components/pk/PKStatsCards';
import { PKTaskTable } from '@/components/pk/PKTaskTable';
import { PKRegisterDialog } from '@/components/pk/PKRegisterDialog';
import { PKDetailDialog } from '@/components/pk/PKDetailDialog';

// --- 1. DEFINISI TIPE MANUAL ---
interface LitmasTaskData {
  id_litmas: number;
  created_at: string;
  updated_at: string | null;
  status: string | null;
  jenis_litmas: string | null;
  nomor_surat_permintaan: string | null;
  surat_tugas_signed_url: string | null;
  hasil_litmas_url: string | null;
  waktu_registrasi: string | null;
  waktu_upload_surat_tugas: string | null;
  waktu_upload_laporan: string | null;
  waktu_verifikasi_anev: string | null;
  waktu_sidang_tpp: string | null;
  waktu_selesai: string | null;
  asal_bapas: string | null;
  klien: {
    nama_klien: string;
    nomor_register_lapas: string;
    kategori_usia: string;
  } | null;
  petugas_pk: {
    nama: string;
    nip: string;
  } | null;
  jadwal: {
    tanggal_sidang: string;
    jenis_sidang: string;
  } | null;
}

// --- 2. FUNGSI FETCHER DI LUAR KOMPONEN (SOLUSI TS2589) ---
// Kita pisahkan fungsi ini agar TypeScript tidak melakukan deep inference terhadap state React
// --- 2. FUNGSI FETCHER DI LUAR KOMPONEN (SOLUSI TS2589) ---
async function getLitmasTasksExternal(client: any, userId: string, isAdmin: boolean) {
    let pkId = null;
    
    // Cek ID PK jika bukan admin
    if (!isAdmin) {
        const { data, error } = await client.from('petugas_pk').select('id, nama').eq('user_id', userId).maybeSingle();
        
        if (error) {
            console.error("Error fetch PK Profile:", error);
            return { data: [], error };
        }
        
        if (!data) {
            console.warn("User ini login, tapi tidak ditemukan di tabel petugas_pk (user_id mismatch).");
            return { data: [], error: null };
        }

        pkId = data.id;
        console.log("Login sebagai PK:", data.nama, "| ID PK:", pkId); // Debugging
    }

    // Query dengan Explicit Foreign Key Hints
    let query = client
        .from('litmas')
        .select(`
            *,
            klien:klien!litmas_id_klien_fkey (nama_klien, nomor_register_lapas, kategori_usia),
            petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama, nip),
            jadwal:tpp_schedules!litmas_tpp_schedule_id_fkey (tanggal_sidang, jenis_sidang)
        `)
        .order('created_at', { ascending: false });

    // FILTER WAJIB: Hanya tampilkan yang ditugaskan ke PK ini
    if (!isAdmin && pkId) {
        query = query.eq('nama_pk', pkId);
    } 
    // TAMBAHAN: Jika bukan admin DAN tidak punya pkId (akun nyasar), jangan tampilkan apa-apa
    else if (!isAdmin && !pkId) {
        // Return kosong agar tidak bocor data lain
        return { data: [], error: null };
    }

    return await query;
}

// --- 3. KOMPONEN UTAMA ---
export default function PKTest() {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  
  // State
  const [tasks, setTasks] = useState<LitmasTaskData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  
  // Dialogs
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedLitmasId, setSelectedLitmasId] = useState<number | null>(null);
  const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const isAdmin = hasRole('admin');

  // --- MAIN FETCH ---
  const fetchMyTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Panggil fungsi external
      // @ts-ignore
      const { data, error } = await getLitmasTasksExternal((supabase as any), user.id, isAdmin);
      
      if (error) throw error;
      
      if (data) {
        setTasks(data as unknown as LitmasTaskData[]);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
      fetchMyTasks(); 
      const fetchSchedules = async () => {
          // Casting any juga di sini untuk keamanan
          const { data } = await (supabase as any)
            .from('tpp_schedules').select('*').eq('status', 'Open').gte('tanggal_sidang', new Date().toISOString()); 
          setAvailableSchedules(data || []);
      };
      fetchSchedules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          updateData = { surat_tugas_signed_url: path, status: 'On Progress', waktu_upload_surat_tugas: new Date().toISOString() };
      } else {
          updateData = { hasil_litmas_url: path, status: 'Review', anev_notes: null, waktu_upload_laporan: new Date().toISOString() };
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
      const { error } = await (supabase as any).from('litmas').update({ status: 'TPP Scheduled', tpp_schedule_id: selectedScheduleId, waktu_daftar_tpp: new Date().toISOString() }).eq('id_litmas', selectedLitmasId);

      if (error) toast({ variant: "destructive", title: "Gagal", description: error.message });
      else {
          toast({ title: "Sukses", description: "Berhasil mendaftar ke jadwal sidang." });
          setIsRegisterOpen(false);
          fetchMyTasks();
      }
  };

  // --- FILTER & STATS ---
  const filteredTasks = tasks.filter(t => 
    (t.klien?.nama_klien || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.klien?.nomor_register_lapas || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
      new: tasks.filter(t => !t.status || t.status === 'New Task').length,
      process: tasks.filter(t => t.status === 'On Progress' || t.status === 'Revision').length,
      review: tasks.filter(t => t.status === 'Review').length,
      done: tasks.filter(t => ['Approved', 'TPP Scheduled', 'Selesai'].includes(t.status || '')).length
  };

  return (
    <TestPageLayout title="Dashboard PK" description="Manajemen Tugas Penelitian Kemasyarakatan" permissionCode="access_pk" icon={<User className="w-8 h-8 text-primary" />}>
      <div className="space-y-6">
        <PKStatsCards stats={stats} />
        <Card className="shadow-md border-t-4 border-t-primary">
          <CardHeader className="bg-slate-50/50 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg"><ListFilter className="w-5 h-5 text-primary"/> Daftar Tugas Litmas</CardTitle>
                    <CardDescription>Kelola laporan dan status litmas Anda di sini.</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Cari nama klien..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <PKTaskTable 
                tasks={filteredTasks} 
                loading={loading}
                onViewDetail={(task) => { setSelectedTask(task); setIsDetailOpen(true); }}
                onUpload={handleUpload}
                onOpenRegister={openRegisterDialog}
            />
          </CardContent>
        </Card>
        <PKRegisterDialog 
            isOpen={isRegisterOpen} 
            onOpenChange={setIsRegisterOpen} 
            schedules={availableSchedules}
            selectedScheduleId={selectedScheduleId}
            onSelectSchedule={setSelectedScheduleId}
            onConfirm={confirmRegisterTPP}
        />
        <PKDetailDialog 
            isOpen={isDetailOpen} 
            onOpenChange={setIsDetailOpen} 
            task={selectedTask}
        />
      </div>
    </TestPageLayout>
  );
}