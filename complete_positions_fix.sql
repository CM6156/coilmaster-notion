-- ========================================
-- 직책 관리 문제 완전 해결 SQL
-- ========================================

-- 1. UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 테이블 생성 (존재하지 않는 경우)
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    level INTEGER DEFAULT 1,
    description TEXT,
    translation_key VARCHAR(100),
    name_en VARCHAR(255),
    name_zh VARCHAR(255),
    name_th VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    translation_key VARCHAR(100),
    name_en VARCHAR(255),
    name_zh VARCHAR(255),
    name_th VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.corporations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. 기존 데이터 삭제 (테스트용)
DELETE FROM public.positions;
DELETE FROM public.departments; 
DELETE FROM public.corporations;

-- 4. 기본 직책 데이터 삽입
INSERT INTO public.positions (name, code, level, description, translation_key, name_en, name_zh, name_th) VALUES
('사원', 'staff', 1, '일반 사원', 'position_staff', 'Staff', '员工', 'พนักงาน'),
('주임', 'associate', 2, '주임급', 'position_associate', 'Associate', '主任', 'หัวหน้างาน'),
('대리', 'assistant_manager', 3, '대리급', 'position_assistant_manager', 'Assistant Manager', '代理', 'ผู้ช่วยผู้จัดการ'),
('과장', 'manager', 4, '과장급', 'position_manager', 'Manager', '经理', 'ผู้จัดการ'),
('차장', 'deputy_manager', 5, '차장급', 'position_deputy_manager', 'Deputy Manager', '副经理', 'รองผู้จัดการ'),
('부장', 'general_manager', 6, '부장급', 'position_general_manager', 'General Manager', '部长', 'ผู้จัดการทั่วไป'),
('이사', 'director', 7, '이사급', 'position_director', 'Director', '董事', 'ผู้อำนวยการ'),
('상무', 'executive_director', 8, '상무급', 'position_executive_director', 'Executive Director', '常务董事', 'ผู้อำนวยการบริหาร'),
('전무', 'managing_director', 9, '전무급', 'position_managing_director', 'Managing Director', '执行董事', 'กรรมการผู้จัดการ'),
('부사장', 'vice_president', 10, '부사장', 'position_vice_president', 'Vice President', '副总裁', 'รองประธาน'),
('사장', 'president', 11, '사장', 'position_president', 'President', '总裁', 'ประธาน'),
('회장', 'chairman', 12, '회장', 'position_chairman', 'Chairman', '董事长', 'ประธานกรรมการ'),
('인턴', 'intern', 0, '인턴십', 'position_intern', 'Intern', '实习生', 'นักศึกษาฝึกงาน'),
('계약직', 'contractor', 1, '계약직원', 'position_contractor', 'Contractor', '合同工', 'พนักงานสัญญาจ้าง'),
('프리랜서', 'freelancer', 1, '프리랜서', 'position_freelancer', 'Freelancer', '自由职业者', 'ฟรีแลนซ์');

-- 5. 기본 부서 데이터 삽입
INSERT INTO public.departments (name, code, description, translation_key, name_en, name_zh, name_th) VALUES
('개발팀', 'DEV', '소프트웨어 개발', 'department_development', 'Development', '开发部', 'ฝ่ายพัฒนา'),
('기획팀', 'PLAN', '사업 기획 및 전략', 'department_planning', 'Planning', '企划部', 'ฝ่ายวางแผน'),
('영업팀', 'SALES', '영업 및 마케팅', 'department_sales', 'Sales', '销售部', 'ฝ่ายขาย'),
('인사팀', 'HR', '인사 관리', 'department_hr', 'Human Resources', '人事部', 'ฝ่ายทรัพยากรบุคคล'),
('재무팀', 'FIN', '재무 및 회계', 'department_finance', 'Finance', '财务部', 'ฝ่ายการเงิน'),
('운영팀', 'OPS', '운영 관리', 'department_operations', 'Operations', '运营部', 'ฝ่ายปฏิบัติการ'),
('품질관리팀', 'QA', '품질 보증', 'department_qa', 'Quality Assurance', '质量保证部', 'ฝ่ายประกันคุณภาพ'),
('디자인팀', 'DESIGN', '디자인 및 UX', 'department_design', 'Design', '设计部', 'ฝ่ายออกแบบ'),
('마케팅팀', 'MKT', '마케팅 및 홍보', 'department_marketing', 'Marketing', '市场部', 'ฝ่ายการตลาด'),
('총무팀', 'GA', '총무 및 관리', 'department_administration', 'General Affairs', '总务部', 'ฝ่ายธุรการ');

-- 6. 기본 법인 데이터 삽입
INSERT INTO public.corporations (name, code, description) VALUES
('본사', 'HQ', '본사 법인'),
('한국지사', 'KR', '한국 지사'),
('중국지사', 'CN', '중국 지사'),
('일본지사', 'JP', '일본 지사'),
('미국지사', 'US', '미국 지사'),
('유럽지사', 'EU', '유럽 지사'),
('동남아지사', 'SEA', '동남아시아 지사'),
('인도지사', 'IN', '인도 지사');

-- 7. RLS 정책 설정 (모든 인증된 사용자에게 전체 권한)
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Allow authenticated users to read positions" ON public.positions;
DROP POLICY IF EXISTS "Allow admins full access to positions" ON public.positions;
DROP POLICY IF EXISTS "Enable all access for authenticated users on positions" ON public.positions;

DROP POLICY IF EXISTS "Allow authenticated users to read departments" ON public.departments;
DROP POLICY IF EXISTS "Allow admins full access to departments" ON public.departments;
DROP POLICY IF EXISTS "Enable all access for authenticated users on departments" ON public.departments;

DROP POLICY IF EXISTS "Allow authenticated users to read corporations" ON public.corporations;
DROP POLICY IF EXISTS "Allow admins full access to corporations" ON public.corporations;
DROP POLICY IF EXISTS "Enable all access for authenticated users on corporations" ON public.corporations;

-- 새로운 간단한 정책 생성
CREATE POLICY "Enable full access for authenticated users on positions" 
ON public.positions 
FOR ALL
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable full access for authenticated users on departments" 
ON public.departments 
FOR ALL
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable full access for authenticated users on corporations" 
ON public.corporations 
FOR ALL
TO authenticated 
USING (true)
WITH CHECK (true);

-- 8. 자동 번역키 설정 함수 및 트리거
CREATE OR REPLACE FUNCTION set_position_defaults()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.translation_key IS NULL THEN
        NEW.translation_key := 'position_' || LOWER(REPLACE(REPLACE(NEW.name, ' ', '_'), '/', '_'));
    END IF;
    
    IF NEW.name_en IS NULL THEN NEW.name_en := NEW.name; END IF;
    IF NEW.name_zh IS NULL THEN NEW.name_zh := NEW.name; END IF;
    IF NEW.name_th IS NULL THEN NEW.name_th := NEW.name; END IF;
    
    NEW.updated_at := TIMEZONE('utc', NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_department_defaults()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.translation_key IS NULL THEN
        NEW.translation_key := 'department_' || LOWER(REPLACE(REPLACE(NEW.name, ' ', '_'), '/', '_'));
    END IF;
    
    IF NEW.name_en IS NULL THEN NEW.name_en := NEW.name; END IF;
    IF NEW.name_zh IS NULL THEN NEW.name_zh := NEW.name; END IF;
    IF NEW.name_th IS NULL THEN NEW.name_th := NEW.name; END IF;
    
    NEW.updated_at := TIMEZONE('utc', NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS position_defaults_trigger ON public.positions;
CREATE TRIGGER position_defaults_trigger
    BEFORE INSERT OR UPDATE ON public.positions
    FOR EACH ROW
    EXECUTE FUNCTION set_position_defaults();

DROP TRIGGER IF EXISTS department_defaults_trigger ON public.departments;
CREATE TRIGGER department_defaults_trigger
    BEFORE INSERT OR UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION set_department_defaults();

-- 9. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_positions_level ON public.positions(level);
CREATE INDEX IF NOT EXISTS idx_positions_translation_key ON public.positions(translation_key);
CREATE INDEX IF NOT EXISTS idx_departments_translation_key ON public.departments(translation_key);

-- 10. 결과 확인
SELECT '🎉 직책 관리 문제 완전 해결 완료!' as message;

SELECT '📊 현재 상태 확인:' as status_check;
SELECT '📋 직책 목록 (' || COUNT(*) || '개):' as positions_count FROM public.positions;
SELECT name, code, level, translation_key FROM public.positions ORDER BY level, name;

SELECT '🏢 부서 목록 (' || COUNT(*) || '개):' as departments_count FROM public.departments;
SELECT name, code, translation_key FROM public.departments ORDER BY name;

SELECT '🏛️ 법인 목록 (' || COUNT(*) || '개):' as corporations_count FROM public.corporations;
SELECT name, code FROM public.corporations ORDER BY name;

-- 11. 권한 테스트 쿼리 (현재 사용자로 테스트)
SELECT '🔐 권한 테스트:' as permission_test;
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('positions', 'departments', 'corporations')
ORDER BY tablename, policyname; 