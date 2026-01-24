import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Activity, 
  ShieldCheck, 
  FileText, 
  Zap, 
  Award, 
  Scale,
  Building2
} from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 animate-in fade-in duration-500 font-sans">
      
      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden bg-slate-900 text-white pb-32 pt-16 md:pt-24">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-pulse"></div>
            <div className="absolute top-1/2 right-0 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-50"></div>
        </div>

        <div className="container relative z-10 mx-auto px-6 md:px-12">
          <Button 
            variant="ghost" 
            className="mb-8 text-slate-300 hover:text-white hover:bg-white/10 group pl-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
            Kembali ke Dashboard
          </Button>

          <div className="max-w-4xl">
            <Badge variant="outline" className="mb-4 text-yellow-400 border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-sm tracking-wide uppercase">
              Inovasi Digital
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              MONALISA
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed max-w-3xl">
              <span className="font-semibold text-white">Monitoring dan Evaluasi Kinerja Layanan Publik.</span><br/>
              Platform terpadu untuk layanan yang lebih mudah, transparan, dan akuntabel.
            </p>
            <div className="mt-8 flex items-center gap-3 text-sm font-medium text-slate-400">
              <Building2 className="h-5 w-5" />
              <span>Balai Pemasyarakatan Kelas I Jakarta Barat</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="container mx-auto px-6 md:px-12 -mt-20 relative z-20 pb-20">
        
        {/* Section 1: Introduction Card */}
        <Card className="shadow-xl border-0 mb-12 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-blue-500 to-purple-500" />
            <CardContent className="p-8 md:p-12 bg-white">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-slate-800">Transformasi Layanan Bapas</h2>
                        <div className="space-y-4 text-slate-600 leading-relaxed text-lg">
                            <p>
                                <strong>MONALISA</strong> merupakan inovasi digital Balai Pemasyarakatan Kelas I Jakarta Barat yang dikembangkan untuk menghadirkan layanan yang lebih mudah diakses, transparan, dan akuntabel bagi masyarakat maupun petugas.
                            </p>
                            <p>
                                Kehadiran Monalisa berangkat dari kebutuhan untuk menyederhanakan alur kerja, mempercepat penyampaian informasi, serta memastikan setiap layanan publik dapat dipantau dan dievaluasi secara terukur.
                            </p>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Cakupan Layanan Terintegrasi
                        </h3>
                        <ul className="space-y-3">
                            {[
                                "Registrasi Litmas Digital",
                                "Pelaksanaan Penelitian Kemasyarakatan",
                                "Pembimbingan & Pengawasan Klien",
                                "Monitoring Kinerja Real-time",
                                "Administrasi & Dokumentasi Teknis"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-600">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Section 2: Values & Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                    <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Efisiensi & Kecepatan</h3>
                <p className="text-slate-600 leading-relaxed">
                    Menciptakan standar baru administrasi Bapas yang lebih cepat dan efisien. Fitur <em>reminder</em> membantu Pembimbing Kemasyarakatan memenuhi tenggat pekerjaan tepat waktu.
                </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-6">
                    <FileText className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Keterbukaan Informasi</h3>
                <p className="text-slate-600 leading-relaxed">
                    Bagian dari pelaksanaan keterbukaan informasi publik dengan menyediakan tampilan data, infografis, dan monitoring status layanan yang dapat diakses langsung.
                </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-6">
                    <ShieldCheck className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Tata Kelola Profesional</h3>
                <p className="text-slate-600 leading-relaxed">
                    Sistematisasi penyelesaian tugas dan dokumentasi untuk mendukung pelayanan publik yang profesional serta memperkuat tata kelola data di lingkungan Bapas.
                </p>
            </div>
        </div>

        {/* Section 3: Legal / Copyright HAKI */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-10">
                <Scale className="h-64 w-64 text-white rotate-12" />
            </div>
            
            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row gap-8 md:items-center">
                <div className="flex-shrink-0">
                    <div className="h-20 w-20 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <Award className="h-10 w-10 text-slate-900" />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Badge className="bg-yellow-500 text-slate-900 hover:bg-yellow-400 border-none">
                            Hak Kekayaan Intelektual (HAKI)
                        </Badge>
                        <h2 className="text-2xl md:text-3xl font-bold">Terdaftar & Dilindungi Secara Hukum</h2>
                    </div>
                    <p className="text-slate-300 leading-relaxed max-w-2xl">
                        Sebagai bentuk komitmen terhadap inovasi, Monalisa telah melalui proses pencatatan hak cipta pada <strong>Direktorat Jenderal Kekayaan Intelektual (DJKI)</strong>. 
                        Pencatatan ini menjadi bukti legal atas orisinalitas dan kepemilikan sistem sebagai platform mandiri Balai Pemasyarakatan Kelas I Jakarta Barat.
                    </p>
                </div>
            </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center space-y-4">
            <Separator className="max-w-xs mx-auto mb-8" />
            <div className="flex flex-col items-center gap-2">
                <img src="/favicon.ico" alt="Logo Monalisa" className="w-12 h-12 opacity-90" />
                <p className="text-sm font-semibold text-slate-900">
                    Sistem Informasi MONALISA v2.0
                </p>
                <p className="text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} Balai Pemasyarakatan Kelas I Jakarta Barat. All rights reserved.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
}