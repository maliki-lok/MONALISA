import { TestPageLayout } from '@/components/TestPageLayout';
import { Users } from 'lucide-react';

export default function BimkemasTest() {
  return (
    <TestPageLayout
      title="Bimbingan Kemasyarakatan"
      description="Pengelolaan program reintegrasi dan pembinaan kemasyarakatan"
      permissionCode="access_bimkemas"
      icon={<Users className="w-8 h-8 text-primary" />}
    />
  );
}
