-- =============================================
-- 사용자 활동 추적 테이블
-- =============================================

-- 사용자 활동 테이블
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    current_page VARCHAR(100) NOT NULL,
    current_tab VARCHAR(100),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT true,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 유니크 제약조건: 한 사용자는 하나의 활성 세션만 가질 수 있음
    UNIQUE(user_id)
);

-- RLS 정책 설정
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 활동만 볼 수 있음
CREATE POLICY "Users can view their own activity" ON user_activities
    FOR SELECT USING (user_id = auth.uid());

-- 사용자는 자신의 활동을 생성/업데이트할 수 있음
CREATE POLICY "Users can manage their own activity" ON user_activities
    FOR ALL USING (user_id = auth.uid());

-- 관리자는 모든 활동을 볼 수 있음
CREATE POLICY "Admins can view all activities" ON user_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@coilmaster.com', 'CM6156@naver.com')
        )
    );

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_last_activity ON user_activities(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_activities_is_online ON user_activities(is_online);
CREATE INDEX IF NOT EXISTS idx_user_activities_current_page ON user_activities(current_page);
CREATE INDEX IF NOT EXISTS idx_user_activities_current_tab ON user_activities(current_tab);

-- 함수: 온라인 사용자 목록 가져오기 - 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS get_online_users_with_activity();

CREATE FUNCTION get_online_users_with_activity()
RETURNS TABLE (
    user_id UUID,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    current_page VARCHAR(100),
    current_tab VARCHAR(100),
    last_activity TIMESTAMP WITH TIME ZONE,
    minutes_ago INTEGER
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        ua.user_id,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        ua.current_page,
        ua.current_tab,
        ua.last_activity,
        EXTRACT(EPOCH FROM (NOW() - ua.last_activity))::INTEGER / 60 as minutes_ago
    FROM user_activities ua
    JOIN users u ON ua.user_id = u.id
    WHERE ua.is_online = true
    AND ua.last_activity > NOW() - INTERVAL '5 minutes'
    ORDER BY ua.last_activity DESC;
$$;

-- 함수: 특정 페이지의 온라인 사용자 - 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS get_users_on_page(VARCHAR(100));

CREATE FUNCTION get_users_on_page(page_name VARCHAR(100))
RETURNS TABLE (
    user_id UUID,
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    last_activity TIMESTAMP WITH TIME ZONE,
    minutes_ago INTEGER
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        ua.user_id,
        u.name as user_name,
        u.role as user_role,
        ua.last_activity,
        EXTRACT(EPOCH FROM (NOW() - ua.last_activity))::INTEGER / 60 as minutes_ago
    FROM user_activities ua
    JOIN users u ON ua.user_id = u.id
    WHERE ua.is_online = true
    AND ua.current_page = page_name
    AND ua.last_activity > NOW() - INTERVAL '5 minutes'
    ORDER BY ua.last_activity DESC;
$$;

-- 함수: 특정 탭의 온라인 사용자 - 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS get_users_on_tab(VARCHAR(100));

CREATE FUNCTION get_users_on_tab(tab_name VARCHAR(100))
RETURNS TABLE (
    user_id UUID,
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    current_page VARCHAR(100),
    last_activity TIMESTAMP WITH TIME ZONE,
    minutes_ago INTEGER
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        ua.user_id,
        u.name as user_name,
        u.role as user_role,
        ua.current_page,
        ua.last_activity,
        EXTRACT(EPOCH FROM (NOW() - ua.last_activity))::INTEGER / 60 as minutes_ago
    FROM user_activities ua
    JOIN users u ON ua.user_id = u.id
    WHERE ua.is_online = true
    AND ua.current_tab = tab_name
    AND ua.last_activity > NOW() - INTERVAL '5 minutes'
    ORDER BY ua.last_activity DESC;
$$;

-- 함수: 비활성 사용자 정리 (5분 이상 비활성) - 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS cleanup_inactive_users();

CREATE FUNCTION cleanup_inactive_users()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
    UPDATE user_activities 
    SET is_online = false
    WHERE last_activity < NOW() - INTERVAL '5 minutes'
    AND is_online = true;
    
    SELECT COUNT(*)::INTEGER FROM user_activities 
    WHERE is_online = false AND last_activity < NOW() - INTERVAL '5 minutes';
$$;

-- 자동 정리를 위한 트리거 함수 - 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS update_user_activity_timestamp();

CREATE FUNCTION update_user_activity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 시 자동으로 updated_at 필드 갱신 - 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS update_user_activities_updated_at ON user_activities;

CREATE TRIGGER update_user_activities_updated_at
    BEFORE UPDATE ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_user_activity_timestamp(); 