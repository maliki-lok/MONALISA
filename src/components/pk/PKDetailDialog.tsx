import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, History, Calendar, Clock, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

// Import AnevSelector
import { AnevSelector } from "./AnevSelector"; 

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
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); 
    return { dateStr, timeStr };
};

interface PKDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onRefresh?: () => void;
}

export function PKDetailDialog({ isOpen, onOpenChange, task, onRefresh }: PKDetailDialogProps) {
  const { toast } = useToast();
  
  const [uploading, setUploading] = useState(false);
  const [fileLaporan, setFileLaporan] = useState<File | null>(null);
  const [selectedAnevId, setSelectedAnevId] = useState<string>("");
  const [anevName, setAnevName] = useState<string>(""); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper untuk cek apakah Anev sudah ada
  const existingAnevId = task?.assigned_anev_id || task?.id_anev;
  const isAnevAssigned = !!existingAnevId;

  // --- EFFECT: AMBIL NAMA ANEV SAAT DIALOG DIBUKA ---
  useEffect(() => {
    const fetchAnevName = async () => {
        setAnevName("");

        if (!existingAnevId || !isOpen) return;

        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    employees (
                        nama
                    )
                `)
                .eq('id', existingAnevId)
                .single();
            
            if (error) {
                console.error("Error fetch anev name:", error);
                return;
            }

            // @ts-ignore
            if (data?.employees?.nama) {
                // @ts-ignore
                setAnevName(data.employees.nama);
            } else {
                setAnevName("Nama Tidak Ditemukan");
            }

        } catch (err) {
            console.error("Gagal memuat nama Anev", err);
        }
    };

    fetchAnevName();
  }, [isOpen, task, existingAnevId]);

  if (!task) return null;

  // --- ACTIONS ---
  const openDoc = (path: string) => {
    if(!path) return;
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    window.open(data.publicUrl, '_blank');
  };

  const handleUploadLaporan = async () => {
    // 1. Validasi File
    if (!fileLaporan) {
      toast({ title: "File Kosong", description: "Mohon pilih file laporan hasil litmas (PDF/DOCX).", variant: "destructive" });
      return;
    }

    // 2. Tentukan ID Anev (Gunakan yang sudah ada ATAU yang baru dipilih)
    const targetAnevId = isAnevAssigned ? existingAnevId : selectedAnevId;

    if (!targetAnevId) {
      toast({ title: "Anev Belum Ditunjuk", description: "Wajib memilih Anev Verifikator sebelum mengirim.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // 3. Upload File ke Storage
      const fileExt = fileLaporan.name.split('.').pop();
      const fileName = `hasil_litmas/${task.id_litmas}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents') 
        .upload(fileName, fileLaporan);

      if (uploadError) throw new Error(`Gagal upload file: ${uploadError.message}`);

      // 4. Update Database
      // Jika Anev sudah ada (Revisi), jangan update kolom assigned_anev_id lagi (biar aman)
      const updatePayload: any = {
        status: 'Review', 
        hasil_litmas_url: fileName,
        waktu_upload_laporan: new Date().toISOString()
      };

      // Hanya masukkan assigned_anev_id jika ini penunjukan pertama kali
      if (!isAnevAssigned) {
        updatePayload.assigned_anev_id = targetAnevId;
      }

      const { error: updateError } = await supabase
        .from('litmas')
        .update(updatePayload)
        .eq('id_litmas', task.id_litmas);

      if (updateError) throw new Error(`Gagal update database: ${updateError.message}`);

      // --- 5. KIRIM NOTIFIKASI WA KE ANEV ---
      console.log("Memicu Notifikasi WA...");
      try {
          // Ambil Nama PK (Current User) untuk pesan WA
          const { data: { user } } = await supabase.auth.getUser();
          let currentPkName = "Petugas PK";
          
          if (user) {
            //@ts-ignore
              const { data: pkData } = await supabase.from('petugas_pk').select('nama').eq('user_id', user.id).maybeSingle();
              if (pkData) {
                  currentPkName = pkData.nama;
              } else {
                  //@ts-ignore
                  const { data: empData } = await supabase.from('users').select('employees(nama)').eq('id', user.id).maybeSingle();
                  //@ts-ignore
                  if (empData?.employees?.nama) currentPkName = empData.employees.nama;
              }
          }

          const { error: funcError } = await supabase.functions.invoke('notify-anev', {
              body: {
                  id_anev: targetAnevId, // Menggunakan ID yang sudah dipastikan di atas
                  nama_pk: currentPkName,
                  nama_klien: task?.klien?.nama_klien || "Tanpa Nama",
                  jenis_litmas: task?.jenis_litmas || "Laporan Litmas"
              }
          });

          if (funcError) {
              console.error("Gagal kirim notif WA:", funcError);
              toast({
                  variant: "default",
                  className: "bg-yellow-50 border-yellow-200 text-yellow-800",
                  title: "Laporan Terupload (WA Gagal)",
                  description: "Data tersimpan, namun gagal mengirim notifikasi WA ke Anev."
              });
          } else {
              toast({ 
                title: "Sukses!", 
                description: isAnevAssigned 
                    ? "Laporan Revisi berhasil dikirim ke Anev." 
                    : "Laporan dikirim dan Anev telah dinotifikasi." 
              });
          }

      } catch (notifErr) {
          console.error("Error logic notifikasi:", notifErr);
      }
      
      // 6. Reset & Close
      setFileLaporan(null);
      setSelectedAnevId("");
      onOpenChange(false);
      
      if (onRefresh) onRefresh();

    } catch (error: any) {
      toast({ title: "Gagal Memproses", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const { dateStr: sidangDate, timeStr: sidangTime } = formatSidangDate(task?.jadwal?.tanggal_sidang || task?.waktu_sidang_tpp);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            
            {/* HEADER */}
            <DialogHeader className="px-6 py-4 border-b bg-slate-50/50 shrink-0">
                <div className="flex items-start justify-between mr-6">
                    <div className="space-y-1">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <FileText className="w-5 h-5 text-blue-600"/> Detail Tugas Litmas
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            ID: <span className="font-mono font-medium text-slate-700">#{task?.id_litmas}</span> • 
                            No. Surat: <span className="font-mono font-medium text-slate-700">{task?.nomor_surat_permintaan || '-'}</span>
                        </DialogDescription>
                    </div>
                    <Badge variant={task?.status === 'Selesai' ? 'default' : 'outline'} className="text-sm px-3 py-1 uppercase tracking-wide">
                        {task?.status}
                    </Badge>
                </div>
            </DialogHeader>
            
            {/* CONTENT (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* KOLOM KIRI */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* 1. SEKSI UPLOAD (Visible on Progress / Revision) */}
                        {['On Progress', 'Revision'].includes(task?.status) && (
                            <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl shadow-sm space-y-5">
                                <div className="flex items-center gap-2 border-b border-blue-200 pb-3">
                                    <Upload className="w-5 h-5 text-blue-700"/>
                                    <h4 className="font-bold text-blue-900">
                                        {isAnevAssigned ? "Upload Revisi Laporan" : "Upload Laporan Hasil Litmas"}
                                    </h4>
                                </div>
                                
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* A. Selector Anev (HANYA MUNCUL JIKA ANEV BELUM ADA) */}
                                    {!isAnevAssigned && (
                                        <div className="space-y-2">
                                            <Label className="text-blue-900">Pilih Anev Verifikator <span className="text-red-500">*</span></Label>
                                            <div className="bg-white p-1 rounded-md border border-blue-200">
                                                <AnevSelector 
                                                    selectedAnevId={selectedAnevId} 
                                                    onSelect={setSelectedAnevId} 
                                                />
                                            </div>
                                            <p className="text-[10px] text-blue-600/80">
                                                *Sekali dipilih, Anev tidak dapat diubah.
                                            </p>
                                        </div>
                                    )}

                                    {/* Jika Anev sudah ada, tampilkan info statis (opsional, atau sembunyikan kolom ini) */}
                                    {isAnevAssigned && (
                                        <div className="space-y-2">
                                            <Label className="text-blue-900">Anev Verifikator</Label>
                                            <div className="bg-blue-100/50 p-2 rounded border border-blue-200 text-sm font-medium text-blue-800">
                                                {anevName || "Memuat..."}
                                            </div>
                                            <p className="text-[10px] text-blue-600/80 italic">
                                                Laporan revisi akan dikirim ke Anev ini.
                                            </p>
                                        </div>
                                    )}

                                    {/* B. File Input */}
                                    <div className="space-y-2">
                                        <Label className="text-blue-900">File Laporan (PDF) <span className="text-red-500">*</span></Label>
                                        <div 
                                            className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-[100px]
                                                ${fileLaporan ? 'bg-blue-100 border-blue-400' : 'bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300'}
                                            `}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept=".pdf,.doc,.docx"
                                                onChange={(e) => e.target.files && setFileLaporan(e.target.files[0])}
                                            />
                                            {fileLaporan ? (
                                                <div className="text-blue-700 font-semibold text-sm flex items-center gap-2 px-2">
                                                    <FileText className="w-4 h-4 shrink-0"/> 
                                                    <span className="truncate max-w-[150px]">{fileLaporan.name}</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <span className="text-xs font-semibold text-blue-600 block">Klik Upload</span>
                                                    <span className="text-[10px] text-blue-400">Max 5MB</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button 
                                        onClick={handleUploadLaporan} 
                                        disabled={uploading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                    >
                                        {uploading ? (
                                            "Mengirim..." 
                                        ) : (
                                            <><CheckCircle2 className="w-4 h-4 mr-2"/> Simpan & Kirim ke Anev</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* 2. CATATAN REVISI */}
                        {task?.status === 'Revision' && task?.anev_notes && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"/>
                                <div>
                                    <h5 className="font-bold text-amber-800 text-sm">Catatan Revisi dari Anev:</h5>
                                    <p className="text-amber-700 text-sm mt-1">{task.anev_notes}</p>
                                </div>
                            </div>
                        )}

                        {/* 3. INFO KLIEN GRID */}
                        <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500"/> Data Klien & Litmas
                            </h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama Klien</span> 
                                    <p className="font-semibold text-slate-800 text-base">{task?.klien?.nama_klien || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">No. Register</span> 
                                    <p className="font-mono text-slate-700 bg-white inline-block px-2 py-0.5 rounded border">{task?.klien?.nomor_register_lapas || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Jenis Litmas</span> 
                                    <p className="font-medium text-slate-700">{task?.jenis_litmas || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kategori Usia</span> 
                                    <Badge variant="secondary" className="font-normal text-xs">{task?.klien?.kategori_usia || '-'}</Badge>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Asal Permintaan</span> 
                                    <p className="font-medium text-slate-700">{task?.asal_bapas || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Anev (Verifikator)</span> 
                                    <p className={`font-medium ${isAnevAssigned ? 'text-blue-700' : 'text-slate-400'}`}>
                                        {isAnevAssigned ? (anevName || "Memuat nama...") : "Belum Ditunjuk"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 4. DAFTAR DOKUMEN */}
                        <div className="border rounded-lg p-5 bg-white shadow-sm">
                            <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-800">
                                <ExternalLink className="w-4 h-4 text-blue-600"/> Dokumen Terkait
                            </h4>
                            <div className="space-y-3">
                                {task?.surat_tugas_signed_url ? (
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100 hover:bg-slate-100 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-red-100 p-2 rounded text-red-600"><FileText className="w-4 h-4"/></div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">Surat Tugas (Signed)</p>
                                                <p className="text-[10px] text-slate-400">Uploaded: {formatDateTime(task.waktu_upload_surat_tugas)}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => openDoc(task.surat_tugas_signed_url)}>Lihat</Button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic px-2">Surat tugas belum diupload.</p>
                                )}

                                {task?.hasil_litmas_url ? (
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100 hover:bg-slate-100 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded text-blue-600"><FileText className="w-4 h-4"/></div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">Laporan Hasil Litmas</p>
                                                <p className="text-[10px] text-slate-400">Uploaded: {formatDateTime(task.waktu_upload_laporan)}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => openDoc(task.hasil_litmas_url)}>Lihat</Button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic px-2">Laporan hasil litmas belum diupload.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* KOLOM KANAN */}
                    <div className="space-y-6">
                        
                        {/* A. WIDGET JADWAL */}
                        {task?.jadwal ? (
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar className="w-24 h-24"/></div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-100 mb-4">Jadwal Sidang TPP</h4>
                                <div className="flex items-center gap-3 mb-2">
                                    <Calendar className="w-5 h-5 text-indigo-200"/>
                                    <span className="text-lg font-bold">{sidangDate}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-indigo-200"/>
                                    <span className="text-sm font-medium">{sidangTime} WIB</span>
                                </div>
                                <div className="mt-4 pt-3 border-t border-white/20 text-xs text-indigo-100">
                                    Jenis Sidang: {task?.jadwal?.jenis_sidang || 'Rutin'}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-100 rounded-xl p-5 text-center border border-slate-200 border-dashed">
                                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2"/>
                                <p className="text-sm font-medium text-slate-500">Belum Terjadwal</p>
                                <p className="text-xs text-slate-400">Menunggu persetujuan Anev</p>
                            </div>
                        )}

                        {/* B. TIMELINE HISTORY */}
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
                                  { date: task?.waktu_sidang_tpp || (task?.jadwal ? new Date(task.jadwal.tanggal_sidang).toISOString() : null), label: "TPP: Sidang Dilaksanakan", color: "bg-purple-600", text: "text-slate-800" },
                                  { date: task?.waktu_selesai, label: "Selesai", color: "bg-blue-600", text: "text-blue-700" }
                                ].map((item, idx) => (
                                  <div key={idx} className="ml-8 relative group">
                                      <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm transition-all duration-300
                                          ${item.date ? item.color : 'bg-slate-200 group-hover:bg-slate-300'}
                                      `}></div>
                                      
                                      <div className={!item.date ? 'opacity-50 grayscale' : ''}>
                                          <p className={`text-xs font-bold ${item.text}`}>{item.label}</p>
                                          <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                              {item.date ? formatDateTime(item.date) : '-'}
                                          </p>
                                      </div>
                                  </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t bg-slate-50 flex justify-end shrink-0">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
            </div>
        </DialogContent>
    </Dialog>
  );
}