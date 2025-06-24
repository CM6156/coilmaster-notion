-- ========================================
-- 업무 관리 테이블 생성 (간단한 버전)
-- PostgreSQL 호환성 최적화
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
    project_id UUID,
    assigned_to UUID,
    department VARCHAR(100),
    task_phase VARCHAR(100),
    parent_task_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. task_phases 테이블 생성 (업무 단계 관리)
CREATE TABLE IF NOT EXISTS public.task_phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    order_index INTEGER NOT NULL DEFAULT 1 UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

-- 4. 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 트리거 설정
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

-- 6. 기본 업무 단계 데이터 삽입
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

-- 7. RLS (Row Level Security) 설정
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_phases ENABLE ROW LEVEL SECURITY;

-- 8. RLS 정책 생성
DROP POLICY IF EXISTS "tasks_policy" ON public.tasks;
CREATE POLICY "tasks_policy" 
ON public.tasks 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "task_phases_policy" ON public.task_phases;
CREATE POLICY "task_phases_policy" 
ON public.task_phases 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 9. 확인 쿼리
SELECT 
    'tasks' as table_name, 
    COUNT(*) as record_count 
FROM public.tasks
UNION ALL
SELECT 
    'task_phases' as table_name, 
    COUNT(*) as record_count 
FROM public.task_phases;

-- 완료 메시지
SELECT '✅ Tasks 테이블 생성 완료!' as message; 