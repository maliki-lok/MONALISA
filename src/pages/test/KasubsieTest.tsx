import { TestPageLayout } from '@/components/TestPageLayout';
import { Users } from 'lucide-react';

export default function KasubsieTest() {
  return (
    <TestPageLayout
      title="Kepala Sub Seksi"
      description="Dashboard dan fitur khusus untuk Kepala Sub Seksi"
      permissionCode="access_kasubsie"
      icon={<Users className="w-8 h-8 text-primary" />}
    />
  );
}
