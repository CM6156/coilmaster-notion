-- ========================================
-- 업무 관리를 위한 테이블 생성 스크립트
-- ========================================

-- 1. tasks 테이블 생성 (메인 업무 테이블)
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
    assigned_to UUID, -- users, employees, managers 테이블 중 하나를 참조
    department VARCHAR(100),
    task_phase VARCHAR(100), -- 업무 단계
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE, -- 상위 업무 참조 (하위업무용)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. task_phases 테이블 생성 (업무 단계 관리)
CREATE TABLE IF NOT EXISTS public.task_phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6', -- HEX 색상 코드
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(order_index)
);

-- 3. task_assignees 테이블 생성 (다중 담당자 지원)
CREATE TABLE IF NOT EXISTS public.task_assignees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- users, employees, managers 중 하나의 ID
    user_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'employee', 'manager')),
    is_primary BOOLEAN DEFAULT false, -- 주 담당자 여부
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(task_id, user_id)
);

-- 4. task_files 테이블 생성 (업무 첨부파일)
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

-- 5. task_comments 테이블 생성 (업무 댓글)
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_task_phases_order ON public.task_phases(order_index);
CREATE INDEX IF NOT EXISTS idx_task_phases_active ON public.task_phases(is_active);

CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON public.task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_primary ON public.task_assignees(is_primary);

CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON public.task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);

-- 7. 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 트리거 설정
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_phases_updated_at ON public.task_phases;
CREATE TRIGGER update_task_phases_updated_at 
    BEFORE UPDATE ON public.task_phases 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER update_task_comments_updated_at 
    BEFORE UPDATE ON public.task_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. 기본 업무 단계 데이터 삽입
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

-- 10. RLS (Row Level Security) 설정
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- 11. RLS 정책 생성 (모든 인증된 사용자가 접근 가능)
-- tasks 테이블 정책
CREATE POLICY "Allow authenticated users to read tasks" 
ON public.tasks 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert tasks" 
ON public.tasks 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update tasks" 
ON public.tasks 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to delete tasks" 
ON public.tasks 
FOR DELETE 
TO authenticated 
USING (true);

-- task_phases 테이블 정책
CREATE POLICY "Allow authenticated users to read task_phases" 
ON public.task_phases 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to manage task_phases" 
ON public.task_phases 
FOR ALL 
TO authenticated 
USING (true);

-- task_assignees 테이블 정책
CREATE POLICY "Allow authenticated users to manage task_assignees" 
ON public.task_assignees 
FOR ALL 
TO authenticated 
USING (true);

-- task_files 테이블 정책
CREATE POLICY "Allow authenticated users to manage task_files" 
ON public.task_files 
FOR ALL 
TO authenticated 
USING (true);

-- task_comments 테이블 정책
CREATE POLICY "Allow authenticated users to manage task_comments" 
ON public.task_comments 
FOR ALL 
TO authenticated 
USING (true);

-- 12. 테이블 댓글 추가
COMMENT ON TABLE public.tasks IS '업무 관리 테이블';
COMMENT ON COLUMN public.tasks.id IS '업무 고유 식별자';
COMMENT ON COLUMN public.tasks.title IS '업무 제목';
COMMENT ON COLUMN public.tasks.description IS '업무 설명';
COMMENT ON COLUMN public.tasks.status IS '업무 상태 (할 일, 진행중, 완료 등)';
COMMENT ON COLUMN public.tasks.priority IS '우선순위 (낮음, 보통, 높음, 긴급)';
COMMENT ON COLUMN public.tasks.progress IS '진행률 (0-100)';
COMMENT ON COLUMN public.tasks.start_date IS '시작일';
COMMENT ON COLUMN public.tasks.due_date IS '마감일';
COMMENT ON COLUMN public.tasks.project_id IS '소속 프로젝트 ID';
COMMENT ON COLUMN public.tasks.assigned_to IS '담당자 ID';
COMMENT ON COLUMN public.tasks.department IS '담당 부서';
COMMENT ON COLUMN public.tasks.task_phase IS '업무 단계';
COMMENT ON COLUMN public.tasks.parent_task_id IS '상위 업무 ID (하위업무용)';

COMMENT ON TABLE public.task_phases IS '업무 단계 관리 테이블';
COMMENT ON TABLE public.task_assignees IS '업무 다중 담당자 관리 테이블';
COMMENT ON TABLE public.task_files IS '업무 첨부파일 관리 테이블';
COMMENT ON TABLE public.task_comments IS '업무 댓글 관리 테이블';

-- 13. 다중 담당자 정보를 포함한 뷰 생성
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

COMMENT ON VIEW public.tasks_with_assignees IS '다중 담당자 정보가 포함된 업무 뷰';

-- 완료 메시지
SELECT 'Tasks 테이블 및 관련 테이블 생성이 완료되었습니다!' as message; 