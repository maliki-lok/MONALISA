import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SuggestionListProps {
  matches: any[];
  onSelect: (item: any) => void;
  labelField: string;
  subLabelField: string;
  isVisible: boolean;
}

export const SuggestionList = ({ matches, onSelect, labelField, subLabelField, isVisible }: SuggestionListProps) => {
  if (!isVisible || matches.length === 0) return null;
  
  return (
      <div className="absolute top-full left-0 z-[100] w-full bg-white border border-slate-200 rounded-md shadow-xl mt-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 bg-slate-50 border-b text-xs font-semibold text-slate-500 sticky top-0 flex justify-between items-center">
              <span>Ditemukan {matches.length} data mirip</span>
              <span className="text-[10px] text-slate-400">(Klik untuk pilih)</span>
          </div>
          {matches.map((item, idx) => (
              <div key={idx} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors flex justify-between items-start group"
                  onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}>
                  <div>
                      <div className="font-medium text-slate-800 text-sm group-hover:text-blue-700">{item[labelField]}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" /> 
                          {subLabelField === 'nik_klien' ? `NIK: ${item[subLabelField] || '-'}` : (item[subLabelField] || 'Info tidak tersedia')}
                      </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white group-hover:border-blue-200">Terdaftar</Badge>
              </div>
          ))}
      </div>
  );
};