-- ========================================
-- 처음부터 깨끗한 데이터베이스 설정
-- ========================================

-- 1. 기존 테이블 존재 여부 확인
SELECT '=== 기존 테이블 상태 확인 ===' as info;

-- 2. 기존 RLS 정책 정리
DO $$ 
DECLARE 
    rec RECORD;
BEGIN 
    FOR rec IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY %I ON %I.%I', 
                         rec.policyname, rec.schemaname, rec.tablename);
        EXCEPTION WHEN OTHERS THEN
            -- 무시
        END;
    END LOOP;
END $$;

-- 3. 법인 테이블 생성
CREATE TABLE public.corporations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(100),
    name_zh VARCHAR(100), 
    name_th VARCHAR(100),
    translation_key VARCHAR(50) UNIQUE,
    code VARCHAR(20) UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 부서 테이블 생성
CREATE TABLE public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    name_zh VARCHAR(100),
    name_th VARCHAR(100),
    translation_key VARCHAR(50) UNIQUE,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    corporation_id UUID REFERENCES public.corporations(id),
    parent_department_id UUID REFERENCES public.departments(id),
    manager_user_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 직책 테이블 생성
CREATE TABLE public.positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    name_zh VARCHAR(100),
    name_th VARCHAR(100),
    translation_key VARCHAR(50) UNIQUE,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    level INTEGER DEFAULT 1,
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 사용자 테이블 생성
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar TEXT DEFAULT '',
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    corporation_id UUID REFERENCES public.corporations(id),
    department_id UUID REFERENCES public.departments(id),
    position_id UUID REFERENCES public.positions(id),
    employee_number VARCHAR(50) UNIQUE,
    hire_date DATE,
    is_online BOOLEAN DEFAULT false,
    current_page TEXT DEFAULT '/',
    last_login TIMESTAMPTZ,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    language VARCHAR(5) DEFAULT 'ko' CHECK (language IN ('ko', 'en', 'zh', 'th')),
    timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- 7. 인덱스 생성
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_department_id ON public.users(department_id);
CREATE INDEX idx_users_position_id ON public.users(position_id);
CREATE INDEX idx_users_corporation_id ON public.users(corporation_id);
CREATE INDEX idx_users_is_active ON public.users(is_active);

-- 8. 기본 법인 데이터
INSERT INTO public.corporations (name, name_en, name_zh, name_th, translation_key, code) VALUES
('코일마스터 코리아', 'Coilmaster Korea', '韩国线圈大师', 'คอยล์มาสเตอร์เกาหลี', 'corp.coilmaster_korea', 'CMK'),
('코일마스터 차이나', 'Coilmaster China', '中国线圈大师', 'คอยล์มาสเตอร์จีน', 'corp.coilmaster_china', 'CMC'),
('코일마스터 태국', 'Coilmaster Thailand', '泰国线圈大师', 'คอยล์มาสเตอร์ไทย', 'corp.coilmaster_thailand', 'CMT'),
('코일마스터 베트남', 'Coilmaster Vietnam', '越南线圈大师', 'คอยล์มาสเตอร์เวียดนาม', 'corp.coilmaster_vietnam', 'CMV'),
('코일마스터 USA', 'Coilmaster USA', '美国线圈大师', 'คอยล์มาสเตอร์อเมริกา', 'corp.coilmaster_usa', 'CMU'),
('코일마스터 유럽', 'Coilmaster Europe', '欧洲线圈大师', 'คอยล์มาสเตอร์ยุโรป', 'corp.coilmaster_europe', 'CME'),
('코일마스터 인도', 'Coilmaster India', '印度线圈大师', 'คอยล์มาสเตอร์อินเดีย', 'corp.coilmaster_india', 'CMI'),
('코일마스터 글로벌', 'Coilmaster Global', '全球线圈大师', 'คอยล์มาสเตอร์โกลบอล', 'corp.coilmaster_global', 'CMG');

-- 9. 기본 부서 데이터
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
    ('영업', 'Sales', '销售', 'การขาย', 'dept.sales', 'SAL'),
    ('구매', 'Purchasing', '采购', 'การจัดซื้อ', 'dept.purchasing', 'PUR'),
    ('전산', 'IT', '信息技术', 'เทคโนโลยีสารสนเทศ', 'dept.it', 'IT'),
    ('서버 관리', 'Server Management', '服务器管理', 'การจัดการเซิร์ฟเวอร์', 'dept.server_management', 'SRV'),
    ('디지털 M', 'Digital Marketing', '数字营销', 'การตลาดดิจิทัล', 'dept.digital_marketing', 'DM'),
    ('관리', 'Administration', '行政', 'การบริหาร', 'dept.administration', 'ADM')
) AS dept(name, name_en, name_zh, name_th, translation_key, code)
CROSS JOIN (SELECT id FROM public.corporations WHERE code = 'CMK' LIMIT 1) AS corp;

-- 10. 기본 직책 데이터
INSERT INTO public.positions (name, name_en, name_zh, name_th, translation_key, code, level) VALUES
('사원', 'Employee', '员工', 'พนักงาน', 'pos.employee', 'EMP', 1),
('주임', 'Supervisor', '主管', 'หัวหน้างาน', 'pos.supervisor', 'SUP', 2),
('대리', 'Assistant Manager', '副经理', 'ผู้ช่วยผู้จัดการ', 'pos.assistant_manager', 'AM', 3),
('과장', 'Manager', '经理', 'ผู้จัดการ', 'pos.manager', 'MGR', 4),
('차장', 'Deputy General Manager', '副总经理', 'รองผู้จัดการทั่วไป', 'pos.deputy_general_manager', 'DGM', 5),
('부장', 'General Manager', '总经理', 'ผู้จัดการทั่วไป', 'pos.general_manager', 'GM', 6),
('이사', 'Director', '董事', 'กรรมการ', 'pos.director', 'DIR', 7),
('상무', 'Executive Director', '执行董事', 'กรรมการผู้จัดการ', 'pos.executive_director', 'ED', 8),
('전무', 'Managing Director', '常务董事', 'กรรมการผู้จัดการใหญ่', 'pos.managing_director', 'MD', 9),
('부사장', 'Vice President', '副总裁', 'รองประธาน', 'pos.vice_president', 'VP', 10),
('사장', 'President', '总裁', 'ประธาน', 'pos.president', 'PRES', 11),
('대표', 'CEO', '首席执行官', 'ซีอีโอ', 'pos.ceo', 'CEO', 12),
('회장', 'Chairman', '董事长', 'ประธานกรรมการ', 'pos.chairman', 'CHAIR', 13),
('창립자', 'Founder', '创始人', 'ผู้ก่อตั้ง', 'pos.founder', 'FOUND', 14),
('명예회장', 'Honorary Chairman', '名誉董事长', 'ประธานกิตติมศักดิ์', 'pos.honorary_chairman', 'HON', 15),
('생산 직원', 'Production Worker', '生产工人', 'คนงานผลิต', 'pos.production_worker', 'PW', 1),
('사우', 'Partner', '合伙人', 'หุ้นส่วน', 'pos.partner', 'PART', 8),
('프로', 'Professional', '专业人员', 'ผู้เชี่ยวชาญ', 'pos.professional', 'PRO', 3),
('리더', 'Leader', '领导', 'ผู้นำ', 'pos.leader', 'LEAD', 4),
('멘토', 'Mentor', '导师', 'ที่ปรึกษา', 'pos.mentor', 'MENT', 5),
('법인장', 'Corporation Head', '法人代表', 'หัวหน้านิติบุคคล', 'pos.corporation_head', 'CH', 9);

-- 11. 관리자 계정 생성
INSERT INTO public.users (
    id, email, name, role, is_active,
    department_id, position_id, corporation_id,
    language, created_at, updated_at
) 
SELECT 
    '483bd9f8-4203-418d-a43a-3e5a50bbdbe3'::UUID,
    'joon@coilmaster.com',
    '최용수',
    'admin',
    true,
    d.id,
    p.id,
    c.id,
    'ko',
    NOW(),
    NOW()
FROM public.departments d, public.positions p, public.corporations c
WHERE d.translation_key = 'dept.management' 
  AND p.translation_key = 'pos.ceo'
  AND c.code = 'CMK'
LIMIT 1;

-- 12. 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. 최종 확인
SELECT '🎉 깨끗한 데이터베이스 설정 완료!' as message;
SELECT 
    '법인: ' || (SELECT COUNT(*) FROM public.corporations) ||
    '개, 부서: ' || (SELECT COUNT(*) FROM public.departments) ||
    '개, 직책: ' || (SELECT COUNT(*) FROM public.positions) ||
    '개, 사용자: ' || (SELECT COUNT(*) FROM public.users) || '명' as stats; 