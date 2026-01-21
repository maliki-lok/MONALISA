import { TestPageLayout } from '@/components/TestPageLayout';
import { Mail } from 'lucide-react';

export default function PersuratanTest() {
  return (
    <TestPageLayout
      title="Persuratan"
      description="Manajemen surat masuk dan surat keluar"
      permissionCode="access_persuratan"
      icon={<Mail className="w-8 h-8 text-primary" />}
    />
  );
}
