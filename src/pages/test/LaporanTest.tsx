import { TestPageLayout } from '@/components/TestPageLayout';
import { FileText } from 'lucide-react';

export default function LaporanTest() {
  return (
    <TestPageLayout
      title="Laporan"
      description="Pembuatan dan pengelolaan laporan berkala"
      permissionCode="access_laporan"
      icon={<FileText className="w-8 h-8 text-primary" />}
    />
  );
}
