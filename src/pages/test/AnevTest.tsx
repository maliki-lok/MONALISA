import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle2, XCircle, Search, BarChart3, ExternalLink } from "lucide-react"; // Tambah icon ExternalLink
import { Input } from "@/components/ui/input";
import { TestPageLayout } from "@/components/TestPageLayout"; 

export default function AnevTest() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // --- HELPER BARU: Generate URL ---
  const getDocUrl = (path: string | null) => {
    if (!path) return "#";
    // Jika sudah full URL (mungkin data lama), biarkan
    if (path.startsWith('http')) return path;
    
    // Generate Public URL dari Supabase Storage
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    return data.publicUrl;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
         setLoading(false);
         return; 
      }

      // 1. Ambil Antrian Review (Hanya milik Anev ini)
      const { data: dataReview, error: errReview } = await (supabase as any)
        .from('litmas')
        .select(`
          *,
          klien:klien!litmas_id_klien_fkey (nama_klien, nomor_register_lapas),
          petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama)
        `)
        .eq('status', 'Review')
        .eq('assigned_anev_id', user.id)
        .order('waktu_upload_laporan', { ascending: true });

      if (errReview) throw errReview;
      setReviews(dataReview || []);

      // 2. Ambil History (Hanya milik Anev ini)
      const { data: dataHistory, error: errHistory } = await (supabase as any)
        .from('litmas')
        .select(`
          *,
          klien:klien!litmas_id_klien_fkey (nama_klien, nomor_register_lapas),
          petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama)
        `)
        .not('status', 'in', '("New Task","On Progress","Review")') 
        .eq('assigned_anev_id', user.id)
        .order('created_at', { ascending: false });

      if (errHistory) throw errHistory;
      setHistory(dataHistory || []);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const updatePayload: any = { 
        status: 'Approved',
        waktu_verifikasi_anev: new Date().toISOString() // Gunakan nama kolom yang benar
      };

      const { error } = await supabase
        .from('litmas')
        .update(updatePayload)
        .eq('id_litmas', id);

      if (error) throw error;
      toast({ title: "Sukses", description: "Laporan disetujui." });
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleRevision = async (id: number) => {
    try {
      const updatePayload: any = { status: 'Revision' };
      
      const { error } = await supabase
        .from('litmas')
        .update(updatePayload)
        .eq('id_litmas', id);

      if (error) throw error;
      toast({ title: "Revisi", description: "Laporan dikembalikan ke PK untuk revisi." });
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const filteredReviews = reviews.filter(r => 
    r.klien?.nama_klien.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.jenis_litmas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TestPageLayout 
      title="Dashboard Anev" 
      description="Verifikasi dan monitoring laporan litmas yang masuk."
      permissionCode="access_anev"
      icon={<BarChart3 className="w-6 h-6" />}
    >
      <div className="space-y-6">
        
        {/* Statistik Ringkas */}
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Antrian Review</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{reviews.length}</div>
                    <p className="text-xs text-muted-foreground">Menunggu verifikasi Anda</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Diproses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{history.length}</div>
                    <p className="text-xs text-muted-foreground">Laporan selesai diverifikasi</p>
                </CardContent>
            </Card>
        </div>

        {/* Tabel Antrian Review */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Daftar Verifikasi Masuk</CardTitle>
                    <CardDescription>Laporan Litmas yang ditugaskan kepada Anda.</CardDescription>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Cari nama klien..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klien</TableHead>
                  <TableHead>Jenis Litmas</TableHead>
                  <TableHead>PK Pembuat</TableHead>
                  <TableHead>Waktu Upload</TableHead>
                  <TableHead>File Laporan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">Memuat data...</TableCell>
                    </TableRow>
                ) : filteredReviews.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Tidak ada antrian review saat ini.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredReviews.map((item) => (
                    <TableRow key={item.id_litmas}>
                        <TableCell className="font-medium">
                            {item.klien?.nama_klien}
                            <div className="text-xs text-muted-foreground">{item.klien?.nomor_register_lapas}</div>
                        </TableCell>
                        <TableCell>{item.jenis_litmas}</TableCell>
                        <TableCell>{item.petugas_pk?.nama}</TableCell>
                        <TableCell>
                            {item.waktu_upload_laporan ? new Date(item.waktu_upload_laporan).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                            {item.hasil_litmas_url ? (
                                // PERBAIKAN DISINI: Gunakan helper getDocUrl
                                <a 
                                  href={getDocUrl(item.hasil_litmas_url)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="flex items-center text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                >
                                    <FileText className="h-4 w-4 mr-1" /> Buka Laporan <ExternalLink className="h-3 w-3 ml-1"/>
                                </a>
                            ) : (
                                <span className="text-slate-400 italic">Belum upload</span>
                            )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleRevision(item.id_litmas)}>
                                <XCircle className="h-4 w-4 mr-1" /> Revisi
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(item.id_litmas)}>
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Setujui
                            </Button>
                        </TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabel Riwayat */}
        <Card>
            <CardHeader>
                <CardTitle>Riwayat Verifikasi</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Klien</TableHead>
                            <TableHead>Jenis Litmas</TableHead>
                            <TableHead>PK</TableHead>
                            <TableHead>Status Akhir</TableHead>
                            <TableHead>Tanggal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map((item) => (
                            <TableRow key={item.id_litmas}>
                                <TableCell>{item.klien?.nama_klien}</TableCell>
                                <TableCell>{item.jenis_litmas}</TableCell>
                                <TableCell>{item.petugas_pk?.nama}</TableCell>
                                <TableCell>
                                    <Badge variant={item.status === 'Approved' || item.status === 'TPP Registered' ? 'default' : 'secondary'}>
                                        {item.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                         {history.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada riwayat.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

      </div>
    </TestPageLayout>
  );
}