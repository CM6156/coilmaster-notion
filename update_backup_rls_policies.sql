-- =============================================
-- 백업 관련 RLS 정책 업데이트
-- Supabase 대시보드의 SQL Editor에서 실행하세요
-- =============================================

-- 백업 기록 RLS 정책 업데이트
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admin can manage backups" ON backup_records;
DROP POLICY IF EXISTS "Users can manage their backups" ON backup_records;
DROP POLICY IF EXISTS "Admin can view all backups" ON backup_records;
DROP POLICY IF EXISTS "Admin can manage all backups" ON backup_records;

-- 새로운 정책 생성
-- 1. 사용자가 자신의 백업을 생성하고 관리할 수 있는 정책
CREATE POLICY "Users can manage their backups" ON backup_records
    FOR ALL USING (created_by = auth.uid());

-- 2. 관리자는 모든 백업을 볼 수 있는 정책  
CREATE POLICY "Admin can view all backups" ON backup_records
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 3. 관리자는 모든 백업을 관리할 수 있는 정책
CREATE POLICY "Admin can manage all backups" ON backup_records
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================
-- 시스템 로그 RLS 정책 업데이트
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admin can manage logs" ON system_logs;
DROP POLICY IF EXISTS "Users can view their logs" ON system_logs;
DROP POLICY IF EXISTS "Admin can view all logs" ON system_logs;
DROP POLICY IF EXISTS "Authenticated users can create logs" ON system_logs;

-- 새로운 정책 생성
-- 1. 사용자가 자신의 로그를 볼 수 있는 정책
CREATE POLICY "Users can view their logs" ON system_logs
    FOR SELECT USING (user_id = auth.uid());

-- 2. 관리자는 모든 로그를 볼 수 있는 정책
CREATE POLICY "Admin can view all logs" ON system_logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 3. 관리자는 모든 로그를 관리할 수 있는 정책
CREATE POLICY "Admin can manage all logs" ON system_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 4. 모든 인증된 사용자가 로그를 생성할 수 있는 정책
CREATE POLICY "Authenticated users can create logs" ON system_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 데이터베이스 통계 RLS 정책 업데이트
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admin can view database statistics" ON database_statistics;
DROP POLICY IF EXISTS "Authenticated users can view database statistics" ON database_statistics;
DROP POLICY IF EXISTS "Admin can manage database statistics" ON database_statistics;

-- 새로운 정책 생성 (관리자만 접근 가능)
-- 1. 관리자만 데이터베이스 통계를 볼 수 있는 정책
CREATE POLICY "Admin can view database statistics" ON database_statistics
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 2. 관리자는 모든 데이터베이스 통계를 관리할 수 있는 정책
CREATE POLICY "Admin can manage database statistics" ON database_statistics
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================
-- 실제 데이터베이스 통계 생성
-- =============================================

-- 기존 Mock 데이터 삭제
DELETE FROM database_statistics;

-- 실제 데이터베이스 통계 삽입
INSERT INTO database_statistics (table_name, record_count, table_size_bytes) 
SELECT 
    table_name,
    COALESCE(
        (
            SELECT COUNT(*) 
            FROM information_schema.tables t2 
            WHERE t2.table_name = t.table_name 
            AND t2.table_schema = 'public'
        ), 0
    ) as record_count,
    COALESCE(pg_total_relation_size(quote_ident('public') || '.' || quote_ident(table_name)), 0) as table_size_bytes
FROM (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT LIKE 'sql_%'
    ORDER BY table_name
) t;

-- 각 테이블의 실제 레코드 수 업데이트
DO $$
DECLARE
    table_record RECORD;
    table_count BIGINT;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM database_statistics
    LOOP
        BEGIN
            -- 테이블이 존재하는지 확인하고 레코드 수 계산
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = table_record.table_name 
                AND table_schema = 'public'
            ) THEN
                EXECUTE format('SELECT COUNT(*) FROM %I', table_record.table_name) INTO table_count;
                
                UPDATE database_statistics 
                SET record_count = table_count 
                WHERE table_name = table_record.table_name;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- 오류 발생 시 0으로 설정
            UPDATE database_statistics 
            SET record_count = 0 
            WHERE table_name = table_record.table_name;
        END;
    END LOOP;
END $$;

-- =============================================
-- 복원 기록 RLS 정책 업데이트 (선택사항)
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admin can manage restores" ON restore_records;
DROP POLICY IF EXISTS "Users can manage their restores" ON restore_records;
DROP POLICY IF EXISTS "Admin can view all restores" ON restore_records;

-- 새로운 정책 생성
-- 1. 사용자가 자신의 복원을 관리할 수 있는 정책
CREATE POLICY "Users can manage their restores" ON restore_records
    FOR ALL USING (created_by = auth.uid());

-- 2. 관리자는 모든 복원을 볼 수 있는 정책
CREATE POLICY "Admin can view all restores" ON restore_records
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 3. 관리자는 모든 복원을 관리할 수 있는 정책
CREATE POLICY "Admin can manage all restores" ON restore_records
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================
-- 정책이 올바르게 적용되었는지 확인
-- =============================================

-- 백업 기록 정책 확인
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'backup_records';

-- 시스템 로그 정책 확인
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'system_logs';

-- 데이터베이스 통계 정책 확인
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'database_statistics';

-- 데이터베이스 통계 데이터 확인
SELECT table_name, record_count, table_size_bytes 
FROM database_statistics 
ORDER BY table_name;

-- =============================================
-- 시스템 설정 RLS 정책 업데이트
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admin can manage system settings" ON system_settings;
DROP POLICY IF EXISTS "Users can view public settings" ON system_settings;

-- 새로운 정책 생성
-- 1. 관리자는 모든 설정을 관리할 수 있음
CREATE POLICY "Admin can manage system settings" ON system_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 2. 모든 인증된 사용자는 공개 설정을 볼 수 있음
CREATE POLICY "Users can view public settings" ON system_settings
    FOR SELECT USING (is_public = true);

-- 3. 모든 인증된 사용자는 설정을 생성하고 업데이트할 수 있음
CREATE POLICY "Authenticated users can manage settings" ON system_settings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update settings" ON system_settings
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 4. 모든 인증된 사용자는 모든 설정을 읽을 수 있음 (설정 로드용)
CREATE POLICY "Authenticated users can read all settings" ON system_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================
-- 시스템 설정 초기 데이터 추가
-- =============================================

-- 기본 설정 데이터 삽입 (존재하지 않는 경우에만)
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('company_name', '(주)테크솔루션', 'string', '회사명', true),
('company_ceo', '김대표', 'string', '대표자명', true),
('business_number', '123-45-67890', 'string', '사업자등록번호', false),
('default_language', '한국어', 'string', '기본 언어', true),
('timezone', '아시아/서울 (GMT+9)', 'string', '시간대', true),
('date_format', 'YYYY-MM-DD', 'string', '날짜 형식', true),
('email_notification', '켜짐', 'string', '이메일 알림 설정', false),
('push_notification', '켜짐', 'string', '푸시 알림 설정', false),
('notification_time', '09:00', 'string', '알림 시간', false),
('password_policy', '강함', 'string', '비밀번호 정책', false),
('session_timeout', '3600', 'string', '세션 타임아웃', false),
('two_factor_auth', '비활성화', 'string', '2단계 인증', false)
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================
-- 완료 메시지
-- =============================================

SELECT 'RLS 정책이 성공적으로 업데이트되었습니다!' as message; 