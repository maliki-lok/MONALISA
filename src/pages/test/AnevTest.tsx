import { TestPageLayout } from '@/components/TestPageLayout';
import { BarChart3 } from 'lucide-react';

export default function AnevTest() {
  return (
    <TestPageLayout
      title="Analisis & Evaluasi"
      description="Dashboard analisis dan evaluasi kinerja lembaga"
      permissionCode="access_anev"
      icon={<BarChart3 className="w-8 h-8 text-primary" />}
    />
  );
}
