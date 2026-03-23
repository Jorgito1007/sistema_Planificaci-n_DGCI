-- Drop existing tables if needed for clean migration
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.component_documents CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.user_permissions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'Asesores' CHECK (role IN ('Administrador', 'Director DGCI', 'Asesores', 'Directores de Unidades')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User module permissions
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  can_access BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, module)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_select_all" ON public.user_permissions FOR SELECT USING (true);
CREATE POLICY "permissions_admin_insert" ON public.user_permissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Administrador')
);
CREATE POLICY "permissions_admin_update" ON public.user_permissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Administrador')
);
CREATE POLICY "permissions_admin_delete" ON public.user_permissions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Administrador')
);

-- Documents table (Sistema Administrativo)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sub_module TEXT NOT NULL,
  elaborado BOOLEAN NOT NULL DEFAULT false,
  aprobado BOOLEAN NOT NULL DEFAULT false,
  implementado BOOLEAN NOT NULL DEFAULT false,
  actualizado BOOLEAN NOT NULL DEFAULT false,
  difundido BOOLEAN NOT NULL DEFAULT false,
  pdf_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_all" ON public.documents FOR SELECT USING (true);
CREATE POLICY "documents_insert" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "documents_update" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "documents_delete" ON public.documents FOR DELETE USING (true);

-- Component documents table (Por Componentes)
CREATE TABLE public.component_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  component TEXT NOT NULL,
  elaborado BOOLEAN NOT NULL DEFAULT false,
  aprobado BOOLEAN NOT NULL DEFAULT false,
  implementado BOOLEAN NOT NULL DEFAULT false,
  actualizado BOOLEAN NOT NULL DEFAULT false,
  difundido BOOLEAN NOT NULL DEFAULT false,
  pdf_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.component_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comp_docs_select_all" ON public.component_documents FOR SELECT USING (true);
CREATE POLICY "comp_docs_insert" ON public.component_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "comp_docs_update" ON public.component_documents FOR UPDATE USING (true);
CREATE POLICY "comp_docs_delete" ON public.component_documents FOR DELETE USING (true);

-- Audit log table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select_all" ON public.audit_log FOR SELECT USING (true);
CREATE POLICY "audit_insert" ON public.audit_log FOR INSERT WITH CHECK (true);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'role', 'Asesores')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_permissions (user_id, module, can_access)
  VALUES
    (new.id, 'sistema_administrativo', true),
    (new.id, 'por_componentes', false),
    (new.id, 'informes', false),
    (new.id, 'permisos_usuario', false),
    (new.id, 'auditoria', false)
  ON CONFLICT (user_id, module) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
