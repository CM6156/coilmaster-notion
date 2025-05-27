-- 다중 담당자 기능을 위한 데이터베이스 스키마 수정
-- Supabase 대시보드의 SQL 에디터에서 실행하세요

-- 1단계: 업무 담당자 관계 테이블 생성
CREATE TABLE IF NOT EXISTS public.task_assignees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  assigned_by UUID REFERENCES public.user_profiles(id),
  is_primary BOOLEAN DEFAULT false, -- 주 담당자 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(task_id, user_id) -- 같은 업무에 같은 사용자가 중복 할당되지 않도록
);

-- 2단계: 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON public.task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_primary ON public.task_assignees(task_id, is_primary);

-- 3단계: RLS (Row Level Security) 설정
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Allow task creators and assignees to manage assignees" ON public.task_assignees;
DROP POLICY IF EXISTS "Allow authenticated users to read task assignees" ON public.task_assignees;
DROP POLICY IF EXISTS "Allow authenticated users to insert task assignees" ON public.task_assignees;
DROP POLICY IF EXISTS "Allow assignees and creators to update task assignees" ON public.task_assignees;
DROP POLICY IF EXISTS "Allow assignees and creators to delete task assignees" ON public.task_assignees;

-- 4단계: RLS 정책 생성
-- 모든 인증된 사용자가 담당자 정보를 읽을 수 있음
CREATE POLICY "Allow authenticated users to read task assignees" 
ON public.task_assignees 
FOR SELECT 
TO authenticated 
USING (true);

-- 인증된 사용자가 담당자를 추가할 수 있음 (간단한 정책으로 수정)
CREATE POLICY "Allow authenticated users to insert task assignees" 
ON public.task_assignees 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 담당자 본인이나 업무 생성자가 담당자를 수정/삭제할 수 있음
CREATE POLICY "Allow assignees and creators to update task assignees" 
ON public.task_assignees 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = user_id OR auth.uid() = assigned_by
);

CREATE POLICY "Allow assignees and creators to delete task assignees" 
ON public.task_assignees 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() = user_id OR auth.uid() = assigned_by
);

-- 5단계: 기존 업무의 담당자를 새 테이블로 마이그레이션
-- 기존 assigned_to 필드의 데이터를 task_assignees 테이블로 이동
-- user_profiles 테이블에 존재하는 사용자만 마이그레이션
INSERT INTO public.task_assignees (task_id, user_id, is_primary, assigned_by)
SELECT 
  t.id as task_id,
  t.assigned_to::uuid as user_id,
  true as is_primary, -- 기존 담당자는 주 담당자로 설정
  t.assigned_to::uuid as assigned_by -- 자기 자신이 할당한 것으로 설정
FROM public.tasks t
INNER JOIN public.user_profiles up ON t.assigned_to::uuid = up.id -- user_profiles에 존재하는 사용자만
WHERE t.assigned_to IS NOT NULL 
  -- UUID 형식인지 확인 (텍스트로 변환 후 길이 확인)
  AND LENGTH(t.assigned_to::text) = 36
  AND t.assigned_to::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
ON CONFLICT (task_id, user_id) DO NOTHING;

-- 6단계: 업무 담당자 조회를 위한 뷰 생성
CREATE OR REPLACE VIEW public.tasks_with_assignees AS
SELECT 
  t.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', ta.id,
        'user_id', ta.user_id,
        'user_name', up.name,
        'user_email', up.email,
        'user_department', up.department,
        'is_primary', ta.is_primary,
        'assigned_at', ta.assigned_at
      ) ORDER BY ta.is_primary DESC, ta.assigned_at ASC
    ) FILTER (WHERE ta.user_id IS NOT NULL),
    '[]'::json
  ) as assignees,
  -- 주 담당자 정보 (하위 호환성을 위해)
  primary_assignee.user_id as primary_assignee_id,
  primary_assignee.name as primary_assignee_name
FROM public.tasks t
LEFT JOIN public.task_assignees ta ON t.id = ta.task_id
LEFT JOIN public.user_profiles up ON ta.user_id = up.id
LEFT JOIN (
  SELECT DISTINCT ON (ta2.task_id) 
    ta2.task_id, 
    ta2.user_id, 
    up2.name
  FROM public.task_assignees ta2
  JOIN public.user_profiles up2 ON ta2.user_id = up2.id
  WHERE ta2.is_primary = true
  ORDER BY ta2.task_id, ta2.assigned_at ASC
) primary_assignee ON t.id = primary_assignee.task_id
GROUP BY t.id, primary_assignee.user_id, primary_assignee.name;

-- 7단계: 담당자 수 계산을 위한 함수 생성
CREATE OR REPLACE FUNCTION public.get_task_assignee_count(task_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.task_assignees 
    WHERE task_id = task_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8단계: 주 담당자 설정 함수 생성
CREATE OR REPLACE FUNCTION public.set_primary_assignee(task_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 기존 주 담당자 해제
  UPDATE public.task_assignees 
  SET is_primary = false 
  WHERE task_id = task_uuid;
  
  -- 새 주 담당자 설정
  UPDATE public.task_assignees 
  SET is_primary = true 
  WHERE task_id = task_uuid AND user_id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9단계: 코멘트 추가
COMMENT ON TABLE public.task_assignees IS '업무 다중 담당자 관리 테이블';
COMMENT ON COLUMN public.task_assignees.is_primary IS '주 담당자 여부 (업무당 1명만 가능)';
COMMENT ON VIEW public.tasks_with_assignees IS '업무와 담당자 정보를 조인한 뷰';

-- 10단계: 확인 쿼리
SELECT 'task_assignees 테이블 생성 완료' as status, COUNT(*) as assignee_count FROM public.task_assignees;
SELECT 'tasks_with_assignees 뷰 생성 완료' as status, COUNT(*) as task_count FROM public.tasks_with_assignees; 