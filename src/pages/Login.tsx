import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'; //
import { z } from 'zod';

const loginSchema = z.object({
  nip: z.string().min(1, 'NIP harus diisi').regex(/^\d+$/, 'NIP hanya boleh berisi angka'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export default function Login() {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State baru untuk visibilitas password
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ nip?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // --- Navigasi Otomatis ---
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

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
    } 
    // Jika sukses, useEffect akan menangani navigasi
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <img 
              src="/favicon.ico" 
              alt="Logo" 
              className="w-8 h-8 text-primary" 
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Hai, Selamat Datang di MONALISA</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Masuk dengan NIP dan password Anda
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                type="text"
                placeholder="Masukkan NIP"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                disabled={isLoading}
                className={validationErrors.nip ? 'border-destructive' : ''}
              />
              {validationErrors.nip && (
                <p className="text-sm text-destructive">{validationErrors.nip}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"} // Tipe berubah dinamis
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className={`pr-10 ${validationErrors.password ? 'border-destructive' : ''}`} // Padding kanan untuk ikon
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">Toggle password visibility</span>
                </Button>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-destructive">{validationErrors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}