import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, User, Shield, Key, CheckCircle, Menu, X, Settings, 
  Building2, Users, ClipboardList, BarChart3, Mail, Briefcase, 
  TrendingUp, FileText, LogOut, AlertTriangle, Lock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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

// --- DEFINISI MENU SIDEBAR ---
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
];

interface TestPageLayoutProps {
  title: string;
  description: string;
  permissionCode: string;
  icon: React.ReactNode;
  children?: React.ReactNode; 
}

export function TestPageLayout({ title, description, permissionCode, icon, children }: TestPageLayoutProps) {
  const { user, hasPermission, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const hasAccess = hasPermission(permissionCode);
  const accessibleMenus = menuItems.filter(item => hasPermission(item.permission));
  
  // @ts-ignore
  const fotoUrl = user?.employee?.foto_url;

  const handleConfirmSignOut = async () => {
    try {
        await signOut();
        toast({
            title: "Berhasil Logout",
            description: "Sampai jumpa kembali!",
            duration: 3000,
        });
        navigate('/login');
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Gagal Logout",
            description: "Terjadi kesalahan saat mencoba keluar.",
        });
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
          <img src="/favicon.ico" alt="Logo" className="w-5 h-5 object-contain" />
        </div>
        <span className="text-lg font-bold text-slate-800">MONALISA</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        <Button variant="ghost" className={cn("w-full justify-start mb-1", location.pathname === '/dashboard' ? "bg-slate-100 text-primary font-medium" : "text-slate-600 hover:text-primary hover:bg-slate-50")} onClick={() => navigate('/dashboard')}>
          <div className="w-5 h-5 mr-3 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
          </div>
          Dashboard
        </Button>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4 mb-2 px-3">Menu Aplikasi</div>
        {accessibleMenus.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Button key={item.path} variant={isActive ? "secondary" : "ghost"} className={cn("w-full justify-start mb-1", isActive ? "bg-slate-100 text-primary font-medium" : "text-slate-600 hover:text-primary hover:bg-slate-50")} onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}>
              <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary" : "text-slate-500")} />
              {item.label}
            </Button>
          );
        })}
      </div>
      <div className="p-4 border-t bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
             {fotoUrl ? <img src={fotoUrl} alt="User" className="w-full h-full object-cover" /> : <User className="w-6 h-6 m-2 text-slate-400" />}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.employee.nama}</p>
            <p className="text-xs text-slate-500 truncate">{user?.employee.jabatan || 'User'}</p>
          </div>
        </div>
        
        {/* MODIFIKASI: Tombol Logout dengan Konfirmasi */}
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
      <aside className="hidden md:block w-64 fixed inset-y-0 z-30 shadow-sm"><SidebarContent /></aside>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white animate-in slide-in-from-left duration-300 shadow-2xl">
             <div className="relative h-full flex flex-col">
                <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-50" onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5" /></Button>
                <SidebarContent />
             </div>
          </div>
        </div>
      )}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen transition-all duration-300">
        <header className="md:hidden bg-white border-b h-16 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-5 h-5 text-slate-700" /></Button>
             <span className="font-semibold text-lg tracking-tight text-slate-800">MONALISA</span>
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
          <div>
            <Button variant="outline" className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Dashboard
            </Button>
          </div>

          <Card className={cn("border-0 shadow-md overflow-hidden", !hasAccess ? "ring-2 ring-red-500/20" : "")}>
            <div className={cn("h-1.5 w-full", hasAccess ? "bg-primary" : "bg-red-500")}></div>
            <CardHeader className="bg-white">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", hasAccess ? "bg-primary/10 text-primary" : "bg-red-100 text-red-600")}>
                  {hasAccess ? icon : <Lock className="w-6 h-6" />}
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    {title}
                    {!hasAccess && <Badge variant="destructive" className="ml-2 font-normal text-xs">Akses Ditolak</Badge>}
                  </CardTitle>
                  <CardDescription className="mt-1">{description}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {!hasAccess ? (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Izin Diperlukan</AlertTitle>
              <AlertDescription>Anda memerlukan permission <code>{permissionCode}</code> untuk mengakses halaman ini.</AlertDescription>
            </Alert>
          ) : (
            /* Render konten form/halaman di sini jika akses diterima */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          )}

          {/* Debug Info selalu ditampilkan di bawah */}
          <Card className="border-0 shadow-sm bg-white mt-8 opacity-75 hover:opacity-100 transition-opacity">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-sm flex items-center gap-2 text-slate-500 uppercase tracking-wider font-bold">
                <Shield className="w-4 h-4" /> Debug Akses Control
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
               <div className="flex flex-wrap gap-2">
                 <Badge variant="outline">User: {user?.employee.nama}</Badge>
                 <Badge variant="outline">Roles: {user?.roles.join(', ') || '-'}</Badge>
                 <Badge variant={hasAccess ? "default" : "destructive"}>
                    Status: {hasAccess ? "GRANTED" : "DENIED"}
                 </Badge>
               </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}