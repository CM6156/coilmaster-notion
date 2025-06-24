-- ========================================
-- 업무 관리를 위한 테이블 생성 스크립트 (수정판)
-- ON CONFLICT 오류 해결
-- ========================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    assigned_to UUID,
    department VARCHAR(100),
    task_phase VARCHAR(100),
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. task_phases 테이블 생성 (업무 단계 관리)
CREATE TABLE IF NOT EXISTS public.task_phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. task_assignees 테이블 생성 (다중 담당자 지원)
CREATE TABLE IF NOT EXISTS public.task_assignees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'employee', 'manager')),
    is_primary BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
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

-- 6. UNIQUE 제약조건 추가 (테이블 생성 후)
-- task_phases 테이블에 UNIQUE 제약조건 추가
ALTER TABLE public.task_phases 
ADD CONSTRAINT IF NOT EXISTS unique_task_phase_name UNIQUE (name);

ALTER TABLE public.task_phases 
ADD CONSTRAINT IF NOT EXISTS unique_task_phase_order UNIQUE (order_index);

-- task_assignees 테이블에 UNIQUE 제약조건 추가
ALTER TABLE public.task_assignees 
ADD CONSTRAINT IF NOT EXISTS unique_task_assignee UNIQUE (task_id, user_id);

-- 7. 인덱스 생성
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

-- 8. 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. 트리거 설정
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

-- 10. 기본 업무 단계 데이터 삽입 (중복 체크 포함)
DO $$
BEGIN
    -- 기존 데이터 확인 후 삽입
    IF NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = '영업 정보') THEN
        INSERT INTO public.task_phases (name, description, color, order_index) VALUES
        ('영업 정보', '영업 관련 정보 수집 및 분석 단계', '#ef4444', 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = 'Sample 및 견적') THEN
        INSERT INTO public.task_phases (name, description, color, order_index) VALUES
        ('Sample 및 견적', '샘플 제작 및 견적서 작성 단계', '#f59e0b', 2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = '1차 특성 검증') THEN
        INSERT INTO public.task_phases (name, description, color, order_index) VALUES
        ('1차 특성 검증', '초기 특성 검증 및 테스트 단계', '#eab308', 3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = '설계 검증') THEN
        INSERT INTO public.task_phases (name, description, color, order_index) VALUES
        ('설계 검증', '설계 검증 및 승인 단계', '#10b981', 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = 'set 검증') THEN
        INSERT INTO public.task_phases (name, description, color, order_index) VALUES
        ('set 검증', 'Set 검증 및 최종 확인 단계', '#06b6d4', 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = '승인') THEN
        INSERT INTO public.task_phases (name, description, color, order_index) VALUES
        ('승인', '최종 승인 단계', '#8b5cf6', 6);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = '수주') THEN
        INSERT INTO public.task_phases (name, description, color, order_index) VALUES
        ('수주', '수주 완료 단계', '#ec4899', 7);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.task_phases WHERE name = 'Drop') THEN
        INSERT INTO public.task_phases (name, description, color, order_index) VALUES
        ('Drop', '프로젝트 중단 단계', '#6b7280', 8);
    END IF;
END $$;

-- 11. RLS (Row Level Security) 설정
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- 12. RLS 정책 생성 (모든 인증된 사용자가 접근 가능)
-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Allow authenticated users to read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to manage tasks" ON public.tasks;

CREATE POLICY "Allow authenticated users to manage tasks" 
ON public.tasks 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- task_phases 테이블 정책
DROP POLICY IF EXISTS "Allow authenticated users to read task_phases" ON public.task_phases;
DROP POLICY IF EXISTS "Allow authenticated users to manage task_phases" ON public.task_phases;

CREATE POLICY "Allow authenticated users to manage task_phases" 
ON public.task_phases 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- task_assignees 테이블 정책
DROP POLICY IF EXISTS "Allow authenticated users to manage task_assignees" ON public.task_assignees;

CREATE POLICY "Allow authenticated users to manage task_assignees" 
ON public.task_assignees 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- task_files 테이블 정책
DROP POLICY IF EXISTS "Allow authenticated users to manage task_files" ON public.task_files;

CREATE POLICY "Allow authenticated users to manage task_files" 
ON public.task_files 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- task_comments 테이블 정책
DROP POLICY IF EXISTS "Allow authenticated users to manage task_comments" ON public.task_comments;

CREATE POLICY "Allow authenticated users to manage task_comments" 
ON public.task_comments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 13. 테이블 댓글 추가
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

-- 14. 다중 담당자 정보를 포함한 뷰 생성
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

-- 15. 데이터 확인 쿼리
SELECT 
    'tasks' as table_name, 
    COUNT(*) as record_count 
FROM public.tasks
UNION ALL
SELECT 
    'task_phases' as table_name, 
    COUNT(*) as record_count 
FROM public.task_phases
UNION ALL
SELECT 
    'task_assignees' as table_name, 
    COUNT(*) as record_count 
FROM public.task_assignees;

-- 완료 메시지
SELECT '✅ Tasks 테이블 및 관련 테이블 생성이 완료되었습니다!' as message; 