-- 사용자 온라인 상태 추적을 위한 컬럼 추가
-- users 테이블에 온라인 상태 추적 컬럼들 추가

-- last_seen 컬럼 추가 (마지막 활동 시간)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- current_page 컬럼 추가 (현재 보고 있는 페이지)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS current_page TEXT;

-- status 컬럼 추가 (온라인 상태: online, offline, away, busy)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'busy'));

-- avatar 컬럼 추가 (프로필 이미지 URL)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar TEXT;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_status_last_seen ON users(status, last_seen);

-- 온라인 사용자 조회를 위한 함수 생성
CREATE OR REPLACE FUNCTION get_online_users(minutes_threshold INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  name TEXT,
  avatar TEXT,
  last_seen TIMESTAMPTZ,
  current_page TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.avatar,
    u.last_seen,
    u.current_page,
    u.status
  FROM users u
  WHERE 
    u.status = 'online' 
    AND u.last_seen >= NOW() - INTERVAL '1 minute' * minutes_threshold
  ORDER BY u.last_seen DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 활동 상태 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_activity(
  user_id UUID,
  page_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    last_seen = NOW(),
    current_page = COALESCE(page_name, current_page),
    status = 'online'
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 오프라인 상태 변경 함수
CREATE OR REPLACE FUNCTION set_user_offline(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    status = 'offline',
    last_seen = NOW(),
    current_page = NULL
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 자동으로 비활성 사용자를 오프라인으로 변경하는 함수
CREATE OR REPLACE FUNCTION cleanup_inactive_users()
RETURNS VOID AS $$
BEGIN
  -- 10분 이상 비활성 사용자를 오프라인으로 변경
  UPDATE users 
  SET status = 'offline'
  WHERE 
    status = 'online' 
    AND last_seen < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 정기적으로 비활성 사용자 정리를 위한 cron job 설정 (pg_cron 확장이 필요)
-- SELECT cron.schedule('cleanup-inactive-users', '*/5 * * * *', 'SELECT cleanup_inactive_users();');

-- RLS (Row Level Security) 정책 설정
-- 기존 정책이 있으면 삭제하고 새로 생성
DROP POLICY IF EXISTS "Users can update own activity" ON users;
DROP POLICY IF EXISTS "Users can view online status" ON users;

-- 사용자는 자신의 정보만 업데이트할 수 있음
CREATE POLICY "Users can update own activity" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 모든 사용자는 다른 사용자의 온라인 상태를 볼 수 있음 (프라이버시에 따라 조정 가능)
CREATE POLICY "Users can view online status" ON users
  FOR SELECT USING (true);

-- 기존 사용자들의 last_seen을 현재 시간으로 초기화
UPDATE users 
SET last_seen = NOW() 
WHERE last_seen IS NULL;

COMMENT ON COLUMN users.last_seen IS '사용자의 마지막 활동 시간';
COMMENT ON COLUMN users.current_page IS '사용자가 현재 보고 있는 페이지';
COMMENT ON COLUMN users.status IS '사용자의 온라인 상태 (online, offline, away, busy)';
COMMENT ON COLUMN users.avatar IS '사용자 프로필 이미지 URL';

COMMENT ON FUNCTION get_online_users(INTEGER) IS '지정된 시간(분) 내에 활동한 온라인 사용자 목록 조회';
COMMENT ON FUNCTION update_user_activity(UUID, TEXT) IS '사용자 활동 상태 업데이트';
COMMENT ON FUNCTION set_user_offline(UUID) IS '사용자를 오프라인 상태로 변경';
COMMENT ON FUNCTION cleanup_inactive_users() IS '비활성 사용자를 자동으로 오프라인으로 변경'; 