import { TestPageLayout } from '@/components/TestPageLayout';
import { TrendingUp } from 'lucide-react';

export default function TPPTest() {
  return (
    <TestPageLayout
      title="TPP"
      description="Pengelolaan Tunjangan Perbaikan Penghasilan"
      permissionCode="access_tpp"
      icon={<TrendingUp className="w-8 h-8 text-primary" />}
    />
  );
}
