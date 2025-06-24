-- =============================================
-- 데이터 관리 필수 테이블 생성 스크립트
-- =============================================

-- 1. 시스템 로그 테이블
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_level VARCHAR(20) NOT NULL, -- info, warning, error, debug
    log_category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    user_id UUID,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 백업 기록 테이블
CREATE TABLE IF NOT EXISTS backup_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(50) NOT NULL, -- full, table_specific
    file_size BIGINT,
    tables_included TEXT[],
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, failed
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT,
    error_message TEXT
);

-- 3. 데이터 내보내기 기록 테이블
CREATE TABLE IF NOT EXISTS export_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_name VARCHAR(255) NOT NULL,
    export_type VARCHAR(50) NOT NULL, -- csv, excel, json
    table_name VARCHAR(100),
    filter_conditions JSONB, -- 내보내기 필터 조건
    file_size BIGINT,
    record_count INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    created_by TEXT
);

-- 4. 데이터 가져오기 기록 테이블
CREATE TABLE IF NOT EXISTS import_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- csv, excel, json
    target_table VARCHAR(100) NOT NULL,
    file_size BIGINT,
    total_records INTEGER,
    processed_records INTEGER DEFAULT 0,
    success_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT
);

-- 5. 데이터베이스 통계 테이블
CREATE TABLE IF NOT EXISTS database_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_count BIGINT NOT NULL,
    table_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- RLS (Row Level Security) 정책 - 모든 사용자가 접근 가능하도록 간소화
-- =============================================

-- 시스템 로그 RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can access system logs" ON system_logs;
CREATE POLICY "Everyone can access system logs" ON system_logs FOR ALL USING (true);

-- 백업 기록 RLS
ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can access backup records" ON backup_records;
CREATE POLICY "Everyone can access backup records" ON backup_records FOR ALL USING (true);

-- 내보내기 기록 RLS
ALTER TABLE export_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can access export records" ON export_records;
CREATE POLICY "Everyone can access export records" ON export_records FOR ALL USING (true);

-- 가져오기 기록 RLS
ALTER TABLE import_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can access import records" ON import_records;
CREATE POLICY "Everyone can access import records" ON import_records FOR ALL USING (true);

-- 데이터베이스 통계 RLS
ALTER TABLE database_statistics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can access database statistics" ON database_statistics;
CREATE POLICY "Everyone can access database statistics" ON database_statistics FOR ALL USING (true); 