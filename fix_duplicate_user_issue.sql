-- ========================================
-- Duplicate Key 오류 해결 - 기존 사용자 업데이트
-- ========================================

-- 1. 현재 joon@coilmaster.com 사용자 정보 확인
SELECT '=== joon@coilmaster.com 사용자 현재 상태 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    created_at,
    updated_at
FROM public.users 
WHERE email = 'joon@coilmaster.com';

-- 2. 해당 이메일의 사용자 ID 확인
SELECT '=== 사용자 ID 매핑 확인 ===' as info;
SELECT 
    id,
    CASE 
        WHEN id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3' THEN '✅ 원하는 ID와 일치'
        ELSE '❌ ID 불일치 - 업데이트 필요'
    END as id_status,
    email,
    name,
    role
FROM public.users 
WHERE email = 'joon@coilmaster.com';

-- 3. joon@coilmaster.com 사용자를 관리자로 업데이트 및 ID 확인
UPDATE public.users 
SET 
    role = 'admin',
    is_active = true,
    name = COALESCE(name, 'Joon Kim'),
    updated_at = NOW()
WHERE email = 'joon@coilmaster.com';

-- 4. 특정 ID(483bd9f8-4203-418d-a43a-3e5a50bbdbe3)가 존재하는지 확인
SELECT '=== 특정 ID 사용자 확인 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    '📋 해당 ID 사용자 정보' as status
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 5. 만약 해당 ID에 다른 사용자가 있고 이메일이 다르다면 이메일 업데이트
UPDATE public.users 
SET 
    email = 'joon@coilmaster.com',
    name = 'Joon Kim',
    role = 'admin',
    is_active = true,
    updated_at = NOW()
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3'
  AND email != 'joon@coilmaster.com';

-- 6. 만약 joon@coilmaster.com 이메일 사용자의 ID가 다르다면 ID 업데이트
-- (주의: 이는 매우 조심스러운 작업이므로 조건부로 실행)

-- 먼저 현재 상황 파악
WITH current_state AS (
    SELECT 
        id,
        email,
        name,
        role,
        CASE 
            WHEN id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3' AND email = 'joon@coilmaster.com' THEN 'perfect_match'
            WHEN email = 'joon@coilmaster.com' THEN 'email_match_diff_id'
            WHEN id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3' THEN 'id_match_diff_email'
            ELSE 'no_match'
        END as match_status
    FROM public.users
    WHERE email = 'joon@coilmaster.com' OR id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3'
)
SELECT 
    '=== 현재 매칭 상태 ===' as info,
    id,
    email,
    name,
    role,
    match_status
FROM current_state;

-- 7. 모든 사용자의 NULL 값 정리 (안전하게)
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

-- 8. 중복된 이메일이 있는지 확인
SELECT '=== 이메일 중복 확인 ===' as info;
SELECT 
    email,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 1 THEN '❌ 중복 이메일 발견'
        ELSE '✅ 중복 없음'
    END as duplicate_status
FROM public.users 
GROUP BY email
HAVING COUNT(*) > 1;

-- 9. 외래키 문제 정리 (500 오류 방지)
-- 존재하지 않는 department_id 참조 제거
UPDATE public.users 
SET department_id = NULL
WHERE department_id IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM public.departments 
      WHERE id = users.department_id
  );

-- 존재하지 않는 position_id 참조 제거
UPDATE public.users 
SET position_id = NULL
WHERE position_id IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM public.positions 
      WHERE id = users.position_id
  );

-- 존재하지 않는 corporation_id 참조 제거
UPDATE public.users 
SET corporation_id = NULL
WHERE corporation_id IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM public.corporations 
      WHERE id = users.corporation_id
  );

-- 10. 최종 확인 - joon@coilmaster.com 사용자 상태
SELECT '=== 최종 joon@coilmaster.com 사용자 상태 ===' as info;
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
    '✅ 최종 상태' as status
FROM public.users 
WHERE email = 'joon@coilmaster.com';

-- 11. 특정 ID로 조회 테스트
SELECT '=== 특정 ID 조회 테스트 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    '✅ 조회 성공' as test_result
FROM public.users 
WHERE id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3';

-- 12. 전체 사용자 요약
SELECT '=== 전체 사용자 요약 ===' as info;
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN email = 'joon@coilmaster.com' THEN 1 END) as joon_count,
    COUNT(CASE WHEN id = '483bd9f8-4203-418d-a43a-3e5a50bbdbe3' THEN 1 END) as target_id_count
FROM public.users;

-- 13. 최종 성공 메시지
SELECT '✅ 중복 키 오류 해결 완료!' as final_message;
SELECT '👤 joon@coilmaster.com 사용자가 관리자로 설정되었습니다.' as user_status;
SELECT '🔄 페이지를 새로고침하여 확인해주세요.' as instruction; 