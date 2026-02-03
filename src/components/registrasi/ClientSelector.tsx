import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientSelectorProps {
  listKlien: any[];
  selectedClientId: number | null;
  setSelectedClientId: (id: number) => void;
  editingKlien: any;
  handleCancelButton: () => void;
  loading: boolean;
  userRoleCategory: string;
}

export const ClientSelector = ({ 
  listKlien, selectedClientId, setSelectedClientId, editingKlien, handleCancelButton, loading, userRoleCategory 
}: ClientSelectorProps) => {
  const [openClientCombo, setOpenClientCombo] = useState(false);
  
  return (
    <div className="flex flex-col space-y-2 mb-6">
      <Label className="text-base font-semibold text-slate-700">Pilih Klien ({userRoleCategory}) <span className="text-red-500">*</span></Label>
      <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={openClientCombo} className="w-full justify-between bg-white border-slate-300 hover:bg-slate-50 h-14 shadow-sm" disabled={loading}>
            {selectedClientId ? (
              <div className="flex flex-col items-start text-left w-full overflow-hidden">
                 <span className="font-bold text-slate-900 truncate w-full text-base">{listKlien.find((k:any) => k.id_klien === selectedClientId)?.nama_klien}</span>
                 <span className="text-xs text-slate-500 truncate w-full font-mono bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5 border">Reg: {listKlien.find((k:any) => k.id_klien === selectedClientId)?.nomor_register_lapas || '-'}</span>
              </div>
            ) : (
              <span className="text-slate-500 flex items-center gap-2"><Search className="w-4 h-4" /> Cari nama atau nomor register...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Ketik nama atau no. register..." />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>Klien tidak ditemukan.</CommandEmpty>
              <CommandGroup heading={`Daftar Klien ${userRoleCategory}`}>
                {listKlien.map((klien:any) => (
                  <CommandItem key={klien.id_klien} value={`${klien.nama_klien} ${klien.nomor_register_lapas}`}
                    onSelect={() => {
                      setSelectedClientId(klien.id_klien);
                      setOpenClientCombo(false);
                      if(editingKlien && editingKlien.id_klien !== klien.id_klien) handleCancelButton();
                    }}
                    className="cursor-pointer aria-selected:bg-blue-50">
                    <Check className={cn("mr-2 h-4 w-4 text-blue-600", selectedClientId === klien.id_klien ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col w-full">
                      <span className="font-medium text-sm text-slate-800">{klien.nama_klien}</span>
                      <span className="text-xs text-muted-foreground font-mono">{klien.nomor_register_lapas}</span>
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