import { TestPageLayout } from '@/components/TestPageLayout';
import { Briefcase } from 'lucide-react';

export default function BimkerTest() {
  return (
    <TestPageLayout
      title="Bimbingan Kerja"
      description="Pengelolaan program bimbingan kerja dan pelatihan keterampilan"
      permissionCode="access_bimker"
      icon={<Briefcase className="w-8 h-8 text-primary" />}
    />
  );
}
