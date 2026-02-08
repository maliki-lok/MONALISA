import { useState, useEffect } from 'react';
import { WhatsNewDialog } from '@/components/WhatsNewDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  LogOut, User, Shield, Settings, FileText, Briefcase, BarChart3, Mail, Building2, 
  ClipboardList, TrendingUp, CheckCircle2, Menu, X, Activity, Loader2, Users, Info,
  AlertTriangle, Clock, Calendar as CalendarIcon, UserCheck, Key, Megaphone, MapPin, 
  ChevronRight, Sparkles, Circle, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell
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

// Interface untuk Berita & Kegiatan
interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface EventData {
  id: string;
  title: string;
  event_date: string;
  location: string;
}

// --- COLORS ---
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
const StatCard = ({ title, value, icon: Icon, description, colorClass = "text-slate-600", bgClass = "bg-slate-100", gradient }: any) => (
  <Card className={cn("shadow-sm border-0 transition-all hover:-translate-y-1 hover:shadow-md relative overflow-hidden group", gradient ? "text-white" : "bg-white")}>
    {gradient && <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", gradient)} />}
    <CardContent className="pt-6 relative z-10">
      <div className="flex justify-between items-start">
        <div>
          <p className={cn("text-sm font-medium mb-1", gradient ? "text-white/80" : "text-muted-foreground")}>{title}</p>
          <h3 className={cn("text-3xl font-bold tracking-tight", gradient ? "text-white" : "text-slate-800")}>{value}</h3>
          {description && <p className={cn("text-xs mt-2 flex items-center gap-1", gradient ? "text-white/70" : "text-slate-400")}>
             {description}
          </p>}
        </div>
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", gradient ? "bg-white/20 text-white" : bgClass)}>
          <Icon className={cn("h-6 w-6", gradient ? "text-white" : colorClass)} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// --- HELPER FUNCTION: Group Events by Date ---
const groupEventsByDate = (events: EventData[]) => {
  const groups: Record<string, EventData[]> = {};
  events.forEach(event => {
    const dateKey = new Date(event.event_date).toLocaleDateString('id-ID', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
    });
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
  });
  return groups;
};

// --- ROLE-SPECIFIC WIDGETS ---

const AdminStats = ({ stats }: { stats: { totalUser: number, totalRoles: number } }) => (
  <div className="space-y-4 mb-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard title="Total Pegawai" value={stats.totalUser} icon={Users} description="Pegawai terdaftar aktif" gradient="from-blue-600 to-blue-400" />
      <StatCard title="Role Akses" value={stats.totalRoles} icon={Key} description="Level otorisasi sistem" bgClass="bg-purple-100" colorClass="text-purple-600" />
      <StatCard title="Log Aktivitas" value="24" icon={Activity} description="Aktivitas hari ini" bgClass="bg-orange-100" colorClass="text-orange-600" />
      <StatCard title="Status Server" value="99%" icon={CheckCircle2} description="Uptime bulan ini" bgClass="bg-emerald-100" colorClass="text-emerald-600" />
    </div>
  </div>
);

const KabapasStats = ({ stats, trendData, pieData }: any) => (
  <div className="space-y-8 mb-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Permintaan" value={stats.total} icon={Briefcase} description="Total litmas masuk tahun ini" gradient="from-slate-800 to-slate-600" />
        <StatCard title="Sedang Berjalan" value={stats.onProgress} icon={Activity} description="Proses pengerjaan & review" bgClass="bg-blue-50" colorClass="text-blue-600" />
        <StatCard title="Revisi / Kendala" value={stats.revision} icon={AlertTriangle} description="Perlu perbaikan segera" bgClass="bg-rose-50" colorClass="text-rose-600" />
        <StatCard title="Selesai" value={stats.completed} icon={CheckCircle2} description="Laporan final disetujui" bgClass="bg-emerald-50" colorClass="text-emerald-600" />
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="border-0 shadow-lg bg-white lg:col-span-2">
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Tren Permintaan Litmas</CardTitle>
                    <CardDescription>Grafik jumlah surat permintaan masuk per bulan</CardDescription>
                </div>
                <Badge variant="outline" className="font-normal">Tahun Ini</Badge>
            </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    itemStyle={{ color: '#334155', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="masuk" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMasuk)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">Komposisi Jenis</CardTitle>
              <CardDescription>Distribusi kategori litmas</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="h-[320px] w-full flex items-center justify-center relative">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={pieData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={70} 
                                outerRadius={90} 
                                paddingAngle={5} 
                                dataKey="value"
                                cornerRadius={5}
                            >
                                {pieData.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }}/>
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 500}}/>
                        </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="text-sm text-slate-400">Belum ada data</div>}
                  
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                     <span className="text-3xl font-bold text-slate-700">{stats.total}</span>
                     <span className="text-xs text-slate-400 font-medium uppercase">Total</span>
                  </div>
              </div>
          </CardContent>
      </Card>
    </div>
  </div>
);

const SupervisorStats = ({ stats }: { stats: { needReview: number, tppScheduled: number, completionRate: number } }) => (
  <div className="space-y-4 mb-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Menunggu Verifikasi" value={stats.needReview} icon={FileText} description="Laporan masuk perlu review" gradient="from-amber-500 to-amber-300" />
      <StatCard title="Jadwal TPP" value={stats.tppScheduled} icon={Users} description="Siap untuk sidang TPP" bgClass="bg-teal-50" colorClass="text-teal-600" />
      <StatCard title="Tingkat Penyelesaian" value={`${stats.completionRate}%`} icon={TrendingUp} description="Rata-rata penyelesaian bulan ini" bgClass="bg-indigo-50" colorClass="text-indigo-600" />
    </div>
  </div>
);

const PKStats = ({ userName, stats }: { userName: string, stats: { active: number, revision: number, doneMonth: number, nearDeadline: number } }) => (
  <div className="space-y-4 mb-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard title="Tugas Aktif" value={stats.active} icon={Briefcase} description="Tugas yang sedang dikerjakan" gradient="from-blue-600 to-cyan-500" />
      <StatCard title="Perlu Revisi" value={stats.revision} icon={FileText} description="Dikembalikan oleh verifikator" bgClass="bg-rose-50" colorClass="text-rose-600" />
      <StatCard title="Deadline Dekat" value={stats.nearDeadline} icon={Clock} description="Kurang dari 3 hari" bgClass="bg-amber-50" colorClass="text-amber-600" />
      <StatCard title="Selesai Bulan Ini" value={stats.doneMonth} icon={CheckCircle2} description="Laporan berhasil disetujui" bgClass="bg-emerald-50" colorClass="text-emerald-600" />
    </div>
  </div>
);

const OperatorStats = ({ stats }: { stats: { inputToday: number, incomplete: number, totalKlien: number } }) => (
  <div className="space-y-4 mb-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Input Hari Ini" value={stats.inputToday} icon={CalendarIcon} description="Klien baru didaftarkan" gradient="from-emerald-600 to-teal-500" />
      <StatCard title="Status Baru" value={stats.incomplete} icon={AlertTriangle} description="Belum ditunjuk PK" bgClass="bg-amber-50" colorClass="text-amber-600" />
      <StatCard title="Total Database" value={stats.totalKlien} icon={Users} description="Total data klien tersimpan" bgClass="bg-slate-100" colorClass="text-slate-600" />
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

  // State untuk Realtime Content (Berita & Kegiatan)
  const [news, setNews] = useState<AnnouncementData[]>([]);
  const [eventsToday, setEventsToday] = useState<EventData[]>([]);
  const [eventsWeek, setEventsWeek] = useState<EventData[]>([]);

  // State untuk Dialog Berita
  const [selectedNews, setSelectedNews] = useState<AnnouncementData | null>(null);
  const [isDetailNewsOpen, setIsDetailNewsOpen] = useState(false);
  const [isAllNewsOpen, setIsAllNewsOpen] = useState(false);
  const [allNews, setAllNews] = useState<AnnouncementData[]>([]); // Untuk "Lihat Semua"
  const [loadingAllNews, setLoadingAllNews] = useState(false);

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
        // --- 0. BERITA & KEGIATAN (GENERAL) ---
        // Fetch Pengumuman (Limit 5)
        const { data: newsData } = await (supabase as any)
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(5);
        if (newsData) setNews(newsData);

        // Fetch Kegiatan (Hari ini & Minggu Ini)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();

        // Batas Akhir Minggu Ini (7 hari kedepan)
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString();

        // Query Semua Event >= Hari Ini
        const { data: eventData } = await (supabase as any)
            .from('events')
            .select('*')
            .gte('event_date', todayStr)
            .order('event_date', { ascending: true });
        
        if (eventData) {
            const evToday: EventData[] = [];
            const evWeek: EventData[] = [];
            
            eventData.forEach((ev: any) => {
                const evDate = new Date(ev.event_date);
                const isToday = evDate.getDate() === today.getDate() && 
                                evDate.getMonth() === today.getMonth() && 
                                evDate.getFullYear() === today.getFullYear();
                
                if (isToday) {
                    evToday.push(ev);
                } else if (evDate <= nextWeek) {
                    evWeek.push(ev);
                }
            });

            setEventsToday(evToday);
            setEventsWeek(evWeek);
        }

        // --- 1. ADMIN DATA (Only if Admin) ---
        if (hasRole('admin')) {
            const { count: employeeCount } = await supabase.from('employees').select('*', { count: 'exact', head: true });
            setAdminStats(prev => ({ ...prev, totalUser: employeeCount || 0, totalRoles: 12 })); 
        }

        // --- 2. OPERATOR DATA (Only if Operator) ---
        if (hasRole('op_reg_anak') || hasRole('op_reg_dewasa')) {
            const { data: rawKlienData } = await supabase.from('klien').select('id_klien, created_at');
            const rawKlien = (rawKlienData as unknown as KlienData[]) || [];
            
            const todayStrOnly = new Date().toISOString().split('T')[0];
            const inputTodayCount = rawKlien.filter(k => k.created_at && k.created_at.startsWith(todayStrOnly)).length;
            
            setOperatorStats(prev => ({
                ...prev,
                inputToday: inputTodayCount,
                totalKlien: rawKlien.length
            }));
        }

        // --- 3. LITMAS DATA (Shared Roles) ---
        if (hasRole('kabapas') || hasRole('kasie') || hasRole('kasubsie') || hasRole('pk') || hasRole('op_reg_anak') || hasRole('op_reg_dewasa')) {
            const { data: rawLitmasData } = await supabase
            .from('litmas')
            .select('id_litmas, jenis_litmas, status, tanggal_diterima_bapas, created_at, waktu_selesai, nama_pk');

            const allLitmas = (rawLitmasData as unknown as LitmasData[]) || [];

            // ... (Logic Stats Kabapas/Kasie/PK sama seperti sebelumnya) ...
            if (hasRole('kabapas')) {
                const total = allLitmas.length;
                const onProgress = allLitmas.filter(l => ['New Task', 'On Progress', 'Review'].includes(l.status || '')).length;
                const revision = allLitmas.filter(l => l.status === 'Revision').length;
                const completed = allLitmas.filter(l => ['Selesai', 'Approved'].includes(l.status || '')).length;
                setGlobalStats({ total, onProgress, revision, completed });

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

            if (hasRole('kasie') || hasRole('kasubsie')) {
                const total = allLitmas.length;
                const completed = allLitmas.filter(l => ['Selesai', 'Approved'].includes(l.status || '')).length;
                const needReview = allLitmas.filter(l => l.status === 'Review').length;
                const tppScheduled = allLitmas.filter(l => l.status === 'TPP Scheduled').length;
                const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                setSupervisorStats({ needReview, tppScheduled, completionRate: rate });
            }

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

  // --- HANDLE OPEN DETAIL NEWS ---
  const handleOpenNews = (item: AnnouncementData) => {
    setSelectedNews(item);
    setIsDetailNewsOpen(true);
  };

  // --- HANDLE OPEN ALL NEWS (FETCH) ---
  const handleOpenAllNews = async () => {
    setIsAllNewsOpen(true);
    if (allNews.length === 0) { // Fetch only if empty
        setLoadingAllNews(true);
        const { data } = await (supabase as any)
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        if (data) setAllNews(data);
        setLoadingAllNews(false);
    }
  };

  const handleConfirmSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const accessibleMenus = menuItems.filter(item => hasPermission(item.permission));

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white/90 backdrop-blur-xl border-r shadow-sm">
      {/* ... (Sidebar Content sama seperti sebelumnya) ... */}
      <div className="h-20 flex items-center px-6 border-b bg-white/50">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-200">
          <img src="/favicon.ico" alt="Logo" className="w-6 h-6 object-contain invert brightness-0 grayscale-0" style={{filter: 'brightness(0) invert(1)'}} />
        </div>
        <div>
            <span className="block text-lg font-black text-slate-800 tracking-tight leading-none">MONALISA</span>
            <span className="block text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-1">Dashboard Sistem</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">Menu Utama</div>
        {accessibleMenus.length > 0 ? accessibleMenus.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button 
                key={item.path} 
                variant="ghost" 
                className={cn(
                    "w-full justify-start mb-1.5 h-11 rounded-xl transition-all duration-200", 
                    isActive 
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50" 
                        : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                )} 
                onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
              >
                <Icon className={cn("w-5 h-5 mr-3 transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500")} />
                {item.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-blue-400 opacity-50"/>}
              </Button>
            );
        }) : <div className="px-3 py-4 text-sm text-slate-500 text-center bg-slate-50 rounded-lg mx-2 border border-dashed">Tidak ada akses menu</div>}
      </div>

      <div className="p-4 border-t bg-slate-50/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
             {fotoUrl ? <img src={fotoUrl} alt="User" className="w-full h-full object-cover" /> : <User className="w-6 h-6 m-2 text-slate-400" />}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
            <p className="text-xs text-slate-500 truncate font-medium">{userJabatan}</p>
          </div>
        </div>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 h-9 rounded-lg font-medium transition-colors">
                    <LogOut className="w-4 h-4 mr-2" /> Keluar Aplikasi
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                    <AlertDialogDescription>Apakah Anda yakin ingin keluar dari sesi ini?</AlertDialogDescription>
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

  // Group eventsWeek by Date for UI
  const groupedEventsWeek = groupEventsByDate(eventsWeek);

  return (
    <div className="flex min-h-screen bg-slate-50/30">
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/40 via-white to-slate-50/40 -z-10 pointer-events-none"/>
      
      <WhatsNewDialog />
      <aside className="hidden md:block w-72 fixed inset-y-0 z-30"><SidebarContent /></aside>
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white animate-in slide-in-from-left duration-300 shadow-2xl">
             <div className="relative h-full">
                <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-50" onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5" /></Button>
                <SidebarContent />
             </div>
          </div>
        </div>
      )}

      <main className="flex-1 md:pl-72 flex flex-col min-h-screen transition-all duration-300">
        {/* Header Mobile */}
        <header className="md:hidden bg-white/80 backdrop-blur-md border-b h-16 flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-5 h-5" /></Button><span className="font-bold text-lg text-slate-800">MONALISA</span></div>
        </header>

        <div className="p-4 sm:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          {/* Top Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                Dashboard Overview <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500 animate-pulse"/>
              </h1>
              <p className="text-slate-500 mt-1.5 font-medium">Selamat datang, <span className="text-blue-600">{userName}</span>. Berikut ringkasan hari ini.</p>
            </div>
            <div className="flex items-center gap-3">
                 <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400"/>
                    {new Date().toLocaleDateString('id-ID', {weekday: 'long', day:'numeric', month:'long', year:'numeric'})}
                 </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {loadingStats ? (
               <div className="flex items-center justify-center h-48 bg-white/60 backdrop-blur-sm rounded-2xl border border-dashed border-slate-300">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                     <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                     <span className="text-sm font-medium">Menyiapkan data statistik...</span>
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

          {/* Bottom Grid: News & Events */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
             
             {/* --- KOLOM KIRI: BERITA (Wide) --- */}
             <Card className="xl:col-span-2 border-0 shadow-lg bg-white overflow-hidden h-full min-h-[500px] flex flex-col">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 w-full"/>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Megaphone className="w-5 h-5 text-blue-600"/> Papan Pengumuman
                            </CardTitle>
                            <CardDescription>Berita & informasi internal terbaru</CardDescription>
                        </div>
                        {/* UPDATE: Tombol Lihat Semua */}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={handleOpenAllNews}
                        >
                            Lihat Semua <ArrowRight className="w-4 h-4 ml-1"/>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[400px] px-6 py-2">
                        <div className="space-y-4 pr-4 pb-4">
                            {news.length === 0 ? (
                                 <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 m-4">
                                     <Megaphone className="w-10 h-10 mb-2 opacity-20"/>
                                     <p className="text-sm font-medium">Belum ada pengumuman.</p>
                                 </div>
                            ) : (
                                 news.map((item, i) => (
                                    <div 
                                        key={item.id} 
                                        className="group relative bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 cursor-pointer"
                                        onClick={() => handleOpenNews(item)} // UPDATE: Klik untuk detail
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity"/>
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-lg">
                                                {item.title.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-800 text-base group-hover:text-blue-700 transition-colors">{item.title}</h4>
                                                    <Badge variant="secondary" className="font-normal text-[10px] bg-slate-100 text-slate-500">
                                                        {new Date(item.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-2">{item.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                 ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
             </Card>

             {/* --- KOLOM KANAN: KALENDER (Narrow) --- */}
             <Card className="border-0 shadow-lg bg-slate-900 text-white overflow-hidden h-full min-h-[500px] flex flex-col relative">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"/>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"/>

                <CardHeader className="relative z-10 pb-2">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <CalendarIcon className="w-5 h-5 text-orange-400"/> Agenda Kegiatan
                    </CardTitle>
                    <CardDescription className="text-slate-400">Jadwal kegiatan Bapas</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 relative z-10">
                    <Tabs defaultValue="today" className="w-full">
                        <div className="px-6 mb-4">
                            <TabsList className="grid w-full grid-cols-2 bg-white/10 text-slate-300">
                                <TabsTrigger value="today" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">Hari Ini</TabsTrigger>
                                <TabsTrigger value="week" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Minggu Ini</TabsTrigger>
                            </TabsList>
                        </div>
                        
                        <div className="px-6 pb-6 h-[380px] overflow-y-auto custom-scrollbar-dark">
                            <TabsContent value="today" className="mt-0 space-y-4">
                                {eventsToday.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-center bg-white/5 rounded-xl border border-white/5 p-6">
                                        <CalendarIcon className="w-8 h-8 mb-2 opacity-50"/>
                                        <p className="text-sm">Tidak ada jadwal hari ini.</p>
                                    </div>
                                ) : (
                                    eventsToday.map(event => (
                                        <div key={event.id} className="bg-white/10 p-4 rounded-xl border border-white/5 hover:bg-white/15 transition-colors flex gap-4 items-center">
                                            <div className="flex flex-col items-center bg-orange-500/20 text-orange-300 rounded-lg p-2 min-w-[50px]">
                                                 <span className="text-xs font-bold uppercase">{new Date(event.event_date).toLocaleDateString('id-ID', {weekday:'short'})}</span>
                                                 <span className="text-lg font-bold text-white">{new Date(event.event_date).getDate()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-semibold text-white truncate">{event.title}</h5>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-300">
                                                    <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded"><Clock className="w-3 h-3"/> {new Date(event.event_date).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                                                    {event.location && <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3"/> {event.location}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </TabsContent>

                            <TabsContent value="week" className="mt-0 space-y-6">
                                {eventsWeek.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-center bg-white/5 rounded-xl border border-white/5 p-6">
                                        <p className="text-sm">Tidak ada jadwal minggu ini.</p>
                                    </div>
                                ) : (
                                    Object.entries(groupedEventsWeek).map(([dateStr, items]) => (
                                        <div key={dateStr} className="space-y-2">
                                            <div className="flex items-center gap-2 sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10 py-1">
                                                <Circle className="w-2.5 h-2.5 fill-blue-500 text-blue-500"/>
                                                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">{dateStr}</span>
                                            </div>
                                            
                                            <div className="ml-3.5 border-l border-white/10 pl-4 space-y-3">
                                                {items.map(event => (
                                                    <div key={event.id} className="group flex flex-col gap-1 relative">
                                                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-slate-600 group-hover:border-orange-500 transition-colors"/>
                                                        <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{event.title}</p>
                                                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(event.event_date).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                                                            {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {event.location}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
             </Card>

          </div>
        </div>
      </main>

      {/* --- DIALOG DETAIL PENGUMUMAN (BARU) --- */}
      <Dialog open={isDetailNewsOpen} onOpenChange={setIsDetailNewsOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-200">
                        {selectedNews ? new Date(selectedNews.created_at).toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'}) : ''}
                    </Badge>
                </div>
                <DialogTitle className="text-2xl font-bold text-slate-900 leading-tight">
                    {selectedNews?.title}
                </DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <ScrollArea className="h-[300px] pr-4">
                    <div className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm">
                        {selectedNews?.content}
                    </div>
                </ScrollArea>
            </div>
            <DialogFooter>
                <Button onClick={() => setIsDetailNewsOpen(false)}>Tutup</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG LIHAT SEMUA PENGUMUMAN (BARU) --- */}
      <Dialog open={isAllNewsOpen} onOpenChange={setIsAllNewsOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
            <div className="px-6 py-4 border-b">
                <DialogTitle className="flex items-center gap-2 text-xl">
                    <Megaphone className="w-5 h-5 text-blue-600"/> Arsip Pengumuman
                </DialogTitle>
                <DialogDescription>
                    Daftar seluruh pengumuman dan berita internal.
                </DialogDescription>
            </div>
            <div className="flex-1 bg-slate-50/50 p-6 overflow-y-auto">
                {loadingAllNews ? (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin"/>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allNews.map(item => (
                            <Card 
                                key={item.id} 
                                className="cursor-pointer hover:shadow-md transition-all hover:border-blue-200"
                                onClick={() => handleOpenNews(item)} // Klik untuk detail
                            >
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="text-xs font-normal">
                                            {new Date(item.created_at).toLocaleDateString('id-ID')}
                                        </Badge>
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-2 line-clamp-1">{item.title}</h4>
                                    <p className="text-sm text-slate-500 line-clamp-3">{item.content}</p>
                                    <Button variant="link" className="p-0 h-auto mt-2 text-xs text-blue-600">Baca Selengkapnya</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
            <div className="p-4 border-t bg-white flex justify-end">
                <Button variant="outline" onClick={() => setIsAllNewsOpen(false)}>Tutup</Button>
            </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}