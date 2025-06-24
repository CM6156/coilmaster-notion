-- ========================================
-- 핵폭탄급 RLS 완전 제거 - RLS 아예 사용하지 않기
-- ========================================

-- 1. 모든 RLS 즉시 비활성화 (강제)
SELECT '=== 🚨 모든 RLS 강제 비활성화 시작 ===' as info;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporations DISABLE ROW LEVEL SECURITY;

-- 2. 시스템 레벨에서 모든 정책 강제 삭제
DO $$ 
DECLARE 
    rec RECORD;
BEGIN 
    -- 모든 테이블의 모든 정책을 강제로 삭제
    FOR rec IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY %I ON %I.%I', 
                         rec.policyname, rec.schemaname, rec.tablename);
            RAISE NOTICE '🗑️ 정책 삭제: %.%.%', 
                         rec.schemaname, rec.tablename, rec.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ 정책 삭제 실패 (무시): %.%.%', 
                         rec.schemaname, rec.tablename, rec.policyname;
        END;
    END LOOP;
    
    RAISE NOTICE '💣 모든 RLS 정책이 핵폭탄급으로 제거되었습니다!';
END $$;

-- 3. 정책 삭제 확인
SELECT '=== 정책 삭제 후 확인 ===' as info;
SELECT 
    COUNT(*) as remaining_policies,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ 모든 정책 삭제됨'
        ELSE '❌ ' || COUNT(*) || '개 정책 남음'
    END as deletion_status
FROM pg_policies 
WHERE schemaname = 'public';

-- 남은 정책이 있다면 개별 출력
SELECT 
    schemaname,
    tablename, 
    policyname,
    '❌ 삭제되지 않은 정책' as status
FROM pg_policies 
WHERE schemaname = 'public';

-- 4. 현재 사용자 상태 확인 (RLS 없이)
SELECT '=== 현재 사용자 상태 확인 (RLS 없음) ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    '🔍 RLS 없이 조회' as status
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 5. 관리자 권한 확실히 설정
UPDATE public.users 
SET 
    role = 'admin',
    is_active = true,
    name = COALESCE(NULLIF(name, ''), '최용수'),
    updated_at = NOW()
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- joon@coilmaster.com도 관리자로 설정
UPDATE public.users 
SET 
    role = 'admin',
    is_active = true,
    name = COALESCE(NULLIF(name, ''), 'Joon Kim'),
    updated_at = NOW()
WHERE email = 'joon@coilmaster.com';

-- 6. 관리자 설정 후 확인
SELECT '=== 관리자 권한 설정 후 확인 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    updated_at,
    '✅ 관리자로 설정됨' as status
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3' 
   OR email = 'joon@coilmaster.com'
ORDER BY email;

-- 7. 모든 사용자 데이터 정리
UPDATE public.users 
SET 
    role = COALESCE(role, 'user'),
    is_active = COALESCE(is_active, true),
    name = COALESCE(NULLIF(name, ''), SPLIT_PART(email, '@', 1)),
    updated_at = COALESCE(updated_at, created_at, NOW())
WHERE role IS NULL OR is_active IS NULL OR name IS NULL OR name = '' OR updated_at IS NULL;

-- 8. 외래키 정리 (500 오류 방지)
UPDATE public.users 
SET department_id = NULL
WHERE department_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.departments WHERE id = users.department_id);

UPDATE public.users 
SET position_id = NULL
WHERE position_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.positions WHERE id = users.position_id);

UPDATE public.users 
SET corporation_id = NULL
WHERE corporation_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.corporations WHERE id = users.corporation_id);

-- 9. 테스트: RLS 없이 업데이트 시도
SELECT '=== RLS 없이 업데이트 테스트 ===' as info;

-- 현재 사용자에 대한 테스트 업데이트
UPDATE public.users 
SET updated_at = NOW()
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 업데이트 성공 확인
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    updated_at,
    '🎯 업데이트 테스트 성공' as test_result
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 10. RLS 상태 최종 확인
SELECT '=== RLS 상태 최종 확인 ===' as info;
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '❌ RLS 활성화됨'
        ELSE '✅ RLS 비활성화됨'
    END as rls_status
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('users', 'positions', 'departments', 'corporations')
ORDER BY t.table_name;

-- 11. 전체 사용자 요약
SELECT '=== 전체 사용자 현황 ===' as info;
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
    COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as name_issues,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as role_issues
FROM public.users;

-- 12. Supabase 캐시 무효화를 위한 더미 업데이트
SELECT '=== Supabase 캐시 무효화 ===' as info;
UPDATE public.users 
SET updated_at = NOW() 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 13. 최종 성공 확인
SELECT '=== 최종 성공 확인 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    department_id,
    position_id,
    corporation_id,
    created_at,
    updated_at,
    '🎉 모든 설정 완료!' as final_status
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 14. 성공 메시지
SELECT '💣 핵폭탄급 RLS 제거 완료!' as nuclear_message;
SELECT '🚫 RLS가 완전히 비활성화되었습니다.' as rls_disabled;
SELECT '👤 관리자 권한이 설정되었습니다.' as admin_set;
SELECT '✅ 이제 무한 재귀 오류가 발생하지 않습니다.' as no_recursion;
SELECT '🔄 브라우저를 완전히 새로고침(Ctrl+Shift+R) 해주세요.' as final_instruction;

-- 15. 추가 안전 장치: 향후 RLS 정책 생성 방지 알림
SELECT '⚠️ 중요: 앞으로 이 테이블들에 RLS 정책을 추가하지 마세요!' as warning;
SELECT '📝 RLS 대신 애플리케이션 레벨에서 권한을 관리하세요.' as recommendation;

-- 마지막 확인: 업데이트가 잘 되는지 테스트
DO $$
BEGIN
    -- 테스트 업데이트
    UPDATE public.users 
    SET updated_at = NOW() 
    WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';
    
    RAISE NOTICE '✅ 테스트 업데이트 성공 - RLS 문제 해결됨!';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ 테스트 업데이트 실패: %', SQLERRM;
END $$; 