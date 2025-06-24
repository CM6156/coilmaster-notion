-- ========================================
-- Coilmaster Corporate System - 시스템 관리 테이블들
-- ========================================

-- 팝업 설정 테이블
CREATE TABLE IF NOT EXISTS public.popup_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    content TEXT,
    image_url TEXT,
    image_alt VARCHAR(255),
    button_text VARCHAR(100) DEFAULT '확인',
    background_gradient VARCHAR(255),
    show_dont_show_today BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 팝업 표시 로그 테이블
CREATE TABLE IF NOT EXISTS public.popup_display_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    popup_id UUID REFERENCES public.popup_settings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시스템 설정 테이블
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

-- 사용자 세션 테이블
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    page_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 관리자 동기화 상태 테이블
CREATE TABLE IF NOT EXISTS public.user_manager_sync_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telegram 설정 테이블
CREATE TABLE IF NOT EXISTS public.telegram_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bot_token VARCHAR(255) NOT NULL,
    bot_username VARCHAR(100),
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT false,
    auto_notification BOOLEAN DEFAULT true,
    notification_types TEXT[] DEFAULT ARRAY['task', 'project', 'system'],
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
    verification_code VARCHAR(6),
    verification_expires TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    language_code VARCHAR(10) DEFAULT 'ko',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메시지 템플릿 테이블
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    platform VARCHAR(20) DEFAULT 'telegram' CHECK (platform IN ('telegram', 'line', 'wechat', 'email')),
    message_type VARCHAR(50) NOT NULL,
    language VARCHAR(5) DEFAULT 'ko',
    variables TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telegram 메시지 로그 테이블
CREATE TABLE IF NOT EXISTS public.telegram_message_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    message_id INTEGER,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    message_type VARCHAR(50),
    content TEXT,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LINE 설정 테이블
CREATE TABLE IF NOT EXISTS public.line_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_access_token TEXT NOT NULL,
    channel_secret VARCHAR(255) NOT NULL,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT false,
    auto_notification BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LINE 사용자 테이블
CREATE TABLE IF NOT EXISTS public.line_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    line_user_id VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    picture_url TEXT,
    matched_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT false,
    verification_code VARCHAR(6),
    verification_expires TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WeChat 설정 테이블
CREATE TABLE IF NOT EXISTS public.wechat_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    app_id VARCHAR(255) NOT NULL,
    app_secret VARCHAR(255) NOT NULL,
    access_token TEXT,
    token_expires TIMESTAMPTZ,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT false,
    auto_notification BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WeChat 사용자 테이블
CREATE TABLE IF NOT EXISTS public.wechat_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    openid VARCHAR(255) NOT NULL UNIQUE,
    nickname VARCHAR(255),
    avatar_url TEXT,
    matched_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT false,
    verification_code VARCHAR(6),
    verification_expires TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메시징 로그 테이블
CREATE TABLE IF NOT EXISTS public.messaging_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform VARCHAR(20) NOT NULL,
    platform_user_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    message_type VARCHAR(50),
    content TEXT,
    status VARCHAR(20) DEFAULT 'sent',
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 시스템 설정 데이터
INSERT INTO public.system_settings (key, value, description, category, data_type, is_public) VALUES
('company_name', 'Coilmaster', '회사명', 'general', 'string', true),
('default_language', 'ko', '기본 언어', 'general', 'string', true),
('timezone', 'Asia/Seoul', '시간대', 'general', 'string', true),
('file_upload_max_size', '10485760', '파일 업로드 최대 크기 (bytes)', 'files', 'number', false),
('allowed_file_types', '["jpg","jpeg","png","gif","pdf","doc","docx","xls","xlsx","ppt","pptx","txt","zip","rar"]', '허용 파일 형식', 'files', 'json', false),
('auto_logout_minutes', '480', '자동 로그아웃 시간 (분)', 'security', 'number', false),
('session_timeout_minutes', '1440', '세션 타임아웃 시간 (분)', 'security', 'number', false)
ON CONFLICT (key) DO NOTHING;

-- 기본 메시지 템플릿 (한국어)
INSERT INTO public.message_templates (name, title, content, platform, message_type, language) VALUES
('task_assigned', '새 업무 배정', '{user_name}님께 새로운 업무가 배정되었습니다.\n\n📋 업무: {task_title}\n📅 마감일: {due_date}\n🔗 상세보기: {task_url}', 'telegram', 'task_notification', 'ko'),
('project_created', '새 프로젝트 생성', '새로운 프로젝트가 생성되었습니다.\n\n📁 프로젝트: {project_name}\n👤 관리자: {manager_name}\n📅 시작일: {start_date}\n🔗 상세보기: {project_url}', 'telegram', 'project_notification', 'ko'),
('welcome_message', '환영합니다!', 'Coilmaster 코일마스터 시스템에 오신 것을 환영합니다!\n\n📱 이제 Telegram을 통해 업무 알림을 받을 수 있습니다.\n\n✅ 인증이 완료되었습니다.', 'telegram', 'welcome', 'ko')
ON CONFLICT (name) DO NOTHING;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_popup_display_logs_popup_id ON public.popup_display_logs(popup_id);
CREATE INDEX IF NOT EXISTS idx_popup_display_logs_user_id ON public.popup_display_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON public.telegram_users(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON public.telegram_users(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_message_logs_chat_id ON public.telegram_message_logs(chat_id);
CREATE INDEX IF NOT EXISTS idx_line_users_user_id ON public.line_users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_wechat_users_openid ON public.wechat_users(openid);
CREATE INDEX IF NOT EXISTS idx_messaging_logs_platform ON public.messaging_logs(platform);

-- RLS 정책 설정
ALTER TABLE public.popup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_display_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_manager_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wechat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wechat_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_logs ENABLE ROW LEVEL SECURITY;

-- 간단한 RLS 정책 생성
CREATE POLICY "authenticated_users_all_popup_settings" ON public.popup_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_popup_display_logs" ON public.popup_display_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_system_settings" ON public.system_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_system_logs" ON public.system_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_user_sessions" ON public.user_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_user_activity_logs" ON public.user_activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_user_manager_sync_status" ON public.user_manager_sync_status FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_telegram_settings" ON public.telegram_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_telegram_users" ON public.telegram_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_message_templates" ON public.message_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_telegram_message_logs" ON public.telegram_message_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_line_settings" ON public.line_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_line_users" ON public.line_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_wechat_settings" ON public.wechat_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_wechat_users" ON public.wechat_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all_messaging_logs" ON public.messaging_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 완료 메시지
SELECT '✅ 시스템 관리 테이블 생성 완료!' as message; 