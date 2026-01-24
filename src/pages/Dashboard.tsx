import { useState, useEffect } from 'react';
import { WhatsNewDialog } from '@/components/WhatsNewDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  User, 
  Shield, 
  Key, 
  Settings,
  FileText,
  Briefcase,
  BarChart3,
  Mail,
  Building2,
  ClipboardList,
  TrendingUp,
  CheckCircle2,
  Menu,
  X,
  Activity,
  Loader2,
  Users,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Label
} from 'recharts';
// IMPORT BARU: AlertDialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { permission } from 'process';

// Definisi menu item
const menuItems = [
  { path: '/admin', permission: 'access_admin', label: 'Admin Panel', icon: Settings },
  { path: '/test/kabapas', permission: 'access_kabapas', label: 'Kabapas', icon: Building2 },
  { path: '/test/kasie', permission: 'access_kasie', label: 'Kasie', icon: Shield }, 
  { path: '/test/kasubsie', permission: 'access_kasubsie', label: 'Kasubsie', icon: Users },
  { path: '/test/operator-registrasi', permission: 'access_operator_registrasi', label: 'Registrasi', icon: ClipboardList },
  { path: '/test/anev', permission: 'access_anev', label: 'Anev', icon: BarChart3 },
  { path: '/test/pk', permission: 'access_pk', label: 'PK', icon: User },
  { path: '/test/persuratan', permission: 'access_persuratan', label: 'Persuratan', icon: Mail },
  { path: '/test/bimker', permission: 'access_bimker', label: 'Bimker', icon: Briefcase },
  { path: '/test/bimkemas', permission: 'access_bimkemas', label: 'Bimkemas', icon: Users },
  { path: '/test/tpp', permission: 'access_tpp', label: 'TPP', icon: TrendingUp },
  { path: '/test/laporan', permission: 'access_laporan', label: 'Laporan', icon: FileText },
  { path: '/about', permission:'access_admin', label: 'About', icon: Info},
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const { user, signOut, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- STATE DATA ---
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsKlien, setStatsKlien] = useState<any[]>([]);
  const [statsLitmasTrend, setStatsLitmasTrend] = useState<any[]>([]);
  const [statsLitmasJenis, setStatsLitmasJenis] = useState<any[]>([]);

  // --- FETCH DATA REAL ---
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoadingStats(true);
      try {
        // 1. Fetch Data Klien (untuk Demografi)
        const { data: rawKlien } = await supabase.from('klien').select('kategori_usia');
        
        // Proses hitung Anak vs Dewasa
        const klienCounts = (rawKlien || []).reduce((acc: any, curr) => {
          const kat = curr.kategori_usia || 'Tidak Diketahui';
          acc[kat] = (acc[kat] || 0) + 1;
          return acc;
        }, {});
        
        const chartDataKlien = Object.keys(klienCounts).map(key => ({
          name: key,
          value: klienCounts[key]
        }));
        setStatsKlien(chartDataKlien);

        // 2. Fetch Data Litmas (untuk Tren & Jenis)
        const { data: rawLitmas } = await supabase
          .from('litmas')
          .select('tanggal_diterima_bapas, jenis_litmas');

        // Proses Tren Bulanan
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const trendMap = new Array(12).fill(0).map((_, i) => ({ name: months[i], masuk: 0 }));
        
        (rawLitmas || []).forEach((l) => {
          if (l.tanggal_diterima_bapas) {
            const monthIdx = new Date(l.tanggal_diterima_bapas).getMonth();
            trendMap[monthIdx].masuk += 1;
          }
        });
        // Filter bulan yang ada datanya saja (opsional, atau tampilkan 6 bulan terakhir)
        // Disini kita tampilkan setahun penuh atau yang memiliki nilai > 0 jika ingin ringkas
        const currentMonth = new Date().getMonth();
        const trendDataToShow = trendMap.slice(0, currentMonth + 1); // Tampilkan sampai bulan ini
        setStatsLitmasTrend(trendDataToShow);

        // Proses Jenis Litmas
        const jenisCounts = (rawLitmas || []).reduce((acc: any, curr) => {
          const jenis = curr.jenis_litmas || 'Lainnya';
          acc[jenis] = (acc[jenis] || 0) + 1;
          return acc;
        }, {});

        const chartDataJenis = Object.keys(jenisCounts).map(key => ({
          name: key,
          value: jenisCounts[key]
        }));
        setStatsLitmasJenis(chartDataJenis);

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // UPDATE: Mengganti nama fungsi agar sesuai dengan snippet AlertDialog
  const handleConfirmSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const accessibleMenus = menuItems.filter(item => hasPermission(item.permission));
  // @ts-ignore
  const fotoUrl = user?.employee?.foto_url;

  // Komponen Sidebar Content
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="h-16 flex items-center px-6 border-b">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
          <img src="/favicon.ico" alt="Logo" className="w-5 h-5 object-contain" />
        </div>
        <span className="text-lg font-bold text-slate-800">MONALISA</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
          Menu Aplikasi
        </div>
        {accessibleMenus.length > 0 ? (
          accessibleMenus.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start mb-1",
                  isActive ? "bg-slate-100 text-primary font-medium" : "text-slate-600 hover:text-primary hover:bg-slate-50"
                )}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
              >
                <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary" : "text-slate-500")} />
                {item.label}
              </Button>
            );
          })
        ) : (
          <div className="px-3 py-4 text-sm text-slate-500 text-center bg-slate-50 rounded-lg mx-2 border border-dashed">
            Tidak ada akses menu
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
             {fotoUrl ? (
                <img src={fotoUrl} alt="User" className="w-full h-full object-cover" />
             ) : (
                <User className="w-6 h-6 m-2 text-slate-400" />
             )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.employee.nama}</p>
            <p className="text-xs text-slate-500 truncate">{user?.employee.jabatan || 'User'}</p>
          </div>
        </div>

        {/* UPDATE: Menggunakan AlertDialog untuk konfirmasi keluar */}
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100">
                    <LogOut className="w-4 h-4 mr-2" /> Keluar
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin keluar dari aplikasi? Sesi Anda akan diakhiri.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmSignOut} className="bg-red-600 hover:bg-red-700 text-white">
                        Ya, Keluar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <WhatsNewDialog />
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white animate-in slide-in-from-left duration-300">
             <div className="relative h-full">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-4 top-4 z-50" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
                <SidebarContent />
             </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b h-16 flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
               <Menu className="w-5 h-5" />
             </Button>
             <span className="font-semibold text-lg">MONALISA</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-8 space-y-8 max-w-5xl mx-auto w-full">
          
          {/* Welcome Message */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Selamat datang kembali di sistem manajemen.</p>
          </div>

          {/* User Profile Card - Simplified */}
          <Card className="mb-8 border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
                   {fotoUrl ? (
                      <img src={fotoUrl} alt={user?.employee.nama} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <User className="w-10 h-10 text-slate-400" />
                    )}
                </div>

                {/* User Details */}
                <div className="flex-1 text-center md:text-left space-y-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{user?.employee.nama}</h2>
                    <p className="text-slate-500 text-sm flex items-center justify-center md:justify-start gap-2">
                      <Briefcase className="w-3 h-3" />
                      {user?.employee.jabatan || 'Staff'} - {user?.employee.unit_kerja || 'Unit Kerja'}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                     <Badge variant="outline" className="font-mono text-xs text-slate-500 bg-slate-50">
                        NIP: {user?.employee.nip}
                     </Badge>
                     {user?.roles.map((role) => (
                        <Badge key={role} className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                          {role}
                        </Badge>
                     ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- INFOGRAPHICS SECTION --- */}
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <Activity className="w-5 h-5 text-primary" />
              Infografis Data Realtime
            </h2>
            
            {loadingStats ? (
               <div className="flex items-center justify-center h-48 bg-white/50 rounded-xl border border-dashed border-slate-300">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                     <Loader2 className="w-8 h-8 animate-spin text-primary" />
                     <span className="text-sm font-medium">Memuat data statistik...</span>
                  </div>
               </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Chart 1: Tren Litmas */}
                <Card className="border-0 shadow-md bg-white">
                  <CardHeader>
                    <CardTitle className="text-base font-medium text-slate-700">Tren Permintaan Litmas (Tahun Ini)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={statsLitmasTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="masuk" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Surat Masuk" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Chart 2: Jenis Litmas */}
                    <Card className="border-0 shadow-md bg-white">
                        <CardHeader>
                            <CardTitle className="text-base font-medium text-slate-700">Jenis Permintaan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                {statsLitmasJenis.length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                          <Pie data={statsLitmasJenis} cx="50%" cy="50%" innerRadius={50} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value">
                                              {statsLitmasJenis.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                          </Pie>
                                          <Tooltip />
                                          <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{fontSize: '10px'}}/>
                                      </PieChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada data</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Chart 3: Demografi Klien */}
                    <Card className="border-0 shadow-md bg-white">
                        <CardHeader>
                            <CardTitle className="text-base font-medium text-slate-700">Kategori Klien</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                {statsKlien.length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={statsKlien}>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                          <Tooltip cursor={{fill: 'transparent'}} />
                                          <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Jumlah" barSize={40} />
                                      </BarChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada data</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}