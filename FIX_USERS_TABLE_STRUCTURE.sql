-- users 테이블 구조 수정 - 프로필 시스템 최적화
-- Supabase Dashboard → SQL Editor에서 실행

-- 1단계: 현재 users 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2단계: password_hash 컬럼을 NULL 허용으로 변경
-- (Supabase Auth 사용 시 password는 auth.users에 저장되므로 불필요)
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN password_hash SET DEFAULT NULL;

-- 3단계: 프로필 시스템에 필요한 컬럼 추가 (없는 경우)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.positions(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS corporation_id UUID REFERENCES public.corporations(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_method VARCHAR(50) DEFAULT 'email';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'offline';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_page VARCHAR(100);

-- 4단계: 기본값 설정
UPDATE public.users 
SET 
    is_active = COALESCE(is_active, true),
    login_method = COALESCE(login_method, 'email'),
    status = COALESCE(status, 'offline'),
    role = COALESCE(role, 'user')
WHERE is_active IS NULL OR login_method IS NULL OR status IS NULL OR role IS NULL;

-- 5단계: 수정 완료 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'password_hash' AND is_nullable = 'YES' THEN '✅ 수정됨'
        WHEN column_name IN ('department_id', 'phone', 'is_active', 'login_method') THEN '✅ 프로필 컬럼'
        ELSE '📋 기존 컬럼'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 6단계: 테스트용 사용자 생성 (현재 인증된 사용자)
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

-- 7단계: 최종 확인
SELECT 
    id, 
    name, 
    email, 
    role,
    is_active,
    login_method,
    created_at,
    '🎉 사용자 생성 완료!' as result
FROM users 
WHERE id = auth.uid(); 