-- ========================================
-- 기본 직책 데이터 삽입
-- ========================================

-- UUID 확장 활성화 (이미 있을 수 있음)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 기존 positions 테이블 확인 및 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    level INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 기본 직책 데이터 삽입 (중복 방지)
INSERT INTO public.positions (name, code, level, description) VALUES
('사원', 'staff', 1, '일반 사원'),
('주임', 'associate', 2, '주임급'),
('대리', 'assistant_manager', 3, '대리급'),
('과장', 'manager', 4, '과장급'),
('차장', 'deputy_manager', 5, '차장급'),
('부장', 'general_manager', 6, '부장급'),
('이사', 'director', 7, '이사급'),
('상무', 'executive_director', 8, '상무급'),
('전무', 'managing_director', 9, '전무급'),
('부사장', 'vice_president', 10, '부사장'),
('사장', 'president', 11, '사장'),
('회장', 'chairman', 12, '회장'),
('인턴', 'intern', 0, '인턴십'),
('계약직', 'contractor', 1, '계약직원'),
('프리랜서', 'freelancer', 1, '프리랜서')
ON CONFLICT (name) DO NOTHING;

-- 기본 부서 데이터도 함께 삽입 (부서가 없는 경우)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

INSERT INTO public.departments (name, code, description) VALUES
('개발팀', 'DEV', '소프트웨어 개발'),
('기획팀', 'PLAN', '사업 기획 및 전략'),
('영업팀', 'SALES', '영업 및 마케팅'),
('인사팀', 'HR', '인사 관리'),
('재무팀', 'FIN', '재무 및 회계'),
('운영팀', 'OPS', '운영 관리'),
('품질관리팀', 'QA', '품질 보증'),
('디자인팀', 'DESIGN', '디자인 및 UX'),
('마케팅팀', 'MKT', '마케팅 및 홍보'),
('총무팀', 'GA', '총무 및 관리')
ON CONFLICT (name) DO NOTHING;

-- 기본 법인 데이터도 함께 삽입 (법인이 없는 경우)  
CREATE TABLE IF NOT EXISTS public.corporations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

INSERT INTO public.corporations (name, code, description) VALUES
('본사', 'HQ', '본사 법인'),
('한국지사', 'KR', '한국 지사'),
('중국지사', 'CN', '중국 지사'),
('일본지사', 'JP', '일본 지사'),
('미국지사', 'US', '미국 지사'),
('유럽지사', 'EU', '유럽 지사'),
('동남아지사', 'SEA', '동남아시아 지사'),
('인도지사', 'IN', '인도 지사')
ON CONFLICT (name) DO NOTHING;

-- RLS 정책 확인 및 설정
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자에게 읽기 권한 부여
DROP POLICY IF EXISTS "Allow authenticated users to read positions" ON public.positions;
CREATE POLICY "Allow authenticated users to read positions" 
ON public.positions 
FOR SELECT
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to read departments" ON public.departments;
CREATE POLICY "Allow authenticated users to read departments" 
ON public.departments 
FOR SELECT
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to read corporations" ON public.corporations;
CREATE POLICY "Allow authenticated users to read corporations" 
ON public.corporations 
FOR SELECT
TO authenticated 
USING (true);

-- 관리자에게 모든 권한 부여 (user_profiles 테이블이 있는 경우)
DROP POLICY IF EXISTS "Allow admins full access to positions" ON public.positions;
CREATE POLICY "Allow admins full access to positions" 
ON public.positions 
FOR ALL
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        JOIN public.user_profiles ON auth.users.id = user_profiles.id
        WHERE auth.users.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Allow admins full access to departments" ON public.departments;
CREATE POLICY "Allow admins full access to departments" 
ON public.departments 
FOR ALL
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        JOIN public.user_profiles ON auth.users.id = user_profiles.id
        WHERE auth.users.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Allow admins full access to corporations" ON public.corporations;
CREATE POLICY "Allow admins full access to corporations" 
ON public.corporations 
FOR ALL
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        JOIN public.user_profiles ON auth.users.id = user_profiles.id
        WHERE auth.users.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- 결과 확인
SELECT '✅ 직책 데이터 삽입 완료!' as message;
SELECT '📋 등록된 직책:' as positions_title;
SELECT name, code, level FROM public.positions ORDER BY level, name;

SELECT '🏢 등록된 부서:' as departments_title;
SELECT name, code FROM public.departments ORDER BY name;

SELECT '🏛️ 등록된 법인:' as corporations_title;
SELECT name, code FROM public.corporations ORDER BY name; 