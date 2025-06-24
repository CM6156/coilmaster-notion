-- tasks 테이블의 외래키 제약 조건 수정
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- =============================================
-- 1. 현재 외래키 제약 조건 확인
-- =============================================
SELECT 
    '📋 현재 tasks 테이블의 외래키 제약 조건' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.tasks'::regclass
  AND contype = 'f'
  AND conname LIKE '%assigned_to%';

-- =============================================
-- 2. assigned_to 외래키 제약 조건 제거
-- =============================================
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- assigned_to 관련 외래키 제약 조건 찾기
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.tasks'::regclass
      AND contype = 'f'
      AND conname LIKE '%assigned_to%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.tasks DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE '✅ assigned_to 외래키 제약 조건 제거됨: %', constraint_name;
    ELSE
        RAISE NOTICE '⚠️ assigned_to 외래키 제약 조건이 없습니다';
    END IF;
END $$;

-- =============================================
-- 3. 현재 users와 managers 테이블의 ID 확인
-- =============================================
SELECT 
    '📋 Users 테이블의 ID 목록' as info,
    id,
    name,
    email
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

SELECT 
    '📋 Managers 테이블의 ID 목록' as info,
    id,
    name,
    email
FROM public.managers
ORDER BY created_at DESC
LIMIT 10;

-- =============================================
-- 4. 통합 담당자 뷰 생성 (선택사항)
-- =============================================
-- users와 managers를 통합한 뷰 생성
CREATE OR REPLACE VIEW public.all_assignees AS
SELECT 
    id,
    name,
    email,
    'user' as type
FROM public.users
WHERE email IS NOT NULL
UNION ALL
SELECT 
    id,
    name,
    email,
    'manager' as type
FROM public.managers
WHERE email IS NOT NULL;

COMMENT ON VIEW public.all_assignees IS '사용자와 담당자를 통합한 뷰';

-- =============================================
-- 5. 뷰 권한 설정
-- =============================================
GRANT SELECT ON public.all_assignees TO authenticated;
GRANT SELECT ON public.all_assignees TO anon;

-- =============================================
-- 6. 테스트: 담당자 할당 가능 여부 확인
-- =============================================
SELECT 
    '✅ 할당 가능한 담당자 수' as info,
    COUNT(*) as total_assignees,
    COUNT(CASE WHEN type = 'user' THEN 1 END) as users_count,
    COUNT(CASE WHEN type = 'manager' THEN 1 END) as managers_count
FROM public.all_assignees;

-- =============================================
-- 7. 수정된 테이블 구조 확인
-- =============================================
SELECT 
    '✅ 수정 후 tasks 테이블의 외래키 제약 조건' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.tasks'::regclass
  AND contype = 'f'
ORDER BY conname;

-- 완료 메시지
SELECT '✅ tasks 테이블의 assigned_to 외래키 제약 조건이 제거되었습니다!' as message; 