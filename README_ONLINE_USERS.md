# 온라인 사용자 추적 시스템 설정 가이드

## 개요
실시간 온라인 사용자 추적 기능을 위해 Supabase 데이터베이스에 필요한 컬럼과 함수를 추가해야 합니다.

## 1. Supabase 대시보드에서 SQL 실행

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 "SQL Editor" 클릭
4. 아래 SQL 코드를 복사하여 실행

## 2. 실행할 SQL 코드

```sql
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
```

## 3. 기능 설명

### 추가된 컬럼
- `last_seen`: 사용자의 마지막 활동 시간
- `current_page`: 사용자가 현재 보고 있는 페이지
- `status`: 온라인 상태 (online, offline, away, busy)
- `avatar`: 사용자 프로필 이미지 URL

### 추가된 함수
- `get_online_users(minutes_threshold)`: 지정된 시간 내에 활동한 온라인 사용자 조회
- `update_user_activity(user_id, page_name)`: 사용자 활동 상태 업데이트
- `set_user_offline(user_id)`: 사용자를 오프라인 상태로 변경
- `cleanup_inactive_users()`: 비활성 사용자를 자동으로 오프라인으로 변경

## 4. 작동 방식

1. **실시간 활동 추적**: 사용자가 페이지를 이동하거나 마우스/키보드 활동을 할 때마다 `last_seen`과 `current_page`가 업데이트됩니다.

2. **온라인 상태 표시**: 5분 이내에 활동한 사용자만 온라인으로 표시됩니다.

3. **자동 오프라인 처리**: 10분 이상 비활성 상태인 사용자는 자동으로 오프라인으로 변경됩니다.

4. **로그아웃 처리**: 사용자가 로그아웃하면 즉시 오프라인 상태로 변경됩니다.

## 5. 문제 해결

### SQL 실행 오류가 발생하는 경우
1. users 테이블이 존재하는지 확인
2. 필요한 권한이 있는지 확인
3. 각 SQL 문을 개별적으로 실행해보기

### 함수가 작동하지 않는 경우
- 코드는 함수가 없어도 작동하도록 fallback 로직이 구현되어 있습니다.
- 함수 없이도 기본적인 온라인 상태 추적이 가능합니다.

## 6. 선택사항: 자동 정리 작업

비활성 사용자를 자동으로 정리하려면 Supabase의 pg_cron 확장을 사용할 수 있습니다:

```sql
-- 5분마다 비활성 사용자 정리 (pg_cron 확장 필요)
SELECT cron.schedule('cleanup-inactive-users', '*/5 * * * *', 'SELECT cleanup_inactive_users();');
```

이 설정은 선택사항이며, 없어도 시스템이 정상 작동합니다. 