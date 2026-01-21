import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileText, Calendar, RefreshCcw, Eye, UserCheck, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function KasieTest() {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. DETEKSI ROLE
  const isAdmin = hasRole('admin');
  const isKasieAnak = hasRole('kasi_bk_anak'); 
  const isKasieDewasa = hasRole('kasi_bk_dewasa');

  // Judul Dashboard
  const dashboardTitle = isAdmin 
    ? "Dashboard Kepala Seksi Bimbingan Klien (Administrator)" 
    : isKasieAnak 
      ? "Dashboard Kepala Seksi Bimbingan Klien Anak" 
      : "Dashboard Kepala Seksi Bimbingan Klien Dewasa";

  const fetchLitmasData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // 2. QUERY UTAMA
      // PERBAIKAN: Menghapus 'asal_upt' dari query 'klien'
      let query = (supabase.from('litmas') as any)
        .select(`
            *,
            klien:klien!fk_litmas_klien!inner (
                nama_klien,
                nomor_register_lapas,
                kategori_usia
            ),
            petugas_pk:petugas_pk!fk_litmas_pk (
                nama, nip
            ),
            upt ( nama_upt )
        `)
        .order('tanggal_surat_permintaan', { ascending: false });

      // 3. FILTER STRICT: HANYA BERDASARKAN KATEGORI USIA
      if (!isAdmin) {
        if (isKasieAnak) {
          // Kasie Anak -> Hanya Data Anak (Semua PK)
          query = query.eq('klien.kategori_usia', 'Anak');
        } else if (isKasieDewasa) {
          // Kasie Dewasa -> Hanya Data Dewasa (Semua PK)
          query = query.eq('klien.kategori_usia', 'Dewasa');
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
      
    } catch (error: any) {
      console.error("Fetch Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Gagal memuat data", 
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLitmasData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, isKasieAnak, isKasieDewasa]);

  return (
    <TestPageLayout
      title={dashboardTitle}
      description={`Monitoring seluruh berkas Litmas kategori ${isKasieAnak ? 'Anak' : isKasieDewasa ? 'Dewasa' : 'Semua'} tanpa memandang petugas PK.`}
      permissionCode="access_kasie"
      icon={<ShieldAlert className="w-8 h-8 text-primary" />}
    >
      <div className="grid gap-6">
        {/* Statistik Ringkas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-indigo-50 border-indigo-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-indigo-800">Total Berkas Seksi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-indigo-900">{tasks.length}</div>
                    <p className="text-xs text-indigo-600">
                      {isKasieAnak ? 'Klien Anak' : isKasieDewasa ? 'Klien Dewasa' : 'Total'}
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* Tabel Data Supervisi */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Daftar Supervisi Litmas</CardTitle>
                <CardDescription>
                  Data disaring otomatis berdasarkan Kategori Usia: <strong>{isKasieAnak ? 'ANAK' : isKasieDewasa ? 'DEWASA' : 'SEMUA'}</strong>.
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLitmasData} disabled={loading}>
                <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Surat</TableHead>
                  <TableHead>Identitas Klien</TableHead>
                  <TableHead>Asal UPT</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Petugas PK (PIC)</TableHead>
                  <TableHead>Jenis Litmas</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TableRow key={task.id_litmas}>
                      <TableCell className="font-medium">{task.nomor_surat_permintaan}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                            <span className="font-semibold">{task.klien?.nama_klien || 'Tanpa Nama'}</span>
                            <span className="text-xs text-slate-500">{task.klien?.nomor_register_lapas}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                         <span className="text-sm text-slate-600">{task.upt?.nama_upt || '-'}</span>
                      </TableCell>

                      <TableCell>
                        <Badge className={task.klien?.kategori_usia === 'Anak' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}>
                            {task.klien?.kategori_usia || 'Umum'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {task.petugas_pk ? (
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <UserCheck className="w-3 h-3 text-green-600" />
                                    <span className="text-sm font-medium text-slate-700">{task.petugas_pk.nama}</span>
                                </div>
                                <span className="text-xs text-slate-400 pl-5">{task.petugas_pk.nip}</span>
                            </div>
                        ) : (
                            <span className="text-red-500 text-xs italic bg-red-50 px-2 py-1 rounded inline-flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" />
                                Belum Ditunjuk
                            </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary">{task.jenis_litmas}</Badge>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {task.tanggal_surat_permintaan}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100">
                            <Eye className="w-4 h-4 text-slate-600" />
                            <span className="sr-only">Detail Supervisi</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                            <div className="bg-slate-100 p-3 rounded-full">
                                <FileText className="w-6 h-6 text-slate-400" />
                            </div>
                            <p>Tidak ada data litmas untuk kategori ini.</p>
                        </div>
                    </TableCell>
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