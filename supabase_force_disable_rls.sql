-- =====================================================
-- 강제 RLS 비활성화 (모든 정책 삭제)
-- =====================================================

-- 1. 모든 기존 정책을 강제로 삭제
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'work_journals'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.work_journals';
    END LOOP;
END $$;

-- 2. RLS 완전히 비활성화
ALTER TABLE public.work_journals DISABLE ROW LEVEL SECURITY;

-- 3. 확인
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity = false THEN 'RLS 비활성화됨 ✓'
        ELSE 'RLS 여전히 활성화됨 ✗'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'work_journals';

-- 4. 남아있는 정책 확인 (비어있어야 함)
SELECT COUNT(*) as remaining_policies
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'work_journals';

-- 5. 테스트 삽입
INSERT INTO public.work_journals (
    title, 
    content, 
    date, 
    user_id, 
    author_id, 
    author_name, 
    status
) VALUES (
    'RLS Test',
    'Testing after disabling RLS',
    CURRENT_DATE,
    'test-user-1',
    'test-author-1',
    'Test User',
    'completed'
);

SELECT 'RLS 비활성화 성공! 업무 일지 저장이 가능합니다.' as result; 