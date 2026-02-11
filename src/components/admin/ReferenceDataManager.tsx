import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Pencil, Database, Loader2, Search } from "lucide-react";
import { Label } from "@/components/ui/label";

// --- 1. DEFINISI TIPE DATA (INTERFACE) ---
// Ini penting agar TypeScript tidak error saat membaca properti tambahan
interface ColumnConfig {
  key: string;
  label: string;
  type: "text" | "number" | "relation"; // Tambahkan tipe 'relation'
  relationTable?: string; // Optional (?)
  relationKey?: string;   // Optional (?)
  relationLabel?: string; // Optional (?)
}

interface TableConfig {
  label: string;
  primaryKey: string;
  columns: ColumnConfig[];
}

// --- 2. KONFIGURASI TABEL (Updated with Types) ---
const TABLE_CONFIGS: Record<string, TableConfig> = {
  ref_bapas: {
    label: "Referensi Bapas",
    primaryKey: "id_bapas",
    columns: [
      { key: "nama_bapas", label: "Nama Bapas", type: "text" },
      { key: "wilayah_kerja", label: "Wilayah Kerja", type: "text" }
    ]
  },
  ref_golongan: {
    label: "Referensi Golongan",
    primaryKey: "id_golongan",
    columns: [
      { key: "kode", label: "Kode Golongan", type: "text" },
      { key: "pangkat", label: "Nama Pangkat", type: "text" }
    ]
  },
  ref_hubungan: {
    label: "Ref. Hubungan Keluarga",
    primaryKey: "id_hubungan",
    columns: [
      { key: "nama_hubungan", label: "Sebutan Hubungan", type: "text" }
    ]
  },
  ref_kategori_surat: {
    label: "Ref. Kategori Surat",
    primaryKey: "id_kategori_surat",
    columns: [
      { key: "nama_kategori", label: "Nama Kategori", type: "text" }
    ]
  },
  ref_kecamatan: {
    label: "Ref. Kecamatan",
    primaryKey: "id_kecamatan",
    columns: [
      { key: "nama_kecamatan", label: "Nama Kecamatan", type: "text" },
      { key: "kota_administrasi", label: "Kota Administrasi", type: "text" }
    ]
  },
  ref_kelurahan: {
    label: "Ref. Kelurahan",
    primaryKey: "id_kelurahan",
    columns: [
      { key: "nama_kelurahan", label: "Nama Kelurahan", type: "text" },
      // KONFIGURASI RELASI (Sekarang Valid karena Interface diatas)
      { 
        key: "kecamatan_id", 
        label: "Kecamatan", 
        type: "relation", 
        relationTable: "ref_kecamatan", 
        relationKey: "id_kecamatan", 
        relationLabel: "nama_kecamatan" 
      } 
    ]
  },
  ref_pekerjaan: {
    label: "Ref. Pekerjaan",
    primaryKey: "id_pekerjaan",
    columns: [
      { key: "nama_pekerjaan", label: "Nama Pekerjaan", type: "text" }
    ]
  },
  ref_pendidikan: {
    label: "Ref. Pendidikan",
    primaryKey: "id_pendidikan",
    columns: [
      { key: "tingkat", label: "Tingkat Pendidikan", type: "text" }
    ]
  },
  ref_upt: {
    label: "Ref. UPT (Lapas/Rutan)",
    primaryKey: "id_upt",
    columns: [
      { key: "nama_upt", label: "Nama UPT", type: "text" },
      { key: "jenis_instansi", label: "Jenis Instansi", type: "text" }
    ]
  }
};

type TableKey = keyof typeof TABLE_CONFIGS;

export function ReferenceDataManager() {
  const { toast } = useToast();
  
  // State Selection
  const [selectedTable, setSelectedTable] = useState<TableKey>("ref_kelurahan");
  const config = TABLE_CONFIGS[selectedTable];

  // State Data
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // State Relations (Untuk Dropdown)
  const [relationsData, setRelationsData] = useState<Record<string, any[]>>({});

  // State Dialog (Create/Edit)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<any>({});

  // 1. Fetch Data Utama & Relasi
  const fetchData = async () => {
    setLoading(true);
    try {
      // A. Build Query with Relations
      const query = (supabase as any).from(selectedTable).select('*');
      
      const { data: result, error } = await query.order(config.primaryKey, { ascending: true });
      if (error) throw error;

      // B. Fetch Relation Data (Untuk Dropdown & Mapping Label)
      const newRelations: Record<string, any[]> = {};
      
      for (const col of config.columns) {
        // TypeScript sekarang mengenali properti relationTable karena interface ColumnConfig
        if (col.type === 'relation' && col.relationTable) {
            const { data: relData } = await (supabase as any)
                .from(col.relationTable)
                .select('*');
            newRelations[col.key] = relData || [];
        }
      }
      
      setRelationsData(newRelations);
      setData(result || []);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal memuat data", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSearchTerm("");
  }, [selectedTable]);

  // 2. Handle CRUD
  const handleOpenDialog = (item?: any) => {
    if (item) {
        setEditingId(item[config.primaryKey]);
        setFormData({ ...item });
    } else {
        setEditingId(null);
        setFormData({});
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
        let error;
        if (editingId) {
            // UPDATE
            const { error: err } = await (supabase as any)
                .from(selectedTable)
                .update(formData)
                .eq(config.primaryKey, editingId);
            error = err;
        } else {
            // INSERT
            const { error: err } = await (supabase as any)
                .from(selectedTable)
                .insert([formData]);
            error = err;
        }

        if (error) throw error;

        toast({ title: "Sukses", description: "Data berhasil disimpan." });
        setIsDialogOpen(false);
        fetchData();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
        const { error } = await (supabase as any)
            .from(selectedTable)
            .delete()
            .eq(config.primaryKey, id);
        
        if (error) throw error;
        toast({ title: "Terhapus", description: "Data berhasil dihapus." });
        fetchData();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Gagal Hapus", description: "Mungkin data ini sedang digunakan di tabel lain." });
    }
  };

  // Helper untuk mendapatkan Label Relasi (Misal ID 1 -> "Cilandak")
  const getRelationLabel = (colKey: string, value: any) => {
    const colConfig = config.columns.find(c => c.key === colKey);
    // TypeScript check: pastikan properties ada sebelum akses
    if (colConfig?.type === 'relation' && colConfig.relationKey && colConfig.relationLabel && relationsData[colKey]) {
        const found = relationsData[colKey].find(r => r[colConfig.relationKey!] == value);
        return found ? found[colConfig.relationLabel!] : value; 
    }
    return value;
  };

  // Filter Data
  const filteredData = data.filter(item => 
    config.columns.some(col => {
      const val = col.type === 'relation' ? getRelationLabel(col.key, item[col.key]) : item[col.key];
      return String(val || "").toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  return (
    <div className="space-y-6">
      
      {/* HEADER & SELECTOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Database className="w-5 h-5 text-blue-600"/> Manajemen Data Referensi
            </h2>
            <p className="text-sm text-slate-500">Kelola master data sistem dropdown.</p>
        </div>
        <div className="w-full md:w-64">
            <Select value={selectedTable} onValueChange={(val) => setSelectedTable(val as TableKey)}>
                <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="Pilih Tabel" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(TABLE_CONFIGS).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* CONTENT CARD */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
            <div className="flex justify-between items-center">
                <CardTitle className="text-base font-semibold">{config.label}</CardTitle>
                <Button size="sm" onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                    <Plus className="w-4 h-4 mr-2"/> Tambah Data
                </Button>
            </div>
            <div className="relative mt-3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder={`Cari di ${config.label}...`}
                    className="pl-9 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="border-0">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[60px] text-xs font-bold uppercase tracking-wider">ID</TableHead>
                            {config.columns.map(col => (
                                <TableHead key={col.key} className="text-xs font-bold uppercase tracking-wider">{col.label}</TableHead>
                            ))}
                            <TableHead className="text-right w-[100px] text-xs font-bold uppercase tracking-wider">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={config.columns.length + 2} className="text-center py-12 text-slate-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600"/> 
                                        <span>Memuat data...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={config.columns.length + 2} className="text-center py-12 text-slate-500 italic bg-slate-50/30">
                                    Belum ada data untuk tabel ini.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item, idx) => (
                                <TableRow key={idx} className="hover:bg-blue-50/50 transition-colors">
                                    <TableCell className="font-mono text-xs text-slate-500">{item[config.primaryKey]}</TableCell>
                                    
                                    {config.columns.map(col => (
                                        <TableCell key={col.key} className="font-medium text-slate-700">
                                            {/* RENDER LOGIC: TAMPILKAN LABEL JIKA RELASI */}
                                            {col.type === 'relation' ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                                    {getRelationLabel(col.key, item[col.key])}
                                                </span>
                                            ) : (
                                                item[col.key]
                                            )}
                                        </TableCell>
                                    ))}

                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600 hover:bg-blue-100" onClick={() => handleOpenDialog(item)}>
                                            <Pencil className="w-3.5 h-3.5"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600 hover:bg-red-100" onClick={() => handleDelete(item[config.primaryKey])}>
                                            <Trash2 className="w-3.5 h-3.5"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      {/* DYNAMIC DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{editingId ? `Edit Data` : `Tambah Data Baru`}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                {config.columns.map((col) => (
                    <div key={col.key} className="space-y-2">
                        <Label>{col.label}</Label>
                        
                        {/* FORM LOGIC: SELECT UNTUK RELASI, INPUT UNTUK TEXT/NUMBER */}
                        {col.type === 'relation' && col.relationTable && col.relationKey && col.relationLabel ? (
                            <Select 
                                value={String(formData[col.key] || "")} 
                                onValueChange={(val) => setFormData({...formData, [col.key]: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={`Pilih ${col.label}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(relationsData[col.key] || []).map((relItem: any) => (
                                        <SelectItem key={relItem[col.relationKey!]} value={String(relItem[col.relationKey!])}>
                                            {relItem[col.relationLabel!]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input 
                                type={col.type === 'number' ? 'number' : 'text'}
                                value={formData[col.key] || ""}
                                onChange={(e) => setFormData({...formData, [col.key]: e.target.value})}
                                placeholder={`Masukkan ${col.label}`}
                            />
                        )}
                    </div>
                ))}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button onClick={handleSave} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Simpan
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}