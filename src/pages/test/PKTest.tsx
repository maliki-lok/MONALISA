import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, FileText, Calendar, RefreshCcw, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function PKTest() {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]); // Gunakan any[] agar aman dari error tipe
  const [loading, setLoading] = useState(false);

  // Cek apakah user adalah admin
  const isAdmin = hasRole('admin');

  const fetchMyTasks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let pkId = null;

      // 1. LOGIKA ID PETUGAS (Khusus Non-Admin)
      if (!isAdmin) {
        const { data: pkData, error: pkError } = await supabase
          .from('petugas_pk')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (pkError) throw pkError;

        if (!pkData) {
          setTasks([]);
          setLoading(false);
          return;
        }
        pkId = pkData.id;
      }

      // 2. QUERY UTAMA
      // FIX TYPESCRIPT ERROR: Deklarasikan 'query' sebagai 'any' untuk memutus validasi tipe rekursif
      let query: any = supabase
        .from('litmas')
        .select(`
            *,
            klien:klien!fk_litmas_klien (
                nama_klien,
                nomor_register_lapas,
                kategori_usia
            ),
            petugas_pk:petugas_pk!fk_litmas_pk (
                nama, nip
            )
        `)
        .order('id_litmas', { ascending: false });

      // 3. FILTERING
      // Jika Admin: Filter ini DILEWATI (melihat semua)
      // Jika PK: Filter 'nama_pk' diterapkan
      if (!isAdmin && pkId) {
        query = query.eq('nama_pk', pkId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setTasks(data || []);
      
    } catch (error: any) {
      console.error("Fetch Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Gagal memuat tugas", 
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  return (
    <TestPageLayout
      title="Dashboard PK"
      description={isAdmin ? "Mode Administrator: Menampilkan seluruh data Litmas." : "Daftar tugas Litmas yang ditugaskan kepada Anda."}
      permissionCode="access_pk"
      icon={<User className="w-8 h-8 text-primary" />}
    >
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800">Total Tugas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{tasks.length}</div>
                    <p className="text-xs text-blue-600">Litmas {isAdmin ? 'Terdaftar' : 'Aktif'}</p>
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Daftar Litmas {isAdmin ? '(Semua Petugas)' : 'Saya'}</CardTitle>
                <CardDescription>
                  {isAdmin 
                    ? 'Anda memiliki akses penuh untuk melihat semua litmas yang sedang berjalan.' 
                    : 'Hanya menampilkan data litmas yang ditugaskan kepada Anda.'}
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchMyTasks} disabled={loading}>
                <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Surat</TableHead>
                  <TableHead>Nama Klien</TableHead>
                  {isAdmin && <TableHead>Petugas PK</TableHead>}
                  <TableHead>Jenis Litmas</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tgl Permintaan</TableHead>
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
                            <span className="text-xs text-slate-500">{task.klien?.nomor_register_lapas || '-'}</span>
                        </div>
                      </TableCell>
                      
                      {isAdmin && (
                        <TableCell>
                            {task.petugas_pk ? (
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-blue-700">{task.petugas_pk.nama}</span>
                                    <span className="text-xs text-slate-500">{task.petugas_pk.nip}</span>
                                </div>
                            ) : (
                                <span className="text-red-500 text-xs italic">Belum ditunjuk</span>
                            )}
                        </TableCell>
                      )}

                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50">{task.jenis_litmas}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={task.klien?.kategori_usia === 'Anak' ? 'bg-orange-500' : 'bg-blue-600'}>
                            {task.klien?.kategori_usia || 'Umum'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {task.tanggal_surat_permintaan}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4 text-slate-600" />
                            <span className="sr-only">Lihat Detail</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                            <FileText className="w-8 h-8 text-slate-300" />
                            <p>Tidak ada tugas litmas yang ditemukan.</p>
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