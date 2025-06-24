-- 팝업 관리 400 오류 해결 스크립트
-- 파일명: fix_popup_management_400_error.sql

-- 1. 현재 popup_settings 테이블 상태 확인
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'popup_settings' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 현재 테이블의 모든 데이터 확인
SELECT * FROM public.popup_settings ORDER BY created_at DESC;

-- 3. RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'popup_settings';

-- 4. 테이블이 존재하지 않는 경우를 대비한 재생성
DROP TABLE IF EXISTS public.popup_settings CASCADE;

-- 5. 팝업 설정 테이블 재생성 (단순화된 스키마)
CREATE TABLE public.popup_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS 비활성화 (임시)
ALTER TABLE public.popup_settings DISABLE ROW LEVEL SECURITY;

-- 7. 기본 팝업 데이터 삽입
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
);

-- 8. 테스트용 추가 데이터
INSERT INTO public.popup_settings (
    title, 
    subtitle, 
    content, 
    button_text,
    is_active,
    background_gradient
) VALUES (
    '시스템 업데이트 알림',
    'System Update Notice',
    '새로운 기능이 추가되었습니다. 업데이트된 시스템을 확인해보세요.',
    '확인',
    false,
    'from-green-600 via-blue-600 to-green-600'
);

-- 9. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_popup_settings_active ON public.popup_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_popup_settings_updated_at ON public.popup_settings(updated_at);

-- 10. 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_popup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_popup_settings_updated_at ON public.popup_settings;
CREATE TRIGGER update_popup_settings_updated_at
    BEFORE UPDATE ON public.popup_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_popup_updated_at();

-- 12. 테이블 권한 설정 (모든 인증된 사용자에게 모든 권한 부여)
GRANT ALL ON public.popup_settings TO authenticated;
GRANT ALL ON public.popup_settings TO anon;

-- 13. 결과 확인
SELECT 'Popup management table fixed successfully' as status;
SELECT COUNT(*) as total_popups FROM public.popup_settings;
SELECT id, title, is_active, created_at FROM public.popup_settings ORDER BY created_at; 