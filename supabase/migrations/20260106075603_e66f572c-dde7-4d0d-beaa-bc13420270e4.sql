-- =============================================
-- RBAC SYSTEM - COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. Create app_role enum for role types
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. EMPLOYEES TABLE (Single source of truth - imported from Excel)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nip TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  jabatan TEXT,
  unit_kerja TEXT,
  email TEXT, -- Optional, used internally for Supabase Auth
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. USERS TABLE (Application access - references employees)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id) -- One employee can only have one user account
);

-- 4. ROLES TABLE
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. PERMISSIONS TABLE
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. USER_ROLES TABLE (Multi-role support)
CREATE TABLE public.user_roles (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- 7. ROLE_PERMISSIONS TABLE
CREATE TABLE public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTIONS (Prevent RLS recursion)
-- =============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.code = _role
  )
$$;

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = _user_id
      AND p.code = _permission
  )
$$;

-- Function to get user's employee_id
CREATE OR REPLACE FUNCTION public.get_user_employee_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT employee_id FROM public.users WHERE id = _user_id
$$;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TABLE(permission_code TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.code
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role_id = rp.role_id
  JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = _user_id
$$;

-- Function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE(role_code TEXT, role_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.code, r.name
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = _user_id
$$;

-- Function to get employee by NIP (for login)
CREATE OR REPLACE FUNCTION public.get_employee_by_nip(_nip TEXT)
RETURNS TABLE(id UUID, nip TEXT, nama TEXT, jabatan TEXT, unit_kerja TEXT, email TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.nip, e.nama, e.jabatan, e.unit_kerja, e.email
  FROM public.employees e
  WHERE e.nip = _nip
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- EMPLOYEES: Everyone can read, admin can manage
CREATE POLICY "Anyone can view employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert employees"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update employees"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete employees"
  ON public.employees FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- USERS: Users can read their own, admin can manage all
CREATE POLICY "Users can view own user record"
  ON public.users FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ROLES: Everyone can read, admin can manage
CREATE POLICY "Anyone can view roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PERMISSIONS: Everyone can read, admin can manage
CREATE POLICY "Anyone can view permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- USER_ROLES: Users can view own roles, admin can manage all
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user_roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ROLE_PERMISSIONS: Everyone can read, admin can manage
CREATE POLICY "Anyone can view role_permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage role_permissions"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DATA: Initial Roles
-- =============================================

INSERT INTO public.roles (code, name, description) VALUES
  ('admin', 'Administrator', 'Full access to all features including user and role management'),
  ('user', 'User', 'Basic user access');

-- =============================================
-- SEED DATA: Permissions for 11 test pages
-- =============================================

INSERT INTO public.permissions (code, name, description) VALUES
  ('access_dashboard', 'Access Dashboard', 'Can access the main dashboard'),
  ('access_admin', 'Access Admin Panel', 'Can access admin management features'),
  ('access_kabapas', 'Access Kabapas', 'Can access Kepala Lapas features'),
  ('access_kasubsie', 'Access Kasubsie', 'Can access Kepala Sub Seksi features'),
  ('access_operator_registrasi', 'Access Operator Registrasi', 'Can access registration operator features'),
  ('access_anev', 'Access Anev', 'Can access Analisis & Evaluasi features'),
  ('access_pk', 'Access PK', 'Can access Pembinaan Kepribadian features'),
  ('access_persuratan', 'Access Persuratan', 'Can access document management features'),
  ('access_bimker', 'Access Bimker', 'Can access Bimbingan Kerja features'),
  ('access_bimkemas', 'Access Bimkemas', 'Can access Bimbingan Kemasyarakatan features'),
  ('access_tpp', 'Access TPP', 'Can access TPP features'),
  ('access_laporan', 'Access Laporan', 'Can access reporting features'),
  ('manage_users', 'Manage Users', 'Can create and manage user accounts'),
  ('manage_roles', 'Manage Roles', 'Can manage roles and permissions'),
  ('import_employees', 'Import Employees', 'Can import employee data from Excel');

-- =============================================
-- SEED DATA: Assign all permissions to admin role
-- =============================================

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'admin';

-- Assign basic permissions to user role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code = 'access_dashboard'
WHERE r.code = 'user';

-- =============================================
-- SEED DATA: Sample employees for testing
-- =============================================

INSERT INTO public.employees (nip, nama, jabatan, unit_kerja, email) VALUES
  ('198501012010011001', 'Ahmad Sudirman', 'Kepala Lapas', 'Pimpinan', 'admin@lapas.local'),
  ('198502022010011002', 'Budi Santoso', 'Kasubsie Registrasi', 'Registrasi', 'budi@lapas.local'),
  ('198503032010011003', 'Citra Dewi', 'Staff Registrasi', 'Registrasi', 'citra@lapas.local'),
  ('198504042010011004', 'Dedi Kurniawan', 'Kasubsie Bimker', 'Bimbingan Kerja', 'dedi@lapas.local'),
  ('198505052010011005', 'Eka Putri', 'Staff Anev', 'Analisis Evaluasi', 'eka@lapas.local');