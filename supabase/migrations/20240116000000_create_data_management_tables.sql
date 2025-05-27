-- =============================================
-- Coilmaster Admin Data Management Tables
-- =============================================

-- 1. 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 시스템 로그 테이블
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_level VARCHAR(20) NOT NULL, -- info, warning, error, debug
    log_category VARCHAR(50) NOT NULL, -- auth, database, api, system
    message TEXT NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 데이터 백업 기록 테이블
CREATE TABLE IF NOT EXISTS backup_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(50) NOT NULL, -- full, incremental, table_specific
    file_path TEXT,
    file_size BIGINT,
    tables_included TEXT[], -- 백업에 포함된 테이블 목록
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, failed
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    error_message TEXT
);

-- 4. 데이터 복원 기록 테이블
CREATE TABLE IF NOT EXISTS restore_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id UUID REFERENCES backup_records(id),
    restore_name VARCHAR(255) NOT NULL,
    tables_restored TEXT[],
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, failed
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    error_message TEXT
);

-- 5. 데이터 내보내기 기록 테이블
CREATE TABLE IF NOT EXISTS export_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_name VARCHAR(255) NOT NULL,
    export_type VARCHAR(50) NOT NULL, -- csv, excel, json, pdf
    table_name VARCHAR(100),
    filter_conditions JSONB, -- 내보내기 필터 조건
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

-- 6. 데이터 가져오기 기록 테이블
CREATE TABLE IF NOT EXISTS import_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- csv, excel, json
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
    error_log JSONB, -- 오류 상세 로그
    mapping_config JSONB -- 컬럼 매핑 설정
);

-- 7. 데이터베이스 통계 테이블
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

-- 8. 시스템 알림 테이블
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type VARCHAR(50) NOT NULL, -- system, maintenance, security, update
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, error, critical
    target_users TEXT[], -- 특정 사용자 대상 (빈 배열이면 전체)
    target_roles TEXT[], -- 특정 역할 대상
    is_active BOOLEAN DEFAULT true,
    show_until TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 사용자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL, -- login, logout, create, update, delete, view
    resource_type VARCHAR(50), -- project, task, client, user
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 데이터 정리 작업 테이블
CREATE TABLE IF NOT EXISTS cleanup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- delete_old_logs, archive_completed_projects, cleanup_temp_files
    target_table VARCHAR(100),
    conditions JSONB, -- 정리 조건 (예: older_than_days)
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, running, completed, failed
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    records_affected INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    error_message TEXT
);

-- =============================================
-- 인덱스 생성
-- =============================================

-- 시스템 설정 인덱스
CREATE INDEX IF NOT EXISTS idx_system_settings_setting_key ON system_settings(setting_key);

-- 시스템 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(log_category);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- 백업/복원 기록 인덱스
CREATE INDEX IF NOT EXISTS idx_backup_records_created_at ON backup_records(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_records_status ON backup_records(status);
CREATE INDEX IF NOT EXISTS idx_restore_records_created_at ON restore_records(started_at DESC);

-- 내보내기/가져오기 기록 인덱스
CREATE INDEX IF NOT EXISTS idx_export_records_created_at ON export_records(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_records_created_by ON export_records(created_by);
CREATE INDEX IF NOT EXISTS idx_import_records_created_at ON import_records(started_at DESC);

-- 사용자 활동 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);

-- 시스템 알림 인덱스
CREATE INDEX IF NOT EXISTS idx_system_notifications_active ON system_notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_system_notifications_type ON system_notifications(notification_type);

-- =============================================
-- 트리거 함수 생성
-- =============================================

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 시스템 설정 업데이트 트리거
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 시스템 알림 업데이트 트리거
DROP TRIGGER IF EXISTS update_system_notifications_updated_at ON system_notifications;
CREATE TRIGGER update_system_notifications_updated_at 
    BEFORE UPDATE ON system_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

-- 시스템 설정 RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage system settings" ON system_settings;
DROP POLICY IF EXISTS "Users can view public settings" ON system_settings;

CREATE POLICY "Admin can manage system settings" ON system_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view public settings" ON system_settings
    FOR SELECT USING (is_public = true);

-- 시스템 로그 RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can view all logs" ON system_logs;
DROP POLICY IF EXISTS "Users can view their own logs" ON system_logs;

CREATE POLICY "Admin can view all logs" ON system_logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Users can view their own logs" ON system_logs
    FOR SELECT USING (user_id = auth.uid());

-- 백업 기록 RLS
ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can manage backups" ON backup_records;
CREATE POLICY "Admin can manage backups" ON backup_records
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 복원 기록 RLS
ALTER TABLE restore_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can manage restores" ON restore_records;
CREATE POLICY "Admin can manage restores" ON restore_records
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 내보내기 기록 RLS
ALTER TABLE export_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their exports" ON export_records;
DROP POLICY IF EXISTS "Admin can view all exports" ON export_records;
CREATE POLICY "Users can manage their exports" ON export_records
    FOR ALL USING (created_by = auth.uid());
CREATE POLICY "Admin can view all exports" ON export_records
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 가져오기 기록 RLS
ALTER TABLE import_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their imports" ON import_records;
DROP POLICY IF EXISTS "Admin can view all imports" ON import_records;
CREATE POLICY "Users can manage their imports" ON import_records
    FOR ALL USING (created_by = auth.uid());
CREATE POLICY "Admin can view all imports" ON import_records
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 데이터베이스 통계 RLS
ALTER TABLE database_statistics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can view database statistics" ON database_statistics;
CREATE POLICY "Admin can view database statistics" ON database_statistics
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 시스템 알림 RLS
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view active notifications" ON system_notifications;
DROP POLICY IF EXISTS "Admin can manage notifications" ON system_notifications;
CREATE POLICY "Users can view active notifications" ON system_notifications
    FOR SELECT USING (
        is_active = true AND 
        (show_until IS NULL OR show_until > NOW()) AND
        (target_users = '{}' OR auth.uid()::text = ANY(target_users))
    );
CREATE POLICY "Admin can manage notifications" ON system_notifications
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 사용자 활동 로그 RLS
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their activity" ON user_activity_logs;
DROP POLICY IF EXISTS "Admin can view all activity" ON user_activity_logs;
CREATE POLICY "Users can view their activity" ON user_activity_logs
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin can view all activity" ON user_activity_logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 정리 작업 RLS
ALTER TABLE cleanup_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can manage cleanup jobs" ON cleanup_jobs;
CREATE POLICY "Admin can manage cleanup jobs" ON cleanup_jobs
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================
-- 기본 데이터 삽입
-- =============================================

-- 기본 시스템 설정
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
('registration_enabled', 'true', 'boolean', '회원가입 허용', false)
ON CONFLICT (setting_key) DO NOTHING;

-- 기본 시스템 알림
INSERT INTO system_notifications (notification_type, title, message, severity, target_users, target_roles, is_active) VALUES
('system', '시스템 초기화 완료', 'Coilmaster Notion 시스템이 성공적으로 초기화되었습니다.', 'info', '{}', '{"admin"}', true),
('maintenance', '정기 점검 안내', '매주 일요일 새벽 2시에 정기 점검이 진행됩니다.', 'info', '{}', '{}', true)
ON CONFLICT DO NOTHING;

-- Mock 데이터베이스 통계
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

-- =============================================
-- 저장 프로시저
-- =============================================

-- 오래된 로그 정리 프로시저
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM system_logs 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO system_logs (log_level, log_category, message, details)
    VALUES ('info', 'system', 'Old logs cleanup completed', 
            jsonb_build_object('deleted_count', deleted_count, 'days_kept', days_to_keep));
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 데이터베이스 통계 업데이트 프로시저
CREATE OR REPLACE FUNCTION update_database_statistics()
RETURNS VOID AS $$
DECLARE
    table_record RECORD;
    table_count BIGINT;
    table_size BIGINT;
BEGIN
    -- 기존 통계 삭제
    DELETE FROM database_statistics;
    
    -- 각 테이블의 통계 수집
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            -- 테이블 레코드 수 계산
            EXECUTE format('SELECT COUNT(*) FROM %I.%I', table_record.schemaname, table_record.tablename) INTO table_count;
            
            -- 테이블 크기 계산
            SELECT pg_total_relation_size(quote_ident(table_record.schemaname) || '.' || quote_ident(table_record.tablename)) INTO table_size;
            
            INSERT INTO database_statistics (table_name, record_count, table_size_bytes)
            VALUES (table_record.tablename, table_count, table_size);
            
        EXCEPTION WHEN OTHERS THEN
            -- 오류 발생 시 로그 기록
            INSERT INTO system_logs (log_level, log_category, message, details)
            VALUES ('warning', 'system', 'Failed to collect statistics for table', 
                    jsonb_build_object('table_name', table_record.tablename, 'error', SQLERRM));
        END;
    END LOOP;
    
    INSERT INTO system_logs (log_level, log_category, message)
    VALUES ('info', 'system', 'Database statistics updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 