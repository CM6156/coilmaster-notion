-- ========================================
-- 사용자 관리 테이블 구조 확인 및 수정
-- ========================================

-- 1. 기존 테이블들 구조 확인
SELECT '=== 테이블 존재 여부 확인 ===' as info;

SELECT 
    'users' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) as exists;

SELECT 
    'departments' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'departments'
    ) as exists;

SELECT 
    'positions' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'positions'
    ) as exists;

SELECT 
    'corporations' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'corporations'
    ) as exists;

-- 2. users 테이블 구조 확인
SELECT '=== users 테이블 구조 ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. 외래키 제약 조건 확인
SELECT '=== 외래키 제약 조건 ===' as info;
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'users';

-- 4. UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 5. corporations 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS public.corporations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(name),
    UNIQUE(code)
);

-- 기본 법인 데이터 삽입
INSERT INTO public.corporations (name, code, description) VALUES
('본사', 'HQ', '본사 법인'),
('한국지사', 'KR', '한국 지사'),
('중국지사', 'CN', '중국 지사'),
('태국지사', 'TH', '태국 지사')
ON CONFLICT (name) DO NOTHING;

-- 6. users 테이블 재생성 (올바른 구조로)
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    department_id UUID REFERENCES public.departments(id),
    position_id UUID REFERENCES public.positions(id),
    corporation_id UUID REFERENCES public.corporations(id),
    country VARCHAR(10),
    avatar_url TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. RLS 정책 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_all" 
ON public.users 
FOR SELECT 
USING (true);

CREATE POLICY "users_authenticated_all" 
ON public.users 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 8. corporations 테이블 RLS 설정
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corporations_read_all" 
ON public.corporations 
FOR SELECT 
USING (true);

CREATE POLICY "corporations_authenticated_all" 
ON public.corporations 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 9. user_manager_sync_status 테이블 생성 (UserManagement.tsx에서 필요)
CREATE TABLE IF NOT EXISTS public.user_manager_sync_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    manager_id UUID,
    sync_status VARCHAR(50) DEFAULT 'pending',
    last_sync TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_email)
);

-- RLS 설정
ALTER TABLE public.user_manager_sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync_status_read_all" 
ON public.user_manager_sync_status 
FOR SELECT 
USING (true);

CREATE POLICY "sync_status_authenticated_all" 
ON public.user_manager_sync_status 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 10. 기본 사용자 데이터 삽입 (테스트용)
INSERT INTO public.users (name, email, role, country) VALUES
('관리자', 'admin@coilmaster.com', 'admin', 'KR'),
('테스트 사용자', 'test@coilmaster.com', 'user', 'KR')
ON CONFLICT (email) DO NOTHING;

-- 11. 최종 확인
SELECT '✅ 사용자 관리 테이블 설정 완료!' as message;

SELECT '📋 users 테이블 데이터:' as users_label;
SELECT COUNT(*) as users_count FROM public.users;
SELECT id, name, email, role FROM public.users LIMIT 5;

SELECT '🏢 corporations 테이블 데이터:' as corporations_label;
SELECT COUNT(*) as corporations_count FROM public.corporations;
SELECT name, code FROM public.corporations;

SELECT '🔄 sync_status 테이블 생성 확인:' as sync_label;
SELECT COUNT(*) as sync_count FROM public.user_manager_sync_status;

-- 12. JOIN 쿼리 테스트
SELECT '🔍 JOIN 쿼리 테스트:' as test_label;
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    d.name as department_name,
    p.name as position_name,
    c.name as corporation_name
FROM public.users u
LEFT JOIN public.departments d ON u.department_id = d.id
LEFT JOIN public.positions p ON u.position_id = p.id  
LEFT JOIN public.corporations c ON u.corporation_id = c.id
LIMIT 3; 