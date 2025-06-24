-- =====================================================
-- work_journals 정책 디버깅
-- =====================================================

-- 1. 현재 모든 정책 조회
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'work_journals';

-- 2. RLS 상태 확인
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'work_journals';

-- 3. 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'work_journals' 
ORDER BY ordinal_position;

-- 4. 현재 인증 상태 (가능하다면)
SELECT 
    current_user,
    session_user;

-- 5. 문제가 되는 정책들을 개별적으로 삭제 시도
DROP POLICY IF EXISTS "Authenticated users can update own work journals" ON public.work_journals;
DROP POLICY IF EXISTS "Authenticated users can delete own work journals" ON public.work_journals;

-- 6. 남은 정책들 확인
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'work_journals'; 