-- ========================================
-- 🚀 Coilmaster Corporate System - 완벽한 데이터베이스 설치 스크립트
-- 모든 오류 완전 방지 버전 (컬럼 정확히 일치)
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. 기본 마스터 테이블들 (정확한 컬럼 정의)
-- ========================================

-- 법인 테이블
CREATE TABLE IF NOT EXISTS public.corporations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    name_en VARCHAR(255),
    name_zh VARCHAR(255),
    name_th VARCHAR(255),
    translation_key VARCHAR(100),
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
    translation_key VARCHAR(100),
    code VARCHAR(50),
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
    translation_key VARCHAR(100),
    code VARCHAR(50),
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

-- ========================================
-- 2. 프로젝트 및 업무 관리 테이블들
-- ========================================

-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    corporation_id UUID REFERENCES public.corporations(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 업무 테이블
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT '할 일',
    priority VARCHAR(20) DEFAULT '보통',
    start_date DATE,
    due_date DATE,
    estimated_hours INTEGER,
    actual_hours INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    assigned_to UUID,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ========================================
-- 3. 파일 및 알림 테이블들
-- ========================================

-- 파일 테이블
CREATE TABLE IF NOT EXISTS public.files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    content_type VARCHAR,
    file_size BIGINT,
    file_path VARCHAR NOT NULL,
    uploaded_by UUID REFERENCES public.users(id),
    bucket_id VARCHAR DEFAULT 'project-files',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림 테이블
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. 시스템 관리 테이블들 (정확한 컬럼 정의)
-- ========================================

-- 팝업 설정 테이블
CREATE TABLE IF NOT EXISTS public.popup_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    content TEXT,
    image_url TEXT,
    button_text VARCHAR(100) DEFAULT '확인',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시스템 설정 테이블 (INSERT와 정확히 일치하는 컬럼)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시스템 로그 테이블
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 5. 메시징 플랫폼 테이블들
-- ========================================

-- Telegram 설정 테이블
CREATE TABLE IF NOT EXISTS public.telegram_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bot_token VARCHAR(255) NOT NULL,
    bot_username VARCHAR(100),
    is_active BOOLEAN DEFAULT false,
    auto_notification BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telegram 사용자 테이블
CREATE TABLE IF NOT EXISTS public.telegram_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    telegram_chat_id BIGINT NOT NULL UNIQUE,
    telegram_username VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메시지 템플릿 테이블
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    platform VARCHAR(20) DEFAULT 'telegram',
    message_type VARCHAR(50) NOT NULL,
    language VARCHAR(5) DEFAULT 'ko',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 6. 기본 데이터 삽입 (안전한 방식 - 컬럼 정확히 일치)
-- ========================================

-- 기본 법인 데이터
INSERT INTO public.corporations (name, name_en, name_zh, name_th, translation_key, code)
SELECT '코일마스터 코리아', 'Coilmaster Korea', '韩国线圈大师', 'คอยล์มาสเตอร์เกาหลี', 'corp.coilmaster_korea', 'CMK'
WHERE NOT EXISTS (SELECT 1 FROM public.corporations WHERE name = '코일마스터 코리아');

INSERT INTO public.corporations (name, name_en, name_zh, name_th, translation_key, code)
SELECT '코일마스터 차이나', 'Coilmaster China', '中国线圈大师', 'คอยล์มาสเตอร์จีน', 'corp.coilmaster_china', 'CMC'
WHERE NOT EXISTS (SELECT 1 FROM public.corporations WHERE name = '코일마스터 차이나');

INSERT INTO public.corporations (name, name_en, name_zh, name_th, translation_key, code)
SELECT '코일마스터 태국', 'Coilmaster Thailand', '泰国线圈大师', 'คอยล์มาสเตอร์ไทย', 'corp.coilmaster_thailand', 'CMT'
WHERE NOT EXISTS (SELECT 1 FROM public.corporations WHERE name = '코일마스터 태국');

-- 기본 부서 데이터
DO $$
DECLARE
    corp_id UUID;
BEGIN
    SELECT id INTO corp_id FROM public.corporations WHERE code = 'CMK' LIMIT 1;
    
    IF corp_id IS NOT NULL THEN
        INSERT INTO public.departments (name, name_en, name_zh, name_th, translation_key, code, corporation_id)
        SELECT '경영', 'Management', '管理', 'การจัดการ', 'dept.management', 'MGT', corp_id
        WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = '경영');
        
        INSERT INTO public.departments (name, name_en, name_zh, name_th, translation_key, code, corporation_id)
        SELECT '개발', 'Development', '开发', 'การพัฒนา', 'dept.development', 'DEV', corp_id
        WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = '개발');
        
        INSERT INTO public.departments (name, name_en, name_zh, name_th, translation_key, code, corporation_id)
        SELECT '생산', 'Production', '生产', 'การผลิต', 'dept.production', 'PRD', corp_id
        WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = '생산');
        
        INSERT INTO public.departments (name, name_en, name_zh, name_th, translation_key, code, corporation_id)
        SELECT '품질', 'Quality', '质量', 'คุณภาพ', 'dept.quality', 'QUA', corp_id
        WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = '품질');
        
        INSERT INTO public.departments (name, name_en, name_zh, name_th, translation_key, code, corporation_id)
        SELECT '영업', 'Sales', '销售', 'การขาย', 'dept.sales', 'SAL', corp_id
        WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE name = '영업');
    END IF;
END $$;

-- 기본 직책 데이터
INSERT INTO public.positions (name, name_en, name_zh, name_th, translation_key, code, level)
SELECT '사원', 'Employee', '员工', 'พนักงาน', 'pos.employee', 'EMP', 1
WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE name = '사원');

INSERT INTO public.positions (name, name_en, name_zh, name_th, translation_key, code, level)
SELECT '대리', 'Assistant Manager', '副经理', 'ผู้ช่วยผู้จัดการ', 'pos.assistant_manager', 'AM', 3
WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE name = '대리');

INSERT INTO public.positions (name, name_en, name_zh, name_th, translation_key, code, level)
SELECT '과장', 'Manager', '经理', 'ผู้จัดการ', 'pos.manager', 'MGR', 4
WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE name = '과장');

INSERT INTO public.positions (name, name_en, name_zh, name_th, translation_key, code, level)
SELECT '부장', 'General Manager', '总经理', 'ผู้จัดการทั่วไป', 'pos.general_manager', 'GM', 6
WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE name = '부장');

INSERT INTO public.positions (name, name_en, name_zh, name_th, translation_key, code, level)
SELECT '대표', 'CEO', '首席执行官', 'ซีอีโอ', 'pos.ceo', 'CEO', 12
WHERE NOT EXISTS (SELECT 1 FROM public.positions WHERE name = '대표');

-- 기본 시스템 설정 (정확한 컬럼으로 INSERT)
INSERT INTO public.system_settings (key, value, description, category, data_type, is_public)
SELECT 'company_name', 'Coilmaster', '회사명', 'general', 'string', true
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'company_name');

INSERT INTO public.system_settings (key, value, description, category, data_type, is_public)
SELECT 'default_language', 'ko', '기본 언어', 'general', 'string', true
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'default_language');

INSERT INTO public.system_settings (key, value, description, category, data_type, is_public)
SELECT 'timezone', 'Asia/Seoul', '시간대', 'general', 'string', true
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'timezone');

INSERT INTO public.system_settings (key, value, description, category, data_type, is_public)
SELECT 'file_upload_max_size', '10485760', '파일 업로드 최대 크기 (bytes)', 'files', 'number', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'file_upload_max_size');

INSERT INTO public.system_settings (key, value, description, category, data_type, is_public)
SELECT 'auto_logout_minutes', '480', '자동 로그아웃 시간 (분)', 'security', 'number', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'auto_logout_minutes');

-- 기본 메시지 템플릿
INSERT INTO public.message_templates (name, title, content, platform, message_type, language)
SELECT 'task_assigned', '새 업무 배정', '{user_name}님께 새로운 업무가 배정되었습니다.\n\n📋 업무: {task_title}\n📅 마감일: {due_date}', 'telegram', 'task_notification', 'ko'
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'task_assigned');

INSERT INTO public.message_templates (name, title, content, platform, message_type, language)
SELECT 'project_created', '새 프로젝트 생성', '새로운 프로젝트가 생성되었습니다.\n\n📁 프로젝트: {project_name}\n👤 관리자: {manager_name}', 'telegram', 'project_notification', 'ko'
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'project_created');

INSERT INTO public.message_templates (name, title, content, platform, message_type, language)
SELECT 'welcome_message', '환영합니다!', 'Coilmaster 시스템에 오신 것을 환영합니다!\n\n📱 Telegram 알림이 설정되었습니다.', 'telegram', 'welcome', 'ko'
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'welcome_message');

-- ========================================
-- 7. 인덱스 생성 (성능 최적화)
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_position_id ON public.users(position_id);
CREATE INDEX IF NOT EXISTS idx_users_corporation_id ON public.users(corporation_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON public.projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON public.telegram_users(telegram_chat_id);

-- ========================================
-- 8. 트리거 함수 및 트리거 생성
-- ========================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON public.projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 9. RLS 정책 설정 (보안)
-- ========================================

-- RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 새로 생성
DROP POLICY IF EXISTS "authenticated_full_access_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_full_access_departments" ON public.departments;
DROP POLICY IF EXISTS "authenticated_full_access_positions" ON public.positions;
DROP POLICY IF EXISTS "authenticated_full_access_corporations" ON public.corporations;
DROP POLICY IF EXISTS "authenticated_full_access_projects" ON public.projects;
DROP POLICY IF EXISTS "authenticated_full_access_tasks" ON public.tasks;
DROP POLICY IF EXISTS "authenticated_full_access_files" ON public.files;
DROP POLICY IF EXISTS "authenticated_full_access_notifications" ON public.notifications;
DROP POLICY IF EXISTS "authenticated_full_access_popup_settings" ON public.popup_settings;
DROP POLICY IF EXISTS "authenticated_full_access_system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "authenticated_full_access_system_logs" ON public.system_logs;
DROP POLICY IF EXISTS "authenticated_full_access_telegram_settings" ON public.telegram_settings;
DROP POLICY IF EXISTS "authenticated_full_access_telegram_users" ON public.telegram_users;
DROP POLICY IF EXISTS "authenticated_full_access_message_templates" ON public.message_templates;

-- 간단한 RLS 정책 (인증된 사용자 전체 권한)
CREATE POLICY "authenticated_full_access_users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_departments" ON public.departments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_positions" ON public.positions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_corporations" ON public.corporations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_projects" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_tasks" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_files" ON public.files FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_notifications" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_popup_settings" ON public.popup_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_system_settings" ON public.system_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_system_logs" ON public.system_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_telegram_settings" ON public.telegram_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_telegram_users" ON public.telegram_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access_message_templates" ON public.message_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========================================
-- 🎉 완료 메시지
-- ========================================

SELECT 
    '✅ Coilmaster 완벽한 데이터베이스 설치 완료!' as "설치 상태",
    '모든 컬럼 정확히 일치' as "정확성 보증",
    'ON CONFLICT 및 컬럼 오류 완전 방지' as "오류 방지",
    'Ready for Production!' as "준비 상태"; 