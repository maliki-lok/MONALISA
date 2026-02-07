import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface PKRegisterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  schedules: any[];
  selectedScheduleId: string;
  onSelectSchedule: (id: string) => void;
  onConfirm: () => void;
}

export function PKRegisterDialog({ 
  isOpen, onOpenChange, schedules, selectedScheduleId, onSelectSchedule, onConfirm 
}: PKRegisterDialogProps) {

  // Helper format tanggal jadwal
  const formatSidangDate = (isoString: string) => {
    if (!isoString) return { dateStr: '-', timeStr: '-' };
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = "09.00"; 
    return { dateStr, timeStr };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Pilih Jadwal Sidang</DialogTitle>
                <DialogDescription>Pilih salah satu slot sidang yang tersedia.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Select value={selectedScheduleId} onValueChange={onSelectSchedule}>
                    <SelectTrigger className="bg-slate-50 h-auto py-3">
                        <SelectValue placeholder="-- Pilih Tanggal --" />
                    </SelectTrigger>
                    <SelectContent>
                        {schedules.map(s => {
                            const { dateStr, timeStr } = formatSidangDate(s.tanggal_sidang);
                            return (
                            <SelectItem key={s.id} value={s.id} className="py-3 border-b last:border-0">
                                <div className="flex flex-col gap-1 text-left">
                                    <span className="font-semibold text-slate-800">{dateStr}</span>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">Pukul {timeStr} WIB</span>
                                        <span className="text-slate-400">|</span>
                                        <span className="text-slate-500 italic">{s.jenis_sidang}</span>
                                    </div>
                                </div>
                            </SelectItem>
                        )})}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button onClick={onConfirm} className="bg-purple-600 hover:bg-purple-700 w-full">Daftar Sekarang</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}