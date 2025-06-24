-- ========================================
-- Coilmaster Corporate System - 최종 완성본 SQL 스키마
-- 모든 migration 파일 통합 버전 (에러 없는 완전한 버전)
-- ========================================

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 기본 마스터 테이블들
-- ========================================

-- 법인 테이블
CREATE TABLE IF NOT EXISTS public.corporations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    name_en VARCHAR(255),
    name_zh VARCHAR(255),
    name_th VARCHAR(255),
    translation_key VARCHAR(100) UNIQUE,
    code VARCHAR(50) UNIQUE,
    business_number VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 부서 테이블
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    name_zh VARCHAR(255),
    name_th VARCHAR(255),
    translation_key VARCHAR(100) UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    corporation_id UUID REFERENCES public.corporations(id) ON DELETE SET NULL,
    parent_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    manager_user_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 직책 테이블
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    name_zh VARCHAR(255),
    name_th VARCHAR(255),
    translation_key VARCHAR(100) UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    level INTEGER DEFAULT 1,
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar TEXT DEFAULT '',
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    corporation_id UUID REFERENCES public.corporations(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
    employee_number VARCHAR(50) UNIQUE,
    hire_date DATE,
    is_online BOOLEAN DEFAULT false,
    current_page TEXT DEFAULT '/',
    last_login TIMESTAMPTZ,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    login_method VARCHAR(50) DEFAULT 'email',
    language VARCHAR(5) DEFAULT 'ko' CHECK (language IN ('ko', 'en', 'zh', 'th')),
    timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    country VARCHAR(10) DEFAULT 'KR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 기본 법인 데이터 삽입
INSERT INTO public.corporations (name, name_en, name_zh, name_th, translation_key, code) VALUES
('코일마스터 코리아', 'Coilmaster Korea', '韩国线圈大师', 'คอยล์มาสเตอร์เกาหลี', 'corp.coilmaster_korea', 'CMK'),
('코일마스터 차이나', 'Coilmaster China', '中国线圈大师', 'คอยล์มาสเตอร์จีน', 'corp.coilmaster_china', 'CMC'),
('코일마스터 태국', 'Coilmaster Thailand', '泰国线圈大师', 'คอยล์มาสเตอร์ไทย', 'corp.coilmaster_thailand', 'CMT')
ON CONFLICT (name) DO NOTHING;

-- 기본 부서 데이터 삽입
INSERT INTO public.departments (name, name_en, name_zh, name_th, translation_key, code, corporation_id) 
SELECT 
    dept.name,
    dept.name_en,
    dept.name_zh,
    dept.name_th,
    dept.translation_key,
    dept.code,
    corp.id
FROM (VALUES
    ('경영', 'Management', '管理', 'การจัดการ', 'dept.management', 'MGT'),
    ('개발', 'Development', '开发', 'การพัฒนา', 'dept.development', 'DEV'),
    ('생산', 'Production', '生产', 'การผลิต', 'dept.production', 'PRD'),
    ('품질', 'Quality', '质量', 'คุณภาพ', 'dept.quality', 'QUA'),
    ('영업', 'Sales', '销售', 'การขาย', 'dept.sales', 'SAL')
) AS dept(name, name_en, name_zh, name_th, translation_key, code)
CROSS JOIN (SELECT id FROM public.corporations WHERE code = 'CMK' LIMIT 1) AS corp
ON CONFLICT (name) DO NOTHING;

-- 기본 직책 데이터 삽입
INSERT INTO public.positions (name, name_en, name_zh, name_th, translation_key, code, level) VALUES
('사원', 'Employee', '员工', 'พนักงาน', 'pos.employee', 'EMP', 1),
('대리', 'Assistant Manager', '副经理', 'ผู้ช่วยผู้จัดการ', 'pos.assistant_manager', 'AM', 3),
('과장', 'Manager', '经理', 'ผู้จัดการ', 'pos.manager', 'MGR', 4),
('부장', 'General Manager', '总经理', 'ผู้จัดการทั่วไป', 'pos.general_manager', 'GM', 6),
('대표', 'CEO', '首席执行官', 'ซีอีโอ', 'pos.ceo', 'CEO', 12)
ON CONFLICT (name) DO NOTHING;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_corporation_id ON public.departments(corporation_id);
CREATE INDEX IF NOT EXISTS idx_positions_level ON public.positions(level);

-- 기본 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책 (단순화)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_all_users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_departments" ON public.departments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_positions" ON public.positions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_corporations" ON public.corporations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 성공 메시지
SELECT '✅ Coilmaster 데이터베이스 스키마 생성 완료!' as message; 