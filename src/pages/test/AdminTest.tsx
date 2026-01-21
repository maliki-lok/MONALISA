import { TestPageLayout } from '@/components/TestPageLayout';
import { Settings } from 'lucide-react';

export default function AdminTest() {
  return (
    <TestPageLayout
      title="Admin Panel"
      description="Halaman administrasi sistem untuk mengelola pengguna, role, dan permission"
      permissionCode="access_admin"
      icon={<Settings className="w-8 h-8 text-primary" />}
    />
  );
}
