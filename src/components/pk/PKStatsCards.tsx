import { Card, CardContent } from '@/components/ui/card';
import { FileText, FileClock, Clock, CheckCircle } from 'lucide-react';

interface PKStatsCardsProps {
  stats: {
    new: number;
    process: number;
    review: number;
    done: number;
  };
}

export function PKStatsCards({ stats }: PKStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-white border-l-4 border-l-slate-500 shadow-sm">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Tugas Baru</p>
            <h3 className="text-2xl font-bold text-slate-700">{stats.new}</h3>
          </div>
          <div className="bg-slate-100 p-2 rounded-full"><FileText className="w-5 h-5 text-slate-500"/></div>
        </CardContent>
      </Card>
      
      <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Sedang Proses</p>
            <h3 className="text-2xl font-bold text-blue-700">{stats.process}</h3>
          </div>
          <div className="bg-blue-50 p-2 rounded-full"><FileClock className="w-5 h-5 text-blue-600"/></div>
        </CardContent>
      </Card>

      <Card className="bg-white border-l-4 border-l-yellow-500 shadow-sm">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Menunggu Review</p>
            <h3 className="text-2xl font-bold text-yellow-700">{stats.review}</h3>
          </div>
          <div className="bg-yellow-50 p-2 rounded-full"><Clock className="w-5 h-5 text-yellow-600"/></div>
        </CardContent>
      </Card>

      <Card className="bg-white border-l-4 border-l-green-500 shadow-sm">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Selesai / TPP</p>
            <h3 className="text-2xl font-bold text-green-700">{stats.done}</h3>
          </div>
          <div className="bg-green-50 p-2 rounded-full"><CheckCircle className="w-5 h-5 text-green-600"/></div>
        </CardContent>
      </Card>
    </div>
  );
}