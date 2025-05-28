-- 팝업창 관리 시스템 생성 (단계별)
-- 파일명: 016_create_popup_system.sql

-- 1단계: 기존 함수 삭제 (존재하는 경우에만)
DROP FUNCTION IF EXISTS public.get_active_popup();
DROP FUNCTION IF EXISTS get_active_popup();

-- 2단계: 팝업창 설정 테이블 생성
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

-- 3단계: 팝업창 표시 로그 테이블 생성
CREATE TABLE IF NOT EXISTS public.popup_display_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    popup_id UUID REFERENCES public.popup_settings(id) ON DELETE CASCADE,
    user_id UUID,
    displayed_at TIMESTAMPTZ DEFAULT NOW(),
    action VARCHAR(50), -- 'shown', 'closed', 'dont_show_today'
    session_id VARCHAR(255)
);

-- 4단계: RLS 활성화
ALTER TABLE public.popup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_display_logs ENABLE ROW LEVEL SECURITY;

-- 5단계: 기존 정책 삭제 (테이블이 존재하는 경우에만)
DO $$
BEGIN
    -- popup_settings 정책 삭제
    DROP POLICY IF EXISTS "Everyone can view active popups" ON public.popup_settings;
    DROP POLICY IF EXISTS "Admins can manage all popups" ON public.popup_settings;
    DROP POLICY IF EXISTS "Admins can manage popups" ON public.popup_settings;
    DROP POLICY IF EXISTS "popup_settings_select_policy" ON public.popup_settings;
    DROP POLICY IF EXISTS "popup_settings_insert_policy" ON public.popup_settings;
    DROP POLICY IF EXISTS "popup_settings_update_policy" ON public.popup_settings;
    DROP POLICY IF EXISTS "popup_settings_delete_policy" ON public.popup_settings;
    
    -- popup_display_logs 정책 삭제
    DROP POLICY IF EXISTS "Users can manage their own logs" ON public.popup_display_logs;
    DROP POLICY IF EXISTS "Users can view their own logs" ON public.popup_display_logs;
    DROP POLICY IF EXISTS "Users can insert their own logs" ON public.popup_display_logs;
    DROP POLICY IF EXISTS "popup_logs_select_policy" ON public.popup_display_logs;
    DROP POLICY IF EXISTS "popup_logs_insert_policy" ON public.popup_display_logs;
    DROP POLICY IF EXISTS "popup_logs_update_policy" ON public.popup_display_logs;
    DROP POLICY IF EXISTS "popup_logs_delete_policy" ON public.popup_display_logs;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some policies may not exist, continuing...';
END $$;

-- 6단계: 새로운 정책 생성
CREATE POLICY "popup_settings_select_policy" ON public.popup_settings
    FOR SELECT USING (true);

CREATE POLICY "popup_settings_insert_policy" ON public.popup_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "popup_settings_update_policy" ON public.popup_settings
    FOR UPDATE USING (true);

CREATE POLICY "popup_settings_delete_policy" ON public.popup_settings
    FOR DELETE USING (true);

CREATE POLICY "popup_logs_select_policy" ON public.popup_display_logs
    FOR SELECT USING (true);

CREATE POLICY "popup_logs_insert_policy" ON public.popup_display_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "popup_logs_update_policy" ON public.popup_display_logs
    FOR UPDATE USING (true);

CREATE POLICY "popup_logs_delete_policy" ON public.popup_display_logs
    FOR DELETE USING (true);

-- 7단계: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_popup_settings_active ON public.popup_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_popup_settings_updated_at ON public.popup_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_popup_display_logs_user_popup ON public.popup_display_logs(user_id, popup_id);
CREATE INDEX IF NOT EXISTS idx_popup_display_logs_displayed_at ON public.popup_display_logs(displayed_at);

-- 8단계: 기본 팝업 데이터 삽입 (중복 방지)
INSERT INTO public.popup_settings (
    title, 
    subtitle, 
    content, 
    image_url, 
    image_alt,
    button_text,
    is_active,
    background_gradient
) 
SELECT 
    '회장님의 말씀',
    'CoilMaster Chairman''s Message',
    '혁신적인 기술로 글로벌 시장을 선도하며, 고객과 함께 성장하는 기업이 되겠습니다. 모든 임직원 여러분의 노고에 감사드리며, 함께 더 나은 미래를 만들어 나가겠습니다.',
    '/코일마스터_스티커디자인_0523_emb5.jpg',
    '코일마스터 스티커 디자인',
    '확인',
    true,
    'from-blue-600 via-purple-600 to-blue-600'
WHERE NOT EXISTS (
    SELECT 1 FROM public.popup_settings WHERE title = '회장님의 말씀'
);

-- 9단계: 활성 팝업 가져오기 함수 생성
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

-- 10단계: 팝업 표시 로그 기록 함수 생성
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

-- 11단계: 주석 추가
COMMENT ON TABLE public.popup_settings IS '팝업창 설정 관리 테이블';
COMMENT ON TABLE public.popup_display_logs IS '팝업창 표시 로그 테이블';
COMMENT ON COLUMN public.popup_settings.title IS '팝업 제목';
COMMENT ON COLUMN public.popup_settings.subtitle IS '팝업 부제목';
COMMENT ON COLUMN public.popup_settings.content IS '팝업 내용';
COMMENT ON COLUMN public.popup_settings.is_active IS '활성화 여부';
COMMENT ON COLUMN public.popup_settings.show_dont_show_today IS '오늘 하루 보지 않기 옵션 표시 여부';

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '팝업 관리 시스템이 성공적으로 생성되었습니다!';
    RAISE NOTICE '- popup_settings 테이블: 팝업 설정 관리';
    RAISE NOTICE '- popup_display_logs 테이블: 팝업 표시 로그';
    RAISE NOTICE '- get_active_popup() 함수: 활성 팝업 조회';
    RAISE NOTICE '- log_popup_action() 함수: 팝업 액션 로그';
END $$; 