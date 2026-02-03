import { useState, useEffect, useCallback } from 'react';
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
  Eye, FileText, ShieldAlert, Plus, Trash2, Phone, Briefcase, GraduationCap, AlertCircle, Save,
  CloudUpload, History, Clock, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { format, subDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// --- IMPORTS DARI FILE LAIN ---
import { JENIS_LITMAS, AGAMA_OPTIONS, PENDIDIKAN_OPTIONS } from '@/constants/registrasi';
import { DurationInput } from '@/components/registrasi/DurationInput';
import { SuggestionList } from '@/components/registrasi/SuggestionList';
import { ClientSelector } from '@/components/registrasi/ClientSelector';
import { PetugasPK, UPT, Klien } from '@/types/auth'; 

export default function OperatorRegistrasiTest() {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  
  const isOpAnak = hasRole('op_reg_anak');
  const isOpDewasa = hasRole('op_reg_dewasa');
  const userRoleCategory = isOpAnak ? "Anak" : (isOpDewasa ? "Dewasa" : "Admin");

  // --- STATE UTAMA ---
  const [activeTab, setActiveTab] = useState("klien_perkara");
  const [loading, setLoading] = useState(false);
  
  // Referensi & Data
  const [listPK, setListPK] = useState<PetugasPK[]>([]);
  const [listUPT, setListUPT] = useState<UPT[]>([]);
  const [listKlien, setListKlien] = useState<Klien[]>([]);
  const [dataLitmas, setDataLitmas] = useState<any[]>([]);
  const [dataKlienFull, setDataKlienFull] = useState<any[]>([]);

  // Selection & Forms
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedPkId, setSelectedPkId] = useState<string | null>(null);
  const [originalPkId, setOriginalPkId] = useState<string | null>(null);
  const [openPkCombo, setOpenPkCombo] = useState(false);

  // Edit Mode States
  const [editingKlien, setEditingKlien] = useState<any | null>(null);
  const [editingPenjamin, setEditingPenjamin] = useState<any | null>(null);
  const [editingLitmas, setEditingLitmas] = useState<any | null>(null);
  
  // Validasi & Hitungan
  const [tglLahir, setTglLahir] = useState("");
  const [hitungUsia, setHitungUsia] = useState("");
  const [hitungKategori, setHitungKategori] = useState("");
  const [usiaWarning, setUsiaWarning] = useState<string | null>(null);
  const [isCategoryMismatch, setIsCategoryMismatch] = useState(false);
  
  // UI States
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [openHistory, setOpenHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchKlienQuery, setSearchKlienQuery] = useState("");
  const [searchLitmasQuery, setSearchLitmasQuery] = useState("");
  const [matchesKlien, setMatchesKlien] = useState<any[]>([]);
  const [matchesPenjamin, setMatchesPenjamin] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<string | null>(null);

  // Perkara & File Upload
  const [perkaraList, setPerkaraList] = useState<any[]>([]);
  const [tempPerkara, setTempPerkara] = useState({
      pasal: '', tindak_pidana: '', nomor_putusan: '', 
      vonis_pidana: '', denda: '', subsider_pidana: '',
      tanggal_mulai_ditahan: '', tanggal_ekspirasi: ''
  });
  const [fileSuratPermintaan, setFileSuratPermintaan] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Dialogs
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; type: 'klien' | 'penjamin' | 'litmas' | null; payload: any | null; warningMessage?: string | null; }>({ isOpen: false, type: null, payload: null, warningMessage: null });
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicatePayload, setDuplicatePayload] = useState<any>(null); 

  // --- LOGIC FUNCTIONS ---

  // 1. REFRESH DATA EDIT (Agar data form selalu fresh setelah save)
  const refreshEditData = async (idKlien: number) => {
    try {
        const { data, error } = await supabase.from('klien').select(`*, penjamin (*), litmas:litmas!fk_litmas_klien (*, perkara (*))`).eq('id_klien', idKlien).single();
        if (error) throw error;
        const safeData = data as any;
        setEditingKlien(safeData);
        setEditingPenjamin(safeData.penjamin?.[0] || null);
        const firstLitmas = safeData.litmas?.[0] || null;
        setEditingLitmas(firstLitmas);
        setPerkaraList(firstLitmas?.perkara || []);
    } catch (error) { console.error("Gagal refresh data:", error); }
  };

  const checkLiveDuplicate = useCallback(async (table: 'klien' | 'penjamin', field: string, value: string) => {
    if (!value || value.length < 3) {
        if (table === 'klien') setMatchesKlien([]); else setMatchesPenjamin([]);
        return;
    }
    const { data } = await supabase.from(table).select('*').ilike(field, `%${value}%`).limit(5);
    if (table === 'klien') setMatchesKlien(data || []); else setMatchesPenjamin(data || []);
  }, []);

  const calculateAgeAndCategory = useCallback((dateString: string) => {
    if (!dateString) return;
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    setHitungUsia(age.toString());
    const kategoriByAge = age < 18 ? "Anak" : "Dewasa";
    setHitungKategori(kategoriByAge);
    let mismatch = false;
    if (isOpAnak && age >= 18) { setUsiaWarning("BLOCK: Usia >= 18 Tahun. Anda login sebagai Operator Anak."); mismatch = true; }
    else if (isOpDewasa && age < 18) { setUsiaWarning("BLOCK: Usia < 18 Tahun. Anda login sebagai Operator Dewasa."); mismatch = true; }
    else { setUsiaWarning(null); mismatch = false; }
    setIsCategoryMismatch(mismatch);
  }, [isOpAnak, isOpDewasa]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    setTglLahir(dateVal);
    calculateAgeAndCategory(dateVal);
  };

  const fetchReferences = useCallback(async () => {
    const { data: pkData } = await supabase.from('petugas_pk').select('*');
    if (pkData) setListPK(pkData as unknown as PetugasPK[]);
    const { data: uptData } = await supabase.from('upt').select('*');
    if (uptData) setListUPT(uptData as unknown as UPT[]);
    let queryKlien = supabase.from('klien').select('id_klien, nama_klien, nomor_register_lapas').order('id_klien', { ascending: false });
    if (isOpAnak) queryKlien = queryKlien.eq('kategori_usia', 'Anak');
    else if (isOpDewasa) queryKlien = queryKlien.eq('kategori_usia', 'Dewasa');
    const { data: k } = await queryKlien;
    if (k) setListKlien(k as unknown as Klien[]);
  }, [isOpAnak, isOpDewasa]);

  const fetchTableData = useCallback(async () => {
    setLoading(true);
    try {
      let qK = supabase.from('klien').select('*').order('id_klien', { ascending: false }).limit(20);
      if (isOpAnak) qK = qK.eq('kategori_usia', 'Anak');
      else if (isOpDewasa) qK = qK.eq('kategori_usia', 'Dewasa');
      const { data: kData } = await qK;
      setDataKlienFull(kData || []);
      const { data: lData } = await supabase.from('litmas').select(`*, klien:klien!fk_litmas_klien (nama_klien), petugas_pk:petugas_pk!fk_litmas_pk (nama, nip)`).order('id_litmas', { ascending: false }).limit(20);
      setDataLitmas(lData || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [isOpAnak, isOpDewasa]);

  const fetchHistory = useCallback(async () => {
      setLoadingHistory(true);
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const historyArr: any[] = [];
      try {
          const { data: kData } = await supabase.from('klien').select('id_klien, nama_klien, created_at').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false });
          kData?.forEach((k: any) => historyArr.push({ type: 'Klien Baru', title: k.nama_klien, date: k.created_at, id: k.id_klien }));
          const { data: pData } = await supabase.from('penjamin').select('id_klien, nama_penjamin, created_at').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false });
          pData?.forEach((p: any) => historyArr.push({ type: 'Penjamin', title: p.nama_penjamin, date: p.created_at, id: p.id_klien }));
          const { data: lData } = await supabase.from('litmas').select('id_litmas, nomor_surat_permintaan, waktu_registrasi, klien:klien!fk_litmas_klien(nama_klien)').gte('waktu_registrasi', sevenDaysAgo).order('waktu_registrasi', { ascending: false });
          lData?.forEach((l: any) => historyArr.push({ type: 'Registrasi Litmas', title: `${l.nomor_surat_permintaan} (${l.klien?.nama_klien || 'N/A'})`, date: l.waktu_registrasi, id: l.id_litmas }));
          historyArr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setHistoryData(historyArr);
      } catch(err) { console.error(err); } finally { setLoadingHistory(false); }
  }, []);

  const handleEditClick = async (item: any) => {
    setLoading(true); setMatchesKlien([]); setActiveInput(null);
    try {
        const { data, error } = await supabase.from('klien').select(`*, penjamin (*), litmas:litmas!fk_litmas_klien (*, perkara (*))`).eq('id_klien', item.id_klien).single();
        if (error) throw error;
        const safeData = data as any;
        setEditingKlien(safeData);
        setEditingPenjamin(safeData.penjamin?.[0] || null);
        const firstLitmas = safeData.litmas?.[0] || null;
        setEditingLitmas(firstLitmas);
        setPerkaraList(firstLitmas?.perkara || []);
        setSelectedClientId(safeData.id_klien);
        if (firstLitmas) { setSelectedPkId(firstLitmas.nama_pk || null); setOriginalPkId(firstLitmas.nama_pk || null); } 
        else { setSelectedPkId(null); setOriginalPkId(null); }
        setActiveTab("klien_perkara");
        toast({ title: "Mode Edit Aktif", description: `Mengedit data: ${safeData.nama_klien}` });
    } catch (error: any) { toast({ variant: "destructive", title: "Gagal load data", description: error.message }); } 
    finally { setLoading(false); }
  };

  const resetFormState = () => {
    setEditingKlien(null); setEditingPenjamin(null); setEditingLitmas(null);
    setPerkaraList([]); setSelectedClientId(null); setSelectedPkId(null); setOriginalPkId(null);
    setMatchesKlien([]); setMatchesPenjamin([]); setActiveInput(null); setFileSuratPermintaan(null);
    setTempPerkara({ pasal: '', tindak_pidana: '', nomor_putusan: '', vonis_pidana: '', denda: '', subsider_pidana: '', tanggal_mulai_ditahan: '', tanggal_ekspirasi: '' });
  };

  const handleCancelButton = (showToast = true) => { resetFormState(); if (showToast) toast({ title: "Edit Dibatalkan", description: "Form direset." }); };

  const handleSearchKlien = async () => {
      if(!searchKlienQuery) return fetchTableData();
      setLoading(true);
      const { data } = await supabase.from('klien').select('*').ilike('nama_klien', `%${searchKlienQuery}%`).limit(20);
      setDataKlienFull(data || []);
      setLoading(false);
  };

  const handleSearchLitmas = async () => {
      if(!searchLitmasQuery) return fetchTableData();
      setLoading(true);
      const { data } = await supabase.from('litmas').select(`*, klien:klien!fk_litmas_klien (nama_klien, nomor_register_lapas), petugas_pk:petugas_pk!fk_litmas_pk (nama, nip)`).ilike('nomor_surat_permintaan', `%${searchLitmasQuery}%`).limit(20);
      setDataLitmas(data || []);
      setLoading(false);
  };

  const uploadSuratPermintaan = async (file: File, namaKlien: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${namaKlien.replace(/\s+/g, '-')}_surat-permintaan.${fileExt}`;
      const { error } = await supabase.storage.from('surat-permintaan').upload(fileName, file);
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('surat-permintaan').getPublicUrl(fileName);
      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error('Upload Error:', error);
      toast({ variant: "destructive", title: "Gagal Upload", description: error.message });
      return null;
    }
  };

  // --- SAVE HANDLERS ---
  const executeSave = async () => {
      setConfirmDialog(prev => ({ ...prev, isOpen: false })); setLoading(true);
      const { type, payload } = confirmDialog;
      const formData = payload as FormData;

      try {
          if (type === 'klien') {
              const kategoriFix = isOpAnak ? 'Anak' : (isOpDewasa ? 'Dewasa' : hitungKategori);
              const dataKlien = {
                nik_klien: formData.get('nik_klien') as string, nama_klien: formData.get('nama_klien') as string,
                nomor_register_lapas: formData.get('nomor_register_lapas') as string, jenis_kelamin: formData.get('jenis_kelamin') as string,
                agama: formData.get('agama') as string, pendidikan: formData.get('pendidikan') as string,
                tempat_lahir: formData.get('tempat_lahir') as string, tanggal_lahir: (formData.get('tanggal_lahir') as string),
                usia: Number(formData.get('usia')), kategori_usia: kategoriFix, pekerjaan: formData.get('pekerjaan') as string,
                minat_bakat: formData.get('minat_bakat') as string, alamat: formData.get('alamat') as string,
                kelurahan: formData.get('kelurahan') as string, kecamatan: formData.get('kecamatan') as string, nomor_telepon: formData.get('nomor_telepon') as string,
              };

              // --- LOGIC UPLOAD DI TAB KLIEN (MODE EDIT) ---
              let uploadedFileUrl = null;
              if (fileSuratPermintaan && editingLitmas) {
                  setIsUploading(true);
                  uploadedFileUrl = await uploadSuratPermintaan(fileSuratPermintaan, dataKlien.nama_klien);
                  setIsUploading(false);
                  if (uploadedFileUrl) {
                      // FIX: Gunakan "as any" untuk menghindari error jika field belum ada di types
                      await supabase.from('litmas').update({ file_surat_permintaan_url: uploadedFileUrl } as any).eq('id_litmas', editingLitmas.id_litmas);
                      setFileSuratPermintaan(null);
                  }
              }

              if (editingKlien) {
                  const { error } = await supabase.from('klien').update(dataKlien).eq('id_klien', editingKlien.id_klien);
                  if (error) throw error;
                  if (editingLitmas && perkaraList.length > 0) {
                      await supabase.from('perkara').delete().eq('id_litmas', editingLitmas.id_litmas);
                      const perkaraPayloads = perkaraList.map(p => ({
                          id_litmas: editingLitmas.id_litmas, pasal: p.pasal, tindak_pidana: p.tindak_pidana, nomor_putusan: p.nomor_putusan,
                          vonis_pidana: p.vonis_pidana, denda: Number(p.denda)||0, subsider_pidana: p.subsider_pidana,
                          tanggal_mulai_ditahan: p.tanggal_mulai_ditahan || null, tanggal_ekspirasi: p.tanggal_ekspirasi || null
                      }));
                      await supabase.from('perkara').insert(perkaraPayloads);
                  }
                  
                  // REFRESH DATA EDIT
                  await refreshEditData(editingKlien.id_klien);
                  toast({ title: "Berhasil", description: "Perubahan data Klien & File disimpan." });
                  setActiveTab("penjamin");
              } else {
                  const { data: newKlien, error } = await supabase.from('klien').insert(dataKlien).select('id_klien').single();
                  if (error) throw error;
                  setSelectedClientId(newKlien.id_klien);
                  sessionStorage.setItem('temp_perkara_list', JSON.stringify(perkaraList));
                  toast({ title: "Berhasil", description: "Data Klien Disimpan. Lanjut ke Penjamin." });
                  setActiveTab("penjamin");
                  fetchReferences();
              }
          } else if (type === 'penjamin') {
              const dataPenjamin = {
                  id_klien: selectedClientId, nama_penjamin: formData.get('nama_penjamin') as string, nik_penjamin: formData.get('nik_penjamin') as string,
                  hubungan_klien: formData.get('hubungan_klien') as string, agama: formData.get('agama') as string, tempat_lahir: formData.get('tempat_lahir') as string,
                  tanggal_lahir: (formData.get('tanggal_lahir') as string) || null, usia: Number(formData.get('usia')), pendidikan: formData.get('pendidikan') as string,
                  pekerjaan: formData.get('pekerjaan') as string, alamat: formData.get('alamat') as string, kelurahan: formData.get('kelurahan') as string,
                  kecamatan: formData.get('kecamatan') as string, nomor_telepon: formData.get('nomor_telepon') as string,
              };
              
              if (editingPenjamin) {
                  await supabase.from('penjamin').update(dataPenjamin).eq('id_klien', selectedClientId);
                  // Refresh agar data penjamin di state update saat edit
                  if (editingKlien) await refreshEditData(editingKlien.id_klien);
              } else {
                  const {count} = await supabase.from('penjamin').select('*', {count: 'exact', head:true}).eq('id_klien', selectedClientId);
                  if(count && count > 0) await supabase.from('penjamin').update(dataPenjamin).eq('id_klien', selectedClientId);
                  else await supabase.from('penjamin').insert(dataPenjamin);
                  if (editingKlien) await refreshEditData(editingKlien.id_klien);
              }
              toast({ title: "Berhasil", description: "Data Penjamin Disimpan." });
              setActiveTab("litmas");
          } else if (type === 'litmas') {
              let uploadedFileUrl = null;
              // Upload hanya jika ada file (di mode insert atau update litmas)
              if (fileSuratPermintaan) {
                  setIsUploading(true);
                  const namaKlien = listKlien.find(k => k.id_klien === selectedClientId)?.nama_klien || "klien";
                  uploadedFileUrl = await uploadSuratPermintaan(fileSuratPermintaan, namaKlien);
                  setIsUploading(false);
                  if (!uploadedFileUrl) { setLoading(false); return; }
              }

              const tempPerkaraStorage = JSON.parse(sessionStorage.getItem('temp_perkara_list') || '[]');
              const dataLitmas = {
                  id_klien: selectedClientId, id_upt: formData.get('id_upt') ? Number(formData.get('id_upt')) : null, nama_pk: selectedPkId, 
                  nomor_urut: formData.get('nomor_urut') ? Number(formData.get('nomor_urut')) : null, nomor_surat_masuk: formData.get('nomor_surat_masuk') as string,
                  tanggal_diterima_bapas: (formData.get('tanggal_diterima_bapas') as string) || null, jenis_litmas: formData.get('jenis_litmas') as string,
                  tanggal_registrasi: (formData.get('tanggal_registrasi') as string) || null, nomor_register_litmas: formData.get('nomor_register_litmas') as string,
                  asal_bapas: formData.get('asal_bapas') as string, nomor_surat_permintaan: formData.get('nomor_surat_permintaan') as string,
                  tanggal_surat_permintaan: (formData.get('tanggal_surat_permintaan') as string) || null, nomor_surat_pelimpahan: formData.get('nomor_surat_pelimpahan') as string,
                  tanggal_surat_pelimpahan: (formData.get('tanggal_surat_pelimpahan') as string) || null, waktu_registrasi: new Date().toISOString(),
                  waktu_tunjuk_pk: new Date().toISOString(), ...(uploadedFileUrl ? { file_surat_permintaan_url: uploadedFileUrl } : {})
              };

              let litmasId = editingLitmas?.id_litmas;
              if(editingLitmas) {
                  // FIX: Gunakan "as any" agar typescript tidak protes
                  const { error } = await supabase.from('litmas').update(dataLitmas as any).eq('id_litmas', litmasId);
                  if(error) throw error;
              } else {
                  const { data, error } = await supabase.from('litmas').insert(dataLitmas as any).select('id_litmas').single();
                  if (error) throw error;
                  litmasId = data.id_litmas;
                  if (tempPerkaraStorage.length > 0) {
                      const perkaraPayloads = tempPerkaraStorage.map((p: any) => ({
                          id_litmas: litmasId, pasal: p.pasal, tindak_pidana: p.tindak_pidana, nomor_putusan: p.nomor_putusan,
                          vonis_pidana: p.vonis_pidana, denda: Number(p.denda)||0, subsider_pidana: p.subsider_pidana,
                          tanggal_mulai_ditahan: p.tanggal_mulai_ditahan || null, tanggal_ekspirasi: p.tanggal_ekspirasi || null
                      }));
                      await supabase.from('perkara').insert(perkaraPayloads);
                  }
              }

              const isNewAssignment = !editingLitmas && selectedPkId;
              const isReAssignment = editingLitmas && selectedPkId && selectedPkId !== originalPkId;
              if (isNewAssignment || isReAssignment) {
                    const klienData = listKlien.find(k => k.id_klien === selectedClientId) || editingKlien;
                    const penjaminData = editingPenjamin || {};
                    const perkaraData = perkaraList.length > 0 ? perkaraList[0] : {};
                    const waPayload = {
                        pk_id: selectedPkId, nomor_register_litmas: dataLitmas.nomor_register_litmas, jenis_litmas: dataLitmas.jenis_litmas,
                        asal_surat: dataLitmas.asal_bapas, nama_klien: klienData?.nama_klien || 'Tanpa Nama',
                        jenis_kelamin: klienData?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan', agama: klienData?.agama || '-',
                        nama_penjamin: penjaminData.nama_penjamin || '-', alamat_penjamin: penjaminData.alamat || '-',
                        telepon_penjamin: penjaminData.nomor_telepon || '-', pekerjaan_penjamin: penjaminData.pekerjaan || '-',
                        hubungan_penjamin: penjaminData.hubungan_klien ? penjaminData.hubungan_klien.replace('_', ' ').toUpperCase() : '-',
                        perkara: perkaraData.tindak_pidana || '-', pidana: perkaraData.vonis_pidana || '-', 
                        tanggal_2_3: perkaraData.tanggal_ekspirasi || '-', 
                        link_surat_perintah: "https://docs.google.com/document/d/1WHiCF_gwpj5En-l4U_L5MLAuyxGNky8bIsdKF9_3HC0/edit?usp=drivesdk",
                        link_surat_permintaan: uploadedFileUrl || editingLitmas?.file_surat_permintaan_url || '-'
                    };
                    supabase.functions.invoke('send-new-task-notification', { body: waPayload }).then(({ data, error }) => { if (error) console.error("Gagal kirim WA:", error); else console.log("WA Terkirim:", data); });
              }

              sessionStorage.removeItem('temp_perkara_list');
              setFileSuratPermintaan(null); 
              handleCancelButton(false); 
              toast({ title: "Selesai", description: "Registrasi Litmas Berhasil Disimpan." });
              setActiveTab("list_data");
              fetchTableData();
          }
      } catch (error: any) { toast({ variant: "destructive", title: "Gagal Menyimpan", description: error.message }); } 
      finally { setLoading(false); }
  };

  const initiateSaveKlien = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isCategoryMismatch) return toast({ variant: "destructive", title: "Blokir", description: "Usia tidak sesuai role." });
      const formData = new FormData(e.currentTarget);
      if (!editingKlien && matchesKlien.length > 0) { setDuplicatePayload(formData); setShowDuplicateAlert(true); return; }
      setConfirmDialog({ isOpen: true, type: 'klien', payload: formData, warningMessage: null });
  };

  const initiateSavePenjamin = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!selectedClientId) return toast({ variant: "destructive", title: "Error", description: "Pilih Klien dulu." });
      const formData = new FormData(e.currentTarget);
      setConfirmDialog({ isOpen: true, type: 'penjamin', payload: formData, warningMessage: null });
  };

  const initiateSaveLitmas = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!selectedClientId) return toast({ variant: "destructive", title: "Error", description: "Pilih Klien dulu." });
      const formData = new FormData(e.currentTarget);
      setLoading(true);
      const { count } = await supabase.from('penjamin').select('*', { count: 'exact', head: true }).eq('id_klien', selectedClientId);
      setLoading(false);
      let warning = null;
      if (count === 0) warning = "PERHATIAN: Data Penjamin untuk klien ini BELUM DIISI!";
      setConfirmDialog({ isOpen: true, type: 'litmas', payload: formData, warningMessage: warning });
  };

  useEffect(() => { fetchReferences(); }, [fetchReferences]);
  useEffect(() => { if (activeTab === 'list_data') fetchTableData(); }, [activeTab, fetchTableData]);

  // --- RENDER ---
  return (
    <TestPageLayout
      title={`Registrasi (${userRoleCategory})`}
      description="Sistem input data Litmas dengan fitur multi-perkara & validasi."
      permissionCode="access_operator_registrasi"
      icon={<ClipboardList className="w-6 h-6" />}
      action={
        <Button variant="outline" onClick={() => { setOpenHistory(true); fetchHistory(); }} className="gap-2 bg-white hover:bg-slate-50 text-blue-700 border-blue-200 shadow-sm">
          <History className="w-4 h-4" /> Riwayat Input
        </Button>
      }
    >
      <div className="w-full space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-slate-100/80 rounded-xl">
            <TabsTrigger value="klien_perkara" className="py-3">{editingKlien ? 'Edit Klien' : '1. Klien & Perkara'}</TabsTrigger>
            <TabsTrigger value="penjamin" className="py-3">2. Penjamin</TabsTrigger>
            <TabsTrigger value="litmas" className="py-3">3. Litmas</TabsTrigger>
            <TabsTrigger value="list_data" className="py-3 flex gap-2"><List className="w-4 h-4" /> Data Terdaftar</TabsTrigger>
          </TabsList>

          {/* TAB 1: KLIEN & PERKARA */}
          <TabsContent value="klien_perkara">
            <Card className={cn("border-t-4 shadow-sm", editingKlien ? "border-t-amber-500 bg-amber-50/30" : "border-t-slate-800")}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Identitas Klien & Data Perkara</CardTitle>
                  <div className="flex gap-2">
                    {editingKlien && <Button variant="outline" size="sm" onClick={() => handleCancelButton(true)}><XCircle className="w-4 h-4 mr-2" /> Batal</Button>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={initiateSaveKlien} className="space-y-8">
                  {/* UPLOAD SURAT PERMINTAAN */}
                  <div className="space-y-4">
                    <div className="col-span-1 md:col-span-2">
                      <Label>Upload Surat Permintaan (Wajib)</Label>
                      <div className="mt-2 flex justify-center rounded-lg border-2 border-dashed border-slate-300 px-6 py-6 hover:bg-slate-50 hover:border-blue-400 transition-all relative cursor-pointer group">
                        
                        <div className="text-center w-full">
                          {/* KONDISI 1: FILE BARU DIPILIH */}
                          {fileSuratPermintaan ? (
                            <div className="flex flex-col items-center text-green-600 animate-in fade-in zoom-in-95">
                              <FileText className="mx-auto h-12 w-12" />
                              <span className="mt-2 block text-sm font-semibold">{fileSuratPermintaan.name}</span>
                              <span className="text-xs text-slate-500 bg-green-50 px-2 py-1 rounded-full mt-1">Siap diupload (Klik Simpan)</span>
                            </div>
                          ) 
                          /* KONDISI 2: FILE SUDAH ADA DI DATABASE (MODE EDIT) */
                          : (editingLitmas && editingLitmas.file_surat_permintaan_url) ? (
                            <div className="flex flex-col items-center justify-center p-2 rounded-md bg-blue-50/50 border border-blue-100">
                                <FileText className="h-10 w-10 text-blue-600 mb-2" />
                                <span className="text-sm font-bold text-slate-700">Surat Permintaan Tersimpan</span>
                                <div className="flex gap-2 mt-2 z-20 relative">
                                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs bg-white" onClick={(e) => {
                                        e.preventDefault();
                                        window.open(editingLitmas.file_surat_permintaan_url, '_blank');
                                    }}>
                                        <ExternalLink className="w-3 h-3 mr-1"/> Lihat File
                                    </Button>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-2 italic">Klik area kotak ini untuk mengganti file</span>
                            </div>
                          ) 
                          /* KONDISI 3: BELUM ADA FILE */
                          : (
                            <div className="flex flex-col items-center text-slate-500 group-hover:text-blue-600 transition-colors">
                              <CloudUpload className="mx-auto h-12 w-12 mb-2" />
                              <span className="block text-sm font-semibold">Pilih File Surat Permintaan</span>
                              <span className="text-xs mt-1">PDF, JPG, PNG (Maks 5MB)</span>
                            </div>
                          )}
                        </div>

                        {/* INPUT FILE HIDDEN - SELALU AKTIF */}
                        <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => { if (e.target.files && e.target.files[0]) { setFileSuratPermintaan(e.target.files[0]); toast({ title: "File Dipilih", description: e.target.files[0].name }); } }}
                        />
                      </div>
                    </div>
                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 flex items-center"><User className="w-4 h-4 mr-2" /> Data Diri Utama</h4>
                        
                        {/* Nama Klien & Suggestion */}
                        <div className="grid gap-2">
                          <Label>Nama Lengkap</Label>
                          <div className="relative">
                            <Input name="nama_klien" defaultValue={editingKlien?.nama_klien || ''} required placeholder="Nama Klien" 
                              onChange={(e) => checkLiveDuplicate('klien', 'nama_klien', e.target.value)} onFocus={() => setActiveInput('nama_klien')} onBlur={() => setTimeout(() => setActiveInput(null), 200)} autoComplete="off"
                              className={cn(matchesKlien.length > 0 && "pr-10 border-orange-300 ring-orange-200 focus-visible:ring-orange-300")}
                            />
                            {matchesKlien.length > 0 && (
                              <TooltipProvider>
                                <Tooltip><TooltipTrigger asChild><div className="absolute right-3 top-2.5 text-orange-500 animate-pulse cursor-help"><AlertCircle className="w-5 h-5" /></div></TooltipTrigger><TooltipContent side="right" className="bg-orange-500 text-white border-0"><p>Data mirip ditemukan!</p></TooltipContent></Tooltip>
                              </TooltipProvider>
                            )}
                            <SuggestionList matches={matchesKlien} isVisible={activeInput === 'nama_klien'} labelField="nama_klien" subLabelField="nik_klien" onSelect={(item) => { handleEditClick(item); setMatchesKlien([]); }} />
                          </div>
                        </div>

                        {/* NIK Klien */}
                        <div className="grid gap-2">
                          <Label>NIK Klien</Label>
                          <div className="relative">
                            <Input name="nik_klien" defaultValue={editingKlien?.nik_klien || ''} placeholder="Nomor Induk Kependudukan" 
                              onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); e.target.value = val; checkLiveDuplicate('klien', 'nik_klien', val); }}
                              onFocus={() => setActiveInput('nik_klien')} onBlur={() => setTimeout(() => setActiveInput(null), 200)} maxLength={16} autoComplete="off" inputMode="numeric"
                              className={cn(matchesKlien.length > 0 && "pr-10 border-orange-300 ring-orange-200 focus-visible:ring-orange-300")}
                            />
                            {matchesKlien.length > 0 && <div className="absolute right-3 top-2.5 text-orange-500 animate-pulse"><AlertCircle className="w-5 h-5" /></div>}
                            <SuggestionList matches={matchesKlien} isVisible={activeInput === 'nik_klien'} labelField="nik_klien" subLabelField="nama_klien" onSelect={(item) => { handleEditClick(item); setMatchesKlien([]); }} />
                          </div>
                        </div>

                        <div className="grid gap-2"><Label>No. Register Lapas</Label><Input name="nomor_register_lapas" defaultValue={editingKlien?.nomor_register_lapas || ''} required /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2"><Label>Jenis Kelamin</Label><Select name="jenis_kelamin" required defaultValue={editingKlien?.jenis_kelamin || undefined}><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent></Select></div>
                          <div className="grid gap-2"><Label>Agama</Label><Select name="agama" defaultValue={editingKlien?.agama || undefined}><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent>{AGAMA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
                        </div>
                        <div className="grid gap-2"><Label>Pendidikan Terakhir</Label><Select name="pendidikan" defaultValue={editingKlien?.pendidikan || undefined}><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent>{PENDIDIKAN_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Kelahiran & Usia</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2"><Label>Tempat Lahir</Label><Input name="tempat_lahir" defaultValue={editingKlien?.tempat_lahir || ''} /></div>
                          <div className="grid gap-2"><Label>Tanggal Lahir</Label><Input name="tanggal_lahir" type="date" value={tglLahir} onChange={handleDateChange} required /></div>
                        </div>
                        
                        {usiaWarning && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Akses Ditolak</AlertTitle><AlertDescription>{usiaWarning}</AlertDescription></Alert>}

                        <div className="grid grid-cols-2 gap-4 bg-slate-100 p-3 rounded-md">
                          <div className="grid gap-1"><Label className="text-xs text-slate-500">Usia</Label><Input name="usia" value={hitungUsia} readOnly className="bg-white" /></div>
                          <div className="grid gap-1"><Label className="text-xs text-slate-500">Kategori</Label><Input name="kategori_usia" value={isOpAnak ? 'Anak' : (isOpDewasa ? 'Dewasa' : hitungKategori)} readOnly className="bg-white font-bold" /></div>
                        </div>
                        <div className="grid gap-2"><Label>Pekerjaan</Label><Input name="pekerjaan" defaultValue={editingKlien?.pekerjaan || ''} /></div>
                        <div className="grid gap-2"><Label>Minat / Bakat</Label><Input name="minat_bakat" defaultValue={editingKlien?.minat_bakat || ''} /></div>
                      </div>
                    </div>

                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="grid gap-2"><Label>Alamat Lengkap</Label><Textarea name="alamat" defaultValue={editingKlien?.alamat || ''} className="h-24" /></div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2"><Label>Kelurahan</Label><Input name="kelurahan" defaultValue={editingKlien?.kelurahan || ''} /></div>
                          <div className="grid gap-2"><Label>Kecamatan</Label><Input name="kecamatan" defaultValue={editingKlien?.kecamatan || ''} /></div>
                        </div>
                        <div className="grid gap-2"><Label>Nomor Telepon</Label><Input name="nomor_telepon" defaultValue={editingKlien?.nomor_telepon || ''} /></div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* MULTI PERKARA SECTION */}
                  <div className="space-y-4 bg-red-50 p-6 rounded-lg border border-red-100">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-red-700 flex items-center gap-2"><Gavel className="w-5 h-5" />Data Perkara / Kriminal</h3>
                      <Badge variant="outline" className="bg-white text-red-600 border-red-200">Total: {perkaraList.length} Kasus</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-4 rounded shadow-sm">
                      <div className="md:col-span-2 grid gap-2"><Label>Pasal</Label><Input value={tempPerkara.pasal} onChange={(e) => setTempPerkara({...tempPerkara, pasal: e.target.value})} placeholder="Cth: 363" /></div>
                      <div className="md:col-span-3 grid gap-2"><Label>Tindak Pidana</Label><Input value={tempPerkara.tindak_pidana} onChange={(e) => setTempPerkara({...tempPerkara, tindak_pidana: e.target.value})} placeholder="Pencurian" /></div>
                      <div className="md:col-span-3 grid gap-2"><Label>No. Putusan</Label><Input value={tempPerkara.nomor_putusan} onChange={(e) => setTempPerkara({...tempPerkara, nomor_putusan: e.target.value})} /></div>
                      <div className="md:col-span-4 grid gap-2"><Label>Vonis Pidana</Label><DurationInput label="Durasi Vonis" value={tempPerkara.vonis_pidana} onChange={(val) => setTempPerkara({...tempPerkara, vonis_pidana: val})} /></div>
                      
                      <div className="md:col-span-3 grid gap-2"><Label>Denda (Rp)</Label><Input type="number" value={tempPerkara.denda} onChange={(e) => setTempPerkara({...tempPerkara, denda: e.target.value})} /></div>
                      <div className="md:col-span-4 grid gap-2"><Label>Subsider</Label><DurationInput label="Durasi Subsider" value={tempPerkara.subsider_pidana} onChange={(val) => setTempPerkara({...tempPerkara, subsider_pidana: val})} /></div>
                      <div className="md:col-span-2 grid gap-2"><Label>Mulai Ditahan</Label><Input type="date" value={tempPerkara.tanggal_mulai_ditahan} onChange={(e) => setTempPerkara({...tempPerkara, tanggal_mulai_ditahan: e.target.value})} /></div>
                      <div className="md:col-span-2 grid gap-2"><Label>Ekspirasi</Label><Input type="date" value={tempPerkara.tanggal_ekspirasi} onChange={(e) => setTempPerkara({...tempPerkara, tanggal_ekspirasi: e.target.value})} /></div>
                      
                      <div className="md:col-span-1">
                        <Button type="button" onClick={() => { if (!tempPerkara.pasal || !tempPerkara.tindak_pidana) return toast({ variant: "destructive", title: "Gagal", description: "Pasal & Tindak Pidana wajib diisi." }); setPerkaraList([...perkaraList, { ...tempPerkara, id: Date.now() }]); setTempPerkara({ pasal: '', tindak_pidana: '', nomor_putusan: '', vonis_pidana: '', denda: '', subsider_pidana: '', tanggal_mulai_ditahan: '', tanggal_ekspirasi: '' }); }} size="icon" className="bg-red-600 hover:bg-red-700 w-full"><Plus className="w-5 h-5" /></Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {perkaraList.map((p, idx) => (
                        <div key={p.id || idx} className="flex items-center justify-between bg-white p-3 rounded border border-red-200 text-sm">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                            <div><span className="text-xs text-slate-500 block">Pasal</span><span className="font-bold">{p.pasal}</span></div>
                            <div><span className="text-xs text-slate-500 block">Pidana</span><span>{p.tindak_pidana}</span></div>
                            <div><span className="text-xs text-slate-500 block">Vonis</span><span>{p.vonis_pidana}</span></div>
                            <div><span className="text-xs text-slate-500 block">Ekspirasi</span><span className="text-red-600 font-medium">{p.tanggal_ekspirasi}</span></div>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => { const newList = [...perkaraList]; newList.splice(idx, 1); setPerkaraList(newList); }} className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      ))}
                      {perkaraList.length === 0 && <p className="text-center text-sm text-red-400 italic">Belum ada data perkara ditambahkan.</p>}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 gap-2">
                    <Button type="submit" size="lg" className={cn("w-full md:w-auto", editingKlien ? "bg-amber-600 hover:bg-amber-700" : "")} disabled={loading || isCategoryMismatch}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingKlien ? "Simpan Perubahan" : "Simpan & Lanjut")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: PENJAMIN */}
          <TabsContent value="penjamin">
            <Card className="border-t-4 border-t-green-600 shadow-sm">
              <CardHeader><CardTitle>Data Penjamin</CardTitle><CardDescription>Informasi keluarga.</CardDescription></CardHeader>
              <CardContent>
                <form onSubmit={initiateSavePenjamin} className="space-y-6 max-w-3xl mx-auto">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><ClientSelector listKlien={listKlien} selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} editingKlien={editingKlien} handleCancelButton={handleCancelButton} loading={loading} userRoleCategory={userRoleCategory} /></div>
                  <div className={cn("space-y-6", !selectedClientId && "opacity-50 pointer-events-none")}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="grid gap-2">
                        <Label>Nama Penjamin</Label>
                        <div className="relative">
                          <Input name="nama_penjamin" defaultValue={editingPenjamin?.nama_penjamin || ''} required onChange={(e) => checkLiveDuplicate('penjamin', 'nama_penjamin', e.target.value)} onFocus={() => setActiveInput('nama_penjamin')} onBlur={() => setTimeout(() => setActiveInput(null), 200)} autoComplete="off" className={cn(matchesPenjamin.length > 0 && "pr-10 border-orange-300 ring-orange-200 focus-visible:ring-orange-300")} />
                          {matchesPenjamin.length > 0 && <div className="absolute right-3 top-2.5 text-orange-500 animate-pulse"><AlertCircle className="w-5 h-5" /></div>}
                          <SuggestionList matches={matchesPenjamin} isVisible={activeInput === 'nama_penjamin'} labelField="nama_penjamin" subLabelField="nik_penjamin" onSelect={(item) => { toast({ title: "Info", description: `Penjamin ${item.nama_penjamin} sudah ada.` }); setMatchesPenjamin([]); }} />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>NIK Penjamin</Label>
                        <div className="relative">
                          <Input name="nik_penjamin" defaultValue={editingPenjamin?.nik_penjamin || ''} placeholder="Wajib Diisi" required onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); e.target.value = val; checkLiveDuplicate('penjamin', 'nik_penjamin', val); }} onFocus={() => setActiveInput('nik_penjamin')} onBlur={() => setTimeout(() => setActiveInput(null), 200)} maxLength={16} autoComplete="off" inputMode="numeric" className={cn(matchesPenjamin.length > 0 && "pr-10 border-orange-300 ring-orange-200 focus-visible:ring-orange-300")} />
                          {matchesPenjamin.length > 0 && <div className="absolute right-3 top-2.5 text-orange-500 animate-pulse"><AlertCircle className="w-5 h-5" /></div>}
                          <SuggestionList matches={matchesPenjamin} isVisible={activeInput === 'nik_penjamin'} labelField="nik_penjamin" subLabelField="nama_penjamin" onSelect={(item) => { toast({ title: "Info", description: `NIK ${item.nik_penjamin} sudah terdaftar.` }); setMatchesPenjamin([]); }} />
                        </div>
                      </div>
                      <div className="grid gap-2"><Label>Hubungan</Label><Select name="hubungan_klien" defaultValue={editingPenjamin?.hubungan_klien || undefined} required><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent><SelectItem value="orang_tua">Orang Tua</SelectItem><SelectItem value="istri_suami">Istri / Suami</SelectItem><SelectItem value="kakak_adik">Kakak / Adik</SelectItem><SelectItem value="lainnya">Lainnya</SelectItem></SelectContent></Select></div>
                      <div className="grid gap-2"><Label>Agama</Label><Select name="agama" defaultValue={editingPenjamin?.agama || undefined}><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent>{AGAMA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
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
                    <div className="flex justify-end pt-4"><Button type="submit" className="bg-green-600 hover:bg-green-700">{loading ? <Loader2 className="animate-spin"/> : "Simpan Penjamin"}</Button></div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: LITMAS */}
          <TabsContent value="litmas">
            <Card className="border-t-4 border-t-blue-600 shadow-sm">
              <CardHeader><CardTitle>Registrasi Litmas</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={initiateSaveLitmas} className="space-y-6 max-w-3xl mx-auto">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><ClientSelector listKlien={listKlien} selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} editingKlien={editingKlien} handleCancelButton={handleCancelButton} loading={loading} userRoleCategory={userRoleCategory} /></div>
                  <div className={cn("space-y-6", !selectedClientId && "opacity-50 pointer-events-none")}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="grid gap-2"><Label>Jenis Litmas</Label><Select name="jenis_litmas" defaultValue={editingLitmas?.jenis_litmas || undefined} required><SelectTrigger><SelectValue placeholder="Pilih Jenis..." /></SelectTrigger><SelectContent>{JENIS_LITMAS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
                      <div className="grid gap-2"><Label>Asal UPT</Label><Select name="id_upt" defaultValue={editingLitmas?.id_upt ? String(editingLitmas.id_upt) : undefined}><SelectTrigger><SelectValue placeholder="Pilih UPT..." /></SelectTrigger><SelectContent>{listUPT.map((upt) => (<SelectItem key={upt.id_upt} value={String(upt.id_upt)}>{upt.nama_upt}</SelectItem>))}</SelectContent></Select></div>
                      <div className="grid gap-2"><Label>Nomor Urut</Label><Input name="nomor_urut" type="number" defaultValue={editingLitmas?.nomor_urut || ''} /></div>
                      <div className="grid gap-2"><Label>Asal Bapas</Label><Input name="asal_bapas" defaultValue={editingLitmas?.asal_bapas || 'Bapas Kelas I Jakarta Barat'} /></div>
                      <div className="grid gap-2"><Label>Tanggal Registrasi</Label><Input name="tanggal_registrasi" type="date" defaultValue={editingLitmas?.tanggal_registrasi || new Date().toISOString().split('T')[0]} /></div>
                      <div className="grid gap-2"><Label>Nomor Register Litmas</Label><Input name="nomor_register_litmas" defaultValue={editingLitmas?.nomor_register_litmas || ''} placeholder="Reg. Bapas..." /></div>
                      <div className="col-span-2"><Separator className="my-2" /></div>
                      <div className="grid gap-2"><Label>No. Surat Permintaan</Label><Input name="nomor_surat_permintaan" defaultValue={editingLitmas?.nomor_surat_permintaan || ''} required /></div>
                      <div className="grid gap-2"><Label>Tgl Surat Permintaan</Label><Input name="tanggal_surat_permintaan" type="date" defaultValue={editingLitmas?.tanggal_surat_permintaan || ''} required /></div>
                      <div className="grid gap-2"><Label>No. Surat Pelimpahan</Label><Input name="nomor_surat_pelimpahan" defaultValue={editingLitmas?.nomor_surat_pelimpahan || ''} /></div>
                      <div className="grid gap-2"><Label>Tgl Surat Pelimpahan</Label><Input name="tanggal_surat_pelimpahan" type="date" defaultValue={editingLitmas?.tanggal_surat_pelimpahan || ''} /></div>
                      <div className="grid gap-2"><Label>Tgl Diterima Bapas</Label><Input name="tanggal_diterima_bapas" type="date" defaultValue={editingLitmas?.tanggal_diterima_bapas || ''} required /></div>
                      <div className="grid gap-2"><Label>No. Agenda Masuk</Label><Input name="nomor_surat_masuk" defaultValue={editingLitmas?.nomor_surat_masuk || ''} /></div>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-4">
                      <div className="grid gap-2">
                        <Label className="text-blue-900 font-bold flex items-center gap-2"><UserCheck className="w-4 h-4" /> Tunjuk Petugas PK</Label>
                        <Popover open={openPkCombo} onOpenChange={setOpenPkCombo}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={openPkCombo} className="w-full justify-between bg-white border-blue-200 hover:bg-blue-50 h-auto py-2 text-left">
                              {listPK.find((pk) => pk.id === selectedPkId) ? (
                                <div className="flex flex-col items-start text-left leading-tight overflow-hidden"><span className="font-semibold text-slate-900 truncate w-full">{listPK.find((pk) => pk.id === selectedPkId)?.nama}</span><span className="text-xs text-slate-500 truncate w-full">NIP: {listPK.find((pk) => pk.id === selectedPkId)?.nip}</span></div>
                              ) : <span className="text-slate-500">Pilih Petugas PK...</span>}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Cari PK..." />
                              <CommandList>
                                <CommandEmpty>Tidak ditemukan.</CommandEmpty>
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
                    </div>
                    <div className="flex justify-end pt-4"><Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isUploading}>{isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengupload...</> : <>{loading ? <Loader2 className="animate-spin"/> : "Simpan Litmas"}</>}</Button></div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: LIST DATA */}
          <TabsContent value="list_data">
            <Tabs defaultValue="list_klien" className="w-full">
              <div className="flex items-center justify-between mb-4"><TabsList><TabsTrigger value="list_klien">Data Klien</TabsTrigger><TabsTrigger value="list_litmas">Permintaan Litmas</TabsTrigger></TabsList><Button variant="ghost" size="sm" onClick={fetchTableData}><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /></Button></div>
              <TabsContent value="list_klien"><Card className="border-t-4 border-t-purple-600 shadow-sm"><CardHeader className="pb-2"><div className="flex justify-between"><div><CardTitle>Daftar Klien Terdaftar</CardTitle><CardDescription>Database klien {userRoleCategory}</CardDescription></div><div className="flex gap-2"><div className="relative w-60"><Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" /><Input placeholder="Cari Nama Klien..." className="pl-8" value={searchKlienQuery} onChange={(e) => setSearchKlienQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchKlien()} /></div><Button size="icon" variant="outline" onClick={handleSearchKlien}><Search className="w-4 h-4"/></Button></div></div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Nama Klien</TableHead><TableHead>No. Register</TableHead><TableHead>JK</TableHead><TableHead>Usia</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{dataKlienFull.length > 0 ? dataKlienFull.map((k) => (<TableRow key={k.id_klien}><TableCell className="font-medium">{k.nama_klien}</TableCell><TableCell>{k.nomor_register_lapas}</TableCell><TableCell>{k.jenis_kelamin}</TableCell><TableCell>{k.usia} Thn</TableCell><TableCell className="flex gap-2"><Button variant="outline" size="sm" className="h-8 px-2" onClick={() => { setDetailData(k); setOpenDetail(true); }}><Eye className="w-3.5 h-3.5 mr-1" /> Detail</Button><Button variant="outline" size="sm" onClick={() => handleEditClick(k)} className="h-8 px-2 text-blue-600"><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button></TableCell></TableRow>)) : <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Data tidak ditemukan.</TableCell></TableRow>}</TableBody></Table></CardContent></Card></TabsContent>
              <TabsContent value="list_litmas"><Card className="border-t-4 border-t-orange-600 shadow-sm"><CardHeader className="pb-2"><div className="flex justify-between"><div><CardTitle>Daftar Permintaan Litmas</CardTitle><CardDescription>Status registrasi.</CardDescription></div><div className="flex gap-2"><div className="relative w-60"><Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" /><Input placeholder="Cari No. Surat..." className="pl-8" value={searchLitmasQuery} onChange={(e) => setSearchLitmasQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchLitmas()} /></div><Button size="icon" variant="outline" onClick={handleSearchLitmas}><Search className="w-4 h-4"/></Button></div></div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>No. Surat</TableHead><TableHead>Jenis</TableHead><TableHead>Klien</TableHead><TableHead>Petugas PK</TableHead></TableRow></TableHeader><TableBody>{dataLitmas.length > 0 ? dataLitmas.map((l) => (<TableRow key={l.id_litmas}><TableCell className="font-medium">{l.nomor_surat_permintaan}</TableCell><TableCell><Badge variant="secondary">{l.jenis_litmas}</Badge></TableCell><TableCell>{l.klien?.nama_klien}</TableCell><TableCell>{l.petugas_pk ? <span className="text-blue-700 font-medium flex items-center gap-1"><UserCheck className="w-3 h-3"/> {l.petugas_pk.nama}</span> : <span className="text-red-500 text-xs">Belum Ada</span>}</TableCell></TableRow>)) : <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">Data tidak ditemukan.</TableCell></TableRow>}</TableBody></Table></CardContent></Card></TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* SIDE SHEET: RIWAYAT INPUT (MUNCUL DARI KANAN) */}
      <Sheet open={openHistory} onOpenChange={setOpenHistory}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col h-full">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="flex items-center gap-2"><History className="w-5 h-5 text-blue-600" /> Riwayat Input</SheetTitle>
            <SheetDescription>Aktivitas penambahan data 7 hari terakhir.</SheetDescription>
          </SheetHeader>
          <div className="flex justify-end py-2"><Button variant="ghost" size="sm" onClick={fetchHistory} disabled={loadingHistory} className="text-xs h-8 gap-2 hover:bg-slate-100"><RefreshCw className={cn("w-3.5 h-3.5", loadingHistory && "animate-spin")} /> Refresh Data</Button></div>
          <ScrollArea className="flex-1 -mx-6 px-6">
              {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /><span className="text-xs">Memuat data...</span></div>
              ) : historyData.length > 0 ? (
                  <div className="space-y-4 py-2 pb-10">
                      {historyData.map((item, idx) => (
                          <div key={idx} className="flex gap-3 items-start border-b pb-3 last:border-0 last:pb-0 group">
                              <div className={cn("w-2 h-2 mt-2 rounded-full shrink-0 ring-2 ring-offset-2", item.type === 'Klien Baru' ? "bg-purple-500 ring-purple-100" : item.type === 'Penjamin' ? "bg-green-500 ring-green-100" : "bg-blue-500 ring-blue-100")}></div>
                              <div className="flex-1">
                                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors cursor-pointer">{item.title}</p>
                                  <div className="flex items-center gap-2 mt-1.5"><Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal border bg-slate-50">{item.type}</Badge><span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(item.date), "dd MMM HH:mm", { locale: localeId })}</span></div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (<div className="text-center py-20 opacity-50"><History className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-sm">Belum ada aktivitas baru.</p></div>)}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* FLOATING BUTTON MOBILE */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700" onClick={() => { setOpenHistory(true); fetchHistory(); }}><History className="w-6 h-6" /></Button></TooltipTrigger><TooltipContent side="left" className="bg-blue-600 text-white"><p>Lihat Riwayat Input</p></TooltipContent></Tooltip></TooltipProvider>
      </div>

      {/* ALERT DUPLICATE CHECK */}
      <AlertDialog open={showDuplicateAlert} onOpenChange={setShowDuplicateAlert}>
        <AlertDialogContent className="border-l-4 border-l-orange-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600"><AlertTriangle className="w-5 h-5" /> Data Mirip Terdeteksi!</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">Sistem mendeteksi bahwa nama atau NIK yang Anda masukkan sudah ada di database.<br/>Apakah Anda yakin ingin <strong>menyimpan data ganda</strong> ini?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDuplicateAlert(false); setDuplicatePayload(null); }}>Periksa Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDuplicateAlert(false); setConfirmDialog({ isOpen: true, type: 'klien', payload: duplicatePayload }); }} className="bg-orange-600 hover:bg-orange-700">Ya, Tetap Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CONFIRMATION DIALOG */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent className={cn("border-l-4", confirmDialog.warningMessage ? "border-l-red-600" : "border-l-blue-600")}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn("flex items-center gap-2", confirmDialog.warningMessage ? "text-red-700" : "text-blue-700")}>{confirmDialog.warningMessage ? <ShieldAlert className="w-6 h-6" /> : <Save className="w-5 h-5" />}{confirmDialog.warningMessage ? "Peringatan Validasi Data!" : "Konfirmasi Penyimpanan"}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-700 text-base">{confirmDialog.warningMessage ? <span className="block bg-red-50 p-3 rounded-md border border-red-100 text-red-800 font-medium mt-2">{confirmDialog.warningMessage}</span> : "Apakah seluruh data yang Anda masukkan sudah benar?"}<br/><span className="block mt-2">Data akan disimpan ke dalam sistem MONALISA.</span></AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel><AlertDialogAction onClick={executeSave} disabled={loading} className={cn(confirmDialog.warningMessage ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700")}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{confirmDialog.warningMessage ? "Tetap Lanjutkan" : "Ya, Simpan Data"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DETAIL DIALOG */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-6 pb-4 bg-slate-50 border-b shrink-0">
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">{detailData?.nama_klien?.charAt(0) || <User />}</div><div><DialogTitle className="text-xl font-bold flex items-center gap-2">{detailData?.nama_klien}</DialogTitle><div className="flex gap-2 mt-1"><Badge variant="outline" className="bg-white border-slate-300 text-slate-600 font-normal">Reg: {detailData?.nomor_register_lapas}</Badge><Badge className={cn("text-xs font-normal", detailData?.kategori_usia === "Anak" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800")}>{detailData?.kategori_usia}</Badge></div></div></div>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6 bg-slate-50/30">
            {detailData ? (
              <div className="space-y-8 pb-10">
                <section><h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><User className="w-4 h-4"/> Informasi Pribadi</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-xl border shadow-sm"><div className="space-y-4"><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500 font-medium">NIK</span><span className="col-span-2 font-semibold text-slate-800">{detailData.nik_klien || '-'}</span></div><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500 font-medium">TTL</span><span className="col-span-2 text-slate-800">{detailData.tempat_lahir}, {detailData.tanggal_lahir}</span></div><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500 font-medium">JK</span><span className="col-span-2 text-slate-800">{detailData.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span></div></div><div className="space-y-4"><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500 font-medium">Pendidikan</span><span className="col-span-2 text-slate-800 flex items-center gap-1"><GraduationCap className="w-3 h-3 text-slate-400"/> {detailData.pendidikan}</span></div><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500 font-medium">Pekerjaan</span><span className="col-span-2 text-slate-800 flex items-center gap-1"><Briefcase className="w-3 h-3 text-slate-400"/> {detailData.pekerjaan || '-'}</span></div></div></div></section>
                <section><h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin className="w-4 h-4"/> Alamat & Kontak</h3><div className="bg-white p-5 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><p className="text-xs text-slate-400 uppercase font-semibold">Alamat Lengkap</p><p className="text-sm text-slate-700 leading-relaxed">{detailData.alamat}</p><div className="flex gap-4 mt-2 text-sm text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded">Kel: {detailData.kelurahan || '-'}</span><span className="bg-slate-100 px-2 py-1 rounded">Kec: {detailData.kecamatan || '-'}</span></div></div><div className="space-y-2"><p className="text-xs text-slate-400 uppercase font-semibold">Nomor Telepon</p><p className="text-lg font-bold text-green-700 flex items-center gap-2"><Phone className="w-4 h-4"/> {detailData.nomor_telepon || '-'}</p></div></div></section>
                <section><h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><UserCheck className="w-4 h-4"/> Data Penjamin</h3>{detailData.penjamin && detailData.penjamin.length > 0 ? ( detailData.penjamin.map((p: any, idx: number) => (<div key={idx} className="bg-green-50/50 p-5 rounded-xl border border-green-100 shadow-sm relative overflow-hidden"><div className="absolute top-0 right-0 bg-green-100 px-3 py-1 text-xs font-bold text-green-700 rounded-bl-lg">{p.hubungan_klien?.replace('_', ' ').toUpperCase()}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-3"><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500">Nama</span><span className="col-span-2 font-bold text-slate-800">{p.nama_penjamin}</span></div><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500">NIK</span><span className="col-span-2 font-mono text-slate-700">{p.nik_penjamin || '-'}</span></div></div><div className="space-y-3"><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500">Kontak</span><span className="col-span-2 font-bold text-green-700">{p.nomor_telepon || '-'}</span></div><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500">Alamat</span><span className="col-span-2 text-slate-700 text-xs leading-relaxed">{p.alamat}</span></div></div></div></div>))) : (<div className="p-4 bg-slate-100 rounded-lg text-center text-slate-500 text-sm italic">Belum ada data penjamin.</div>)}</section>
                <section><h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4"/> Riwayat Permintaan Litmas</h3>{detailData.litmas && detailData.litmas.length > 0 ? (<div className="space-y-4">{detailData.litmas.map((l: any, lIdx: number) => (<div key={lIdx} className="bg-white rounded-xl border shadow-sm overflow-hidden"><div className="bg-slate-50 p-3 px-4 border-b flex justify-between items-center"><div className="flex items-center gap-2"><Badge className="bg-blue-600">{l.jenis_litmas}</Badge><span className="text-xs font-mono text-slate-500 bg-white border px-1.5 py-0.5 rounded">{l.nomor_surat_permintaan}</span></div><div className="text-xs text-slate-500">PK: <span className="font-bold text-blue-700">{l.petugas_pk?.nama || 'Belum Ada'}</span></div></div><div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs border-b"><div><span className="block text-slate-400 font-semibold mb-1">Asal UPT</span><span className="font-medium text-slate-700">{l.upt?.nama_upt || '-'}</span></div><div><span className="block text-slate-400 font-semibold mb-1">Tgl Surat</span><span className="font-medium text-slate-700">{l.tanggal_surat_permintaan}</span></div></div>{l.perkara && l.perkara.length > 0 && (<div className="p-4 bg-slate-50/50"><p className="text-xs font-bold text-slate-400 uppercase mb-2">Data Perkara</p><div className="space-y-2">{l.perkara.map((p: any, pIdx: number) => (<div key={pIdx} className="bg-white border rounded-lg p-3 text-xs grid grid-cols-1 md:grid-cols-4 gap-3 relative overflow-hidden"><div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div><div><span className="block text-slate-400">Pasal</span><span className="font-bold text-slate-800">{p.pasal}</span></div><div><span className="block text-slate-400">Vonis</span><span className="block font-medium text-slate-800">{p.vonis_pidana}</span></div></div>))}</div></div>)}</div>))}</div>) : (<div className="p-8 border-2 border-dashed rounded-xl text-center"><ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2"/><p className="text-slate-500 text-sm">Belum ada riwayat.</p></div>)}</section>
              </div>
            ) : (<div className="flex flex-col items-center justify-center h-64 text-slate-400"><Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" /><p>Memuat data...</p></div>)}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </TestPageLayout>
  );
}