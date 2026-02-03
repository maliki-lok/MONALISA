import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
// Label import dihapus karena tidak lagi digunakan secara visual di sini
// import { Label } from '@/components/ui/label'; 

interface DurationInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

export const DurationInput = ({ label, value, onChange }: DurationInputProps) => {
  const parseDuration = (str: string) => {
      const yMatch = str.match(/(\d+)\s*Tahun/);
      const mMatch = str.match(/(\d+)\s*Bulan/);
      return { y: yMatch ? parseInt(yMatch[1]) : 0, m: mMatch ? parseInt(mMatch[1]) : 0 };
  };

  const [duration, setDuration] = useState(parseDuration(value));
  useEffect(() => { setDuration(parseDuration(value)); }, [value]);

  const handleChange = (type: 'y' | 'm', val: string) => {
      const num = parseInt(val) || 0;
      const newDuration = { ...duration, [type]: num };
      setDuration(newDuration);
      
      let result = "";
      if (newDuration.y > 0) result += `${newDuration.y} Tahun `;
      if (newDuration.m > 0) result += `${newDuration.m} Bulan`;
      onChange(result.trim());
  };

  return (
      <div className="grid gap-2">
          {/* Label visual dihapus agar tidak muncul tulisan "Durasi Vonis/Subsider" ganda */}
          <div className="flex items-center gap-2">
              <div className="relative flex-1">
                  <Input type="number" min="0" placeholder="0" value={duration.y || ''} onChange={(e) => handleChange('y', e.target.value)} className="pr-12" />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">Tahun</span>
              </div>
              <div className="relative flex-1">
                  <Input type="number" min="0" max="11" placeholder="0" value={duration.m || ''} onChange={(e) => handleChange('m', e.target.value)} className="pr-12" />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">Bulan</span>
              </div>
          </div>
          {/* Prop 'label' tetap digunakan di sini untuk menentukan logic name input hidden */}
          <input type="hidden" name={label.toLowerCase().includes('vonis') ? 'vonis_pidana' : 'subsider_pidana'} value={value} />
      </div>
  );
};