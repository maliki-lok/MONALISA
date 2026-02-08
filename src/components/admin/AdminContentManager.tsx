import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Trash2, Plus, Calendar as CalendarIcon, Megaphone, MapPin, Loader2, 
  Clock, Pencil, MoreHorizontal, Copy, ArrowRight, CalendarDays, CheckCircle2 
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Announcement, OrgEvent } from "@/types/content";

// --- IMPORTS UNTUK DATE PICKER ---
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function AdminContentManager() {
  const [news, setNews] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // --- STATE UNTUK DIALOG & FORM ---
  // News
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<Announcement | null>(null);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [isSubmittingNews, setIsSubmittingNews] = useState(false);

  // Events (Single)
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OrgEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Events: Split Date & Time State for better UI
  const [datePart, setDatePart] = useState<Date | undefined>(undefined);
  const [timePart, setTimePart] = useState("09:00");

  // Events (Bulk Copy Day)
  const [sourceDate, setSourceDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isCopyingDay, setIsCopyingDay] = useState(false);

  // 1. Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: newsData } = await (supabase as any)
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
        
      const { data: eventData } = await (supabase as any)
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      
      if (newsData) setNews(newsData);
      if (eventData) setEvents(eventData);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- HELPER: GROUP EVENTS BY DATE ---
  const groupEventsByDate = (list: OrgEvent[]) => {
    const groups: Record<string, OrgEvent[]> = {};
    list.forEach(event => {
        const dateKey = new Date(event.event_date).toLocaleDateString('id-ID', {
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric'
        });
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(event);
    });
    return groups;
  };

  // --- LOGIC: BERITA & PENGUMUMAN ---

  const openNewsDialog = (item?: Announcement) => {
    if (item) {
        setEditingNews(item);
        setNewsTitle(item.title);
        setNewsContent(item.content);
    } else {
        setEditingNews(null);
        setNewsTitle("");
        setNewsContent("");
    }
    setIsNewsDialogOpen(true);
  };

  const handleSaveNews = async () => {
    if (!newsTitle || !newsContent) {
        toast({ variant: "destructive", title: "Gagal", description: "Judul dan isi berita wajib diisi." });
        return;
    }
    setIsSubmittingNews(true);

    let error;
    if (editingNews) {
        const { error: err } = await (supabase as any)
            .from('announcements')
            .update({ title: newsTitle, content: newsContent })
            .eq('id', editingNews.id);
        error = err;
    } else {
        const { error: err } = await (supabase as any)
            .from('announcements')
            .insert([{ title: newsTitle, content: newsContent }]);
        error = err;
    }

    setIsSubmittingNews(false);

    if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
        toast({ title: "Sukses", description: editingNews ? "Pengumuman diperbarui." : "Pengumuman diterbitkan." });
        setIsNewsDialogOpen(false);
        fetchData();
    }
  };

  // --- LOGIC: KEGIATAN (Single Event) ---

  const openEventDialog = (item?: OrgEvent, isDuplicate: boolean = false) => {
    if (item) {
        setEditingEvent(isDuplicate ? null : item);
        setEventTitle(item.title);
        setEventLocation(item.location || "");

        const dateObj = new Date(item.event_date);
        if (isDuplicate) {
            dateObj.setDate(dateObj.getDate() + 1); // Default H+1 for duplicate
        }
        
        // Split ISO to Date & Time parts
        setDatePart(dateObj);
        // Format time to HH:mm
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const minutes = dateObj.getMinutes().toString().padStart(2, '0');
        setTimePart(`${hours}:${minutes}`);

    } else {
        setEditingEvent(null);
        setEventTitle("");
        setEventLocation("");
        setDatePart(new Date()); // Default hari ini
        setTimePart("08:00"); // Default jam 8 pagi
    }
    setIsEventDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventTitle || !datePart || !timePart) {
        toast({ variant: "destructive", title: "Gagal", description: "Nama kegiatan, tanggal, dan jam wajib diisi." });
        return;
    }
    setIsSubmittingEvent(true);

    // Combine Date + Time
    const [hours, minutes] = timePart.split(':').map(Number);
    const combinedDate = new Date(datePart);
    combinedDate.setHours(hours, minutes, 0, 0);

    const payload = { 
        title: eventTitle, 
        event_date: combinedDate.toISOString(),
        location: eventLocation 
    };

    let error;
    if (editingEvent) {
        const { error: err } = await (supabase as any)
            .from('events')
            .update(payload)
            .eq('id', editingEvent.id);
        error = err;
    } else {
        const { error: err } = await (supabase as any)
            .from('events')
            .insert([payload]);
        error = err;
    }

    setIsSubmittingEvent(false);

    if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
        toast({ title: "Sukses", description: editingEvent ? "Jadwal diperbarui." : "Kegiatan dijadwalkan." });
        setIsEventDialogOpen(false);
        fetchData();
    }
  };

  // --- LOGIC: BULK COPY DAY ---

  const handleCopyDay = async () => {
    if (!sourceDate || !targetDate) {
        toast({ variant: "destructive", title: "Error", description: "Pilih tanggal asal dan tanggal tujuan." });
        return;
    }

    if (sourceDate === targetDate) {
        toast({ variant: "destructive", title: "Error", description: "Tanggal asal dan tujuan tidak boleh sama." });
        return;
    }

    setIsCopyingDay(true);

    try {
        const startSource = new Date(sourceDate); startSource.setHours(0,0,0,0);
        const endSource = new Date(sourceDate); endSource.setHours(23,59,59,999);

        const { data: sourceEvents, error: fetchError } = await (supabase as any)
            .from('events')
            .select('*')
            .gte('event_date', startSource.toISOString())
            .lte('event_date', endSource.toISOString());

        if (fetchError) throw fetchError;

        if (!sourceEvents || sourceEvents.length === 0) {
            toast({ title: "Info", description: "Tidak ada kegiatan pada tanggal asal untuk disalin." });
            setIsCopyingDay(false);
            return;
        }

        const newEvents = sourceEvents.map((ev: OrgEvent) => {
            const oldDate = new Date(ev.event_date);
            const newDate = new Date(targetDate);
            newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds());

            return {
                title: ev.title,
                location: ev.location,
                event_date: newDate.toISOString(),
                description: ev.description || ""
            };
        });

        const { error: insertError } = await (supabase as any)
            .from('events')
            .insert(newEvents);

        if (insertError) throw insertError;

        toast({ 
            title: "Berhasil Menyalin!", 
            description: `${newEvents.length} kegiatan berhasil disalin ke tanggal baru.` 
        });
        
        setSourceDate("");
        setTargetDate("");
        fetchData();

    } catch (error: any) {
        console.error(error);
        toast({ variant: "destructive", title: "Gagal Menyalin", description: error.message });
    } finally {
        setIsCopyingDay(false);
    }
  };

  const handleDelete = async (table: 'announcements' | 'events', id: string) => {
    if(!confirm("Hapus item ini?")) return;
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    if (!error) {
        toast({ title: "Terhapus", description: "Data berhasil dihapus." });
        fetchData();
    }
  };

  const isPastEvent = (dateString: string) => new Date(dateString) < new Date();

  // Pre-calculate grouped events
  const groupedEvents = groupEventsByDate(events);

  return (
    <div className="grid lg:grid-cols-2 gap-8 h-full">
      
      {/* KIRI: PENGUMUMAN */}
      <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
            <div>
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                    <Megaphone className="w-5 h-5 text-blue-600"/> Pengumuman
                </h3>
                <p className="text-xs text-slate-500">Berita dashboard.</p>
            </div>
            <Button onClick={() => openNewsDialog()} size="sm" className="bg-blue-600 hover:bg-blue-700 h-9">
                <Plus className="w-4 h-4 mr-2"/> Baru
            </Button>
        </div>

        <Card className="flex-1 border shadow-sm bg-slate-50/50">
            <CardContent className="p-0 h-[500px] overflow-y-auto custom-scrollbar">
                {news.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 italic p-8 text-center">
                        <Megaphone className="w-12 h-12 mb-2 opacity-20"/>
                        Belum ada pengumuman.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {news.map(item => (
                            <div key={item.id} className="p-4 hover:bg-white transition-colors group relative">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-sm text-slate-900 line-clamp-1 pr-8">{item.title}</h4>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600">
                                                <MoreHorizontal className="w-4 h-4"/>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openNewsDialog(item)}><Pencil className="w-3.5 h-3.5 mr-2"/> Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete('announcements', item.id)} className="text-red-600"><Trash2 className="w-3.5 h-3.5 mr-2"/> Hapus</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-2 mb-2">{item.content}</p>
                                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                    {new Date(item.created_at).toLocaleDateString('id-ID')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

      {/* KANAN: MANAGEMEN KEGIATAN (TABS) */}
      <div className="flex flex-col h-full">
        <Tabs defaultValue="list" className="flex flex-col h-full space-y-4">
            
            {/* Header dengan Tabs */}
            <div className="bg-white p-2 rounded-lg border shadow-sm flex items-center justify-between">
                <TabsList className="grid grid-cols-2 w-[280px]">
                    <TabsTrigger value="list">Daftar Agenda</TabsTrigger>
                    <TabsTrigger value="copy">Salin Jadwal</TabsTrigger>
                </TabsList>
                <Button onClick={() => openEventDialog()} size="sm" className="bg-orange-600 hover:bg-orange-700 h-9">
                    <Plus className="w-4 h-4 mr-2"/> Baru
                </Button>
            </div>

            {/* TAB 1: DAFTAR KEGIATAN (Grouped List View) */}
            <TabsContent value="list" className="flex-1 mt-0">
                <Card className="h-[500px] border shadow-sm bg-slate-50/50 flex flex-col">
                    <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin"/></div>
                        ) : events.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                                <CalendarIcon className="w-12 h-12 mb-2 opacity-20"/> Belum ada kegiatan.
                            </div>
                        ) : (
                            <div className="space-y-0">
                                {Object.entries(groupedEvents).map(([dateStr, items]) => (
                                    <div key={dateStr} className="bg-white/50">
                                        <div className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm border-y border-slate-200 px-4 py-1.5 flex items-center gap-2">
                                            <CalendarDays className="w-3.5 h-3.5 text-blue-600"/>
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{dateStr}</span>
                                            <span className="text-[10px] text-slate-400 ml-auto bg-white px-2 rounded-full border">{items.length} Kegiatan</span>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {items.map(item => {
                                                const isPast = isPastEvent(item.event_date);
                                                return (
                                                    <div key={item.id} className={`px-4 py-3 transition-colors group relative hover:bg-blue-50/50 ${isPast ? 'opacity-60 grayscale' : ''}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`text-center min-w-[50px] px-2 py-1 rounded border text-xs font-semibold ${isPast ? 'bg-slate-100 text-slate-500' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                                                {new Date(item.event_date).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-center">
                                                                    <h4 className={`text-sm font-medium truncate ${isPast ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{item.title}</h4>
                                                                    
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-4 h-4"/></Button></DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="w-40">
                                                                            <DropdownMenuItem onClick={() => openEventDialog(item)}><Pencil className="w-3.5 h-3.5 mr-2 text-slate-500"/> Edit</DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={() => openEventDialog(item, true)} className="text-blue-600"><Copy className="w-3.5 h-3.5 mr-2"/> Duplikat</DropdownMenuItem>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem onClick={() => handleDelete('events', item.id)} className="text-red-600"><Trash2 className="w-3.5 h-3.5 mr-2"/> Hapus</DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                                
                                                                {item.location && <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500"><MapPin className="w-3 h-3"/> {item.location}</div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* TAB 2: COPY JADWAL HARIAN */}
            <TabsContent value="copy" className="flex-1 mt-0">
                <Card className="h-[500px] border shadow-sm bg-white flex flex-col justify-center">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <Copy className="w-8 h-8 text-blue-600"/>
                        </div>
                        <CardTitle className="text-xl">Salin Jadwal Harian</CardTitle>
                        <CardDescription>
                            Salin semua kegiatan dari satu hari ke hari lain sekaligus.<br/>
                            Cocok untuk membuat jadwal mingguan berulang.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 max-w-md mx-auto w-full pt-4">
                        <div className="grid grid-cols-[1fr,auto,1fr] items-end gap-3">
                            <div className="space-y-2">
                                <Label>Dari Tanggal</Label>
                                <Input type="date" value={sourceDate} onChange={e => setSourceDate(e.target.value)} />
                            </div>
                            <div className="pb-3 text-slate-400">
                                <ArrowRight className="w-5 h-5"/>
                            </div>
                            <div className="space-y-2">
                                <Label>Ke Tanggal</Label>
                                <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-xs text-slate-600">
                            <p className="font-semibold mb-1 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-600"/> Catatan:</p>
                            <ul className="list-disc list-inside space-y-1 pl-1">
                                <li>Semua kegiatan pada tanggal "Dari" akan diduplikasi.</li>
                                <li>Jam kegiatan akan tetap sama.</li>
                                <li>Kegiatan yang sudah ada di tanggal tujuan <b>tidak</b> akan dihapus.</li>
                            </ul>
                        </div>

                        <Button onClick={handleCopyDay} disabled={isCopyingDay} className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base">
                            {isCopyingDay ? <Loader2 className="animate-spin w-5 h-5 mr-2"/> : <Copy className="w-5 h-5 mr-2"/>}
                            {isCopyingDay ? "Sedang Menyalin..." : "Salin Semua Kegiatan"}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>

      {/* DIALOG FORM BERITA */}
      <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{editingNews ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}</DialogTitle>
                <DialogDescription>Informasi dashboard.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label>Judul</Label>
                    <Input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Isi</Label>
                    <Textarea value={newsContent} onChange={e => setNewsContent(e.target.value)} className="min-h-[120px]"/>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewsDialogOpen(false)}>Batal</Button>
                <Button onClick={handleSaveNews} disabled={isSubmittingNews} className="bg-blue-600 hover:bg-blue-700">Simpan</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG FORM EVENT (NEW UI: CALENDAR + TIME) */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{editingEvent ? 'Edit Jadwal' : 'Jadwal Baru'}</DialogTitle>
                <DialogDescription>Detail kegiatan Bapas.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label>Nama Kegiatan</Label>
                    <Input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Contoh: Apel Pagi" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tanggal</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !datePart && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {datePart ? format(datePart, "PPP", { locale: idLocale }) : <span>Pilih Tanggal</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={datePart}
                                    onSelect={setDatePart}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Jam</Label>
                        <div className="relative">
                            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                type="time" 
                                className="pl-9" 
                                value={timePart} 
                                onChange={e => setTimePart(e.target.value)} 
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Lokasi</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            value={eventLocation} 
                            onChange={e => setEventLocation(e.target.value)} 
                            placeholder="Contoh: Aula Bapas" 
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>Batal</Button>
                <Button onClick={handleSaveEvent} disabled={isSubmittingEvent} className="bg-orange-600 hover:bg-orange-700">Simpan</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}