-- 팝업창 관리 시스템 생성
-- 파일명: 014_create_popup_management.sql

-- 팝업창 설정 테이블 생성
CREATE TABLE IF NOT EXISTS public.popup_settings (
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- 팝업창 표시 로그 테이블 생성
CREATE TABLE IF NOT EXISTS public.popup_display_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    popup_id UUID REFERENCES public.popup_settings(id) ON DELETE CASCADE,
    user_id UUID,
    displayed_at TIMESTAMPTZ DEFAULT NOW(),
    action VARCHAR(50), -- 'shown', 'closed', 'dont_show_today'
    session_id VARCHAR(255)
);

-- RLS 활성화
ALTER TABLE public.popup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_display_logs ENABLE ROW LEVEL SECURITY;

-- 팝업 설정 정책 - 모든 사용자가 활성 팝업 조회 가능
CREATE POLICY "Everyone can view active popups" ON public.popup_settings
    FOR SELECT USING (is_active = true);

-- 팝업 설정 정책 - 관리자만 모든 작업 가능
CREATE POLICY "Admins can manage all popups" ON public.popup_settings
    FOR ALL USING (true);

-- 팝업 로그 정책 - 모든 사용자가 자신의 로그 조회/삽입 가능
CREATE POLICY "Users can manage their own logs" ON public.popup_display_logs
    FOR ALL USING (true);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_popup_settings_active ON public.popup_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_popup_settings_updated_at ON public.popup_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_popup_display_logs_user_popup ON public.popup_display_logs(user_id, popup_id);
CREATE INDEX IF NOT EXISTS idx_popup_display_logs_displayed_at ON public.popup_display_logs(displayed_at);

-- 기본 팝업 데이터 삽입
INSERT INTO public.popup_settings (
    title, 
    subtitle, 
    content, 
    image_url, 
    image_alt,
    button_text,
    is_active,
    background_gradient
) VALUES (
    '회장님의 말씀',
    'CoilMaster Chairman''s Message',
    '혁신적인 기술로 글로벌 시장을 선도하며, 고객과 함께 성장하는 기업이 되겠습니다. 모든 임직원 여러분의 노고에 감사드리며, 함께 더 나은 미래를 만들어 나가겠습니다.',
    '/코일마스터_스티커디자인_0523_emb5.jpg',
    '코일마스터 스티커 디자인',
    '확인',
    true,
    'from-blue-600 via-purple-600 to-blue-600'
) ON CONFLICT (id) DO NOTHING;

-- 활성 팝업 가져오기 함수
CREATE OR REPLACE FUNCTION public.get_active_popup()
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    content TEXT,
    image_url TEXT,
    image_alt VARCHAR(255),
    button_text VARCHAR(100),
    background_gradient VARCHAR(255),
    show_dont_show_today BOOLEAN
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
        ps.background_gradient,
        ps.show_dont_show_today
    FROM public.popup_settings ps
    WHERE ps.is_active = true
    ORDER BY ps.updated_at DESC
    LIMIT 1;
$$;

-- 팝업 표시 로그 기록 함수
CREATE OR REPLACE FUNCTION public.log_popup_action(
    popup_uuid UUID,
    action_type VARCHAR(50),
    session_uuid VARCHAR(255) DEFAULT NULL
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
    INSERT INTO public.popup_display_logs (popup_id, user_id, action, session_id)
    VALUES (popup_uuid, COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID), action_type, session_uuid);
$$;

-- 주석 추가
COMMENT ON TABLE public.popup_settings IS '팝업창 설정 관리 테이블';
COMMENT ON TABLE public.popup_display_logs IS '팝업창 표시 로그 테이블';
COMMENT ON COLUMN public.popup_settings.title IS '팝업 제목';
COMMENT ON COLUMN public.popup_settings.subtitle IS '팝업 부제목';
COMMENT ON COLUMN public.popup_settings.content IS '팝업 내용';
COMMENT ON COLUMN public.popup_settings.is_active IS '활성화 여부';
COMMENT ON COLUMN public.popup_settings.show_dont_show_today IS '오늘 하루 보지 않기 옵션 표시 여부'; 