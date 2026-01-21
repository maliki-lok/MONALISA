-- Expand employees table with all columns from Excel
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS nama_gelar text,
ADD COLUMN IF NOT EXISTS nik text,
ADD COLUMN IF NOT EXISTS jenis_kelamin text,
ADD COLUMN IF NOT EXISTS tempat_lahir text,
ADD COLUMN IF NOT EXISTS tanggal_lahir date,
ADD COLUMN IF NOT EXISTS agama text,
ADD COLUMN IF NOT EXISTS pangkat_golongan text,
ADD COLUMN IF NOT EXISTS tmt_pangkat date,
ADD COLUMN IF NOT EXISTS jenis_jabatan text,
ADD COLUMN IF NOT EXISTS tmt_jabatan text,
ADD COLUMN IF NOT EXISTS pendidikan text,
ADD COLUMN IF NOT EXISTS jurusan_pendidikan text,
ADD COLUMN IF NOT EXISTS alamat text,
ADD COLUMN IF NOT EXISTS telepon text,
ADD COLUMN IF NOT EXISTS telepon_khusus text,
ADD COLUMN IF NOT EXISTS foto_url text,
ADD COLUMN IF NOT EXISTS foto_thumbnail text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Aktif';

-- Add index for better performance on commonly searched fields
CREATE INDEX IF NOT EXISTS idx_employees_nik ON public.employees(nik);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_unit_kerja ON public.employees(unit_kerja);