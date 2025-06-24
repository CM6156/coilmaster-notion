-- system_settings 테이블 구조 수정

-- 기존 테이블 백업 및 재생성
DO $$
BEGIN
  -- 테이블이 존재하는지 확인
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
    -- 기존 데이터 백업
    CREATE TEMP TABLE temp_system_settings AS 
    SELECT * FROM system_settings;
    
    -- 기존 테이블 삭제
    DROP TABLE system_settings CASCADE;
    
    -- 올바른 구조로 테이블 재생성
    CREATE TABLE system_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key VARCHAR(100) NOT NULL,  -- 필수 열
      setting_key VARCHAR(100) NOT NULL,
      setting_value TEXT,
      setting_type VARCHAR(50) DEFAULT 'string',
      description TEXT,
      is_public BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- UNIQUE 제약 조건 추가
    ALTER TABLE system_settings ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);
    ALTER TABLE system_settings ADD CONSTRAINT system_settings_key_key UNIQUE (key);
    
    -- 백업 데이터 복원 시도
    -- 열 이름이 다를 경우 적절히 매핑
    BEGIN
      INSERT INTO system_settings (
        key, 
        setting_key, 
        setting_value, 
        setting_type, 
        description, 
        is_public, 
        created_at, 
        updated_at
      )
      SELECT 
        setting_key, -- key 열에 setting_key 값 사용
        setting_key, 
        setting_value, 
        COALESCE(setting_type, 'string'), 
        description, 
        COALESCE(is_public, false), 
        created_at, 
        updated_at
      FROM temp_system_settings;
    EXCEPTION WHEN OTHERS THEN
      -- 오류 발생 시 기본 데이터만 생성
      RAISE NOTICE 'Error restoring data: %', SQLERRM;
    END;
  ELSE
    -- 테이블이 없으면 새로 생성
    CREATE TABLE system_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key VARCHAR(100) NOT NULL,
      setting_key VARCHAR(100) NOT NULL,
      setting_value TEXT,
      setting_type VARCHAR(50) DEFAULT 'string',
      description TEXT,
      is_public BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- UNIQUE 제약 조건 추가
    ALTER TABLE system_settings ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);
    ALTER TABLE system_settings ADD CONSTRAINT system_settings_key_key UNIQUE (key);
  END IF;
  
  -- 기본 설정 데이터 추가 (중복 방지)
  INSERT INTO system_settings (key, setting_key, setting_value, setting_type, description, is_public)
  VALUES
    ('app_name', 'app_name', 'Coilmaster Notion', 'string', '애플리케이션 이름', true),
    ('app_version', 'app_version', '1.0.0', 'string', '애플리케이션 버전', true),
    ('default_language', 'default_language', 'ko', 'string', '기본 언어', true),
    ('timezone', 'timezone', 'Asia/Seoul', 'string', '기본 시간대', true)
  ON CONFLICT (key) DO NOTHING;
  
END $$; 