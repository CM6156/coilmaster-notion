-- =============================================
-- Coilmaster Settings Management Tables
-- =============================================

-- 1. 설정 카테고리 테이블
CREATE TABLE IF NOT EXISTS setting_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_key VARCHAR(100) UNIQUE NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100), -- 아이콘 이름
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 시스템 설정 템플릿 테이블
CREATE TABLE IF NOT EXISTS setting_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES setting_categories(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_name VARCHAR(255) NOT NULL,
    description TEXT,
    setting_type VARCHAR(50) NOT NULL, -- string, number, boolean, json, select, multiselect, color, file
    default_value TEXT,
    validation_rules JSONB, -- 유효성 검사 규칙
    options JSONB, -- select, multiselect 타입의 옵션들
    is_required BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false, -- 공개 설정 여부
    is_user_configurable BOOLEAN DEFAULT true, -- 사용자가 설정 가능한지
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 글로벌 시스템 설정 테이블 (기존 system_settings 확장)
CREATE TABLE IF NOT EXISTS global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES setting_templates(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    previous_value TEXT, -- 이전 값 저장
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 사용자별 설정 테이블
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES setting_templates(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    is_inherited BOOLEAN DEFAULT false, -- 글로벌 설정에서 상속받는지
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, setting_key)
);

-- 5. 역할별 설정 테이블
CREATE TABLE IF NOT EXISTS role_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(100) NOT NULL, -- admin, manager, user, etc.
    template_id UUID REFERENCES setting_templates(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_name, setting_key)
);

-- 6. 알림 설정 테이블
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL, -- email, push, sms, in_app
    category VARCHAR(100) NOT NULL, -- project, task, system, security
    is_enabled BOOLEAN DEFAULT true,
    frequency VARCHAR(50) DEFAULT 'immediate', -- immediate, daily, weekly, never
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type, category)
);

-- 7. 테마 설정 테이블
CREATE TABLE IF NOT EXISTS theme_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    theme_name VARCHAR(100) DEFAULT 'default', -- default, dark, light, custom
    primary_color VARCHAR(7), -- HEX 색상
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    background_color VARCHAR(7),
    text_color VARCHAR(7),
    font_family VARCHAR(100),
    font_size INTEGER DEFAULT 14,
    sidebar_collapsed BOOLEAN DEFAULT false,
    layout_mode VARCHAR(50) DEFAULT 'default', -- default, compact, spacious
    custom_css TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 8. 언어 및 지역 설정 테이블
CREATE TABLE IF NOT EXISTS locale_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    language_code VARCHAR(10) DEFAULT 'ko', -- ko, en, th, zh
    country_code VARCHAR(10) DEFAULT 'KR',
    timezone VARCHAR(100) DEFAULT 'Asia/Seoul',
    date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(50) DEFAULT 'HH:mm',
    number_format VARCHAR(50) DEFAULT '1,234.56',
    currency VARCHAR(10) DEFAULT 'KRW',
    first_day_of_week INTEGER DEFAULT 1, -- 1=Monday, 0=Sunday
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 9. 대시보드 설정 테이블
CREATE TABLE IF NOT EXISTS dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    widget_id VARCHAR(100) NOT NULL,
    widget_type VARCHAR(100) NOT NULL, -- chart, table, card, calendar
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 4,
    height INTEGER DEFAULT 3,
    is_visible BOOLEAN DEFAULT true,
    widget_config JSONB, -- 위젯별 설정
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, widget_id)
);

-- 10. 보안 설정 테이블
CREATE TABLE IF NOT EXISTS security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_method VARCHAR(50), -- sms, email, app
    session_timeout INTEGER DEFAULT 3600, -- 초 단위
    password_expiry_days INTEGER DEFAULT 90,
    login_attempts_limit INTEGER DEFAULT 5,
    ip_whitelist TEXT[], -- 허용된 IP 주소 목록
    last_password_change TIMESTAMP WITH TIME ZONE,
    security_questions JSONB, -- 보안 질문과 답변
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 11. 설정 변경 이력 테이블
CREATE TABLE IF NOT EXISTS setting_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    setting_type VARCHAR(50) NOT NULL, -- global, user, role, notification, theme, locale
    setting_key VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. 설정 백업 테이블
CREATE TABLE IF NOT EXISTS setting_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(50) NOT NULL, -- manual, automatic, migration
    settings_data JSONB NOT NULL, -- 모든 설정 데이터
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 인덱스 생성
-- =============================================

-- 설정 카테고리 인덱스
CREATE INDEX IF NOT EXISTS idx_setting_categories_key ON setting_categories(category_key);
CREATE INDEX IF NOT EXISTS idx_setting_categories_active ON setting_categories(is_active);

-- 설정 템플릿 인덱스
CREATE INDEX IF NOT EXISTS idx_setting_templates_key ON setting_templates(setting_key);
CREATE INDEX IF NOT EXISTS idx_setting_templates_category ON setting_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_setting_templates_type ON setting_templates(setting_type);

-- 글로벌 설정 인덱스
CREATE INDEX IF NOT EXISTS idx_global_settings_key ON global_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_global_settings_template ON global_settings(template_id);

-- 사용자 설정 인덱스
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_user_settings_template ON user_settings(template_id);

-- 역할 설정 인덱스
CREATE INDEX IF NOT EXISTS idx_role_settings_role ON role_settings(role_name);
CREATE INDEX IF NOT EXISTS idx_role_settings_key ON role_settings(setting_key);

-- 알림 설정 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_type ON notification_settings(notification_type);

-- 설정 이력 인덱스
CREATE INDEX IF NOT EXISTS idx_setting_history_user ON setting_history(user_id);
CREATE INDEX IF NOT EXISTS idx_setting_history_created_at ON setting_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_setting_history_type ON setting_history(setting_type);

-- =============================================
-- 트리거 함수 생성
-- =============================================

-- 설정 변경 이력 자동 기록 함수
CREATE OR REPLACE FUNCTION log_setting_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 값이 실제로 변경된 경우에만 이력 기록
    IF OLD.setting_value IS DISTINCT FROM NEW.setting_value THEN
        INSERT INTO setting_history (
            user_id,
            setting_type,
            setting_key,
            old_value,
            new_value,
            ip_address
        ) VALUES (
            COALESCE(NEW.user_id, auth.uid()),
            TG_TABLE_NAME,
            NEW.setting_key,
            OLD.setting_value,
            NEW.setting_value,
            inet_client_addr()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 업데이트 시간 자동 갱신 함수 (재사용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 트리거 생성
-- =============================================

-- 설정 변경 이력 트리거들
DO $$
BEGIN
    -- 글로벌 설정 변경 이력
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'global_settings_history_trigger') THEN
        CREATE TRIGGER global_settings_history_trigger
            AFTER UPDATE ON global_settings
            FOR EACH ROW EXECUTE FUNCTION log_setting_change();
    END IF;
    
    -- 사용자 설정 변경 이력
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_settings_history_trigger') THEN
        CREATE TRIGGER user_settings_history_trigger
            AFTER UPDATE ON user_settings
            FOR EACH ROW EXECUTE FUNCTION log_setting_change();
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 업데이트 시간 자동 갱신 트리거들
DO $$
BEGIN
    -- 설정 카테고리
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'setting_categories_updated_at') THEN
        CREATE TRIGGER setting_categories_updated_at
            BEFORE UPDATE ON setting_categories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- 설정 템플릿
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'setting_templates_updated_at') THEN
        CREATE TRIGGER setting_templates_updated_at
            BEFORE UPDATE ON setting_templates
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- 글로벌 설정
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'global_settings_updated_at') THEN
        CREATE TRIGGER global_settings_updated_at
            BEFORE UPDATE ON global_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- 사용자 설정
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_settings_updated_at') THEN
        CREATE TRIGGER user_settings_updated_at
            BEFORE UPDATE ON user_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- 역할 설정
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'role_settings_updated_at') THEN
        CREATE TRIGGER role_settings_updated_at
            BEFORE UPDATE ON role_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- 알림 설정
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'notification_settings_updated_at') THEN
        CREATE TRIGGER notification_settings_updated_at
            BEFORE UPDATE ON notification_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- 테마 설정
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'theme_settings_updated_at') THEN
        CREATE TRIGGER theme_settings_updated_at
            BEFORE UPDATE ON theme_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- 언어 설정
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'locale_settings_updated_at') THEN
        CREATE TRIGGER locale_settings_updated_at
            BEFORE UPDATE ON locale_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- 대시보드 설정
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'dashboard_settings_updated_at') THEN
        CREATE TRIGGER dashboard_settings_updated_at
            BEFORE UPDATE ON dashboard_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- 보안 설정
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'security_settings_updated_at') THEN
        CREATE TRIGGER security_settings_updated_at
            BEFORE UPDATE ON security_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

-- 설정 카테고리 RLS
ALTER TABLE setting_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view active categories" ON setting_categories;
DROP POLICY IF EXISTS "Admin can manage categories" ON setting_categories;
CREATE POLICY "Everyone can view active categories" ON setting_categories
    FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage categories" ON setting_categories
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 설정 템플릿 RLS
ALTER TABLE setting_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view public templates" ON setting_templates;
DROP POLICY IF EXISTS "Admin can manage templates" ON setting_templates;
CREATE POLICY "Everyone can view public templates" ON setting_templates
    FOR SELECT USING (is_public = true OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin can manage templates" ON setting_templates
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 글로벌 설정 RLS
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can manage global settings" ON global_settings;
CREATE POLICY "Admin can manage global settings" ON global_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 사용자 설정 RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their settings" ON user_settings;
DROP POLICY IF EXISTS "Admin can view all user settings" ON user_settings;
CREATE POLICY "Users can manage their settings" ON user_settings
    FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin can view all user settings" ON user_settings
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 역할 설정 RLS
ALTER TABLE role_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can manage role settings" ON role_settings;
CREATE POLICY "Admin can manage role settings" ON role_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 알림 설정 RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their notifications" ON notification_settings;
CREATE POLICY "Users can manage their notifications" ON notification_settings
    FOR ALL USING (user_id = auth.uid());

-- 테마 설정 RLS
ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their theme" ON theme_settings;
CREATE POLICY "Users can manage their theme" ON theme_settings
    FOR ALL USING (user_id = auth.uid());

-- 언어 설정 RLS
ALTER TABLE locale_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their locale" ON locale_settings;
CREATE POLICY "Users can manage their locale" ON locale_settings
    FOR ALL USING (user_id = auth.uid());

-- 대시보드 설정 RLS
ALTER TABLE dashboard_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their dashboard" ON dashboard_settings;
CREATE POLICY "Users can manage their dashboard" ON dashboard_settings
    FOR ALL USING (user_id = auth.uid());

-- 보안 설정 RLS
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their security" ON security_settings;
CREATE POLICY "Users can manage their security" ON security_settings
    FOR ALL USING (user_id = auth.uid());

-- 설정 이력 RLS
ALTER TABLE setting_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their history" ON setting_history;
DROP POLICY IF EXISTS "Admin can view all history" ON setting_history;
CREATE POLICY "Users can view their history" ON setting_history
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin can view all history" ON setting_history
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 설정 백업 RLS
ALTER TABLE setting_backups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their backups" ON setting_backups;
DROP POLICY IF EXISTS "Admin can view all backups" ON setting_backups;
CREATE POLICY "Users can manage their backups" ON setting_backups
    FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin can view all backups" ON setting_backups
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================
-- 기본 데이터 삽입
-- =============================================

-- 설정 카테고리 기본 데이터
INSERT INTO setting_categories (category_key, category_name, description, icon, order_index) VALUES
('general', '일반 설정', '기본적인 시스템 설정', 'Settings', 1),
('appearance', '외관 설정', '테마, 색상, 폰트 등 외관 관련 설정', 'Palette', 2),
('notifications', '알림 설정', '이메일, 푸시 알림 등 알림 관련 설정', 'Bell', 3),
('security', '보안 설정', '비밀번호, 2단계 인증 등 보안 관련 설정', 'Shield', 4),
('language', '언어 및 지역', '언어, 시간대, 날짜 형식 등 지역화 설정', 'Globe', 5),
('dashboard', '대시보드', '대시보드 위젯 및 레이아웃 설정', 'LayoutDashboard', 6),
('advanced', '고급 설정', '개발자 및 고급 사용자를 위한 설정', 'Code', 7)
ON CONFLICT (category_key) DO NOTHING;

-- 설정 템플릿 기본 데이터
INSERT INTO setting_templates (category_id, setting_key, setting_name, description, setting_type, default_value, is_public, is_user_configurable, order_index) VALUES
-- 일반 설정
((SELECT id FROM setting_categories WHERE category_key = 'general'), 'app_name', '애플리케이션 이름', '시스템에 표시되는 애플리케이션 이름', 'string', 'Coilmaster Notion', true, false, 1),
((SELECT id FROM setting_categories WHERE category_key = 'general'), 'default_page_size', '기본 페이지 크기', '목록에서 한 번에 표시할 항목 수', 'number', '20', true, true, 2),
((SELECT id FROM setting_categories WHERE category_key = 'general'), 'auto_save_interval', '자동 저장 간격', '자동 저장 간격 (초)', 'number', '30', true, true, 3),

-- 외관 설정
((SELECT id FROM setting_categories WHERE category_key = 'appearance'), 'theme_mode', '테마 모드', '라이트/다크 테마 선택', 'select', 'auto', true, true, 1),
((SELECT id FROM setting_categories WHERE category_key = 'appearance'), 'primary_color', '기본 색상', '시스템의 기본 색상', 'color', '#3b82f6', true, true, 2),
((SELECT id FROM setting_categories WHERE category_key = 'appearance'), 'font_size', '글꼴 크기', '기본 글꼴 크기', 'select', 'medium', true, true, 3),

-- 알림 설정
((SELECT id FROM setting_categories WHERE category_key = 'notifications'), 'email_notifications', '이메일 알림', '이메일 알림 활성화', 'boolean', 'true', true, true, 1),
((SELECT id FROM setting_categories WHERE category_key = 'notifications'), 'push_notifications', '푸시 알림', '브라우저 푸시 알림 활성화', 'boolean', 'true', true, true, 2),
((SELECT id FROM setting_categories WHERE category_key = 'notifications'), 'notification_sound', '알림 소리', '알림 소리 활성화', 'boolean', 'true', true, true, 3),

-- 보안 설정
((SELECT id FROM setting_categories WHERE category_key = 'security'), 'session_timeout', '세션 타임아웃', '세션 만료 시간 (분)', 'number', '60', false, true, 1),
((SELECT id FROM setting_categories WHERE category_key = 'security'), 'password_expiry', '비밀번호 만료', '비밀번호 만료 기간 (일)', 'number', '90', false, false, 2),
((SELECT id FROM setting_categories WHERE category_key = 'security'), 'two_factor_auth', '2단계 인증', '2단계 인증 활성화', 'boolean', 'false', false, true, 3),

-- 언어 및 지역
((SELECT id FROM setting_categories WHERE category_key = 'language'), 'default_language', '기본 언어', '시스템 기본 언어', 'select', 'ko', true, true, 1),
((SELECT id FROM setting_categories WHERE category_key = 'language'), 'timezone', '시간대', '기본 시간대', 'select', 'Asia/Seoul', true, true, 2),
((SELECT id FROM setting_categories WHERE category_key = 'language'), 'date_format', '날짜 형식', '날짜 표시 형식', 'select', 'YYYY-MM-DD', true, true, 3),

-- 대시보드
((SELECT id FROM setting_categories WHERE category_key = 'dashboard'), 'default_dashboard', '기본 대시보드', '로그인 시 표시할 기본 대시보드', 'select', 'overview', true, true, 1),
((SELECT id FROM setting_categories WHERE category_key = 'dashboard'), 'widget_refresh_interval', '위젯 새로고침 간격', '대시보드 위젯 자동 새로고침 간격 (초)', 'number', '300', true, true, 2)
ON CONFLICT (setting_key) DO NOTHING;

-- 설정 템플릿 옵션 업데이트
UPDATE setting_templates SET options = '["auto", "light", "dark"]'::jsonb WHERE setting_key = 'theme_mode';
UPDATE setting_templates SET options = '["small", "medium", "large"]'::jsonb WHERE setting_key = 'font_size';
UPDATE setting_templates SET options = '["ko", "en", "th", "zh"]'::jsonb WHERE setting_key = 'default_language';
UPDATE setting_templates SET options = '["Asia/Seoul", "UTC", "America/New_York", "Europe/London"]'::jsonb WHERE setting_key = 'timezone';
UPDATE setting_templates SET options = '["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"]'::jsonb WHERE setting_key = 'date_format';
UPDATE setting_templates SET options = '["overview", "projects", "tasks", "dashboard"]'::jsonb WHERE setting_key = 'default_dashboard';

-- =============================================
-- 유용한 뷰 생성
-- =============================================

-- 사용자별 전체 설정 뷰
CREATE OR REPLACE VIEW user_complete_settings AS
SELECT 
    u.id as user_id,
    sc.category_key,
    st.setting_key,
    st.setting_name,
    st.setting_type,
    COALESCE(us.setting_value, rs.setting_value, gs.setting_value, st.default_value) as effective_value,
    CASE 
        WHEN us.setting_value IS NOT NULL THEN 'user'
        WHEN rs.setting_value IS NOT NULL THEN 'role'
        WHEN gs.setting_value IS NOT NULL THEN 'global'
        ELSE 'default'
    END as value_source,
    st.is_user_configurable,
    st.description
FROM auth.users u
CROSS JOIN setting_templates st
JOIN setting_categories sc ON st.category_id = sc.id
LEFT JOIN user_settings us ON u.id = us.user_id AND st.setting_key = us.setting_key
LEFT JOIN role_settings rs ON st.setting_key = rs.setting_key AND rs.role_name = COALESCE(u.raw_user_meta_data->>'role', 'user')
LEFT JOIN global_settings gs ON st.setting_key = gs.setting_key
WHERE sc.is_active = true;

-- 설정 변경 통계 뷰
CREATE OR REPLACE VIEW setting_change_stats AS
SELECT 
    setting_type,
    setting_key,
    COUNT(*) as change_count,
    COUNT(DISTINCT user_id) as users_affected,
    MAX(created_at) as last_changed,
    MIN(created_at) as first_changed
FROM setting_history
GROUP BY setting_type, setting_key;

-- =============================================
-- 저장 프로시저
-- =============================================

-- 사용자 설정 가져오기 함수
CREATE OR REPLACE FUNCTION get_user_setting(
    p_user_id UUID,
    p_setting_key VARCHAR(100)
)
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
    user_role TEXT;
BEGIN
    -- 사용자 역할 가져오기
    SELECT COALESCE(raw_user_meta_data->>'role', 'user') INTO user_role
    FROM auth.users WHERE id = p_user_id;
    
    -- 우선순위: 사용자 설정 > 역할 설정 > 글로벌 설정 > 기본값
    SELECT COALESCE(
        us.setting_value,
        rs.setting_value,
        gs.setting_value,
        st.default_value
    ) INTO setting_value
    FROM setting_templates st
    LEFT JOIN user_settings us ON st.setting_key = us.setting_key AND us.user_id = p_user_id
    LEFT JOIN role_settings rs ON st.setting_key = rs.setting_key AND rs.role_name = user_role
    LEFT JOIN global_settings gs ON st.setting_key = gs.setting_key
    WHERE st.setting_key = p_setting_key;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 설정 저장 함수
CREATE OR REPLACE FUNCTION set_user_setting(
    p_user_id UUID,
    p_setting_key VARCHAR(100),
    p_setting_value TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    template_exists BOOLEAN;
    is_configurable BOOLEAN;
BEGIN
    -- 설정 템플릿 존재 여부 및 사용자 설정 가능 여부 확인
    SELECT EXISTS(SELECT 1 FROM setting_templates WHERE setting_key = p_setting_key),
           COALESCE(is_user_configurable, false)
    INTO template_exists, is_configurable
    FROM setting_templates 
    WHERE setting_key = p_setting_key;
    
    IF NOT template_exists THEN
        RAISE EXCEPTION 'Setting template does not exist: %', p_setting_key;
    END IF;
    
    IF NOT is_configurable THEN
        RAISE EXCEPTION 'Setting is not user configurable: %', p_setting_key;
    END IF;
    
    -- 사용자 설정 저장 또는 업데이트
    INSERT INTO user_settings (user_id, setting_key, setting_value, template_id)
    SELECT p_user_id, p_setting_key, p_setting_value, id
    FROM setting_templates WHERE setting_key = p_setting_key
    ON CONFLICT (user_id, setting_key) 
    DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 설정 백업 생성 함수
CREATE OR REPLACE FUNCTION create_settings_backup(
    p_user_id UUID,
    p_backup_name VARCHAR(255)
)
RETURNS UUID AS $$
DECLARE
    backup_id UUID;
    settings_data JSONB;
BEGIN
    -- 사용자의 모든 설정 데이터 수집
    SELECT jsonb_build_object(
        'user_settings', (SELECT jsonb_agg(row_to_json(us)) FROM user_settings us WHERE us.user_id = p_user_id),
        'notification_settings', (SELECT jsonb_agg(row_to_json(ns)) FROM notification_settings ns WHERE ns.user_id = p_user_id),
        'theme_settings', (SELECT row_to_json(ts) FROM theme_settings ts WHERE ts.user_id = p_user_id),
        'locale_settings', (SELECT row_to_json(ls) FROM locale_settings ls WHERE ls.user_id = p_user_id),
        'dashboard_settings', (SELECT jsonb_agg(row_to_json(ds)) FROM dashboard_settings ds WHERE ds.user_id = p_user_id),
        'security_settings', (SELECT row_to_json(ss) FROM security_settings ss WHERE ss.user_id = p_user_id)
    ) INTO settings_data;
    
    -- 백업 레코드 생성
    INSERT INTO setting_backups (user_id, backup_name, backup_type, settings_data, created_by)
    VALUES (p_user_id, p_backup_name, 'manual', settings_data, auth.uid())
    RETURNING id INTO backup_id;
    
    RETURN backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 시스템 상태 요약 뷰
CREATE OR REPLACE VIEW system_status_summary AS
SELECT 
    'users' as metric_name,
    COALESCE(COUNT(*)::text, '0') as metric_value,
    'Total registered users' as description
FROM auth.users
UNION ALL
SELECT 
    'active_projects',
    COALESCE(COUNT(*)::text, '0'),
    'Currently active projects'
FROM projects WHERE status = 'active'
UNION ALL
SELECT 
    'total_tasks',
    COALESCE(COUNT(*)::text, '0'),
    'Total tasks in system'
FROM tasks
UNION ALL
SELECT 
    'system_logs_today',
    COALESCE(COUNT(*)::text, '0'),
    'System logs generated today'
FROM system_logs 
WHERE created_at >= CURRENT_DATE
UNION ALL
SELECT 
    'database_size',
    COALESCE(pg_size_pretty(pg_database_size(current_database())), '0 MB'),
    'Total database size'
UNION ALL
SELECT 
    'last_backup',
    COALESCE(MAX(started_at)::text, 'Never'),
    'Last backup date'
FROM backup_records WHERE status = 'completed';

-- 최근 활동 요약 뷰
CREATE OR REPLACE VIEW recent_activity_summary AS
SELECT 
    'user_logins_today' as activity_type,
    COALESCE(COUNT(*)::text, '0') as count,
    'User logins today' as description
FROM user_activity_logs 
WHERE action = 'login' AND created_at >= CURRENT_DATE
UNION ALL
SELECT 
    'projects_created_week',
    COALESCE(COUNT(*)::text, '0'),
    'Projects created this week'
FROM projects 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
    'tasks_completed_week',
    COALESCE(COUNT(*)::text, '0'),
    'Tasks completed this week'
FROM tasks 
WHERE status = 'completed' AND updated_at >= CURRENT_DATE - INTERVAL '7 days'; 