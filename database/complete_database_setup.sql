-- ========================================
-- 코일마스터 시스템 완전한 데이터베이스 설정
-- ========================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 기본 조직 구조 테이블들

-- 회사/법인 테이블
CREATE TABLE IF NOT EXISTS public.corporations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 부서 테이블
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.departments(id),
    corporation_id UUID REFERENCES public.corporations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 직책 테이블
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    level INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. 사용자 관련 테이블들

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    department_id UUID REFERENCES public.departments(id),
    position_id UUID REFERENCES public.positions(id),
    corporation_id UUID REFERENCES public.corporations(id),
    phone VARCHAR(50),
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 직원 테이블
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    employee_number VARCHAR(50) UNIQUE,
    department_id UUID REFERENCES public.departments(id),
    position_id UUID REFERENCES public.positions(id),
    corporation_id UUID REFERENCES public.corporations(id),
    hire_date DATE,
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 매니저 테이블
CREATE TABLE IF NOT EXISTS public.managers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department_id UUID REFERENCES public.departments(id),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. 고객 관리 테이블

-- 고객 테이블
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_number VARCHAR(50),
    manager_id UUID REFERENCES public.managers(id),
    sales_rep_id UUID,
    requirements TEXT,
    homepage VARCHAR(500),
    flag VARCHAR(10),
    remark TEXT,
    files JSON DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. 프로젝트 관리 테이블들

-- 프로젝트 단계 테이블
CREATE TABLE IF NOT EXISTS public.phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    type VARCHAR(20) DEFAULT 'project',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planned',
    promotion_status VARCHAR(50),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    due_date DATE,
    end_date DATE,
    client_id UUID REFERENCES public.clients(id),
    manager_id UUID,
    pic_name VARCHAR(255), -- 담당자 이름
    department_id UUID REFERENCES public.departments(id),
    current_phase VARCHAR(100),
    current_phase_id UUID REFERENCES public.phases(id),
    project_type VARCHAR(100),
    annual_quantity INTEGER DEFAULT 0,
    average_amount DECIMAL(15,2) DEFAULT 0,
    annual_amount DECIMAL(15,2) DEFAULT 0,
    competitor TEXT,
    issue_corporation_id UUID REFERENCES public.corporations(id),
    request_date DATE,
    target_sop_date DATE,
    completed BOOLEAN DEFAULT false,
    team JSON DEFAULT '[]',
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. 업무 관리 테이블들 (이전에 생성한 것과 동일)

-- 업무 단계 테이블
CREATE TABLE IF NOT EXISTS public.task_phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(order_index)
);

-- 업무 테이블
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT '할 일',
    priority VARCHAR(50) DEFAULT 'medium',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    due_date DATE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    assigned_to UUID,
    department VARCHAR(100),
    task_phase VARCHAR(100),
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 업무 다중 담당자 테이블
CREATE TABLE IF NOT EXISTS public.task_assignees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'employee', 'manager')),
    is_primary BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(task_id, user_id)
);

-- 6. 파일 관리 테이블들

-- 파일 테이블
CREATE TABLE IF NOT EXISTS public.files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    content_type VARCHAR(100),
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 프로젝트 첨부파일 연결 테이블
CREATE TABLE IF NOT EXISTS public.project_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 업무 첨부파일 테이블
CREATE TABLE IF NOT EXISTS public.task_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by UUID,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. 업무 일지 관리 테이블들

-- 업무 일지 테이블
CREATE TABLE IF NOT EXISTS public.work_journals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id),
    task_id UUID REFERENCES public.tasks(id),
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'in-progress',
    author_id UUID NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 업무 일지 파일 테이블
CREATE TABLE IF NOT EXISTS public.work_journal_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    journal_id UUID REFERENCES public.work_journals(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 업무 일지 협업자 테이블
CREATE TABLE IF NOT EXISTS public.work_journal_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    journal_id UUID REFERENCES public.work_journals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 8. 알림 관리 테이블

-- 알림 테이블
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    user_id UUID,
    is_read BOOLEAN DEFAULT false,
    related_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 9. 인덱스 생성
-- 기본 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_managers_department ON public.managers(department_id);

-- 프로젝트 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON public.projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_current_phase ON public.projects(current_phase_id);

-- 업무 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);

-- 업무 일지 인덱스
CREATE INDEX IF NOT EXISTS idx_work_journals_project_id ON public.work_journals(project_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_task_id ON public.work_journals(task_id);
CREATE INDEX IF NOT EXISTS idx_work_journals_author_id ON public.work_journals(author_id);

-- 10. 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. 모든 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_corporations_updated_at BEFORE UPDATE ON public.corporations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_managers_updated_at BEFORE UPDATE ON public.managers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_phases_updated_at BEFORE UPDATE ON public.phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_phases_updated_at BEFORE UPDATE ON public.task_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_journals_updated_at BEFORE UPDATE ON public.work_journals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. 기본 데이터 삽입

-- 기본 법인 데이터
INSERT INTO public.corporations (name, code) VALUES
('코일마스터', 'CM'),
('테스트 법인', 'TEST')
ON CONFLICT (code) DO NOTHING;

-- 기본 부서 데이터
INSERT INTO public.departments (name, code, corporation_id) VALUES
('경영', 'management', (SELECT id FROM public.corporations WHERE code = 'CM' LIMIT 1)),
('영업', 'sales', (SELECT id FROM public.corporations WHERE code = 'CM' LIMIT 1)),
('개발', 'development', (SELECT id FROM public.corporations WHERE code = 'CM' LIMIT 1)),
('제조', 'manufacturing', (SELECT id FROM public.corporations WHERE code = 'CM' LIMIT 1)),
('품질', 'quality', (SELECT id FROM public.corporations WHERE code = 'CM' LIMIT 1)),
('재무', 'finance', (SELECT id FROM public.corporations WHERE code = 'CM' LIMIT 1))
ON CONFLICT (code) DO NOTHING;

-- 기본 직책 데이터
INSERT INTO public.positions (name, code, level) VALUES
('사원', 'staff', 1),
('주임', 'supervisor', 2),
('대리', 'assistant_manager', 3),
('과장', 'manager', 4),
('차장', 'deputy_general_manager', 5),
('부장', 'general_manager', 6),
('이사', 'director', 7),
('상무', 'executive_director', 8),
('전무', 'executive_vice_president', 9),
('사장', 'president', 10)
ON CONFLICT (code) DO NOTHING;

-- 기본 프로젝트 단계 데이터
INSERT INTO public.phases (name, description, color, order_index, type) VALUES
('기획', '프로젝트 기획 및 계획 수립 단계', '#3b82f6', 1, 'project'),
('개발', '제품 개발 및 설계 단계', '#f59e0b', 2, 'project'),
('제조', '제조 공정 설계 및 준비 단계', '#10b981', 3, 'project'),
('품질', '품질 검증 및 테스트 단계', '#8b5cf6', 4, 'project'),
('양산', '대량 생산 및 출하 단계', '#ef4444', 5, 'project'),
('영업', '영업 및 마케팅 단계', '#ec4899', 6, 'project')
ON CONFLICT (name) DO NOTHING;

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
ON CONFLICT (name) DO NOTHING;

-- 13. RLS (Row Level Security) 설정
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_journal_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_journal_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 14. 기본 RLS 정책 (모든 인증된 사용자 접근 가능)
DO $$
DECLARE
    table_name text;
    table_names text[] := ARRAY[
        'corporations', 'departments', 'positions', 'users', 'employees', 
        'managers', 'clients', 'phases', 'projects', 'task_phases', 'tasks', 
        'task_assignees', 'files', 'project_attachments', 'task_files', 
        'work_journals', 'work_journal_files', 'work_journal_collaborators', 'notifications'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        EXECUTE format('
            CREATE POLICY "Allow authenticated users full access" 
            ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (true) 
            WITH CHECK (true)', table_name);
    END LOOP;
END $$;

-- 15. 유용한 뷰 생성

-- 다중 담당자 정보를 포함한 업무 뷰
CREATE OR REPLACE VIEW public.tasks_with_assignees AS
SELECT 
    t.*,
    COALESCE(
        NULLIF(
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'user_id', ta.user_id,
                    'user_name', ta.user_name,
                    'user_type', ta.user_type,
                    'is_primary', ta.is_primary,
                    'assigned_at', ta.assigned_at
                )
            ) FILTER (WHERE ta.user_id IS NOT NULL), 
            '[null]'::json
        ), 
        '[]'::json
    ) as assignees,
    (SELECT ta2.user_id FROM public.task_assignees ta2 WHERE ta2.task_id = t.id AND ta2.is_primary = true LIMIT 1) as primary_assignee_id
FROM public.tasks t
LEFT JOIN public.task_assignees ta ON t.id = ta.task_id
GROUP BY t.id
ORDER BY t.created_at DESC;

-- 프로젝트와 단계 정보 조인 뷰
CREATE OR REPLACE VIEW public.projects_with_phases AS
SELECT 
    p.*,
    ph.name as phase_name,
    ph.description as phase_description,
    ph.color as phase_color,
    ph.order_index as phase_order
FROM public.projects p
LEFT JOIN public.phases ph ON p.current_phase_id = ph.id;

-- 완료 메시지
SELECT '🎉 코일마스터 시스템 데이터베이스 설정이 완료되었습니다!' as message; 