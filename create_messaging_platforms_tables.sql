-- 메시징 플랫폼 통합 관리를 위한 테이블 생성
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- =============================================
-- 1. LINE 설정 테이블 생성
-- =============================================
CREATE TABLE IF NOT EXISTS public.line_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_access_token TEXT,
    channel_secret TEXT,
    is_active BOOLEAN DEFAULT false,
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. LINE 사용자 테이블 생성
-- =============================================
CREATE TABLE IF NOT EXISTS public.line_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    line_user_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    picture_url TEXT,
    status_message TEXT,
    language VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    matched_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    matched_user_name VARCHAR(255),
    last_interaction TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. WeChat 설정 테이블 생성
-- =============================================
CREATE TABLE IF NOT EXISTS public.wechat_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_id VARCHAR(255),
    app_secret TEXT,
    token TEXT,
    encoding_aes_key TEXT,
    is_active BOOLEAN DEFAULT false,
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. WeChat 사용자 테이블 생성
-- =============================================
CREATE TABLE IF NOT EXISTS public.wechat_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    openid VARCHAR(255) UNIQUE NOT NULL,
    unionid VARCHAR(255),
    nickname VARCHAR(255),
    sex INTEGER,
    province VARCHAR(100),
    city VARCHAR(100),
    country VARCHAR(100),
    headimgurl TEXT,
    language VARCHAR(10),
    subscribe BOOLEAN DEFAULT true,
    subscribe_time TIMESTAMP WITH TIME ZONE,
    remark VARCHAR(255),
    groupid INTEGER,
    tagid_list INTEGER[],
    is_active BOOLEAN DEFAULT true,
    matched_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    matched_user_name VARCHAR(255),
    last_interaction TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. 통합 메시지 로그 테이블 생성
-- =============================================
CREATE TABLE IF NOT EXISTS public.messaging_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('telegram', 'line', 'wechat')),
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    message_type VARCHAR(50),
    message_content TEXT,
    status VARCHAR(50) DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. 인덱스 생성
-- =============================================
CREATE INDEX IF NOT EXISTS idx_line_users_matched_user_id ON public.line_users(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_line_users_line_user_id ON public.line_users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_line_users_display_name ON public.line_users(display_name);

CREATE INDEX IF NOT EXISTS idx_wechat_users_matched_user_id ON public.wechat_users(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_wechat_users_openid ON public.wechat_users(openid);
CREATE INDEX IF NOT EXISTS idx_wechat_users_nickname ON public.wechat_users(nickname);

CREATE INDEX IF NOT EXISTS idx_messaging_logs_platform ON public.messaging_logs(platform);
CREATE INDEX IF NOT EXISTS idx_messaging_logs_created_at ON public.messaging_logs(created_at);

-- =============================================
-- 7. RLS 정책 설정
-- =============================================
ALTER TABLE public.line_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wechat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wechat_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_logs ENABLE ROW LEVEL SECURITY;

-- LINE 설정 정책
CREATE POLICY "Allow authenticated users to view line_settings" 
ON public.line_settings FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to manage line_settings" 
ON public.line_settings FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- LINE 사용자 정책
CREATE POLICY "Allow authenticated users to view line_users" 
ON public.line_users FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to manage line_users" 
ON public.line_users FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- WeChat 설정 정책
CREATE POLICY "Allow authenticated users to view wechat_settings" 
ON public.wechat_settings FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to manage wechat_settings" 
ON public.wechat_settings FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- WeChat 사용자 정책
CREATE POLICY "Allow authenticated users to view wechat_users" 
ON public.wechat_users FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to manage wechat_users" 
ON public.wechat_users FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 메시징 로그 정책
CREATE POLICY "Allow authenticated users to view messaging_logs" 
ON public.messaging_logs FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to create messaging_logs" 
ON public.messaging_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- =============================================
-- 8. 트리거 함수 생성 (업데이트 시간 자동 갱신)
-- =============================================
CREATE OR REPLACE FUNCTION update_messaging_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_line_settings_updated_at
    BEFORE UPDATE ON public.line_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_messaging_updated_at();

CREATE TRIGGER update_line_users_updated_at
    BEFORE UPDATE ON public.line_users
    FOR EACH ROW
    EXECUTE FUNCTION update_messaging_updated_at();

CREATE TRIGGER update_wechat_settings_updated_at
    BEFORE UPDATE ON public.wechat_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_messaging_updated_at();

CREATE TRIGGER update_wechat_users_updated_at
    BEFORE UPDATE ON public.wechat_users
    FOR EACH ROW
    EXECUTE FUNCTION update_messaging_updated_at();

-- =============================================
-- 9. 자동 매칭 함수 생성
-- =============================================
CREATE OR REPLACE FUNCTION auto_match_messaging_user(
    p_platform VARCHAR,
    p_user_name VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_matched_user_id UUID;
BEGIN
    -- users 테이블에서 이름으로 매칭
    SELECT id INTO v_matched_user_id
    FROM public.users
    WHERE LOWER(name) = LOWER(p_user_name)
    LIMIT 1;
    
    -- managers 테이블에서도 확인
    IF v_matched_user_id IS NULL THEN
        SELECT id INTO v_matched_user_id
        FROM public.managers
        WHERE LOWER(name) = LOWER(p_user_name)
        LIMIT 1;
    END IF;
    
    RETURN v_matched_user_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 10. 완료 메시지
-- =============================================
SELECT '✅ 메시징 플랫폼 테이블 생성 완료!' as message; 