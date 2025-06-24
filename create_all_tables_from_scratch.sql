-- ========================================
-- Supabase 전체 테이블 새로 생성 - 완전한 구조
-- ========================================

-- 1. 확장 기능 활성화 (UUID 생성용)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 법인(Corporations) 테이블 생성
CREATE TABLE corporations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- 3. 부서(Departments) 테이블 생성
CREATE TABLE departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    name_zh VARCHAR(100),
    name_th VARCHAR(100),
    translation_key VARCHAR(50) UNIQUE,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    corporation_id UUID REFERENCES corporations(id) ON DELETE SET NULL,
    parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_user_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 직책(Positions) 테이블 생성
CREATE TABLE positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- 5. 사용자(Users) 테이블 생성
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar TEXT DEFAULT '',
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    corporation_id UUID REFERENCES corporations(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
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
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 6. 사용자 세션(User Sessions) 테이블 생성
CREATE TABLE user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    current_page TEXT DEFAULT '/',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 7. 사용자 활동 로그(User Activity Logs) 테이블 생성
CREATE TABLE user_activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    page_url TEXT,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 알림(Notifications) 테이블 생성
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 시스템 설정(System Settings) 테이블 생성
CREATE TABLE system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 인덱스 생성 (성능 최적화)
-- Users 테이블 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_position_id ON users(position_id);
CREATE INDEX idx_users_corporation_id ON users(corporation_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_last_activity ON users(last_activity);

-- Departments 테이블 인덱스
CREATE INDEX idx_departments_corporation_id ON departments(corporation_id);
CREATE INDEX idx_departments_is_active ON departments(is_active);
CREATE INDEX idx_departments_translation_key ON departments(translation_key);

-- Positions 테이블 인덱스
CREATE INDEX idx_positions_is_active ON positions(is_active);
CREATE INDEX idx_positions_level ON positions(level);
CREATE INDEX idx_positions_translation_key ON positions(translation_key);

-- Sessions 테이블 인덱스
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Activity 로그 인덱스
CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at);

-- Notifications 인덱스
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- 11. 자동 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. 각 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_corporations_updated_at BEFORE UPDATE ON corporations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. 번역키 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_translation_key()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.translation_key IS NULL THEN
        NEW.translation_key := TG_TABLE_NAME || '.' || lower(regexp_replace(NEW.name, '[^a-zA-Z0-9가-힣]', '_', 'g'));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 14. 번역키 자동 생성 트리거 적용
CREATE TRIGGER auto_generate_translation_key_departments BEFORE INSERT ON departments
    FOR EACH ROW EXECUTE FUNCTION generate_translation_key();
CREATE TRIGGER auto_generate_translation_key_positions BEFORE INSERT ON positions
    FOR EACH ROW EXECUTE FUNCTION generate_translation_key();
CREATE TRIGGER auto_generate_translation_key_corporations BEFORE INSERT ON corporations
    FOR EACH ROW EXECUTE FUNCTION generate_translation_key();

-- 15. 기본 법인 데이터 삽입
INSERT INTO corporations (name, name_en, name_zh, name_th, translation_key, code) VALUES
('코일마스터 코리아', 'Coilmaster Korea', '韩国线圈大师', 'คอยล์มาสเตอร์เกาหลี', 'corp.coilmaster_korea', 'CMK'),
('코일마스터 차이나', 'Coilmaster China', '中国线圈大师', 'คอยล์มาสเตอร์จีน', 'corp.coilmaster_china', 'CMC'),
('코일마스터 태국', 'Coilmaster Thailand', '泰国线圈大师', 'คอยล์มาสเตอร์ไทย', 'corp.coilmaster_thailand', 'CMT'),
('코일마스터 베트남', 'Coilmaster Vietnam', '越南线圈大师', 'คอยล์มาสเตอร์เวียดนาม', 'corp.coilmaster_vietnam', 'CMV'),
('코일마스터 USA', 'Coilmaster USA', '美国线圈大师', 'คอยล์มาสเตอร์อเมริกา', 'corp.coilmaster_usa', 'CMU'),
('코일마스터 유럽', 'Coilmaster Europe', '欧洲线圈大师', 'คอยล์มาสเตอร์ยุโรป', 'corp.coilmaster_europe', 'CME'),
('코일마스터 인도', 'Coilmaster India', '印度线圈大师', 'คอยล์มาสเตอร์อินเดีย', 'corp.coilmaster_india', 'CMI'),
('코일마스터 글로벌', 'Coilmaster Global', '全球线圈大师', 'คอยล์มาสเตอร์โกลบอล', 'corp.coilmaster_global', 'CMG');

-- 16. 기본 부서 데이터 삽입
INSERT INTO departments (name, name_en, name_zh, name_th, translation_key, code, corporation_id) 
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
CROSS JOIN (SELECT id FROM corporations WHERE code = 'CMK' LIMIT 1) AS corp;

-- 17. 기본 직책 데이터 삽입
INSERT INTO positions (name, name_en, name_zh, name_th, translation_key, code, level) VALUES
-- 기본 시스템 직책
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
-- 현재 시스템에 등록된 추가 직책들
('생산 직원', 'Production Worker', '生产工人', 'คนงานผลิต', 'pos.production_worker', 'PW', 1),
('사우', 'Partner', '合伙人', 'หุ้นส่วน', 'pos.partner', 'PART', 8),
('프로', 'Professional', '专业人员', 'ผู้เชี่ยวชาญ', 'pos.professional', 'PRO', 3),
('리더', 'Leader', '领导', 'ผู้นำ', 'pos.leader', 'LEAD', 4),
('멘토', 'Mentor', '导师', 'ที่ปรึกษา', 'pos.mentor', 'MENT', 5),
('법인장', 'Corporation Head', '法人代表', 'หัวหน้านิติบุคคล', 'pos.corporation_head', 'CH', 9);

-- 18. 첫 번째 관리자 계정 생성 (현재 로그인 사용자)
INSERT INTO users (
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
FROM departments d, positions p, corporations c
WHERE d.translation_key = 'dept.management' 
  AND p.translation_key = 'pos.ceo'
  AND c.code = 'CMK'
LIMIT 1;

-- 19. 추가 관리자 계정 생성
INSERT INTO users (
    email, name, role, is_active,
    department_id, position_id, corporation_id,
    language, created_at, updated_at
) 
SELECT 
    'admin@coilmaster.com',
    'System Admin',
    'admin',
    true,
    d.id,
    p.id,
    c.id,
    'ko',
    NOW(),
    NOW()
FROM departments d, positions p, corporations c
WHERE d.translation_key = 'dept.it' 
  AND p.translation_key = 'pos.director'
  AND c.code = 'CMK'
LIMIT 1
ON CONFLICT (email) DO NOTHING;

-- 20. 시스템 설정 기본값 삽입
INSERT INTO system_settings (key, value, description, data_type, is_public) VALUES
('company_name', '코일마스터', '회사명', 'string', true),
('default_language', 'ko', '기본 언어', 'string', true),
('session_timeout', '1440', '세션 타임아웃 (분)', 'number', false),
('max_login_attempts', '5', '최대 로그인 시도 횟수', 'number', false),
('password_min_length', '8', '최소 비밀번호 길이', 'number', false),
('enable_notifications', 'true', '알림 활성화', 'boolean', true);

-- 21. 테이블 권한 설정 (Supabase Auth 사용자용)
-- 모든 인증된 사용자가 읽기 가능
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- 특정 테이블에 대한 쓰기 권한
GRANT INSERT, UPDATE ON users TO authenticated;
GRANT INSERT, UPDATE ON user_sessions TO authenticated;
GRANT INSERT ON user_activity_logs TO authenticated;
GRANT UPDATE ON notifications TO authenticated;

-- 22. RLS(Row Level Security) 비활성화 상태 유지
-- RLS는 무한 재귀 문제를 피하기 위해 사용하지 않음

-- 23. 최종 통계 확인
SELECT '=== 📊 데이터베이스 생성 완료 통계 ===' as info;
SELECT 
    (SELECT COUNT(*) FROM corporations) as corporations_count,
    (SELECT COUNT(*) FROM departments) as departments_count,
    (SELECT COUNT(*) FROM positions) as positions_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM system_settings) as settings_count;

-- 24. 관리자 계정 정보 확인
SELECT '=== 👤 생성된 관리자 계정 ===' as info;
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    d.name as department,
    p.name as position,
    c.name as corporation
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN positions p ON u.position_id = p.id
LEFT JOIN corporations c ON u.corporation_id = c.id
WHERE u.role = 'admin';

-- 25. 성공 메시지
SELECT '🎉 Supabase 데이터베이스 생성 완료!' as message;
SELECT '✅ 모든 테이블과 기본 데이터가 성공적으로 생성되었습니다.' as status;
SELECT '🔐 관리자 계정: joon@coilmaster.com (최용수)' as admin_info;
SELECT '🚫 RLS는 비활성화되어 있습니다 (무한 재귀 방지)' as rls_info;
SELECT '🔄 이제 애플리케이션을 새로고침하여 사용하세요!' as next_step; 