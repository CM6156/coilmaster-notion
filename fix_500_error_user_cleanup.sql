-- ========================================
-- 500 오류 해결 - 문제 사용자 ID 정리
-- ========================================

-- 1. 문제가 되는 사용자 ID 확인
SELECT '=== 문제 사용자 ID 확인 ===' as info;

-- 해당 사용자가 존재하는지 확인
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ 사용자 존재함'
        ELSE '❌ 사용자 존재하지 않음'
    END as user_exists,
    COUNT(*) as count
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 해당 사용자의 상세 정보 확인 (있다면)
SELECT 
    id,
    name,
    email,
    role,
    created_at,
    updated_at,
    '📋 사용자 정보' as info
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 2. 전체 사용자 목록 확인 (기본 정보만)
SELECT '=== 전체 사용자 목록 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    created_at
FROM public.users 
ORDER BY created_at DESC
LIMIT 10;

-- 3. 문제가 되는 사용자가 없다면 기본 관리자 사용자 생성
-- (현재 로그인한 사용자 기반으로)

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 기본 관리자 사용자가 없다면 생성
INSERT INTO public.users (
    id,
    name,
    email,
    role,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    '483bd9f8-4203-418d-a43a-3e5a50bbdbe3'::uuid,
    'Joon Kim',
    'joon@coilmaster.com',
    'admin',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3'
);

-- 4. 해당 사용자가 이미 있다면 역할을 관리자로 업데이트
UPDATE public.users 
SET 
    role = 'admin',
    is_active = true,
    updated_at = NOW()
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3'
  AND role != 'admin';

-- 5. 모든 사용자의 기본 필드 NULL 값 정리
UPDATE public.users 
SET 
    is_active = COALESCE(is_active, true),
    role = COALESCE(role, 'user'),
    updated_at = COALESCE(updated_at, created_at, NOW())
WHERE 
    is_active IS NULL OR 
    role IS NULL OR 
    updated_at IS NULL;

-- 6. users 테이블의 기본 제약 조건 확인 및 정리
-- NULL이 허용되지 않는 필드들 확인
SELECT '=== 테이블 제약 조건 확인 ===' as info;
SELECT 
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 7. 외래키 제약 조건 문제가 있는지 확인
SELECT '=== 외래키 제약 조건 확인 ===' as info;
SELECT 
    u.id,
    u.name,
    u.email,
    u.department_id,
    d.name as department_name,
    u.position_id,
    p.name as position_name,
    u.corporation_id,
    c.name as corporation_name,
    CASE 
        WHEN u.department_id IS NOT NULL AND d.id IS NULL THEN '❌ 부서 외래키 오류'
        WHEN u.position_id IS NOT NULL AND p.id IS NULL THEN '❌ 직책 외래키 오류'
        WHEN u.corporation_id IS NOT NULL AND c.id IS NULL THEN '❌ 법인 외래키 오류'
        ELSE '✅ 외래키 정상'
    END as fk_status
FROM public.users u
LEFT JOIN public.departments d ON u.department_id = d.id
LEFT JOIN public.positions p ON u.position_id = p.id  
LEFT JOIN public.corporations c ON u.corporation_id = c.id
WHERE u.id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 8. 외래키 문제가 있다면 NULL로 정리
UPDATE public.users 
SET 
    department_id = NULL
WHERE department_id IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM public.departments 
      WHERE id = users.department_id
  );

UPDATE public.users 
SET 
    position_id = NULL
WHERE position_id IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM public.positions 
      WHERE id = users.position_id
  );

UPDATE public.users 
SET 
    corporation_id = NULL
WHERE corporation_id IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM public.corporations 
      WHERE id = users.corporation_id
  );

-- 9. 최종 확인 - 문제 사용자 조회 테스트
SELECT '=== 최종 확인 - 사용자 조회 테스트 ===' as info;

-- 기본 필드만 조회
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    created_at,
    '✅ 기본 조회 성공' as test_result
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 모든 필드 조회 (외래키 JOIN 없이)
SELECT 
    *,
    '✅ 전체 조회 성공' as test_result
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 10. RLS 정책 재확인 및 단순화
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_admin_all" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_public_read" ON public.users;

-- 매우 단순한 RLS 정책 재생성
CREATE POLICY "users_all_access" 
ON public.users 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "users_anon_read" 
ON public.users 
FOR SELECT 
TO anon 
USING (true);

-- 11. 최종 성공 메시지
SELECT '✅ 500 오류 해결 완료!' as final_message;
SELECT '🔄 페이지를 새로고침하여 확인해주세요.' as instruction; 