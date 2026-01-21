// RBAC Types for the application

export interface Employee {
  id: string;
  nip: string;
  nama: string;
  nama_gelar: string | null;
  nik: string | null;
  jenis_kelamin: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  agama: string | null;
  pangkat_golongan: string | null;
  tmt_pangkat: string | null;
  jabatan: string | null;
  jenis_jabatan: string | null;
  tmt_jabatan: string | null;
  pendidikan: string | null;
  jurusan_pendidikan: string | null;
  unit_kerja: string | null;
  alamat: string | null;
  telepon: string | null;
  telepon_khusus: string | null;
  email: string | null;
  foto_url: string | null;
  foto_thumbnail: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  employee_id: string;
  created_at: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  created_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  created_at: string;
}

// Auth context types
export interface AuthUser {
  id: string;
  employee: Employee;
  roles: string[];
  permissions: string[];
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (nip: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

// ==========================================
// OPERATOR REGISTRASI & LITMAS TYPES
// ==========================================

export interface PetugasPK {
  id: string; // UUID
  employee_id?: string | null;
  nip: string;
  nama: string;
  created_at?: string;
}

export interface UPT {
  id_upt: number;
  nama_upt: string;
  jenis_upt: string | null; // 'LAPAS' | 'RUTAN'
  alamat: string | null;
}

export interface Klien {
  id_klien: number;
  nama_klien: string;
  nomor_register_lapas: string;
  jenis_kelamin: string | null; // 'L' | 'P'
  agama: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  usia?: number | null;
  kategori_usia?: string | null;
  pendidikan?: string | null;
  pekerjaan?: string | null;
  minat_bakat?: string | null;
  alamat: string | null;
  kelurahan?: string | null;
  kecamatan?: string | null;
  nomor_telepon?: string | null;
}

export interface Penjamin {
  id_penjamin: number;
  id_klien: number;
  nama_penjamin: string;
  hubungan_klien: string | null;
  agama?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  usia?: number | null;
  pendidikan?: string | null;
  pekerjaan?: string | null;
  alamat?: string | null;
  nomor_telepon?: string | null;
}

export interface Litmas {
  id_litmas: number;
  id_klien: number;
  id_upt: number | null;
  nama_pk: string | null; // UUID references petugas_pk
  nomor_urut?: number | null;
  nomor_surat_masuk?: string | null;
  tanggal_diterima_bapas?: string | null;
  jenis_litmas: string | null;
  tanggal_registrasi?: string | null;
  nomor_register_litmas?: string | null;
  nomor_surat_permintaan: string | null;
  tanggal_surat_permintaan: string | null;
}

export interface Perkara {
  id_perkara: number;
  id_litmas: number;
  pasal: string | null;
  uu_kuhp?: string | null;
  tindak_pidana: string | null;
  vonis_pidana: string | null;
  denda?: number | null;
  subsider_pidana?: string | null;
  uang_pengganti?: number | null;
  tanggal_mulai_ditahan?: string | null;
  tanggal_ekspirasi?: string | null;
  nomor_putusan?: string | null;
  tanggal_putusan?: string | null;
  // Field tanggal perhitungan masa tahanan lainnya
  tanggal_sepertiga_masa?: string | null;
  tanggal_setengah_masa?: string | null;
  tanggal_duapertiga_masa?: string | null;
}