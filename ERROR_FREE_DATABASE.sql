-- Coilmaster 완벽한 오류 방지 데이터베이스 스크립트

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 기본 테이블들
CREATE TABLE IF NOT EXISTS public.corporations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    corporation_id UUID REFERENCES public.corporations(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    department_id UUID REFERENCES public.departments(id),
    position_id UUID REFERENCES public.positions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시스템 설정 테이블 (정확한 컬럼 정의)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 안전한 데이터 삽입
INSERT INTO public.corporations (name, code) 
SELECT '코일마스터 코리아', 'CMK' 
WHERE NOT EXISTS (SELECT 1 FROM public.corporations WHERE name = '코일마스터 코리아');

-- 부서 데이터
DO $$
DECLARE
    corp_id UUID;
BEGIN
    SELECT id INTO corp_id FROM public.corporations WHERE code = 'CMK' LIMIT 1;
    
    IF corp_id IS NOT NULL THEN
        INSERT INTO public.departments (name, corporation_id)
        SELECT '경영', corp_id
        WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = '경영');
        
        INSERT INTO public.departments (name, corporation_id)
        SELECT '개발', corp_id
        WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = '개발');
    END IF;
END $$;

-- 직책 데이터
INSERT INTO public.positions (name, level)
SELECT '사원', 1
WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE name = '사원');

INSERT INTO public.positions (name, level)
SELECT '대표', 12
WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE name = '대표');

-- 시스템 설정 (정확한 컬럼만 사용)
INSERT INTO public.system_settings (key, value, description)
SELECT 'company_name', 'Coilmaster', '회사명'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'company_name');

INSERT INTO public.system_settings (key, value, description)
SELECT 'default_language', 'ko', '기본 언어'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'default_language');

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users(department_id);

-- RLS 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_users" ON public.users;
CREATE POLICY "allow_all_users" ON public.users FOR ALL TO authenticated USING (true);

SELECT '✅ 완벽한 오류 방지 설치 완료!' as message;