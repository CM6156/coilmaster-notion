-- ========================================
-- 존재하지 않는 컬럼 오류 해결 - 테이블 구조 확인 및 수정
-- ========================================

-- 1. users 테이블의 실제 컬럼 구조 확인
SELECT '=== users 테이블 실제 컬럼 구조 확인 ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    '📋 실제 컬럼' as status
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. RLS 임시 비활성화 (안전한 작업을 위해)
SELECT '=== RLS 임시 비활성화 ===' as info;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. 기존 RLS 정책들 삭제 (존재하는 경우만)
SELECT '=== 기존 RLS 정책 삭제 ===' as info;
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
DROP POLICY IF EXISTS "authenticated_users_select_all" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_insert" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_update" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_delete" ON public.users;

-- 4. 필요한 컬럼들을 안전하게 추가 (존재하지 않는 경우만)
SELECT '=== 필요한 컬럼들 추가 ===' as info;

-- avatar 컬럼 추가 (존재하지 않는 경우)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar TEXT DEFAULT '';
        RAISE NOTICE '✅ avatar 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE '📋 avatar 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- is_online 컬럼 추가 (존재하지 않는 경우)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_online' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_online BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ is_online 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE '📋 is_online 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- current_page 컬럼 추가 (존재하지 않는 경우)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'current_page' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN current_page TEXT DEFAULT '/';
        RAISE NOTICE '✅ current_page 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE '📋 current_page 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- last_login 컬럼 추가 (존재하지 않는 경우)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN last_login TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ last_login 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE '📋 last_login 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 5. 컬럼 추가 후 테이블 구조 다시 확인
SELECT '=== 컬럼 추가 후 테이블 구조 ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    '✅ 업데이트 후' as status
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. 현재 사용자 데이터 확인 (RLS 없이)
SELECT '=== 현재 사용자 데이터 확인 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    '🔍 RLS 없이 조회' as status
FROM public.users 
WHERE email = 'joon@coilmaster.com' OR id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 7. 관리자 권한 확실히 설정 (기본 컬럼만 사용)
UPDATE public.users 
SET 
    role = 'admin',
    is_active = true,
    name = 'Joon Kim',
    updated_at = NOW()
WHERE email = 'joon@coilmaster.com';

-- 특정 ID 사용자도 관리자로 설정
UPDATE public.users 
SET 
    role = 'admin',
    is_active = true,
    updated_at = NOW()
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 8. 이제 존재하는 컬럼들만 안전하게 업데이트
SELECT '=== 존재하는 컬럼들만 안전하게 업데이트 ===' as info;

-- 기본 필수 컬럼들만 업데이트
UPDATE public.users 
SET 
    is_active = COALESCE(is_active, true),
    role = COALESCE(role, 'user'),
    updated_at = COALESCE(updated_at, created_at, NOW()),
    name = COALESCE(name, SPLIT_PART(email, '@', 1))
WHERE 
    is_active IS NULL OR 
    role IS NULL OR 
    updated_at IS NULL OR
    name IS NULL OR
    name = '';

-- 새로 추가된 컬럼들 업데이트 (존재하는 경우만)
DO $$ 
BEGIN 
    -- avatar 컬럼이 존재하면 업데이트
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar' AND table_schema = 'public'
    ) THEN
        UPDATE public.users SET avatar = COALESCE(avatar, '') WHERE avatar IS NULL;
        RAISE NOTICE '✅ avatar 컬럼 업데이트 완료';
    END IF;
    
    -- is_online 컬럼이 존재하면 업데이트
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_online' AND table_schema = 'public'
    ) THEN
        UPDATE public.users SET is_online = COALESCE(is_online, false) WHERE is_online IS NULL;
        RAISE NOTICE '✅ is_online 컬럼 업데이트 완료';
    END IF;
    
    -- current_page 컬럼이 존재하면 업데이트
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'current_page' AND table_schema = 'public'
    ) THEN
        UPDATE public.users SET current_page = COALESCE(current_page, '/') WHERE current_page IS NULL;
        RAISE NOTICE '✅ current_page 컬럼 업데이트 완료';
    END IF;
    
    -- last_login 컬럼이 존재하면 업데이트
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login' AND table_schema = 'public'
    ) THEN
        UPDATE public.users SET last_login = COALESCE(last_login, created_at, NOW()) WHERE last_login IS NULL;
        RAISE NOTICE '✅ last_login 컬럼 업데이트 완료';
    END IF;
END $$;

-- 9. 외래키 참조 정리 (500 오류 방지)
UPDATE public.users 
SET department_id = NULL
WHERE department_id IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM public.departments 
      WHERE id = users.department_id
  );

UPDATE public.users 
SET position_id = NULL
WHERE position_id IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM public.positions 
      WHERE id = users.position_id
  );

UPDATE public.users 
SET corporation_id = NULL
WHERE corporation_id IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM public.corporations 
      WHERE id = users.corporation_id
  );

-- 10. RLS 다시 활성화
SELECT '=== RLS 재활성화 ===' as info;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 11. 새로운 간단한 RLS 정책 생성
SELECT '=== 새로운 간단한 RLS 정책 생성 ===' as info;

CREATE POLICY "authenticated_users_select_all" ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "authenticated_users_insert" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "authenticated_users_update" ON public.users
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "authenticated_users_delete" ON public.users
    FOR DELETE
    TO authenticated
    USING (true);

-- 12. 다른 테이블들의 RLS 정책도 간단히 설정
-- positions 테이블
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.positions;
DROP POLICY IF EXISTS "positions_all_authenticated" ON public.positions;
CREATE POLICY "positions_all_authenticated" ON public.positions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- departments 테이블
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.departments;
DROP POLICY IF EXISTS "departments_all_authenticated" ON public.departments;
CREATE POLICY "departments_all_authenticated" ON public.departments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- corporations 테이블
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.corporations;
DROP POLICY IF EXISTS "corporations_all_authenticated" ON public.corporations;
CREATE POLICY "corporations_all_authenticated" ON public.corporations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 13. 업데이트 후 확인
SELECT '=== 관리자 업데이트 후 확인 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    '✅ 최종 상태' as status
FROM public.users 
WHERE email = 'joon@coilmaster.com' OR id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 14. 최종 테스트 - 특정 사용자 조회
SELECT '=== 최종 테스트 - 특정 사용자 조회 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    department_id,
    position_id,
    corporation_id,
    '🎯 최종 테스트' as test_status
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 15. 성공 메시지
SELECT '✅ 컬럼 문제 해결 및 RLS 설정 완료!' as final_message;
SELECT '📋 필요한 컬럼들이 안전하게 추가되었습니다.' as column_status;
SELECT '🔒 새로운 RLS 정책이 적용되었습니다.' as rls_status;
SELECT '👤 관리자 계정이 올바르게 설정되었습니다.' as admin_status;
SELECT '🔄 애플리케이션을 새로고침하여 확인해주세요.' as instruction; 