-- ========================================
-- RLS 무한 재귀 오류 해결 - 정책 완전 재설정
-- ========================================

-- 1. 현재 RLS 정책 상태 확인
SELECT '=== 현재 users 테이블 RLS 정책 확인 ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 2. users 테이블의 모든 RLS 정책 삭제
SELECT '=== 기존 RLS 정책 삭제 시작 ===' as info;

-- 개별 정책들 삭제 (존재하는 경우에만)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read all users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to delete users" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- 3. RLS 일시적으로 비활성화 (정책 재설정을 위해)
SELECT '=== RLS 임시 비활성화 ===' as info;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. 사용자 데이터 직접 확인 (RLS 없이)
SELECT '=== RLS 없이 사용자 데이터 확인 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    '🔍 RLS 없이 조회' as status
FROM public.users 
WHERE email = 'joon@coilmaster.com' OR id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 5. 관리자 권한 확실히 설정
UPDATE public.users 
SET 
    role = 'admin',
    is_active = true,
    name = 'Joon Kim',
    updated_at = NOW()
WHERE email = 'joon@coilmaster.com';

-- 6. 특정 ID 사용자도 확인 및 업데이트
UPDATE public.users 
SET 
    role = 'admin',
    is_active = true,
    updated_at = NOW()
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 7. 업데이트 후 다시 확인
SELECT '=== 관리자 업데이트 후 확인 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    '✅ 업데이트 후' as status
FROM public.users 
WHERE email = 'joon@coilmaster.com' OR id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 8. RLS 다시 활성화
SELECT '=== RLS 재활성화 ===' as info;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 9. 매우 간단한 RLS 정책 생성 (무한 재귀 방지)
SELECT '=== 새로운 간단한 RLS 정책 생성 ===' as info;

-- 모든 인증된 사용자가 모든 사용자 정보를 읽을 수 있음
CREATE POLICY "authenticated_users_select_all" ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

-- 모든 인증된 사용자가 사용자를 생성할 수 있음
CREATE POLICY "authenticated_users_insert" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 모든 인증된 사용자가 사용자를 업데이트할 수 있음
CREATE POLICY "authenticated_users_update" ON public.users
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 모든 인증된 사용자가 사용자를 삭제할 수 있음
CREATE POLICY "authenticated_users_delete" ON public.users
    FOR DELETE
    TO authenticated
    USING (true);

-- 10. 새로운 정책 확인
SELECT '=== 새로운 RLS 정책 확인 ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    '✅ 새 정책' as status
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 11. 다른 테이블들의 RLS 정책도 간단히 설정
SELECT '=== 다른 테이블들의 RLS 정책 정리 ===' as info;

-- positions 테이블
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.positions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.positions;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.positions;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.positions;

CREATE POLICY "positions_all_authenticated" ON public.positions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- departments 테이블
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.departments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.departments;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.departments;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.departments;

CREATE POLICY "departments_all_authenticated" ON public.departments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- corporations 테이블
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.corporations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.corporations;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.corporations;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.corporations;

CREATE POLICY "corporations_all_authenticated" ON public.corporations
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 12. 사용자 테이블의 누락된 컬럼들 확인 및 기본값 설정
SELECT '=== 사용자 테이블 컬럼 확인 ===' as info;

-- 모든 사용자의 NULL 값들을 안전한 기본값으로 설정
UPDATE public.users 
SET 
    avatar = COALESCE(avatar, ''),
    is_online = COALESCE(is_online, false),
    current_page = COALESCE(current_page, '/'),
    last_login = COALESCE(last_login, created_at),
    department_id = CASE 
        WHEN department_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.departments WHERE id = users.department_id) 
        THEN department_id 
        ELSE NULL 
    END,
    position_id = CASE 
        WHEN position_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.positions WHERE id = users.position_id) 
        THEN position_id 
        ELSE NULL 
    END,
    corporation_id = CASE 
        WHEN corporation_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.corporations WHERE id = users.corporation_id) 
        THEN corporation_id 
        ELSE NULL 
    END;

-- 13. 최종 테스트 - 특정 사용자 조회
SELECT '=== 최종 테스트 - 특정 사용자 조회 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    avatar,
    is_online,
    current_page,
    department_id,
    position_id,
    corporation_id,
    '🎯 최종 테스트' as test_status
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 14. 전체 사용자 요약
SELECT '=== 전체 사용자 현황 ===' as info;
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
    COUNT(CASE WHEN email = 'joon@coilmaster.com' THEN 1 END) as joon_users
FROM public.users;

-- 15. 성공 메시지
SELECT '✅ RLS 무한 재귀 문제 해결 완료!' as final_message;
SELECT '🔒 새로운 간단한 RLS 정책이 적용되었습니다.' as rls_status;
SELECT '👤 관리자 계정이 올바르게 설정되었습니다.' as admin_status;
SELECT '🔄 애플리케이션을 새로고침하여 확인해주세요.' as instruction; 