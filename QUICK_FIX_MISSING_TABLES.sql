-- 🚨 빠른 404/400 오류 해결 스크립트

-- work_journals 테이블
CREATE TABLE IF NOT EXISTS public.work_journals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    plans TEXT,
    completed TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- employees 테이블
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- managers 테이블
CREATE TABLE IF NOT EXISTS public.managers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- clients 테이블
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
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
    work_journal_id UUID REFERENCES public.work_journals(id),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- work_journal_collaborators 테이블
CREATE TABLE IF NOT EXISTS public.work_journal_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    work_journal_id UUID REFERENCES public.work_journals(id),
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 데이터
INSERT INTO public.statuses (name, color, status_type_id, order_index) 
SELECT '할 일', '#ef4444', 1, 1 WHERE NOT EXISTS (SELECT 1 FROM public.statuses WHERE name = '할 일');

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

CREATE POLICY "allow_all_wj" ON public.work_journals FOR ALL TO authenticated USING (true);
CREATE POLICY "allow_all_emp" ON public.employees FOR ALL TO authenticated USING (true);
CREATE POLICY "allow_all_mgr" ON public.managers FOR ALL TO authenticated USING (true);
CREATE POLICY "allow_all_cli" ON public.clients FOR ALL TO authenticated USING (true);
CREATE POLICY "allow_all_stat" ON public.statuses FOR ALL TO authenticated USING (true);
CREATE POLICY "allow_all_wjf" ON public.work_journal_files FOR ALL TO authenticated USING (true);
CREATE POLICY "allow_all_wjc" ON public.work_journal_collaborators FOR ALL TO authenticated USING (true);

SELECT '✅ 404/400 오류 해결 완료!' as message; 