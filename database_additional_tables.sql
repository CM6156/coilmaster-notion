-- Coilmaster 추가 테이블 생성 스크립트
-- 관리자 패널에서 필요한 테이블들을 추가로 생성합니다

-- 1. 부서 테이블
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 법인 테이블
CREATE TABLE IF NOT EXISTS corporations (
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
CREATE TABLE IF NOT EXISTS positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    level INTEGER DEFAULT 1,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 사용자 매니저 동기화 상태 테이블
CREATE TABLE IF NOT EXISTS user_manager_sync_status (
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

-- 5. 시스템 로그 테이블 (사이드바에서 사용)
CREATE TABLE IF NOT EXISTS system_logs (
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

-- 6. 텔레그램 설정 테이블
CREATE TABLE IF NOT EXISTS telegram_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_token VARCHAR(255) NOT NULL,
    webhook_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    default_chat_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 텔레그램 사용자 테이블
CREATE TABLE IF NOT EXISTS telegram_users (
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

-- 8. 메시지 템플릿 테이블
CREATE TABLE IF NOT EXISTS message_templates (
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

-- 9. 텔레그램 메시지 로그 테이블
CREATE TABLE IF NOT EXISTS telegram_message_logs (
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

-- Users 테이블에 누락된 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS corporation_id UUID REFERENCES corporations(id),
ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES positions(id),
ADD COLUMN IF NOT EXISTS department_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS corporation_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS position_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS salary DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS login_method VARCHAR(50) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS azure_user_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50);

-- RLS 활성화
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporations ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_manager_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_message_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (개발용 - 모든 인증된 사용자에게 접근 허용)

-- Departments 정책
CREATE POLICY "authenticated_users_all_departments" ON departments FOR ALL TO authenticated USING (true);

-- Corporations 정책
CREATE POLICY "authenticated_users_all_corporations" ON corporations FOR ALL TO authenticated USING (true);

-- Positions 정책
CREATE POLICY "authenticated_users_all_positions" ON positions FOR ALL TO authenticated USING (true);

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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);
CREATE INDEX IF NOT EXISTS idx_corporations_code ON corporations(code);
CREATE INDEX IF NOT EXISTS idx_positions_code ON positions(code);
CREATE INDEX IF NOT EXISTS idx_positions_level ON positions(level);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_corporation_id ON users(corporation_id);
CREATE INDEX IF NOT EXISTS idx_users_position_id ON users(position_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_sync_status_email ON user_manager_sync_status(user_email);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON telegram_users(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_chat_id ON telegram_message_logs(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_logs_sent_at ON telegram_message_logs(sent_at);

-- Trigger 생성
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_corporations_updated_at BEFORE UPDATE ON corporations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_status_updated_at BEFORE UPDATE ON user_manager_sync_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_telegram_settings_updated_at BEFORE UPDATE ON telegram_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_telegram_users_updated_at BEFORE UPDATE ON telegram_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 데이터 입력

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

-- 완료 메시지
SELECT 'Additional tables created successfully! 🎉' as message,
       'Departments, Corporations, Positions, and Telegram tables added.' as details; 