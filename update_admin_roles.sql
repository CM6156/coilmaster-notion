-- ========================================
-- 관리자 계정 역할 업데이트
-- ========================================

-- 1. 현재 joon@coilmaster.com 계정 정보 확인
SELECT '=== joon@coilmaster.com 계정 현재 상태 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    created_at,
    is_active
FROM public.users 
WHERE email = 'joon@coilmaster.com';

-- 2. 모든 사용자의 역할 현황 확인
SELECT '=== 전체 사용자 역할 현황 ===' as info;
SELECT 
    email,
    name,
    role,
    CASE 
        WHEN role = 'admin' THEN '👑 관리자'
        WHEN role = 'manager' THEN '👔 매니저'
        WHEN role = 'user' THEN '👤 일반사용자'
        ELSE '❓ 미설정'
    END as role_display
FROM public.users 
ORDER BY 
    CASE role 
        WHEN 'admin' THEN 1 
        WHEN 'manager' THEN 2 
        WHEN 'user' THEN 3 
        ELSE 4 
    END,
    name;

-- 3. joon@coilmaster.com을 관리자로 업데이트
UPDATE public.users 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'joon@coilmaster.com';

-- 4. 기타 관리자 계정들도 함께 업데이트 (필요시)
-- admin@coilmaster.com이 있다면 관리자로 설정
UPDATE public.users 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'admin@coilmaster.com';

-- 5. 이메일에 'admin'이 포함된 계정들을 관리자로 설정
UPDATE public.users 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email LIKE '%admin%@coilmaster.com';

-- 6. 특정 관리자 계정들을 명시적으로 설정 (필요시 이메일 추가)
UPDATE public.users 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email IN (
    'joon@coilmaster.com',
    'admin@coilmaster.com',
    'ceo@coilmaster.com',
    'founder@coilmaster.com'
);

-- 7. 업데이트 결과 확인
SELECT '=== 업데이트 결과 확인 ===' as info;
SELECT 
    email,
    name,
    role,
    updated_at,
    CASE 
        WHEN role = 'admin' THEN '✅ 관리자로 업데이트됨'
        WHEN role = 'manager' THEN '👔 매니저'
        WHEN role = 'user' THEN '👤 일반사용자'
        ELSE '❓ 미설정'
    END as status
FROM public.users 
ORDER BY 
    CASE role 
        WHEN 'admin' THEN 1 
        WHEN 'manager' THEN 2 
        WHEN 'user' THEN 3 
        ELSE 4 
    END,
    name;

-- 8. 관리자 권한 확인 (관리자만 조회)
SELECT '=== 관리자 계정 목록 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    created_at,
    '👑 관리자 권한 확인됨' as admin_status
FROM public.users 
WHERE role = 'admin'
ORDER BY created_at;

-- 9. 최종 통계
SELECT '=== 역할별 사용자 통계 ===' as info;
SELECT 
    role,
    COUNT(*) as user_count,
    CASE role 
        WHEN 'admin' THEN '👑 관리자'
        WHEN 'manager' THEN '👔 매니저'
        WHEN 'user' THEN '👤 일반사용자'
        ELSE '❓ 기타'
    END as role_name
FROM public.users 
GROUP BY role
ORDER BY 
    CASE role 
        WHEN 'admin' THEN 1 
        WHEN 'manager' THEN 2 
        WHEN 'user' THEN 3 
        ELSE 4 
    END; 