import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, History, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Helper lokal untuk format tanggal
const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const formatSidangDate = (isoString: string) => {
    if (!isoString) return { dateStr: '-', timeStr: '-' };
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = "09.00"; 
    return { dateStr, timeStr };
};

interface PKDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
}

export function PKDetailDialog({ isOpen, onOpenChange, task }: PKDetailDialogProps) {
  const openDoc = (path: string) => {
    if(!path) return;
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    window.open(data.publicUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
                <div className="flex items-center justify-between mr-8">
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600"/> Detail Litmas
                    </DialogTitle>
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-slate-50">
                        {task?.status}
                    </Badge>
                </div>
                <DialogDescription>Nomor Surat: <span className="font-mono text-slate-700">{task?.nomor_surat_permintaan}</span></DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
                {/* INFO GRID */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm bg-slate-50 p-5 rounded-lg border border-slate-100">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama Klien</span> 
                        <p className="font-semibold text-slate-800 text-base">{task?.klien?.nama_klien}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Jenis Litmas</span> 
                        <p className="font-medium text-slate-700">{task?.jenis_litmas}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Asal UPT</span> 
                        <p className="font-medium text-slate-700">{task?.asal_bapas}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">PK Penanggungjawab</span> 
                        <p className="font-medium text-slate-700">{task?.petugas_pk?.nama}</p>
                    </div>
                    
                    {task?.jadwal && (
                        <div className="col-span-2 mt-2 pt-3 border-t border-slate-200">
                            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block mb-1">Jadwal Sidang TPP</span>
                            <div className="flex items-center gap-2 text-purple-900 font-medium">
                                <Calendar className="w-4 h-4"/>
                                {formatSidangDate(task.jadwal.tanggal_sidang).dateStr}
                                <span className="text-slate-400 mx-1">|</span>
                                <Clock className="w-4 h-4"/>
                                Pukul {formatSidangDate(task.jadwal.tanggal_sidang).timeStr} WIB
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
                                    <span className="text-slate-400">{task?.surat_tugas_signed_url ? 'Sudah diupload' : 'Belum tersedia'}</span>
                                </div>
                            </div>
                            {task?.surat_tugas_signed_url && (
                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openDoc(task.surat_tugas_signed_url)}>
                                    <ExternalLink className="w-3 h-3 mr-1"/> Buka
                                </Button>
                            )}
                        </div>
                        
                        <div className="border p-3 rounded-md flex items-center justify-between hover:bg-blue-50/50 transition-colors border-blue-100 bg-blue-50/20">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-2 rounded"><FileText className="w-4 h-4 text-blue-600"/></div>
                                <div className="text-xs">
                                    <span className="block font-medium text-blue-800">Laporan Litmas</span>
                                    <span className="text-blue-400">{task?.hasil_litmas_url ? 'Siap diperiksa' : 'Belum upload'}</span>
                                </div>
                            </div>
                            {task?.hasil_litmas_url && (
                                <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => openDoc(task.hasil_litmas_url)}>
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
                        {[
                          { date: task?.waktu_registrasi, label: "Registrasi & Penunjukan PK", color: "bg-green-500", text: "text-slate-800" },
                          { date: task?.waktu_upload_surat_tugas, label: "PK: Upload Surat Tugas", color: "bg-green-500", text: "text-slate-800" },
                          { date: task?.waktu_upload_laporan, label: "PK: Upload Laporan Litmas", color: "bg-green-500", text: "text-slate-800" },
                          { date: task?.waktu_verifikasi_anev, label: "Anev: Verifikasi & Approval", color: "bg-green-500", text: "text-slate-800" },
                          { date: task?.waktu_sidang_tpp, label: "TPP: Sidang Dilaksanakan", color: "bg-purple-600", text: "text-slate-800" },
                          { date: task?.waktu_selesai, label: "Selesai", color: "bg-blue-600", text: "text-blue-700" }
                        ].map((item, idx) => (
                          <div key={idx} className="ml-8 relative">
                              <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${item.date ? item.color : 'bg-slate-200'}`}></div>
                              <div>
                                  <p className={`text-xs font-bold ${item.text}`}>{item.label}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(item.date)}</p>
                              </div>
                          </div>
                        ))}
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
}