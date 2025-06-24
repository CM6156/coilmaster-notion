-- system_settings 테이블의 setting_key 열에 UNIQUE 제약 조건 추가

-- 먼저 테이블이 존재하는지 확인
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
    -- setting_key 열에 이미 UNIQUE 제약 조건이 있는지 확인
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'system_settings' 
        AND tc.constraint_type = 'UNIQUE' 
        AND ccu.column_name = 'setting_key'
    ) THEN
      -- UNIQUE 제약 조건 추가
      ALTER TABLE system_settings ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);
    END IF;
  ELSE
    -- 테이블이 없으면 새로 생성 (UNIQUE 제약 조건 포함)
    CREATE TABLE system_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      setting_key VARCHAR(100) UNIQUE NOT NULL,  -- UNIQUE 제약 조건 추가
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