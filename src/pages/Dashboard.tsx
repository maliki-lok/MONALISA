import { useState, useEffect } from 'react';
import { WhatsNewDialog } from '@/components/WhatsNewDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LogOut, User, Shield, Settings, FileText, Briefcase, BarChart3, Mail, Building2, 
  ClipboardList, TrendingUp, CheckCircle2, Menu, X, Activity, Loader2, Users, Info,
  AlertTriangle, Clock, Calendar, UserCheck, Key
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- INTERFACES ---
interface KlienData {
  id_klien: number;
  created_at: string;
  kategori_usia: string | null;
}

interface LitmasData {
  id_litmas: number;
  jenis_litmas: string | null;
  status: string | null;
  tanggal_diterima_bapas: string | null;
  created_at: string;
  waktu_selesai: string | null;
  nama_pk: string | null; // UUID string
}

// --- COLORS ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// --- MENU DEFINITION ---
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

// --- STAT CARD COMPONENT ---
const StatCard = ({ title, value, icon: Icon, description, colorClass = "text-slate-600", bgClass = "bg-slate-100" }: any) => (
  <Card className="shadow-sm border-t-4 border-t-transparent hover:border-t-primary transition-all bg-white">
    <CardContent className="pt-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-800">{value}</h3>
          {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
        </div>
        <div className={`h-12 w-12 ${bgClass} rounded-full flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${colorClass}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// --- ROLE-SPECIFIC WIDGETS ---

const AdminStats = ({ stats }: { stats: { totalUser: number, totalRoles: number } }) => (
  <div className="space-y-4 mb-8">
    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
      <Shield className="w-5 h-5 text-red-600"/> Panel Administrator
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard title="Total Pegawai" value={stats.totalUser} icon={Users} description="Data pegawai terdaftar" bgClass="bg-blue-100" colorClass="text-blue-600" />
      <StatCard title="Role Akses" value={stats.totalRoles} icon={Key} description="Level otorisasi aktif" bgClass="bg-purple-100" colorClass="text-purple-600" />
      <StatCard title="Aktivitas" value="-" icon={Activity} description="Log sistem" bgClass="bg-orange-100" colorClass="text-orange-600" />
      <StatCard title="Status Sistem" value="Online" icon={CheckCircle2} description="Koneksi DB Stabil" bgClass="bg-green-100" colorClass="text-green-600" />
    </div>
  </div>
);

const KabapasStats = ({ stats, trendData, pieData }: any) => (
  <div className="space-y-6 mb-8">
    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
      <Building2 className="w-5 h-5 text-primary"/> Eksekutif Dashboard
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Permintaan" value={stats.total} icon={Briefcase} description="Semua data masuk" bgClass="bg-slate-100" colorClass="text-slate-600" />
        <StatCard title="Sedang Berjalan" value={stats.onProgress} icon={Activity} description="Status proses/review" bgClass="bg-blue-100" colorClass="text-blue-600" />
        <StatCard title="Revisi/Kendala" value={stats.revision} icon={AlertTriangle} description="Dikembalikan" bgClass="bg-red-100" colorClass="text-red-600" />
        <StatCard title="Selesai" value={stats.completed} icon={CheckCircle2} description="Laporan Final" bgClass="bg-green-100" colorClass="text-green-600" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-md bg-white">
        <CardHeader><CardTitle className="text-base font-medium text-slate-700">Tren Permintaan Litmas</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
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
      <Card className="border-0 shadow-md bg-white">
          <CardHeader><CardTitle className="text-base font-medium text-slate-700">Jenis Permintaan</CardTitle></CardHeader>
          <CardContent>
              <div className="h-[300px] w-full">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                {pieData.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{fontSize: '10px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada data</div>}
              </div>
          </CardContent>
      </Card>
    </div>
  </div>
);

const SupervisorStats = ({ stats }: { stats: { needReview: number, tppScheduled: number, completionRate: number } }) => (
  <div className="space-y-4 mb-8">
    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
      <UserCheck className="w-5 h-5 text-indigo-600"/> Pengawasan & Verifikasi
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard title="Menunggu Verifikasi" value={stats.needReview} icon={FileText} description="Status: Review" bgClass="bg-yellow-100" colorClass="text-yellow-600" />
      <StatCard title="Tingkat Penyelesaian" value={`${stats.completionRate}%`} icon={TrendingUp} description="Rata-rata global" bgClass="bg-indigo-100" colorClass="text-indigo-600" />
      <StatCard title="Jadwal TPP" value={stats.tppScheduled} icon={Users} description="Status: TPP Scheduled" bgClass="bg-teal-100" colorClass="text-teal-600" />
    </div>
  </div>
);

const PKStats = ({ userName, stats }: { userName: string, stats: { active: number, revision: number, doneMonth: number, nearDeadline: number } }) => (
  <div className="space-y-4 mb-8">
    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
      <Briefcase className="w-5 h-5 text-blue-600"/> Tugas Saya ({userName})
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard title="Tugas Aktif" value={stats.active} icon={Activity} description="Perlu tindakan" bgClass="bg-blue-100" colorClass="text-blue-600" />
      <StatCard title="Mendekati Deadline" value={stats.nearDeadline} icon={Clock} description="< 3 Hari (Estimasi)" bgClass="bg-orange-100" colorClass="text-orange-600" />
      <StatCard title="Perlu Revisi" value={stats.revision} icon={FileText} description="Dikembalikan Kasie" bgClass="bg-red-100" colorClass="text-red-600" />
      <StatCard title="Selesai Bulan Ini" value={stats.doneMonth} icon={CheckCircle2} description="Laporan disetujui" bgClass="bg-green-100" colorClass="text-green-600" />
    </div>
  </div>
);

const OperatorStats = ({ stats }: { stats: { inputToday: number, incomplete: number, totalKlien: number } }) => (
  <div className="space-y-4 mb-8">
    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
      <ClipboardList className="w-5 h-5 text-emerald-600"/> Statistik Registrasi
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard title="Input Hari Ini" value={stats.inputToday} icon={Calendar} description="Data klien baru" bgClass="bg-emerald-100" colorClass="text-emerald-600" />
      <StatCard title="Status Baru" value={stats.incomplete} icon={AlertTriangle} description="Belum ditunjuk PK" bgClass="bg-yellow-100" colorClass="text-yellow-600" />
      <StatCard title="Total Klien" value={stats.totalKlien} icon={Users} description="Database klien" bgClass="bg-slate-100" colorClass="text-slate-600" />
    </div>
  </div>
);

// --- MAIN DASHBOARD COMPONENT ---
export default function Dashboard() {
  const { user, signOut, hasPermission, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State for data
  const [loadingStats, setLoadingStats] = useState(true);
  const [globalStats, setGlobalStats] = useState({ total: 0, onProgress: 0, revision: 0, completed: 0 });
  const [supervisorStats, setSupervisorStats] = useState({ needReview: 0, tppScheduled: 0, completionRate: 0 });
  const [pkStats, setPkStats] = useState({ active: 0, revision: 0, doneMonth: 0, nearDeadline: 0 });
  const [operatorStats, setOperatorStats] = useState({ inputToday: 0, incomplete: 0, totalKlien: 0 });
  const [adminStats, setAdminStats] = useState({ totalUser: 0, totalRoles: 0 });
  const [statsLitmasTrend, setStatsLitmasTrend] = useState<any[]>([]);
  const [statsLitmasJenis, setStatsLitmasJenis] = useState<any[]>([]);

  // User Info
  // @ts-ignore
  const fotoUrl = user?.employee?.foto_url;
  // @ts-ignore
  const userName = user?.employee?.nama || 'User';
  // @ts-ignore
  const userJabatan = user?.employee?.jabatan || 'Staff';

  // --- FETCH DATA LOGIC ---
  useEffect(() => {
    const fetchRealData = async () => {
      setLoadingStats(true);
      try {
        // --- 1. ADMIN DATA (Only if Admin) ---
        if (hasRole('admin')) {
            const { count: employeeCount } = await supabase.from('employees').select('*', { count: 'exact', head: true });
            setAdminStats(prev => ({ ...prev, totalUser: employeeCount || 0, totalRoles: 12 })); 
        }

        // --- 2. OPERATOR DATA (Only if Operator) ---
        if (hasRole('op_reg_anak') || hasRole('op_reg_dewasa')) {
            const { data: rawKlienData } = await supabase.from('klien').select('id_klien, created_at');
            const rawKlien = (rawKlienData as unknown as KlienData[]) || [];
            
            const today = new Date().toISOString().split('T')[0];
            const inputTodayCount = rawKlien.filter(k => k.created_at && k.created_at.startsWith(today)).length;
            
            setOperatorStats(prev => ({
                ...prev,
                inputToday: inputTodayCount,
                totalKlien: rawKlien.length
            }));
        }

        // --- 3. LITMAS DATA (Shared for Kabapas, Kasie, PK, Operator) ---
        if (hasRole('kabapas') || hasRole('kasie') || hasRole('kasubsie') || hasRole('pk') || hasRole('op_reg_anak') || hasRole('op_reg_dewasa')) {
            const { data: rawLitmasData } = await supabase
            .from('litmas')
            .select('id_litmas, jenis_litmas, status, tanggal_diterima_bapas, created_at, waktu_selesai, nama_pk');

            const allLitmas = (rawLitmasData as unknown as LitmasData[]) || [];

            // Kabapas Logic
            if (hasRole('kabapas')) {
                const total = allLitmas.length;
                const onProgress = allLitmas.filter(l => ['New Task', 'On Progress', 'Review'].includes(l.status || '')).length;
                const revision = allLitmas.filter(l => l.status === 'Revision').length;
                const completed = allLitmas.filter(l => ['Selesai', 'Approved'].includes(l.status || '')).length;
                setGlobalStats({ total, onProgress, revision, completed });

                // Charts
                const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
                const trendMap = new Array(12).fill(0).map((_, i) => ({ name: months[i], masuk: 0 }));
                allLitmas.forEach((l) => {
                    const dateRef = l.tanggal_diterima_bapas || l.created_at;
                    if (dateRef) {
                        const mIdx = new Date(dateRef).getMonth();
                        if (mIdx >= 0 && mIdx < 12) trendMap[mIdx].masuk += 1;
                    }
                });
                const currentMonthIdx = new Date().getMonth();
                setStatsLitmasTrend(trendMap.slice(0, currentMonthIdx + 1));

                const jenisCounts = allLitmas.reduce((acc: any, curr) => {
                    const jenis = curr.jenis_litmas || 'Lainnya';
                    acc[jenis] = (acc[jenis] || 0) + 1;
                    return acc;
                }, {});
                setStatsLitmasJenis(Object.keys(jenisCounts).map(key => ({ name: key, value: jenisCounts[key] })));
            }

            // Supervisor Logic (Kasie/Kasubsie)
            if (hasRole('kasie') || hasRole('kasubsie')) {
                const total = allLitmas.length;
                const completed = allLitmas.filter(l => ['Selesai', 'Approved'].includes(l.status || '')).length;
                const needReview = allLitmas.filter(l => l.status === 'Review').length;
                const tppScheduled = allLitmas.filter(l => l.status === 'TPP Scheduled').length;
                const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                setSupervisorStats({ needReview, tppScheduled, completionRate: rate });
            }

            // PK Logic
            if (hasRole('pk') && user?.id) {
                const myLitmas = allLitmas.filter(l => l.nama_pk === user.id); 
                const myActive = myLitmas.filter(l => !['Selesai', 'Approved'].includes(l.status || '')).length;
                const myRevision = myLitmas.filter(l => l.status === 'Revision').length;
                
                const currentMonth = new Date().getMonth();
                const myDoneMonth = myLitmas.filter(l => {
                    if (!['Selesai', 'Approved'].includes(l.status || '') || !l.waktu_selesai) return false;
                    return new Date(l.waktu_selesai).getMonth() === currentMonth;
                }).length;

                setPkStats({ active: myActive, revision: myRevision, doneMonth: myDoneMonth, nearDeadline: 0 });
            }

            // Operator Logic (Update Incomplete)
            if (hasRole('op_reg_anak') || hasRole('op_reg_dewasa')) {
                const newTasks = allLitmas.filter(l => l.status === 'New Task').length;
                setOperatorStats(prev => ({ ...prev, incomplete: newTasks }));
            }
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchRealData();
  }, [user]);

  const handleConfirmSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const accessibleMenus = menuItems.filter(item => hasPermission(item.permission));

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="h-16 flex items-center px-6 border-b">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
          <img src="/favicon.ico" alt="Logo" className="w-5 h-5 object-contain" />
        </div>
        <span className="text-lg font-bold text-slate-800">MONALISA</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">Menu Aplikasi</div>
        {accessibleMenus.length > 0 ? accessibleMenus.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button key={item.path} variant={isActive ? "secondary" : "ghost"} className={cn("w-full justify-start mb-1", isActive ? "bg-slate-100 text-primary font-medium" : "text-slate-600 hover:text-primary hover:bg-slate-50")} onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}>
                <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary" : "text-slate-500")} />
                {item.label}
              </Button>
            );
        }) : <div className="px-3 py-4 text-sm text-slate-500 text-center bg-slate-50 rounded-lg mx-2 border border-dashed">Tidak ada akses menu</div>}
      </div>
      <div className="p-4 border-t bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
             {fotoUrl ? <img src={fotoUrl} alt="User" className="w-full h-full object-cover" /> : <User className="w-6 h-6 m-2 text-slate-400" />}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
            <p className="text-xs text-slate-500 truncate">{userJabatan}</p>
          </div>
        </div>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100">
                    <LogOut className="w-4 h-4 mr-2" /> Keluar
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                    <AlertDialogDescription>Apakah Anda yakin ingin keluar dari aplikasi?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmSignOut} className="bg-red-600 hover:bg-red-700 text-white">Ya, Keluar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <WhatsNewDialog />
      <aside className="hidden md:block w-64 fixed inset-y-0 z-30"><SidebarContent /></aside>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white animate-in slide-in-from-left duration-300">
             <div className="relative h-full">
                <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-50" onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5" /></Button>
                <SidebarContent />
             </div>
          </div>
        </div>
      )}

      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="md:hidden bg-white border-b h-16 flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-5 h-5" /></Button><span className="font-semibold text-lg">MONALISA</span></div>
        </header>

        <div className="p-4 sm:p-8 space-y-8 max-w-5xl mx-auto w-full">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1">Selamat datang kembali, <span className="font-semibold text-primary">{userName}</span>!</p>
          </div>

          <Separator />

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loadingStats ? (
               <div className="flex items-center justify-center h-48 bg-white/50 rounded-xl border border-dashed border-slate-300">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                     <Loader2 className="w-8 h-8 animate-spin text-primary" />
                     <span className="text-sm font-medium">Memuat data statistik...</span>
                  </div>
               </div>
            ) : (
                <>
                    {hasRole('admin') && <AdminStats stats={adminStats} />}
                    {hasRole('kabapas') && <KabapasStats stats={globalStats} trendData={statsLitmasTrend} pieData={statsLitmasJenis} />}
                    {(hasRole('kasie') || hasRole('kasubsie')) && <SupervisorStats stats={supervisorStats} />}
                    {hasRole('pk') && <PKStats userName={userName} stats={pkStats} />}
                    {(hasRole('op_reg_anak') || hasRole('op_reg_dewasa')) && <OperatorStats stats={operatorStats} />}
                </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card className="border-none shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <CardHeader><CardTitle>Berita & Pengumuman</CardTitle><CardDescription className="text-slate-300">Update terbaru dari internal Bapas</CardDescription></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 bg-white/10 p-3 rounded-lg border border-white/10">
                            <div className="bg-blue-500/20 p-2 rounded text-blue-300"><FileText className="w-4 h-4"/></div>
                            <div><h4 className="font-semibold text-sm">Update Sistem MONALISA v2.0</h4><p className="text-xs text-slate-400 mt-1">Pembaruan fitur tanda tangan elektronik.</p></div>
                        </div>
                    </div>
                </CardContent>
             </Card>
             <Card>
                <CardHeader><CardTitle>Kalender Kegiatan</CardTitle><CardDescription>Jadwal agenda minggu ini</CardDescription></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2"><div className="flex items-center gap-3"><span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded w-16 text-center">Senin</span><span className="text-sm text-slate-700">Apel Pagi</span></div><span className="text-xs text-slate-400">07:30 WIB</span></div>
                        <div className="flex justify-between items-center border-b pb-2"><div className="flex items-center gap-3"><span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded w-16 text-center">Rabu</span><span className="text-sm text-slate-700">Sidang TPP</span></div><span className="text-xs text-slate-400">09:00 WIB</span></div>
                    </div>
                </CardContent>
             </Card>
          </div>

        </div>
      </main>
    </div>
  );
}