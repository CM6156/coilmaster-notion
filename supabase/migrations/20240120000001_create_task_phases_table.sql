-- 업무 단계 테이블 생성
-- 프로젝트 단계(phases)와 별도로 업무 단계를 관리

-- task_phases 테이블 생성
CREATE TABLE IF NOT EXISTS public.task_phases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#3b82f6', -- HEX 색상 코드
  order_index INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(order_index),
  UNIQUE(name)
);

-- 기본 업무 단계 데이터 삽입
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

-- tasks 테이블의 task_phase 컬럼을 task_phases 테이블 참조로 수정
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_task_phase_fkey;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_task_phase_fkey 
FOREIGN KEY (task_phase) REFERENCES public.task_phases(id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_task_phases_order ON public.task_phases(order_index);
CREATE INDEX IF NOT EXISTS idx_task_phases_active ON public.task_phases(is_active);

-- 기존 업무들에 대해 기본 단계 설정
UPDATE public.tasks 
SET task_phase = (
  SELECT id 
  FROM public.task_phases 
  WHERE is_active = true 
  ORDER BY order_index ASC 
  LIMIT 1
)
WHERE task_phase IS NULL;

-- 코멘트 추가
COMMENT ON TABLE public.task_phases IS '업무 단계 관리 테이블';
COMMENT ON COLUMN public.tasks.task_phase IS '업무 단계 - task_phases 테이블의 id를 참조'; 