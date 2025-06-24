-- popup_settings 테이블 생성
CREATE TABLE IF NOT EXISTS popup_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    is_active boolean DEFAULT true,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    target_roles text[] DEFAULT array['all'],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);

-- RLS 활성화
ALTER TABLE popup_settings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성화된 팝업을 볼 수 있도록 정책 생성
CREATE POLICY "Everyone can view active popups" ON popup_settings
    FOR SELECT 
    USING (is_active = true);

-- 관리자만 팝업을 관리할 수 있도록 정책 생성
CREATE POLICY "Admins can manage popups" ON popup_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_popup_settings_updated_at 
    BEFORE UPDATE ON popup_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입
INSERT INTO popup_settings (title, content, type, is_active, target_roles) VALUES
('시스템 업데이트 알림', '시스템이 성공적으로 업데이트되었습니다. 새로운 기능을 확인해보세요!', 'success', true, array['all']),
('LINE API 연동 완료', 'LINE API가 성공적으로 연동되었습니다. 이제 실제 메시지 발송이 가능합니다!', 'info', false, array['admin']);

-- 테이블 정보 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'popup_settings' 
ORDER BY ordinal_position; 