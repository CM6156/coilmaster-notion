-- ========================================
-- 누락된 테이블들 생성 스크립트
-- AppContext.tsx에서 요구하는 테이블들
-- ========================================

-- 1. employees 테이블 (404 오류 해결)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    employee_number VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    hire_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. managers 테이블 (404 오류 해결)
CREATE TABLE IF NOT EXISTS public.managers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. clients 테이블 (400 오류 해결)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    contact_person VARCHAR(255),
    industry VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'potential')),
    notes TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. statuses 테이블 (404 오류 해결)
CREATE TABLE IF NOT EXISTS public.statuses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    description TEXT,
    status_type_id INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. work_journal_files 테이블 (400 오류 해결)
CREATE TABLE IF NOT EXISTS public.work_journal_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    work_journal_id UUID REFERENCES public.work_journals(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    file_type TEXT,
    file_url TEXT NOT NULL,
    file_path TEXT,
    is_image BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. work_journal_collaborators 테이블 (400 오류 해결)
CREATE TABLE IF NOT EXISTS public.work_journal_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    work_journal_id UUID REFERENCES public.work_journals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'collaborator' CHECK (role IN ('collaborator', 'reviewer', 'approver')),
    can_edit BOOLEAN DEFAULT false,
    can_comment BOOLEAN DEFAULT true,
    added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(work_journal_id, user_id)
);

-- 7. phases 테이블 (프로젝트 단계용)
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

-- 8. task_phases 테이블 (업무 단계용)
CREATE TABLE IF NOT EXISTS public.task_phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 기본 데이터 삽입
-- ========================================

-- 기본 statuses 데이터
INSERT INTO public.statuses (name, color, status_type_id, order_index) 
SELECT '할 일', '#ef4444', 1, 1 WHERE NOT EXISTS (SELECT 1 FROM public.statuses WHERE name = '할 일');

INSERT INTO public.statuses (name, color, status_type_id, order_index) 
SELECT '진행 중', '#f59e0b', 1, 2 WHERE NOT EXISTS (SELECT 1 FROM public.statuses WHERE name = '진행 중');

INSERT INTO public.statuses (name, color, status_type_id, order_index) 
SELECT '완료', '#10b981', 1, 3 WHERE NOT EXISTS (SELECT 1 FROM public.statuses WHERE name = '완료');

INSERT INTO public.statuses (name, color, status_type_id, order_index) 
SELECT '보류', '#6b7280', 1, 4 WHERE NOT EXISTS (SELECT 1 FROM public.statuses WHERE name = '보류');

-- 기본 phases 데이터
INSERT INTO public.phases (name, description, color, order_index) 
SELECT '기획', '프로젝트 기획 단계', '#6b7280', 1 WHERE NOT EXISTS (SELECT 1 FROM public.phases WHERE name = '기획');

INSERT INTO public.phases (name, description, color, order_index) 
SELECT '설계', '프로젝트 설계 단계', '#3b82f6', 2 WHERE NOT EXISTS (SELECT 1 FROM public.phases WHERE name = '설계');

INSERT INTO public.phases (name, description, color, order_index) 
SELECT '개발', '프로젝트 개발 단계', '#f59e0b', 3 WHERE NOT EXISTS (SELECT 1 FROM public.phases WHERE name = '개발');

INSERT INTO public.phases (name, description, color, order_index) 
SELECT '테스트', '프로젝트 테스트 단계', '#8b5cf6', 4 WHERE NOT EXISTS (SELECT 1 FROM public.phases WHERE name = '테스트');

INSERT INTO public.phases (name, description, color, order_index) 
SELECT '완료', '프로젝트 완료 단계', '#10b981', 5 WHERE NOT EXISTS (SELECT 1 FROM public.phases WHERE name = '완료');

-- 기본 task_phases 데이터
INSERT INTO public.task_phases (name, description, color, order_index) 
SELECT '영업 정보', '영업 관련 정보 수집 및 분석 단계', '#ef4444', 1 WHERE NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = '영업 정보');

INSERT INTO public.task_phases (name, description, color, order_index) 
SELECT 'Sample 및 견적', '샘플 제작 및 견적서 작성 단계', '#f59e0b', 2 WHERE NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = 'Sample 및 견적');

INSERT INTO public.task_phases (name, description, color, order_index) 
SELECT '1차 특성 검증', '초기 특성 검증 및 테스트 단계', '#eab308', 3 WHERE NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = '1차 특성 검증');

INSERT INTO public.task_phases (name, description, color, order_index) 
SELECT '설계 검증', '설계 검증 및 승인 단계', '#10b981', 4 WHERE NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = '설계 검증');

INSERT INTO public.task_phases (name, description, color, order_index) 
SELECT 'set 검증', 'Set 검증 및 최종 확인 단계', '#06b6d4', 5 WHERE NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = 'set 검증');

INSERT INTO public.task_phases (name, description, color, order_index) 
SELECT '승인', '최종 승인 단계', '#8b5cf6', 6 WHERE NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = '승인');

INSERT INTO public.task_phases (name, description, color, order_index) 
SELECT '수주', '수주 완료 단계', '#ec4899', 7 WHERE NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = '수주');

INSERT INTO public.task_phases (name, description, color, order_index) 
SELECT 'Drop', '프로젝트 중단 단계', '#6b7280', 8 WHERE NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = 'Drop');

-- ========================================
-- 인덱스 생성
-- ========================================

CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position_id ON public.employees(position_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON public.employees(manager_id);

CREATE INDEX IF NOT EXISTS idx_managers_user_id ON public.managers(user_id);
CREATE INDEX IF NOT EXISTS idx_managers_department_id ON public.managers(department_id);
CREATE INDEX IF NOT EXISTS idx_managers_position_id ON public.managers(position_id);

CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

CREATE INDEX IF NOT EXISTS idx_statuses_status_type_id ON public.statuses(status_type_id);
CREATE INDEX IF NOT EXISTS idx_statuses_order_index ON public.statuses(order_index);

CREATE INDEX IF NOT EXISTS idx_work_journal_files_work_journal_id ON public.work_journal_files(work_journal_id);
CREATE INDEX IF NOT EXISTS idx_work_journal_files_uploaded_by ON public.work_journal_files(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_work_journal_collaborators_work_journal_id ON public.work_journal_collaborators(work_journal_id);
CREATE INDEX IF NOT EXISTS idx_work_journal_collaborators_user_id ON public.work_journal_collaborators(user_id);

CREATE INDEX IF NOT EXISTS idx_phases_order_index ON public.phases(order_index);
CREATE INDEX IF NOT EXISTS idx_phases_type ON public.phases(type);

CREATE INDEX IF NOT EXISTS idx_task_phases_order_index ON public.task_phases(order_index);

-- ========================================
-- RLS 정책 설정
-- ========================================

-- RLS 활성화
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_journal_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_journal_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_phases ENABLE ROW LEVEL SECURITY;

-- 간단한 RLS 정책 (인증된 사용자 전체 권한)
CREATE POLICY "authenticated_full_access_employees" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_managers" ON public.managers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_statuses" ON public.statuses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_work_journal_files" ON public.work_journal_files FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_work_journal_collaborators" ON public.work_journal_collaborators FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_phases" ON public.phases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_task_phases" ON public.task_phases FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 완료 메시지
SELECT '✅ 누락된 테이블들 생성 완료! AppContext.tsx 오류 해결됨!' as message; 