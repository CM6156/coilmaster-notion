-- =============================================
-- Fix System Settings Table Structure
-- =============================================

-- 기존 system_settings 테이블이 있다면 안전하게 처리
DO $$
BEGIN
    -- 기존 테이블이 존재하는지 확인
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
        -- 기존 데이터 백업
        CREATE TEMP TABLE temp_system_settings AS SELECT * FROM system_settings;
        
        -- 기존 테이블 삭제
        DROP TABLE system_settings CASCADE;
    END IF;
END $$;

-- 새로운 system_settings 테이블 생성
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

-- 기본 데이터 삽입
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('app_name', 'Coilmaster Notion', 'string', '애플리케이션 이름', true),
('app_version', '1.0.0', 'string', '애플리케이션 버전', true),
('default_language', 'ko', 'string', '기본 언어', true),
('timezone', 'Asia/Seoul', 'string', '기본 시간대', true),
('max_file_size', '10485760', 'number', '최대 파일 크기 (바이트)', false),
('session_timeout', '3600', 'number', '세션 타임아웃 (초)', false),
('backup_retention_days', '30', 'number', '백업 보관 기간 (일)', false),
('log_retention_days', '90', 'number', '로그 보관 기간 (일)', false),
('maintenance_mode', 'false', 'boolean', '유지보수 모드', false),
('registration_enabled', 'true', 'boolean', '회원가입 허용', false);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_system_settings_setting_key ON system_settings(setting_key);

-- 업데이트 시간 자동 갱신 함수 (이미 존재할 수 있으므로 OR REPLACE 사용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책 설정
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage system settings" ON system_settings;
DROP POLICY IF EXISTS "Users can view public settings" ON system_settings;

CREATE POLICY "Admin can manage system settings" ON system_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view public settings" ON system_settings
    FOR SELECT USING (is_public = true);

-- 다른 필요한 테이블들도 안전하게 생성
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_level VARCHAR(20) NOT NULL,
    log_category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backup_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(50) NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    tables_included TEXT[],
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS export_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_name VARCHAR(255) NOT NULL,
    export_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    filter_conditions JSONB,
    file_path TEXT,
    file_size BIGINT,
    record_count INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    download_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS import_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    total_records INTEGER,
    processed_records INTEGER DEFAULT 0,
    success_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    error_log JSONB,
    mapping_config JSONB
);

CREATE TABLE IF NOT EXISTS database_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_count BIGINT NOT NULL,
    table_size_bytes BIGINT,
    index_size_bytes BIGINT,
    last_vacuum TIMESTAMP WITH TIME ZONE,
    last_analyze TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책들
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_statistics ENABLE ROW LEVEL SECURITY;

-- 시스템 로그 정책
DROP POLICY IF EXISTS "Admin can view all logs" ON system_logs;
DROP POLICY IF EXISTS "Users can view their own logs" ON system_logs;
DROP POLICY IF EXISTS "Admin can insert logs" ON system_logs;
DROP POLICY IF EXISTS "Users can insert logs" ON system_logs;

CREATE POLICY "Admin can view all logs" ON system_logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Users can view their own logs" ON system_logs
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin can insert logs" ON system_logs
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Users can insert logs" ON system_logs
    FOR INSERT WITH CHECK (true); -- 모든 사용자가 로그를 생성할 수 있음

-- 백업 기록 정책
DROP POLICY IF EXISTS "Admin can manage backups" ON backup_records;
DROP POLICY IF EXISTS "Users can manage their backups" ON backup_records;
DROP POLICY IF EXISTS "Admin can view all backups" ON backup_records;

-- 사용자가 자신의 백업을 생성하고 관리할 수 있는 정책
CREATE POLICY "Users can manage their backups" ON backup_records
    FOR ALL USING (created_by = auth.uid());

-- 관리자는 모든 백업을 볼 수 있는 정책  
CREATE POLICY "Admin can view all backups" ON backup_records
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 관리자는 모든 백업을 관리할 수 있는 정책
CREATE POLICY "Admin can manage all backups" ON backup_records
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 내보내기 기록 정책
DROP POLICY IF EXISTS "Users can manage their exports" ON export_records;
DROP POLICY IF EXISTS "Admin can view all exports" ON export_records;
CREATE POLICY "Users can manage their exports" ON export_records
    FOR ALL USING (created_by = auth.uid());
CREATE POLICY "Admin can view all exports" ON export_records
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 가져오기 기록 정책
DROP POLICY IF EXISTS "Users can manage their imports" ON import_records;
DROP POLICY IF EXISTS "Admin can view all imports" ON import_records;
CREATE POLICY "Users can manage their imports" ON import_records
    FOR ALL USING (created_by = auth.uid());
CREATE POLICY "Admin can view all imports" ON import_records
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 데이터베이스 통계 정책
DROP POLICY IF EXISTS "Admin can view database statistics" ON database_statistics;
CREATE POLICY "Admin can view database statistics" ON database_statistics
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 인덱스들
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(log_category);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_backup_records_created_at ON backup_records(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_records_status ON backup_records(status);

CREATE INDEX IF NOT EXISTS idx_export_records_created_at ON export_records(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_records_created_by ON export_records(created_by);

CREATE INDEX IF NOT EXISTS idx_import_records_created_at ON import_records(started_at DESC);

-- Mock 데이터베이스 통계 삽입
INSERT INTO database_statistics (table_name, record_count, table_size_bytes) VALUES
('users', 0, 0),
('projects', 0, 0),
('tasks', 0, 0),
('clients', 0, 0),
('system_logs', 0, 0),
('backup_records', 0, 0),
('export_records', 0, 0),
('import_records', 0, 0)
ON CONFLICT DO NOTHING; 