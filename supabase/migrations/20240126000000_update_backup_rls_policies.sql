-- 백업 기록 RLS 정책 업데이트
-- 사용자가 자신의 백업을 생성할 수 있도록 허용

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admin can manage backups" ON backup_records;
DROP POLICY IF EXISTS "Users can manage their backups" ON backup_records;
DROP POLICY IF EXISTS "Admin can view all backups" ON backup_records;
DROP POLICY IF EXISTS "Admin can manage all backups" ON backup_records;

-- 사용자가 자신의 백업을 생성하고 관리할 수 있는 정책
CREATE POLICY "Users can manage their backups" ON backup_records
    FOR ALL USING (created_by = auth.uid());

-- 관리자는 모든 백업을 볼 수 있는 정책  
CREATE POLICY "Admin can view all backups" ON backup_records
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 관리자는 모든 백업을 관리할 수 있는 정책
CREATE POLICY "Admin can manage all backups" ON backup_records
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 동일한 정책을 다른 관련 테이블에도 적용

-- 복원 기록 RLS 업데이트
DROP POLICY IF EXISTS "Admin can manage restores" ON restore_records;
DROP POLICY IF EXISTS "Users can manage their restores" ON restore_records;
DROP POLICY IF EXISTS "Admin can view all restores" ON restore_records;

CREATE POLICY "Users can manage their restores" ON restore_records
    FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Admin can view all restores" ON restore_records
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage all restores" ON restore_records
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 시스템 로그 RLS 업데이트
DROP POLICY IF EXISTS "Admin can manage logs" ON system_logs;
DROP POLICY IF EXISTS "Users can view their logs" ON system_logs;
DROP POLICY IF EXISTS "Admin can view all logs" ON system_logs;

CREATE POLICY "Users can view their logs" ON system_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view all logs" ON system_logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage all logs" ON system_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 시스템 로그 생성 정책 (모든 인증된 사용자가 로그를 생성할 수 있음)
CREATE POLICY "Authenticated users can create logs" ON system_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); 