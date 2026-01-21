
-- Insert new roles
INSERT INTO public.roles (code, name, description) VALUES
  ('kabapas', 'Kepala Bapas', 'Viewer - dapat melihat semua data'),
  ('kasubsie_register_dewasa', 'Kasubsie Registrasi Dewasa', 'Approval litmas untuk klien dewasa'),
  ('kasubsie_register_anak', 'Kasubsie Registrasi Anak', 'Approval litmas untuk klien anak'),
  ('op_reg_dewasa', 'Operator Registrasi Dewasa', 'Data entry registrasi klien dewasa'),
  ('op_reg_anak', 'Operator Registrasi Anak', 'Data entry registrasi klien anak'),
  ('anev', 'Anev', 'Analisis dan Evaluasi'),
  ('pk', 'Pembimbing Kemasyarakatan', 'Pembimbingan klien'),
  ('persuratan', 'Persuratan', 'Data entry surat masuk dan keluar'),
  ('op_bimker_dewasa', 'Operator Bimker Dewasa', 'Create jadwal kegiatan bimker dewasa'),
  ('op_bimker_anak', 'Operator Bimker Anak', 'Create jadwal kegiatan bimker anak'),
  ('op_bimkemas_dewasa', 'Operator Bimkemas Dewasa', 'Create jadwal kegiatan bimkemas dewasa'),
  ('op_bimkemas_anak', 'Operator Bimkemas Anak', 'Create jadwal kegiatan bimkemas anak'),
  ('tpp', 'Pengelola TPP', 'Generate dan modify data sidang TPP'),
  ('laporan', 'Pengelola Laporan', 'Pengelola laporan harian dan bulanan')
ON CONFLICT (code) DO NOTHING;

-- Assign permissions to new roles
-- Kabapas (Viewer - can access dashboard and view data)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'kabapas' AND p.code IN ('access_dashboard', 'access_kabapas')
ON CONFLICT DO NOTHING;

-- Kasubsie Register Dewasa
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'kasubsie_register_dewasa' AND p.code IN ('access_dashboard', 'access_kasubsie')
ON CONFLICT DO NOTHING;

-- Kasubsie Register Anak
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'kasubsie_register_anak' AND p.code IN ('access_dashboard', 'access_kasubsie')
ON CONFLICT DO NOTHING;

-- Operator Registrasi Dewasa
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'op_reg_dewasa' AND p.code IN ('access_dashboard', 'access_operator_registrasi')
ON CONFLICT DO NOTHING;

-- Operator Registrasi Anak
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'op_reg_anak' AND p.code IN ('access_dashboard', 'access_operator_registrasi')
ON CONFLICT DO NOTHING;

-- Anev
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'anev' AND p.code IN ('access_dashboard', 'access_anev')
ON CONFLICT DO NOTHING;

-- Pembimbing Kemasyarakatan (PK)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'pk' AND p.code IN ('access_dashboard', 'access_pk')
ON CONFLICT DO NOTHING;

-- Persuratan
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'persuratan' AND p.code IN ('access_dashboard', 'access_persuratan')
ON CONFLICT DO NOTHING;

-- Operator Bimker Dewasa
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'op_bimker_dewasa' AND p.code IN ('access_dashboard', 'access_bimker')
ON CONFLICT DO NOTHING;

-- Operator Bimker Anak
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'op_bimker_anak' AND p.code IN ('access_dashboard', 'access_bimker')
ON CONFLICT DO NOTHING;

-- Operator Bimkemas Dewasa
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'op_bimkemas_dewasa' AND p.code IN ('access_dashboard', 'access_bimkemas')
ON CONFLICT DO NOTHING;

-- Operator Bimkemas Anak
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'op_bimkemas_anak' AND p.code IN ('access_dashboard', 'access_bimkemas')
ON CONFLICT DO NOTHING;

-- Pengelola TPP
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'tpp' AND p.code IN ('access_dashboard', 'access_tpp')
ON CONFLICT DO NOTHING;

-- Pengelola Laporan
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.code = 'laporan' AND p.code IN ('access_dashboard', 'access_laporan')
ON CONFLICT DO NOTHING;
