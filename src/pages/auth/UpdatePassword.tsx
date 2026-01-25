import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const handleAuthCheck = async () => {
      // 1. Cek apakah ini link recovery (ada hash di URL)
      const hash = window.location.hash;
      const isRecoveryLink = hash && (hash.includes('type=recovery') || hash.includes('access_token'));

      // Listener Auth
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`Auth Event: ${event}`); // Debugging

        if (event === 'SIGNED_OUT') {
          // --- PERBAIKAN UTAMA DISINI ---
          // Jika user terdeteksi membuka link recovery, ABAIKAN event SIGNED_OUT.
          // Supabase sering memecat event ini sebelum memproses token baru.
          if (isRecoveryLink) {
            console.log("Mengabaikan SIGNED_OUT karena sedang mode recovery...");
            return;
          }
        }

        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          // Berhasil masuk!
          if (mounted) setIsProcessing(false);
        }
      });

      // 2. Cek manual session saat ini
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        if (mounted) setIsProcessing(false);
      } else if (!isRecoveryLink) {
        // Jika tidak ada session DAN bukan link recovery, baru tendang keluar
        if (mounted) {
           toast.error("Link tidak valid.");
           navigate('/login');
        }
      } else {
        // Jika ini recovery link tapi session belum siap, 
        // kita tunggu sebentar (handling race condition)
        setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession && mounted) {
                setIsProcessing(false);
            }
        }, 2000); 
      }
      
      return () => {
        subscription.unsubscribe();
      };
    };

    handleAuthCheck();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);

    try {
      // Kita update user. Jika session sebenarnya mati, ini akan throw error.
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success('Password berhasil diperbarui! Silakan login kembali.');
      
      // Logout bersih & redirect
      await supabase.auth.signOut();
      navigate('/login');

    } catch (error: any) {
      console.error('Error updating password:', error);
      // Jika errornya karena session not found, baru kita arahkan ke login
      if (error.message.includes('Auth session missing') || error.message.includes('not logged in')) {
         toast.error("Sesi kadaluarsa. Silakan minta link reset baru.");
         navigate('/login');
      } else {
         toast.error('Gagal: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Tampilkan loading screen hanya jika benar-benar sedang memproses link
  // Tapi kita biarkan form muncul lebih cepat agar user tidak bingung
  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Memproses link keamanan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Atur Password Baru</CardTitle>
          <CardDescription>
            Silakan masukkan password baru untuk akun Anda.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdatePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password Baru</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Konfirmasi Password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Password Baru
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
