-- ========================================
-- 업무 단계(task_phases) 테이블 생성 및 데이터 완전 설정
-- Supabase SQL 에디터에서 실행하세요
-- ========================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 기존 외래키 제약조건 제거 (안전하게)
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_task_phase_fkey;

-- task_phases 테이블 생성
CREATE TABLE IF NOT EXISTS public.task_phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 기존 데이터 삭제 (새로 시작)
DELETE FROM public.task_phases;

-- UNIQUE 제약조건 삭제 후 재생성
ALTER TABLE public.task_phases DROP CONSTRAINT IF EXISTS task_phases_name_key;
ALTER TABLE public.task_phases DROP CONSTRAINT IF EXISTS task_phases_order_index_key;
ALTER TABLE public.task_phases DROP CONSTRAINT IF EXISTS unique_task_phase_name;
ALTER TABLE public.task_phases DROP CONSTRAINT IF EXISTS unique_task_phase_order;

-- 15개 업무 단계 데이터 삽입
INSERT INTO public.task_phases (name, description, color, order_index, is_active) VALUES
('영업정보', '영업 관련 정보 수집 및 분석', '#ef4444', 1, true),
('견적서 및 접수', '견적서 작성 및 고객 접수', '#f97316', 2, true),
('견적서 분석', '견적서 상세 분석 및 검토', '#f59e0b', 3, true),
('원자재 소싱전략', '원자재 소싱 전략 수립', '#eab308', 4, true),
('SPL 접수', 'SPL 관련 업무 접수', '#84cc16', 5, true),
('원재 소싱전략', '원재료 소싱 전략 수립', '#22c55e', 6, true),
('원재 결정', '원재료 최종 결정', '#10b981', 7, true),
('E-Service Content', 'E-Service 컨텐츠 관리', '#14b8a6', 8, true),
('E-Service 완성', 'E-Service 시스템 완성', '#06b6d4', 9, true),
('LINE 그래디', 'LINE 관련 그래디 작업', '#0ea5e9', 10, true),
('결과 산출', '결과 데이터 산출 및 정리', '#3b82f6', 11, true),
('PP', 'PP 관련 업무', '#6366f1', 12, true),
('품질 Review', '품질 검토 및 리뷰', '#8b5cf6', 13, true),
('최종 개선', '최종 개선 및 완료', '#a855f7', 14, true),
('수주', '수주 완료', '#ec4899', 15, true);

-- UNIQUE 제약조건 추가
ALTER TABLE public.task_phases 
ADD CONSTRAINT unique_task_phase_name UNIQUE (name);

ALTER TABLE public.task_phases 
ADD CONSTRAINT unique_task_phase_order UNIQUE (order_index);

-- tasks 테이블에 task_phase 컬럼 추가 (없는 경우)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_phase UUID;

-- 기존 업무들의 잘못된 task_phase 값을 NULL로 초기화
UPDATE public.tasks 
SET task_phase = NULL 
WHERE task_phase IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM public.task_phases WHERE id = public.tasks.task_phase
);

-- 외래키 제약조건 추가
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_task_phase_fkey 
FOREIGN KEY (task_phase) REFERENCES public.task_phases(id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_task_phases_order ON public.task_phases(order_index);
CREATE INDEX IF NOT EXISTS idx_task_phases_active ON public.task_phases(is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_task_phase ON public.tasks(task_phase);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_task_phases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
DROP TRIGGER IF EXISTS update_task_phases_updated_at ON public.task_phases;
CREATE TRIGGER update_task_phases_updated_at 
    BEFORE UPDATE ON public.task_phases 
    FOR EACH ROW 
    EXECUTE FUNCTION update_task_phases_updated_at();

-- RLS 정책 설정
ALTER TABLE public.task_phases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to manage task_phases" ON public.task_phases;
CREATE POLICY "Allow authenticated users to manage task_phases" 
ON public.task_phases 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 확인 쿼리
SELECT 
    '✅ task_phases 테이블 설정 완료' as status,
    COUNT(*) as total_phases
FROM public.task_phases;

SELECT 
    order_index,
    name,
    color,
    is_active
FROM public.task_phases 
ORDER BY order_index; 