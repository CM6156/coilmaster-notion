-- ========================================
-- 완전한 누락 테이블 생성 스크립트 (AppContext.tsx 오류 완전 해결)
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- work_journals 테이블
CREATE TABLE IF NOT EXISTS public.work_journals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    author_id UUID,
    date DATE NOT NULL,
    plans TEXT,
    completed TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- employees 테이블
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    department_id UUID REFERENCES public.departments(id),
    position_id UUID REFERENCES public.positions(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- managers 테이블
CREATE TABLE IF NOT EXISTS public.managers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    department_id UUID REFERENCES public.departments(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- clients 테이블
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- statuses 테이블
CREATE TABLE IF NOT EXISTS public.statuses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    status_type_id INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- work_journal_files 테이블
CREATE TABLE IF NOT EXISTS public.work_journal_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    work_journal_id UUID REFERENCES public.work_journals(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- work_journal_collaborators 테이블
CREATE TABLE IF NOT EXISTS public.work_journal_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    work_journal_id UUID REFERENCES public.work_journals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'collaborator',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(work_journal_id, user_id)
);

-- 기본 statuses 데이터
INSERT INTO public.statuses (name, color, status_type_id, order_index) 
SELECT '할 일', '#ef4444', 1, 1 WHERE NOT EXISTS (SELECT 1 FROM public.statuses WHERE name = '할 일');

INSERT INTO public.statuses (name, color, status_type_id, order_index) 
SELECT '진행 중', '#f59e0b', 1, 2 WHERE NOT EXISTS (SELECT 1 FROM public.statuses WHERE name = '진행 중');

INSERT INTO public.statuses (name, color, status_type_id, order_index) 
SELECT '완료', '#10b981', 1, 3 WHERE NOT EXISTS (SELECT 1 FROM public.statuses WHERE name = '완료');

-- RLS 정책
ALTER TABLE public.work_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_journal_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_journal_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_work_journals" ON public.work_journals FOR ALL TO authenticated USING (true);
CREATE POLICY "allow_all_employees" ON public.employees FOR ALL TO authenticated USING (true);
CREATE POLICY "allow_all_managers" ON public.managers FOR ALL TO authenticated USING (true);
CREATE POLICY "allow_all_clients" ON public.clients FOR ALL TO authenticated USING (true);
CREATE POLICY "allow_all_statuses" ON public.statuses FOR ALL TO authenticated USING (true);
CREATE POLICY "allow_all_work_journal_files" ON public.work_journal_files FOR ALL TO authenticated USING (true);
CREATE POLICY "allow_all_work_journal_collaborators" ON public.work_journal_collaborators FOR ALL TO authenticated USING (true);

SELECT '✅ 모든 누락된 테이블 생성 완료! 404/400 오류 해결됨!' as message;