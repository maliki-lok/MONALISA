import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TestPageLayout } from '@/components/TestPageLayout'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { 
  ClipboardList, Gavel, CalendarDays, Loader2, Check, ChevronsUpDown, Search, 
  User, UserCheck, List, RefreshCw, Pencil, XCircle, MapPin, AlertTriangle, 
  Eye, FileText, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Types (Pastikan interface ini ada atau sesuaikan dengan kebutuhan)
import { PetugasPK, UPT, Klien } from '@/types/auth';

const JENIS_LITMAS = ["Integrasi PB", "Integrasi CB", "Integrasi CMB", "Asimilasi", "Perawatan Tahanan", "Lainnya"];
const AGAMA_OPTIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"];
const PENDIDIKAN_OPTIONS = ["Tidak Sekolah", "SD", "SMP", "SMA/SMK", "D3", "S1", "S2", "S3"];

export default function OperatorRegistrasiTest() {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  
  // Deteksi Role Operator
  const isOpAnak = hasRole('op_reg_anak');
  const isOpDewasa = hasRole('op_reg_dewasa');
  const userRoleCategory = isOpAnak ? "Anak" : (isOpDewasa ? "Dewasa" : "Admin");

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("klien_perkara");
  const [loading, setLoading] = useState(false);
  
  // Data Referensi
  const [listPK, setListPK] = useState<PetugasPK[]>([]);
  const [listUPT, setListUPT] = useState<UPT[]>([]);
  const [listKlien, setListKlien] = useState<Klien[]>([]);

  // Selection State
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [openClientCombo, setOpenClientCombo] = useState(false);
  const [selectedPkId, setSelectedPkId] = useState<string | null>(null);
  const [openPkCombo, setOpenPkCombo] = useState(false);

  // Data List State
  const [dataLitmas, setDataLitmas] = useState<any[]>([]);
  const [dataKlienFull, setDataKlienFull] = useState<any[]>([]);

  // --- EDIT MODE STATE ---
  const [editingKlien, setEditingKlien] = useState<Klien | null>(null);
  const [editingPenjamin, setEditingPenjamin] = useState<any | null>(null);
  const [editingLitmas, setEditingLitmas] = useState<any | null>(null);
  const [editingPerkara, setEditingPerkara] = useState<any | null>(null);
  
  // State DETAIL MODE (POP UP)
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState<any | null>(null);

  // State Kalkulasi Umur
  const [tglLahir, setTglLahir] = useState("");
  const [hitungUsia, setHitungUsia] = useState("");
  const [hitungKategori, setHitungKategori] = useState("");
  const [usiaWarning, setUsiaWarning] = useState<string | null>(null);

  // --- HELPER: CALCULATE AGE ---
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    setTglLahir(dateVal);
    calculateAgeAndCategory(dateVal);
  };

  const calculateAgeAndCategory = (dateString: string) => {
    if (!dateString) return;
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    setHitungUsia(age.toString());
    const kategoriByAge = age < 18 ? "Anak" : "Dewasa";
    setHitungKategori(kategoriByAge);

    if (isOpAnak && age >= 18) {
        setUsiaWarning("PERINGATAN: Usia >= 18 tahun, namun Anda login sebagai Operator Anak. Sistem akan tetap menyimpan sebagai 'Anak'.");
    } else if (isOpDewasa && age < 18) {
        setUsiaWarning("PERINGATAN: Usia < 18 tahun, namun Anda login sebagai Operator Dewasa. Pastikan ini benar.");
    } else {
        setUsiaWarning(null);
    }
  };

  useEffect(() => {
    if (editingKlien) {
      if (editingKlien.tanggal_lahir) {
        setTglLahir(editingKlien.tanggal_lahir);
        calculateAgeAndCategory(editingKlien.tanggal_lahir);
      }
    } else {
      setTglLahir("");
      setHitungUsia("");
      setHitungKategori("");
      setUsiaWarning(null);
    }
  }, [editingKlien]);

  // --- FETCH DATA ---
  const fetchReferences = async () => {
    const { data: pkData } = await supabase.from('petugas_pk').select('*');
    if (pkData) setListPK(pkData as unknown as PetugasPK[]);

    const { data: uptData } = await supabase.from('upt').select('*');
    if (uptData) setListUPT(uptData as unknown as UPT[]);

    let queryKlien = supabase
      .from('klien')
      .select('id_klien, nama_klien, nomor_register_lapas, kategori_usia')
      .order('id_klien', { ascending: false });
    
    if (isOpAnak) queryKlien = queryKlien.eq('kategori_usia', 'Anak');
    else if (isOpDewasa) queryKlien = queryKlien.eq('kategori_usia', 'Dewasa');

    const { data: klienData } = await queryKlien;
    if (klienData) setListKlien(klienData as unknown as Klien[]);
  };

  const fetchTableData = async () => {
    setLoading(true);
    try {
      let queryKlien = supabase
        .from('klien')
        .select('*')
        .order('id_klien', { ascending: false })
        .limit(20);

      if (isOpAnak) queryKlien = queryKlien.eq('kategori_usia', 'Anak');
      else if (isOpDewasa) queryKlien = queryKlien.eq('kategori_usia', 'Dewasa');

      const { data: kData, error: kError } = await queryKlien;
      if (kError) throw kError;
      setDataKlienFull(kData || []);

      const { data: lData, error: lError } = await supabase
        .from('litmas')
        .select(`
            *,
            klien:klien!fk_litmas_klien (nama_klien, nomor_register_lapas),
            petugas_pk:petugas_pk!fk_litmas_pk (nama, nip)
        `)
        .order('id_litmas', { ascending: false })
        .limit(20);
      
      if (lError) throw lError;
      setDataLitmas(lData || []);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal memuat data", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLE VIEW DETAIL (POP UP) ---
  const handleViewDetail = async (id_klien: number) => {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('klien')
            .select(`
                *,
                penjamin (*),
                litmas:litmas!fk_litmas_klien (
                    *,
                    upt (nama_upt),
                    perkara (*),
                    petugas_pk:petugas_pk!fk_litmas_pk (nama, nip)
                )
            `)
            .eq('id_klien', id_klien)
            .single();

        if (error) throw error;
        setDetailData(data as any); 
        setOpenDetail(true);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Gagal memuat detail", description: error.message });
    } finally {
        setLoading(false);
    }
  };

  // --- ACTIONS: EDIT MODE (AUTO FILL) ---
  const handleEditClick = async (klienSimple: Klien) => {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('klien')
            .select(`
                *,
                penjamin (*),
                litmas:litmas!fk_litmas_klien (
                    *,
                    perkara (*)
                )
            `)
            .eq('id_klien', klienSimple.id_klien)
            .single();

        if (error) throw error;
        const safeData = data as any;

        setEditingKlien(safeData);
        setEditingPenjamin(safeData.penjamin?.[0] || null);
        
        const firstLitmas = safeData.litmas?.[0] || null;
        setEditingLitmas(firstLitmas);
        setEditingPerkara(firstLitmas?.perkara?.[0] || null);
        
        setSelectedClientId(safeData.id_klien);
        if (firstLitmas) {
            setSelectedPkId(firstLitmas.nama_pk || null);
        }

        setActiveTab("klien_perkara");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast({ title: "Mode Edit Aktif", description: `Mengedit data: ${safeData.nama_klien}` });

    } catch (error: any) {
        toast({ variant: "destructive", title: "Gagal memuat data edit", description: error.message });
    } finally {
        setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingKlien(null);
    setEditingPenjamin(null);
    setEditingLitmas(null);
    setEditingPerkara(null);
    setSelectedClientId(null);
    setSelectedPkId(null);
    toast({ title: "Edit Dibatalkan", description: "Kembali ke mode input baru." });
  };

  useEffect(() => { fetchReferences(); }, [isOpAnak, isOpDewasa]);
  useEffect(() => { if (activeTab === 'list_data') fetchTableData(); }, [activeTab]);

  // --- HANDLER SAVE: TAB 1 (KLIEN + PERKARA) ---
  const handleSaveKlienPerkara = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    let kategoriFix = hitungKategori; 
    if (isOpAnak) kategoriFix = 'Anak';
    if (isOpDewasa) kategoriFix = 'Dewasa';

    try {
      const payloadKlien = {
        nama_klien: formData.get('nama_klien') as string,
        nomor_register_lapas: formData.get('nomor_register_lapas') as string,
        jenis_kelamin: formData.get('jenis_kelamin') as string,
        agama: formData.get('agama') as string,
        pendidikan: formData.get('pendidikan') as string,
        tempat_lahir: formData.get('tempat_lahir') as string,
        // FIX: Cast to string
        tanggal_lahir: (formData.get('tanggal_lahir') as string),
        usia: Number(formData.get('usia')),
        kategori_usia: kategoriFix,
        pekerjaan: formData.get('pekerjaan') as string,
        minat_bakat: formData.get('minat_bakat') as string,
        alamat: formData.get('alamat') as string,
        kelurahan: formData.get('kelurahan') as string,
        kecamatan: formData.get('kecamatan') as string,
        nomor_telepon: formData.get('nomor_telepon') as string,
      };

      if (editingKlien) {
        const { error: kError } = await supabase.from('klien').update(payloadKlien).eq('id_klien', editingKlien.id_klien);
        if (kError) throw new Error(kError.message);

        // Update Perkara (Jika ada Litmas terkait)
        if (editingLitmas && editingPerkara) {
             const payloadPerkara = {
                pasal: formData.get('pasal') as string,
                tindak_pidana: formData.get('tindak_pidana') as string,
                nomor_putusan: formData.get('nomor_putusan') as string,
                vonis_pidana: formData.get('vonis_pidana') as string,
                denda: Number(formData.get('denda') || 0),
                subsider_pidana: formData.get('subsider_pidana') as string,
                // FIX: Cast to string
                tanggal_mulai_ditahan: (formData.get('tanggal_mulai_ditahan') as string) || null,
                tanggal_ekspirasi: (formData.get('tanggal_ekspirasi') as string) || null,
             };
             
             const { error: pError } = await supabase
                .from('perkara')
                .update(payloadPerkara)
                .eq('id_litmas', editingLitmas.id_litmas);
             
             if (pError) console.error("Gagal update perkara", pError);
        }

        toast({ title: "Update Berhasil", description: "Data Klien (dan Perkara) diperbarui." });
        setActiveTab("penjamin"); 

      } else {
        const { data: newKlien, error: kError } = await supabase.from('klien').insert(payloadKlien).select('id_klien, nama_klien, nomor_register_lapas').single();
        if (kError) {
            if (kError.code === '42501') throw new Error("Izin Ditolak: Anda tidak boleh menginput kategori klien ini.");
            throw new Error(kError.message);
        }
        const newKlienData = newKlien as unknown as Klien;
        setSelectedClientId(newKlienData.id_klien);
        sessionStorage.setItem('temp_perkara_data', JSON.stringify(Object.fromEntries(formData)));
        await fetchReferences();
        toast({ title: "Klien Disimpan", description: `ID: ${newKlienData.id_klien}. Lanjut ke Penjamin.` });
        setActiveTab("penjamin");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER SAVE: TAB 2 (PENJAMIN) ---
  const handleSavePenjamin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClientId) return toast({ variant: "destructive", title: "Error", description: "Pilih Klien dulu." });
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // SESUAIKAN DENGAN TABLE PUBLIC.PENJAMIN
    const payload = {
        id_klien: selectedClientId,
        nama_penjamin: formData.get('nama_penjamin') as string,
        hubungan_klien: formData.get('hubungan_klien') as string,
        agama: formData.get('agama') as string,
        tempat_lahir: formData.get('tempat_lahir') as string,
        // FIX: Cast to string
        tanggal_lahir: (formData.get('tanggal_lahir') as string) || null,
        usia: Number(formData.get('usia')),
        pendidikan: formData.get('pendidikan') as string,
        pekerjaan: formData.get('pekerjaan') as string,
        alamat: formData.get('alamat') as string,
        kelurahan: formData.get('kelurahan') as string,
        kecamatan: formData.get('kecamatan') as string,
        nomor_telepon: formData.get('nomor_telepon') as string,
    };

    try {
      if (editingPenjamin) {
        const { error } = await supabase.from('penjamin').update(payload).eq('id_klien', selectedClientId);
        if (error) throw error;
        toast({ title: "Sukses", description: "Data Penjamin diperbarui." });
      } else {
        const { error } = await supabase.from('penjamin').insert(payload);
        if (error) throw error;
        toast({ title: "Sukses", description: "Data Penjamin disimpan." });
      }
      setActiveTab("litmas");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER SAVE: TAB 3 (LITMAS) ---
  const handleSaveLitmas = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClientId) return toast({ variant: "destructive", title: "Error", description: "Pilih Klien dulu." });
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const tempDataPerkara = JSON.parse(sessionStorage.getItem('temp_perkara_data') || '{}');
    
    try {
      // SESUAIKAN DENGAN TABLE PUBLIC.LITMAS
      const payloadLitmas = {
        id_klien: selectedClientId,
        id_upt: formData.get('id_upt') ? Number(formData.get('id_upt')) : null,
        nama_pk: selectedPkId, // Dari State (Dropdown)
        
        nomor_urut: formData.get('nomor_urut') ? Number(formData.get('nomor_urut')) : null,
        nomor_surat_masuk: formData.get('nomor_surat_masuk') as string,
        // FIX: Cast to string
        tanggal_diterima_bapas: (formData.get('tanggal_diterima_bapas') as string) || null,
        jenis_litmas: formData.get('jenis_litmas') as string,
        
        // FIX: Cast to string
        tanggal_registrasi: (formData.get('tanggal_registrasi') as string) || null,
        nomor_register_litmas: formData.get('nomor_register_litmas') as string,
        asal_bapas: formData.get('asal_bapas') as string,
        
        nomor_surat_permintaan: formData.get('nomor_surat_permintaan') as string,
        // FIX: Cast to string
        tanggal_surat_permintaan: (formData.get('tanggal_surat_permintaan') as string) || null,
        
        nomor_surat_pelimpahan: formData.get('nomor_surat_pelimpahan') as string,
        // FIX: Cast to string
        tanggal_surat_pelimpahan: (formData.get('tanggal_surat_pelimpahan') as string) || null,
      };

      if(editingLitmas) {
         const { error } = await supabase.from('litmas').update(payloadLitmas).eq('id_litmas', editingLitmas.id_litmas);
         if(error) throw error;
         toast({ title: "Sukses", description: "Data Litmas diperbarui." });
         handleCancelEdit();
         setActiveTab("list_data");
         fetchTableData();
      } else {
         const { data: litmasData, error: litmasError } = await supabase.from('litmas').insert(payloadLitmas).select('id_litmas').single();
         if (litmasError) throw new Error(litmasError.message);

         // Insert Perkara (from Tab 1 temporary data)
         if (tempDataPerkara.pasal || tempDataPerkara.nomor_putusan) {
            await supabase.from('perkara').insert({
              id_litmas: litmasData.id_litmas,
              pasal: tempDataPerkara.pasal as string,
              tindak_pidana: tempDataPerkara.tindak_pidana as string,
              nomor_putusan: tempDataPerkara.nomor_putusan as string,
              vonis_pidana: tempDataPerkara.vonis_pidana as string,
              denda: tempDataPerkara.denda ? Number(tempDataPerkara.denda) : 0,
              subsider_pidana: tempDataPerkara.subsider_pidana as string,
              // FIX: Cast to string
              tanggal_mulai_ditahan: (tempDataPerkara.tanggal_mulai_ditahan as string) || null,
              tanggal_ekspirasi: (tempDataPerkara.tanggal_ekspirasi as string) || null,
            });
         }
         toast({ title: "Selesai", description: "Registrasi Litmas berhasil." });
         sessionStorage.removeItem('temp_perkara_data');
         setSelectedClientId(null);
         setSelectedPkId(null);
         setActiveTab("list_data");
         fetchTableData();
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Sub-components
  const ClientSelector = () => {
    const selectedClient = listKlien.find((k) => k.id_klien === selectedClientId);
    return (
      <div className="flex flex-col space-y-2 mb-6">
        <Label className="text-base font-semibold text-slate-700">Pilih Klien ({userRoleCategory}) <span className="text-red-500">*</span></Label>
        <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={openClientCombo} className="w-full justify-between bg-white border-slate-300 hover:bg-slate-50 h-11">
              {selectedClient ? (
                <div className="flex flex-col items-start text-left leading-tight overflow-hidden">
                   <span className="font-semibold text-slate-900 truncate w-full">{selectedClient.nama_klien}</span>
                   <span className="text-xs text-slate-500 truncate w-full">Reg: {selectedClient.nomor_register_lapas || '-'}</span>
                </div>
              ) : (
                <span className="text-slate-500 flex items-center gap-2"><Search className="w-4 h-4" /> Cari berdasarkan nama...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Ketik nama klien..." />
              <CommandList>
                <CommandEmpty>Klien {userRoleCategory} tidak ditemukan.</CommandEmpty>
                <CommandGroup heading={`Daftar Klien ${userRoleCategory}`}>
                  {listKlien.map((klien) => (
                    <CommandItem
                      key={klien.id_klien}
                      value={`${klien.nama_klien} ${klien.nomor_register_lapas}`}
                      onSelect={() => {
                        setSelectedClientId(klien.id_klien);
                        setOpenClientCombo(false);
                        if(editingKlien && editingKlien.id_klien !== klien.id_klien) {
                            handleCancelEdit();
                        }
                        toast({ title: "Klien Dipilih", description: `Aktif: ${klien.nama_klien}` });
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selectedClientId === klien.id_klien ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col">
                        <span className="font-medium">{klien.nama_klien}</span>
                        <span className="text-xs text-muted-foreground">{klien.nomor_register_lapas}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const PKSelector = () => {
    const selectedPk = listPK.find((pk) => pk.id === selectedPkId);
    return (
      <div className="grid gap-2">
        <Label className="text-blue-900 font-bold flex items-center gap-2"><UserCheck className="w-4 h-4" /> Tunjuk Petugas PK</Label>
        <Popover open={openPkCombo} onOpenChange={setOpenPkCombo}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={openPkCombo} className="w-full justify-between bg-white border-blue-200 hover:bg-blue-50 h-auto py-2 text-left">
              {selectedPk ? (
                <div className="flex flex-col items-start text-left leading-tight overflow-hidden">
                   <span className="font-semibold text-slate-900 truncate w-full">{selectedPk.nama}</span>
                   <span className="text-xs text-slate-500 truncate w-full">NIP: {selectedPk.nip}</span>
                </div>
              ) : (
                <span className="text-slate-500">Pilih Petugas PK...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Cari PK atau NIP..." />
              <CommandList>
                <CommandEmpty>Petugas PK tidak ditemukan.</CommandEmpty>
                <CommandGroup>
                  {listPK.map((pk) => (
                    <CommandItem key={pk.id} value={`${pk.nama} ${pk.nip}`} onSelect={() => { setSelectedPkId(pk.id); setOpenPkCombo(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", selectedPkId === pk.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col"><span className="font-medium">{pk.nama}</span><span className="text-xs text-muted-foreground">NIP: {pk.nip}</span></div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <TestPageLayout
      title={`Registrasi (${userRoleCategory})`}
      description={`Anda login sebagai: Operator ${userRoleCategory}. Data akan otomatis disesuaikan.`}
      permissionCode="access_operator_registrasi"
      icon={<ClipboardList className="w-6 h-6" />}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-slate-100/80 rounded-xl">
          <TabsTrigger value="klien_perkara" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">{editingKlien ? 'Edit Klien' : '1. Klien Baru'}</TabsTrigger>
          <TabsTrigger value="penjamin" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">2. Penjamin</TabsTrigger>
          <TabsTrigger value="litmas" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">3. Litmas</TabsTrigger>
          <TabsTrigger value="list_data" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex gap-2"><List className="w-4 h-4" /> Data Terdaftar</TabsTrigger>
        </TabsList>

        <TabsContent value="klien_perkara">
           <Card className={cn("border-t-4 shadow-sm transition-all", editingKlien ? "border-t-amber-500 bg-amber-50/30" : "border-t-slate-800")}>
             <CardHeader>
               <div className="flex items-center justify-between">
                 <div>
                   <CardTitle>{editingKlien ? `Edit Data: ${editingKlien.nama_klien}` : `Identitas Klien ${userRoleCategory}`}</CardTitle>
                   <CardDescription>
                       {isOpAnak && <span className="text-orange-600 font-semibold">Mode Operator Anak: Data akan otomatis disimpan sebagai Kategori 'Anak'.</span>}
                       {isOpDewasa && <span className="text-blue-600 font-semibold">Mode Operator Dewasa: Data akan otomatis disimpan sebagai Kategori 'Dewasa'.</span>}
                   </CardDescription>
                 </div>
                 {editingKlien && (
                   <Button variant="outline" size="sm" onClick={handleCancelEdit} className="border-red-200 text-red-600 hover:bg-red-50">
                     <XCircle className="w-4 h-4 mr-2" /> Batal Edit
                   </Button>
                 )}
               </div>
             </CardHeader>
             <CardContent>
               <form key={editingKlien ? `edit-${editingKlien.id_klien}` : 'create-new'} onSubmit={handleSaveKlienPerkara} className="space-y-8">
                 <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                       <h4 className="font-semibold text-slate-700 flex items-center"><User className="w-4 h-4 mr-2" /> Data Diri Utama</h4>
                       <div className="grid gap-2"><Label>Nama Lengkap</Label><Input name="nama_klien" defaultValue={editingKlien?.nama_klien || ''} required placeholder="Nama Klien" /></div>
                       <div className="grid gap-2"><Label>No. Register Lapas</Label><Input name="nomor_register_lapas" defaultValue={editingKlien?.nomor_register_lapas || ''} required placeholder="Contoh: BI.123/..." /></div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Jenis Kelamin</Label>
                            <Select name="jenis_kelamin" required defaultValue={editingKlien?.jenis_kelamin || undefined}><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent></Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Agama</Label>
                            <Select name="agama" defaultValue={editingKlien?.agama || undefined}><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent>{AGAMA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
                          </div>
                       </div>
                       <div className="grid gap-2">
                          <Label>Pendidikan Terakhir</Label>
                          <Select name="pendidikan" defaultValue={editingKlien?.pendidikan || undefined}><SelectTrigger><SelectValue placeholder="Pilih Pendidikan..." /></SelectTrigger><SelectContent>{PENDIDIKAN_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                       </div>
                     </div>

                     <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Kelahiran & Usia</h4>
                        <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2"><Label>Tempat Lahir</Label><Input name="tempat_lahir" defaultValue={editingKlien?.tempat_lahir || ''} /></div>
                         <div className="grid gap-2">
                            <Label>Tanggal Lahir</Label>
                            <Input name="tanggal_lahir" type="date" value={tglLahir} onChange={handleDateChange} required />
                         </div>
                        </div>
                        {usiaWarning && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Perhatian!</AlertTitle><AlertDescription>{usiaWarning}</AlertDescription></Alert>}
                        <div className="grid grid-cols-2 gap-4 bg-slate-100 p-3 rounded-md">
                           <div className="grid gap-1"><Label className="text-xs text-slate-500">Usia (Hitungan)</Label><Input name="usia" value={hitungUsia} readOnly className="bg-white" /></div>
                           <div className="grid gap-1"><Label className="text-xs text-slate-500">Kategori (Sistem)</Label><Input name="kategori_usia" value={isOpAnak ? 'Anak' : (isOpDewasa ? 'Dewasa' : hitungKategori)} readOnly className="bg-white font-bold text-slate-700" /></div>
                        </div>
                        <div className="grid gap-2"><Label>Pekerjaan</Label><Input name="pekerjaan" defaultValue={editingKlien?.pekerjaan || ''} placeholder="Pekerjaan sebelumnya..." /></div>
                        <div className="grid gap-2"><Label>Minat / Bakat</Label><Input name="minat_bakat" defaultValue={editingKlien?.minat_bakat || ''} placeholder="Contoh: Musik, Pertanian, dll" /></div>
                     </div>
                   </div>

                   <Separator />
                   <div className="space-y-4">
                     <h4 className="font-semibold text-slate-700 flex items-center"><MapPin className="w-4 h-4 mr-2" /> Alamat & Kontak</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2"><Label>Alamat Lengkap (Jalan/RT/RW)</Label><Textarea name="alamat" defaultValue={editingKlien?.alamat || ''} className="h-24" /></div>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2"><Label>Kelurahan</Label><Input name="kelurahan" defaultValue={editingKlien?.kelurahan || ''} /></div>
                              <div className="grid gap-2"><Label>Kecamatan</Label><Input name="kecamatan" defaultValue={editingKlien?.kecamatan || ''} /></div>
                           </div>
                           <div className="grid gap-2"><Label>Nomor Telepon / WA</Label><Input name="nomor_telepon" defaultValue={editingKlien?.nomor_telepon || ''} placeholder="08..." /></div>
                        </div>
                     </div>
                   </div>
                 </div>
                 
                 <Separator />
                 <div className="space-y-4">
                   <h3 className="font-semibold text-lg text-red-700 flex items-center gap-2"><Gavel className="w-5 h-5" />Data Perkara</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="grid gap-2"><Label>Pasal</Label><Input name="pasal" defaultValue={editingPerkara?.pasal || ''} placeholder="363 KUHP" /></div>
                     <div className="grid gap-2"><Label>Tindak Pidana</Label><Input name="tindak_pidana" defaultValue={editingPerkara?.tindak_pidana || ''} placeholder="Pencurian" /></div>
                     <div className="grid gap-2"><Label>No. Putusan</Label><Input name="nomor_putusan" defaultValue={editingPerkara?.nomor_putusan || ''} /></div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border">
                     <div className="grid gap-2"><Label>Vonis</Label><Input name="vonis_pidana" defaultValue={editingPerkara?.vonis_pidana || ''} placeholder="1 Tahun" /></div>
                     <div className="grid gap-2"><Label>Denda (Rp)</Label><Input name="denda" type="number" defaultValue={editingPerkara?.denda || ''} /></div>
                     <div className="grid gap-2"><Label>Subsider</Label><Input name="subsider_pidana" defaultValue={editingPerkara?.subsider_pidana || ''} /></div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="grid gap-2"><Label>Mulai Ditahan</Label><Input name="tanggal_mulai_ditahan" type="date" defaultValue={editingPerkara?.tanggal_mulai_ditahan || ''} /></div>
                     <div className="grid gap-2"><Label className="text-red-600">Ekspirasi</Label><Input name="tanggal_ekspirasi" type="date" defaultValue={editingPerkara?.tanggal_ekspirasi || ''} className="bg-red-50 border-red-200" /></div>
                   </div>
                 </div>

                 <div className="flex justify-end pt-4 gap-2">
                   {editingKlien && <Button type="button" variant="ghost" onClick={handleCancelEdit}>Batal</Button>}
                   <Button type="submit" size="lg" className={cn("w-full md:w-auto", editingKlien ? "bg-amber-600 hover:bg-amber-700" : "")} disabled={loading}>
                     {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} 
                     {editingKlien ? "Simpan Perubahan Klien & Perkara" : "Simpan Klien Baru"}
                   </Button>
                 </div>
               </form>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="penjamin">
           <Card className="border-t-4 border-t-green-600 shadow-sm">
             <CardHeader><CardTitle>Data Penjamin</CardTitle><CardDescription>Informasi keluarga atau penjamin.</CardDescription></CardHeader>
             <CardContent>
                <form key={editingPenjamin ? `edit-penjamin-${editingPenjamin.id}` : 'new-penjamin'} onSubmit={handleSavePenjamin} className="space-y-6 max-w-3xl mx-auto">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><ClientSelector /></div>
                    <div className={cn("space-y-6 transition-opacity duration-300", !selectedClientId && "opacity-50 pointer-events-none")}>
                        {/* UPDATE: Form lengkap sesuai tabel penjamin */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2 col-span-2"><Label>Nama Penjamin</Label><Input name="nama_penjamin" defaultValue={editingPenjamin?.nama_penjamin || ''} required /></div>
                            
                            <div className="grid gap-2"><Label>Hubungan</Label><Select name="hubungan_klien" defaultValue={editingPenjamin?.hubungan_klien || undefined} required><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent><SelectItem value="orang_tua">Orang Tua</SelectItem><SelectItem value="istri_suami">Istri / Suami</SelectItem><SelectItem value="kakak_adik">Kakak / Adik</SelectItem><SelectItem value="lainnya">Lainnya</SelectItem></SelectContent></Select></div>
                            <div className="grid gap-2"><Label>Agama</Label><Select name="agama" defaultValue={editingPenjamin?.agama || undefined}><SelectTrigger><SelectValue placeholder="Pilih Agama..." /></SelectTrigger><SelectContent>{AGAMA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
                            
                            <div className="grid gap-2"><Label>Tempat Lahir</Label><Input name="tempat_lahir" defaultValue={editingPenjamin?.tempat_lahir || ''} /></div>
                            <div className="grid gap-2"><Label>Tanggal Lahir</Label><Input name="tanggal_lahir" type="date" defaultValue={editingPenjamin?.tanggal_lahir || ''} /></div>
                            
                            <div className="grid gap-2"><Label>Usia</Label><Input name="usia" type="number" className="w-24" defaultValue={editingPenjamin?.usia || ''} /></div>
                            <div className="grid gap-2"><Label>Pendidikan</Label><Select name="pendidikan" defaultValue={editingPenjamin?.pendidikan || undefined}><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent>{PENDIDIKAN_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                            
                            <div className="grid gap-2"><Label>Pekerjaan</Label><Input name="pekerjaan" defaultValue={editingPenjamin?.pekerjaan || ''} /></div>
                            <div className="grid gap-2"><Label>No. Telepon</Label><Input name="nomor_telepon" type="tel" defaultValue={editingPenjamin?.nomor_telepon || ''} /></div>
                            
                            <div className="grid gap-2 col-span-2"><Label>Alamat</Label><Textarea name="alamat" defaultValue={editingPenjamin?.alamat || ''} /></div>
                            <div className="grid gap-2"><Label>Kelurahan</Label><Input name="kelurahan" defaultValue={editingPenjamin?.kelurahan || ''} /></div>
                            <div className="grid gap-2"><Label>Kecamatan</Label><Input name="kecamatan" defaultValue={editingPenjamin?.kecamatan || ''} /></div>
                        </div>
                        <div className="flex justify-end pt-4"><Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading || !selectedClientId}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {editingPenjamin ? "Update Penjamin" : "Simpan Penjamin"}</Button></div>
                    </div>
                </form>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="litmas">
            <Card className="border-t-4 border-t-blue-600 shadow-sm">
             <CardHeader><CardTitle>Registrasi Litmas</CardTitle><CardDescription>Detail permintaan litmas.</CardDescription></CardHeader>
             <CardContent className="pt-6">
               <form key={editingLitmas ? `edit-litmas-${editingLitmas.id_litmas}` : 'new-litmas'} onSubmit={handleSaveLitmas} className="space-y-6 max-w-3xl mx-auto">
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><ClientSelector /></div>
                 <div className={cn("space-y-6 transition-opacity duration-300", !selectedClientId && "opacity-50 pointer-events-none")}>
                   
                   {/* UPDATE: Form Lengkap Litmas */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Kelompok 1: Data Dasar */}
                     <div className="grid gap-2"><Label>Jenis Litmas</Label><Select name="jenis_litmas" defaultValue={editingLitmas?.jenis_litmas || undefined} required><SelectTrigger><SelectValue placeholder="Pilih Jenis..." /></SelectTrigger><SelectContent>{JENIS_LITMAS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
                     <div className="grid gap-2"><Label>Asal UPT</Label><Select name="id_upt" defaultValue={editingLitmas?.id_upt ? String(editingLitmas.id_upt) : undefined}><SelectTrigger><SelectValue placeholder="Pilih UPT..." /></SelectTrigger><SelectContent>{listUPT.map((upt) => (<SelectItem key={upt.id_upt} value={String(upt.id_upt)}>{upt.nama_upt}</SelectItem>))}</SelectContent></Select></div>
                     
                     {/* Kelompok 2: Registrasi Bapas */}
                     <div className="grid gap-2"><Label>Nomor Urut</Label><Input name="nomor_urut" type="number" defaultValue={editingLitmas?.nomor_urut || ''} /></div>
                     <div className="grid gap-2"><Label>Asal Bapas</Label><Input name="asal_bapas" defaultValue={editingLitmas?.asal_bapas || 'Bapas Kelas I Jakarta Barat'} /></div>
                     <div className="grid gap-2"><Label>Tanggal Registrasi</Label><Input name="tanggal_registrasi" type="date" defaultValue={editingLitmas?.tanggal_registrasi || new Date().toISOString().split('T')[0]} /></div>
                     <div className="grid gap-2"><Label>Nomor Register Litmas</Label><Input name="nomor_register_litmas" defaultValue={editingLitmas?.nomor_register_litmas || ''} placeholder="Reg. Bapas..." /></div>

                     {/* Kelompok 3: Surat Permintaan */}
                     <div className="col-span-2"><Separator className="my-2" /></div>
                     <div className="grid gap-2"><Label>No. Surat Permintaan</Label><Input name="nomor_surat_permintaan" defaultValue={editingLitmas?.nomor_surat_permintaan || ''} required /></div>
                     <div className="grid gap-2"><Label>Tgl Surat Permintaan</Label><Input name="tanggal_surat_permintaan" type="date" defaultValue={editingLitmas?.tanggal_surat_permintaan || ''} required /></div>
                     <div className="grid gap-2"><Label>Tgl Diterima Bapas</Label><Input name="tanggal_diterima_bapas" type="date" defaultValue={editingLitmas?.tanggal_diterima_bapas || ''} required /></div>
                     <div className="grid gap-2"><Label>No. Agenda Masuk</Label><Input name="nomor_surat_masuk" defaultValue={editingLitmas?.nomor_surat_masuk || ''} /></div>

                     {/* Kelompok 4: Surat Pelimpahan */}
                     <div className="col-span-2"><Separator className="my-2" /></div>
                     <div className="grid gap-2"><Label>No. Surat Pelimpahan</Label><Input name="nomor_surat_pelimpahan" defaultValue={editingLitmas?.nomor_surat_pelimpahan || ''} placeholder="Jika ada..." /></div>
                     <div className="grid gap-2"><Label>Tgl Surat Pelimpahan</Label><Input name="tanggal_surat_pelimpahan" type="date" defaultValue={editingLitmas?.tanggal_surat_pelimpahan || ''} /></div>
                   </div>

                   <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-4">
                     <PKSelector />
                   </div>
                   <div className="flex justify-end pt-4"><Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading || !selectedClientId}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {editingLitmas ? "Update Litmas" : "Simpan Litmas"}</Button></div>
                 </div>
               </form>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="list_data">
             <div className="space-y-6">
             <Card className="border-t-4 border-t-purple-600 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                   <div>
                      <CardTitle>Daftar Klien Terdaftar</CardTitle>
                      <CardDescription>20 data klien terbaru (Filtered: {userRoleCategory}).</CardDescription>
                   </div>
                   <Button variant="ghost" size="sm" onClick={fetchTableData}><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /></Button>
                </CardHeader>
                <CardContent>
                   <Table>
                      <TableHeader><TableRow><TableHead>Nama Klien</TableHead><TableHead>No. Register</TableHead><TableHead>Jenis Kelamin</TableHead><TableHead>Usia</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                      <TableBody>
                         {dataKlienFull.length > 0 ? (
                            dataKlienFull.map((k) => (
                               <TableRow key={k.id_klien}>
                                  <TableCell className="font-medium">{k.nama_klien}</TableCell>
                                  <TableCell>{k.nomor_register_lapas}</TableCell>
                                  <TableCell>{k.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</TableCell>
                                  <TableCell>{k.usia ? `${k.usia} Tahun` : '-'}</TableCell>
                                  <TableCell className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-8 px-2 text-slate-600 hover:bg-slate-100" onClick={() => handleViewDetail(k.id_klien)}><Eye className="w-3.5 h-3.5 mr-1" /> Detail</Button>
                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(k)} className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                                  </TableCell>
                               </TableRow>
                            ))
                         ) : (
                            <TableRow><TableCell colSpan={5} className="text-center py-4 text-slate-500">Belum ada data klien {userRoleCategory}.</TableCell></TableRow>
                         )}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>

             <Card className="border-t-4 border-t-orange-600 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2"><div><CardTitle>Daftar Permintaan Litmas</CardTitle><CardDescription>Status registrasi litmas.</CardDescription></div></CardHeader>
                <CardContent>
                   <Table>
                      <TableHeader><TableRow><TableHead>No. Surat</TableHead><TableHead>Jenis Litmas</TableHead><TableHead>Nama Klien</TableHead><TableHead>Tgl Terima</TableHead><TableHead>Petugas PK</TableHead></TableRow></TableHeader>
                      <TableBody>
                         {dataLitmas.length > 0 ? (
                            dataLitmas.map((l) => (
                               <TableRow key={l.id_litmas}>
                                  <TableCell className="font-medium">{l.nomor_surat_permintaan}</TableCell>
                                  <TableCell><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{l.jenis_litmas}</span></TableCell>
                                  <TableCell>{l.klien?.nama_klien || 'Tanpa Nama'}</TableCell>
                                  <TableCell>{l.tanggal_diterima_bapas}</TableCell>
                                  <TableCell>
                                     {l.petugas_pk ? (
                                        <div className="flex flex-col"><span className="text-sm font-medium">{l.petugas_pk.nama}</span><span className="text-xs text-slate-500">{l.petugas_pk.nip}</span></div>
                                     ) : <span className="text-red-500 text-xs italic">Belum ditunjuk</span>}
                                  </TableCell>
                               </TableRow>
                            ))
                         ) : <TableRow><TableCell colSpan={5} className="text-center py-4 text-slate-500">Belum ada data litmas.</TableCell></TableRow>}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- DIALOG DETAIL (Sama seperti sebelumnya dengan Fix Scroll) --- */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="p-6 pb-2 shrink-0">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-blue-600" />Detail Lengkap Klien</DialogTitle>
                <DialogDescription>Informasi terdaftar untuk klien: <span className="font-semibold text-slate-900">{detailData?.nama_klien}</span></DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 p-6 pt-2">
                {detailData ? (
                    <div className="space-y-6">
                        <section className="space-y-2">
                            <h3 className="text-lg font-semibold text-slate-800 border-b pb-1 flex items-center gap-2 mb-2"><User className="w-5 h-5 text-slate-500" /> Identitas Diri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-8 text-sm">
                                <div className="grid grid-cols-3"><span className="text-slate-500">Nama Lengkap</span><span className="col-span-2 font-medium">: {detailData.nama_klien}</span></div>
                                <div className="grid grid-cols-3"><span className="text-slate-500">No. Register</span><span className="col-span-2 font-medium">: {detailData.nomor_register_lapas}</span></div>
                                <div className="grid grid-cols-3"><span className="text-slate-500">Jenis Kelamin</span><span className="col-span-2 font-medium">: {detailData.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span></div>
                                <div className="grid grid-cols-3"><span className="text-slate-500">TTL</span><span className="col-span-2 font-medium">: {detailData.tempat_lahir}, {detailData.tanggal_lahir}</span></div>
                                <div className="grid grid-cols-3"><span className="text-slate-500">Usia</span><span className="col-span-2 font-medium">: {detailData.usia} Tahun ({detailData.kategori_usia})</span></div>
                                <div className="grid grid-cols-3"><span className="text-slate-500">Agama</span><span className="col-span-2 font-medium">: {detailData.agama}</span></div>
                                <div className="grid grid-cols-3"><span className="text-slate-500">Pendidikan</span><span className="col-span-2 font-medium">: {detailData.pendidikan}</span></div>
                                <div className="grid grid-cols-3"><span className="text-slate-500">Pekerjaan</span><span className="col-span-2 font-medium">: {detailData.pekerjaan || '-'}</span></div>
                                <div className="grid grid-cols-3"><span className="text-slate-500">Minat / Bakat</span><span className="col-span-2 font-medium">: {detailData.minat_bakat || '-'}</span></div>
                                <div className="grid grid-cols-3"><span className="text-slate-500">Alamat</span><span className="col-span-2 font-medium">: {detailData.alamat}</span></div>
                                <div className="grid grid-cols-3"><span className="text-slate-500">Kelurahan</span><span className="col-span-2 font-medium">: {detailData.kelurahan || '-'}</span></div>
                                <div className="grid grid-cols-3"><span className="text-slate-500">Kecamatan</span><span className="col-span-2 font-medium">: {detailData.kecamatan || '-'}</span></div>
                                <div className="grid grid-cols-3"><span className="text-slate-500">Kontak</span><span className="col-span-2 font-medium">: {detailData.nomor_telepon || '-'}</span></div>
                            </div>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-lg font-semibold text-slate-800 border-b pb-1 flex items-center gap-2 mb-2"><UserCheck className="w-5 h-5 text-slate-500" /> Data Penjamin</h3>
                            {detailData.penjamin && detailData.penjamin.length > 0 ? (
                                detailData.penjamin.map((p: any, idx: number) => (
                                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-8 text-sm">
                                        <div className="grid grid-cols-3"><span className="text-slate-500">Nama Penjamin</span><span className="col-span-2 font-medium">: {p.nama_penjamin}</span></div>
                                        <div className="grid grid-cols-3"><span className="text-slate-500">Hubungan</span><span className="col-span-2 font-medium">: {p.hubungan_klien}</span></div>
                                        <div className="grid grid-cols-3"><span className="text-slate-500">Usia</span><span className="col-span-2 font-medium">: {p.usia} Tahun</span></div>
                                        <div className="grid grid-cols-3"><span className="text-slate-500">Pekerjaan</span><span className="col-span-2 font-medium">: {p.pekerjaan}</span></div>
                                        <div className="grid grid-cols-3"><span className="text-slate-500">No. Telepon</span><span className="col-span-2 font-medium">: {p.nomor_telepon || '-'}</span></div>
                                        <div className="grid grid-cols-3"><span className="text-slate-500">Alamat</span><span className="col-span-2 font-medium">: {p.alamat}</span></div>
                                    </div>
                                ))
                            ) : <p className="text-sm text-slate-500 italic">Tidak ada data penjamin.</p>}
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-lg font-semibold text-slate-800 border-b pb-1 flex items-center gap-2 mb-2"><ClipboardList className="w-5 h-5 text-slate-500" /> Riwayat Litmas & Perkara</h3>
                            {detailData.litmas && detailData.litmas.length > 0 ? (
                                <div className="space-y-3">
                                    {detailData.litmas.map((l: any) => (
                                        <div key={l.id_litmas} className="border rounded-lg overflow-hidden">
                                            <div className="bg-slate-100 p-2 px-3 flex justify-between items-center"><div className="font-semibold text-slate-800">{l.jenis_litmas}</div><Badge variant="outline" className="bg-white">{l.nomor_surat_permintaan}</Badge></div>
                                            <div className="p-3 bg-white grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-slate-500 uppercase font-bold">Info Surat</p>
                                                    <p className="flex items-center gap-1"><Building2 className="w-3 h-3 text-slate-400" /> Asal: <span className="font-medium">{l.upt?.nama_upt || 'Lapas/Rutan ?'}</span></p>
                                                    <p>Tgl Surat: <span className="font-medium">{l.tanggal_surat_permintaan}</span></p>
                                                    <p>Diterima: <span className="font-medium">{l.tanggal_diterima_bapas}</span></p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-slate-500 uppercase font-bold">Petugas Pembimbing (PK)</p>
                                                    {l.petugas_pk ? (<><p className="font-medium text-blue-700">{l.petugas_pk.nama}</p><p className="text-xs text-slate-500">{l.petugas_pk.nip}</p></>) : <span className="text-red-500 italic">Belum ditunjuk</span>}
                                                </div>
                                                {l.perkara && l.perkara.length > 0 && (
                                                    <div className="col-span-1 md:col-span-2 mt-1 pt-2 border-t border-dashed">
                                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Data Perkara</p>
                                                        {l.perkara.map((perkara: any, pIdx: number) => (
                                                            <div key={pIdx} className="grid grid-cols-2 md:grid-cols-4 gap-y-1 gap-x-2 bg-slate-50 p-2 rounded text-xs">
                                                                <div><span className="text-slate-500 block">Pasal</span><span className="font-medium">{perkara.pasal}</span></div>
                                                                <div><span className="text-slate-500 block">Tindak Pidana</span><span className="font-medium">{perkara.tindak_pidana || '-'}</span></div>
                                                                <div><span className="text-slate-500 block">Vonis</span><span className="font-medium">{perkara.vonis_pidana}</span></div>
                                                                <div><span className="text-slate-500 block">No. Putusan</span><span className="font-medium">{perkara.nomor_putusan}</span></div>
                                                                <div><span className="text-slate-500 block">Denda</span><span className="font-medium">{perkara.denda ? `Rp ${perkara.denda.toLocaleString()}` : '-'}</span></div>
                                                                <div><span className="text-slate-500 block">Subsider</span><span className="font-medium">{perkara.subsider_pidana || '-'}</span></div>
                                                                <div><span className="text-slate-500 block">Mulai Ditahan</span><span className="font-medium">{perkara.tanggal_mulai_ditahan || '-'}</span></div>
                                                                <div><span className="text-slate-500 block">Ekspirasi</span><span className="font-medium text-red-600">{perkara.tanggal_ekspirasi}</span></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-slate-500 italic">Belum ada riwayat litmas.</p>}
                        </section>
                    </div>
                ) : <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}
            </ScrollArea>
        </DialogContent>
      </Dialog>
    </TestPageLayout>
  );
}