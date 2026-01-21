import { TestPageLayout } from '@/components/TestPageLayout';
import { Building2 } from 'lucide-react';

export default function KabapasTest() {
  return (
    <TestPageLayout
      title="Kepala Balai Pemasyarakatan"
      description="Dashboard dan fitur khusus untuk Kepala Lembaga Pemasyarakatan"
      permissionCode="access_kabapas"
      icon={<Building2 className="w-8 h-8 text-primary" />}
    />
  );
}
