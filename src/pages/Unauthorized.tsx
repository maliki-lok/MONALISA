import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 text-center">
        <CardHeader className="space-y-4 pb-6">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Akses Ditolak</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Anda tidak memiliki izin untuk mengakses halaman ini
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Button 
            className="w-full" 
            onClick={() => navigate('/dashboard')}
          >
            <Home className="mr-2 h-4 w-4" />
            Ke Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
