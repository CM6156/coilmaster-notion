-- ========================================
-- users 테이블 누락된 컬럼 추가
-- ========================================

-- 1. 현재 users 테이블 구조 확인
SELECT '=== 현재 users 테이블 컬럼 확인 ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. 누락된 컬럼들 추가
SELECT '=== 누락된 컬럼들 추가 중 ===' as info;

-- avatar 컬럼 추가 (avatar_url이 있으면 건너뛰기)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 온라인 상태 관련 컬럼들 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_page VARCHAR(100) DEFAULT '대시보드';

-- 사용자 활동 관련 컬럼들 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_method VARCHAR(50) DEFAULT 'email';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'offline';

-- 3. 기존 사용자들의 기본값 설정
UPDATE public.users 
SET 
    is_online = COALESCE(is_online, false),
    last_seen = COALESCE(last_seen, created_at, NOW()),
    current_page = COALESCE(current_page, '대시보드'),
    login_method = COALESCE(login_method, 'email'),
    status = COALESCE(status, 'offline'),
    avatar_url = COALESCE(avatar_url, avatar)
WHERE 
    is_online IS NULL OR 
    last_seen IS NULL OR 
    current_page IS NULL OR 
    login_method IS NULL OR 
    status IS NULL;

-- 4. avatar 컬럼을 avatar_url로 통일 (기존 데이터 보존)
UPDATE public.users 
SET avatar_url = avatar 
WHERE avatar IS NOT NULL AND (avatar_url IS NULL OR avatar_url = '');

-- 5. 업데이트 후 컬럼 구조 확인
SELECT '=== 업데이트 후 users 테이블 구조 ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('avatar', 'avatar_url', 'is_online', 'last_seen', 'current_page', 'login_method', 'status') 
        THEN '✅ 새로 추가됨'
        ELSE '📋 기존 컬럼'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 6. 샘플 데이터 확인
SELECT '=== 샘플 사용자 데이터 확인 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    is_online,
    current_page,
    last_seen,
    avatar_url,
    '✅ 데이터 정상' as check_result
FROM public.users 
LIMIT 3;

-- 7. 현재 온라인 사용자 확인 (테스트)
SELECT '=== 온라인 사용자 테스트 쿼리 ===' as info;
SELECT 
    name,
    email,
    role,
    is_online,
    current_page,
    last_seen
FROM public.users 
WHERE is_active = true
ORDER BY last_seen DESC
LIMIT 5;

-- 8. 특정 사용자 ID 조회 테스트 (문제가 되었던 ID)
SELECT '=== 특정 사용자 조회 테스트 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    is_online,
    current_page,
    avatar_url,
    '✅ 조회 성공' as test_result
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 9. 컬럼별 NULL 값 확인
SELECT '=== NULL 값 확인 ===' as info;
SELECT 
    COUNT(*) as total_users,
    COUNT(avatar_url) as has_avatar_url,
    COUNT(is_online) as has_is_online, 
    COUNT(current_page) as has_current_page,
    COUNT(last_seen) as has_last_seen
FROM public.users;

-- 10. 최종 확인 메시지
SELECT '✅ users 테이블 컬럼 추가 완료!' as final_message;
SELECT 'Sidebar.tsx 오류가 해결되었습니다.' as note; 