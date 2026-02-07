import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Gavel, Calendar, User, FileText, Plus, AlertCircle, Clock, 
  CheckCircle, XCircle, RefreshCw, Layers, History, List, 
  MoreHorizontal, Pencil, Trash2, Users, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// --- HELPER FORMAT TANGGAL ---
const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short'
    });
}

const formatDateLong = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const formatDateIndo = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEEE, d MMMM yyyy", { locale: localeId });
    } catch { return dateStr; }
};

// --- INTERFACES (DIPERBAIKI) ---
interface TPPSchedule {
    id: string;
    tanggal_sidang: string;
    waktu_sidang: string | null;
    jenis_sidang: string;
    tempat: string | null;
    // UPDATE: Menambahkan 'Dibatalkan' dan 'Selesai' ke dalam tipe union
    status: 'Open' | 'Closed' | 'Cancelled' | 'Dibatalkan' | 'Selesai';
    keterangan: string | null;
    kuota?: number;
    // Helper untuk UI
    litmas_list?: any[];
}

export default function TPPTest() {
  // State Data
  const [schedules, setSchedules] = useState<TPPSchedule[]>([]); 
  const [participants, setParticipants] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);

  // State Dialog Buat Jadwal (Master - Bulk)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [tempDate, setTempDate] = useState(''); 
  const [datesToSave, setDatesToSave] = useState<string[]>([]); 
  const [defaultQuota, setDefaultQuota] = useState(50); 

  // State Dialog EDIT Jadwal
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  // State Dialog Putusan Sidang
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [selectedLitmas, setSelectedLitmas] = useState<any>(null);
  const [decision, setDecision] = useState<'Disetujui' | 'Ditolak' | 'Hold'>('Disetujui');
  const [decisionNote, setDecisionNote] = useState('');

  // State Dialog Sidang Ulang
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleItem, setRescheduleItem] = useState<any>(null);

  // State Detail Riwayat Sidang (New Feature)
  const [selectedHistorySchedule, setSelectedHistorySchedule] = useState<TPPSchedule | null>(null);
  const [isHistoryDetailOpen, setIsHistoryDetailOpen] = useState(false);

  const todayStr = new Date().toLocaleDateString('en-CA'); 

  // --- FETCH DATA ---
  const fetchSchedules = async () => {
    const { data } = await (supabase as any)
      .from('tpp_schedules')
      .select('*')
      .order('tanggal_sidang', { ascending: false }); // Descending agar history paling atas
    setSchedules((data as TPPSchedule[]) || []);
  };

  const fetchParticipants = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('litmas')
      .select(`
          *,
          klien:klien!litmas_id_klien_fkey (nama_klien, nomor_register_lapas),
          petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama, nip),
          jadwal:tpp_schedules!litmas_tpp_schedule_id_fkey (tanggal_sidang, jenis_sidang)
      `)
      .order('created_at', { ascending: true });

    if (!error) setParticipants(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();
    fetchParticipants();
    
    const sub1 = supabase.channel('tpp-sched').on('postgres_changes', { event: '*', schema: 'public', table: 'tpp_schedules' }, fetchSchedules).subscribe();
    const sub2 = supabase.channel('tpp-part').on('postgres_changes', { event: '*', schema: 'public', table: 'litmas' }, fetchParticipants).subscribe();

    return () => { supabase.removeChannel(sub1); supabase.removeChannel(sub2); };
  }, []);

  // --- LOGIC: MASTER JADWAL (CREATE BULK) ---
  const addDateToList = () => {
    if (!tempDate) return;
    if (datesToSave.includes(tempDate)) return toast.warning("Tanggal sudah ada.");
    setDatesToSave([...datesToSave, tempDate].sort());
    setTempDate('');
  };

  const handleBulkCreateSchedule = async () => {
    if (datesToSave.length === 0) return toast.error("Pilih tanggal dulu.");
    
    const insertData = datesToSave.map(date => ({
        tanggal_sidang: date,
        jenis_sidang: 'Sidang TPP', 
        status: 'Open',
        kuota: defaultQuota
    }));

    const { error } = await (supabase as any).from('tpp_schedules').insert(insertData);
    if (error) toast.error(error.message);
    else {
        toast.success(`${datesToSave.length} jadwal berhasil dibuka dengan kuota ${defaultQuota}.`);
        setIsScheduleOpen(false);
        setDatesToSave([]);
        setDefaultQuota(50);
    }
  };

  // --- LOGIC: MASTER JADWAL (EDIT & DELETE) ---
  const handleOpenEditSchedule = (sch: any) => {
    setEditingSchedule({ ...sch }); 
    setIsEditScheduleOpen(true);
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;
    try {
        const { error } = await (supabase as any)
            .from('tpp_schedules')
            .update({
                tanggal_sidang: editingSchedule.tanggal_sidang,
                status: editingSchedule.status,
                kuota: editingSchedule.kuota
            })
            .eq('id', editingSchedule.id);

        if (error) throw error;
        toast.success("Jadwal berhasil diperbarui.");
        setIsEditScheduleOpen(false);
    } catch (e: any) {
        toast.error("Gagal update: " + e.message);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    const hasParticipants = participants.some(p => p.tpp_schedule_id === id);
    
    if (hasParticipants) {
        if(!window.confirm("PERINGATAN: Ada klien yang sudah terdaftar di jadwal ini. Jika dihapus, jadwal klien tersebut akan hilang. Lanjutkan?")) {
            return;
        }
    } else {
        if(!window.confirm("Apakah Anda yakin ingin menghapus slot jadwal ini?")) return;
    }

    try {
        const { error } = await (supabase as any)
            .from('tpp_schedules')
            .delete()
            .eq('id', id);

        if (error) throw error;
        toast.success("Slot jadwal dihapus.");
    } catch (e: any) {
        toast.error("Gagal hapus: " + e.message);
    }
  };

  // --- LOGIC: PUTUSAN SIDANG ---
  const handleOpenDecision = (item: any) => {
    setSelectedLitmas(item);
    setDecision('Disetujui'); 
    setDecisionNote('');
    setIsDecisionOpen(true);
  };

  const submitDecision = async () => {
    if (!selectedLitmas) return;

    let updatePayload: any = {
        status: decision,
        anev_notes: decisionNote,
        waktu_sidang_tpp: new Date().toISOString(), 
    };

    if (decision === 'Disetujui' || decision === 'Ditolak') {
        updatePayload.waktu_selesai = new Date().toISOString(); 
    }

    try {
        const { error } = await supabase
            .from('litmas')
            .update(updatePayload)
            .eq('id_litmas', selectedLitmas.id_litmas);

        if (error) throw error;
        toast.success(`Putusan: ${decision} disimpan.`);
        setIsDecisionOpen(false);
        fetchParticipants(); 
    } catch (e: any) { toast.error(e.message); }
  };

  // --- LOGIC: SIDANG ULANG (RESCHEDULE) ---
  const handleOpenReschedule = (item: any) => {
    setRescheduleItem(item);
    setRescheduleDate('');
    setIsRescheduleOpen(true);
  };

  const submitReschedule = async () => {
    if (!rescheduleItem || !rescheduleDate) return toast.error("Pilih tanggal sidang ulang!");

    try {
        let scheduleId = null;
        const { data: existing } = await (supabase as any)
            .from('tpp_schedules')
            .select('id')
            .eq('tanggal_sidang', rescheduleDate)
            .limit(1)
            .single();
        
        if (existing) {
            scheduleId = existing.id;
        } else {
            const { data: newSched, error: schedErr } = await (supabase as any)
                .from('tpp_schedules')
                .insert({
                    tanggal_sidang: rescheduleDate,
                    jenis_sidang: 'Sidang Ulang',
                    status: 'Open',
                    kuota: 50 
                })
                .select()
                .single();
            if (schedErr) throw schedErr;
            scheduleId = newSched.id;
        }

        const { error } = await supabase
            .from('litmas')
            .update({
                status: 'TPP Scheduled',
                tpp_schedule_id: scheduleId,
                anev_notes: `[SIDANG ULANG] Dijadwalkan ulang ke tanggal ${formatDate(rescheduleDate)}`
            } as any)
            .eq('id_litmas', rescheduleItem.id_litmas);

        if (error) throw error;
        toast.success("Berhasil dijadwalkan ulang.");
        setIsRescheduleOpen(false);
    } catch (e: any) {
        toast.error("Gagal reschedule: " + e.message);
    }
  };

  const openDoc = (path: string) => {
    if(!path) return;
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    window.open(data.publicUrl, '_blank');
  };

  // --- FILTERING DATA ---
  const todayHearings = participants.filter(p => p.jadwal?.tanggal_sidang === todayStr && p.status === 'TPP Scheduled');
  const queueHearings = participants.filter(p => p.jadwal?.tanggal_sidang > todayStr && p.status === 'TPP Scheduled');
  const groupedQueue = queueHearings.reduce((groups: any, item: any) => {
    const date = item.jadwal?.tanggal_sidang;
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});
  const sortedQueueDates = Object.keys(groupedQueue).sort();
  const rejectedHearings = participants.filter(p => ['Ditolak', 'Hold'].includes(p.status));
  const finishedHearings = participants.filter(p => ['Disetujui', 'Selesai'].includes(p.status));
  
  // -- Active Schedules (Untuk Master Jadwal) --
  const activeSchedules = schedules.filter(s => new Date(s.tanggal_sidang) >= new Date(todayStr));

  // -- HISTORY LOGIC (GROUPING BY DATE) --
  // Ambil jadwal yang sudah lewat ( < today ) ATAU yang statusnya 'Closed'
  const historySchedulesList = schedules.filter(s => 
      new Date(s.tanggal_sidang) < new Date(todayStr) || s.status === 'Closed' || s.status === 'Cancelled'
  );

  // Group history by Date
  const historyGrouped = historySchedulesList.reduce((acc: any, curr) => {
      const dateKey = curr.tanggal_sidang;
      if (!acc[dateKey]) acc[dateKey] = [];
      
      // Inject litmas participants into schedule object for display
      const relatedLitmas = participants.filter(p => p.tpp_schedule_id === curr.id);
      acc[dateKey].push({ ...curr, litmas_list: relatedLitmas });
      return acc;
  }, {});

  // Helper Hitung Kuota Terisi
  const getRegisteredCount = (scheduleId: string) => {
      return participants.filter(p => p.tpp_schedule_id === scheduleId).length;
  };

  const handleOpenHistoryDetail = (schedule: TPPSchedule) => {
      setSelectedHistorySchedule(schedule);
      setIsHistoryDetailOpen(true);
  };

  return (
    <TestPageLayout
      title="Sidang TPP"
      description="Manajemen Jadwal, Antrian, dan Putusan Sidang"
      permissionCode="access_tpp" 
      icon={<Gavel className="w-8 h-8 text-primary" />}
    >
      <div className="space-y-6">
        
        <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6 h-auto p-1 bg-slate-100/80">
                <TabsTrigger value="today" className="py-2 text-xs md:text-sm">
                    Sidang Hari Ini
                    {todayHearings.length > 0 && <Badge className="ml-1 bg-blue-600 h-5 w-5 p-0 flex items-center justify-center">{todayHearings.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="queue" className="py-2 text-xs md:text-sm">
                    Antrian
                    {queueHearings.length > 0 && <Badge className="ml-1 bg-slate-500 h-5 w-5 p-0 flex items-center justify-center">{queueHearings.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="reschedule" className="py-2 text-xs md:text-sm data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900">
                    Sidang Ulang
                    {rejectedHearings.length > 0 && <Badge className="ml-1 bg-red-500 h-5 w-5 p-0 flex items-center justify-center">{rejectedHearings.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="history" className="py-2 text-xs md:text-sm">Riwayat Sidang</TabsTrigger>
                <TabsTrigger value="master" className="py-2 text-xs md:text-sm">Master Jadwal</TabsTrigger>
            </TabsList>

            {/* 1. SIDANG HARI INI */}
            <TabsContent value="today">
                <Card className="border-t-4 border-t-blue-600">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gavel className="w-5 h-5 text-blue-600"/> Agenda: {formatDateLong(todayStr)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {todayHearings.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded">Tidak ada sidang hari ini.</div>
                        ) : (
                            <ParticipantTable 
                                data={todayHearings} 
                                openDoc={openDoc} 
                                actionLabel="Putus Sidang"
                                onAction={handleOpenDecision}
                                actionVariant="default"
                            />
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* 2. ANTRIAN SIDANG */}
            <TabsContent value="queue">
                {sortedQueueDates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded border border-dashed">
                        <Layers className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                        Belum ada antrian sidang mendatang.
                    </div>
                ) : (
                    <Tabs defaultValue={sortedQueueDates[0]} className="w-full">
                        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                            <TabsList className="h-auto bg-transparent p-0 justify-start">
                                {sortedQueueDates.map((date) => (
                                    <TabsTrigger 
                                        key={date} 
                                        value={date}
                                        className="data-[state=active]:bg-white data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 border border-transparent px-4 py-2 mr-2 rounded-md"
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-semibold text-slate-500 uppercase">{new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}</span>
                                            <span className="font-bold">{formatDateShort(date)}</span>
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                        {sortedQueueDates.map((date) => (
                            <TabsContent key={date} value={date} className="mt-0 animate-in fade-in slide-in-from-left-2">
                                <Card>
                                    <CardHeader className="bg-slate-50 py-3 border-b flex flex-row items-center justify-between">
                                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                                            <Calendar className="w-4 h-4 text-blue-500"/>
                                            {formatDateLong(date)}
                                        </div>
                                        <Badge variant="secondary">{groupedQueue[date].length} Klien</Badge>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <ParticipantTable 
                                            data={groupedQueue[date]} 
                                            openDoc={openDoc} 
                                            hideAction={true} 
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </TabsContent>

            {/* 3. SIDANG ULANG */}
            <TabsContent value="reschedule">
                <Card className="border-t-4 border-t-orange-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                            <RefreshCw className="w-5 h-5"/> Perlu Jadwal Ulang
                        </CardTitle>
                        <CardDescription>Daftar sidang yang Ditolak atau di-Hold dan perlu dijadwalkan kembali.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {rejectedHearings.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded">Bersih. Tidak ada sidang ulang.</div>
                        ) : (
                            <ParticipantTable 
                                data={rejectedHearings} 
                                openDoc={openDoc} 
                                actionLabel="Jadwalkan Ulang"
                                onAction={handleOpenReschedule}
                                actionVariant="outline"
                                showStatus={true}
                            />
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* 4. RIWAYAT SIDANG (NEW FEATURE) */}
            <TabsContent value="history">
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
                            <History className="w-5 h-5"/> Arsip Pelaksanaan Sidang
                        </CardTitle>
                        <CardDescription>Daftar sidang yang telah lampau atau selesai dilaksanakan.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                        {Object.keys(historyGrouped).length === 0 ? (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl bg-slate-50/50">
                                Belum ada riwayat sidang.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(historyGrouped).map(([date, items]: [string, any]) => (
                                    <div key={date} className="relative">
                                        {/* Tanggal Sticky Header */}
                                        <div className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur py-2 px-4 rounded-md border mb-3 flex items-center gap-2 shadow-sm">
                                            <Calendar className="w-4 h-4 text-slate-500"/>
                                            <span className="font-bold text-slate-700">{formatDateIndo(date)}</span>
                                        </div>

                                        {/* List Item per Tanggal */}
                                        <div className="grid gap-3 pl-2 sm:pl-4">
                                            {items.map((item: TPPSchedule) => (
                                                <div key={item.id} className="bg-white border rounded-lg p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                                    
                                                    {/* Info Kiri */}
                                                    <div className="space-y-1 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-slate-800">{item.jenis_sidang}</h4>
                                                            <Badge className={
                                                                item.status === 'Closed' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                                                                item.status === 'Cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-100' : 
                                                                item.status === 'Dibatalkan' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                                                'bg-slate-100 text-slate-700'
                                                            }>
                                                                {item.status === 'Closed' ? 'Terlaksana' : item.status === 'Cancelled' ? 'Dibatalkan' : item.status === 'Dibatalkan' ? 'Dibatalkan' : 'Selesai'}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-sm text-slate-500 flex items-center gap-3">
                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {item.waktu_sidang || '09:00'}</span>
                                                            <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {item.litmas_list?.length || 0} Peserta</span>
                                                        </div>
                                                        
                                                        {/* Preview Peserta (Maksimal 3 nama) */}
                                                        {item.litmas_list && item.litmas_list.length > 0 && (
                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                {item.litmas_list.slice(0, 3).map((l: any) => (
                                                                    <span key={l.id_litmas} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border">
                                                                        {l.klien?.nama_klien}
                                                                    </span>
                                                                ))}
                                                                {item.litmas_list.length > 3 && (
                                                                    <span className="text-[10px] text-slate-400 self-center">+{item.litmas_list.length - 3} lainnya</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Tombol Detail */}
                                                    <Button variant="outline" size="sm" className="shrink-0" onClick={() => handleOpenHistoryDetail(item)}>
                                                        <FileText className="w-4 h-4 mr-2"/> Detail
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* 5. MASTER JADWAL */}
            <TabsContent value="master">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Slot Jadwal Dibuka</h3>
                    <Button onClick={() => setIsScheduleOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2"/> Buka Slot Baru
                    </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {activeSchedules.map((sch) => {
                        const filled = getRegisteredCount(sch.id);
                        const quota = sch.kuota || 50;
                        const percentage = Math.min((filled / quota) * 100, 100);

                        return (
                        <Card key={sch.id} className="border hover:shadow-md transition-shadow text-center relative group">
                            
                            {/* MENU DROPDOWN */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenEditSchedule(sch)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit & Kuota
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDeleteSchedule(sch.id)} className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <CardHeader className="py-4 bg-slate-50 border-b">
                                <CardTitle className="text-base">{formatDate(sch.tanggal_sidang)}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 pb-4 px-4">
                                <p className="text-xs text-muted-foreground uppercase font-bold mb-3">{new Date(sch.tanggal_sidang).toLocaleDateString('id-ID', { weekday: 'long' })}</p>
                                
                                {/* PROGRESS BAR KUOTA */}
                                <div className="space-y-1 mb-3">
                                    <div className="flex justify-between text-[10px] text-slate-600">
                                        <span>Terisi: {filled}</span>
                                        <span className="font-bold">Total: {quota}</span>
                                    </div>
                                    <Progress value={percentage} className={`h-2 ${percentage >= 100 ? 'bg-red-100' : 'bg-slate-100'}`} />
                                    {percentage >= 100 && <span className="text-[10px] text-red-600 font-bold">PENUH</span>}
                                </div>

                                <Badge variant="outline" className={`w-full justify-center ${sch.status === 'Dibatalkan' || sch.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' : ''}`}>
                                    {sch.status === 'Cancelled' ? 'Dibatalkan' : sch.status}
                                </Badge>
                            </CardContent>
                        </Card>
                    )})}
                </div>
            </TabsContent>
        </Tabs>

        {/* === MODALS === */}

        {/* 1. Modal Putusan */}
        <Dialog open={isDecisionOpen} onOpenChange={setIsDecisionOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Putusan Sidang</DialogTitle></DialogHeader>
                <div className="py-4 space-y-4">
                    <RadioGroup value={decision} onValueChange={(v: any) => setDecision(v)} className="grid grid-cols-3 gap-2">
                         <div className={`border p-3 rounded cursor-pointer text-center ${decision === 'Disetujui' ? 'border-green-500 bg-green-50' : ''}`} onClick={() => setDecision('Disetujui')}>
                            <CheckCircle className="w-6 h-6 mx-auto text-green-600 mb-1"/> <span className="text-xs font-bold">Setujui</span>
                         </div>
                         <div className={`border p-3 rounded cursor-pointer text-center ${decision === 'Ditolak' ? 'border-red-500 bg-red-50' : ''}`} onClick={() => setDecision('Ditolak')}>
                            <XCircle className="w-6 h-6 mx-auto text-red-600 mb-1"/> <span className="text-xs font-bold">Tolak</span>
                         </div>
                         <div className={`border p-3 rounded cursor-pointer text-center ${decision === 'Hold' ? 'border-orange-500 bg-orange-50' : ''}`} onClick={() => setDecision('Hold')}>
                            <RefreshCw className="w-6 h-6 mx-auto text-orange-500 mb-1"/> <span className="text-xs font-bold">Hold</span>
                         </div>
                    </RadioGroup>
                    <div className="space-y-2">
                        <Label>Catatan</Label>
                        <Textarea placeholder="Alasan putusan..." value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} />
                    </div>
                </div>
                <DialogFooter><Button onClick={submitDecision}>Simpan</Button></DialogFooter>
            </DialogContent>
        </Dialog>

        {/* 2. Modal Sidang Ulang */}
        <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Jadwal Sidang Ulang</DialogTitle>
                    <DialogDescription>Tentukan tanggal sidang baru untuk {rescheduleItem?.klien?.nama_klien}.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="bg-red-50 p-3 rounded border border-red-200 text-sm text-red-800">
                        <strong>Status Terakhir:</strong> {rescheduleItem?.status} <br/>
                        <strong>Catatan:</strong> {rescheduleItem?.anev_notes}
                    </div>
                    <div className="space-y-2">
                        <Label>Pilih Tanggal Baru</Label>
                        <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} min={todayStr} />
                        <p className="text-[10px] text-muted-foreground">*Slot jadwal akan otomatis dibuat (Quota 50) jika belum ada.</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={submitReschedule} className="bg-blue-600 hover:bg-blue-700">Simpan Jadwal</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* 3. Modal Bulk Jadwal */}
        <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Buka Slot Jadwal</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                    {/* Input Kuota */}
                    <div className="space-y-2">
                        <Label>Atur Slot / Kuota (Per Hari)</Label>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500"/>
                            <Input 
                                type="number" 
                                value={defaultQuota} 
                                onChange={(e) => setDefaultQuota(parseInt(e.target.value))} 
                                className="w-24"
                                min={1}
                            />
                            <span className="text-sm text-muted-foreground">klien</span>
                        </div>
                    </div>

                    <div className="border-t my-2"></div>

                    <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                            <Label>Tanggal</Label>
                            <Input type="date" value={tempDate} onChange={(e) => setTempDate(e.target.value)} min={todayStr} />
                        </div>
                        <Button onClick={addDateToList} variant="secondary">Tambah</Button>
                    </div>
                    <div className="bg-slate-50 p-2 rounded h-32 overflow-y-auto border grid grid-cols-2 gap-2">
                        {datesToSave.map(d => (
                            <Badge key={d} variant="outline" className="justify-between bg-white">{formatDate(d)}</Badge>
                        ))}
                        {datesToSave.length === 0 && <span className="text-xs text-center col-span-2 text-slate-400 py-4">Belum ada tanggal.</span>}
                    </div>
                </div>
                <DialogFooter><Button onClick={handleBulkCreateSchedule} disabled={datesToSave.length===0}>Simpan Semua</Button></DialogFooter>
            </DialogContent>
        </Dialog>

        {/* 4. Modal Edit Jadwal */}
        <Dialog open={isEditScheduleOpen} onOpenChange={setIsEditScheduleOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Jadwal Sidang</DialogTitle></DialogHeader>
                {editingSchedule && (
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Tanggal</Label>
                            <Input 
                                type="date" 
                                value={editingSchedule.tanggal_sidang} 
                                onChange={(e) => setEditingSchedule({...editingSchedule, tanggal_sidang: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Slot / Kuota</Label>
                            <Input 
                                type="number" 
                                value={editingSchedule.kuota} 
                                onChange={(e) => setEditingSchedule({...editingSchedule, kuota: parseInt(e.target.value)})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select 
                                value={editingSchedule.status} 
                                onValueChange={(v) => setEditingSchedule({...editingSchedule, status: v})}
                            >
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                    <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
                                    <SelectItem value="Selesai">Selesai</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button onClick={handleUpdateSchedule}>Simpan Perubahan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* 5. MODAL DETAIL RIWAYAT SIDANG */}
        <Dialog open={isHistoryDetailOpen} onOpenChange={setIsHistoryDetailOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <DialogTitle>{selectedHistorySchedule?.jenis_sidang}</DialogTitle>
                        <Badge className={selectedHistorySchedule?.status === 'Closed' ? 'bg-green-600' : 'bg-blue-600'}>
                            {selectedHistorySchedule?.status === 'Closed' ? 'Selesai' : 'Terjadwal'}
                        </Badge>
                    </div>
                    <DialogDescription>
                        {selectedHistorySchedule ? formatDateIndo(selectedHistorySchedule.tanggal_sidang) : '-'} | {selectedHistorySchedule?.waktu_sidang || '09:00'} WIB
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg border text-sm grid grid-cols-2 gap-4">
                        <div><span className="text-slate-500 block text-xs uppercase mb-1">Tempat</span><span className="font-medium">{selectedHistorySchedule?.tempat || 'Ruang Sidang TPP'}</span></div>
                        <div><span className="text-slate-500 block text-xs uppercase mb-1">Keterangan</span><span className="font-medium">{selectedHistorySchedule?.keterangan || '-'}</span></div>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Users className="w-4 h-4"/> Daftar Klien / Agenda</h4>
                        <ParticipantTable 
                            data={selectedHistorySchedule?.litmas_list || []} 
                            openDoc={openDoc} 
                            hideAction={true}
                            showStatus={true}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsHistoryDetailOpen(false)}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </TestPageLayout>
  );
}

// --- REUSABLE TABLE COMPONENT ---
function ParticipantTable({ data, openDoc, actionLabel, onAction, actionVariant = "default", hideAction = false, showStatus = false }: any) {
    if (data.length === 0) return <div className="text-center py-4 text-slate-500">Belum ada peserta.</div>;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[30%]">Klien</TableHead>
                    <TableHead className="w-[25%]">PK</TableHead>
                    {showStatus && <TableHead>Status</TableHead>}
                    <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item: any) => (
                    <TableRow key={item.id_litmas}>
                        <TableCell>
                            <div className="font-bold">{item.klien?.nama_klien}</div>
                            <div className="text-xs text-muted-foreground">{item.klien?.nomor_register_lapas}</div>
                            <Badge variant="outline" className="mt-1 text-[10px]">{item.jenis_litmas}</Badge>
                        </TableCell>
                        <TableCell>
                            <div className="text-sm">{item.petugas_pk?.nama}</div>
                            <div className="text-xs text-slate-400">{item.petugas_pk?.nip}</div>
                        </TableCell>
                        {showStatus && (
                            <TableCell>
                                <Badge className={
                                    item.status === 'Disetujui' ? 'bg-green-600' : 
                                    item.status === 'Ditolak' ? 'bg-red-600' : 
                                    item.status === 'Hold' ? 'bg-orange-500' : 
                                    item.status === 'Selesai' ? 'bg-slate-500' : 'bg-slate-500'
                                }>
                                    {item.status}
                                </Badge>
                            </TableCell>
                        )}
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                {item.hasil_litmas_url && (
                                    <Button size="sm" variant="ghost" onClick={() => openDoc(item.hasil_litmas_url)} title="Lihat Laporan">
                                        <FileText className="w-4 h-4 text-slate-500"/>
                                    </Button>
                                )}
                                {!hideAction && (
                                    <Button size="sm" variant={actionVariant as any} onClick={() => onAction(item)}>
                                        {actionLabel === 'Putus Sidang' ? <Gavel className="w-4 h-4 mr-2"/> : <RefreshCw className="w-4 h-4 mr-2"/>}
                                        {actionLabel}
                                    </Button>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}