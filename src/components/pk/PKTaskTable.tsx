import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Upload, Clock, CheckCircle, CheckSquare, Eye, FileText } from 'lucide-react';
import { SuratTugasGenerator } from '@/components/litmas/SuratTugasGenerator';

interface PKTaskTableProps {
  tasks: any[];
  loading: boolean;
  onViewDetail: (task: any) => void;
  onUpload: (file: File, taskId: number, type: 'surat_tugas' | 'hasil_litmas') => void;
  onOpenRegister: (id: number) => void;
}

export function PKTaskTable({ tasks, loading, onViewDetail, onUpload, onOpenRegister }: PKTaskTableProps) {
  
  const getStatus = (status: string | null) => status || 'New Task';
  
  const formatSidangDate = (isoString: string) => {
    if (!isoString) return { dateStr: '-', timeStr: '-' };
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return { dateStr };
  };

  return (
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
        {tasks.length === 0 ? (
            <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                    {loading ? "Memuat data..." : "Tidak ada data yang cocok."}
                </TableCell>
            </TableRow>
        ) : (
            tasks.map((task) => {
                const status = getStatus(task.status);
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
                            status === 'Approved' ? 'bg-green-600 hover:bg-green-700' :
                            status === 'Revision' ? 'bg-orange-500 hover:bg-orange-600' :
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
                        onClick={() => onViewDetail(task)}
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
                    
                    {/* SURAT TUGAS: Masih boleh upload langsung karena tidak butuh Anev */}
                    {status === 'New Task' && (
                        <div className="space-y-2">
                            <div className="w-full"><SuratTugasGenerator litmasId={task.id_litmas} /></div>
                            <div className="relative w-full">
                                <Button size="sm" variant="secondary" className="w-full text-xs h-9 border shadow-sm font-medium">
                                    <Upload className="w-3 h-3 mr-2"/> Upload TTD
                                </Button>
                                <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0], task.id_litmas, 'surat_tugas')} />
                            </div>
                        </div>
                    )}

                    {/* LAPORAN LITMAS: KITA UBAH DISINI */}
                    {/* Hapus Input File Langsung, Ganti dengan Tombol Buka Dialog */}
                    {(status === 'On Progress' || status === 'Revision') && (
                        <div className="relative w-full">
                            <Button 
                                size="sm" 
                                className="bg-blue-600 w-full hover:bg-blue-700 text-xs h-9 shadow-sm font-medium"
                                onClick={() => onViewDetail(task)} // Buka dialog detail
                            >
                                <FileText className="w-3 h-3 mr-2"/> Upload Laporan
                            </Button>
                        </div>
                    )}

                    {status === 'Review' && (
                        <div className="w-full h-9 flex items-center justify-center gap-2 text-xs font-medium text-yellow-700 bg-yellow-50 rounded border border-yellow-100 select-none cursor-default">
                            <Clock className="w-3.5 h-3.5"/> Sedang Diverifikasi
                        </div>
                    )}

                    {status === 'Approved' && (
                        <Button size="sm" variant="outline" className="border-green-600 text-green-700 bg-green-50/50 w-full hover:bg-green-100 h-9 text-xs font-medium shadow-sm" onClick={() => onOpenRegister(task.id_litmas)}>
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
  );
}