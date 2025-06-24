-- ========================================
-- 사용자 테이블 RLS 정책 수정 (406 오류 해결)
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

-- 2. 현재 RLS 설정 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 3. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "users_read_all" ON public.users;
DROP POLICY IF EXISTS "users_authenticated_all" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON public.users;
DROP POLICY IF EXISTS "Allow users to read own data" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own data" ON public.users;
DROP POLICY IF EXISTS "Allow admins full access to users" ON public.users;

-- 4. RLS 비활성화 후 재활성화 (깔끔하게 시작)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. 새로운 단순하고 안전한 RLS 정책 생성

-- 모든 인증된 사용자가 모든 사용자 정보를 읽을 수 있음
CREATE POLICY "users_select_policy" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (true);

-- 사용자가 자신의 정보를 업데이트할 수 있음
CREATE POLICY "users_update_own" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 관리자는 모든 작업 가능
CREATE POLICY "users_admin_all" 
ON public.users 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- 새 사용자 생성 (회원가입)
CREATE POLICY "users_insert_own" 
ON public.users 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 6. anon 사용자도 읽기 권한 부여 (회원가입 페이지용)
CREATE POLICY "users_public_read" 
ON public.users 
FOR SELECT 
TO anon 
USING (true);

-- 7. 테스트용 쿼리 (문제가 있는 사용자 ID로 테스트)
SELECT '=== RLS 정책 테스트 ===' as info;

-- 특정 사용자 ID로 조회 테스트
SELECT 
    id,
    name,
    email,
    role,
    '테스트 조회 성공' as test_result
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3'
LIMIT 1;

-- 전체 사용자 조회 테스트
SELECT 
    COUNT(*) as total_users,
    '전체 조회 성공' as test_result
FROM public.users;

-- 8. 최종 정책 확인
SELECT '=== 업데이트된 RLS 정책 확인 ===' as info;
SELECT 
    policyname,
    cmd,
    roles,
    '✅ 정책 활성화됨' as status
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- 9. RLS 활성화 상태 최종 확인
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS 활성화됨'
        ELSE '❌ RLS 비활성화됨'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public'; 