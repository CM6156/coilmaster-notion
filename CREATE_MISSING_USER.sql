-- 누락된 사용자 생성 SQL 스크립트
-- Supabase Dashboard → SQL Editor에서 실행

-- 1단계: 현재 인증된 사용자 확인
SELECT 
    auth.uid() as "현재_사용자_ID",
    auth.jwt() ->> 'email' as "이메일",
    auth.jwt() ->> 'name' as "이름";

-- 2단계: users 테이블에 해당 사용자가 있는지 확인
SELECT 
    id, 
    name, 
    email, 
    created_at 
FROM users 
WHERE id = auth.uid();

-- 3단계: 사용자가 없다면 생성 (현재 인증된 사용자 기준)
INSERT INTO public.users (
    id,
    name,
    email,
    role,
    is_active,
    login_method,
    created_at,
    updated_at
)
SELECT 
    auth.uid(),
    COALESCE(
        auth.jwt() ->> 'name', 
        SPLIT_PART(auth.jwt() ->> 'email', '@', 1),
        '사용자'
    ) as name,
    auth.jwt() ->> 'email' as email,
    'user' as role,
    true as is_active,
    'email' as login_method,
    NOW() as created_at,
    NOW() as updated_at
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid()
);

-- 4단계: 생성 확인
SELECT 
    id, 
    name, 
    email, 
    role,
    created_at,
    '✅ 사용자 생성 완료!' as status
FROM users 
WHERE id = auth.uid(); 