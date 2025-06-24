-- =====================================================
-- 최종 RLS 비활성화 (UUID 타입 호환)
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

-- 3. work_journals 테이블의 컬럼 타입 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'work_journals' 
AND column_name IN ('user_id', 'author_id')
ORDER BY column_name;

-- 4. RLS 상태 확인
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

-- 5. 남아있는 정책 확인 (0이어야 함)
SELECT COUNT(*) as remaining_policies
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'work_journals';

-- 6. 실제 사용자 ID 가져오기
DO $$
DECLARE
    test_user_id UUID;
    test_author_id UUID;
BEGIN
    -- 실제 사용자 ID 가져오기
    SELECT id INTO test_user_id FROM users LIMIT 1;
    SELECT id INTO test_author_id FROM users LIMIT 1;
    
    -- 사용자가 없는 경우 테스트 사용자 생성
    IF test_user_id IS NULL THEN
        INSERT INTO users (id, email, name, role)
        VALUES (gen_random_uuid(), 'test@example.com', 'Test User', 'user')
        RETURNING id INTO test_user_id;
        
        test_author_id := test_user_id;
    END IF;

    -- 7. 테스트 삽입 (실제 사용자 ID 사용)
    INSERT INTO public.work_journals (
        title, 
        content, 
        date, 
        user_id, 
        author_id, 
        author_name, 
        status
    ) VALUES (
        'RLS Test Success',
        'Testing after properly disabling RLS',
        CURRENT_DATE,
        test_user_id,
        test_author_id,
        'Test User',
        'published'
    );
END $$;

-- 8. 성공 확인
SELECT 
    'work_journals RLS 완전히 비활성화됨! 업무 일지 저장 가능!' as result,
    COUNT(*) as test_entries_created
FROM work_journals 
WHERE title = 'RLS Test Success'; 