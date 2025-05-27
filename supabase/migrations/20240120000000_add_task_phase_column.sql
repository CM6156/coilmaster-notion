-- tasks 테이블에 task_phase 컬럼 추가
-- 업무 단계를 저장하기 위한 컬럼

-- task_phase 컬럼 추가 (task_phases 테이블의 id를 참조)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_phase UUID REFERENCES public.task_phases(id);

-- 인덱스 추가 (성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_tasks_task_phase ON public.tasks(task_phase);

-- 코멘트 추가
COMMENT ON COLUMN public.tasks.task_phase IS '업무 단계 - task_phases 테이블의 id를 참조';

-- 기존 업무들에 대해 기본 단계 설정 (선택사항)
-- 첫 번째 활성화된 단계를 기본값으로 설정
UPDATE public.tasks 
SET task_phase = (
  SELECT id 
  FROM public.task_phases 
  WHERE is_active = true 
  ORDER BY order_index ASC 
  LIMIT 1
)
WHERE task_phase IS NULL; 