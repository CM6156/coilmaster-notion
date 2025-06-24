-- system_settings 테이블 수정 스크립트

-- 1. 테이블 존재 여부 확인 및 수정
DO $$
BEGIN
  -- 테이블이 존재하는지 확인
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
    -- setting_type 컬럼이 없는 경우 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'system_settings' AND column_name = 'setting_type') THEN
      ALTER TABLE system_settings ADD COLUMN setting_type VARCHAR(50) DEFAULT 'string';
    END IF;
  ELSE
    -- 테이블이 없으면 새로 생성
    CREATE TABLE system_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT,
      setting_type VARCHAR(50) DEFAULT 'string',
      description TEXT,
      is_public BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- 기본 설정 추가
    INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
    ('app_name', 'Coilmaster Notion', 'string', '애플리케이션 이름', true),
    ('app_version', '1.0.0', 'string', '애플리케이션 버전', true),
    ('default_language', 'ko', 'string', '기본 언어', true),
    ('timezone', 'Asia/Seoul', 'string', '기본 시간대', true);
  END IF;
END $$; 