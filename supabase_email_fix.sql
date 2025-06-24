-- ========================================
-- Supabase 이메일 제한 문제 해결 스크립트
-- ========================================

-- 1. 사용자 직접 생성 (이메일 인증 없이)
INSERT INTO public.users (
    email, 
    name, 
    role, 
    is_active, 
    email_verified,
    department_id,
    position_id
) 
SELECT 
    'joon@coilmaster.com',
    'Joon',
    'admin',
    true,
    true,  -- 이메일 인증 완료로 설정
    dept.id,
    pos.id
FROM 
    (SELECT id FROM public.departments WHERE name = '경영' LIMIT 1) dept,
    (SELECT id FROM public.positions WHERE name = '대표' LIMIT 1) pos
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'joon@coilmaster.com'
);

-- 2. 추가 테스트 사용자들 생성
INSERT INTO public.users (email, name, role, is_active, email_verified) 
SELECT 'admin@coilmaster.com', 'Admin User', 'admin', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@coilmaster.com');

INSERT INTO public.users (email, name, role, is_active, email_verified) 
SELECT 'test@coilmaster.com', 'Test User', 'user', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'test@coilmaster.com');

-- 3. 사용자 확인
SELECT 
    email,
    name,
    role,
    is_active,
    email_verified,
    created_at
FROM public.users 
ORDER BY created_at DESC;

-- 완료 메시지
SELECT '✅ 사용자 직접 생성 완료! 이메일 인증 없이 로그인 가능합니다.' as message; 