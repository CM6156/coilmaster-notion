-- =====================================================
-- work_journals 테이블 RLS 정책 수정
-- =====================================================

-- 1. 현재 RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'work_journals';

-- 2. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can insert their own work journals" ON public.work_journals;
DROP POLICY IF EXISTS "Users can view their own work journals" ON public.work_journals;
DROP POLICY IF EXISTS "Users can update their own work journals" ON public.work_journals;
DROP POLICY IF EXISTS "Users can delete their own work journals" ON public.work_journals;

-- 3. 새로운 정책 생성

-- 인증된 사용자는 자신의 업무 일지를 생성할 수 있음
CREATE POLICY "Authenticated users can insert work journals" 
ON public.work_journals FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 인증된 사용자는 모든 업무 일지를 조회할 수 있음 (팀 협업을 위해)
CREATE POLICY "Authenticated users can view work journals" 
ON public.work_journals FOR SELECT 
USING (auth.role() = 'authenticated');

-- 인증된 사용자는 자신의 업무 일지를 수정할 수 있음
CREATE POLICY "Authenticated users can update own work journals" 
ON public.work_journals FOR UPDATE 
USING (auth.role() = 'authenticated' AND author_id = auth.uid()::text);

-- 인증된 사용자는 자신의 업무 일지를 삭제할 수 있음
CREATE POLICY "Authenticated users can delete own work journals" 
ON public.work_journals FOR DELETE 
USING (auth.role() = 'authenticated' AND author_id = auth.uid()::text);

-- 4. RLS 활성화 확인
ALTER TABLE public.work_journals ENABLE ROW LEVEL SECURITY;

-- 5. 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'work_journals';

-- 6. 테이블 정보 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'work_journals' 
ORDER BY ordinal_position; 