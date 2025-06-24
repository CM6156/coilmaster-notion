-- ========================================
-- 직책 테이블 디버그 및 기본 데이터 확인 (수정판)
-- ========================================

-- 1. positions 테이블 존재 여부 확인
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'positions'
) as table_exists;

-- 2. positions 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'positions'
ORDER BY ordinal_position;

-- 3. 현재 positions 테이블의 모든 데이터 확인
SELECT COUNT(*) as total_count FROM public.positions;
SELECT * FROM public.positions ORDER BY name;

-- 4. RLS 정책 상태 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'positions' AND schemaname = 'public';

-- 5. positions 테이블의 RLS 정책 목록 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'positions' AND schemaname = 'public';

-- 6. UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 7. positions 테이블 완전히 새로 생성 (기존 것 삭제하고)
DROP TABLE IF EXISTS public.positions CASCADE;

CREATE TABLE public.positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    level INTEGER DEFAULT 1,
    description TEXT,
    translation_key VARCHAR(100),
    name_en VARCHAR(255),
    name_zh VARCHAR(255),
    name_th VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(name),
    UNIQUE(code)
);

-- 8. 기본 직책 데이터 삽입
INSERT INTO public.positions (name, code, level, translation_key, name_en, name_zh, name_th, description) VALUES
('생산 직원', 'production_staff', 1, 'position_production_staff', 'Production Staff', '生产员工', 'พนักงานผลิต', '생산 담당 직원'),
('사우', 'sau', 2, 'position_sau', 'Staff', '员工', 'พนักงาน', '일반 사우'),
('사원', 'staff', 3, 'position_staff', 'Senior Staff', '高级员工', 'พนักงานอาวุโส', '일반 사원'),
('프로', 'pro', 4, 'position_pro', 'Professional', '专业人员', 'ผู้เชี่ยวชาญ', '전문가'),
('리더', 'leader', 5, 'position_leader', 'Leader', '领导', 'ผู้นำ', '팀 리더'),
('멘토', 'mentor', 6, 'position_mentor', 'Mentor', '导师', 'ที่ปรึกษา', '멘토'),
('법인장', 'md', 7, 'position_md', 'Managing Director', '董事总经理', 'กรรมการผู้จัดการ', '법인 대표'),
('대표', 'ceo', 8, 'position_ceo', 'CEO', '首席执行官', 'ซีอีโอ', '최고경영자'),
('창립자', 'founder', 9, 'position_founder', 'Founder', '创始人', 'ผู้ก่อตั้ง', '회사 창립자');

-- 9. RLS 정책 설정 (단순화)
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- 매우 단순한 정책: 모든 사용자에게 읽기 권한
CREATE POLICY "positions_read_all" 
ON public.positions 
FOR SELECT 
USING (true);

-- 인증된 사용자에게 모든 권한
CREATE POLICY "positions_authenticated_all" 
ON public.positions 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- anon 사용자(로그인하지 않은 사용자)에게도 읽기 권한 부여
CREATE POLICY "positions_anon_read" 
ON public.positions 
FOR SELECT 
TO anon 
USING (true);

-- 10. 부서 테이블도 함께 체크 및 생성
DROP TABLE IF EXISTS public.departments CASCADE;

CREATE TABLE public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    translation_key VARCHAR(100),
    name_en VARCHAR(255),
    name_zh VARCHAR(255),
    name_th VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(name),
    UNIQUE(code)
);

-- 11. 기본 부서 데이터 삽입
INSERT INTO public.departments (name, code, translation_key, name_en, name_zh, name_th, description) VALUES
('디지털 M', 'digital_m', 'department_digital_m', 'Digital M', '数字M部', 'ฝ่ายดิจิทัล M', '디지털 마케팅'),
('구매', 'purchasing', 'department_purchasing', 'Purchasing', '采购部', 'ฝ่ายจัดซื้อ', '구매 담당'),
('서버 관리', 'server_mgmt', 'department_server_management', 'Server Management', '服务器管理部', 'ฝ่ายจัดการเซิร์ฟเวอร์', '서버 운영'),
('경영', 'management', 'department_management', 'Management', '管理部', 'ฝ่ายบริหาร', '경영 관리'),
('전산', 'it', 'department_it', 'IT', 'IT部', 'ฝ่ายไอที', '전산 시스템'),
('개발', 'development', 'department_development', 'Development', '开发部', 'ฝ่ายพัฒนา', '소프트웨어 개발'),
('영업', 'sales', 'department_sales', 'Sales', '销售部', 'ฝ่ายขาย', '영업 마케팅'),
('품질', 'quality', 'department_quality', 'Quality', '质量部', 'ฝ่ายคุณภาพ', '품질 관리'),
('생산', 'production', 'department_production', 'Production', '生产部', 'ฝ่ายผลิต', '제품 생산'),
('관리', 'administration', 'department_administration', 'Administration', '管理部', 'ฝ่ายบริหาร', '일반 관리');

-- 12. 부서 테이블 RLS 설정
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_read_all" 
ON public.departments 
FOR SELECT 
USING (true);

CREATE POLICY "departments_authenticated_all" 
ON public.departments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "departments_anon_read" 
ON public.departments 
FOR SELECT 
TO anon 
USING (true);

-- 13. 최종 확인
SELECT '✅ 직책 및 부서 테이블 설정 완료!' as message;
SELECT '📋 직책 데이터:' as positions_label;
SELECT COUNT(*) as positions_count FROM public.positions;
SELECT name, code, level, translation_key, name_en FROM public.positions ORDER BY level;

SELECT '🏢 부서 데이터:' as departments_label;
SELECT COUNT(*) as departments_count FROM public.departments;
SELECT name, code, translation_key, name_en FROM public.departments ORDER BY name;

-- 14. 권한 테스트
SELECT 'RLS 권한 테스트:' as test_label;
SELECT name, translation_key FROM public.positions LIMIT 3;
SELECT name, translation_key FROM public.departments LIMIT 3; 