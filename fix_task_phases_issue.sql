-- 업무 단계 문제 해결을 위한 SQL 스크립트
-- Supabase 대시보드의 SQL 에디터에서 실행하세요

-- 1단계: 기존 외래키 제약조건 제거
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_task_phase_fkey;

-- 2단계: task_phases 테이블 생성
CREATE TABLE IF NOT EXISTS public.task_phases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  order_index INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(order_index),
  UNIQUE(name)
);

-- 3단계: 기본 업무 단계 데이터 삽입 (중복 방지를 위해 조건부 삽입)
DO $$
BEGIN
  -- 테이블이 비어있을 때만 데이터 삽입
  IF NOT EXISTS (SELECT 1 FROM public.task_phases LIMIT 1) THEN
    INSERT INTO public.task_phases (name, description, color, order_index) VALUES
    ('영업 정보', '영업 관련 정보 수집 및 분석 단계', '#ef4444', 1),
    ('Sample 및 견적', '샘플 제작 및 견적서 작성 단계', '#f59e0b', 2),
    ('1차 특성 검증', '초기 특성 검증 및 테스트 단계', '#eab308', 3),
    ('설계 검증', '설계 검증 및 승인 단계', '#10b981', 4),
    ('set 검증', 'Set 검증 및 최종 확인 단계', '#06b6d4', 5),
    ('승인', '최종 승인 단계', '#8b5cf6', 6),
    ('수주', '수주 완료 단계', '#ec4899', 7),
    ('Drop', '프로젝트 중단 단계', '#6b7280', 8);
  END IF;
END $$;

-- 4단계: tasks 테이블에 task_phase 컬럼이 없다면 추가
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_phase UUID;

-- 5단계: 기존 업무들의 잘못된 task_phase 값을 NULL로 초기화
UPDATE public.tasks 
SET task_phase = NULL 
WHERE task_phase IS NOT NULL 
AND task_phase NOT IN (SELECT id FROM public.task_phases);

-- 6단계: 기존 업무들에 대해 기본 단계 설정 (첫 번째 단계로)
UPDATE public.tasks 
SET task_phase = (
  SELECT id 
  FROM public.task_phases 
  WHERE is_active = true 
  ORDER BY order_index ASC 
  LIMIT 1
)
WHERE task_phase IS NULL;

-- 7단계: 새로운 외래키 제약조건 추가
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_task_phase_fkey 
FOREIGN KEY (task_phase) REFERENCES public.task_phases(id);

-- 8단계: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_task_phases_order ON public.task_phases(order_index);
CREATE INDEX IF NOT EXISTS idx_task_phases_active ON public.task_phases(is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_task_phase ON public.tasks(task_phase);

-- 9단계: 코멘트 추가
COMMENT ON TABLE public.task_phases IS '업무 단계 관리 테이블';
COMMENT ON COLUMN public.tasks.task_phase IS '업무 단계 - task_phases 테이블의 id를 참조';

-- 10단계: 확인 쿼리
SELECT 'task_phases 테이블 생성 완료' as status, COUNT(*) as phase_count FROM public.task_phases;
SELECT 'tasks 테이블 업데이트 완료' as status, COUNT(*) as task_count FROM public.tasks WHERE task_phase IS NOT NULL; 