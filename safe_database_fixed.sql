-- Coilmaster 안전 데이터베이스 설치 스크립트
-- ON CONFLICT 오류 완전 방지 버전

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 기본 테이블 생성
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
    END IF;
END $$;

-- 직책 데이터
INSERT INTO public.positions (name, level)
SELECT '사원', 1
WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE name = '사원');

-- RLS 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON public.users FOR ALL TO authenticated USING (true);

SELECT '✅ 안전한 설치 완료!' as message; 