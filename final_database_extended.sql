-- ========================================
-- Coilmaster Corporate System - 확장 스키마
-- 추가 기능 테이블들 (프로젝트, 업무, 파일 관리 등)
-- ========================================

-- ========================================
-- 프로젝트 관리 테이블들
-- ========================================

-- 프로젝트 단계 테이블
CREATE TABLE IF NOT EXISTS public.phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    order_index INTEGER NOT NULL DEFAULT 1,
    type VARCHAR(20) DEFAULT 'project',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2),
    spent_budget DECIMAL(15,2) DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    pic_name VARCHAR(255),
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    department VARCHAR(255),
    corporation_id UUID REFERENCES public.corporations(id) ON DELETE SET NULL,
    current_phase_id UUID REFERENCES public.phases(id) ON DELETE SET NULL,
    promotion_stage VARCHAR(50) DEFAULT 'Promotion',
    promotion_status VARCHAR(50),
    project_type VARCHAR(100),
    image TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 멤버 테이블
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('manager', 'member', 'viewer')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- ========================================
-- 업무 관리 테이블들
-- ========================================

-- 업무 단계 테이블
CREATE TABLE IF NOT EXISTS public.task_phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_index),
    UNIQUE(name)
);

-- 업무 테이블
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT '할 일',
    priority VARCHAR(20) DEFAULT '보통',
    start_date DATE,
    due_date DATE,
    estimated_hours INTEGER,
    actual_hours INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    assigned_to UUID,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    task_phase UUID REFERENCES public.task_phases(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 업무 다중 담당자 테이블
CREATE TABLE IF NOT EXISTS public.task_assignees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, user_id)
);

-- ========================================
-- 파일 관리 테이블들
-- ========================================

-- 파일 테이블
CREATE TABLE IF NOT EXISTS public.files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    content_type VARCHAR,
    file_size BIGINT,
    file_path VARCHAR NOT NULL,
    uploaded_by UUID REFERENCES public.users(id),
    bucket_id VARCHAR DEFAULT 'project-files',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 첨부파일 테이블
CREATE TABLE IF NOT EXISTS public.project_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    file_name VARCHAR(500),
    file_url TEXT,
    file_size BIGINT,
    file_path VARCHAR(1000),
    content_type VARCHAR(200),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 업무 파일 테이블
CREATE TABLE IF NOT EXISTS public.task_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    file_type TEXT,
    file_url TEXT NOT NULL,
    is_image BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 업무 링크 테이블
CREATE TABLE IF NOT EXISTS public.task_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 업무 일지 및 개인 관리 테이블들
-- ========================================

-- 업무 일지 테이블
CREATE TABLE IF NOT EXISTS public.work_journals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    author_id UUID,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    plans TEXT,
    completed TEXT,
    notes TEXT,
    next_day_plans TEXT,
    issues TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    mood VARCHAR(20),
    productivity_score INTEGER CHECK (productivity_score >= 1 AND productivity_score <= 10),
    total_hours DECIMAL(4,2) DEFAULT 8,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 할일 관리 테이블
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
    completed BOOLEAN DEFAULT false,
    due_date DATE,
    completion_date TIMESTAMPTZ,
    user_id UUID,
    employee_id UUID,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    tags TEXT[],
    notes TEXT,
    estimated_hours DECIMAL(4,2),
    actual_hours DECIMAL(4,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 개인 업무 일지 테이블
CREATE TABLE IF NOT EXISTS public.personal_journals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    plans TEXT,
    completed TEXT,
    notes TEXT,
    next_day_plans TEXT,
    user_id UUID,
    employee_id UUID,
    author_name VARCHAR(255),
    mood VARCHAR(20),
    productivity_score INTEGER CHECK (productivity_score >= 1 AND productivity_score <= 10),
    total_hours DECIMAL(4,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 기본 프로젝트 단계 데이터
INSERT INTO public.phases (name, description, color, order_index) VALUES
('기획', '프로젝트 기획 단계', '#6b7280', 1),
('설계', '프로젝트 설계 단계', '#3b82f6', 2),
('개발', '프로젝트 개발 단계', '#f59e0b', 3),
('테스트', '프로젝트 테스트 단계', '#8b5cf6', 4),
('완료', '프로젝트 완료 단계', '#10b981', 5)
ON CONFLICT DO NOTHING;

-- 기본 업무 단계 데이터
INSERT INTO public.task_phases (name, description, color, order_index) VALUES
('영업 정보', '영업 관련 정보 수집 및 분석 단계', '#ef4444', 1),
('Sample 및 견적', '샘플 제작 및 견적서 작성 단계', '#f59e0b', 2),
('1차 특성 검증', '초기 특성 검증 및 테스트 단계', '#eab308', 3),
('설계 검증', '설계 검증 및 승인 단계', '#10b981', 4),
('set 검증', 'Set 검증 및 최종 확인 단계', '#06b6d4', 5),
('승인', '최종 승인 단계', '#8b5cf6', 6),
('수주', '수주 완료 단계', '#ec4899', 7),
('Drop', '프로젝트 중단 단계', '#6b7280', 8)
ON CONFLICT DO NOTHING;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON public.projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_department_id ON public.projects(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON public.task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_files_bucket_id ON public.files(bucket_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id ON public.project_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON public.task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_user_id ON public.work_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_date ON public.work_journals(date);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_journals_user_id ON public.personal_journals(user_id);

-- RLS 정책 설정
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_journals ENABLE ROW LEVEL SECURITY;

-- 간단한 RLS 정책 생성
CREATE POLICY "authenticated_users_all_phases" ON public.phases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_projects" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_project_members" ON public.project_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_task_phases" ON public.task_phases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_tasks" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_task_assignees" ON public.task_assignees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_files" ON public.files FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_project_attachments" ON public.project_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_task_files" ON public.task_files FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_task_links" ON public.task_links FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_work_journals" ON public.work_journals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_todos" ON public.todos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_personal_journals" ON public.personal_journals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 성공 메시지
SELECT '✅ Coilmaster 확장 스키마 생성 완료!' as message; 