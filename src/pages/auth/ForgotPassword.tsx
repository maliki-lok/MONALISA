import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ArrowLeft, Loader2, Send, KeyRound, CheckCircle2, Phone, Mail, User, ShieldCheck, LockKeyhole 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// --- VALIDATION SCHEMAS ---

const identitySchema = z.object({
  nip: z.string().min(1, "NIP wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  whatsapp: z.string().min(10, "Nomor WhatsApp tidak valid (min 10 digit)").regex(/^\d+$/, "Hanya angka"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "Kode OTP harus 6 digit angka"),
});

const passwordSchema = z.object({
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // State OTP & Identity
  const [serverOtp, setServerOtp] = useState<string | null>(null); 
  const [targetPhone, setTargetPhone] = useState<string>("");
  const [verifiedNip, setVerifiedNip] = useState<string>(""); 
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Forms
  const formIdentity = useForm<z.infer<typeof identitySchema>>({
    resolver: zodResolver(identitySchema),
    defaultValues: { nip: "", email: "", whatsapp: "" },
  });

  const formOtp = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const formPassword = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // --- LOGIC HANDLERS ---

  const onCheckIdentity = async (values: z.infer<typeof identitySchema>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-forgot-password-otp', {
        body: { nip: values.nip, email: values.email, whatsapp: values.whatsapp }
      });

      if (error) throw new Error(error.message || "Gagal menghubungi server.");
      if (data?.error) throw new Error(data.error);

      if (data?.success && data?.otp) {
        setServerOtp(data.otp);
        setTargetPhone(values.whatsapp);
        setVerifiedNip(values.nip);
        
        toast({
          title: "OTP Terkirim",
          description: `Kode verifikasi dikirim ke WhatsApp ${values.whatsapp}.`,
        });
        setStep(2);
      } else {
        throw new Error("Respon server tidak valid.");
      }
    } catch (err: any) {
      console.error("Error OTP:", err);
      toast({ variant: "destructive", title: "Validasi Gagal", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (values: z.infer<typeof otpSchema>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulasi UI loading

    if (values.otp === serverOtp) {
      toast({ title: "Verifikasi Berhasil", description: "Silakan atur ulang password Anda." });
      setStep(3);
    } else {
      formOtp.setError("otp", { message: "Kode OTP salah, silakan cek pesan WhatsApp Anda." });
    }
    setLoading(false);
  };

  const onResetPassword = async (values: z.infer<typeof passwordSchema>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-password-whatsapp', {
        body: { nip: verifiedNip, newPassword: values.password }
      });

      if (error) throw new Error(error.message || "Terjadi kesalahan koneksi.");
      if (data?.error) throw new Error(data.error);

      // Tampilkan modal sukses dengan animasi
      setShowSuccessModal(true);
      
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Update", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // --- UI COMPONENTS ---

  const StepIndicator = () => (
    <div className="flex justify-center items-center gap-4 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 border-2",
            step >= s 
              ? "bg-primary border-primary text-white scale-110 shadow-md" 
              : "bg-transparent border-slate-300 text-slate-400"
          )}>
            {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
          </div>
          {s < 3 && (
            <div className={cn(
              "w-8 h-1 mx-2 rounded transition-all duration-500",
              step > s ? "bg-primary" : "bg-slate-200"
            )} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-4">
        <Card className="w-full max-w-lg shadow-2xl border-0 rounded-2xl overflow-hidden bg-white/90 backdrop-blur-sm">
          
          {/* Header Section */}
          <div className="bg-primary/5 p-6 pb-2 text-center border-b border-primary/10">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
              <LockKeyhole className="w-6 h-6" />
            </div>
            <CardHeader className="p-0">
              <CardTitle className="text-2xl font-bold text-primary">Lupa Password?</CardTitle>
              <p className="text-sm text-slate-500 mt-2">
                {step === 1 && "Lengkapi data diri untuk verifikasi keamanan."}
                {step === 2 && "Masukkan kode OTP yang dikirim ke WhatsApp."}
                {step === 3 && "Buat password baru yang kuat."}
              </p>
            </CardHeader>
          </div>

          <CardContent className="p-8 pt-6">
            <StepIndicator />

            {/* STEP 1: IDENTITY FORM */}
            {step === 1 && (
              <Form {...formIdentity}>
                <form onSubmit={formIdentity.handleSubmit(onCheckIdentity)} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid gap-4">
                    <FormField control={formIdentity.control} name="nip" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">NIP Pegawai</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input placeholder="Nomor Induk Pegawai" className="pl-10 h-11 bg-slate-50 focus:bg-white transition-colors" {...field} disabled={loading} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={formIdentity.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">Email Terdaftar</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input placeholder="contoh@kemenkumham.go.id" className="pl-10 h-11 bg-slate-50 focus:bg-white transition-colors" {...field} disabled={loading} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={formIdentity.control} name="whatsapp" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-semibold">WhatsApp Aktif</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input placeholder="08xxxxxxxxxx" className="pl-10 h-11 bg-slate-50 focus:bg-white transition-colors" {...field} disabled={loading} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <Button type="submit" className="w-full h-11 text-base shadow-lg bg-primary hover:bg-primary/90 transition-all" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <span className="flex items-center">Kirim Kode OTP <Send className="ml-2 h-4 w-4" /></span>}
                  </Button>
                </form>
              </Form>
            )}

            {/* STEP 2: OTP FORM */}
            {step === 2 && (
              <Form {...formOtp}>
                <form onSubmit={formOtp.handleSubmit(onVerifyOtp)} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                  <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                    <ShieldCheck className="h-5 w-5" />
                    <AlertTitle className="font-bold ml-2">Cek WhatsApp Anda</AlertTitle>
                    <AlertDescription className="ml-2 mt-1 text-xs">
                      Kami mengirim kode ke <b>{targetPhone}</b>.
                    </AlertDescription>
                  </Alert>

                  <FormField control={formOtp.control} name="otp" render={({ field }) => (
                    <FormItem className="text-center">
                      <FormLabel>Kode OTP (6 Digit)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="• • • • • •" 
                          className="text-center text-3xl tracking-[0.5em] font-mono h-16 border-2 focus:border-primary/50 transition-all" 
                          maxLength={6} 
                          {...field} 
                          disabled={loading} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="space-y-3">
                      <Button type="submit" className="w-full h-11 shadow-md" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verifikasi OTP"}
                      </Button>
                      <div className="text-center">
                          <Button variant="link" type="button" className="text-xs text-slate-500 h-auto p-0" onClick={() => setStep(1)}>
                              Nomor salah? <span className="text-primary ml-1 hover:underline">Kembali ke awal</span>
                          </Button>
                      </div>
                  </div>
                </form>
              </Form>
            )}

            {/* STEP 3: NEW PASSWORD FORM */}
            {step === 3 && (
              <Form {...formPassword}>
                <form onSubmit={formPassword.handleSubmit(onResetPassword)} className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-800">Identitas Terverifikasi</p>
                  </div>

                  <FormField control={formPassword.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Password Baru</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input type="password" placeholder="Minimal 6 karakter" className="pl-10 h-11" {...field} disabled={loading} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={formPassword.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Konfirmasi Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CheckCircle2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input type="password" placeholder="Ulangi password baru" className="pl-10 h-11" {...field} disabled={loading} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" className="w-full h-11 bg-green-600 hover:bg-green-700 shadow-lg text-white" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Simpan Password Baru"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>

          <CardFooter className="justify-center border-t py-4 bg-slate-50">
              {step === 1 ? (
                  <Link to="/login" className="flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Halaman Login
                  </Link>
              ) : (
                  <p className="text-xs text-slate-400">Pastikan data Anda tetap rahasia.</p>
              )}
          </CardFooter>
        </Card>
      </div>

      {/* Success Modal with Checkmark Animation */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              {/* Animated Checkmark Circle */}
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-700">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in duration-1000 delay-200">
                  <CheckCircle2 className="w-10 h-10 text-white animate-in zoom-in duration-1000 delay-300" strokeWidth={3} />
                </div>
              </div>
              
              {/* Success Text */}
              <h3 className="text-2xl font-bold text-slate-800 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
                Sukses!
              </h3>
              <p className="text-slate-600 text-sm mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-700">
                Password berhasil diubah.<br />
                Mengalihkan ke halaman login...
              </p>
              
              {/* Loading Dots */}
              <div className="flex gap-1.5 justify-center">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}