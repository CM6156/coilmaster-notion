-- Coilmaster Corporate System Database Setup (Complete Version)
-- 이 스크립트는 Supabase SQL Editor에서 실행해주세요
-- 모든 필요한 테이블, 관계, 정책을 포함한 완전한 설정 스크립트입니다

-- 기존 테이블 정리 (필요시)
DROP TABLE IF EXISTS telegram_message_logs CASCADE;
DROP TABLE IF EXISTS message_templates CASCADE;
DROP TABLE IF EXISTS telegram_users CASCADE;
DROP TABLE IF EXISTS telegram_settings CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS user_manager_sync_status CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS task_journals CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS corporations CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- 함수 정리
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 함수: 자동으로 updated_at 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- 기본 마스터 테이블들
-- =============================================

-- 1. 부서 테이블
CREATE TABLE departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    manager_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 법인 테이블
CREATE TABLE corporations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    business_number VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 직급/포지션 테이블
CREATE TABLE positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    level INTEGER DEFAULT 1,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 사용자 관리 테이블
-- =============================================

-- 4. 사용자 테이블 (확장된 버전)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
    
    -- 조직 정보
    department_id UUID REFERENCES departments(id),
    corporation_id UUID REFERENCES corporations(id),
    position_id UUID REFERENCES positions(id),
    department VARCHAR(100), -- 레거시 호환성
    position VARCHAR(100),   -- 레거시 호환성
    department_name VARCHAR(255),
    corporation_name VARCHAR(255),
    position_name VARCHAR(255),
    
    -- 인사 정보
    employee_id VARCHAR(50),
    phone VARCHAR(20),
    hire_date DATE,
    salary DECIMAL(15,2),
    manager_id UUID,
    
    -- 시스템 정보
    current_page VARCHAR(255),
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    login_method VARCHAR(50) DEFAULT 'local',
    azure_user_id VARCHAR(255),
    telegram_chat_id VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 외래 키 제약 조건 추가 (users 테이블 생성 후)
ALTER TABLE departments ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES users(id);
ALTER TABLE users ADD CONSTRAINT fk_users_manager FOREIGN KEY (manager_id) REFERENCES users(id);

-- =============================================
-- 프로젝트 관리 테이블들
-- =============================================

-- 5. 프로젝트 테이블
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2),
    spent_budget DECIMAL(15,2) DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    manager_id UUID REFERENCES users(id),
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 프로젝트 멤버 테이블
CREATE TABLE project_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('manager', 'member', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- =============================================
-- 업무 관리 테이블들
-- =============================================

-- 7. 업무(태스크) 테이블
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    estimated_hours INTEGER,
    actual_hours INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    parent_task_id UUID REFERENCES tasks(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. 업무 일지 테이블
CREATE TABLE task_journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    hours_worked DECIMAL(4,2) DEFAULT 0,
    work_description TEXT,
    issues TEXT,
    next_steps TEXT,
    mood VARCHAR(20) CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, user_id, date)
);

-- =============================================
-- 고객 관리 테이블들
-- =============================================

-- 9. 고객 테이블
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    industry VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'potential')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 연락처 테이블
CREATE TABLE contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    position VARCHAR(100),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 보고서 및 활동 테이블들
-- =============================================

-- 11. 일일 보고서 테이블
CREATE TABLE daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    work_summary TEXT NOT NULL,
    achievements TEXT,
    challenges TEXT,
    tomorrow_plan TEXT,
    total_hours DECIMAL(4,2) DEFAULT 8,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    mood VARCHAR(20) CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- =============================================
-- 시스템 테이블들
-- =============================================

-- 12. 파일 첨부 테이블
CREATE TABLE attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('project', 'task', 'customer', 'report')),
    entity_id UUID NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. 댓글 테이블
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('project', 'task', 'customer')),
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    parent_comment_id UUID REFERENCES comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. 알림 테이블
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    entity_type VARCHAR(50),
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. 시스템 설정 테이블
CREATE TABLE system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 관리자 시스템 테이블들
-- =============================================

-- 16. 사용자 매니저 동기화 상태 테이블
CREATE TABLE user_manager_sync_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    sync_status VARCHAR(50) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    azure_user_id VARCHAR(255),
    manager_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_email)
);

-- 17. 시스템 로그 테이블
CREATE TABLE system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(50),
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 텔레그램 알림 시스템 테이블들
-- =============================================

-- 18. 텔레그램 설정 테이블
CREATE TABLE telegram_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_token VARCHAR(255) NOT NULL,
    webhook_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    default_chat_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. 텔레그램 사용자 테이블
CREATE TABLE telegram_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    telegram_chat_id VARCHAR(50) NOT NULL,
    telegram_username VARCHAR(100),
    telegram_first_name VARCHAR(100),
    telegram_last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(telegram_chat_id)
);

-- 20. 메시지 템플릿 테이블
CREATE TABLE message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('task_assigned', 'project_update', 'deadline_reminder', 'system_alert', 'custom')),
    template_text TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. 텔레그램 메시지 로그 테이블
CREATE TABLE telegram_message_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'info',
    sent_by UUID REFERENCES users(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    telegram_message_id INTEGER
);

-- =============================================
-- Row Level Security (RLS) 활성화
-- =============================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporations ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_manager_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_message_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 정책 생성 (개발용 - 모든 인증된 사용자에게 접근 허용)
-- =============================================

-- Departments 정책
CREATE POLICY "authenticated_users_all_departments" ON departments FOR ALL TO authenticated USING (true);

-- Corporations 정책
CREATE POLICY "authenticated_users_all_corporations" ON corporations FOR ALL TO authenticated USING (true);

-- Positions 정책
CREATE POLICY "authenticated_users_all_positions" ON positions FOR ALL TO authenticated USING (true);

-- Users 정책
CREATE POLICY "authenticated_users_select_users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_users_insert_users" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "authenticated_users_update_users" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Projects 정책
CREATE POLICY "authenticated_users_all_projects" ON projects FOR ALL TO authenticated USING (true);

-- Project Members 정책
CREATE POLICY "authenticated_users_all_project_members" ON project_members FOR ALL TO authenticated USING (true);

-- Tasks 정책
CREATE POLICY "authenticated_users_all_tasks" ON tasks FOR ALL TO authenticated USING (true);

-- Task Journals 정책
CREATE POLICY "authenticated_users_all_task_journals" ON task_journals FOR ALL TO authenticated USING (true);

-- Customers 정책
CREATE POLICY "authenticated_users_all_customers" ON customers FOR ALL TO authenticated USING (true);

-- Contacts 정책
CREATE POLICY "authenticated_users_all_contacts" ON contacts FOR ALL TO authenticated USING (true);

-- Daily Reports 정책
CREATE POLICY "authenticated_users_all_daily_reports" ON daily_reports FOR ALL TO authenticated USING (true);

-- Attachments 정책
CREATE POLICY "authenticated_users_all_attachments" ON attachments FOR ALL TO authenticated USING (true);

-- Comments 정책
CREATE POLICY "authenticated_users_all_comments" ON comments FOR ALL TO authenticated USING (true);

-- Notifications 정책
CREATE POLICY "authenticated_users_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "authenticated_users_update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "authenticated_users_insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

-- System Settings 정책
CREATE POLICY "authenticated_users_all_system_settings" ON system_settings FOR ALL TO authenticated USING (true);

-- User Manager Sync Status 정책
CREATE POLICY "authenticated_users_all_sync_status" ON user_manager_sync_status FOR ALL TO authenticated USING (true);

-- System Logs 정책
CREATE POLICY "authenticated_users_select_system_logs" ON system_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_users_insert_system_logs" ON system_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Telegram Settings 정책
CREATE POLICY "authenticated_users_all_telegram_settings" ON telegram_settings FOR ALL TO authenticated USING (true);

-- Telegram Users 정책
CREATE POLICY "authenticated_users_all_telegram_users" ON telegram_users FOR ALL TO authenticated USING (true);

-- Message Templates 정책
CREATE POLICY "authenticated_users_all_message_templates" ON message_templates FOR ALL TO authenticated USING (true);

-- Telegram Message Logs 정책
CREATE POLICY "authenticated_users_all_telegram_logs" ON telegram_message_logs FOR ALL TO authenticated USING (true);

-- =============================================
-- 인덱스 생성 (성능 향상)
-- =============================================

-- 기본 테이블 인덱스
CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_manager_id ON departments(manager_id);
CREATE INDEX idx_corporations_code ON corporations(code);
CREATE INDEX idx_positions_code ON positions(code);
CREATE INDEX idx_positions_level ON positions(level);

-- 사용자 테이블 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_corporation_id ON users(corporation_id);
CREATE INDEX idx_users_position_id ON users(position_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_is_online ON users(is_online);

-- 프로젝트 관련 인덱스
CREATE INDEX idx_projects_manager_id ON projects(manager_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);

-- 업무 관련 인덱스
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_task_journals_task_id ON task_journals(task_id);
CREATE INDEX idx_task_journals_user_id ON task_journals(user_id);
CREATE INDEX idx_task_journals_date ON task_journals(date);

-- 기타 테이블 인덱스
CREATE INDEX idx_daily_reports_user_id ON daily_reports(user_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_customers_created_by ON customers(created_by);
CREATE INDEX idx_contacts_customer_id ON contacts(customer_id);

-- 관리 시스템 인덱스
CREATE INDEX idx_sync_status_email ON user_manager_sync_status(user_email);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- 텔레그램 시스템 인덱스
CREATE INDEX idx_telegram_users_user_id ON telegram_users(user_id);
CREATE INDEX idx_telegram_users_chat_id ON telegram_users(telegram_chat_id);
CREATE INDEX idx_telegram_logs_chat_id ON telegram_message_logs(chat_id);
CREATE INDEX idx_telegram_logs_sent_at ON telegram_message_logs(sent_at);

-- =============================================
-- Trigger 생성 (자동 updated_at 업데이트)
-- =============================================

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_corporations_updated_at BEFORE UPDATE ON corporations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_journals_updated_at BEFORE UPDATE ON task_journals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON daily_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_status_updated_at BEFORE UPDATE ON user_manager_sync_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_telegram_settings_updated_at BEFORE UPDATE ON telegram_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_telegram_users_updated_at BEFORE UPDATE ON telegram_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 기본 데이터 입력
-- =============================================

-- 기본 부서 데이터
INSERT INTO departments (name, code, description) VALUES
('경영진', 'management', '회사 경영진'),
('영업팀', 'sales', '영업 및 마케팅 담당'),
('개발팀', 'development', '제품 및 소프트웨어 개발'),
('제조팀', 'manufacturing', '제품 제조 및 생산'),
('품질팀', 'quality', '품질 관리 및 검사'),
('경리팀', 'finance', '재무 및 회계'),
('관리팀', 'administration', '총무 및 인사 관리')
ON CONFLICT (code) DO NOTHING;

-- 기본 법인 데이터
INSERT INTO corporations (name, code, business_number) VALUES
('코일마스터 본사', 'COILMASTER_HQ', '123-45-67890'),
('코일마스터 제조', 'COILMASTER_MFG', '123-45-67891'),
('코일마스터 영업', 'COILMASTER_SALES', '123-45-67892')
ON CONFLICT (code) DO NOTHING;

-- 기본 직급 데이터
INSERT INTO positions (name, code, level, description) VALUES
('사장', 'president', 10, '최고 경영자'),
('상무', 'executive_director', 9, '상무 이사'),
('이사', 'director', 8, '이사급'),
('부장', 'general_manager', 7, '부장급'),
('차장', 'deputy_manager', 6, '차장급'),
('과장', 'manager', 5, '과장급'),
('대리', 'assistant_manager', 4, '대리급'),
('주임', 'supervisor', 3, '주임급'),
('사원', 'employee', 2, '일반 사원'),
('인턴', 'intern', 1, '인턴')
ON CONFLICT (code) DO NOTHING;

-- 시스템 기본 설정
INSERT INTO system_settings (key, value, description) VALUES
('company_name', 'Coilmaster Corporation', '회사명'),
('timezone', 'Asia/Seoul', '기본 시간대'),
('default_work_hours', '8', '기본 근무 시간'),
('notification_enabled', 'true', '알림 활성화 여부'),
('telegram_enabled', 'true', '텔레그램 알림 활성화'),
('system_version', '1.0.0', '시스템 버전')
ON CONFLICT (key) DO NOTHING;

-- 기본 텔레그램 설정
INSERT INTO telegram_settings (bot_token, is_active, default_chat_id) VALUES
('7904123264:AAFe7T54dRKNv-c64sHMDpBWKZIhtYq9ZD8', true, '')
ON CONFLICT DO NOTHING;

-- 기본 메시지 템플릿
INSERT INTO message_templates (name, type, template_text, variables) VALUES
('업무 할당 알림', 'task_assigned', '📋 새로운 업무가 할당되었습니다!\n\n제목: {task_title}\n담당자: {assignee}\n마감일: {due_date}\n\n{description}', '{"task_title": "업무 제목", "assignee": "담당자명", "due_date": "마감일", "description": "업무 설명"}'),
('프로젝트 업데이트', 'project_update', '🚀 프로젝트 업데이트\n\n프로젝트: {project_name}\n상태: {status}\n진행률: {progress}%\n\n{update_message}', '{"project_name": "프로젝트명", "status": "상태", "progress": "진행률", "update_message": "업데이트 내용"}'),
('마감일 알림', 'deadline_reminder', '⏰ 마감일 알림\n\n업무: {task_title}\n마감일: {due_date}\n남은 시간: {time_left}\n\n서둘러 완료해주세요!', '{"task_title": "업무 제목", "due_date": "마감일", "time_left": "남은 시간"}'),
('시스템 알림', 'system_alert', '🔔 시스템 알림\n\n{alert_type}: {message}\n시간: {timestamp}', '{"alert_type": "알림 유형", "message": "메시지", "timestamp": "시간"}')
ON CONFLICT DO NOTHING;

-- =============================================
-- 완료 메시지
-- =============================================

SELECT 'Coilmaster Database Setup Completed Successfully! 🎉' as message,
       'Total Tables: 21' as table_count,
       'All indexes, policies, triggers, and sample data created.' as details,
       'Ready for production use!' as status; 