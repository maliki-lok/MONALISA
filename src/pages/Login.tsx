import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Eye, EyeOff, User, Lock, Fingerprint, CheckCircle2 } from 'lucide-react'; // Tambah icon CheckCircle2
import { z } from 'zod';

// --- Logic & Schema (Tidak Diubah) ---
const loginSchema = z.object({
  nip: z.string().min(1, 'NIP harus diisi').regex(/^\d+$/, 'NIP hanya boleh berisi angka'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export default function Login() {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ nip?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // State baru untuk animasi selamat datang
  const [showWelcome, setShowWelcome] = useState(false);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // --- Modifikasi useEffect Navigasi ---
  useEffect(() => {
    // Hanya redirect jika user ada, DAN animasi welcome TIDAK sedang berjalan
    if (user && !showWelcome && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from, showWelcome, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    const result = loginSchema.safeParse({ nip, password });
    if (!result.success) {
      const errors: { nip?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'nip') errors.nip = err.message;
        if (err.path[0] === 'password') errors.password = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);

    const { error: signInError } = await signIn(nip, password);

    if (signInError) {
      setError(signInError);
      setIsLoading(false);
    } else {
      // --- Login Sukses: Jalankan Animasi ---
      setShowWelcome(true);
      setIsLoading(false); // Stop loading button, start welcome animation

      // Tunggu 2 detik untuk menampilkan animasi, baru redirect
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 relative">
      
      {/* --- ANIMASI SELAMAT DATANG (OVERLAY) --- */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          <div className="text-center space-y-4 animate-in zoom-in-50 slide-in-from-bottom-10 duration-500 fill-mode-forwards">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                 <CheckCircle2 className="h-10 w-10 text-green-600 animate-in spin-in-180 duration-700" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Login Berhasil!</h2>
              <p className="text-muted-foreground text-lg">
                Selamat datang kembali di MONALISA...
              </p>
            </div>
            {/* Loading bar kecil untuk visualisasi redirect */}
            <div className="w-48 h-1.5 bg-muted rounded-full mx-auto overflow-hidden mt-6">
                <div className="h-full bg-primary animate-in slide-in-from-left duration-[2000ms] w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Kolom Kiri: Form Area */}
      <div className="flex flex-col justify-center p-8 md:p-12 lg:p-24 bg-background animate-in fade-in slide-in-from-left-4 duration-700">
        <div className="w-full max-w-sm mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col space-y-2 text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-2xl mb-4 shadow-sm">
               <img 
                  src="/favicon.ico" 
                  alt="Logo" 
                  className="w-10 h-10 object-contain" 
                />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              MONALISA
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitoring dan Evaluasi Kinerja Layanan Publik
            </p>
          </div>

          <Card className="border-0 shadow-none sm:border sm:shadow-lg">
             <CardHeader className="space-y-1 pb-2">
                <CardTitle className="text-xl text-center">Login Pegawai</CardTitle>
                <CardDescription className="text-center">
                   Masuk menggunakan NIP dan Password
                </CardDescription>
             </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Global Error Alert */}
                {error && (
                  <Alert variant="destructive" className="animate-in zoom-in-95 duration-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Input NIP */}
                <div className="space-y-2">
                  <Label htmlFor="nip" className={validationErrors.nip ? 'text-destructive' : ''}>
                    NIP
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="nip"
                      type="text"
                      placeholder="Nomor Induk Pegawai"
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      disabled={isLoading || showWelcome}
                      className={`pl-10 transition-all ${validationErrors.nip ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'}`}
                    />
                  </div>
                  {validationErrors.nip && (
                    <p className="text-[0.8rem] font-medium text-destructive animate-in slide-in-from-top-1">
                      {validationErrors.nip}
                    </p>
                  )}
                </div>

                {/* Input Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className={validationErrors.password ? 'text-destructive' : ''}>
                        Password
                    </Label>
                    {/* Change this line: */}
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                        Lupa password?
                    </Link>
                  </div>
                  
                  <div className="relative group">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading || showWelcome}
                      className={`pl-10 pr-10 transition-all ${validationErrors.password ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || showWelcome}
                      tabIndex={-1} 
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">Toggle visibility</span>
                    </Button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-[0.8rem] font-medium text-destructive animate-in slide-in-from-top-1">
                      {validationErrors.password}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" 
                    disabled={isLoading || showWelcome}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : showWelcome ? (
                    'Berhasil Masuk'
                  ) : (
                    <>
                       Masuk Aplikasi
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <p className="px-8 text-center text-sm text-muted-foreground">
             Aplikasi Internal <br />
             <span className="font-medium text-foreground">Bapas Kelas I Jakarta Barat</span>
          </p>
        </div>
      </div>

      {/* Kolom Kanan: Branding / Image */}
      <div className="hidden lg:flex relative flex-col bg-slate-900 text-white p-12 justify-between overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/40 z-10" />
        <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop" 
            alt="Office Background" 
            className="absolute inset-0 object-cover w-full h-full opacity-60 mix-blend-overlay animate-in fade-in duration-1000"
        />
        
        {/* Top Branding */}
        <div className="relative z-20 flex items-center gap-3 animate-in slide-in-from-top-8 duration-700 delay-200">
             <div className="h-10 w-10 bg-yellow-500/90 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Fingerprint className="h-6 w-6 text-slate-900" />
             </div>
             <div>
                <h3 className="text-lg font-bold leading-tight">Kementerian Imigrasi dan Pemasyarakatan RI</h3>
                <p className="text-sm text-slate-300">Balai Pemasyarakatan Kelas I Jakarta Barat</p>
             </div>
        </div>
        
        {/* Bottom Quote */}
        <div className="relative z-20 max-w-lg mb-8 animate-in slide-in-from-bottom-8 duration-700 delay-300">
            <blockquote className="space-y-4">
                <p className="text-2xl font-medium leading-relaxed tracking-tight text-white/90">
                    &ldquo;Transformasi digital layanan pemasyarakatan untuk mewujudkan pelayanan publik yang PASTI (Profesional, Akuntabel, Sinergi, Transparan, dan Inovatif).&rdquo;
                </p>
                <div className="h-1 w-20 bg-yellow-500 rounded-full" />
            </blockquote>
        </div>
      </div>
    </div>
  );
}