-- 사용자 부서 정보 업데이트 SQL
-- Supabase Dashboard → SQL Editor에서 실행

-- 1단계: 현재 사용자 정보 확인
SELECT 
    u.id,
    u.name,
    u.email,
    u.department_id,
    d.name as current_department,
    '🔍 현재 상태' as status
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
WHERE u.id = auth.uid();

-- 2단계: 사용 가능한 부서 목록 확인
SELECT 
    id,
    name,
    code,
    description,
    '📋 사용 가능한 부서' as status
FROM departments
ORDER BY name;

-- 3단계: 부서 업데이트 (원하는 부서 ID로 변경)
-- 아래에서 'YOUR_DEPARTMENT_ID'를 실제 부서 ID로 바꿔주세요
-- 예: 'c3b41c4b-4c05-413c-b4a1-4f5edcd2266c'

/*
UPDATE users 
SET 
    department_id = 'YOUR_DEPARTMENT_ID',
    updated_at = NOW()
WHERE id = auth.uid();
*/

-- 4단계: 업데이트 확인
SELECT 
    u.id,
    u.name,
    u.email,
    u.department_id,
    d.name as department_name,
    d.code as department_code,
    u.updated_at,
    '✅ 업데이트 완료' as status
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
WHERE u.id = auth.uid();

-- 5단계: 부서별 사용자 목록 확인
SELECT 
    d.name as department_name,
    COUNT(u.id) as user_count,
    STRING_AGG(u.name, ', ') as users
FROM departments d
LEFT JOIN users u ON d.id = u.department_id
GROUP BY d.id, d.name
ORDER BY d.name; 