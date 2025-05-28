-- =============================================
-- 팝업창 관리 테이블
-- =============================================

-- 팝업창 설정 테이블
CREATE TABLE IF NOT EXISTS popup_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    content TEXT,
    image_url TEXT,
    image_alt VARCHAR(255),
    button_text VARCHAR(100) DEFAULT '확인',
    is_active BOOLEAN DEFAULT true,
    show_dont_show_today BOOLEAN DEFAULT true,
    background_gradient VARCHAR(255) DEFAULT 'from-blue-600 via-purple-600 to-blue-600',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 팝업창 표시 로그 테이블
CREATE TABLE IF NOT EXISTS popup_display_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    popup_id UUID REFERENCES popup_settings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    displayed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action VARCHAR(50), -- 'shown', 'closed', 'dont_show_today'
    session_id VARCHAR(255)
);

-- RLS 정책 설정
ALTER TABLE popup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE popup_display_logs ENABLE ROW LEVEL SECURITY;

-- 팝업 설정 정책
CREATE POLICY "Everyone can view active popups" ON popup_settings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage popups" ON popup_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@coilmaster.com', 'CM6156@naver.com')
        )
    );

-- 팝업 로그 정책
CREATE POLICY "Users can view their own logs" ON popup_display_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own logs" ON popup_display_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all logs" ON popup_display_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@coilmaster.com', 'CM6156@naver.com')
        )
    );

-- 기본 팝업 데이터 삽입
INSERT INTO popup_settings (
    title, 
    subtitle, 
    content, 
    image_url, 
    image_alt,
    button_text,
    is_active
) VALUES (
    '회장님의 말씀',
    'CoilMaster Chairman''s Message',
    '혁신적인 기술로 글로벌 시장을 선도하며, 고객과 함께 성장하는 기업이 되겠습니다.',
    '/코일마스터_스티커디자인_0523_emb5.jpg',
    '코일마스터 스티커 디자인',
    '확인',
    true
) ON CONFLICT DO NOTHING;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_popup_settings_active ON popup_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_popup_display_logs_user_popup ON popup_display_logs(user_id, popup_id);
CREATE INDEX IF NOT EXISTS idx_popup_display_logs_displayed_at ON popup_display_logs(displayed_at);

-- 함수: 활성 팝업 가져오기
CREATE OR REPLACE FUNCTION get_active_popup()
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    content TEXT,
    image_url TEXT,
    image_alt VARCHAR(255),
    button_text VARCHAR(100),
    background_gradient VARCHAR(255)
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        ps.id,
        ps.title,
        ps.subtitle,
        ps.content,
        ps.image_url,
        ps.image_alt,
        ps.button_text,
        ps.background_gradient
    FROM popup_settings ps
    WHERE ps.is_active = true
    ORDER BY ps.updated_at DESC
    LIMIT 1;
$$;

-- 함수: 팝업 표시 로그 기록
CREATE OR REPLACE FUNCTION log_popup_action(
    popup_uuid UUID,
    action_type VARCHAR(50),
    session_uuid VARCHAR(255) DEFAULT NULL
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
    INSERT INTO popup_display_logs (popup_id, user_id, action, session_id)
    VALUES (popup_uuid, auth.uid(), action_type, session_uuid);
$$;

-- 팝업 이미지 저장을 위한 스토리지 버킷 생성 (필요시)
-- 이 부분은 Supabase 콘솔에서 수동으로 생성하거나 별도의 스크립트로 실행
-- INSERT INTO storage.buckets (id, name, public) VALUES ('popups', 'popups', true);

-- 스토리지 정책 (버킷이 생성된 후 실행)
-- CREATE POLICY "Give users access to popup images" ON storage.objects FOR SELECT USING (bucket_id = 'popups');
-- CREATE POLICY "Allow authenticated users to upload popup images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'popups' AND auth.role() = 'authenticated'); 